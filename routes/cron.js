const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const log = require('../utils/log')(module);

const router = express.Router();

/* GET home page. */
router.post('/cron', (req, res) => {
  const Hour = { hour: req.body.hours };
  if (req.body.hours === undefined || null) {
    return res.status(400).json({ err: 1, msg: 'Bad request' });
  }
  cron.schedule(`* * ${Hour.hour} * *`, () => {
    log.info('Cron job started!');
    axios.post('http:/localhost:3000/youla-crawl', {
      crawlTask: 'Cron',
      sendTo: 'nilsnilc@gmail.com',
      searchUrl: 'https://youla.ru/rostov-na-donu/muzhskaya-odezhda',
    })
      .then((response) => {
        log.info(response.data);
      })
      .catch((error) => {
        log.info(error);
      });
  }, {
    scheduled: true,
    timezone: 'Europe/Moscow',
  });
  return res.status(200).json({ err: 0, msg: `Cron job started every ${Hour.hour} hours` });
});

module.exports = router;
