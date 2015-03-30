/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */

var http              = require('http');
var express           = require('express');
var bodyParser        = require('body-parser');
var async             = require("async");         
var siloManager       = require('./silomanager');

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
  this.specifiedHttpPort = options.httpPort || HTTP_PORT;
  this.httpPort = process.env.PORT || this.specifiedHttpPort;

  this.app = express();

  this.app.use(bodyParser.urlencoded({ extended: true }));
  this.app.use(bodyParser.json());

  this.app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
  });

  this.app.listen(this.httpPort, function() {
    console.log("json-silo is listening on port", self.httpPort);
  });
}


module.exports = JSONSilo;
