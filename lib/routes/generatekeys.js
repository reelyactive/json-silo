/*
 * Generate a new public / private key pair. This can only be done by
 * the User. A valid token & password must be provided. On success, the 
 * private & public keys are saved in the root directory as seperate files.
 *
 * This function may fail for one of the following reasons:
 *
 * UNAUTHORIZED         The token and/or password were not valid
 *                      reelyActive is making the request
 *
 * BADREQUEST           No password provided
 *
 * INTERNALSERVERERROR  The DB, JWT or openpgp encountered an error
 *
 */

var response    = require('../responsehandler');
var async       = require('async');

module.exports = function(app, silomanager) {

	app.route('/api/keygen')

		.put(function(req, res) {
      
      var password      = req.body.password;
      var bearerHeader  = req.headers["authorization"];

      if (!password) {
        var error = new Error('No password provided.')
        error.http_code = response.STATUS.BADREQUEST;
        return response.error(error, res);
      }


      async.waterfall([

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

        // Make sure that the User has 
        // provided a valid password 
        function(user, callback) {

          silomanager.validPass(password, user.password, function(err, isMatch) {

            if (err) 
              return callback(err, null);

            if (!isMatch) {
              var error = new Error('The password provided is not valid.')
              error.http_code = response.STATUS.UNAUTHORIZED;
              return response.error(error, res);
            }

            return callback(null, user);
          });
        },

        // Generate the keys
        function(user, callback) {

          silomanager.keygen(user.email, password, function(err) {

            if (err) 
              return callback(err, null);

            return callback(null, true)
          });
        }
      ], 
      function(err, done) {

        if (err) {

          if (err.http_code)
            return response.error(err, res);

          var error = new Error(err);
          error.http_code = response.STATUS.INTERNALSERVERERROR;
          return response.error(error, res);
        }

        var data = 'New public/private key pair generated';
        return response.data(data, res);
      });
		});
}