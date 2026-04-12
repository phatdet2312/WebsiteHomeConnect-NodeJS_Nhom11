// apps/services/vnpayService.js
const crypto = require('crypto');
const moment = require('moment');
require('dotenv').config();

const config = {
  tmnCode:    process.env.VNPAY_TMN_CODE    || 'OPA6P0KX',
  hashSecret: process.env.VNPAY_HASH_SECRET || 'X0L0CHK5HUF44HU3SMK5KD3L1N3PFWOQ',
  url:        process.env.VNPAY_BASE_URL    || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  version:    '2.1.0',
  command:    'pay',
  locale:     'vn',
  currCode:   'VND',
};

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj).sort().forEach(k => { sorted[k] = obj[k]; });
  return sorted;
}

const createPaymentUrl = (req, { amount, orderInfo, orderType, txnRef, returnUrl }) => {
  const createDate = moment().format('YYYYMMDDHHmmss');
  let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  if (ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') ipAddr = '127.0.0.1';

  let params = {
    vnp_Version:   config.version,
    vnp_Command:   config.command,
    vnp_TmnCode:   config.tmnCode,
    vnp_Locale:    config.locale,
    vnp_CurrCode:  config.currCode,
    vnp_TxnRef:    txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: orderType || 'other',
    vnp_Amount:    amount * 100,
    vnp_ReturnUrl: returnUrl || (process.env.BASE_URL + '/payment/callback'),
    vnp_IpAddr:    ipAddr,
    vnp_CreateDate: createDate,
  };

  params = sortObject(params);
  const signData = new URLSearchParams(params).toString();
  const hmac = crypto.createHmac('sha512', config.hashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  params['vnp_SecureHash'] = signed;

  return config.url + '?' + new URLSearchParams(params).toString();
};

const verifyCallback = (query) => {
  const secureHash = query['vnp_SecureHash'];
  const params = Object.assign({}, query);
  delete params['vnp_SecureHash'];
  delete params['vnp_SecureHashType'];

  const sorted = sortObject(params);
  const signData = new URLSearchParams(sorted).toString();
  const hmac = crypto.createHmac('sha512', config.hashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return {
    isValid:       secureHash === signed,
    responseCode:  query['vnp_ResponseCode'],
    amount:        parseInt(query['vnp_Amount'] || '0') / 100,
    orderInfo:     query['vnp_OrderInfo'],
    txnRef:        query['vnp_TxnRef'],
    transactionNo: query['vnp_TransactionNo'],
    bankCode:      query['vnp_BankCode'],
    payDate:       query['vnp_PayDate'],
  };
};

module.exports = { createPaymentUrl, verifyCallback };
