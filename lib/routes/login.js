/*
 * Login a User. If no user exists, create a new one. A valid email & password must
 * be provided. On success, the User token is returned.
 *
 * This function may fail for one of the following reasons:
 *
 * BADREQUEST         The email is not valid.
 *                    No password provided.
 *
 * UNAUTHORIZED       A User already exists & the emails don;t match
 *                    The password is invalid    
 *
 * INTERNALSERVERERROR  The DB or JWT encountered an error
 *
 */
var response    = require('../responsehandler');

module.exports = function(app, silomanager) {

  app.route('/api/login')

    .put(function(req, res) {

      var email = req.body.email;
      var password = req.body.password;

      if (!password) {
        var error = new Error('No password provided');
        error.http_code = response.STATUS.BADREQUEST;
        return response.error(error, res);
      }

      silomanager.login(email, password, function(err, token) {

        if (err) {

          if (err.http_code)
            return response.error(err, res);

          var error = new Error(err);
          error.http_code = response.STATUS.INTERNALSERVERERROR;
          return response.error(error, res);
        }

        var data = { "token" : token };
        return response.data(data, res);
      })
    });
}