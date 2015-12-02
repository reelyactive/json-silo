/**
 * Copyright reelyActive 2014-2015
 * We believe in an open Internet of Things
 */


var DEFAULT_JSON = { person: { } };
var DEFAULT_DURATION = { title: "1 hour", value: "1h" };
var DEFAULT_AUTHENTICATION = { useAuthentication: false };
var RECEIVER_PATH = '/whatat/receiver/';
var ASSOCIATION_PATH = '/associations/';
var DEFAULT_POLLING_MILLISECONDS = 1000;
var RSSI_THRESHOLD = 185;


angular.module('jsonSilo', [ 'ui.bootstrap' ])

  // Interaction controller
  .controller('InteractionCtrl', function($scope, $http, $modal, $interval, $window) {
    $scope.person = {};
    $scope.places = [];
    $scope.durations = [];
    $scope.hlcUrl = null;
    $scope.ssUrl = null;
    $scope.authentication = DEFAULT_AUTHENTICATION;
    $scope.json = DEFAULT_JSON;
    $scope.showLanding = true;
    $scope.showOnboarding = false;
    $scope.showStory = false;
    $scope.type = null;

    $http.get('/stations')
      .success(function(data, status, headers, config) {
        $scope.stations = data;
        $scope.station = $scope.stations[0].id;
        $scope.showStations = true;
      })
      .error(function(data, status, headers, config) {
        $scope.stations = [];
        $scope.station = '';
        $scope.showStations = false;
      });

    $http.get('/places')
      .success(function(data, status, headers, config) {
        $scope.places = data;
        $scope.place = $scope.places[0].value;
        $scope.showPlaces = true;
      })
      .error(function(data, status, headers, config) {
        $scope.places = [];
        $scope.place = '';
        $scope.showPlaces = false;
      });


    $http.get('/durations')
      .success(function(data, status, headers, config) {
        $scope.durations = data;
        $scope.duration = $scope.durations[0].value;
      })
      .error(function(data, status, headers, config) {
        $scope.durations = [ DEFAULT_DURATION ];
        $scope.duration = $scope.durations[0].value;
      });

    $http.get('/hlcurl')
      .success(function(data, status, headers, config) {
        $scope.hlcUrl = data.url;
      })
      .error(function(data, status, headers, config) {
        $scope.hlcUrl = null;
      });

    $http.get('/ssurl')
      .success(function(data, status, headers, config) {
        $scope.ssUrl = data.url;
      })
      .error(function(data, status, headers, config) {
        $scope.ssUrl = null;
      });

    $http.get('/authentication')
      .success(function(data, status, headers, config) {
        $scope.authentication = data;
      })
      .error(function(data, status, headers, config) {
        $scope.authentication = DEFAULT_AUTHENTICATION;
      });

    $scope.proceed = function(action) {
      switch(action) {
        case 'story':
          $scope.showStory = true;
          $scope.showLanding = false;
          $scope.showOnboarding = false;
          break;
        case 'onboarding':
          $scope.showOnboarding = true;
          $scope.showLanding = false;
          $scope.showStory = false;
          break;
        case 'landing':
        default:
          $scope.showLanding = true;
          $scope.showStory = false;
          $scope.showOnboarding = false;
          break;
      }
    };

    $scope.change = function() {
      for(var key in $scope.person) {
        if($scope.person.hasOwnProperty(key)) {
          var value = $scope.person[key];
          if(!value.length) {
            delete $scope.json.person[key];
          }
          else {
            $scope.json.person[key] = value;
          }
        }
      }
    };

    $scope.startScanning = function() {
      $scope.pollingPromise = $interval(queryStation,
                                        DEFAULT_POLLING_MILLISECONDS);
    };

    $scope.stopScanning = function() {
      $interval.cancel($scope.pollingPromise);
    };

    $scope.submit = function() {
      var story = { story: $scope.json.person };
      var place = null;
      var associated = null;
      if(($scope.type === 'check-in') &&
         (typeof($scope.place) !== 'undefined') && ($scope.place !== '')) {
        place = $scope.place;
        story.story.place = place;
      }
      story.story.duration = $scope.duration;
      $http.post('/stories', story)
        .success(function(data, status, headers, config) {
          var items = { success: true,
                        data: data,
                        place: place,
                        associated: associated,
                        hlcUrl: $scope.hlcUrl,
                        ssUrl: $scope.ssUrl };
          if($scope.type === 'onboarding') {
            var url = data.devices[Object.keys(data.devices)[0]].url;
            associate(url, function(err) {
              if(err) {
                items.success = false;
              }
              else {
                associated = true;
              }
              openModal(items);
            });
          }
          else {
            openModal(items);
          }
        })
        .error(function(data, status, headers, config) {
          var items = { success: false, data: data };
          openModal(items);
          delete story.story.place;
          delete story.story.duration;
        }); 
    };

    function associate(url, callback) {
      // TODO: figure out PUT with CORS
      $http.put($scope.hlcUrl + ASSOCIATION_PATH + $scope.onboardingId,
                { url: url })
        .success(function(data, status, headers, config) {
          callback();
        })
        .error(function(data, status, headers, config) {
          callback('Error associating device with story');
        }); 
    }

    function queryStation() {
      $http.defaults.headers.common.Accept = 'application/json';
      $http.get($scope.hlcUrl + RECEIVER_PATH + $scope.station)
        .success(function(data, status, headers, config) {
          updateOnboarding(getStrongest(data.devices));
        })
        .error(function(data, status, headers, config) {
          updateOnboarding(null);
        });
    }

    function getStrongest(devices) {
      var strongestDevice = null;
      var strongestRssi = 0;
      for(deviceId in devices) {
        var device = devices[deviceId];
        for(var cDecoding = 0; cDecoding < device.radioDecodings.length;
            cDecoding++) {
          var decoding = device.radioDecodings[cDecoding];
          if((decoding.identifier.value === $scope.station) &&
             (decoding.rssi > RSSI_THRESHOLD) &&
             (decoding.rssi > strongestRssi)) {
            strongestDevice = device;
            strongestRssi = decoding.rssi;
          }
        } 
      }
      return strongestDevice;
    }

    function updateOnboarding(device) {
      if(device) {
        // TODO: create a function to show only the pertinent details
        $scope.onboardingCandidate = JSON.stringify(device.identifier,
                                                    null, " ");
        $scope.onboardingId = device.identifier.value;
      }
      else {
        $scope.onboardingCandidate = null;
      }
    }

    function openModal(items) {
      var modal = $modal.open( { animation: true,
                                 templateUrl: 'modal.html',
                                 controller: 'ModalCtrl',
                                 size: 'md',
                                 resolve: { items: function() {
                                                     return items; } } } );
      modal.result.then(function() {}, function() {
        $scope.proceed('landing');
      });
    }

  })


  // Modal controller
  .controller('ModalCtrl', function($scope, $modalInstance, items) {
    $scope.success = items.success;
    $scope.data = items.data;
    var url = '';
    if($scope.success) {
      var devices = $scope.data.devices;
      url = devices[Object.keys(devices)[0]].url;
    }
    $scope.url = url;
    $scope.associate = {};
    $scope.associate.show = (!items.associated) && (items.hlcUrl !== null);
    $scope.associate.url = items.hlcUrl +
                           '/associate.html?url=' +
                           $scope.url;
    $scope.visit = {};
    $scope.visit.show = (items.place !== null);
    $scope.visit.url = items.ssUrl + '/' + items.place;

    $scope.dismiss = function () {
      $modalInstance.dismiss('cancel');
    };
  });
