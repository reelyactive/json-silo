/*
 * Gets the public information.
 *
 * This function may fail for one of the following reasons:
 *
 * INTERNALSERVERERROR  The DB or JWT encountered an error
 *
 */

var response    = require('../responsehandler');

module.exports = function(app, silomanager) {

  app.route('/api/public')

    .get(function(req, res) {

      silomanager.getPublic(function(err, publicInfo) {

        if (err) {

          if (err.http_code)
            return response.error(err, res);

          var error = new Error(err);
          error.http_code = response.STATUS.INTERNALSERVERERROR;
          return response.error(error, res);
        }

        return response.data(publicInfo, res);
      });
    });
}