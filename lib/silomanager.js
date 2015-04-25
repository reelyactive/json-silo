/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */

var nedb               = require('nedb');
var SILO_DB            = 'silo.db';
var jwt                = require('jsonwebtoken');
var async              = require('async');
var crypto             = require('crypto');
var jsonld             = require('jsonld');
var responseHandler    = require('./responsehandler');
var EncryptionManager  = require('./encryptionmanager');

var VALID_EMAIL_SYNTAX = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

var CONTEXT = {
  "schema": "http://schema.org/",
  "dbpedia": "http://dbpedia.org/page/"
};

/**
 * SiloManager Class
 * Manages the persistent JSON entries
 * @constructor
 */
function SiloManager() {
  var self = this;

  self.db = new nedb({filename: SILO_DB, autoload: true });
  self.encryptionmanager = new EncryptionManager();

  // Generate a random secret for use with JWT (i.e. token authentication)
  // For monre info, read this: http://angular-tips.com/blog/2014/05/json-web-tokens-examples/
  // and this http://www.sitepoint.com/using-json-web-tokens-node-js/
  crypto.randomBytes(2048, function(ex, buf) {
    self.JWT_SECRET = buf;
  });
};

/**
 * Sign-up a user.
 * @param {String} email
 * @param {String} password
 * @param {String} type String representing whether it is reelyActive registering or a regular User
 * @param {Function} callback Function to call on completion.
 *
 */
SiloManager.prototype.signup = function(email, password, type, callback) {

  var self = this;

  if (!self.validEmail(email)) {
    var error = new Error('The email address is malformed');
    error.status = responseHandler.BADREQUEST;
    return callback(error, null);
  }

  // Create a hashed password
  self.encryptionmanager.encryptPass(password, function(err, hash) {

    if (err) { 
      return callback(err, null);
    }

    var userDetails = {
      "email"   : email,
      "type"    : type,
      "password": hash
    }

    self.db.insert(userDetails, function (err, newUser) {

      if (err) {
        return callback(err, null);
      }

      // Generate the token
      newUser.token = self.encryptionmanager.createToken(newUser, self.JWT_SECRET);

      callback(null, newUser);
    });

  });
};


/**
 * Login a user. If no user exists, create a new one
 * @param {String} email
 * @param {String} password
 * @param {Function} callback Function to call on completion.
 *
 * This function may fail for one of the following reasons:
 *
 * UNAUTHORIZED              Wrong email/password combination
 *  
 */
SiloManager.prototype.login = function(email, password, callback) {

  var self = this;
  
  // Checks whether a User exists. 
  // If yes, it attemps to log him/her in using the email & password. On success it returns the authentication token.
  // If no User exists, it creates a new one. On success it returns the authentication token.
  async.waterfall([

    // Check if the user exists
    function(callback) {

      self.db.findOne({ "email" : { $exists: true } }, function(err, user) {

        if (err) {
          return callback(err, null);
        }
        else if (user) { 
          return callback(null, user);
        }
        else {
          return callback(null, null);
        }
      });
    },

    // No user exists. Create one.
    function(user, callback) {

      if (user) {
        return callback(null, user, false)
      }

      self.signup(email, password, "user", function(err, newUser) {

        if (err) {
          return callback(err, null);
        }
        
        return callback(null, newUser, true);
      });

    },

    // A user exists. Try to log him/her in.
    function(user, wasSignedUp, callback) {

      // The user was created in the previous step
      if (wasSignedUp) {
        return callback(null, user);
      }

      
      self.db.findOne({ 'email' : email}, function(err, user) {

        if (err) {
          return callback(err, null);
        }

        if (!user) {
          var error = new Error('No User found');
          error.status = responseHandler.UNAUTHORIZED;
          return callback(error, null); 
        }

        // Check if the passwords match
        self.encryptionmanager.validPass(password, user.password, function(err, isMatch) {
          if (err) {
            return callback(err, null);
          }

          if (isMatch) {

            // Generate the token
            user.token = self.encryptionmanager.createToken(user, self.JWT_SECRET);

            return callback(null, user);
          }

          var error = new Error('Invalid Password');
          error.status = responseHandler.UNAUTHORIZED;
          return callback(error, null);
        });
      });
    }
  ],
  function(err, user) {

      if (err) {
        return callback(err, null);
      }
      else {
        return callback(null, user.token);
      }
  });
};

/**
 * Authenticates a User.
 * @param {String} token The "authorization" JWT
 * @param {Function} callback Function to call on completion.
 *
 * This function may fail for one of the following reasons:
 *
 * JsonWebTokenError    The token is malformed
 *
 * Illegal Argument     The bearerHeader is malformed
 *                      No User with this token was found
 */
