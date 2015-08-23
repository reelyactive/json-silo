/**
 * Copyright reelyActive 2014-2015
 * We believe in an open Internet of Things
 */


var DEFAULT_JSON = { person: { } };
var DEFAULT_PLACE = { title: "-", value: "" };
var DEFAULT_DURATION = { title: "1 hour", value: "1h" };
var DEFAULT_AUTHENTICATION = { useAuthentication: false };


angular.module('jsonSilo', [ 'ui.bootstrap' ])

  // Interaction controller
  .controller('InteractionCtrl', function($scope, $http, $modal, $window) {
    $scope.person = {};
    $scope.places = [];
    $scope.durations = [];
    $scope.hlcUrl = null;
    $scope.ssUrl = null;
    $scope.authentication = DEFAULT_AUTHENTICATION;
    $scope.json = DEFAULT_JSON;

    $http.get('/places')
      .success(function(data, status, headers, config) {
        $scope.places = data;
        $scope.place = $scope.places[0].value;
      })
      .error(function(data, status, headers, config) {
        $scope.places = [ DEFAULT_PLACE ];
        $scope.place = $scope.places[0].value;
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

    $scope.submit = function() {
      var story = { story: $scope.json.person };
      var place = null;
      if((typeof($scope.place) !== 'undefined') && ($scope.place !== '')) {
        place = $scope.place;
        story.story.place = place;
      }
      story.story.duration = $scope.duration;
      $http.post('/stories', story)
        .success(function(data, status, headers, config) {
          var items = { success: true,
                        data: data,
                        place: place,
                        hlcUrl: $scope.hlcUrl,
                        ssUrl: $scope.ssUrl };
          openModal(items);
        })
        .error(function(data, status, headers, config) {
          var items = { success: false, data: data };
          openModal(items);
          delete story.story.place;
          delete story.story.duration;
        }); 
    };

    function openModal(items) {
      $modal.open( { animation: true,
                     templateUrl: 'modal.html',
                     controller: 'ModalCtrl',
                     size: 'md',
                     resolve: { items: function() { return items; } }
                   } );
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
    $scope.associate.show = (items.hlcUrl !== null);
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
