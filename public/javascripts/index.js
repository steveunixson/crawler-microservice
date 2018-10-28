function postUser() {
  axios.post('/crawl',  {
    crawlTask: document.getElementById('example-search-input').value,
    sendTo: document.getElementById('example-email-input').value,
    searchUrl: document.getElementById('example-url-input').value,
    wholeSale: document.getElementById('inputState').value,
  })
    .then((response) => {
      console.log(response.data);
    })
    .catch((error) => {
      console.log(error);
    });
}

function postYoula() {
  axios.post('/youla-crawl',  {
    crawlTask: document.getElementById('inputYoula').innerText,
    sendTo: document.getElementById('email-input-youla').value,
    searchUrl: document.getElementById('inputYoula').value,
  })
    .then((response) => {
      console.log(response.data);
    })
    .catch((error) => {
      console.log(error);
    });
}

function generatePhones() {
  axios.post('/generate',  {
    code: document.getElementById('generate-code').valueAsNumber,
    numbers: document.getElementById('generate-number').valueAsNumber,
    sendTo: document.getElementById('generate-email').value,
    serialNo: document.getElementById('generate-serial').valueAsNumber,
  })
    .then((response) => {
      console.log(response.data);
    })
    .catch((error) => {
      console.log(error);
    });
}