SiloManager.prototype.authenticate = function(token, callback) {
  var self = this;
  async.waterfall([

    // Decode the token to get the userId
    function(callback) {
      self.encryptionmanager.validToken(token, self.JWT_SECRET, function(err, decoded) {

        if (err) {
          return callback(err, null);
        }

        return callback(null, decoded);
      });
    },

    // Check if the user exists
    function(userId, callback) {

      self.db.findOne( { '_id' : userId }, function(err, user) {

        if (err) {
          return callback(err, null);
        }

        if (!user) {
          var error = new Error("No User found");
          error.name = "Illegal Argument";
          return callback(error, null);
        }

        return callback(null, user);
      });
    },
    ],
    function(err, authenticated) {

      if (err) {
        return callback(err, null);
      }

      return callback(null, authenticated);
    });
};

/*
 * Check the http header contains an authentication token.
 * Returns the bearer token.
 * @param {String} bearerHeader The "authorization" HTTP header
 *
 */
SiloManager.prototype.hasToken = function(bearerHeader) {

  if (typeof bearerHeader == 'undefined') {
    return false;
  }

  var bearer = bearerHeader.split(' ');

  if (bearer.length !== 2) {
    return false;
  }

  var bearerToken = bearer[1];

  if (bearerToken.length === 0) {
    return false;
  }

  return bearerToken;
};

/**
 * Registers the silo with the reelyActive service.
 * @param {Function} callback Function to call on completion.
 *
 */
SiloManager.prototype.reelyActiveRegister = function(callback) {
  var self = this;

  async.waterfall([

    // Check if reelyActive is already registered
    function(callback) {

      self.db.findOne({ "type" : "reelyActive" }, function (err, reelyActive) {

        if (err) {
          return callback(err, null);
        }

        // reelyActive was not found
        // so we need to add it to the database
        if (!reelyActive) {
          return callback(null, null)
        }

        // Generate the token
        reelyActive.token = self.encryptionmanager.createToken(reelyActive, self.JWT_SECRET);

        return callback(null, reelyActive);
      });
    },

    // If not registered, update the database
    function(reelyActive, callback) {

      if (reelyActive) {
        return callback(null, reelyActive);
      }

      self.db.insert({ "type" : "reelyActive" }, function (err, reelyActive) {

        if (err) {
          return callback(err, null);
        }

        // Generate the token
        reelyActive.token = self.encryptionmanager.createToken(reelyActive, self.JWT_SECRET);

        return callback(null, reelyActive);
      });
    }
  ],
  function(err, reelyActive) {

    return callback(err, reelyActive);
  });
};

/**
 * Unregisters the silo from the reelyActive service.
 * @param {Function} callback Function to call on completion.
 *
 */
SiloManager.prototype.reelyActiveRemove = function(callback) {
  var self = this;

  self.db.remove({ "type" : "reelyActive" }, function (err, numRemoved) {

    if (err) {
      return callback(err, null);
    }

    return callback(null, numRemoved);
  });

};

/**
 * Checks whether the user has provided a valid email.
 * @param {String} email for the current silo.
 */
SiloManager.prototype.validEmail = function(email) {

  return VALID_EMAIL_SYNTAX.test(email);

};


/**
 * Validates & saves the user data input in JSON-LD compacted format
 * @param {Object} data JSON-LD, excluding the context
 * @param {Function} callback Function to call on completion.
 */
SiloManager.prototype.save = function(data, callback) {
  var self = this;

  async.waterfall([

    // Generate the JSON-LD object
    function(callback) {
      jsonld.compact(data, CONTEXT, function(err, compacted) {
    
        if (err) {
          return callback(err, null);
        }

        return callback(null, compacted);
      });
    },

    // Delete the previous data
    function(userData, callback) {

      self.db.remove({ "@context" : {  $exists: true } }, function(err, numRemoved) {
        if (err) {
            return callback(err, null);
        }
          callback(null, userData);
      });
    },

    // Save in the database
    function(userData, callback) {

      self.db.insert(userData, function (err, inserted) {

        if (err) {
          return callback(err, null);
        }

        callback(null, inserted);
      });
    },
  ],
  function(err, userData) {
    return callback(err, userData);
  });
};

/**
 * Retrieves part of the user data. The context is always included.
 * @param {array} fields The User data fields to return.
 * @param {Function} callback Function to call on completion.
 */
SiloManager.prototype.find = function(fields, callback) {
  var self = this;

  // Create an projection object to query the database
  // & return only the appropriate fields.
  var projection = {};

  fields.forEach(function(field) {
    projection[field] = 1;
  });

  // Make sure to omit the id
  projection["_id"] = 0;

  // Make sure to include the context
  projection["@context"] = 1;

  self.db.findOne({ "@context" : { $exists: true } }, projection, function(err, data) {

    if (err) {
      return callback(err, null);
    }

    return callback(null, data);
  });
};

