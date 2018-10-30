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

const Youla = new Schema({
  contactName: { type: String },
  id: { type: Number },
  contactNumber: { type: String, unique: true },
}, { versionKey: false });

const YoulaModel = mongoose.model('Youla', Youla);

module.exports = YoulaModel;
