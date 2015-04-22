/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */
 
var responseHandler    = require('../responsehandler');
var express            = require('express');
var async              = require('async');
var router             = express.Router();
var authManager        = require('../authmanager');

router.route('/')
  .put(

    // Only the User can access this
    function(req, res, next) { req.userType = 'user'; next(); },

    authManager.isAuthenticated,
    
    function(req, res, next) {
      replacePublic(req, res, function(err, publicData) {
        sendResults(err, req, res, next, publicData)
      });
  })

  .get(function(req, res, next) {
    getPublic(req, res, function(err, publicData) {
      sendResults(err, req, res, next, publicData)
    });
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
    error.status = responseHandler.BADREQUEST;
    return callback(error, null);
  }

  if ( Object.prototype.toString.call(publicFields) !== '[object Array]' ) {
    var error = new Error('The fields provided are not valid')
    error.status = responseHandler.BADREQUEST;
    return callback(error, null);
  }

  req.instance.silomanager.setPublic(publicFields, function(err, publicFields) {

    if (err) {

      if (err.name === 'Illegal Argument') {
        var error = new Error('The fields provided are not valid')
        error.status = responseHandler.BADREQUEST;
        return callback(error, null);
      }

      return callback(err, null);
    }
    return callback(null, publicFields);
  });
};

/**Get the public information.
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} callback to call on completion
 */
function getPublic(req, res, callback) {

  req.instance.silomanager.getPublic(function(err, publicData) {

    if (err) {
      return callback(err, null);
    }

    return callback(null, publicData);
  });
};

/**
 * Sends the final results
 * @param {Object} err Error object
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} next For the express middleware
 * @param {Object} publicData JSON representing the public data
 */
function sendResults(err, req, res, next, publicData) {

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
                                                publicData
                                              );

    return res.status(status).json(response);
  }
};

module.exports = router;