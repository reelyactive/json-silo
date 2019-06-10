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


 retrieve(id, type, property, cb){
   let identifier = id + '/' + type;
   let query = { _id: identifier };
   let projection = {};

   this.database.find(query, projection, function(err, stories){
    let status = 200;
    let data = { stories: stories };
    cb(data, status);
   });

 }

  find (id, cb){
    this.db.find({ _id: id }, function(err, docs){
    let result= docs[0];
    let json = {};
    if(result != null){
      json = result.json;
    }
    cb(json);
    });
  }

  insert(story, callback){
    console.log('this passses', story);
    //let identifier = id + '/' + type;
    // let story = prepareStory(url, directory, tags, position);
    

    // let query = { _id: identifier };
    // let update  =  { $set : story};
    // let options = { upsert: true };

    this.database.insert(story,
      function(err, newDoc){
        console.log(err, newDoc);
        if(err) {
          return callback(400);
        } 
        else{
          return callback(200, {stories: newDoc});
        }

      });
  }


  
}
function prepareStory(story) {
  let story = {};

  if(url && (typeof url === 'string')) {
    story.url = url;
  }
  if(directory && (typeof url === 'string')) {
    story.directory = directory;
  }
  if(tags && Array.isArray(tags)) {
    story.tags = tags;
  }
  if(position && Array.isArray(position)) {
    story.position = position;
  }

  return story;
}

module.exports = StoriesManager;