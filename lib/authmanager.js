var passport        = require('passport');
var BearerStrategy  = require('passport-http-bearer').Strategy;
var responseHandler = require('./responsehandler');


/**
 * Authenticates the User or reelyActive using the bearer strategy
 */
passport.use(new BearerStrategy({ "passReqToCallback": true },

  function(req, token, callback) {

    if (!token) { 
    	return callback(null, false); 
    }

    req.instance.silomanager.authenticate(token, function(err, user) {
    	
      if (err) { 
      	return callback(err); 
      }

      if (!user) { 
      	return callback(null, false); 
      }

      if ( (req.userType) && (user.type !== req.userType) ) { 
      	return callback(null, false); 
      }

      callback(null, user);
    });
  }
));

exports.isAuthenticated = passport.authenticate('bearer', { session: false });