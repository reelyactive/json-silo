/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

var responseHandler    = require('../responsehandler');
var express            = require('express');
var router             = express.Router();
var authManager        = require('../authmanager');

router.route('/')
  .put(

    // Only the User can access this
    function(req, res, next) {
      req.userType = 'user'; 
      next(); 
    },

    authManager.isAuthenticated,

    function(req, res, next) {
      replaceData(req, res, next);
    }
  )

  .get(

    // Only the User can access this
    function(req, res, next) { 
      req.userType = 'user'; next(); 
    },

    authManager.isAuthenticated,

    function(req, res, next) {
      retrieveAllData(req, res, next);
    }
  );

/**
 * Replaces the data (json-ld format)
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} next For the express middleware
 */
function replaceData(req, res, next) {

  var jsonLD = req.body.jsonLD;

  req.instance.silomanager.save(jsonLD, function(err, userData) {
      return sendResults(err, req, res, next, userData);
  });
};

/**
 * Get all User data (json-ld format, unencrypted)
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} next For the express middleware
 */
function retrieveAllData(req, res, next) {

  req.instance.silomanager.findAll(function(err, userData) {
    return sendResults(err, req, res, next, userData);
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

  if (err) {
    return next(err);
  }

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