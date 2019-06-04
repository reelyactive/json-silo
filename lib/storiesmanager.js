/**
 * Copyright reelyActive 2014-2019
 * We believe in an open Internet of Things
 */


const nedb = require('nedb');

let DEFAULT_DATA_FOLDER = 'data';
let STORY_DB = 'story.db';

class StoriesManager {
  /**
   * AssociationManager constructor
   * Manages the persistent JSON entries
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
  constructor(options, database) {
    let self = this;

    options = options || {};

    console.log("storiesManage is working");

    self.database = database;
    let datafolder = options.persistentDataFolder || DEFAULT_DATA_FOLDER;
    let filename = STORY_DB;
    self.db = new nedb({filename: filename, autoload: true });
    self.identifierLength = options.identifierLength;
  }

  /**
 * Find the JSON associated with the given identifier
 * @param {String} id Identifier to search on.
 * @param {function} cb Function to call on completion.
 */
  find (id, cb){
    self.db.find({ _id: id }, function(err, docs){
    let result= docs[0];
    let json = {};
    if(result != null){
      json = result.json;
    }
    cb(json);
    });
  }

    /**
   * Find the all the JSON associated with the given directory
   * @param {String} directory The directory name to search on.
   * @param {function} cb Function to call on completion.
   */
  findForDirectory (directory, cb){
    self.db.find({ directory: directory }, function(err, matching){
      let stories = {};
      for(let cId = 0; cId < matching.length; cId++){
        stories[matching[cId]._id] = { };

      }
      cb({ devices: stories });
    });
  }

  /**
   * Add a JSON to the database
   * @param {Object} doc The JSON to add.
   * @param {function} cb Function to call on completion.
   */
  addStory (doc, cb){
    if(self.identifierLength){
      doc._id = generateRandomAlphanumeric(self.identifierLength);
    }
    self.db.insert(doc, function(err, newDoc){
      let id = newDoc._id;
      cb(id);
    });
  }

  /**
 * Add a directory to a JSON already in the database
 * @param {Object} doc The JSON to update.
 * @param {function} cb Function to call on completion.
 */
  addDirectory(doc, cb){

    self.db.update({ _id: doc._id }, { $set: { directory: doc.directory } }, function(err, numReplaced){
      if(numReplaced > 0) {
        
        cb(doc.directory);
      }else{
        cb(null);
      }
    });
  }

  /**
 * Remove a JSON from the database
 * @param {String} id Identifier to remove.
 * @param {function} cb Function to call on completion.
 */
  remove(id, cb){
    self.db.remove({_id:id}, {}, function(err, numRemoved){
      cb();
    });
  }

  /**
 * Generate a random alphanumeric string of the given length
 * @param {Number} length The desired length in characters.
 */
  generateRandomAlphanumeric(length){
    let id = '';
    while(id.length < length){
      id += Math.random().toString(36).slice(2);
    }
    return id.substr(0 - length);
  }
  /**
 * Returns all JSONs from the database
 * @param {function} cb Function to call on completion.
 */
  findAll(cb){
    self.db.find({}, function(err,docs){
      let result = docs;
      if(result == null){
        result = {};
      }
      cb(result);
    });
  }

}


module.exports = StoriesManager;