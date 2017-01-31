const makeApp = require('./app').makeApp;
const responseType = require('./constants').responseType;
const test = require('ava');
const request = require('supertest');
const Patient = require('./models/Patient');
test.before('Delete all patients in DB', async t => {
  await Patient.remove({});
});
test.after('Delete all patients in DB', async t => {
  await Patient.remove({});
});

test('add patient:Success', async t => {
  let allPatients = await Patient.find({});
  t.is(allPatients.length, 0);
  const patient = {
    fname: 'John',
    lname: 'Patrick',
    age: 23,
    date: '1991-11-01',
    gender: 'Male',
    phone: '+919419212231',
    details: 'I would like to consult a skin specialist',
  };
  const res = await request(makeApp())
    .post('/patient/add')
    .send(patient);
  allPatients = await Patient.find({});
  t.is(res.status, 200);
  t.is(res.body.type, responseType.SUCCESS);
  t.is(allPatients.length, 1);
});

test('add patient:Failure', async t => {
  const patient = {
    fname: '',
    lname: 'Patrick',
    age: 101,
    date: '100-11-01',
    gender: 'Qwe',
    phone: '+91-9419 212-231',
    details: 'I would like to consult a skin specialist',
  };
  const res = await request(makeApp())
    .post('/patient/add')
    .send(patient);
  t.is(res.status, 400);
  t.is(res.body.type, responseType.ERROR);
  // Error in 5 fields
  t.is(res.body.errors.length, 5);
});

test('GET patient directory', async t => {
  const res = await request(makeApp())
    .get('/patient-directory')
    .send();
  t.is(res.status, 200);
});
