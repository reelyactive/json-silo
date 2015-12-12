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
var DEFAULT_RSSI_THRESHOLD = 185;
var DEFAULT_RSSI_FLOOR = 140;


angular.module('jsonSilo', [ 'ui.bootstrap' ])

  // Interaction controller
  .controller('InteractionCtrl', function($scope, $rootScope, $http, $modal,
                                          $interval, $window) {
    $scope.places = [];
    $scope.durations = [];
    $scope.hlcUrl = null;
    $scope.ssUrl = null;
    $scope.authentication = DEFAULT_AUTHENTICATION;
    $scope.json = DEFAULT_JSON;
    $scope.showLanding = true;
    $scope.showPlaces = false;
    $scope.showStations = false;
    $scope.showOnboarding = false;
    $scope.showStory = false;
    $scope.type = null;
    $scope.graph;
    initialise();

    $scope.clearAll = function() {
      initialise();
      $rootScope.$broadcast('clear');
    };

    $http.get('/stations')
      .success(function(data, status, headers, config) {
        $scope.stations = data;
        if(Array.isArray(data) && data.length) {
          $scope.station = $scope.stations[0].id;
          $scope.showStations = true;
        }
      })
      .error(function(data, status, headers, config) { });

    $http.get('/places')
      .success(function(data, status, headers, config) {
        $scope.places = data;
        if(Array.isArray(data) && data.length) {
          $scope.place = $scope.places[0].value;
          $scope.showPlaces = true;
        }
      })
      .error(function(data, status, headers, config) { });


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
        case 'duration':
          $scope.showLanding = true;
          $scope.showDuration = true;
          $scope.showStory = false;
          $scope.showOnboarding = false;
          break;
        case 'story':
        case 'check-in':
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
          $scope.showDuration = false;
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
      $scope.rssiPercentage = 0;
      $scope.pollingPromise = $interval(queryStation,
                                        DEFAULT_POLLING_MILLISECONDS);
      updateRssiThreshold();
    };

    $scope.stopScanning = function() {
      $interval.cancel($scope.pollingPromise);
    };

    $scope.submit = function(json) {
      var story = { story: json };
      var place = null; // TODO: rename to directory
      var associated = null;
      if(($scope.type === 'check-in') &&
         (typeof($scope.place) !== 'undefined') && ($scope.place !== '')) {
        place = $scope.place;
        story.story.directory = place;
      }
      story.story.duration = $scope.duration;
      postStory(story, function(url, associated, err) {
        var items = { url: url,
                      place: place,
                      associated: associated,
                      err: err,
                      hlcUrl: $scope.hlcUrl,
                      ssUrl: $scope.ssUrl };
        openModal(items);
        delete story.story.directory;
        delete story.story.duration;
      });
    };

    function initialise() {
      $scope.graph = { 
        person: { "@id": "person", "@type": "schema:Person" },
        product: { "@id": "product", "@type": "schema:Product" },
        place: { "@id": "place", "@type": "schema:Place" }
      };
    }

    function updateRssiThreshold() {
      $scope.rssiThreshold = DEFAULT_RSSI_THRESHOLD;
      $scope.rssiFloor = DEFAULT_RSSI_FLOOR;
      for(var cStation = 0; cStation < $scope.stations.length; cStation++) {
        if($scope.stations[cStation].id === $scope.station) {
          if(typeof $scope.stations[cStation].rssiThreshold === 'number') {
            $scope.rssiThreshold = $scope.stations[cStation].rssiThreshold;
          }
          if(typeof $scope.stations[cStation].rssiFloor === 'number') {
            $scope.rssiFloor = $scope.stations[cStation].rssiFloor;
          }
        }
      }
    }

    function postStory(story, callback) {
      $http.post('/stories', story)
        .success(function(data, status, headers, config) {
          var url = data.devices[Object.keys(data.devices)[0]].url;

          if($scope.type === 'onboarding') {
            associate(url, function(err) {
              var associated = !err;
              callback(url, associated, err);
            });
          }
          else {
            callback(url, false);
          }
        })
        .error(function(data, status, headers, config) {
          callback(null, false, 'Could not POST story (' + status + ')');
        }); 
    }

    function associate(url, callback) {
      $http.put($scope.hlcUrl + ASSOCIATION_PATH + $scope.onboardingId,
                { url: url })
        .success(function(data, status, headers, config) {
          callback();
        })
        .error(function(data, status, headers, config) {
          callback('Could not PUT association (' + status + ')');
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
             (decoding.rssi > strongestRssi)) {
            strongestDevice = device;
            strongestRssi = decoding.rssi;
          }
        } 
      }
      var numerator = Math.max(0, strongestRssi - $scope.rssiFloor);
      var denominator = $scope.rssiThreshold - $scope.rssiFloor;
      $scope.rssiPercentage = Math.min(100, Math.round((100 * numerator) /
                                                       denominator));
      if(strongestRssi < $scope.rssiThreshold) {
        strongestDevice = null;
      }
      return strongestDevice;
    }

    function updateOnboarding(device) {
      if(device) {
        // TODO: create a function to show only the pertinent details
        $scope.onboardingCandidate = JSON.stringify(device.identifier,
                                                    null, "  ");
        $scope.onboardingId = device.identifier.value;
      }
      else {
        $scope.onboardingCandidate = null;
      }
    }

    function openModal(items) {
      var modal = $modal.open( { animation: true,
                                 templateUrl: 'result.html',
                                 controller: 'ResultModalCtrl',
                                 size: 'md',
                                 resolve: { items: function() {
                                                     return items; } } } );
      modal.result.then(function() {}, function() {
        $scope.person = {};
        $scope.json = { person: { } };
        $scope.proceed('landing');
      });
    }

    $scope.countries = [ 
      {nationality: 'Afghanistan', code: 'AF'},
      {nationality: 'Aland Islands', code: 'AX'},
      {nationality: 'Albania', code: 'AL'},
      {nationality: 'Algeria', code: 'DZ'},
      {nationality: 'American Samoa', code: 'AS'},
      {nationality: 'Andorra', code: 'AD'},
      {nationality: 'Angola', code: 'AO'},
      {nationality: 'Anguilla', code: 'AI'},
      {nationality: 'Antarctica', code: 'AQ'},
      {nationality: 'Antigua and Barbuda', code: 'AG'},
      {nationality: 'Argentina', code: 'AR'},
      {nationality: 'Armenia', code: 'AM'},
      {nationality: 'Aruba', code: 'AW'},
      {nationality: 'Australia', code: 'AU'},
      {nationality: 'Austria', code: 'AT'},
      {nationality: 'Azerbaijan', code: 'AZ'},
      {nationality: 'Bahamas', code: 'BS'},
      {nationality: 'Bahrain', code: 'BH'},
      {nationality: 'Bangladesh', code: 'BD'},
      {nationality: 'Barbados', code: 'BB'},
      {nationality: 'Belarus', code: 'BY'},
      {nationality: 'Belgium', code: 'BE'},
      {nationality: 'Belize', code: 'BZ'},
      {nationality: 'Benin', code: 'BJ'},
      {nationality: 'Bermuda', code: 'BM'},
      {nationality: 'Bhutan', code: 'BT'},
      {nationality: 'Bolivia', code: 'BO'},
      {nationality: 'Bosnia and Herzegovina', code: 'BA'},
      {nationality: 'Botswana', code: 'BW'},
      {nationality: 'Bouvet Island', code: 'BV'},
      {nationality: 'Brazil', code: 'BR'},
      {nationality: 'British Indian Ocean Territory', code: 'IO'},
      {nationality: 'Brunei Darussalam', code: 'BN'},
      {nationality: 'Bulgaria', code: 'BG'},
      {nationality: 'Burkina Faso', code: 'BF'},
      {nationality: 'Burundi', code: 'BI'},
      {nationality: 'Cambodia', code: 'KH'},
      {nationality: 'Cameroon', code: 'CM'},
      {nationality: 'Canada', code: 'CA'},
      {nationality: 'Cape Verde', code: 'CV'},
      {nationality: 'Cayman Islands', code: 'KY'},
      {nationality: 'Central African Republic', code: 'CF'},
      {nationality: 'Chad', code: 'TD'},
      {nationality: 'Chile', code: 'CL'},
      {nationality: 'China', code: 'CN'},
      {nationality: 'Christmas Island', code: 'CX'},
      {nationality: 'Cocos (Keeling) Islands', code: 'CC'},
      {nationality: 'Colombia', code: 'CO'},
      {nationality: 'Comoros', code: 'KM'},
      {nationality: 'Congo', code: 'CG'},
      {nationality: 'Congo, The Democratic Republic of the', code: 'CD'},
      {nationality: 'Cook Islands', code: 'CK'},
      {nationality: 'Costa Rica', code: 'CR'},
      {nationality: 'Cote D\'Ivoire', code: 'CI'},
      {nationality: 'Croatia', code: 'HR'},
      {nationality: 'Cuba', code: 'CU'},
      {nationality: 'Cyprus', code: 'CY'},
      {nationality: 'Czech Republic', code: 'CZ'},
      {nationality: 'Denmark', code: 'DK'},
      {nationality: 'Djibouti', code: 'DJ'},
      {nationality: 'Dominica', code: 'DM'},
      {nationality: 'Dominican Republic', code: 'DO'},
      {nationality: 'Ecuador', code: 'EC'},
      {nationality: 'Egypt', code: 'EG'},
      {nationality: 'El Salvador', code: 'SV'},
      {nationality: 'Equatorial Guinea', code: 'GQ'},
      {nationality: 'Eritrea', code: 'ER'},
      {nationality: 'Estonia', code: 'EE'},
      {nationality: 'Ethiopia', code: 'ET'},
      {nationality: 'Falkland Islands (Malvinas)', code: 'FK'},
      {nationality: 'Faroe Islands', code: 'FO'},
      {nationality: 'Fiji', code: 'FJ'},
      {nationality: 'Finland', code: 'FI'},
      {nationality: 'France', code: 'FR'},
      {nationality: 'French Guiana', code: 'GF'},
      {nationality: 'French Polynesia', code: 'PF'},
      {nationality: 'French Southern Territories', code: 'TF'},
      {nationality: 'Gabon', code: 'GA'},
      {nationality: 'Gambia', code: 'GM'},
      {nationality: 'Georgia', code: 'GE'},
      {nationality: 'Germany', code: 'DE'},
      {nationality: 'Ghana', code: 'GH'},
      {nationality: 'Gibraltar', code: 'GI'},
      {nationality: 'Greece', code: 'GR'},
      {nationality: 'Greenland', code: 'GL'},
      {nationality: 'Grenada', code: 'GD'},
      {nationality: 'Guadeloupe', code: 'GP'},
      {nationality: 'Guam', code: 'GU'},
      {nationality: 'Guatemala', code: 'GT'},
      {nationality: 'Guernsey', code: 'GG'},
      {nationality: 'Guinea', code: 'GN'},
      {nationality: 'Guinea-Bissau', code: 'GW'},
      {nationality: 'Guyana', code: 'GY'},
      {nationality: 'Haiti', code: 'HT'},
      {nationality: 'Heard Island and Mcdonald Islands', code: 'HM'},
      {nationality: 'Holy See (Vatican City State)', code: 'VA'},
      {nationality: 'Honduras', code: 'HN'},
      {nationality: 'Hong Kong', code: 'HK'},
      {nationality: 'Hungary', code: 'HU'},
      {nationality: 'Iceland', code: 'IS'},
      {nationality: 'India', code: 'IN'},
      {nationality: 'Indonesia', code: 'ID'},
      {nationality: 'Iran, Islamic Republic Of', code: 'IR'},
      {nationality: 'Iraq', code: 'IQ'},
      {nationality: 'Ireland', code: 'IE'},
      {nationality: 'Isle of Man', code: 'IM'},
      {nationality: 'Israel', code: 'IL'},
      {nationality: 'Italy', code: 'IT'},
      {nationality: 'Jamaica', code: 'JM'},
      {nationality: 'Japan', code: 'JP'},
      {nationality: 'Jersey', code: 'JE'},
      {nationality: 'Jordan', code: 'JO'},
      {nationality: 'Kazakhstan', code: 'KZ'},
      {nationality: 'Kenya', code: 'KE'},
      {nationality: 'Kiribati', code: 'KI'},
      {nationality: 'Korea, Democratic People\'s Republic of', code: 'KP'},
      {nationality: 'Korea, Republic of', code: 'KR'},
      {nationality: 'Kuwait', code: 'KW'},
      {nationality: 'Kyrgyzstan', code: 'KG'},
      {nationality: 'Lao People\'s Democratic Republic', code: 'LA'},
      {nationality: 'Latvia', code: 'LV'},
      {nationality: 'Lebanon', code: 'LB'},
      {nationality: 'Lesotho', code: 'LS'},
      {nationality: 'Liberia', code: 'LR'},
      {nationality: 'Libyan Arab Jamahiriya', code: 'LY'},
      {nationality: 'Liechtenstein', code: 'LI'},
      {nationality: 'Lithuania', code: 'LT'},
      {nationality: 'Luxembourg', code: 'LU'},
      {nationality: 'Macao', code: 'MO'},
      {nationality: 'Macedonia, The Former Yugoslav Republic of', code: 'MK'},
      {nationality: 'Madagascar', code: 'MG'},
      {nationality: 'Malawi', code: 'MW'},
      {nationality: 'Malaysia', code: 'MY'},
      {nationality: 'Maldives', code: 'MV'},
      {nationality: 'Mali', code: 'ML'},
      {nationality: 'Malta', code: 'MT'},
      {nationality: 'Marshall Islands', code: 'MH'},
      {nationality: 'Martinique', code: 'MQ'},
      {nationality: 'Mauritania', code: 'MR'},
      {nationality: 'Mauritius', code: 'MU'},
      {nationality: 'Mayotte', code: 'YT'},
      {nationality: 'Mexico', code: 'MX'},
      {nationality: 'Micronesia, Federated States of', code: 'FM'},
      {nationality: 'Moldova, Republic of', code: 'MD'},
      {nationality: 'Monaco', code: 'MC'},
      {nationality: 'Mongolia', code: 'MN'},
      {nationality: 'Montserrat', code: 'MS'},
      {nationality: 'Morocco', code: 'MA'},
      {nationality: 'Mozambique', code: 'MZ'},
      {nationality: 'Myanmar', code: 'MM'},
      {nationality: 'Namibia', code: 'NA'},
      {nationality: 'Nauru', code: 'NR'},
      {nationality: 'Nepal', code: 'NP'},
      {nationality: 'Netherlands', code: 'NL'},
      {nationality: 'Netherlands Antilles', code: 'AN'},
      {nationality: 'New Caledonia', code: 'NC'},
      {nationality: 'New Zealand', code: 'NZ'},
      {nationality: 'Nicaragua', code: 'NI'},
      {nationality: 'Niger', code: 'NE'},
      {nationality: 'Nigeria', code: 'NG'},
      {nationality: 'Niue', code: 'NU'},
      {nationality: 'Norfolk Island', code: 'NF'},
      {nationality: 'Northern Mariana Islands', code: 'MP'},
      {nationality: 'Norway', code: 'NO'},
      {nationality: 'Oman', code: 'OM'},
      {nationality: 'Pakistan', code: 'PK'},
      {nationality: 'Palau', code: 'PW'},
      {nationality: 'Palestinian Territory, Occupied', code: 'PS'},
      {nationality: 'Panama', code: 'PA'},
      {nationality: 'Papua New Guinea', code: 'PG'},
      {nationality: 'Paraguay', code: 'PY'},
      {nationality: 'Peru', code: 'PE'},
      {nationality: 'Philippines', code: 'PH'},
      {nationality: 'Pitcairn', code: 'PN'},
      {nationality: 'Poland', code: 'PL'},
      {nationality: 'Portugal', code: 'PT'},
      {nationality: 'Puerto Rico', code: 'PR'},
      {nationality: 'Qatar', code: 'QA'},
      {nationality: 'Reunion', code: 'RE'},
      {nationality: 'Romania', code: 'RO'},
      {nationality: 'Russian Federation', code: 'RU'},
      {nationality: 'Rwanda', code: 'RW'},
      {nationality: 'Saint Helena', code: 'SH'},
      {nationality: 'Saint Kitts and Nevis', code: 'KN'},
      {nationality: 'Saint Lucia', code: 'LC'},
      {nationality: 'Saint Pierre and Miquelon', code: 'PM'},
      {nationality: 'Saint Vincent and the Grenadines', code: 'VC'},
      {nationality: 'Samoa', code: 'WS'},
      {nationality: 'San Marino', code: 'SM'},
      {nationality: 'Sao Tome and Principe', code: 'ST'},
      {nationality: 'Saudi Arabia', code: 'SA'},
      {nationality: 'Senegal', code: 'SN'},
      {nationality: 'Serbia and Montenegro', code: 'CS'},
      {nationality: 'Seychelles', code: 'SC'},
      {nationality: 'Sierra Leone', code: 'SL'},
      {nationality: 'Singapore', code: 'SG'},
      {nationality: 'Slovakia', code: 'SK'},
      {nationality: 'Slovenia', code: 'SI'},
      {nationality: 'Solomon Islands', code: 'SB'},
      {nationality: 'Somalia', code: 'SO'},
      {nationality: 'South Africa', code: 'ZA'},
      {nationality: 'South Georgia and the South Sandwich Islands', code: 'GS'},
      {nationality: 'Spain', code: 'ES'},
      {nationality: 'Sri Lanka', code: 'LK'},
      {nationality: 'Sudan', code: 'SD'},
      {nationality: 'Surinationality', code: 'SR'},
      {nationality: 'Svalbard and Jan Mayen', code: 'SJ'},
      {nationality: 'Swaziland', code: 'SZ'},
      {nationality: 'Sweden', code: 'SE'},
      {nationality: 'Switzerland', code: 'CH'},
      {nationality: 'Syrian Arab Republic', code: 'SY'},
      {nationality: 'Taiwan, Province of China', code: 'TW'},
      {nationality: 'Tajikistan', code: 'TJ'},
      {nationality: 'Tanzania, United Republic of', code: 'TZ'},
      {nationality: 'Thailand', code: 'TH'},
      {nationality: 'Timor-Leste', code: 'TL'},
      {nationality: 'Togo', code: 'TG'},
      {nationality: 'Tokelau', code: 'TK'},
      {nationality: 'Tonga', code: 'TO'},
      {nationality: 'Trinidad and Tobago', code: 'TT'},
      {nationality: 'Tunisia', code: 'TN'},
      {nationality: 'Turkey', code: 'TR'},
      {nationality: 'Turkmenistan', code: 'TM'},
      {nationality: 'Turks and Caicos Islands', code: 'TC'},
      {nationality: 'Tuvalu', code: 'TV'},
      {nationality: 'Uganda', code: 'UG'},
      {nationality: 'Ukraine', code: 'UA'},
      {nationality: 'United Arab Emirates', code: 'AE'},
      {nationality: 'United Kingdom', code: 'GB'},
      {nationality: 'United States', code: 'US'},
      {nationality: 'United States Minor Outlying Islands', code: 'UM'},
      {nationality: 'Uruguay', code: 'UY'},
      {nationality: 'Uzbekistan', code: 'UZ'},
      {nationality: 'Vanuatu', code: 'VU'},
      {nationality: 'Venezuela', code: 'VE'},
      {nationality: 'Vietnam', code: 'VN'},
      {nationality: 'Virgin Islands, British', code: 'VG'},
      {nationality: 'Virgin Islands, U.S.', code: 'VI'},
      {nationality: 'Wallis and Futuna', code: 'WF'},
      {nationality: 'Western Sahara', code: 'EH'},
      {nationality: 'Yemen', code: 'YE'},
      {nationality: 'Zambia', code: 'ZM'},
      {nationality: 'Zimbabwe', code: 'ZW'}
    ];

  })


  // Person controller
  .controller("PersonCtrl", function($scope, $modal) {

    $scope.person = {};
    $scope.json = {};
    initialise();

    $scope.slides = [
      { text: 'barnowl', image: 'http://reelyactive.com/images/barnowl.jpg' },
      { text: 'barnacles', image: 'http://reelyactive.com/images/barnacles.jpg' },
      { text: 'barterer', image: 'http://reelyactive.com/images/barterer.jpg' },
      { text: 'chickadee', image: 'http://reelyactive.com/images/chickadee.jpg' },
      { text: 'starling', image: 'http://reelyactive.com/images/starling.jpg' }
    ];

    function initialise() {
      $scope.json = {
        "@context": { "schema": "http://schema.org/" },
        "@graph": [ $scope.graph.person ]
      };
      $scope.person = {};
    }

    $scope.$on('clear', function(event, args) {
      initialise();
    });

    $scope.change = function() {
      for(var key in $scope.person) {
        if($scope.person.hasOwnProperty(key)) {
          if(!$scope.person[key].length) {
            delete $scope.graph.person["schema:" + key];
            delete $scope.person[key];
          } 
          else {
            $scope.graph.person["schema:" + key] = $scope.person[key];
          }
        }
      }
    };

    $scope.addSocial = function() {
      if(typeof($scope.person.sameAs) === 'undefined') {
        $scope.person.sameAs = [];
      }
      $scope.person.sameAs.push("");
    };

    function isActive(slide) {
      return slide.active;
    };

    $scope.getActiveSlide = function() {
      var activeSlides = $scope.slides.filter(isActive)[0]; 
      $scope.person.image = activeSlides.image;
    };

    $scope.webify = function() {
      var items = { target: "web", json: $scope.json };
      openModal(items);
    };

    function openModal(items) {
      $modal.open( { animation: true,
                     templateUrl: 'export.html',
                     controller: 'ExportModalCtrl',
                     size: 'md',
                     resolve: { items: function() { return items; } }
                   } );
    }
  })


  // Product controller
  .controller("ProductCtrl", function($scope, $modal) {

    $scope.product = {};
    $scope.preset;
    $scope.json = {};
    initialise();

    $scope.devices = {
      "Nexus 5": {
        name: "Nexus 5",
        manufacturer: { name: "LG Electronics" }, 
        model: "D82x",
        url: "http://www.google.com/nexus/5/",
        image : "http://reelyactive.com/images/Nexus5.jpg"
      },
      "Bluetooth Smart Reelceiver" : {
        name: "Bluetooth Smart Reelceiver",
        manufacturer: { name: "reelyActive" },
        model: "RA-R436",
        url: "http://shop.reelyactive.com/products/ra-r436",
        image: "http://reelyactive.com/images/reelceiver400x400.jpg"
      },
      "Active RFID Tag": {
        name: "915MHz Active RFID Tag",
        manufacturer: { name: "reelyActive" },
        model: "RA-T411",
        url: "http://shop.reelyactive.com/products/ra-t411",
        image: "http://reelyactive.com/images/tag400x400.jpg"
      }
    };

    $scope.slides = [
      { text: "Nexus 5", image: "http://reelyactive.com/images/Nexus5.jpg" },
      { text: "RA-R436", image: "http://reelyactive.com/images/reelceiver400x400.jpg" },
      { text: "RA-T411", image: "http://reelyactive.com/images/tag400x400.jpg" }
    ];

    function initialise() {
      $scope.json = {
        "@context": { "schema": "http://schema.org/" },
        "@graph": [ $scope.graph.product ]
      };
      $scope.product = {};
    }

    $scope.$on('clear', function(event, args) {
      initialise();
      $scope.preset = null;
    });

    $scope.change = function () {
      for(var key in $scope.product) {
        if($scope.product.hasOwnProperty(key)) {
          if(key === 'manufacturer') {
            var hasNonEmptyManufacturerField = false;
            $scope.graph.product["schema:manufacturer"] = 
                                           { "@type": "schema:Organization" };
            for(var field in $scope.product.manufacturer) {
              if($scope.product.manufacturer.hasOwnProperty(field)) {
                if(!$scope.product.manufacturer[field].length) {
                  delete $scope.graph.product["schema:manufacturer"][field];
                }
                else {
                  hasNonEmptyManufacturerField = true;
                  $scope.graph.product["schema:manufacturer"]["schema:" + field] =
                                           $scope.product.manufacturer[field];
                }
              }
            }
            if(!hasNonEmptyManufacturerField) {
              delete $scope.graph.product["schema:manufacturer"];
            }
          }
          else if(!$scope.product[key].length) {
            delete $scope.graph.product["schema:" + key];
          }
          else {
            $scope.graph.product["schema:" + key] = $scope.product[key];
          }
        }
      }
    };

    $scope.selectPreset = function() {
      initialise();
      if($scope.preset !== null) {
        var device = $scope.devices[$scope.preset];
        for(var key in device) {
          if((device.hasOwnProperty(key)) && (key !== '$$hashKey')) {
            $scope.product[key] = device[key];
          }
        }
      }
      $scope.change();
    };

    $scope.addSocial = function() {
      if(typeof($scope.product.sameAs) === 'undefined') {
        $scope.product.sameAs = [];
      }
      $scope.product.sameAs.push("");
    };

    function isActive(slide) {
      return slide.active;
    }

    $scope.getActiveSlide = function() {
      var activeSlide = $scope.slides.filter(isActive)[0]; 
      $scope.product.image = activeSlide.image;
    };

    $scope.webify = function() {
      var items = { target: "web", json: $scope.json };
      openModal(items);
    };

    function openModal(items) {
      $modal.open( { animation: true,
                     templateUrl: 'export.html',
                     controller: 'ExportModalCtrl',
                     size: 'md',
                     resolve: { items: function() { return items; } }
                   } );
    }

  })


  // Place controller
  .controller("PlaceCtrl", function($scope, $modal) {

    $scope.place = {};
    $scope.json = {};
    initialise();

    $scope.slides = [
      { text: "Silo", image: "http://reelyactive.com/images/json-silo.jpg" }
    ];

    function initialise() {
      $scope.json = {
        "@context": { "schema": "http://schema.org/" },
        "@graph": [ $scope.graph.place ]
      };
      $scope.place = {};
    }

    $scope.$on('clear', function(event, args) {
      initialise();
    });
   
    $scope.change = function() {
      for(var key in $scope.place) {
        if($scope.place.hasOwnProperty(key)) {
          if(key === 'address') {
            var hasNonEmptyAddressField = false;
            $scope.graph.place["schema:address"] = 
                                          { "@type": "schema:PostalAddress" };
            for(var field in $scope.place.address) {
              if($scope.place.address.hasOwnProperty(field)) {
                if(!$scope.place.address[field].length) {
                  delete $scope.graph.place["schema:address"][field];
                }
                else {
                  hasNonEmptyAddressField = true;
                  $scope.graph.place["schema:address"]["schema:" + field] =
                                                  $scope.place.address[field];
                }
              }
            }
            if(!hasNonEmptyAddressField) {
              delete $scope.graph.place["schema:address"];
            }
          }
          else if(!$scope.place[key].length) {
            delete $scope.graph.place["schema:" + key];
          } 
          else {
            $scope.graph.place["schema:" + key] = $scope.place[key];
          }
        }
      }
    };

    function isActive(slide) {
      return slide.active;
    }

    $scope.addSocial = function() {
      if(typeof($scope.place.sameAs) === 'undefined') {
        $scope.place.sameAs = [];
      }
      $scope.place.sameAs.push("");
    };

    $scope.getActiveSlide = function() {
      var activeSlide = $scope.slides.filter(isActive)[0]; 
      $scope.place.image = activeSlide.image;
    };

    $scope.webify = function() {
      var items = { target: "web", json: $scope.json };
      openModal(items);
    };

    function openModal(items) {
      $modal.open( { animation: true,
                     templateUrl: 'export.html',
                     controller: 'ExportModalCtrl',
                     size: 'md',
                     resolve: { items: function() { return items; } }
                   } );
    }

  })


  // Combined controller
  .controller("CombinedCtrl", function($scope, $modal) {

    $scope.json = {};
    initialise();

    function initialise() {
      $scope.json = {
        "@context": { "schema": "http://schema.org/" },
        "@graph": [ $scope.graph.person,
                    $scope.graph.product,
                    $scope.graph.place ]
      };
    }

    $scope.$on('clear', function(event, args) {
      initialise();
    });

    $scope.webify = function() {
      var items = { target: "web", json: $scope.json };
      openModal(items);
    };

    function openModal(items) {
      $modal.open( { animation: true,
                     templateUrl: 'export.html',
                     controller: 'ExportModalCtrl',
                     size: 'md',
                     resolve: { items: function() { return items; } }
                   } );
    }

  })


  // Export modal controller
  .controller('ExportModalCtrl', function($scope, $modalInstance, items) {

    $scope.markup = '<script type=\"application/ld+json\">\n' +
                    JSON.stringify(items.json, null, "  ") + '\n</script>';

    $scope.dismiss = function () {
      $modalInstance.dismiss('cancel');
    };

  })


  // Result modal controller
  .controller('ResultModalCtrl', function($scope, $modalInstance, items) {
    $scope.err = items.err;
    $scope.url = items.url;
    if($scope.url) {
      if(items.associated) {
        $scope.title = 'Stored and associated!';
      }
      else {
        $scope.title = 'Stored!';
      }
    }
    else {
      $scope.title = 'Failed!';
    }
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
