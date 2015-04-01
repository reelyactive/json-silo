/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */

var nedb        	   = require('nedb');
var SILO_DB    		   = "silo.db";
var jwt         	   = require("jsonwebtoken");
var bcrypt      	   = require('bcrypt-nodejs');
var fs               = require('fs');
var async            = require('async');
var crypto           = require('crypto');
var openpgp          = require('openpgp');
var jsonld           = require('jsonld');
var response         = require("./responsehandler");

var VALID_EMAIL_SYNTAX = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

var CONTEXT = {
  "schema": "http://schema.org/",
  "dbpedia": "http://dbpedia.org/page/",
  "productdb": "http://productdb.org/"
};

/**
 * SiloManager Class
 * Manages the persistent JSON entries
 * @constructor
 */
function SiloManager() {
  var self = this;
  this.db = new nedb({filename: SILO_DB, autoload: true });

  // Generate a random secret for use with JWT (i.e. token authentication)
  // For monre info, read this: http://angular-tips.com/blog/2014/05/json-web-tokens-examples/
  crypto.randomBytes(2048, function(ex, buf) {
    self.JWT_SECRET = buf;
  });
};

/**
 * Sign-up a user.
 * @param {String} email for the User.
 * @param {String} password for the User.
 * @param {String} type whether it is reelyActive registering or a regular User.
 * @param {function} callback Function to call on completion.
 *
 */
SiloManager.prototype.signup = function(email, password, type, callback) {

  var self = this;

  if (!self.validEmail(email)) {
    var error = new Error('The email address is malformed');
    error.http_code = response.STATUS.BADREQUEST;
    return callback(error, null);
  }

  // Create a hashed password
  self.encryptPass(password, function(err, hash) {

    if (err) 
      return callback(err, null);

    var userDetails = {
      "email"   : email,
      "type"    : type,
      "password": hash
    }

    self.db.insert(userDetails, function (err, newUser) {

      if (err)
        return callback(err, null);

      // Generate the token
      newUser.token = self.createToken(newUser._id);

      callback(null, newUser);
    });

  });
};

/**
 * Login a user. If no user exists, create a new one
 * @param {String} email for the User.
 * @param {String} password for the User.
 * @param {function} callback Function to call on completion.
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

        if (err)
          return callback(err, null);
        else if (user) 
          return callback(null, user);
        else
          return callback(null, null);
      });
    },

    // No user exists. Create one.
    function(user, callback) {

      if (user) 
        return callback(null, user, false)

      self.signup(email, password, "user", function(err, newUser) {

        if (err)
          return callback(err, null);
        
        return callback(null, newUser, true);
      });

    },

    // A user exists. Try to log him/her in.
    function(user, wasSignedUp, callback) {

      // The user was created in the previous step
      if (wasSignedUp)
        return callback(null, user);

      
      self.db.findOne({ 'email' : email}, function(err, user) {

        if (err)
          return callback(err, null);

        if (!user) {
          var error = new Error('No User found');
          error.http_code = response.STATUS.UNAUTHORIZED;
          return callback(error, null); 
        }

        // Check if the passwords match
        self.validPass(password, user.password, function(err, isMatch) {
          if (err)
            return callback(err, null);

          if (isMatch) {

            // Generate the token
            user.token = self.createToken(user._id);

            return callback(null, user);
          }

          var error = new Error('Invalid Password');
          error.http_code = response.STATUS.UNAUTHORIZED;
          return callback(error, null);
        });
      });
    }
  ],
  function(err, user) {

      if (err)
        return callback(err, null);
      else
        return callback(null, user.token);
  });
};

/**
 * Authenticates a User.
 * @param {String} bearerHeader the "authorization" HTTP header
 * @param {function} callback Function to call on completion.
 *
 * This function may fail for one of the following reasons:
 *
 * JsonWebTokenError    The token is malformed
 *
 * Illegal Argument     The bearerHeader is malformed
 *                      No User with this token was found
 */
