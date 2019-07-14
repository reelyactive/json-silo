/**
 * Copyright reelyActive 2014-2019
 * We believe in an open Internet of Things
 */


const express = require('express');
const path = require('path');
const responseHandler = require('./responsehandler');


let router = express.Router();

router.route('/')
  .post(function(req, res) {
    createStory(req, res);
  });

router.route('/:id')
  .get(function(req, res) { 
    retrieveStory(req, res);
  });


/**
 * Create the given story
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function createStory(req, res) {
  let story = req.body;
  let stories = req.jsonsilo.stories;
  stories.create(story, function(status, data) {
    let response = responseHandler.prepareResponse(req, status, data);
    res.status(status).json(response);
  });
}


/**
 * Retrieve the given story
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveStory(req, res) {
  switch(req.accepts(['json','html'])) {
    case 'html':
      res.sendFile(path.resolve(__dirname + '/../../web/jsonsilo/stories/index.html'));
      break;
    default:
      let id = req.params.id;
      let stories = req.jsonsilo.stories;
      stories.retrieve(id, function(status, data) { 
        let response = responseHandler.prepareResponse(req, status, data);
        res.status(status).json(response); 
      });
  }
}


module.exports = router;
