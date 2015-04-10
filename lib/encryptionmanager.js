var bcrypt           = require('bcrypt-nodejs');
var openpgp          = require('openpgp');
var async            = require('async');
var fs               = require('fs');

/**
 * EncryptionManager Class
 * Manages the Encryption & Decryption of User data.
 * @constructor
 */
function EncryptionManager() {
  var self = this;
};

/**
 * Generates & saves a new public/secret key pair.
 * @param {String} password the User uses to login.
 * @param {function} callback Function to call on completion.
 */
EncryptionManager.prototype.keygen = function(email, password, callback) {
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

/**
 * Encrypts a set of data using a public key
 * @param {Object} data to encrypt
 * @param {String} publicKey to use for encryption
 * @param {function} callback Function to call on completion.
 */
EncryptionManager.prototype.encryptData = function(pubkey, data, callback) {
  
  var key = pubkey;
  var publicKey = openpgp.key.readArmored(key);
  var message = JSON.stringify(data);

  openpgp.encryptMessage(publicKey.keys, message).then(function(pgpMessage) {
    return callback(null, pgpMessage);
  }).catch(function(error) {
    if (error.action)
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
EncryptionManager.prototype.decryptData = function(password, pgpMessage, callback) {

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
 * Compares a non-encrypted to an encrypted password.
 * @param {String} unencrepted the 'unencrepted' password.
 * @param {String} encrypted the 'encrypted' password.
 * @param {function} callback Function to call on completion.
 */
EncryptionManager.prototype.validPass = function(unencrepted, encrypted, callback) {

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
EncryptionManager.prototype.encryptPass = function(password, callback) {

  bcrypt.hash(password, null, null, function(err, hash) {

      if (err)
        return callback(err);

    callback( null, hash )
  });
};


module.exports = EncryptionManager;