// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers','baiduMap'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })
    .state('app.map', {
      url: '/map',
      views: {
        'menuContent': {
          templateUrl: 'templates/map.html',
          controller: 'mapCtrl'
        }
      }
    })
    .state('app.blogs', {
      url: '/blogs',
      views: {
        'menuContent': {
          templateUrl: 'templates/blogs.html',
          controller: 'listCtrl'
        }
      }
    })
  .state('app.blog', {
      url: '/blog',
      views: {
        'menuContent': {
          templateUrl: 'templates/blog.html',
          controller: 'dataCtrl'
        }
      }
    })
    .state('app.todos', {
    url: '/todos',
    views: {
      'menuContent': {
        templateUrl: 'templates/todos.html',
        controller: 'listCtrl'
      }
    }
  })
    .state('app.todo', {
      url: '/todos/:id',//支持rest 默认app
      views: {
        'menuContent': {
          templateUrl: 'templates/todo.html',
          controller: 'dataCtrl'
        }
      }
    });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/todos');//默认列表页
});
