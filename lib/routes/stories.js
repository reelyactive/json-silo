/**
 * Copyright reelyActive 2015-2016
 * We believe in an open Internet of Things
 */

var express = require('express');
var path = require('path');
var responseHandler = require('../responsehandler');


var router = express.Router();


router.route('/')
  .post(function(req, res) {
    createStory(req, res);
  });


router.route('/:id')
  .get(function(req, res) {
    retrieveStory(req, res);
  })
  .delete(function(req, res) {
    deleteStory(req, res);
  });


/**
 * Create the given story.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function createStory(req, res) {
  var story = req.body.story;
  var rootUrl = req.protocol + '://' + req.get('host');
  var queryPath = req.originalUrl;
  req.jsonsilo.addStory(story, rootUrl, queryPath, function(response, status) {
    res.status(status).json(response);
  });
}


/**
 * Retrieve the given story.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveStory(req, res) {
  switch(req.accepts(['json', 'html'])) {
    case 'html':
      res.sendFile(path.resolve(__dirname + '/../../web/response.html'));
      break;
    default:
      var id = req.params.id;
      var rootUrl = req.protocol + '://' + req.get('host');
      var queryPath = req.originalUrl;
      req.jsonsilo.getStory(id, rootUrl, queryPath,
                            function(response, status) {
        res.status(status).json(response);
      });
      break;
  }
}


/**
 * Delete the given story.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function deleteStory(req, res) {
  var id = req.params.id;
  var rootUrl = req.protocol + '://' + req.get('host');
  var queryPath = req.originalUrl;
  req.jsonsilo.deleteStory(id, rootUrl, queryPath, function(response, status) {
    res.status(status).json(response);
  });
}


module.exports = router;
