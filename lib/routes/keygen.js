/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

var response           = require('../responsehandler');
var EncryptionManager  = require('../encryptionmanager');
var express            = require('express');
var async              = require('async');
var authManager        = require('../authmanager');
var router             = express.Router();

router.route('/')
  .put(
    
    authManager.isAuthenticated,
    function(req, res) {
      async.series([

        // Check that the User has provided a valid password
        function(callback) { checkPassword(req, res, req.user, callback); },

        // Generate the keys
        function(callback) { replaceKeys(req, res, req.user, callback); },

      ],
      function(err, done) {
        sendResponse(err, res, done);
      });
    });

/**
 * Checks whether a password has been provided.
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} callback to call on completion
 * @param {Object} user JSON representing the User
 *
 * This function may fail for one of the following reasons:
 *
 * BADREQUEST     No password provided.
 *
 * UNAUTHORIZED   Password is invalid.
 */
 function checkPassword(req, res, user, callback) {

  var encryptionManager = new EncryptionManager();
  var password = req.body.password;

  if (!password) {
    var error = new Error('No password provided');
    error.http_code = response.STATUS.BADREQUEST;
    return response.error(error, res);
  }

  encryptionManager.validPass(password, user.password, function(err, isMatch) {

    if (err) 
      return callback(err, null);

    if (!isMatch) {
      var error = new Error('The password provided is not valid.')
      error.http_code = response.STATUS.UNAUTHORIZED;
      return response.error(error, res);
    }

    return callback(null, user);
  });
}

/**
 * Creates a public/private key pair and saves them in the root folder.
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} callback to call on completion
 * @param {Object} user JSON representing the User
 *
 * This function may fail for one of the following reasons:
 *
 * BADREQUEST     No password provided.
 *
 * UNAUTHORIZED   Password is invalid.
 */
function replaceKeys(req, res, user, callback) {

  var encryptionManager = new EncryptionManager();
  var password = req.body.password;

  encryptionManager.keygen(user.email, password, function(err) {

    if (err) 
      return callback(err, null);

    return callback(null, true)
  });
}

/**
 * Sends the final response
 * @param {Object} err JSON representing the error that occured (if any)
 * @param {Object} res JSON response
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

  var data = 'New public/private key pair generated';
  return response.data(data, res);
}

module.exports = router;