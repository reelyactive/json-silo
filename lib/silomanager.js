/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */

var nedb = require('nedb');

var SILO_DB = "silo.db";
var MAINTENANCE_INTERVAL_MILLISECONDS = 60000;
var TEST_JSON = { person: { firstName: "Barn",
                            lastName: "Owl",
                            companyName: "reelyActive",
                            portraitImageUrl: "http://reelyactive.com/images/barnowl.jpg",
                            twitterPersonalScreenName: "reelyActive" },
                  device: { manufacturer: "reelyActive",
                            model: "RA-T411",
                            portraitImageUrl: "http://reelyactive.com/images/tag400x400.jpg" } };
var LONELY_JSON = { person: { firstName: "Kim",
                            lastName: "Jong-il",
                            companyName: "I'm so lonely...",
                            portraitImageUrl: "http://reelyactive.com/images/ronery.jpg",
                            twitterPersonalScreenName: "thedearleader" },
                  device: { manufacturer: "reelyActive",
                            model: "RA-T411",
                            portraitImageUrl: "http://reelyactive.com/images/tag400x400.jpg" } };
var TEST_DOC = { "_id": "test",
                 "json": TEST_JSON,
                 "expireAfter": "2099-01-01T01:23:45.678Z",
                 "place": "test" };
var LONELY_DOC = { "_id": "lonely",
                   "json": LONELY_JSON,
                   "expireAfter": "2099-01-01T01:23:45.678Z",
                   "place": "" };


/**
 * SiloManager Class
 * Manages the persistent JSON entries
 * @constructor
 */
function SiloManager() {
  var self = this;
  this.db = new nedb({filename: SILO_DB, autoload: true });
  this.db.insert(TEST_DOC);
  this.db.insert(LONELY_DOC);

  function periodicMaintenance() {
    removeStaleDocuments(self);
    self.db.persistence.compactDatafile();
  }

  setInterval(periodicMaintenance, MAINTENANCE_INTERVAL_MILLISECONDS);
};


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
}


/**
 * Find the all the JSON associated with the given place
 * @param {String} place The place name to search on.
 * @param {function} callback Function to call on completion.
 */
SiloManager.prototype.findAt = function(place, callback) {
  var self = this;

  this.db.find({ place: place }, function(err, matching) {
    var present = {};
    for(var cId = 0; cId < matching.length; cId++) {
      present[matching[cId]._id] = { };
    }
    callback(present);
  });
}


/**
 * Add a JSON to the database
 * @param {Object} doc The JSON to add.
 * @param {function} callback Function to call on completion.
 */
SiloManager.prototype.add = function(doc, callback) {
  var self = this;
  this.db.insert(doc, function(err, newDoc) {
    var id = newDoc._id;
    callback(id);
  });
}


/**
 * Add a place to a JSON already in the database
 * @param {Object} doc The JSON to update.
 * @param {function} callback Function to call on completion.
 */
SiloManager.prototype.checkIn = function(doc, callback) {
  var self = this;
  this.db.update( { _id: doc._id }, { $set: { place: doc.place } }, function(err, numReplaced) {
    if(numReplaced > 0) { callback(doc.place); }
    else { callback(null); }
  });
}


/**
 * Remove a JSON from the database
 * @param {String} id Identifier to remove.
 */
SiloManager.prototype.remove = function(id) {
  var self = this;
  this.db.remove({ _id: id });
}


/**
 * Removes all stale tiraids from the database
 * @param {SiloManager} instance The given instance.
 */
function removeStaleDocuments(instance) {
  var cutoffTime = new Date().toISOString();
  instance.db.remove({ expireAfter: { $lt: cutoffTime } }, { multi: true });
}


module.exports = SiloManager;
