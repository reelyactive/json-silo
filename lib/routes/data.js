/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

var response           = require('../responsehandler');
var express            = require('express');
var async              = require('async');
var router             = express.Router();

router.route('/')
  .put(function(req, res) {

    async.series([

      // Authenticate the User
      function(callback) { authenticateUser(req, res, callback); },

      // Replace the User data (json-LD format)
      function(callback) { replaceData(req, res, callback); },

    ],
    function(err, done) {
      sendResponse(err, res, done);
    });
  })

  .get(function(req, res) {

    async.parallel([

      // Authenticate the User
      function(callback) { authenticateUser(req, res, callback); },

      // Get the User data (json-LD format, unencrypted)
      function(callback) { getAllData(req, res, callback); },

    ],
    function(err, done) {
      sendResponse(err, res, done);
    });
  });

/**
 * Authenticates the User
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} callback to call on completion
 *
 * This function may fail for one of the following reasons:
 *
 * BADREQUEST     Invalid token syntax
 *
 * UNAUTHORIZED   Invalid token
 */
function authenticateUser(req, res, callback) {

  var bearerHeader = req.headers["authorization"];

  req.instance.silomanager.authenticate(bearerHeader, function(err, user) {
            
    if (err) {  

      if ( (err.name === 'Illegal Argument' || 
            err.name === 'JsonWebTokenError')) {
        
        var error = new Error('The token provided is not valid.')
        error.http_code = response.STATUS.BADREQUEST;
        return response.error(error, res);
      }

      return callback(err, null);
    }

    if  (user.type !== 'user') {
      var error = new Error('The token provided is not valid.')
      error.http_code = response.STATUS.UNAUTHORIZED;
      return response.error(error, res);
    }

    return callback(null, user);
  });
}

/**
 * Replaces the data (json-ld format)
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} callback to call on completion
 */
function replaceData(req, res, callback) {

  var jsonLD = req.body.jsonLD;

  req.instance.silomanager.save(jsonLD, function(err, userData) {

    if (err)
      return callback(err, null);

    return callback(null, userData);
  });
}

/**
 * Get all User data (json-ld format, unencrypted)
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} callback to call on completion
 */
function getAllData(req, res, callback) {

  req.instance.silomanager.findAll(function(err, userData) {

  if (err)
    return callback(err, null);

    return callback(null, userData);
  });
}

/**
 * Send the final response
 * @param {Object} err JSON representing the error that occured (if any)
 * @param {Array} results Array containing JSON representing of the results of the queries
 * @param {Object} req JSON request
 *
 * This function may fail for one of the following reasons:
 *
 * INTERNALSERVERERROR   The DB or JWT encountered an error
 */
function sendResponse(err, res, results) {

  if (err) {

    if (err.http_code)
      return response.error(err, res);

    var error = new Error(err);
    error.http_code = response.STATUS.INTERNALSERVERERROR;
    return response.error(error, res);
  }

  var data = results[1];
  return response.data(data, res);
}

module.exports = router;