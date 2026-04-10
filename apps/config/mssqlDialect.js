'use strict';
/**
 * Patch sequelize-msnodesqlv8 để tương thích với Sequelize 6.
 *
 * Vấn đề 1: sequelize-msnodesqlv8 (Sequelize 4) thiếu STATE/state property → Sequelize 6 crash
 * Vấn đề 2: Request.execute() dùng `done && !hasError` guard nhưng 'done' event của
 *           msnodesqlv8 hiện đại fire SAU callback → callback của Sequelize không bao giờ được gọi
 *
 * Fix: patch cả Connection (STATE) và Request (execute logic đơn giản hơn)
 */
const EventEmitter = require('events').EventEmitter;
const mssql        = require('msnodesqlv8');
const { v4: uuidv4 } = require('uuid');

// ─── STATE mock để Sequelize 6 check ─────────────────────────────────────────
const STATE = {
  INITIALIZED: { name: 'Initialized' },
  CONNECTED:   { name: 'LoggedIn' },
};

// ─── Connection ───────────────────────────────────────────────────────────────
class Connection extends EventEmitter {
  constructor(config) {
    super();
    // Flatten options vào config (giống sequelize-msnodesqlv8 gốc)
    config = Object.assign({}, config, config.options);
    delete config.options;

    this.STATE = STATE;
    this.state = STATE.INITIALIZED;
    this.uuid  = uuidv4();
    this.config = config;
    this.connection = null;
    this.connectionCloseFunc = null;
    this.timer = null;
    this.requests = [];
    this._connectCalled = false;
  }

  get closed() {
    return this.connection === null || this.connection.close !== this.connectionCloseFunc;
  }
  get loggedIn() { return !this.closed; }

  connect() {
    if (this._connectCalled) return;
    this._connectCalled = true;
    mssql.open(this.config.connectionString, (err, conn) => {
      if (!err) {
        this.connection = conn;
        this.connectionCloseFunc = conn.close;
        this.state = STATE.CONNECTED;
        this.timer = setInterval(() => { if (this.closed) this._reset(); }, 5000);
      }
      this.emit('connect', err || null);
    });
  }

  _reset() {
    const error = new Error('connection reset by peer');
    error.code = 'ECONNRESET';
    this.emit('error', error);
  }

  close() {
    clearInterval(this.timer);
    this.timer = null;
    if (this.connection !== null) {
      this.connection.close((err) => {
        this.connection = null;
        this.emit('end', err);
      });
    } else {
      this.emit('end', new Error('connection already closed'));
    }
    this.requests.slice().forEach(r => this._removeRequest(r, new Error('connection closed')));
  }

  _removeRequest(request, error) {
    const idx = this.requests.indexOf(request);
    if (idx !== -1) {
      this.requests.splice(idx, 1);
      if (error && typeof request.callback === 'function') {
        request.callback(error);
      }
    }
  }

  execSql(request) { request.execute(this); }

  beginTransaction(callback, name, isoLevel) {
    const iso  = isoLevel ? `SET TRANSACTION ISOLATION LEVEL ${isoLevel};` : '';
    const txName = name ? `[${name}]` : '';
    const req = new Request(`${iso}BEGIN TRANSACTION ${txName};`, err => callback && callback(err));
    req.execute(this);
  }
  commitTransaction(callback) {
    const req = new Request('COMMIT TRANSACTION;', err => callback && callback(err));
    req.execute(this);
  }
  rollbackTransaction(callback, name) {
    name = name ? `[${name}]` : '';
    const req = new Request(`ROLLBACK TRANSACTION ${name};`, err => callback && callback(err));
    req.execute(this);
  }
  saveTransaction(callback, name) {
    if (!name) { callback(new Error('name required for transaction savepoint')); return; }
    const req = new Request(`SAVE TRANSACTION [${name}];`, err => callback && callback(err));
    req.execute(this);
  }
}
Connection.STATE = STATE;

// ─── Request ──────────────────────────────────────────────────────────────────
// Fix Request.execute: đừng dùng `done` guard — gọi callback ngay khi queryRaw hoàn thành
class Request extends EventEmitter {
  constructor(sql, callback) {
    super();
    this.uuid     = uuidv4();
    this.sql      = sql;
    this.callback = callback;
    this._params  = [];
  }

  addParameter(name, type, value) {
    // Nhúng param vào SQL bằng cách thay thế @name (đơn giản, đủ dùng cho Sequelize queries)
    this._params.push({ name, value });
  }

  _buildSql() {
    let sql = this.sql;
    for (const { name, value } of this._params) {
      const safe = value === null || value === undefined ? 'NULL'
        : typeof value === 'string' ? `'${value.replace(/'/g, "''")}'`
        : typeof value === 'boolean' ? (value ? '1' : '0')
        : value instanceof Date ? `'${value.toISOString()}'`
        : String(value);
      sql = sql.replace(new RegExp(`@${name}\\b`, 'g'), safe);
    }
    return sql;
  }

  execute(context) {
    const sql = this._buildSql();
    context.requests.push(this);
    try {
      // msnodesqlv8.queryRaw: row event = index (số nguyên), data thật ở callback res.rows
      context.connection.queryRaw(sql, (err, results) => {
        context._removeRequest(this, err || undefined);
        if (!err && results && results.rows) {
          // Emit row events theo format Sequelize 6 mong đợi
          for (const rowValues of results.rows) {
            const columns = rowValues.map((val, i) => ({
              metadata: {
                colName:  results.meta[i] ? results.meta[i].name     : `col${i}`,
                type:     { id: results.meta[i] ? results.meta[i].sqlType : 0 },
                nullable: results.meta[i] ? results.meta[i].nullable : true,
                size:     results.meta[i] ? results.meta[i].size      : null,
              },
              value: val,
            }));
            this.emit('row', columns);
          }
        }
        if (typeof this.callback === 'function') {
          this.callback(err || null, err ? undefined : (results && results.rows ? results.rows.length : 0));
        }
      });
    } catch (err) {
      context._removeRequest(this, err);
      context.close();
    }
  }
}

// TYPES stub — Sequelize gọi getSQLTypeFromJsType(value, connection.lib.TYPES)
// Chỉ cần tên đúng, addParameter() của chúng ta bỏ qua type thật sự
const TYPES = {
  NVarChar:  { id: 231, name: 'NVarChar' },
  VarChar:   { id: 167, name: 'VarChar' },
  Int:       { id: 56,  name: 'Int' },
  BigInt:    { id: 127, name: 'BigInt' },
  Numeric:   { id: 108, name: 'Numeric' },
  Bit:       { id: 104, name: 'Bit' },
  VarBinary: { id: 165, name: 'VarBinary' },
  DateTime:  { id: 61,  name: 'DateTime' },
  Float:     { id: 62,  name: 'Float' },
  UniqueIdentifier: { id: 36, name: 'UniqueIdentifier' },
};

// ISOLATION_LEVEL stub — dùng trong beginTransaction
const ISOLATION_LEVEL = {
  READ_UNCOMMITTED: 'READ UNCOMMITTED',
  READ_COMMITTED:   'READ COMMITTED',
  REPEATABLE_READ:  'REPEATABLE READ',
  SERIALIZABLE:     'SERIALIZABLE',
  SNAPSHOT:         'SNAPSHOT',
};

module.exports = { Connection, Request, TYPES, ISOLATION_LEVEL };
