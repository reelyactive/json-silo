/**
 * Copyright reelyActive 2015-2022
 * We believe in an open Internet of Things
 */


const ESMapDB = require('esmapdb');


const DEFAULT_DATA_FOLDER = 'data';
const DEFAULT_ASSOCIATION_DB = 'stories';


/**
 * ESMapDBManager Class
 * Manages an ESMapDB database instance.
 */
class ESMapDBManager {

  /**
   * EsMapDBManager constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    options = options || {};

    let persistentLocation = DEFAULT_DATA_FOLDER + '/' + DEFAULT_ASSOCIATION_DB;
    this.database = new ESMapDB({ createInMemory: true,
                                  createPersistent: true,
                                  persistentLocation: persistentLocation,
                                  persistentValueEncoding: 'json' });
  }

  /**
   * Delete the pair associated with the given key from database.
   * @param {String} key The key to look up.
   * @param {function} callback Function to call on completion.
   */
  delete(key, callback) {
    this.database.delete(key, callback);
  }

  /**
   * Get the value associated with the given key from database.
   * @param {String} key The key to look up.
   * @param {function} callback Function to call on completion.
   */
  get(key, callback) {
    this.database.get(key, callback);
  }

  /**
   * Determine if the given key exists in the database.
   * @param {String} key The key to look up.
   * @param {function} callback Function to call on completion.
   */
  has(key, callback) {
    this.database.has(key, callback);
  }

  /**
   * Set the value associated with the given key in the database.
   * @param {String} key The key to look up.
   * @param {function} callback Function to call on completion.
   */
  set(key, value, callback) {
    this.database.set(key, value, callback);
  }

  /**
   * Find all key/value pairs in the database that match the given query.
   * @param {Object} query The query parameters.
   * @param {function} callback Function to call on completion.
   */
  find(query, callback) {
    let result = new Map();

    this.database.forEach((value, key) => {
      // TODO: handle query rather than assuming 'get all'
      result.set(key, value);
    });

    callback(undefined, result);

    return result;
  }

}


module.exports = ESMapDBManager;
