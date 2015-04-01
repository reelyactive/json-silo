/*
 * Get the *encrypted* User data. A valid token must be provided. The data is encrypted using the public key 
 * sent with the request. Only the fields requested are sent over. Both reelyActive & the User can access this route.
 *
 * This function may fail for one of the following reasons:
 *
 * UNAUTHORIZED         The token provided is not valid. 
 *
 * BADREQUEST			      No public key provided.
 *						          No fields provided (as an array)
 *
 * INTERNALSERVERERROR  The DB or JWT encountered an error
 *
 */

var response    = require('../responsehandler');
var async       = require('async');


module.exports = function(app, silomanager) {

  app.route('/api/encrypted')

    .post(function(req, res) {

      var bearerHeader  = req.headers["authorization"];
      var pubkey		= req.body.pubkey;
      var fields		= req.body.fields;


      // Make sure that a public key an a 
      // valid field array have been provided
      if (!pubkey) {
        var error = new Error('No public key provided');
        error.http_code = response.STATUS.BADREQUEST;
        return response.error(error, res);
      }

      if (!fields) {
        var error = new Error('No fields to return provided');
        error.http_code = response.STATUS.BADREQUEST;
        return response.error(error, res);
      }

      if (Object.prototype.toString.call( fields ) !== '[object Array]') {
        var error = new Error('The fields should be in the form of an array');
        error.http_code = response.STATUS.BADREQUEST;
        return response.error(error, res);
      }

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

            return callback(null, user);
          });
        },

        // Get & encrypt the data
        function(callback) {

          async.waterfall([

            // Get the data requested
            function(callback) {

              silomanager.find(fields, function(err, userData) {

                if (err)
                  return callback(err, null);

                return callback(null, userData);
              });
            },

            // Enrypt the data
            function(userData, callback) {

              silomanager.encryptData(pubkey, userData, function(err, encrypted) {

                if (err)
                  return callback(err, null);

                return callback(null, encrypted);
              });
            },
          ],
          function(err, encrypted) {
            return callback(err, encrypted);
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

        return response.data(results[1], res);
      });
    });
}