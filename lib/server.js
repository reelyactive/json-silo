/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */

var http              = require('http');
var express           = require('express');
var bodyParser        = require('body-parser');
var async             = require("async");
var morgan            = require("morgan");
var SiloManager       = require('./silomanager');

var HTTP_PORT         = 3002;

/**
 * JSONSilo Class
 * Datastore for JSON compatible with Smart Spaces.
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
function JSONSilo(options) {
  var self = this;

  options = options || {};
  self.specifiedHttpPort = options.httpPort || HTTP_PORT;
  self.httpPort = process.env.PORT || self.specifiedHttpPort;

  self.app = express();

  self.app.use(bodyParser.urlencoded({ extended: true }));
  self.app.use(bodyParser.json());
  self.app.use(morgan("dev"));

  self.app.use(function(req, res, next) {
    req.instance = self;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
  });

  self.silomanager = new SiloManager();

  // Include the routes
  self.app.use('/login', require('./routes/login'));
  self.app.use('/keygen', require('./routes/keygen'));
  self.app.use('/data', require('./routes/data'));

  /*
  require('./routes/setpublic')(self.app, self.silomanager);
  require('./routes/getpublic')(self.app, self.silomanager);

  require('./routes/reelyactiveregister')(self.app, self.silomanager);
  require('./routes/reelyactiveremove')(self.app, self.silomanager);
  */

  self.app.listen(self.httpPort, function() {
    console.log("json-silo is listening on port", self.httpPort);
  });
}


module.exports = JSONSilo;
