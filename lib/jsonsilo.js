/**
 * Copyright reelyActive 2014-2019
 * We believe in an open Internet of Things
 */

const http = require('http');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const databasemanager = require('./databasemanager');
const nedbmanager = require('./nedbmanager');
const storiesmanager = require('./storiesmanager');
const imagesmanager = require('./imagesmanager');
const multer = require('multer');


const HTTP_PORT = 3000;


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

    self.app = express();

    self.database = new databasemanager(options);
    self.stories = new storiesmanager(options, self.database);
    self.images = new imagesmanager(options);
    self.server = http.createServer(self.app);
    self.router = express.Router();

    self.app.use(bodyParser.json());

    self.app.use(function(req, res, next) {
      req.jsonsilo = self;
      next();
    });
   
    self.app.use('/stories', require('./routes/stories'));
    self.app.use('/images', require('./routes/images'));
    self.app.use('/', self.router);
    self.app.use('/', express.static(path.resolve(__dirname + '/../web')));
    
    self.server.listen(self.httpPort, function(){
      console.log('reelyActive json-silo listening on port', self.httpPort);
    })
    
  }


}
module.exports = JSONSilo;