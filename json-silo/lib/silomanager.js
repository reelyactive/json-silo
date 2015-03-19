/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */

var nedb = require('nedb');
var SILO_DB = "silo.db";



/**
 * SiloManager Class
 * Manages the persistent JSON entries
 * @constructor
 */
function SiloManager() {
  var self = this;
  this.db = new nedb({filename: SILO_DB, autoload: true });

};


module.exports = SiloManager;
