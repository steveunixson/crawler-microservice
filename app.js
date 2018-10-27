require('dotenv').config();
const express = require('express');
const path = require('path');
const formData = require('express-form-data');
const morgan = require('morgan');
const os = require('os');
const bodyParser = require('body-parser');
const ip = require('ip');
const log = require('./utils/log')(module);
const config = require('./config/config');
const crawler = require('./routes/crawler');
const youlaCrawler = require('./routes/youla-crawler');
const cron = require('./routes/cron');

const app = express();
const port = process.env.PORT || 3000;

const options = {
  uploadDir: os.tmpdir(),
  autoClean: false,
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(formData.parse(options));
// clear from the request and delete all empty files (size == 0)
app.use(formData.format());
// change file objects to stream.Readable
app.use(formData.stream());
// union body and files
app.use(formData.union());
app.use(morgan('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(crawler);
app.use(youlaCrawler);
app.use(cron);
app.use(express.static(path.join(__dirname, 'public')));
app.listen(port, () => {
  log.info(config.colors.FgMagenta, `Bonobo 2gis gather now Running On : http://${ip.address()}:${port}`);
});
