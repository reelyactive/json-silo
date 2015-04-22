/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */

var http              = require('http');
var express           = require('express');
var bodyParser        = require('body-parser');
var async             = require("async");
var morgan            = require("morgan");
var passport          = require("passport");
var SiloManager       = require('./silomanager');
var responseHandler   = require('./responsehandler');

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

  self.silomanager = new SiloManager();

  self.app.use(bodyParser.urlencoded({ extended: true }));
  self.app.use(passport.initialize());
  self.app.use(bodyParser.json());
  self.app.use(morgan("dev"));

  self.app.use(function(req, res, next) {
    req.instance = self;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
  });

  // Include the routes
  self.app.use('/', require('./routes/public'));
  self.app.use('/login', require('./routes/login'));
  self.app.use('/keys', require('./routes/keys'));
  self.app.use('/data', require('./routes/data'));
  self.app.use('/transactions', require('./routes/transactions'));
  self.app.use('/reelyactive', require('./routes/reelyactive'));

  // Error handing middleware
  self.app.use(function(err, req, res, next) {

    var rootUrl = req.protocol + '://' + req.get('host');
    var queryPath = req.originalUrl;
    var status = (err.status || 500);
    var response = null;
    response = responseHandler.prepareResponse( status,
                                                rootUrl,
                                                queryPath,
                                                err.message
                                              );

    return res.status(status).json(response);
  });

  self.app.listen(self.httpPort, function() {
    console.log("json-silo is listening on port", self.httpPort);
  });
}


module.exports = JSONSilo;
