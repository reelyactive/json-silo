/**
 * Copyright reelyActive 2014
 * We believe in an open Internet of Things
 */

var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var cors = require('cors');
var siloManager = require('./silomanager');
var responseHandler = require('./responsehandler');

var HTTP_PORT = 3002;
var USE_CORS = false;
var HLC_SERVER_URL = "http://localhost:3001";
var SMARTSPACES_URL = "http://localhost:3000";
var DEFAULT_PLACES = [ { title: "The Barn", value: "test" },
                       { title: "-", value: "" } ];
var DEFAULT_DURATIONS = [ { title: "1 hour", value: "1h" },
                          { title: "4 hours", value: "4h" },
                          { title: "12 hours", value: "12h" },
                          { title: "24 hours", value: "24h" } ];


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
  this.useCors = options.useCors || USE_CORS;
  this.hlcServerUrl = options.hlcServerUrl || HLC_SERVER_URL;
  this.smartspacesUrl = options.smartspacesUrl || SMARTSPACES_URL;
  this.places = options.places || DEFAULT_PLACES;
  this.durations = options.durations || DEFAULT_DURATIONS;
  this.password = options.password;

  this.app = express();
  this.silo = new siloManager();

  if(this.useCors) {
    this.app.use(cors());
  }
  this.app.use(bodyParser.urlencoded({ extended: false }));
  this.app.use(cookieParser());
  this.app.use(session({secret: '0t62FKHOyzT7OwZvGG0CuLh2vU5Xo7TX'}));

  this.app.use('/', express.static(__dirname + '/../web'));

  this.app.get('/places', function(req, res) {
    res.json(self.places);
  });

  this.app.get('/durations', function(req, res) {
    res.json(self.durations);
  });

  this.app.get('/hlcurl', function(req, res) {
    res.json( { url: self.hlcServerUrl } );
  });

  this.app.get('/authentication', function(req, res) {
    if(self.password == null) {
      res.json( { useAuthentication: false } );
    }
    else if(isAuthenticated(self, req)) {
      res.json( { useAuthentication: true, authenticated: true } );
    }
    else {
      res.json( { useAuthentication: true, authenticated: false } );
    }
  });

  this.app.get('/logout', function(req, res) {
    req.session.destroy(function() {
      res.redirect('/login.html');      
    });
  });

  this.app.get('/id/:id', function(req, res) {
    self.silo.find(req.param('id'), function(result) {
      res.json(result);
    });
  });

  this.app.get('/at/:place', function(req, res) {
    searchByPlace(self, getRequestParameters(req), function(result) {
      res.json(result);
    });
  });

  this.app.post('/login', function(req, res) {
    req.session.password = req.body.password.toString();
    if(isAuthenticated(self, req)) {
      req.session.success = "Authenticated";
      res.redirect('/');
    }
    else {
      req.session.success = "Authentication failed";
      res.redirect('/login.html');
    }
  });

  this.app.post('/add', function(req, res) {
    if(isAuthenticated(self, req)) {
      addJson(self, getRequestParameters(req), function(url, place) {
        var redirectUrl = 'added.html?url=' + url;
        if(place) { 
          redirectUrl += '&placeUrl=' + self.smartspacesUrl + '/' + place
        }
        res.redirect(redirectUrl);
      });
    }
    else {
      res.redirect('/login.html');
    }
  });


  //this.app.post('/checkin', function(req, res) {
  //  checkInJson(self, getRequestParameters(req), function(url) {
  //    res.redirect('checkedin.html?url=' + url);
  //  });
  //});

  this.app.listen(this.httpPort, function() {
    console.log("json-silo is listening on port", self.httpPort);
  });
}


/**
 * Check if the given session is authenticated. Always return true when
 * password protection is waived (instance.password == null).
 * @param {JSONSilo} instance The given JSONSilo instance.
 * @param {Object} req The request.
 */
function isAuthenticated(instance, req) {
  var sessionPassword = req.session.password;
  return (instance.password == null) ||
         (instance.password == sessionPassword);
}


/**
 * Return the API request parameters as an object.
 * @param {Object} req The request.
 */
