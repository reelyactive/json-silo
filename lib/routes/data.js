/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

var response           = require('../responsehandler');
var express            = require('express');
var async              = require('async');
var router             = express.Router();
var authManager        = require('../authmanager');

router.route('/')
  .put(

    authManager.isAuthenticated,
    function(req, res) {
      replaceData(req, res, function(err, userData) {
        sendResponse(err, res, userData);
      });
  })

  .get(
    authManager.isAuthenticated,
    function(req, res) {
      getAllData(req, res, function(err, userData) {
        sendResponse(err, res, userData);
      });
  });

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

  var data = results;
  return response.data(data, res);
}

module.exports = router;