/*
 * Get the *unencrypted* User data. A valid token must be provided. The data is returned in
 * in json-ld format (including the context). Only the User / owner of the Silo can access this route.
 *
 * This function may fail for one of the following reasons:
 *
 * UNAUTHORIZED         The token provided is not valid. 
 *
 * INTERNALSERVERERROR  The DB or JWT encountered an error
 *
 */

var response    = require('../responsehandler');
var async       = require('async');


module.exports = function(app, silomanager) {

  app.route('/api/me')

    .get(function(req, res) {

      var bearerHeader  = req.headers["authorization"];

      async.parallel([

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

        // Get the data
        function(callback) {

          silomanager.findAll(function(err, userData) {

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
}