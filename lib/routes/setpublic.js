/*
 * Set the fields of the User Data that are public. A valid token must be provided. 
 * Only the User / owner of the Silo can access this route.
 *
 * This function may fail for one of the following reasons:
 *
 * UNAUTHORIZED         The token provided is not valid. 
 *
 * BADREQUEST			The fields provided are invalid.
 *
 * INTERNALSERVERERROR  The DB or JWT encountered an error
 *
 */

var response    = require('../responsehandler');
var async       = require('async');

module.exports = function(app, silomanager) {

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
}