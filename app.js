const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const compression = require('compression');
const path = require('path');
const mongoose = require('mongoose');
const sassMiddleware = require('node-sass-middleware');
const writeLog = require('./commonfunction').writeLog;

mongoose.Promise = global.Promise;
const MONGODB_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/patient_directory';
mongoose.connect(MONGODB_URL, (err) => {
  if (err) {
    throw err;
  }
  writeLog('Connected to Mongo!');
});

const app = express();
app.use(compression());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(logger('dev'));
}

app.use('/styles', sassMiddleware({
  src: path.join(__dirname, './sass'),
  response: false,
  dest: path.join(__dirname, './public/styles'),
  debug: true,
  outputStyle: 'extended',
  indentedSyntax: true,
}));

app.use(express.static(path.join(__dirname, './public')));

// app.use(express.static(path.join(__dirname, './public')));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, './views'));

const listener = app.listen(process.env.PORT || 8081, () => {
  writeLog(`Listening on port ${listener.address().port}`);
});

// Routes
app.get('/', (req, res) => {
  res.render('newPatient');
});