/**
 * Sets certain User data fields publicly accessible. 
 * The rest are asssumed by default Private. The "@context" is public
 * by default.
 * @param {array} fields The User data fields to set public.
 * @param {Function} callback Function to call on completion.
 *
 * This function may fail for one of the following reasons:
 *
 * Illegal Argument       The fields provided are illegal
 *
 * No Data                No data was found in the database
 */
SiloManager.prototype.setPublic = function(publicFields, callback) {
  var self = this;

  async.waterfall([

    // Make sure that the public fields are valid
    // The "@context" is added by default
    function(callback) {

      self.find(publicFields, function(err, validObject) {

        if (err) {
          return callback(err, null);
        }

        if (!validObject) {
          var error = new Error('No data exists');
          error.name = 'No Data'
          return callback(error, null);
        }

        if (Object.keys(validObject).length === 0) {
          var error = new Error('The fields provided are illegal');
          error.name = 'Illegal Argument';
          return callback(error, null);
        }

        var validFields = [];
        for(var field in validObject) 
          validFields.push(field);

        return callback(null, validFields);
      });
    },

    // Remove the previous public fields
    // (stored in the DB)
    function(fields, callback) {
      self.db.remove({ "public" : { $exists : true }  }, function(err, numRemoved) {

        if (err) {
          return callback(err, null);
        }

        return callback(null, fields);
      });
    },

    // Update the DB
    function(fields, callback) {

      self.db.insert( { "public" : fields }, function (err, inserted) {

        if (err) {
          return callback(err, null);
        }

        return callback(null, inserted);
      });
    },
  ],
  function(err, publicData) {

    return callback(err, publicData);
  });
};

/**
 * Returns which fields are public & which private. The contents
 * of the public fields are also returned.
 * @param {Function} callback Function to call on completion.
 */
SiloManager.prototype.getPublic = function(callback) {
  var self = this;

  async.waterfall([

    // Get the public fields
    function(callback) {

      self.db.findOne( { "public" : { $exists: true } }, function(err, fields) {

        if (err) {
          return callback(err, null);
        }

        // Make sure to include to @context
        // as a public field
        if (!fields) {
          return callback(null, ["@context"]);
        }

        if (fields.public.indexOf("@context") === -1) {
          fields.public.push("@context");
        }
        
        return callback(null, fields.public);
      });
    },

    // Get the private fields & the
    // contents of the public fields
    function(publicFields, callback) {

      self.findAll(function(err, userData) {

        if (err) {
          callback(err, null);
        }

        var privateFields = [];
        var publicInfo = {};

        for(var field in userData) {

          if (publicFields.indexOf(field) === -1) {
            privateFields.push(field);
          }
          else {
            publicInfo[field] = userData[field];
          }
        }

        // Remove the _id from the private data
        privateFields.pop("_id");

        callback(null, publicInfo, privateFields);
      });
    },
  ],
  function(err, publicInfo, privateFields) {

    var fieldInfo = {
      "public" : publicInfo,
      "private" : privateFields
    };

    callback(err, fieldInfo);
  });
},

/**
 * Retrieves all the user data
 * @param {Function} callback to call on completion.
 */
SiloManager.prototype.findAll = function(callback) {
  var self = this;

  self.db.findOne({ "@context" : { $exists: true } }, function(err, data) {

    if (err) {
      return callback(err, null);
    }

    return callback(null, data);
  });
};

/**
 * Saves a transaction request
 * @param {String} transactionId The id of the transaction, as provided by chickadee
 * @param {String} requestorURI The URI of the SILO requesting the data
 * @param {Array} fields The fields requested
 * @param {Function} callback to call on completion.
 */
SiloManager.prototype.saveTransaction = function(transactionId, requestorURI, fields, callback) {
  var self = this;

  var transactionDetails = {
    "transactionId" : transactionId,
    "requestorURI"  : requestorURI,
    "fields"        : fields,
    "created"       : new Date()
  };

  self.db.insert(transactionDetails, function (err, transaction) {

    if (err) {
      return callback(err, null);
    }

    return callback(null, transaction);
  });
};

/**
 * Gets all transaction requests
 * @param {Function} callback to call on completion.
 */
SiloManager.prototype.getTransactions = function(callback) {
  var self = this;

  self.db.find( { "transactionId" : { $exists : true } }, function(err, transactions) {

    if (err) {
      return callback(err, null);
    }

    return callback(null, transactions);
    
  });
};

module.exports = SiloManager;
