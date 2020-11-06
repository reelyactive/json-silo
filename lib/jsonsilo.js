/**
 * Copyright reelyActive 2014-2019
 * We believe in an open Internet of Things
 */


const http = require('http');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const databasemanager = require('./databasemanager');
const nedbmanager = require('./nedbmanager');
const storiesmanager = require('./storiesmanager');
const imagesmanager = require('./imagesmanager');


const HTTP_PORT = 3000;
const DEFAULT_USE_CORS = true;


/**
 * JSONSilo Class
 * Contextual data silo for the IoT and the Physical Web.
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
    self.specifiedHttpPort = options.httpPort || HTTP_PORT;
    self.httpPort = process.env.PORT || self.specifiedHttpPort;
    self.useCors = options.useCors || DEFAULT_USE_CORS;

    self.database = new databasemanager(options);
    self.stories = new storiesmanager(options, self.database);
    self.images = new imagesmanager(options);

    // Run the json-silo with the provided express app
    if(options.app) {
      self.app = options.app;
    }

    // Create an express app for the json-silo
    else {
      self.app = express();
      self.server = http.createServer(self.app);

      if(self.useCors) {
        self.app.use(cors());
      }

      self.server.listen(self.httpPort, function() {
        console.log('reelyActive json-silo listening on port', self.httpPort);
      });
    }

    self.router = express.Router();
    self.app.use(bodyParser.json({limit: '50mb'}));

    self.app.use(function(req, res, next) {
      req.jsonsilo = self;
      next();
    });
   
    self.app.use('/stories', require('./routes/stories'));
    self.app.use('/images', require('./routes/images'));
    self.app.use('/', express.static(path.resolve(__dirname + '/../web')));  
  }

}


module.exports = JSONSilo;
