/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

var responseHandler    = require('../responsehandler');
var EncryptionManager  = require('../encryptionmanager');
var express            = require('express');
var async              = require('async');
var authManager        = require('../authmanager');
var router             = express.Router();

router.route('/')
  .put(
    
    authManager.isAuthenticated,
    function(req, res, next) {
      async.series([

        // Check that the User has provided a valid password
        function(callback) { checkPassword(req, res, req.user, callback); },

        // Generate the keys
        function(callback) { replaceKeys(req, res, req.user, callback); },

      ],
      function(err, results) {
        sendResults(err, req, res, next, results)
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
    error.status = responseHandler.BADREQUEST;
    return callback(error, null);
  }

  encryptionManager.validPass(password, user.password, function(err, isMatch) {

    if (err) 
      return callback(err, null);

    if (!isMatch) {
      var error = new Error('The password provided is not valid.')
      error.status = responseHandler.UNAUTHORIZED;
      return callback(error, null);
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
 * Sends the final results
 * @param {Object} err Error object
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} next For the express middleware
 * @param {Array} results Representing the results of the queries (check async lib)
 */
function sendResults(err, req, res, next, results) {

  var rootUrl = req.protocol + '://' + req.get('host');
  var queryPath = req.originalUrl;
  var status = null;
  var response = null;

  if (err)
    return next(err);

  else {
    status = responseHandler.OK;
    response = responseHandler.prepareResponse( status,
                                                rootUrl,
                                                queryPath,
                                                results[1]
                                              );

    return res.status(status).json(response);
  }
};

module.exports = router;