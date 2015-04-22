/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

var responseHandler  = require('../responsehandler');
var auth             = require('../authmanager');
var express          = require('express');
var async            = require('async');
var router           = express.Router();

router.route('/')
  .put(
    function(req, res, next) {
      async.series([
        function(callback) { passwordExists(req, res, callback); },
        function(callback) { login(req, res, callback); },
      ],
      function(err, results) {
        return sendResults(err, req, res, next, results)
      });
    });

/**
 * Checks whether a password has been provided.
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 *
 * This function may fail for one of the following reasons:
 *
 * BADREQUEST   No password provided.
 */
 function passwordExists(req, res, callback) {

  var password = req.body.password;

  if (!password) {
    var error = new Error('No password provided');
    error.status = responseHandler.BADREQUEST;
    return callback(error);
  }

  return callback(null);
};

/**
 * Attempts to login in the User
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {String} password
 *
 * This function may fail for one of the following reasons:
 *
 * INTERNALSERVERERROR   The DB or JWT encountered an error
 */
function login (req, res, callback) {

  var email = req.body.email;
  var password = req.body.password;
  

  req.instance.silomanager.login(email, password, function(err, token) {

    if (err) {
      return callback(err);
    }
    else {
      return callback(null, token);
    }
  });
};

/**
 * Sends the final results
 * @param {Object} err Error object
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} next For the express middleware
 * @param {Array} results Representing the results of the queries (see async)
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
                                                results[1]
                                              );

    return res.status(status).json(response);
  }
};

module.exports = router;