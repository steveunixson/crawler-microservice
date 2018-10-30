const express = require('express');
const json2csv = require('json2csv').parse;

const Youla = require('../models/youla');

const fields = ['contactName', 'contactNumber'];
const opts = { fields };

const router = express.Router();

/* GET home page. */
router.get('/youla-csv', (req, res) => {
  const csvDownload = async () => {
    const dbData = await Youla.find((err, data) => data);
    const csv = await json2csv(dbData, opts);
    return csv;
  };
  csvDownload()
    .then((csv) => {
      res.setHeader('Content-disposition', 'attachment; filename=data.csv');
      res.set('Content-Type', 'text/csv');
      res.status(200).send(csv);
    })
    .catch((error) => { res.status(500).json({ err: 1, msg: 'Internal Error', error }); });
});

module.exports = router;
