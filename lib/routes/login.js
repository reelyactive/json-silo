/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

var responseHandler  = require('../responsehandler');
var auth             = require('../authmanager');
var express          = require('express');
var router           = express.Router();

router.route('/')
  .put(
    function(req, res) {
      passwordExists(req, res);
      login(req, res);
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
 function passwordExists(req, res) {

  var password = req.body.password;

  if (!password) {
    var error = new Error('No password provided');
    error.http_code = response.STATUS.BADREQUEST;
    return response.error(error, res);
  }
}

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
function login (req, res) {

  var email = req.body.email;
  var password = req.body.password;
  var rootUrl = req.protocol + '://' + req.get('host');
  var queryPath = req.originalUrl;
  var status = null;

  req.instance.silomanager.login(email, password, function(err, token) {

    if (err) {

      console.log('++++++++++++++++++++');
      if (err.http_code)
        status = responseHandler.OK;
      else
        status = responseHandler.INTERNALSERVERERROR

      var response = responseHandler.prepareResponse( status,
                                                      rootUrl,
                                                      queryPath,
                                                      null
                                                    );
    } 
    else {
      status = responseHandler.OK;
      var response = responseHandler.prepareResponse( status,
                                                      rootUrl,
                                                      queryPath,
                                                      token
                                                    );
    }
    return res.status(status).json(response);
  });
 }


module.exports = router;