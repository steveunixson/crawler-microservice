const express = require('express');
const nodemailer = require('nodemailer');
const json2csv = require('json2csv').parse;
const os = require('os');
const fs = require('fs');
const log = require('../utils/log')(module);

const homeDir = os.homedir();
const fields = ['phoneNumber'];
const opts = { fields };
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  requireTLS: true,
  auth: {
    user: 'commonbonobo@gmail.com',
    pass: 'seb092qb',
  },
});
const router = express.Router();

/* GET home page. */
router.post('/generate', (req, res) => {
  const numbers = { Number: req.body.numbers };
  const code = { phoneCode: req.body.code };
  const serialNo = { Serial: req.body.serialNo };
  const email = { targetEmail: req.body.sendTo };
  if (req.body.numbers === undefined || req.body.code === undefined || req.body.serialNo === undefined || req.body.sendTo === undefined) {
    return res.status(400).json({ err: 1, msg: 'Bad request' });
  }
  const items = [];
  for (i = 0; i < numbers.Number; i++) {
    items.push({ phoneNumber: `8${code.phoneCode}${serialNo.Serial}${Math.floor(1000 + Math.random() * 9000)}` });
  }
  res.status(200).json({ err: 0, msg: 'Generated!' });
  const content = JSON.stringify(items);
  const generatorDir = 'number-generator';
  const milliseconds = new Date().getTime();
  if (!fs.existsSync(`${homeDir}/${generatorDir}/`)) {
    fs.mkdirSync(`${homeDir}/${generatorDir}/`);
    log.info(`Created directory: ${homeDir}/${generatorDir}/`);
  }
  fs.writeFile(`${homeDir}/${generatorDir}/${milliseconds}.json`, content, 'utf8', (err) => {
    if (err) {
      return log.error(err);
    }
    log.info(`JSON file was created at: ${homeDir}/${generatorDir}/${milliseconds}.json`);
    return 0;
  });
  const csv = json2csv(items, opts);
  fs.writeFile(`${homeDir}/${generatorDir}/${milliseconds}.csv`, csv, 'utf8', (err) => {
    if (err) {
      return log.error(err);
    }
    log.info(`CSV file was created at: ${homeDir}/${generatorDir}/${milliseconds}.csv | Sending Email`);
    return 0;
  });
  const mailOptions = {
    from: 'commonbonobo@gmail.com',
    to: email.targetEmail,
    subject: 'Generated result CSV',
    text: 'Generated phone numbers',
    attachments: [
      {
        filename: `${milliseconds}.csv`,
        path: `${homeDir}/${generatorDir}/${milliseconds}.csv`,
        contentType: 'text/csv',
      },
    ],
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      log.error(error);
    } else {
      log.info(`Email sent: ${info.response}`);
      transporter.close();
    }
  });
  return 0;
});
module.exports = router;
