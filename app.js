const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const compression = require('compression');
const path = require('path');
const mongoose = require('mongoose');
const sassMiddleware = require('node-sass-middleware');
const expressValidator = require('express-validator');
var multer = require('multer');

const error = require('./constants').errorMessage;
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
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json());
app.use(expressValidator());

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

var upload = multer();


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

app.post('/patient/add', upload.array(), (req, res) => {
  let form = req.body;
  console.log(form);
  for (let key in form) {
    req.checkBody(key, error.empty).notEmpty();
  }
  req.getValidationResult().then((result) => {
    if (!result.isEmpty()) {
      const response = {
        status: 400,
        type: 'error',
        errors: result.array(),
      };
      return res.status(400).json(response);
    }
    res.json({
      status: 200,
      type: 'success',
    });
  });
});
