/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */

var response  = require('../responsehandler');
var express   = require('express');
var router    = express.Router();

router.route('/')
  .put(function(req, res) {    
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

   req.instance.silomanager.login(email, password, function(err, token) {

      if (err) {

        if (err.http_code)
          return response.error(err, res);

        var error = new Error(err);
        error.http_code = response.STATUS.INTERNALSERVERERROR;
        return response.error(error, res);
      }

      var data = { "token" : token };
      return response.data(data, res);
    });
 }


module.exports = router;