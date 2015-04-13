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

      // Replace the reelyActive entry
      function(callback) { replaceReelyActive(req, res, callback); },

    ],
    function(err, results) {
      sendResponse(err, res, results);
    });
  })

  .delete(function(req, res) {

    async.series([

      // Authenticate the User
      function(callback) { authenticateUser(req, res, callback); },

      // Delete the reelyActive entry
      function(callback) { deleteReelyActive(req, res, callback); },

    ],
    function(err, results) {
      sendResponse(err, res, results);
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
 * Replace the reelyActive entry in the DB
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} callback to call on completion
 */
function replaceReelyActive(req, res, callback) {

  req.instance.silomanager.reelyActiveRegister(function(err, reelyActive) {

    if (err) 
      return callback(err, null);

    return callback(null, reelyActive);
  });
}

/**
 * Delete the reelyActive entry in the DB
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} callback to call on completion
 */
function deleteReelyActive(req, res, callback) {

  req.instance.silomanager.reelyActiveRemove(function(err, numRemoved) {

    if (err) 
      return callback(err);

    if (numRemoved !== 1) {
      var error = new Error('Could not unregister from the reelyActive service');
      error.http_code = response.STATUS.INTERNALSERVERERROR;
      return response.error(error, res);
    }

    return callback(null, numRemoved);
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

  var data = { "token" : results[1].token };
  return response.data(data, res);
}

module.exports = router;