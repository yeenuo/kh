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

  .controller('listCtrl', ["$http", "$scope", '$rootScope', function ($http, $s, $r) {
    var self = this;
    console.log("------------ctrl todos start-------------");
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
    console.log("------------ctrl todos end-------------");

  }])
  .controller('dataCtrl', ["$scope", "$stateParams", '$rootScope', function ($scope, $stateParams, $r) {
    console.log("------------ctrl todo start-------------");
    $scope.data = findById($r.dataList, $stateParams.Id)
    console.log("------------ctrl todo end-------------");
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
