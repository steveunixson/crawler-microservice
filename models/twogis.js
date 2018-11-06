/* eslint-disable prefer-destructuring */
const mongoose = require('mongoose');
const config = require('../config/config');
const log = require('../utils/log')(module);

mongoose.connect(config.database, { useNewUrlParser: true })
  .then(() => {
    log.info('Connected to DB store!');
  })
  .catch((exception) => {
    log.error(`EXCEPTION CAUGHT WHILE CONNECTING TO DB: ${exception}`);
  });
const Schema = mongoose.Schema;

const Twogis = new Schema({
  id: { type: Number },
  phoneNumber: { type: String },
  companyName: { type: String, unique: true },
  address: { type: String },
  city: { type: String },
  site: { type: String },
  search: { type: String },
}, { versionKey: false });

const TwogisModel = mongoose.model('Twogis', Twogis);

module.exports = TwogisModel;
