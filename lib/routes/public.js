var response           = require('../responsehandler');
var express            = require('express');
var async              = require('async');
var router             = express.Router();

router.route('/')
  .put(function(req, res) {

    async.series([

      // Authenticate the User
      function(callback) { authenticateUser(req, res, callback); },

      // Replace the public fields
      function(callback) { replacePublic(req, res, callback); },

    ],
    function(err, results) {
      sendResponse(err, res, results);
    });
  })

  .get(function(req, res) {

    getPublic(req, res);
  });

/**
 * Replace the public field entries in the DB
 * @param {Object} res The response to send
 * @param {Object} req The request sent
 * @param {function} callback to call on completion
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
    error.http_code = response.STATUS.BADREQUEST;
    return response.error(error, res);
  }

  if ( Object.prototype.toString.call(publicFields) !== '[object Array]' ) {
    var error = new Error('The fields provided are not valid')
    error.http_code = response.STATUS.BADREQUEST;
    return response.error(error, res);
  }

  req.instance.silomanager.setPublic(publicFields, function(err, publicFields) {

    if (err) {

      if (err.name === 'Illegal Argument') {
        var error = new Error('The fields provided are not valid')
        error.http_code = response.STATUS.BADREQUEST;
        return response.error(error, res);
      }

      return callback(err, null);
    }

    return callback(null, publicFields);
  });
}

/**Get the public information.
 * @param {Object} res The response to send
 * @param {Object} req The request sent
 */
function getPublic(req, res) {

  req.instance.silomanager.getPublic(function(err, publicInfo) {

    if (err) {

      if (err.http_code)
        return response.error(err, res);

      var error = new Error(err);
      error.http_code = response.STATUS.INTERNALSERVERERROR;
      return response.error(error, res);
    }

    return response.data(publicInfo, res);
  });
}

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
function authenticateUser(req, res, callback) {

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
 * Send the final response
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

  app.route('/api/public')

  	.put(function(req, res) {

      var bearerHeader  = req.headers["authorization"];
      var publicFields  = req.body.public;

      //Make sure publicFields is an array
      if ( Object.prototype.toString.call(publicFields) !== '[object Array]' ) {

        var error = new Error('The fields provided are not valid')
        error.http_code = response.STATUS.BADREQUEST;
        return response.error(error, res);
      }

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

        // Set the public fields
        function(callback) {

          silomanager.setPublic(publicFields, function(err, publicFields) {

            if (err) {

              if (err.name === 'Illegal Argument') {
                var error = new Error('The fields provided are not valid')
                error.http_code = response.STATUS.BADREQUEST;
                return response.error(error, res);
              }

              return callback(err, null);
            }

            return callback(null, publicFields);
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