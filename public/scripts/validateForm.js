/**
 * Checks the status of http fetch request and returns response
 * @param {object} response Response from window.fetch api
 * @returns {object} response object if request was successful. Otherwise error object
 */
function checkStatus(response) {
  if (response.status < 500) {
    return response;
  } else {
    const error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
}

/**
 * Parses JSON returned by window.fetch API request
 * @param {object} response Response from window.fetch api
 * @returns {Promise} Parsed JSON
 */
function parseJSON(response) {
  return response.json();
}

/**
 * On click handler for add patient button.
 */
function handleClick() {

  // Remove bootstrap error classes that might be present
  let addPatientForm = document.getElementById('add-patient');
  $('.has-error').removeClass('has-error');
  $('.help-block').remove();

  // Send form data to API
  fetch('/patient/add', {
    method: 'post',
    // Send data as multipart form
    body: new FormData(addPatientForm),
  }).then(checkStatus)
    .then(parseJSON)
    .then((response) => {
      if (response.type === 'error') {
        const errors = response.errors;
        addErrorMarkings(errors);
      } else {
        clearInputFields();
        alert('Successfully added');
      }
    });
}

/**
 * Add helpful text and markings to fields that are not valid
 * @param {object} errors Array of errors, along with corresponding parameter returned by API
 * @returns {null} Null
 */
function addErrorMarkings(errors) {
  for (let i = 0; i < errors.length; i++) {

    // param corresponds to the name field in input
    let { param, msg } = errors[i];
    // select parent of input fields with name=param: div(class="col-sm-9")
    let inputContainer = document.querySelector(`[name="${param}"]`).parentNode;
    // Select parent of inputContainer,
    // i.e. container element for both label and input: div(class="form-group row")
    let elemContainer = inputContainer.parentNode;

    // Add class has-error to elemContainer
    elemContainer.className += ' has-error';

    // Add a new div containing help-text as last child of inputContainer(Just below input)
    let errorDiv = document.createElement('div');
    errorDiv.className = 'help-block';
    errorDiv.innerHTML = msg;
    inputContainer.appendChild(errorDiv);
  }
}

/**
 * Clear all input fields
 */
function clearInputFields() {
  // Select all input fields
  let elements = document.getElementsByTagName('input');
  // Select all textarea fields
  let el2 = document.getElementsByTagName('textarea');

  // Assign empty string as value for both array of nodes
  for (let i = 0; i < elements.length; i++) {
    elements[i].value = '';
  }
  for (let i = 0; i < el2.length; i++) {
    el2[i].value = '';
  }
}