SiloManager.prototype.authenticate = function(bearerHeader, callback) {
  var self = this;
  var userId;

  var token = self.hasToken(bearerHeader);

  if (!token) {
    var error  = new Error("Header token is malformed");
    error.name = "Illegal Argument";
    return callback(error, null);
  }

  async.waterfall([

    // Decode the token to get the userId
    function(callback) {
      self.validToken(token, function(err, decoded) {

        if (err)
          return callback(err, null);

        return callback(null, decoded);
      });
    },

    // Check if the user exists
    function(userId, callback) {

      self.db.findOne( { '_id' : userId }, function(err, user) {

        if (err)
          return callback(err, null);

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

      if (err)
        return callback(err, null);

      return callback(null, authenticated);
    });
};

/*
 * Check the http header contains an authentication token.
 * Returns the bearer token.
 * @param {String} bearerHeader the "authorization" HTTP header
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
 * @param {function} callback Function to call on completion.
 *
 */
SiloManager.prototype.reelyActiveRegister = function(callback) {
  var self = this;

  async.waterfall([

    // Check if reelyActive is already registered
    function(callback) {

      self.db.findOne({ "type" : "reelyActive" }, function (err, reelyActive) {

        if (err)
          return callback(err, null);

        // reelyActive was not found
        // so we need to add it to the database
        if (!reelyActive)
          return callback(null, null)

        // Generate the token
        reelyActive.token = self.createToken(reelyActive._id);

        return callback(null, reelyActive);
      });
    },

    // If not registered, update the database
    function(reelyActive, callback) {

      if (reelyActive)
        return callback(null, reelyActive);

      self.db.insert({ "type" : "reelyActive" }, function (err, reelyActive) {

        if (err)
          return callback(err, null);

        // Generate the token
        reelyActive.token = self.createToken(reelyActive._id);

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
 * @param {function} callback Function to call on completion.
 *
 */
SiloManager.prototype.reelyActiveRemove = function(callback) {
  var self = this;

  self.db.remove({ "type" : "reelyActive" }, function (err, numRemoved) {

    if (err)
      return callback(err, null);

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
 * Checks whether the user has a valid token in the header.
 * @param {String} token for authentication.
 * @param {function} callback Function to call on completion.
 */
SiloManager.prototype.validToken = function(token, callback) {
  var self = this;

  jwt.verify(token, self.JWT_SECRET, function(err, decoded) {

    if (err)
      return callback(err, null);

    return callback(null, decoded);
  });
};

/**
 * Creates a new JWT token for the user.
 * @param {String} userId the id for the User logging in.
 */
SiloManager.prototype.createToken = function(userId) {
  var self = this;

  return jwt.sign(userId, self.JWT_SECRET);
};

/**
 * Compares a non-encrypted to an encrypted password.
 * @param {String} unencrepted the 'unencrepted' password.
 * @param {String} encrypted the 'encrypted' password.
 * @param {function} callback Function to call on completion.
 */
SiloManager.prototype.validPass = function(unencrepted, encrypted, callback) {

  bcrypt.compare(unencrepted, encrypted, function(err, isMatch) {

    if (err)
      return callback(err);

    callback( null, isMatch );
  });

};

/**
 * Encrypts the password.
 * @param {String} password to encrypt.
 * @param {function} callback Function to call on completion.
 */
SiloManager.prototype.encryptPass = function(password, callback) {

  bcrypt.hash(password, null, null, function(err, hash) {

      if (err)
        return callback(err);

    callback( null, hash )
  });
  
};


/**
 * Validates & saves the user data input in JSON-LD compacted format
 * @param {Object} data in json-ld format, excluding the context
 * @param {function} callback Function to call on completion.
 */
SiloManager.prototype.save = function(data, callback) {
  var self = this;

  async.waterfall([

    // Generate the JSON-LD object
    function(callback) {
      jsonld.compact(data, CONTEXT, function(err, compacted) {
    
        if (err)
          return callback(err, null);

        return callback(null, compacted);
      });
    },

    // Delete the previous data
    function(userData, callback) {

      self.db.remove({ "@context" : {  $exists: true } }, function(err, numRemoved) {
        if (err)
            return callback(err, null);

          callback(null, userData);
      });
    },

    // Save in the database
    function(userData, callback) {

      self.db.insert(userData, function (err, inserted) {

        if (err)
          return callback(err, null);

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
 * @param {array} fields User data fields to return.
 * @param {function} callback Function to call on completion.
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

    if (err)
      return callback(err, null);

    return callback(null, data);
  });
};

/**
 * Sets certain User data fields publicly accessible. 
 * The rest are asssumed by default Private. The "@context" is public
 * by default.
 * @param {array} fields User data fields to set public.
 * @param {function} callback Function to call on completion.
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

        if (err)
          return callback(err, null);

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

        if (err)
          return callback(err, null);

        return callback(null, fields);
      });
    },

    // Update the DB
    function(fields, callback) {

      self.db.insert( { "public" : fields }, function (err, inserted) {

        if (err)
          return callback(err, null);

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
 * @param {function} callback Function to call on completion.
 */
SiloManager.prototype.getPublic = function(callback) {
  var self = this;

  async.waterfall([

    // Get the public fields
    function(callback) {

      self.db.findOne( { "public" : { $exists: true } }, function(err, fields) {

        if (err)
          return callback(err, null);

        // Make sure to include to @context
        // as a public field
        if (!fields)
          return callback(null, ["@context"]);

        if (fields.public.indexOf("@context") === -1)
          fields.public.push("@context");
        
        return callback(null, fields.public);
      });
    },

    // Get the private fields & the
    // contents of the public fields
    function(publicFields, callback) {

      self.findAll(function(err, userData) {

        if (err)
          callback(err, null);

        var privateFields = [];
        var publicInfo = {};

        for(var field in userData) {

          if (publicFields.indexOf(field) === -1)
            privateFields.push(field);
          else
            publicInfo[field] = userData[field];
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
 * @param {function} callback Function to call on completion.
 */
SiloManager.prototype.findAll = function(callback) {
  var self = this;

  self.db.findOne({ "@context" : { $exists: true } }, function(err, data) {

    if (err)
      return callback(err, null);

    return callback(null, data);
  });
};

/**
 * Encrypts a set of data using a public key
 * @param {Object} data to encrypt
 * @param {String} publicKey to use for encryption
 * @param {function} callback Function to call on completion.
 */
SiloManager.prototype.encryptData = function(pubkey, data, callback) {
  
  var key = pubkey;
  var publicKey = openpgp.key.readArmored(key);
  var message = JSON.stringify(data);

  openpgp.encryptMessage(publicKey.keys, message).then(function(pgpMessage) {
    callback(null, pgpMessage);
    return;
  }).catch(function(error) {
    if (error)
      return callback(error, null);
  });
};

/**
 * Decrypts a set of data.
 * @param {String} password to use for decryption (same as the user's for login)
 * @param {String} message to decrypt
 * @param {function} callback Function to call on completion.
 *
 * This function may fail for one of the following reasons:
 *
 * llegal Argument      The password provided is not valid
 *  
 * InternalError        The server could not read the encrypted message
 *
 */
SiloManager.prototype.decryptData = function(password, pgpMessage, callback) {

  async.waterfall([

    // Get the private key from the filesystem
    function(callback) {

      fs.readFile('private_key.asc', 'ascii', function (err, privkey) {
        if (err)
          callback(err, null);
        else
          callback(null, privkey);
      });
    },

    // Decrypt the message
    function(privkey, callback) {

      var key = privkey;
      var privateKey = openpgp.key.readArmored(key).keys[0];

      if (!privateKey.decrypt(password)) {
        var error = new Error('Password is malformed');
        error.name = 'Illegal Argument';
        return callback(error, null);
      }

      pgpMessage = openpgp.message.readArmored(pgpMessage);

      if (!pgpMessage) {
        var error = new Error('Could not read the message');
        error.name = 'InternalError';
        return callback(error, null);
      }

      openpgp.decryptMessage(privateKey, pgpMessage).then(function(plaintext) {

        var jsonData = JSON.parse(plaintext);

        return callback(null, jsonData);

      }).catch(function(err) {

          if (err)
            callback(err, null);
      });
    },
    ],
    function(err, data) {

      callback(err, data);
    });
};

/**
 * Generates & saves a new public/secret key pair in the "security" folder
 * @param {String} password the User uses to login.
 * @param {function} callback Function to call on completion.
 */
SiloManager.prototype.keygen = function(email, password, callback) {
  var self = this;

    var options = {
        numBits: 2048,
        userId: '<' + email + '>',
        passphrase: password
    };

    openpgp.generateKeyPair(options).then(function(keypair) {
        var privkey = keypair.privateKeyArmored;
        var pubkey = keypair.publicKeyArmored;

        // Save the keys in the filesystem
        async.parallel([

          // Save the public key
          function(callback) {
            fs.writeFile('public_key.asc', pubkey, 'ascii', function(err) {
              if(err)
                callback(err);
              else
                callback(null);
            }); 
          },

          // Save the private key
          function(callback) {
            fs.writeFile('private_key.asc', privkey, 'ascii', function(err) {
              if(err)
                callback(err);
              else
                callback(null);
            });
          }
          ],
          function(err) {
            callback(err);
          }
        );
    }).catch(function(err) {

        if (err)
          return callback(err);
    });

};


module.exports = SiloManager;
