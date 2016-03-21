(function() {
  'use strict';

  angular.module('app', ['ml.uploader']).controller('UploaderCtrl', UploaderCtrl);

  UploaderCtrl.$inject = ['$scope', '$location'];

  function UploaderCtrl($scope, $location) {
    var ctrl = this;
    ctrl.fileList = [];
  }
})();
