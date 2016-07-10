angular.module('starter.controllers', [])

  .controller('AppCtrl', function ($scope, $ionicModal, $timeout) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    // Form data for the login modal
    $scope.loginData = {};

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
      scope: $scope
    }).then(function (modal) {
      $scope.modal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function () {
      $scope.modal.hide();
    };

    // Open the login modal
    $scope.login = function () {
      $scope.modal.show();
    };

    // Perform the login action when the user submits the login form
    $scope.doLogin = function () {
      console.log('Doing login', $scope.loginData);

      // Simulate a login delay. Remove this and replace with your login
      // code if using a login system
      $timeout(function () {
        $scope.closeLogin();
      }, 1000);
    };
  })
  .controller('mapCtrl', ['$scope', '$timeout',
    function ($scope, $timeout) {

      $scope.offlineOpts = {retryInterval: 5000};
      $scope.config = {
        types: [{id: 0, text: '求助'}, {id: 1, text: '帮助信息'}]
        ,
        kinds: [{id: 0, text: '寻人'}, {id: 1, text: '寻物'}, {id: 2, text: '问答'}, {id: 3, text: '求购'}, {id: 4, text: '其他'}]
        ,
        distances: [{id: 0, text: '200M'}, {id: 1, text: '500M'}, {id: 2, text: '1KM'}, {id: 3, text: '3KM'}, {
          id: 4,
          text: '10KM'
        }]
        ,
        kinds: [{id: 0, text: '寻人'}, {id: 1, text: '寻物'}, {id: 2, text: '问答'}, {id: 3, text: '求购'}, {id: 4, text: '其他'}]
        ,
        relations: [{id: 0, text: '普通'}, {id: 1, text: '朋友'}, {id: 2, text: '密友'}]
        ,
        levels: [{id: 0, text: '>10'}, {id: 1, text: '>5'}, {id: 2, text: '>2'}, {id: 3, text: '>0'}]
        ,
        points: [{id: 0, text: '0'}, {id: 1, text: '<10'}, {id: 2, text: '<20'}, {id: 3, text: '<50'}, {
          id: 4,
          text: '<100'
        }, {id: 5, text: '100以上'}]
      };
      var longitude = 121.506191;
      var latitude = 31.245554;
      $scope.mapOptions = {
        center: {
          longitude: longitude,
          latitude: latitude
        },
        zoom: 20,
        city: 'QingDao',
        markers: [{
          longitude: longitude,
          latitude: latitude,
          icon: 'img/mappiont.png',
          width: 49,
          height: 60,
          title: 'Where',
          content: 'Put description here'
        }]
      };

      $scope.mapLoaded = function (map) {
        console.log(map);
      };

      $timeout(function () {
        $scope.mapOptions.center.longitude = 121.500885;
        $scope.mapOptions.center.latitude = 31.190032;
        $scope.mapOptions.markers[0].longitude = 121.500885;
        $scope.mapOptions.markers[0].latitude = 31.190032;
      }, 5000);
    }
  ])
  .controller('listCtrl', ["$http", "$scope", '$rootScope', function ($http, $s, $r) {
    var self = this;
    console.log("------------ctrl list start-------------");
    $http({
      method: 'POST',
      url: '/list',
      data: {//not param
        'model': 'g_spot'
      }
    }).success(function (data) {
      $s.dataList = data;
      $r.dataList = data;
    }).error(function (data, status, headers, config) {
    });
    console.log("------------ctrl list end-------------");

  }])
  .controller('dataCtrl', ["$scope", "$stateParams", '$rootScope', function ($scope, $stateParams, $r) {
    console.log("------------ctrl data start-------------");
    $scope.data = findById($r.dataList, $stateParams.id)
    console.log("------------ctrl data end-------------");
  }])
;


function filterId(objs, id) {
  return objs.filter(function (value) {
    return value.id = id;
  });
}


function findById(objs, id) {
  for (var i = 0; i < objs.length; i++) {
    if (objs[i].id == id) {
      return objs[i];
    }
  }
  return null;
}
