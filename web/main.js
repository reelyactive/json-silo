
let queryBox = document.querySelector('#queryBox');
let queryButton = document.querySelector('#queryButton');
var TEST_JSON = {person: {firstName: "Barn",
                            lastName: "Owl",
                            companyName: "reelyActive",
                            portraitImageUrl: "http://reelyactive.com/images/barnowl.jpg",
                            twitterPersonalScreenName: "reelyActive" },
                  device:{manufacturer: "reelyActive",
                            model: "RA-T411",
                            portraitImageUrl: "http://reelyactive.com/images/tag400x400.jpg" } };
function addStory() {
  let url = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/stories/id';
  let httpRequest = new XMLHttpRequest();
  console.log('called', JSON.stringify(queryBox.value));

  httpRequest.onreadystatechange = function(){
    if(httpRequest.readyState === XMLHttpRequest.DONE) {
      if(httpRequest.status == 200){
        let response = JSON.parse(httpRequest.responseText);
        console.log(response);
      }
    }
  };
  httpRequest.open('POST', 'http://localhost:3000/stories');
  httpRequest.setRequestHeader('Content-Type', 'application/json');
  httpRequest.setRequestHeader('Accept', 'application/json');
  httpRequest.send("{}");
  // httpRequest.send(JSON.stringify(queryBox.value));
}
queryButton.addEventListener('click', addStory);
