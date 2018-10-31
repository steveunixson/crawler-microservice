const express = require('express');
const json2csv = require('json2csv').parse;

const fields = ['phoneNumber', 'companyName', 'address', 'city', 'site'];
const opts = { fields };

const Twogis = require('../models/twogis');

const router = express.Router();

router.get('/twogis', (req, res) => {
  const csvDownload = async () => {
    const dbData = await Twogis.find((err, data) => data);
    const csv = await json2csv(dbData, opts);
    return csv;
  };
  csvDownload()
    .then((csv) => {
      res.setHeader('Content-disposition', 'attachment; filename=2gis.csv');
      res.set('Content-Type', 'text/csv');
      res.status(200).send(csv);
    })
    .catch((error) => { res.status(500).json({ err: 1, msg: 'Internal Error', error }); });
});

module.exports = router;
