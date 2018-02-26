(function () {
  'use strict';

  angular.module('ml.uploader', ['ml.common','ui.bootstrap']);

}());
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

(function() {

  'use strict';

  MLUploadDirective.$inject = ['mlUploadService'];

  /**
   * angular element directive; an uploader for loading documents into MarkLogic.
   *
   * attributes:
   *
   * - `multiple`: Specify if it should allow multiple files
   * - `ml-collection`: optional. Collection that the uploaded file should be assigned to.
   * - `fileList`: optional. A function reference to callback when a chart item is selected
   * - `ml-transform`: optional. A variable with a transform name.
   * - `upload-options`: optional. A variable with options to pass to /v1/documents
   *
   * Example:
   *
   * ```
   * <ml-upload multiple="true" ml-collection="my-collection" upload-options="ctrl.uploadOptions" upload-file-list="ctrl.files">
   *   <p><strong>Drop files here or click to select files.</strong></p>
   *   <em>(Files will be uploaded automatically)</em>
   * </ml-upload>```
   *
   * @namespace ml-uploader
   */
  angular.module('ml.uploader')
    .directive('mlUpload', MLUploadDirective);

  function isSupported() {
    return window.File && window.FileList && window.FileReader;
  }

  function MLUploadDirective(mlUploadService) {
    return {
      restrict: 'E',
      replace: true,
      transclude: true,
      scope: {
        button: '@',
        multiple: '@',
        collection: '@mlCollection',
        fileList: '=uploadFileList',
        transform: '=mlTransform',
        uploadOptions: '=',
        onSend: '=',
        onSendDone: '=',
        onSendFail: '=',
        doubleClick: '='
      },
      link: function(scope, ele, attr, transclude) {
        scope.files = scope.fileList || [];
        scope.uploadOptions = scope.uploadOptions || {};

        if (!isSupported()) {
          throw 'ml-uloader - HTML5 file upload not supported by this browser';
        }

        scope.multiple = scope.multiple && scope.multiple === 'true';

        ele = angular.element(ele);

        ele
          .append(
            '<div style="width:0;height:0;overflow:hidden">' +
            '<input type="file" name="_hidden_uploader_file" ' +
             (scope.multiple ? 'multiple' : '' ) +
             '></div>'
          );
        var fileInp = ele.find('input[type="file"]');
        var dropzone = ele.find('.ml-dropzone');
        var doubleclick;

        scope.open = function() {
          console.log('button click');
          fileInp[0].value = '';
          fileInp[0].click();
        };

        // clicking the dropzone is like clicking the file input
        dropzone
          .on('click', function(evt) {
            doubleclick = false;
            window.setTimeout(function() {
              if (! doubleclick) {
                console.log('dz click');
                fileInp[0].value = '';
                fileInp.click();
              }
            }, 300);
            evt.stopPropagation();
          })
          .on('dblclick', function(evt) {
            doubleclick = true;
            console.log('dz dblclick');
            var name = evt.target.title || evt.target.textContent;
            var file = scope.files.filter(function(f) {
              return f.name === name;
            })[0];
            if (scope.doubleClick) {
              scope.doubleClick(file);
            }
            evt.stopPropagation();
          })
          .on('drop', function(e) {
            return mlUploadService.dropFiles(e, dropzone, scope);
          })
          .on('dragenter dragleave dragover',
            function(e) {
              return mlUploadService.dzHighlight(e, dropzone);
            });

        fileInp.on('change', function(e) {
          return mlUploadService.dropFiles(e, dropzone, scope);
        });

        // prevent it from navigating away from page if an accidental drop
        jQuery('html').on('drop', function(e) {
          e.preventDefault();
          console.log('document drop', e);
          return false;
        });

      },
      template: function(ele, attr) {
        if (attr.button === 'true') {
          return '<div class="ml-upload"><button class="btn btn-default" ng-click="open()">Upload file' +
          (attr.multiple === 'true' ? '(s)' : '') +
          '</button></div>';
        } else {
          return '<div class="ml-upload">' +
          '<div class="ml-dropzone">' +
          '<div class="notes" ng-transclude ng-hide="files.length">' +
          '</div>' +
          '<ul class="ml-upload-file-list list-unstyled" ng-show="files.length">' +
          '<li ng-repeat="f in files" class="ml-upload-file" ' +
          ' ng-attr-file-extension="{{f.ext}}" ' +
          ' ng-class="{ \'ml-upload-done\': f.done, \'ml-upload-error\': f.failed }" ' +
          ' ng-attr-title="{{f.errorStatus || f.name}}">' +
          '<span class="ml-upload-file-name">{{ f.name }}</span>' +
          '<span class="ml-upload-file-progress">' +
          '<span class="ml-upload-progress-value">{{ f.value }}%</span>' +
          '<span class="ml-upload-progress-bar" ' +
          ' ng-style="{ width: f.value + \'%\' }">&nbsp;</span>' +
          '</span></li></ul></div></div>';
        }
      }
    };
  }
})();
