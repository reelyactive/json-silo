/**
 * Copyright reelyActive 2014-2015
 * We believe in an open Internet of Things
 */

var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
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
var DEFAULT_UNSPECIFIED_DURATION = "15m";
var DEFAULT_USERNAME = "admin";
var DEFAULT_PASSWORD = "admin";
var DEFAULT_SECRET = "YoureProbablyGonnaWantToChangeIt";


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
  this.password = options.password || DEFAULT_PASSWORD;
  this.secret = options.secret || DEFAULT_SECRET;

  this.app = express();
  this.silo = new siloManager();

  if(this.useCors) {
    this.app.use(cors());
  }
  this.app.use(bodyParser.urlencoded({ extended: false }));
  this.app.use(bodyParser.json());
  this.app.use(session( { secret: self.secret } ));
  this.app.use(passport.initialize());
  this.app.use(passport.session());

  this.router = express.Router();
  this.router.use(function(req, res, next) {
    // TODO: basic error checking goes here in the middleware
    next();
  });

  // ----- route: /places ------
  this.router.route('/places')

    .get(function(req, res) {
      res.json(self.places);
    });

  // ----- route: /durations ------
  this.router.route('/durations')

    .get(function(req, res) {
      res.json(self.durations);
    });

  // ----- route: /hlcurl ------
  this.router.route('/hlcurl')

    .get(function(req, res) {
      res.json( { url: self.hlcServerUrl } );
    });

  // ----- route: /authentication ------
  this.router.route('/authentication')

    .get(function(req, res) {
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

  // ----- route: /logout ------
  this.router.route('/logout')

    .get(function(req, res) {
      req.session.destroy(function() {
        res.redirect('/login.html');      
      });
    });

  // ----- route: /users ------
  this.router.route('/users')

    .get(function(req, res) {
      if(isAuthenticated(self, req)) {
        self.silo.findAll(function(result) {
          res.json(result);
        });
      } 
      else {
        res.redirect('/login.html');
      } 
    });

  // ----- route: /add ------ ** LEGACY ** TODO supercede by story
  this.router.route('/add')

    .post(function(req, res) {
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

  // ----- route: /story ------
  this.router.route('/story')

    .post(function(req, res) {
      if(isAuthenticated(self, req)) {
        addJson(self, getRequestParameters(req), function(url, place) {
          // TODO: add this to responsehandler
          res.json( { "_meta": { "message": "ok",
                                 "statusCode": 200 },
                      "_links": { "self": { "href": url } } } );
        });
      }
      else {
        res.json(responseHandler.prepareFailureResponse("badRequest"));
      }
    });

  // ----- route: /story/:id ------
  this.router.route('/story/:id')

    .get(function(req, res) {
      self.silo.find(req.param('id'), function(result) {
        res.json(result);
      });
    })

    .delete(function(req, res) {
      if(isAuthenticated(self, req)) {
        self.silo.remove(req.param('id'));
        res.end('success');
      }
      else {
        res.redirect('/login.html');
      }
    });

  // ----- route: /id/:id ------ ** LEGACY ** superceded by story
  this.router.route('/id/:id')

    .get(function(req, res) {
      self.silo.find(req.param('id'), function(result) {
        res.json(result);
      });
    })

    .delete(function(req, res) {
      if(isAuthenticated(self, req)) {
        self.silo.remove(req.param('id'));
        res.end('success');
      }
      else {
        res.redirect('/login.html');
      }
    });

  // ----- route: /at/:place ------
  this.router.route('/at/:place')

    .get(function(req, res) {
      searchByPlace(self, getRequestParameters(req), function(result) {
        res.json(result);
      });
    });

  // ----- route: /login ------
  this.router.route('/login')

    .post(passport.authenticate('local', { failureRedirect: '/login.html',
                                           successRedirect: '/' })
    );


  passport.serializeUser(function(user, done) { done(null, user); });
  passport.deserializeUser(function(user, done) { done(null, user); });

  passport.use(new LocalStrategy(
    function(username, password, done) {
      if (password === self.password)
        return done(null, { username: DEFAULT_USERNAME });
      else
        return done(null, false);
    }
  ));

  this.app.use('/', express.static(__dirname + '/../web'));
  this.app.use('/', self.router);

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
  if ((!req.user) && (instance.password !== null))
    return false;

  return (instance.password === null) || 
         (req.user.username === DEFAULT_USERNAME);
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
  json.expireAfter = getExpiration(DEFAULT_UNSPECIFIED_DURATION);
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
