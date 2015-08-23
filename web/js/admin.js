/**
 * Copyright reelyActive 2015
 * We believe in an open Internet of Things
 */


var DEFAULT_AUTHENTICATION = { useAuthentication: false };


angular.module('jsonSilo', [ 'ui.bootstrap' ])

  // Interaction controller
  .controller('InteractionCtrl', function($scope, $http, $modal, $window) {
    $scope.authentication = DEFAULT_AUTHENTICATION;

    $http.get('/authentication')
      .success(function(data, status, headers, config) {
        $scope.authentication = data;
      })
      .error(function(data, status, headers, config) {
        $scope.authentication = DEFAULT_AUTHENTICATION;
      });

  })


  // Stories controller
  .controller('StoriesCtrl', function($scope, $http) {
    $scope.stories = [];

    $scope.delete = function(id) {
      $http.delete('/stories/' + id)
        .success(function(data, status, headers, config) {
          getStories();
        })
        .error(function(data, status, headers, config) {
          // TODO
        }); 
    };

    function getStories() {
      $http.get('/users')
        .success(function(data, status, headers, config) {
          $scope.stories = data;
        })
        .error(function(data, status, headers, config) {
          $scope.stories = [];
        });
    }

    getStories();

  });
