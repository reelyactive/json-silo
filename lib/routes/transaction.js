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
  .get(
    authManager.isAuthenticated,
    function(req, res) {
       getTransactions(req, res, function(err, transactions) {
        sendResponse(err, res, transactions);
      });
  })

  .post(
    authManager.isAuthenticated,
    function(req, res) {

      async.parallel([

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

        // Log the transaction
        function(callback) { createTransaction(req, res, callback); },

      ],
      function(err, results) {
        sendResponse(err, res, results[0]);
      });
  });

/**
 * Get all transactions from the DB
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} callback to call on completion
 */
function getTransactions (req, res, callback) {

  req.instance.silomanager.getTransactions(function(err, transactions) {
    
    return callback(err, transactions);
  });
};

/**
 * Get the User data requested (json-ld format)
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} callback to call on completion
 *
 * This function may fail for one of the following reasons:
 *
 * BADREQUEST     Missing request parameters
 *                Invalid sytax for fields requested
 *                
 */
function createTransaction(req, res, callback) {

  var transactionId = req.body.transactionId;
  var requestorURI  = req.body.requestorURI;
  var fields        = req.body.fields;

  if  ( (!transactionId) ||
        (!requestorURI)  ||
        (!fields) ) {

    var error = new Error('Missing request parameters');
    error.http_code = response.STATUS.BADREQUEST;
    return response.error(error, res);
  }

  // Check that the "fields" are an Array
  if (Object.prototype.toString.call( fields ) !== '[object Array]') {
    var error = new Error('The fields should be in the form of an array');
    error.http_code = response.STATUS.BADREQUEST;
    return response.error(error, res);
  }

  req.instance.silomanager.saveTransaction(transactionId, requestorURI, fields, function(err, transaction) {
    return callback(err, transaction);
  });
};

/**
 * Get the User data requested (json-ld format)
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} callback to call on completion
 *
 * This function may fail for one of the following reasons:
 *
 * BADREQUEST     Invalid sytax for fields requested
 */
function getData(req, res, callback) {

  var fields = req.body.fields;

  if (!fields) {
    var error = new Error('No fields to return provided');
    error.http_code = response.STATUS.BADREQUEST;
    return response.error(error, res);
  }

  // Check that the "fields" are an Array format
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
};

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
};

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

  var data = results;
  return response.data(data, res);
};

module.exports = router;