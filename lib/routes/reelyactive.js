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
    authManager.isAuthenticated,
    function(req, res, next) {
      replaceReelyActive(req, res, next);
    }
  )

  .delete(
    authManager.isAuthenticated,
    function(req, res, next) {
      deleteReelyActive(req, res, next);
    }
  );

/**
 * Replace the reelyActive entry in the DB
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} next For the express middleware
 */
function replaceReelyActive(req, res, next) {

  req.instance.silomanager.reelyActiveRegister(function(err, reelyActive) {
    return sendResults(err, req, res, next, reelyActive);
  });
};

/**
 * Delete the reelyActive entry in the DB
 * @param {Object} res JSON response
 * @param {Object} req JSON request
 * @param {Function} next For the express middleware
 */
function deleteReelyActive(req, res, next) {

  req.instance.silomanager.reelyActiveRemove(function(err, numRemoved) {
    return sendResults(err, req, res, next, numRemoved);
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