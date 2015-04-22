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
  .get(
    authManager.isAuthenticated,
    function(req, res, next) {
      retrieveTransactions(req, res, next);
    }
  )

  .post(
    authManager.isAuthenticated,
    function(req, res, next) {
      createTransaction (req, res, next);
    }
  );

/**
 * Get all transaction logs from the DB
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} next For the express middleware
 */
function createTransaction (req, res, next) {

  async.parallel([

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
    function(callback) { logTransaction(req, res, callback); },

  ],
  function(err, results) {
    return sendResults(err, req, res, next, results[0]);
  });
};

/**
 * Create a new transaction
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} next For the express middleware
 */
function retrieveTransactions (req, res, next) {

  req.instance.silomanager.getTransactions(function(err, transactions) {
    return sendResults(err, req, res, next, transactions);
  });
};

/**
 * Log the transaction by adding it to the DB
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
function logTransaction(req, res, callback) {

  var transactionId = req.body.transactionId;
  var requestorURI  = req.body.requestorURI;
  var fields        = req.body.fields;

  if  ( (!transactionId) ||
        (!requestorURI)  ||
        (!fields) ) {

    var error = new Error('Missing request parameters');
    error.status = responseHandler.BADREQUEST;
    return callback(error, null);
  }

  // Check that the "fields" are an Array
  if (Object.prototype.toString.call( fields ) !== '[object Array]') {
    var error = new Error('The fields should be in the form of an array');
    error.status = responseHandler.BADREQUEST;
    return callback(error, null);
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
    error.status = responseHandler.BADREQUEST;
    return callback(error, null);
  }

  // Check that the "fields" are an Array format
  if (Object.prototype.toString.call( fields ) !== '[object Array]') {
    var error = new Error('The fields should be in the form of an array');
    error.status = responseHandler.BADREQUEST;
    return callback(error, null);
  }

  req.instance.silomanager.find(fields, function(err, userData) {

    if (err) {
      return callback(err, null);
    }

    return callback(null, userData);
  });
};

/**
 * Encrypt the User data requested
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
    error.status = responseHandler.BADREQUEST;
    return callback(error, null);
  }

  encryptionManager.encryptData(pubkey, data, function(err, encrypted) {

    if (err) {
      return callback(err, null);
    }

    return callback(null, encrypted);
  });
};

/**
 * Send the final results
 * @param {Object} err Error object
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} next For the express middleware
 * @param {Object} results JSON representing the results
 */
function sendResults(err, req, res, next, results) {

  var rootUrl = req.protocol + '://' + req.get('host');
  var queryPath = req.originalUrl;
  var status = null;
  var response = null;

  if (err) {
    return next(err);
  }

  else {
    status = responseHandler.OK;
    response = responseHandler.prepareResponse( status,
                                                rootUrl,
                                                queryPath,
                                                results
                                              );

    return res.status(status).json(response);
  }
};

module.exports = router;