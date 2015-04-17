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
      replaceData(req, res, function(err, userData) {
        sendResults(err, req, res, next, userData);
      });
  })

  .get(

    // Only the User can access this
    function(req, res, next) { req.userType = 'user'; next(); },

    authManager.isAuthenticated,

    function(req, res, next) {
      getAllData(req, res, function(err, userData) {
        sendResults(err, req, res, next, userData);
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
};

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
};

/**
 * Sends the final results
 * @param {Object} err Error object
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} next For the express middleware
 * @param {Object} userData JSON representing the user data
 */
function sendResults(err, req, res, next, userData) {

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
                                                userData
                                              );

    return res.status(status).json(response);
  }
};

module.exports = router;