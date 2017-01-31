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
const responseType = require('./constants').responseType;
const writeLog = require('./commonfunction').writeLog;
mongoose.Promise = global.Promise;

const MONGODB_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/patient_directory';
// Create a connection with mongodb
mongoose.connect(MONGODB_URL, (err) => {
  if (err) {
    throw err;
  }
  writeLog('Connected to Mongo!');
});

/**
 * Funtion to create express server and its routes. Required for endpoint testing
 */
function makeApp() {
  const app = express();
  app.use(compression());

  // Handle multipart forms
  const upload = multer();
  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: true }));
  // parse application/json
  app.use(bodyParser.json());
  app.use(expressValidator({
    customValidators: {
      // Check whether a string is a valid phone number
      isPhone: value => {
        // 4-20 digits with an optional + sign returns true
        return /^\+?\d{4,20}$/g.test(value);
      },
      isValidGender: value => {
        return value === 'Male' || value === 'Female';
      },
    },
  }));

  // Converts sass files to css and puts them in ./public/styles
  app.use('/styles', sassMiddleware({
    src: path.join(__dirname, './sass'),
    response: false,
    dest: path.join(__dirname, './public/styles'),
    outputStyle: 'extended',
    indentedSyntax: true,
  }));

  app.use(express.static(path.join(__dirname, './public')));

  app.set('view engine', 'pug');
  app.set('views', path.join(__dirname, './views'));
  if (process.env.NODE_ENV !== 'test') {
    app.use(logger('dev'));
    const listener = app.listen(process.env.PORT || 8081, () => {
      writeLog(`Listening on port ${listener.address().port}`);
    });
  }

  // Routes

  // Renders add a patient page
  app.get('/', (req, res) => {
    res.render('newPatient');
  });

  // Receive form data, validate and store in database
  app.post('/patient/add', upload.array(), (req, res) => {
    let form = req.body;
    validateAll(req);

    // Function added by express-validator. Result object contains validation error for each field.
    req.getValidationResult().then(result => {
      if (!result.isEmpty()) {
        const errors = result.array();
        // Select unique errors by field. If a field has 2 validation errors, only one error is displayed
        const uniErrors = _.uniqBy(errors, 'param');
        const response = {
          status: 400,
          type: responseType.ERROR,
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
            type: responseType.SUCCESS,
          };
          res.send(response);
        })
        .catch(err => {
          res.status(500).send({
            status: 500,
            type: responseType.ERROR,
            error: `Internal server error: ${err}`,
          });
        });
    });
  });

  // Render patient-directory.
  app.get('/patient-directory', (req, res) => {
    // Select all patients
    Patient.find({})
      .then(patients => {
        // Convert to JSON array and map keys to field names
        patients = patients.map(patient => {
          // Convert each document to JSON object
          const obj = patient.toObject();
          return {
            'First name': obj.fname,
            'Last name': obj.lname,
            'Age': obj.age,
            'Date of birth': moment(obj.date).format('ll'),
            'Gender': obj.gender,
            'Phone': obj.phone,
            'Details': obj.details || '',
          };
        });
        res.render('patientDirectory', { patients });
      })
      .catch(err => {
        res.status(500).send({
          status: 500,
          type: responseType.ERROR,
          error: `Internal server error: ${err}`,
        });
      });
  });
  return app;
}

makeApp();

/**
 * Validate fields of a patient. Result of validation is returned as a promise to req.getValidationResult
 * @param {object} req Express request object. Contains checkBody method and form data
 * @returns {null} null
 */
function validateAll(req) {
  const form = req.body;

  // All keys except details are required
  for (let key in form) {
    if (key !== 'details') {
      req.checkBody(key, error.empty).notEmpty();
    }
  }
  // Firstname and lastname should contain 2-30 characters only.
  req.checkBody('fname', error.name)
    .isAlpha().isLength({ min: 2, max: 30 });
  req.checkBody('lname', error.name)
    .isAlpha().isLength({ min: 2, max: 30 });
  // Age should be an integer between 10 and 100
  req.checkBody('age', error.age)
    .isInt({ min: 10, max: 100 });
  // Phone number should contain 6-20 digits only, may include + sign for country code
  req.checkBody('phone', error.phone)
    .isPhone();
  req.checkBody('gender', error.gender)
    .isValidGender();
  // Date of birth should be between 1st january 1900 and current date
  req.checkBody('date', error.date)
    .isDate().isAfter('1900-01-01').isBefore();
}

exports.makeApp = makeApp;
