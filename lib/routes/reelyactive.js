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
      replaceReelyActive(req, res, function(err, reelyActive) {
        sendResponse(err, res, reelyActive);
      });
  })

  .delete(
    authManager.isAuthenticated,
    function(req, res) {
      deleteReelyActive(req, res, function(err, reelyActive) {
        sendResponse(err, res, reelyActive);
      });
  });

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

  var data = results;
  return response.data(data, res);
}

module.exports = router;