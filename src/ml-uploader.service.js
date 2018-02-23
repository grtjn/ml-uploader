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


    service.sendFile = function(data, opts, onSend, onSendDone, onSendFail) {
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

      // Suppress any invalid char from the uri, by replacing it with _,
      // makes lives easier than using percent encoding..
      var uri = data.name.replace(/[^!*'();:@&=+$,/?#\[\]A-Za-z0-9\-_.~%]/g, '_');
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

      if (onSend) {
        onSend(progress);
      }
      mlRest.request(
        '/documents',
        {
          data: data,
          params: params,
          method: 'PUT',
          headers: {
            'Content-Type': data.type
          }
        }
      ).then(function(response) {
          console.log('added document to grade');
          if (onSendDone) {
            onSendDone(progress);
          }
          progress.done = true;
          progress.update(100);
        },function(reason) {
          console.log('send document failed:' + reason);
          progress.failed = true;
          if (onSendFail) {
            onSendFail(progress);
          }
        });

      progress.uri = uri;
      progress.type = data.type;

      return progress;
    };

    service.dzHighlight = function(e, dropzone) {
      e.stopPropagation();
      e.preventDefault();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        dropzone.addClass('hover');
      } else {
        dropzone.removeClass('hover');
      }
    };

    service.dropFiles = function(e, dropzone, scope) {
      e.preventDefault();
      e.stopPropagation();
      e = e.originalEvent;
      var files = e.target.files || e.dataTransfer.files, i = files.length;
      service.dzHighlight(e, dropzone);
      while(i--) {
        processFile(files[i], scope);
      }
      scope.$apply();
    };

    function processFile(f, scope) {
      console.log('processing file', f);
      var ext = f.name.substr(f.name.lastIndexOf('.')+1);
      var docOptions = angular.extend(
        {
          category: 'content'
        },
        scope.uploadOptions
      );
      if (scope.transform) {
        docOptions.transform = scope.transform;
      }
      if (scope.collection) {
        docOptions.collection = scope.collection;
      }
      var progress = service.sendFile(f, docOptions, scope.onSend, scope.onSendDone, scope.onSendFail);
      progress.ext = ext;
      scope.files.push(progress);
    }

    return service;
  }
})();
