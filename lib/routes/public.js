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
      replacePublic(req, res, function(err, publicFields) {
        sendResponse(err, res, publicFields);
      });
  })

  .get(function(req, res) {
    getPublic(req, res);
  });

/**
 * Replace the public field entries in the DB
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} callback to call on completion
 *
 * This function may fail for one of the following reasons:
 *
 * BADREQUEST     Invalid "fields" syntax
 *                No such fields exist in the data.
 */
function replacePublic(req, res, callback) {

  var publicFields  = req.body.public;

  if (!publicFields) {
    var error = new Error('No fields provided')
    error.http_code = response.STATUS.BADREQUEST;
    return response.error(error, res);
  }

  if ( Object.prototype.toString.call(publicFields) !== '[object Array]' ) {
    var error = new Error('The fields provided are not valid')
    error.http_code = response.STATUS.BADREQUEST;
    return response.error(error, res);
  }

  req.instance.silomanager.setPublic(publicFields, function(err, publicFields) {

    if (err) {

      if (err.name === 'Illegal Argument') {
        var error = new Error('The fields provided are not valid')
        error.http_code = response.STATUS.BADREQUEST;
        return response.error(error, res);
      }

      return callback(err, null);
    }

    return callback(null, publicFields);
  });
}

/**Get the public information.
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 */
function getPublic(req, res) {

  req.instance.silomanager.getPublic(function(err, publicInfo) {

    if (err) {

      if (err.http_code)
        return response.error(err, res);

      var error = new Error(err);
      error.http_code = response.STATUS.INTERNALSERVERERROR;
      return response.error(error, res);
    }

    return response.data(publicInfo, res);
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