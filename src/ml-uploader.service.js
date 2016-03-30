(function() {
  'use strict';

  angular.module('ml.uploader')
    .factory('mlUploadService', MLUploadService);
  MLUploadService.$inject = ['$rootScope', 'MLRest', '$http'];

  function MLUploadService($rootScope, mlRest, $http) {
    var service = {};

    // copied from $http, prevents $digest loops
    function applyUpdate() {
      if (!$rootScope.$$phase) {
        $rootScope.$apply();
      }
    }

    // base object
    var Progress = {};

    Progress.value = 0;
    Progress.done = false;
    Progress.name = 'unkown';
    Progress.failed = false;

    Progress.update = function(val) {
      this.updated = Date.now();
      console.log('update progress', this);
      if (val) {
        this.value = val;
        this.done = val === 100;
      }
      applyUpdate(this);
    };

    Progress.error = function(code) {
      console.log('setting error', code);
      this.failed = true;
      this.errorStatus = code;
      applyUpdate(this);
    };


    service.sendFile = function(data, opts) {
      var progress = Object.create(Progress);
      var format = 'binary';
      progress.name = data.name;
      console.log('sending file');

      if (/text/.test(data.type)) {
        format = 'text';
      } else if (/xml/.test(data.type)) {
        format = 'xml';
      } else if (/json/.test(data.type)) {
        format = 'json';
      }

      var uri = data.name;
      if (opts && opts.uriPrefix) {
        if (angular.isFunction(opts.uriPrefix)) {
          uri = opts.uriPrefix(data) + uri;
        } else {
          uri = opts.uriPrefix + uri;
        }
      }
      var params = angular.extend(
          opts,
          {
            uri: uri,
            format: format
          }
        );
      delete params.uriPrefix;

      mlRest.updateDocument(
        data, 
        params
      ).then(function(response) {
          console.log('added document to grade');
          progress.done = true;
          progress.update(100);
        });


      return progress;
    };

    return service;
  }
})();
