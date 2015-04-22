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

    authManager.isAuthenticated,
    function(req, res, next) {
      replaceReelyActive(req, res, function(err, reelyActive) {
        sendResults(err, req, res, next, reelyActive);
      });
  })

  .delete(
    authManager.isAuthenticated,
    function(req, res, next) {
      deleteReelyActive(req, res, function(err, deleted) {
        sendResults(err, req, res, next, deleted);
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

    if (err) {
      return callback(err, null);
    }

    return callback(null, reelyActive);
  });
};

/**
 * Delete the reelyActive entry in the DB
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} callback to call on completion
 */
function deleteReelyActive(req, res, callback) {

  req.instance.silomanager.reelyActiveRemove(function(err, numRemoved) {

    if (err) {
      return callback(err);
    }

    if (numRemoved !== 1) {
      var error = new Error('Could not unregister from the reelyActive service');
      error.status = responseHandler.INTERNALSERVERERROR;
      return callback(err, null);
    }

    return callback(null, numRemoved);
  });
};

/**
 * Sends the final results
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