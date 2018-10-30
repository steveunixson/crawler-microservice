/* eslint-disable max-len */
const express = require('express');
const os = require('os');
const fs = require('fs');
const puppeteer = require('puppeteer');
const ps = require('ps-node');
const nodemailer = require('nodemailer');
const json2csv = require('json2csv').parse;

const fields = ['contactName', 'contactNumber'];
const opts = { fields };
const log = require('../utils/log')(module);
const Youla = require('../models/youla');

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

router.post('/youla-crawl', (req, res) => {
  const search = { query: req.body.crawlTask };
  const email = { targetEmail: req.body.sendTo };
  const url = { targetUrl: req.body.searchUrl };
  const milliseconds = new Date().getTime();
  if (req.body.crawlTask === undefined
    || req.body.sendTo === undefined
    || req.body.searchUrl === undefined) {
    return res.status(400).json({ err: 1, msg: 'Bad request', crawlList: { search, email } });
  }
  ps.lookup({
    command: 'chromium',
    arguments: '--headless',
  }, (err, resultList) => {
    if (err) {
      throw new Error(err);
    }
    resultList.forEach((process) => {
      if (process) {
        console.log('PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments);
      }
    });
    return res.status(200).json({
      err: 0,
      msg: 'Crawl task has been started',
      crawlList: { search, url },
      unixTimeID: milliseconds,
      process: { resultList },
    });
  });
  const width = 1920;
  const height = 1050;
  const homeDir = os.homedir();
  const crawlerDir = 'youla-webgatherer';

  if (!fs.existsSync(`${homeDir}/${crawlerDir}/`)) {
    fs.mkdirSync(`${homeDir}/${crawlerDir}/`);
    log.info(`Created directory: ${homeDir}/${crawlerDir}/`);
  }
  const scrape = async () => {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        `--window-size=${width},${height}`, '--no-sandbox', '--disable-setuid-sandbox',
      ],
    });
    const timeout = 4 * 30000;
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.setDefaultNavigationTimeout(timeout);
    const items = [];
    try {
      await log.info(`Crawler started with url: ${url.targetUrl}`);
      await page.goto(url.targetUrl);
    } catch (exception) {
      log.error(`Exception caught: ${exception}`);
    }

    await page.waitForSelector('li.product_item');
    try {
      while (await page.evaluate(() => document.querySelectorAll('li.product_item').length) !== 660) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      }
      const pageNew = await browser.newPage();
      await pageNew.setViewport({ width, height });
      await pageNew.setDefaultNavigationTimeout(timeout);
      // TODO Засунуть try catch в цикл
      for (let step = 0; step < 660; step++) {
        const action = await page.evaluate(step => document.querySelectorAll('.product_item')[step].firstChild.href, step);
        try {
          await log.info(`clicked on: product_item ${step + 1} out of 660`);
          await pageNew.goto(action);
          await pageNew.click('button.sc-bZQynM.gEaesV');
          await pageNew.waitFor(1000);
          const modalClass = await pageNew.evaluate(() => document.querySelector('[data-test-component~="ProductPhoneNumberModal"]').className);
          await log.debug(modalClass);
          const name = await pageNew.evaluate(modalClass => document.getElementsByClassName(modalClass)[0].children[0].children[1].innerText, modalClass);
          const number = await pageNew.evaluate(modalClass => document.getElementsByClassName(modalClass)[0].children[2].children[0].innerText, modalClass);
          items.push({
            contactName: name,
            contactNumber: number,
          });
          const youla = new Youla({
            _id: step,
            contactName: name,
            contactNumber: number,
          });
          youla.save((err) => {
            if (err) {
              log.error(`EXCEPTION CAUGHT WHILE SAVING TO DB: ${err}`);
            }
          });
        } catch (exception) {
          const Url = { url: pageNew.url() };
          const unixTime = new Date().getTime();
          await pageNew.screenshot({ path: `${homeDir}/${crawlerDir}/auto_exception.${unixTime}.screenshot.jpeg`, type: 'jpeg', quality: 50 });
          await pageNew.goto(action);
          await log.error(`Exception caught at url ${Url.url}: ${exception}`);
        }
      }
    } catch (exception) {
      log.error(`Exception caught: ${exception}`);
    }
    await browser.close();
    return items;
  };
  scrape().then((value) => {
    const content = JSON.stringify(value);
    try {
      fs.writeFile(`${homeDir}/${crawlerDir}/${milliseconds}.json`, content, 'utf8', (err) => {
        if (err) {
          return log.error(err);
        }
        log.info(`JSON file was created at: ${homeDir}/${crawlerDir}/${milliseconds}.json`);
        return 0;
      });
    } catch (e) {
      log.error(`EXCEPTION CAUGHT: ${e}`);
    }
    try {
      const csv = json2csv(value, opts);
      fs.writeFile(`${homeDir}/${crawlerDir}/${milliseconds}.csv`, csv, 'utf8', (err) => {
        if (err) {
          return log.error(err);
        }
        log.info(`CSV file was created at: ${homeDir}/${crawlerDir}/${milliseconds}.csv | Sending Email`);
        return 0;
      });
      const mailOptions = {
        from: 'commonbonobo@gmail.com',
        to: email.targetEmail,
        subject: 'Crawl result CSV',
        text: `New Base Collected for ${search.query} at ${url.targetUrl}`,
        attachments: [
          {
            filename: `${search.query}_${milliseconds}.csv`,
            path: `${homeDir}/${crawlerDir}/${milliseconds}.csv`,
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
    } catch (err) {
      console.error(err);
    }
  }).catch((exception) => {
    log.error(`EXCEPTION CAUGHT: ${exception}`);
  });
  return 0;
});

module.exports = router;
