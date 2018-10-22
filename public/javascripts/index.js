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
