/**
 * Copyright reelyActive 2016
 * We believe in an open Internet of Things
 */

angular.module('story', [ 'reelyactive.cuttlefish', 'ngSanitize' ])

  // Story controller
  .controller('StoryCtrl', function($scope, $http, $window) {
    var url = $window.location.href;
    $scope.device = {};

    $http.defaults.headers.common.Accept = 'application/json';
    $http.get(url)
      .success(function(data, status, headers, config) {
        $scope.device.story = data;
      })
      .error(function(data, status, headers, config) {
        console.log('GET ' + url + ' status: ' + status);
      });

    // Verify if the device's story has been fetched successfully
    $scope.hasFetchedStory = function() {
      return $scope.device.hasOwnProperty('story');
    };

    // Verify if the device's story has been fetched successfully
    $scope.getSize = function() {
      console.log($window.innerHeight + ' ' + $window.innerWidth);
      return Math.min(($window.innerHeight / 3), ($window.innerWidth / 2)) +
             'px';
    };

  });
