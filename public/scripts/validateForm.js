function checkStatus(response) {
  if (response.status < 500) {
    return response;
  } else {
    const error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
}

function parseJSON(response) {
  return response.json();
}

function handleClick() {
  let addPatientForm = document.getElementById('add-patient');
  fetch('/patient/add', {
    method: 'post',
    body: new FormData(addPatientForm),
  }).then(checkStatus)
    .then(parseJSON)
    .then((response) => {
      if (response.type === 'error') {
        const errors = response.errors;
        addErrorMarkings(errors);
      } else {
        console.log(response);
        clearInputFields();
        alert('Successfully added');
      }
    });
}

function clearInputFields() {
  let elements = document.getElementsByTagName('input');
  let el2 = document.getElementsByTagName('textarea');
  for (let i = 0; i < elements.length; i++) {
    elements[i].value = '';
  }
  for (let i = 0; i < el2.length; i++) {
    el2[i].value = '';
  }
}

function addErrorMarkings(errors) {
  for (let i = 0; i < errors.length; i++) {
    let {param, msg} = errors[i];
    let inputContainer = document.querySelector(`[name="${param}"]`).parentNode;
    let elemContainer = inputContainer.parentNode;

    elemContainer.className += ' has-danger';
    let errorDiv = document.createElement('div');
    errorDiv.className = 'form-control-feedback';
    errorDiv.innerHTML = msg;
    inputContainer.appendChild(errorDiv);
  }
}
