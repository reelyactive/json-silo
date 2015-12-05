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
var DEFAULT_STATIONS = [];
var DEFAULT_DIRECTORIES = [ { title: "The Barn", value: "test" } ];
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
  self.specifiedHttpPort = options.httpPort || HTTP_PORT;
  self.httpPort = process.env.PORT || this.specifiedHttpPort;
  self.useCors = options.useCors || USE_CORS;
  self.hlcServerUrl = options.hlcServerUrl || HLC_SERVER_URL;
  self.smartspacesUrl = options.smartspacesUrl || SMARTSPACES_URL;
  self.stations = options.stations || DEFAULT_STATIONS;
  self.directories = options.directories || DEFAULT_DIRECTORIES;
  self.durations = options.durations || DEFAULT_DURATIONS;
  self.password = options.password;
  self.secret = options.secret || DEFAULT_SECRET;

  self.app = express();
  self.silo = new siloManager();

  if(self.useCors) {
    self.app.use(cors());
  }
  self.app.use(bodyParser.urlencoded({ extended: false }));
  self.app.use(bodyParser.json());
  self.app.use(session( { secret: self.secret, resave: false,
                          saveUninitialized: false } ));
  self.app.use(passport.initialize());
  self.app.use(passport.session());

  // Begin new paradigm
  self.app.use(function(req, res, next) {
    req.jsonsilo = self;
    next();
  });

  self.app.use('/contextat', require('./routes/contextat'));
  self.app.use('/stories', require('./routes/stories'));
  self.app.use('/at', require('./routes/at')); // Legacy
  self.app.use('/id', require('./routes/id')); // Legacy
  // End new paradigm


  self.router = express.Router();

  // ----- route: /places ------
  self.router.route('/stations')

    .get(function(req, res) {
      res.json(self.stations);
    });

  // ----- route: /places ------
  self.router.route('/places')

    .get(function(req, res) {
      res.json(self.directories);
    });

  // ----- route: /durations ------
  self.router.route('/durations')

    .get(function(req, res) {
      res.json(self.durations);
    });

  // ----- route: /hlcurl ------
  self.router.route('/hlcurl')

    .get(function(req, res) {
      res.json( { url: self.hlcServerUrl } );
    });

  // ----- route: /ssurl ------
  self.router.route('/ssurl')

    .get(function(req, res) {
      res.json( { url: self.smartspacesUrl } );
    });

  // ----- route: /authentication ------
  self.router.route('/authentication')

    .get(function(req, res) {
      if(self.password === null) {
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
  self.router.route('/logout')

    .get(function(req, res) {
      req.session.destroy(function() {
        res.redirect('/login.html');      
      });
    });

  // ----- route: /users ------
  self.router.route('/users')

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
  self.router.route('/add')

    .post(function(req, res) {
      if(isAuthenticated(self, req)) {
        addJson(self, getRequestParameters(req), function(url, directory) {
          var redirectUrl = 'added.html?url=' + url;
          if(directory) { 
            redirectUrl += '&placeUrl=' + self.smartspacesUrl + '/' +
                           directory;
          }
          res.redirect(redirectUrl);
        });
      }
      else {
        res.redirect('/login.html');
      }
    });

  // ----- route: /login ------
  self.router.route('/login')

    .post(passport.authenticate('local', { failureRedirect: '/login.html',
                                           successRedirect: '/' })
    );


  passport.serializeUser(function(user, done) { done(null, user); });
  passport.deserializeUser(function(user, done) { done(null, user); });

  passport.use(new LocalStrategy(
    function(username, password, done) {
      if(password === self.password) {
        return done(null, { username: DEFAULT_USERNAME });
      }
      else {
        return done(null, false);
      }
    }
  ));

  self.app.use('/', express.static(__dirname + '/../web'));
  self.app.use('/', self.router);

  self.app.listen(self.httpPort, function() {
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
  if ((!req.user) && (instance.password !== null)) {
    return false;
  }

  return (instance.password === null) || 
         (req.user.username === DEFAULT_USERNAME);
}


// TODO: remove this once /add route is removed
/**
 * Return the API request parameters as an object.
 * @param {Object} req The request.
 */
function getRequestParameters(req) {
  var params = {};
  params.directory = req.param('place');
  params.rootUrl = req.protocol + '://' + req.get('host');
  params.queryPath = req.originalUrl;
  params.body = req.body;
  return params;
}


/**
 * Add the given story to the database.
 * @param {Object} story The story to add.
 * @param {String} rootUrl The root URL of the original query.
 * @param {String} queryPath The query path of the original query.
 * @param {function} callback Function to call on completion.
 */
JSONSilo.prototype.addStory = function(story, rootUrl, queryPath, callback) {
  var self = this;

  var json = parsePost(story);
  self.silo.add(json, function(id) {
    var devices = {};
    devices[id] = {};
    var data = { devices: devices };
    var status = responseHandler.OK;
    var response = responseHandler.prepareResponse(status, rootUrl,
                                                   queryPath, data);
    callback(response, status);
  });
};


/**
 * Get the given story from the database.
 * @param {String} id The story id to search for.
 * @param {String} rootUrl The root URL of the original query.
 * @param {String} queryPath The query path of the original query.
 * @param {function} callback Function to call on completion.
 */
JSONSilo.prototype.getStory = function(id, rootUrl, queryPath, callback) {
  var self = this;

  self.silo.find(id, function(story) {
    var status = responseHandler.OK;
    var foundNothing = (Object.keys(story).length === 0);
    if(foundNothing) {
      status = responseHandler.NOTFOUND;
    }
    callback(story, status);
  });
};


/**
 * Remove the given story from the database.
 * @param {String} id The story id to remove.
 * @param {String} rootUrl The root URL of the original query.
 * @param {String} queryPath The query path of the original query.
 * @param {function} callback Function to call on completion.
 */
JSONSilo.prototype.deleteStory = function(id, rootUrl, queryPath, callback) {
  var self = this;

  self.silo.remove(id, function() {
    var status = responseHandler.OK;
    var response = responseHandler.prepareResponse(status, rootUrl, queryPath);
    callback(response, status);
  });
};


/**
 * Get the context of the given directory.
 * @param {String} directory The directory to search for.
 * @param {String} rootUrl The root URL of the original query.
 * @param {String} queryPath The query path of the original query.
 * @param {function} callback Function to call on completion.
 */
JSONSilo.prototype.getDirectoryContext = function(directory, rootUrl,
                                                  queryPath, callback) {
  var self = this;
  var status;
  var response;

  self.silo.findAt(directory, function(data) {
    var foundNothing = (Object.keys(data.devices).length === 0);
    if(foundNothing) {
      if(isKnownDirectory(self, directory)) {
        data = { devices: { lonely: {} } };
        status = responseHandler.OK;
        response = responseHandler.prepareResponse(status, rootUrl, queryPath,
                                                   data);
        callback(response, status);
      }
      else {
        status = responseHandler.NOTFOUND;
        response = responseHandler.prepareResponse(status, rootUrl, queryPath);
        callback(response, status);
      }
    }
    else {
      status = responseHandler.OK;
      response = responseHandler.prepareResponse(status, rootUrl, queryPath,
                                                 data);
      callback(response, status);
    }
  });
};


// TODO: remove when /add route is changed
/**
 * Add a JSON object to the silo.
 * @param {JSONSilo} instance The given JSONSilo instance.
 * @param {Object} params The parameters to use.
 * @param {function} callback Function to call on completion.
 */
function addJson(instance, params, callback) {
  var json = parsePost(params.body);
  instance.silo.add(json, function(id) {
    var url = params.rootUrl + '/stories/' + id;
    var directory = json.directory;
    callback(url, directory); // TODO: handle the case where the JSON was not added
  });
}


/**
 * Check-in the JSON at the given directory. 
 * @param {JSONSilo} instance The given JSONSilo instance.
 * @param {Object} params The parameters to use.
 * @param {function} callback Function to call on completion.
 */
function checkInJson(instance, params, callback) {
  var checkIn = parseCheckIn(params.body);
  instance.silo.checkIn(checkIn, function(directory) {
    if(directory === null) { callback(params.rootUrl); }
    else { callback(instance.smartspacesUrl + '/' + directory); }
  });
}


/**
 * Parse the HTTP POST and return a correctly structured JSON object.
 * @param {Object} post The post as processed by body-parser.
 */
function parsePost(post) {
  var story = { json: post };

  if(post.hasOwnProperty('place')) { // Legacy, remove when appropriate
    story.directory = post['place'];
    delete post.place;
  }
  if(post.hasOwnProperty('directory')) {
    story.directory = post['directory'];
    delete post.directory;
  }
  if(post.hasOwnProperty('duration')) {
    story.expireAfter = getExpiration(post['duration']);
    delete post.duration;
  }
  else {
    story.expireAfter = getExpiration(DEFAULT_UNSPECIFIED_DURATION);
  }

  return story;
}


/**
 * Parse the HTTP POST of a Check-In.
 * @param {Object} post The post as processed by body-parser.
 */
function parseCheckIn(post) {
  var json = {};
  for(var key in post) {
    var value = post[key];
    if(value !== "") {
      switch(key) {
        case "id":
          json._id = post[key];
          break;
        case "place": // TODO: change to directory when appropriate
          json.directory = post[key];
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
  var futureTime = currentTime.setMinutes(currentTime.getMinutes() +
                                          additionalMinutes);
  return new Date(futureTime).toISOString();
}


/**
 * Return whether the given directory is part of the list of directories or not.
 * @param {JSONSilo} instance The given JSONSilo instance.
 * @param {String} directory The name of the directory.
 * @return {boolean} True or false.
 */
function isKnownDirectory(instance, directory) {
  for(var cDirectory = 0; cDirectory < instance.directories.length; cDirectory++) {
    if(instance.directories[cDirectory].value === directory) {
      return true;
    }
  }
  return false;
}


module.exports = JSONSilo;
