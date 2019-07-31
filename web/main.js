/**
 * Copyright reelyActive 2015-2019
 * We believe in an open Internet of Things
 */


// Constants
const DEFAULT_IMAGE_PROPERTY_NAME = 'image';


// DOM elements
let form = document.querySelector('#myForm');
let queryBox = document.querySelector('#personName');
let queryButton = document.querySelector('#queryButton');
let jsonResponse = document.querySelector('#jsonResponse');
let url = document.querySelector('#url');
let name = document.querySelector('#name');
let picture = document.querySelector('#picture');
let storyUrl = document.querySelector('#storyUrl');
let text = document.querySelector('#text');
let textImage = document.querySelector('#textImage');
let error = document.querySelector('#error');

// data sent to the server
let story = { FullName: "", imageUrl: "" }; 


/**
 * Uploads an image to the file system
 * @param {callback} callback Function to call upon completion
 */
function addImage(callback) {
  let formData = new FormData();
  let myFile = document.getElementById('myFile').files[0];
  formData.append(DEFAULT_IMAGE_PROPERTY_NAME, myFile);

  let httpRequest = new XMLHttpRequest();
  httpRequest.onload = function(oevent){
    if(httpRequest.status === 200) {
      let response = JSON.parse(httpRequest.responseText);
      let imageLocation = 'images/' + response.imageName;
      picture.src = imageLocation;
      //update the DOM
      story.imageUrl = window.location.href + imageLocation;
      story.FullName = queryBox.value;
      story = JSON.stringify(story);
      error.textContent = '';
      callback();
    }
    else if(httpRequest.status === 204) {
      error.textContent = 'wrong file format';
    }
    else if(httpRequest.status === 422) {
      error.textContent = 'We could not detect any file';
    }
    else {
      textImage.textContent = 'something went wrong while uploading image';
    } 
  };
  httpRequest.open('POST', '/images', true);
  httpRequest.send(formData);  
} 


/**
 * Obtains story and sends it to the database
 */
function addStory() { 
  let httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function(){
    if(httpRequest.readyState === XMLHttpRequest.DONE) {
      if(httpRequest.status === 200) {
        story = JSON.stringify(story);
        let response = JSON.parse(httpRequest.responseText);
        let storyLocation = response._links.self.href + '/' + response.stories._id;
        jsonResponse.textContent = (JSON.stringify(response, null, 2));
        url.textContent = storyLocation;
        story.storyLocation = url.textContent;
        //storyUrl.textContent = url.textContent;
      }
    }
  };
  httpRequest.open('POST', '/stories');
  httpRequest.setRequestHeader('Content-Type', 'application/json');
  httpRequest.setRequestHeader('Accept', 'application/json');
  httpRequest.send(story);
}

function log(){
  name.textContent = queryBox.value;
}

function publishStory(){
  addImage(function() { // TODO: handle errors when adding image
    addStory();
  });
}

window.addEventListener('keyup', log);
queryButton.addEventListener('click', publishStory);
