const express = require('express');
const os = require('os');
const fs = require('fs');
const puppeteer = require('puppeteer');
const ps = require('ps-node');
const nodemailer = require('nodemailer');
const log = require('../utils/log')(module);

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
/* GET users listing. */
router.post('/crawl', (req, res) => {
  const search = { query: req.body.crawlTask };
  const url = { targetUrl: req.body.searchUrl };
  const email = { targetEmail: req.body.sendTo };
  const milliseconds = new Date().getTime();
  if (req.body.searchUrl === undefined || req.body.crawlTask === undefined || req.body.sendTo === undefined) {
    return res.status(400).json({ err: 1, msg: 'Bad request', crawlList: { search, url, email } });
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
  const formSelector = 'div#module-1-3-1 > div > input';
  const submitButton = '#module-1-3 > div.searchBar__forms > div > form > button.searchBar__submit._directory';
  const width = 1920;
  const height = 1050;
  const homeDir = os.tmpdir();
  const crawlerDir = '2gis-webgatherer';

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
    try {
      await log.info(`Crawler started with url: ${url.targetUrl}`);
      await page.goto(url.targetUrl);
    } catch (exception) {
      log.error(`Exception caught: ${exception}`);
    }
    try {
      log.info(`Search query: ${search.query}`);
      await page.$eval(formSelector, (el, value) => el.value = value, search.query);
    } catch (exception) {
      log.error(`Exception caught: ${exception}`);
    }
    await page.click(submitButton);
    await log.info(`clicked on ${submitButton}`);
    await page.waitFor(5000);
    const items = [];

    try {
      await page.waitForSelector('div.pagination__arrow._right');
    } catch (exception) {
      log.error(`EXCEPTION CAUGHT: ${exception}`);
    }
    try {
      while (await page.$('div.pagination__arrow._right') !== null) {
        await page.waitForSelector('.miniCard');
        for (let step = 0; step < 12; step++) {
          const action = await page.evaluate(() => {
            const anchors = document.getElementsByClassName('miniCard__headerTitleLink');
            return [].map.call(anchors, a => a.href);
          });
          const pageNew = await browser.newPage();
          await pageNew.setViewport({ width, height });
          await pageNew.setDefaultNavigationTimeout(timeout);
          await pageNew.goto(action[step]);
          try {
            await pageNew.waitFor(1000);
            await pageNew.waitForSelector('div.card__scrollerIn');
            await pageNew.waitForSelector('h1.cardHeader__headerNameText');
            await pageNew.waitForSelector('address.card__address');
            await pageNew.waitForSelector('div.contact__toggle._place_phones');
            await pageNew.evaluate(() => document.getElementsByClassName('contact__toggle _place_phones')[0].click());
            const number = await pageNew.evaluate(() => document.getElementsByClassName('contact__phones _shown')[0].innerText);
            const phone = number.replace(/(\r\n\t|\n|\r\t)/gm, ' ', ' ').split('Пожалуйста, скажите, что узнали номер в 2ГИС').join('');
            const name = await pageNew.evaluate(() => document.querySelector('h1.cardHeader__headerNameText').innerText);
            const Address = await pageNew.evaluate(() => document.querySelector('address.card__address').innerText);
            const Url = { url: pageNew.url() };
            const unixTime = new Date().getTime();
            await pageNew.screenshot({ path: `${homeDir}/${crawlerDir}/auto_${unixTime}.screenshot.jpeg`, type: 'jpeg', quality: 50 });
            items.push({
              phoneNumber: phone,
              companyName: name,
              address: Address,
            });
            await pageNew.close();
            await log.info(`Company collected: ${name}| url: ${Url.url}`);
          } catch (e) {
            const Url = { url: pageNew.url() };
            const unixTime = new Date().getTime();
            await pageNew.screenshot({ path: `${homeDir}/${crawlerDir}/auto_exception.${unixTime}.screenshot.jpeg`, type: 'jpeg', quality: 50 });
            await log.error(`Exception caught at url ${Url.url}: ${e}`);
            await pageNew.close();
          }
        }
        await page.waitForSelector('div.pagination__arrow._right');
        const pageIndex = await page.evaluate(() => document.querySelector('.pagination__page._current').innerText);
        if (await page.evaluate(() => document.querySelector('div.pagination__arrow._right').className) === 'pagination__arrow _right _disabled'){
          page.close();
        }
        await page.focus('div.pagination__arrow._right');
        await page.click('div.pagination__arrow._right');
        await log.info(`clicked on page: ${pageIndex}`);
      }
    } catch (exception) {
      log.error(`EXCEPTION CAUGHT: ${exception}`);
    }
    await browser.close();
    return items;
  };
  scrape().then((value) => {
    const content = JSON.stringify(value);
    try {
      fs.writeFile(`${homeDir}/${crawlerDir}/${search.query}_${milliseconds}.json`, content, 'utf8', (err) => {
        if (err) {
          return log.error(err);
        }
        log.info(`JSON file was created at: ${homeDir}/${crawlerDir}/${search.query}_${milliseconds}.json | Sending Email`);
        const mailOptions = {
          from: 'commonbonobo@gmail.com',
          to: email.targetEmail,
          subject: 'Crawl result JSON',
          text: `New Base Collected for ${search.query} at ${url.targetUrl}`,
          attachments: [
            {
              filename: `${search.query}_${milliseconds}.json`,
              path: `${homeDir}/${crawlerDir}/${search.query}_${milliseconds}.json`,
              contentType: 'application/json',
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
    } catch (e) {
      log.error(`EXCEPTION CAUGHT: ${e}`);
    }
  }).catch((exception) => {
    log.error(`EXCEPTION CAUGHT: ${exception}`);
  });
  return 0;
});

module.exports = router;
