NO_STORY_MESSAGE = "There is no story to be seen here.\r\nAre you sure you've got the URL right?\r\nPerhaps the story has expired?";

angular.module('story', [ 'ui.bootstrap' ])

  // Story controller
  .controller('StoryCtrl', function($scope, $http, $window) {
    var url = $window.location.href;
    $scope.image = '../images/json-silo.png';

    $http.defaults.headers.common.Accept = 'application/json';
    $http.get(url)
      .success(function(data, status, headers, config) {
        $scope.story = JSON.stringify(data, null, "  ");
        if(data.hasOwnProperty("@graph")) {
          for(var cEntry = 0; cEntry < data["@graph"].length; cEntry++) {
            if(data["@graph"][cEntry].hasOwnProperty("schema:image")) {
              $scope.image = data["@graph"][cEntry]["schema:image"];
              break;
            }
          }
        }
      })
      .error(function(data, status, headers, config) {
        $scope.story = NO_STORY_MESSAGE;
      });

  });
