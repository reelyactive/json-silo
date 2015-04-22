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
      replacePublic(req, res, next);
    }
  )

  .get(
    function(req, res, next) {
      retrievePublic(req, res, next);
    }
  );

/**
 * Replace the public field entries in the DB
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} next For the express middleware
 *
 * This function may fail for one of the following reasons:
 *
 * BADREQUEST     Invalid "fields" syntax
 *                No such fields exist in the data.
 */
function replacePublic(req, res, next) {

  var publicFields  = req.body.public;

  if (!publicFields) {
    var error = new Error('No fields provided')
    error.status = responseHandler.BADREQUEST;
    return next(error);
  }

  if ( Object.prototype.toString.call(publicFields) !== '[object Array]' ) {
    var error = new Error('The fields provided are not valid')
    error.status = responseHandler.BADREQUEST;
    return next(error);
  }

  req.instance.silomanager.setPublic(publicFields, function(err, publicData) {

    if (err) {

      if (err.name === 'Illegal Argument') {
        var error = new Error('The fields provided are not valid')
        error.status = responseHandler.BADREQUEST;
        return next(error);
      }

      return next(error);
    }

    return sendResults(err, req, res, next, publicData);
  });
};

/**Get the public information.
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} next For the express middleware
 */
function retrievePublic(req, res, next) {

  req.instance.silomanager.getPublic(function(err, publicData) {

    return sendResults(err, req, res, next, publicData);
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