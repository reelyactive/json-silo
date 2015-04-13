var response           = require('../responsehandler');
var express            = require('express');
var async              = require('async');
var router             = express.Router();

router.route('/')
  .put(function(req, res) {

      async.series([

        // Authenticate the User
        function(callback) { authenticate(req, res, callback); },

        // Replace the User data (json-LD format)
        function(callback) { replaceData(req, res, callback); },

      ],
      function(err, done) {
        sendResponse(err, res, done);
      });
    });


/**
 * Authenticates the User
 * @param {Object} res The response to send
 * @param {Object} req The request sent
 * @param {function} callback to call on completion
 *
 * This function may fail for one of the following reasons:
 *
 * BADREQUEST     Invalid token syntax
 *
 * UNAUTHORIZED   Invalid token
 */
function authenticate(req, res, callback) {

  var bearerHeader = req.headers["authorization"];

  req.instance.silomanager.authenticate(bearerHeader, function(err, user) {
            
    if (err) {  

      if ( (err.name === 'Illegal Argument' || 
            err.name === 'JsonWebTokenError')) {
        
        var error = new Error('The token provided is not valid.')
        error.http_code = response.STATUS.BADREQUEST;
        return response.error(error, res);
      }

      return callback(err, null);
    }

    if  (user.type !== 'user') {
      var error = new Error('The token provided is not valid.')
      error.http_code = response.STATUS.UNAUTHORIZED;
      return response.error(error, res);
    }

    return callback(null, user);
  });
}

/**
 * Authenticates the User
 * @param {Object} res The response to send
 * @param {Object} req The request sent
 * @param {function} callback to call on completion
 */
function replaceData(req, res, callback) {

  var jsonLD = req.body.jsonLD;

  req.instance.silomanager.save(jsonLD, function(err, userData) {

    if (err)
      return callback(err, null);

    return callback(null, userData);
  });
}

/**
 * Sends the final response
 * @param {Object} err The error that occured (if any)
 * @param {Object} req The request sent
 * @param {Object} results of the query
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

  var data = results[1];
  return response.data(data, res);
}

module.exports = router;

/*module.exports = function(app, silomanager) {

  app.route('/api/me')

    .put(function(req, res) {

      var bearerHeader  = req.headers["authorization"];
      var jsonLD        = req.body.jsonLD;

      async.series([

        // Authenticate the User
        function(callback) {

          silomanager.authenticate(bearerHeader, function(err, user) {
            
            if (err) { 

              if ( (err.name === 'Illegal Argument' || 
                    err.name === 'JsonWebTokenError')) {

                var error = new Error('The token provided is not valid.')
                error.http_code = response.STATUS.UNAUTHORIZED;
                return response.error(error, res);
              }

              return callback(err, null);
            }

            if  (user.type !== 'user') {
              var error = new Error('The token provided is not valid.')
              error.http_code = response.STATUS.UNAUTHORIZED;
              return response.error(error, res);
            }

            return callback(null, user);
          });
        },

        // Save the data provided
        function(callback) {

          silomanager.save(jsonLD, function(err, userData) {

            if (err)
              return callback(err, null);

            return callback(null, userData);
          });
        },
      ],
      function(err, results) {

        if (err) {

          if (err.http_code)
            return response.error(err, res);

          var error = new Error(err);
          error.http_code = response.STATUS.INTERNALSERVERERROR;
          return response.error(error, res);
        }

        response.data(results[1], res);
      });
    });
}*/