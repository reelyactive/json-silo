/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

var express = require('express');
var path = require('path');
var responseHandler = require('../responsehandler');


var router = express.Router();


router.route('/directory/:directory')
  .get(function(req, res) {
    retrieveContextAtDirectory(req, res);
  });


/**
 * Retrieve the context at a given directory value.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveContextAtDirectory(req, res) {
  switch(req.accepts(['json', 'html'])) {
    // TODO: support HTML in future
    //case 'html':
    //  res.sendFile(path.resolve(__dirname + '/../../web/response.html'));
    //  break;
    default:
      var directory = req.param('directory');
      var rootUrl = req.protocol + '://' + req.get('host');
      var queryPath = req.originalUrl;
      req.jsonsilo.getDirectoryContext(directory, rootUrl, queryPath,
                                       function(response, status) {
        res.status(status).json(response);
      });
      break;
  }
}


module.exports = router;
