/**
 * Copyright reelyActive 2014-2019
 * We believe in an open Internet of Things
 */


const nedb = require('nedb');


const DEFAULT_DATA_FOLDER = 'data';
const DEFAULT_ASSOCIATION_DB = 'story.db';


/**
 * NeDBManager Class
 * Manages an NeDB database instance.
 */
class NeDBManager {

  /**
   * NeDBManager constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    options = options || {};

    let filename = DEFAULT_DATA_FOLDER + '/' + DEFAULT_ASSOCIATION_DB;
    this.database = new nedb({ filename: filename, autoload: true });
  }

  /**
   * Insert a document in the database.
   * @param {Object} doc The document to insert.
   * @param {function} callback Function to call on completion.
   */
  insert(doc, callback) {
    this.database.insert(doc, callback);
  }

  /**
   * Find all documents that match the query in the database, observing the
   * given projection.
   * @param {Object} query The database query.
   * @param {Object} projection The projection to observe.
   * @param {function} callback Function to call on completion.
   */
  find(query, projection, callback) {
    this.database.find(query, projection, callback);
  }

  /**
   * Update all documents that match the query in the database.
   * @param {Object} query The database query.
   * @param {Object} update The update to apply.
   * @param {Object} options The update options.
   * @param {function} callback Function to call on completion.
   */
  update(query, update, options, callback) {
    this.database.update(query, update, options, callback);
  }

  /**
   * Remove all documents that match the query in the database.
   * @param {Object} query The database query.
   * @param {Object} options The removal options.
   * @param {function} callback Function to call on completion.
   */
  remove(query, options, callback) {
    this.database.remove(query, options, callback);
  }
}


module.exports = NeDBManager;