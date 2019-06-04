/**
 * Copyright reelyActive 2014-2019
 * We believe in an open Internet of Things
 */

  //TO-DO: fill after undestanding and setting up NeDB
const NeDBManager = require('./nedbmanager');

/**
 * DatabaseManager Class
 * Manages the database(s) in which the data is stored, abstracting away the
 * implementation details.
 */
 class DatabaseManager {
   /**
   * DatabaseManager constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    options = options || {};
    
    //this.database = new NeDBManager(options);
  }
 }
 module.exports = DatabaseManager;