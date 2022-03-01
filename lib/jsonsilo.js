/**
 * Copyright reelyActive 2014-2022
 * We believe in an open Internet of Things
 */


const express = require('express');
const path = require('path');
const DatabaseManager = require('./databasemanager');
const StoriesManager = require('./storiesmanager');
const ImagesManager = require('./imagesmanager');


/**
 * JSONSilo Class
 * Data silo for digital twins in context-aware physical spaces.
 */
class JSONSilo {

  /**
   * JSONSilo constructor
   * @param {Object} options The configuration options.
   * @constructor
   */
  constructor(options) {
    let self = this;
    options = options || {};

    if(options.app) {
      configureExpress(options.app, self);
    }

    this.database = new DatabaseManager(options);
    this.stories = new StoriesManager(options, self.database);
    this.images = new ImagesManager(options);

    console.log('reelyActive json-silo instance is hosting digital twins in an open IoT');
  }

}


/**
 * Configure the routes of the API.
 * @param {Express} app The Express app.
 * @param {JSONSilo} instance The JSON Silo instance.
 */
function configureExpress(app, instance) {
  app.use(function(req, res, next) {
    req.jsonsilo = instance;
    next();
  });
  app.use('/stories', require('./routes/stories'));
  app.use('/store', require('./routes/store'));
  app.use('/', express.static(path.resolve(__dirname + '/../web')));
}


module.exports = JSONSilo;