function getRequestParameters(req) {
  var params = {};
  params.place = req.param('place');
  params.rootUrl = req.protocol + '://' + req.get('host');
  params.queryPath = req.originalUrl;
  params.body = req.body;
  return params;
}


/**
 * Search hyperlocal context based on a place.
 * @param {JSONSilo} instance The given JSONSilo instance.
 * @param {Object} params The parameters to search on.
 * @param {function} callback Function to call on completion.
 */
function searchByPlace(instance, params, callback) {
  instance.silo.findAt(params.place, function(present) {
    var foundNothing = !Object.keys(present).length;
    if(foundNothing) {
      if(isKnownPlace(instance, params.place)) {
        callback(responseHandler.prepareLonelyResponse(params));
      }
      else {
        callback(responseHandler.prepareFailureResponse("notFound"));
      }
    }
    else {
      callback(responseHandler.prepareResponse(present, params));
    }
  });
}


/**
 * Add a JSON object to the silo.
 * @param {JSONSilo} instance The given JSONSilo instance.
 * @param {Object} params The parameters to use.
 * @param {function} callback Function to call on completion.
 */
function addJson(instance, params, callback) {
  var json = parsePost(params.body);
  instance.silo.add(json, function(id) {
    var url = params.rootUrl + '/id/' + id;
    var place = json.place;
    callback(url, place); // TODO: handle the case where the JSON was not added
  });
}


/**
 * Check-in the JSON at the given place. 
 * @param {JSONSilo} instance The given JSONSilo instance.
 * @param {Object} params The parameters to use.
 * @param {function} callback Function to call on completion.
 */
function checkInJson(instance, params, callback) {
  var checkIn = parseCheckIn(params.body);
  instance.silo.checkIn(checkIn, function(place) {
    if(place == null) { callback(params.rootUrl); }
    else { callback(instance.smartspacesUrl + '/' + place); }
  });
}


/**
 * Parse the HTTP POST and return a correctly structured JSON object.
 * @param {Object} post The post as processed by body-parser.
 */
function parsePost(post) {
  var json = { json: { person: { } } };
  for(key in post) {
    var value = post[key];
    if(value !== "") {
      switch(key) {
        case "place":
          json.place = post[key];
          break;
        case "duration":
          json.expireAfter = getExpiration(post[key]);
          break;
        case "action":
          break;
        default:
          json.json.person[key] = post[key];
      }
    }
  }
  return json;
}


/**
 * Parse the HTTP POST of a Check-In.
 * @param {Object} post The post as processed by body-parser.
 */
function parseCheckIn(post) {
  var json = {};
  for(key in post) {
    var value = post[key];
    if(value !== "") {
      switch(key) {
        case "id":
          json._id = post[key];
          break;
        case "place":
          json.place = post[key];
          break;
      }
    }
  }
  return json;
}


/**
 * Return an expiration timestamp based on the given duration.
 * @param {String} duration The duration expressed as a String (##u).
 * @return {String} The expiry timestamp in ISO8601 format.
 */
function getExpiration(duration) {
  var durationValue = parseInt(duration.slice(0, duration.length - 1));
  var durationUnits = duration.slice(-1);
  var currentTime = new Date();
  var additionalMinutes = 0;
  switch(durationUnits) {
    case "m":
      additionalMinutes = durationValue;
      break;
    case "h":
      additionalMinutes = durationValue * 60;
      break; 
    case "d":
      additionalMinutes = durationValue * 1440;
      break;    
    default:
      additionalMinutes = 15;
      break;
  }
  var futureTime = currentTime.setMinutes(currentTime.getMinutes()
                                          + additionalMinutes);
  return new Date(futureTime).toISOString();
}


/**
 * Return whether the given place is part of the list of places or not.
 * @param {JSONSilo} instance The given JSONSilo instance.
 * @param {String} place The name of the place.
 * @return {boolean} True or false.
 */
function isKnownPlace(instance, place) {
  for(var cPlace = 0; cPlace < instance.places.length; cPlace++) {
    if(instance.places[cPlace].value === place) {
      return true;
    }
  }
  return false;
}


module.exports = JSONSilo;
