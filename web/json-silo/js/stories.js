/**
 * Copyright reelyActive 2014-2025
 * We believe in an open Internet of Things
 */


// Constants
const STORIES_ROUTE = '/stories';
const MESSAGE_NOT_FOUND = 'Story Not Found [404].';


// DOM elements
let returnButton = document.querySelector('#returnbutton');
let visualisation = document.querySelector('#visualisation');
let jsonResponse = document.querySelector('#jsonResponse');
let loading = document.querySelector('#loading');
let error = document.querySelector('#error');
let errorMessage = document.querySelector('#errorMessage');


// Other variables
let queryUrl = window.location.href;
let storiesUrl = window.location.protocol + '//' + window.location.hostname +
                 ':' + window.location.port + STORIES_ROUTE;
let isRootQuery = false;


// Hide "return to /stories" button when already querying /stories
if((window.location.pathname.endsWith(STORIES_ROUTE )) ||
   (window.location.pathname.endsWith(STORIES_ROUTE + '/'))) {
  isRootQuery = true;
  returnButton.hidden = true;
}

// Retrieve and render the story
if(!isRootQuery) {
  cormorant.retrieveStory(window.location.href, {}, (story) => {
    jsonResponse.textContent = JSON.stringify(story, null, 2);
    loading.hidden = true;

    if(story) {
      cuttlefishStory.render(story, visualisation);
      visualisation.hidden = false;
    }
    else {
      errorMessage.textContent = MESSAGE_NOT_FOUND;
      error.hidden = false;
    }
  });
}
