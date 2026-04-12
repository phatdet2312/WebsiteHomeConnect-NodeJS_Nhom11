//apps/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Dùng Windows Integrated Authentication (giống mssql/msnodesqlv8 + trustedConnection)
// Driver={SQL Server} là ODBC driver cơ bản, luôn có sẵn trên Windows
const server = process.env.DB_SERVER   || 'LAPTOP-S1U5MI7D\\SQLEXPRESS';
const dbName = process.env.DB_DATABASE || 'DemoWebHomeConnect';

// Sequelize chỉ forward dialectOptions.options vào Connection constructor
// → connectionString phải nằm trong options để sequelize-msnodesqlv8 nhận được
const connectionString =
  `Driver={SQL Server};Server=${server};Database=${dbName};Trusted_Connection=yes;`;

const sequelize = new Sequelize(dbName, null, null, {
  dialect: 'mssql',
  dialectModule: require('./mssqlDialect'),
  dialectOptions: {
    options: {
      connectionString,
      encrypt: false,
      trustServerCertificate: true,
      instanceName: server.split('\\')[1] || '',
    },
  },
  logging: false,
  pool: { max: 10, min: 0, acquire: 60000, idle: 10000 },
});

module.exports = sequelize;
