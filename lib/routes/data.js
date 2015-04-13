/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

var response           = require('../responsehandler');
var EncryptionManager  = require('../encryptionmanager');
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


router.route('/encrypted')
  .post(function(req, res) {

    async.parallel([

      // Authenticate the reelyActive
      function(callback) { authenticateReelyActive(req, res, callback); },

      // Get & encrypt the data requested
      function(callback) {

        async.waterfall([
          
          // Get the data requested
          function(callback) { getData(req, res, callback); },

          // Encrypt the data
          function(data, callback) { getEncrypted(req, res, data, callback); },

        ],
        function(err, encrypted) {
          return callback(err, encrypted)
        });
      },
    ],
    function(err, results) {
      sendResponse(err, res, results);
    });
  })

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
 * Authenticates reelyActive
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
function authenticateReelyActive(req, res, callback) {

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

    if  (user.type !== 'reelyActive') {
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
 * Get the User data requested (json-ld format)
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} callback to call on completion
 */
function getData(req, res, callback) {

  var fields = req.body.fields;

  if (!fields) {
    var error = new Error('No fields to return provided');
    error.http_code = response.STATUS.BADREQUEST;
    return response.error(error, res);
  }

  // Check that the "fields" are in Array format
  if (Object.prototype.toString.call( fields ) !== '[object Array]') {
    var error = new Error('The fields should be in the form of an array');
    error.http_code = response.STATUS.BADREQUEST;
    return response.error(error, res);
  }

  req.instance.silomanager.find(fields, function(err, userData) {

    if (err)
      return callback(err, null);

    return callback(null, userData);
  });
}

/**
 * Encrypts the User data requested
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} callback to call on completion
 * @param {Object} data JSON-LD representing the data to encrypt
 */
function getEncrypted(req, res, data, callback) {

  var encryptionManager = new EncryptionManager();
  var pubkey = req.body.pubkey;

  if (!pubkey) {
    var error = new Error('No public key provided');
    error.http_code = response.STATUS.BADREQUEST;
    return response.error(error, res);
  }

  encryptionManager.encryptData(pubkey, data, function(err, encrypted) {

    if (err)
      return callback(err, null);

    return callback(null, encrypted);
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