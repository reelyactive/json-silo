/**
 * Copyright reelyActive 2015-2019
 * We believe in an open Internet of Things
 */


// Constants
const STORIES_ROUTE = '/stories';
const IMAGES_ROUTE = '/images';
const DEFAULT_IMAGE_PROPERTY_NAME = 'image';
const DEFAULT_STORY = {
    "@context": { "schema": "https://schema.org/" },
    "@graph": []
};
const DEFAULT_PERSON_ELEMENT = { "@id": "person", "@type": "schema:Person" };


// DOM elements
let personForm = document.querySelector('#personForm');
let personGivenName = document.querySelector('#personGivenName');
let personFamilyName = document.querySelector('#personFamilyName');
let personImageInput = document.querySelector('#personImageInput');
let storeStory = document.querySelector('#storeStory');
let storeButton = document.querySelector('#storeButton');
let accessStory = document.querySelector('#accessStory');
let copyButton = document.querySelector('#copyButton');
let visitButton = document.querySelector('#visitButton');
let anotherButton = document.querySelector('#anotherButton');
let visualPreview = document.querySelector('#visualPreview');
let storyPreview = document.querySelector('#storyPreview');
let storyUrl = document.querySelector('#storyUrl');
let error = document.querySelector('#error');


// Other variables
let personStory = Object.assign({}, DEFAULT_STORY);
let personElement = Object.assign({}, DEFAULT_PERSON_ELEMENT);
personStory['@graph'].push(personElement);
let personImgSrc;


/**
 * Uploads an image to the file system
 * @param {callback} callback Function to call upon completion
 */
function addImage(callback) {
  let formData = new FormData();
  formData.append(DEFAULT_IMAGE_PROPERTY_NAME, personImageInput.files[0]);

  let httpRequest = new XMLHttpRequest();
  httpRequest.onload = function(oevent){
    if(httpRequest.status === 200) {
      let response = JSON.parse(httpRequest.responseText);
console.log(response);
      let imageLocation = 'images/' + response.imageName;
      error.textContent = '';
      return callback(window.location.href + imageLocation);
    }
    else if(httpRequest.status === 204) {
      error.textContent = 'wrong file format';
    }
    else if(httpRequest.status === 422) {
      error.textContent = 'We could not detect any file';
    }
    else {
      //textImage.textContent = 'something went wrong while uploading image';
    } 
    return callback();
  };
  httpRequest.open('POST', IMAGES_ROUTE, true);
  httpRequest.send(formData);  
} 


/**
 * Obtains story and sends it to the database
 * @param {callback} callback Function to call upon completion
 */
function addStory(callback) { 
  let httpRequest = new XMLHttpRequest();
  let personStoryString = JSON.stringify(personStory);
  httpRequest.onreadystatechange = function(){
    if(httpRequest.readyState === XMLHttpRequest.DONE) {
      if(httpRequest.status === 200) {
        let response = JSON.parse(httpRequest.responseText);
        let storyId = Object.keys(response.stories)[0];
        let story = response.stories[storyId];
        let url = response._links.self.href + '/' + storyId;
        storyUrl.value = url;
        visitButton.href = url;
      }
      return callback();
    }
  };
  httpRequest.open('POST', STORIES_ROUTE);
  httpRequest.setRequestHeader('Content-Type', 'application/json');
  httpRequest.setRequestHeader('Accept', 'application/json');
  httpRequest.send(personStoryString);
}


// Update the person element
function updatePersonElement() {
  if(personGivenName.value === '') {
    delete personElement['schema:givenName'];
  }
  else {
    personElement['schema:givenName'] = personGivenName.value;
  }

  if(personFamilyName.value === '') {
    delete personElement['schema:familyName'];
  }
  else {
    personElement['schema:familyName'] = personFamilyName.value;
  }

  storyPreview.textContent = JSON.stringify(personStory, null, 2);
  cuttlefish.render(personStory, visualPreview);
}


// Update the person's image source based on the uploaded image
function updatePersonImageSrc() {
  let input = this;
  if(input.files && input.files[0]) {
    let reader = new FileReader();
    
    reader.onload = function(e) {
      personImgSrc = e.target.result;
      personElement['schema:image'] = personImgSrc;
      cuttlefish.render(personStory, visualPreview);
    }
    reader.readAsDataURL(input.files[0]);
  }
}


// Handle user request to publish story
function publishStory() {
  storeStory.hidden = true;

  if(personImgSrc) {
    addImage(function(imageUrl) {
      if(imageUrl) {
        personElement['schema:image'] = imageUrl;
      }
      else { /* TODO: handle image errors */ }
      addStory(function() {
        accessStory.hidden = false;
      });
    });
  }
  else {
    addStory(function() {
      accessStory.hidden = false;
    });
  }
}


// Handle user request to copy the story URL
function copyStoryUrl() {
  storyUrl.select();
  document.execCommand('copy');
}


// Handle the user request to create another story
function anotherStory() {
  accessStory.hidden = true;
  storeStory.hidden = false;
}


personForm.addEventListener('keyup', updatePersonElement);
personImageInput.addEventListener('change', updatePersonImageSrc);
storeButton.addEventListener('click', publishStory);
copyButton.addEventListener('click', copyStoryUrl);
anotherButton.addEventListener('click', anotherStory);
