/**
 * Copyright reelyActive 2014-2019
 * We believe in an open Internet of Things
 */


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
  create(story, callback){
    this.database.insert(story,function(err, newDoc){
      if(err) {
        return callback(400);
      } 
      else{
        return callback(200, {stories: newDoc});
      }
    });
  }

  /**
   * Retrieve an existing story
   * @param {String} id The id of the story
   * @param {callback} callback Function to call on completion
   */
  retrieve(id, callback){
    this.database.find({ _id: id }, {}, function(err, stories){
      let status = 200;
      let data = { stories: stories };
      callback(data, status);
    });
  }

}


module.exports = StoriesManager;
