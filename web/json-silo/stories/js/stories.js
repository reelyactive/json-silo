/**
 * Copyright reelyActive 2015-2019
 * We believe in an open Internet of Things
 */


// DOM elements
let visualStory = document.querySelector('#visualStory');
let machineStory = document.querySelector('#machineStory');


// Retrieve and render the story
cormorant.retrieveStory(window.location.href, function(story) {
  machineStory.textContent = JSON.stringify(story, null, 2);
  cuttlefish.render(story, visualStory);
});
