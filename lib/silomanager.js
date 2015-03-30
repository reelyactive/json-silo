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
var responseHandler  = require('./responsehandler');
var crypto           = require('crypto');
var openpgp          = require('openpgp');
var jsonld           = require('jsonld');

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
 * @param {String} email for the current silo.
 * @param {String} password for the User.
 * @param {function} callback Function to call on completion.
 *
 * This function may fail for one of the following reasons:
 *
 * BADREQUEST         The User provided an invalid-formatted email
 *
 */
SiloManager.prototype.signup = function(email, password, callback) {

  var self = this;

  if (!self.validEmail(email)) {
    var error = responseHandler.prepareFailureResponse(responseHandler.STATUS.BADREQUEST);
    return callback(error, null);
  }

  // Create a hashed password
  self.encryptPass(password, function(err, hash) {

    if (err) 
      return callback(err, null);

    var userDetails = {
      "email"   : email,
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
 * @param {String} email for the current silo.
 * @param {String} password for the User.
 * @param {function} callback Function to call on completion.
 *
 * This function may fail for one of the following reasons:
 *
 * BADREQUEST         The User provided an invalid-formatted email
 *
 * UNAUTHORIZED       The User provided an invalid email/password
 */
SiloManager.prototype.login = function(email, password, callback) {

  var self = this;
  
  // Checks whether a User exists. 
  // If yes, it attemps to log him/her in using the email & password. On success it returns the authentication token.
  // If no User exists, it creates a new one. On success it returns the authentication token.
  async.waterfall([

    // Check if the user exists
    function(callback) {

      self.db.findOne({ 'email' : /.*/ }, function(err, user) {

        if (err)
          callback(err, null);
        else if (user) 
          callback(null, user);
        else
          callback(null, null);
      });
    },

    // No user exists. Create one.
    function(user, callback) {

      if (user) 
        return callback(null, user, false)

      self.signup(email, password, function(err, newUser) {

        if (err)
          callback(err, null);
        else
          callback(null, newUser, true);
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
          var error = responseHandler.prepareFailureResponse(responseHandler.STATUS.UNAUTHORIZED);
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

          var error = responseHandler.prepareFailureResponse(responseHandler.STATUS.UNAUTHORIZED);
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
 * Checks whether the user has provided a valid email.
 * @param {String} email for the current silo.
 *
 * This function may fail for one of the following reasons:
 *
 *
 */
SiloManager.prototype.validEmail = function(email) {

	return VALID_EMAIL_SYNTAX.test(email);

};

/**
 * Checks whether the user has a valid token in the header.
 * @param {String} token for authentication.
 * @param {function} callback Function to call on completion.
 *
 * This function may fail for one of the following reasons:
 *
 *
 */
SiloManager.prototype.validToken = function(token) {
  var self = this;

  return jwt.verify(token, self.JWT_SECRET, {}, verified);
};

/**
 * Creates a new JWT token for the user.
 * @param {String} userId the id for the User logging in.
 *
 * This function may fail for one of the following reasons:
 *
 *
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
 *
 * This function may fail for one of the following reasons:
 *
 *
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
 *
 * This function may fail for one of the following reasons:
 *
 *
 */
SiloManager.prototype.encryptPass = function(password, callback) {

  bcrypt.hash(password, null, null, function(err, hash) {

      if (err)
        return callback(err);

    callback( null, hash )
  });
  
};

/**
 * Registers the silo with the reelyActive database.
 * @param {Object} data to enter the datase
 * @param {function} callback Function to call on completion.
 *
 * This function may fail for one of the following reasons:
 *
 *
 */
SiloManager.prototype.reelyActiveRegister = function(data, callback) {
  
};


/**
 * Validates & saves the user data input in JSON-LD compacted format
 * @param {Object} data to enter the datase
 * @param {function} callback Function to call on completion.
 *
 * This function may fail for one of the following reasons:
 *
 *
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
 * Retrieves the user data
 * @param {function} callback Function to call on completion.
 *
 * This function may fail for one of the following reasons:
 *
 *
 */
SiloManager.prototype.find = function(callback) {
  
};

/**
 * Encrypts a set of data using a public key
 * @param {Object} data to encrypt
 * @param {String} publicKey to use for encryption
 * @param {function} callback Function to call on completion.
 *
 * This function may fail for one of the following reasons:
 *
 *
 */
SiloManager.prototype.encryptData = function(pubkey, data, callback) {
  
  var key = pubkey;
  var publicKey = openpgp.key.readArmored(key);
  var message = JSON.stringify(data);

  openpgp.encryptMessage(publicKey.keys, message).then(function(pgpMessage) {
    callback(null, pgpMessage);
    return;
  }).catch(function(err) {
    return;
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
 * UNAUTHORIZED         The password provided is not valid
 *  
 * INTERNALSERVERERROR  The server could not read the encrypted message
 *
 */
SiloManager.prototype.decryptData = function(password, pgpMessage, callback) {

  async.waterfall([

    // Get the private key from the filesystem
    function(callback) {

      fs.readFile('security/private_key.asc', 'ascii', function (err, privkey) {
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
        var error = responseHandler.prepareFailureResponse(responseHandler.STATUS.UNAUTHORIZED);
        return callback(error, null);
      }

      pgpMessage = openpgp.message.readArmored(pgpMessage);

      if (!pgpMessage) {
        var error = responseHandler.prepareFailureResponse(responseHandler.STATUS.INTERNALSERVERERROR);
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
 *
 * This function may fail for one of the following reasons:
 *
 *
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
            fs.writeFile('security/public_key.asc', pubkey, function(err) {
              if(err)
                callback(err);
              else
                callback(null);
            }); 
          },

          // Save the private key
          function(callback) {
            fs.writeFile('security/private_key.asc', privkey, function(err) {
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

        callback(err);
    });

};


module.exports = SiloManager;
