/*
 * Register for the reelyActive service. This can only be done by
 * the User. A valid token must be provided. On success, the reelyActive
 * token is sent.
 *
 * This function may fail for one of the following reasons:
 *
 * UNAUTHORIZED         The token and/or password were not valid
 *
 * INTERNALSERVERERROR  The DB or JWT encountered an error
 *
 */

var response    = require('../responsehandler');
var async       = require('async');

module.exports = function(app, silomanager) {

	app.route('/api/reelyActive')

		.put(function(req, res) {
      
      var bearerHeader  = req.headers["authorization"];

      async.series([

        // Make sure that the User has
        // provided a valid token
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

        // Register for reelyActive
        function(callback) {

          silomanager.reelyActiveRegister(function(err, reelyActive) {

            if (err) 
              return callback(err, null);

            return callback(null, reelyActive);
          });
        },
      ], 
      function(err, results) {

        if (err) {

          console.log(err);

          if (err.http_code)
            return response.error(err, res);

          var error = new Error(err);
          error.http_code = response.STATUS.INTERNALSERVERERROR;
          return response.error(error, res);
        }

        var data = { "token" : results[1].token };
        return response.data(data, res);
      });
		});
}