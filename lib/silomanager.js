/**
 * Copyright reelyActive 2014-2015
 * We believe in an open Internet of Things
 */

var nedb = require('nedb');

var DEFAULT_DATA_FOLDER = 'data';
var SILO_DB = 'silo.db';
var MAINTENANCE_INTERVAL_MILLISECONDS = 60000;
var TEST_JSON = 
  {
    "@context": {
      "schema": "http://schema.org/"
    },
    "@graph": [
      {
        "@id": "person",
        "@type": "schema:Person",
        "schema:givenName": "Barn",
        "schema:familyName": "Owl",
        "schema:worksFor": "reelyActive",
        "schema:image": "http://reelyactive.com/images/barnowl.jpg",
        "schema:jobTitle": "Mascot",
        "schema:url": "https://www.npmjs.com/package/barnowl",
        "schema:sameAs": [
          "https://www.instagram.com/reelyactive/"
        ]
      },
      {
        "@id": "product",
        "@type": "schema:Product",
        "schema:name": "915MHz Active RFID Tag",
        "schema:manufacturer": {
          "@type": "schema:Organization",
          "schema:name": "reelyActive"
        },
        "schema:model": "RA-T411",
        "schema:url": "http://shop.reelyactive.com/products/ra-t411",
        "schema:image": "http://reelyactive.com/images/tag400x400.jpg"
      }
    ]
  };
var LONELY_JSON =
  {
    "@context": {
      "schema": "http://schema.org/"
    },
    "@graph": [
      {
        "@id": "person",
        "@type": "schema:Person",
        "schema:familyName": "Kim",
        "schema:givenName": "Jong-Il",
        "schema:image": "http://reelyactive.com/images/ronery.jpg",
        "schema:jobTitle": "Dear Leader",
        "schema:sameAs": [
          "https://twitter.com/thedearleader"
        ],
        "schema:nationality": "KP"
      },
      {
        "@id": "product",
        "@type": "schema:Product",
        "schema:name": "915MHz Active RFID Tag",
        "schema:manufacturer": {
          "@type": "schema:Organization",
          "schema:name": "reelyActive"
        },
        "schema:model": "RA-T411",
        "schema:url": "http://shop.reelyactive.com/products/ra-t411",
        "schema:image": "http://reelyactive.com/images/tag400x400.jpg"
      }
    ]
  };
var TEST_DOC = { "_id": "test",
                 "json": TEST_JSON,
                 "expireAfter": "2099-01-01T01:23:45.678Z",
                 "directory": "test" };
var LONELY_DOC = { "_id": "lonely",
                   "json": LONELY_JSON,
                   "expireAfter": "2099-01-01T01:23:45.678Z",
                   "directory": "" };


/**
 * SiloManager Class
 * Manages the persistent JSON entries
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
function SiloManager(options) {
  var self = this;

  var datafolder = options.persistentDataFolder || DEFAULT_DATA_FOLDER;
  var filename = SILO_DB;
  if(options.persistentDataFolder !== '') {
    filename = datafolder.concat('/' + filename);
  }

  self.identifierLength = options.identifierLength;

  self.db = new nedb({filename: filename, autoload: true });
  self.db.insert(TEST_DOC);
  self.db.insert(LONELY_DOC);

  function periodicMaintenance() {
    removeStaleDocuments(self);
    self.db.persistence.compactDatafile();
  }

  setInterval(periodicMaintenance, MAINTENANCE_INTERVAL_MILLISECONDS);
}


/**
 * Find the JSON associated with the given identifier
 * @param {String} id Identifier to search on.
 * @param {function} callback Function to call on completion.
 */
SiloManager.prototype.find = function(id, callback) {
  var self = this;

  this.db.find({ _id: id }, function(err, docs) {
    var result = docs[0];
    var json = {};
    if(result != null) {
      json = result.json;
    }
    callback(json);
  });
};


/**
 * Find the all the JSON associated with the given directory
 * @param {String} directory The directory name to search on.
 * @param {function} callback Function to call on completion.
 */
SiloManager.prototype.findAt = function(directory, callback) {
  var self = this;

  this.db.find({ directory: directory }, function(err, matching) { // TODO or place
    var stories = {};
    for(var cId = 0; cId < matching.length; cId++) {
      stories[matching[cId]._id] = { };
    }
    callback( { devices: stories } );
  });
};


/**
 * Add a JSON to the database
 * @param {Object} doc The JSON to add.
 * @param {function} callback Function to call on completion.
 */
SiloManager.prototype.add = function(doc, callback) {
  var self = this;

  if(self.identifierLength) {
    doc._id = generateRandomAlphanumeric(self.identifierLength);
  }
  this.db.insert(doc, function(err, newDoc) {
    var id = newDoc._id;
    callback(id);
  });
};


/**
 * Add a directory to a JSON already in the database
 * @param {Object} doc The JSON to update.
 * @param {function} callback Function to call on completion.
 */
SiloManager.prototype.checkIn = function(doc, callback) {
  var self = this;
  this.db.update( { _id: doc._id }, { $set: { directory: doc.directory } }, function(err, numReplaced) {
    if(numReplaced > 0) { callback(doc.directory); }
    else { callback(null); }
  });
};


/**
 * Remove a JSON from the database
 * @param {String} id Identifier to remove.
 * @param {function} callback Function to call on completion.
 */
SiloManager.prototype.remove = function(id, callback) {
  var self = this;
  this.db.remove({ _id: id }, {}, function(err, numRemoved) {
    callback();
  });
};


/**
 * Removes all stale tiraids from the database
 * @param {SiloManager} instance The given instance.
 */
function removeStaleDocuments(instance) {
  var cutoffTime = new Date().toISOString();
  instance.db.remove({ expireAfter: { $lt: cutoffTime } }, { multi: true });
}


/**
 * Generate a random alphanumeric string of the given length
 * @param {Number} length The desired length in characters.
 */
function generateRandomAlphanumeric(length) {
  var id = '';

  while(id.length < length) {
    id += Math.random().toString(36).slice(2);
  }

  return id.substr(0 - length);
}


/**
 * Returns all JSONs from the database
 * @param {function} callback Function to call on completion.
 */
SiloManager.prototype.findAll = function(callback) {
  var self = this;

  this.db.find({}, function(err, docs) {
    var result = docs;
    if(result == null) {
      result = {};
    }
    callback(result);
  });
};


module.exports = SiloManager;
