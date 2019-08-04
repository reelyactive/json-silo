/**
 * Copyright reelyActive 2015-2019
 * We believe in an open Internet of Things
 */


// Constants
const STATUS_OK = 200;


// DOM elements
let visualStory = document.querySelector('#visualStory');
let machineStory = document.querySelector('#machineStory');


// Initialisation: GET the story and display in DOM
getStory(window.location.href, function(status, response) {
  machineStory.textContent = JSON.stringify(response, null, 2);

  if(status === STATUS_OK) {
    let storyId = Object.keys(response.stories)[0];
    let story = response.stories[storyId];

    cuttlefish.render(story, visualStory);
  }
  else { /* TODO: handle bad requests */ }
});


// GET the story
function getStory(url, callback) {
  let httpRequest = new XMLHttpRequest();

  httpRequest.onreadystatechange = function() {
    if(httpRequest.readyState === XMLHttpRequest.DONE) {
      return callback(httpRequest.status,
                      JSON.parse(httpRequest.responseText));
    }
  };
  httpRequest.open('GET', url);
  httpRequest.setRequestHeader('Accept', 'application/json');
  httpRequest.send();
}
