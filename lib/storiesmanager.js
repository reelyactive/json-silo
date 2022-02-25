/**
 * Copyright reelyActive 2014-2022
 * We believe in an open Internet of Things
 */


const HTTP_STATUS_OK = 200;
const HTTP_STATUS_CREATED = 201;
const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_NOT_FOUND = 404;


/**
 * StoriesManager Class
 * Manages the storage and retrieval of JSON stories.
 */
class StoriesManager {

  /**
   * StoriesManager constructor
   * @param {Object} options The options as a JSON object.
   * @param {DatabaseManager} database The database manager.
   * @constructor
   */
  constructor(options, database) {
    let self = this;
    options = options || {};
    self.database = database;
    self.identifierLength = options.identifierLength;
  }

  /**
   * Create a new story
   * @param {String} story The story to create in the database
   * @param {callback} callback Function to call on completion
   */
  create(story, callback) {
    let key = Math.round(Math.random() * 100); // TODO: key generation!

    this.database.set(key, story, function(err) {
      if(err) { console.log(err);
        return callback(HTTP_STATUS_BAD_REQUEST);
      }
      else {
        let data = { stories: {} };
        data.stories[key] = story; console.log(data);
        return callback(HTTP_STATUS_CREATED, data);
      }
    });
  }

  /**
   * Retrieve an existing story
   * @param {String} id The id of the story
   * @param {callback} callback Function to call on completion
   */
  retrieve(id, callback) {
    this.database.get(id, function(err, story) {
      if(err) {
        return callback(HTTP_STATUS_BAD_REQUEST);
      }
      else if(story === undefined) {
        return callback(HTTP_STATUS_NOT_FOUND);
      }
      else {
        let data = { stories: {} };
        data.stories[id] = story;
        return callback(HTTP_STATUS_OK, data);
      }
    });
  }

}


module.exports = StoriesManager;
