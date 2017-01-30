const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  fname: { type: String, required: true, trim: true },
  lname: { type: String, required: true, trim: true },
  age: {
    type: Number,
    required: true,
    get: v => Math.round(v),
    set: v => Math.round(v),
  },
  date: { type: Date, required: true, trim: true },
  details: { type: String, required: true, trim: true },
});

module.exports = mongoose.model('Patient', schema);
