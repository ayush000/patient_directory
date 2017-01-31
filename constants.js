// Error messages to be displayed while filling in add patient form
exports.errorMessage = {
  empty: 'Field cannot be empty',
  name: 'Invalid field. Should only contain characters and be between 2-30 characters',
  age: 'Invalid field. Should be an interger between 10 and 100',
  phone: 'Invalid phone number. Should contain 6-20 digits without spaces. May include country code',
  date: 'Invalid date',
};

// Type of responses for APIs
exports.responseType = {
  ERROR: 'error',
  SUCCESS: 'success',
};
