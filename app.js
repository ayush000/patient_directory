const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const compression = require('compression');
const path = require('path');
const mongoose = require('mongoose');
const sassMiddleware = require('node-sass-middleware');
const expressValidator = require('express-validator');
const multer = require('multer');
const moment = require('moment');
const _ = require('lodash');

const Patient = require('./models/Patient');
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
app.use(expressValidator({
  customValidators: {
    isPhone: (value) => {
      return /^\+?\d{4,20}$/g.test(value);
    },
  },
}));

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
  validateAll(req, form);

  req.getValidationResult().then((result) => {
    if (!result.isEmpty()) {
      const errors = result.array();
      const uniErrors = _.uniqBy(errors, 'param');
      const response = {
        status: 400,
        type: 'error',
        errors: uniErrors,
      };
      return res.status(400).json(response);
    }

    // Store patient in db
    const patient = new Patient(form);
    patient.save()
      .then(() => {
        const response = {
          status: 200,
          type: 'success',
        };
        res.send(response);
      })
      .catch(err => {
        res.status(500).send({
          status: 500,
          type: 'error',
          error: `Internal server error: ${err}`,
        });
      });
  });
});

app.get('/abc', (req, res) => {
  res.render('pd2');
});

app.get('/patient-directory', (req, res) => {
  Patient.find({})
    .then(patients => {
      patients = patients.map(patient => {
        const obj = patient.toObject();
        return {
          'First name': obj.fname,
          'Last name': obj.lname,
          'Age': obj.age,
          'Date of birth': moment(obj.date).format('ll'),
          'Details': obj.details || '',
        };
      });
      res.render('patientDirectory', { patients });
    })
    .catch(err => {
      res.status(500).send({
        status: 500,
        type: 'error',
        error: `Internal server error: ${err}`,
      });
    });
});

function validateAll(req, form) {
  for (let key in form) {
    if (key !== 'details') {
      req.checkBody(key, error.empty).notEmpty();
    }
  }
  req.checkBody('fname', error.name)
    .isAlpha().isLength({ min: 2, max: 30 });
  req.checkBody('lname', error.name)
    .isAlpha().isLength({ min: 2, max: 30 });
  req.checkBody('age', error.age)
    .isInt({ min: 10, max: 100 });
  req.checkBody('phone', error.phone)
    .isPhone();
  req.checkBody('date', error.date)
    .isDate().isAfter('1900-01-01').isBefore();
}
