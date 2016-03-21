(function () {
  'use strict';

  angular.module('ml.uploader', ['ml.common','ui.bootstrap']);

}());
(function() {

  'use strict';

  /**
   * angular element directive; an uploader for loading documents into MarkLogic.
   *
   * attributes:
   *
   * - `multiple`: Specify if it should allow multiple files
   * - `collection`: optional. Collection that the uploaded file should be assigned to.
   * - `fileList`: optional. A function reference to callback when a chart item is selected
   *
   * Example:
   *
   * ```
   * <ml-upload multiple="true" ml-collection="my-collection" upload-file-list="ctrl.files">
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

    MLUploadDirective.$injector = ['mlUploadService'];
    function MLUploadDirective(mlUploadService) {
      return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
          multiple: '@',
          collection: '@mlCollection',
          fileList: '=uploadFileList'
        },
        link: function(scope, ele, attr, transclude) {
          scope.files = scope.fileList || [];

          if (!isSupported()) {
            throw 'ml-uloader - HTML5 file upload not supported by this browser';
          }

          scope.multiple = scope.multiple && scope.multiple === 'true';

          ele = angular.element(ele);

          ele.append('<div style="width:0;height:0;overflow:hidden"><input type="file" name="_hidden_uploader_file" ' + (scope.multiple ? 'multiple' : '' ) +'></div>');
          var fileInp = ele.find('input[type="file"]');
          var dropzone = ele.find('.ml-dropzone');

          function dzHighlight(e) {
            // console.log('dzHighlight', e);
            e.stopPropagation();
            e.preventDefault();
            if (e.type === 'dragenter' || e.type === 'dragover') {
              dropzone.addClass('hover');
            } else {
              dropzone.removeClass('hover');
            }
          }

          function dropFiles(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('drop files', e);
            e = e.originalEvent;
            var files = e.target.files || e.dataTransfer.files, i = files.length;
            dzHighlight(e);
            while(i--) {
              processFile(files[i]);
            }
            scope.$apply();
          }

          function processFile(f) {
            console.log('processing file', f);
            var ext = f.name.substr(f.name.lastIndexOf('.')+1);
            var progress = mlUploadService.sendFile(f, {
              uri: f.name.replace(/ /g,''),
              category: 'content',
              collection: scope.collection
            });
            progress.ext = ext;
            scope.files.push(progress);
          }

          // clicking the dropzone is like clicking the file input
          dropzone
            .on('click', function(evt) {
              console.log('dz click');
              fileInp.click();
              evt.stopPropagation();
            })
            .on('drop', dropFiles)
            .on('dragenter dragleave dragover',dzHighlight);

          fileInp.on('change', dropFiles);

          // prevent it from navigating away from page if an accidental drop
          jQuery('html').on('drop', function(e) {
            e.preventDefault();
            console.log('document drop', e);
            return false;
          });

        },
        template: '<div class="ml-upload"><div class="ml-dropzone"><div class="notes" ng-transclude ng-hide="files.length"></div><ul class="ml-upload-file-list list-unstyled" ng-show="files.length"><li ng-repeat="f in files" class="ml-upload-file" ng-attr-file-extension="{{f.ext}}" ng-class="{ \'ml-upload-done\': f.done, \'ml-upload-error\': f.failed }" ng-attr-title="{{f.errorStatus || f.name}}"><span class="ml-upload-file-name">{{ f.name }}</span><span class="ml-upload-file-progress"><span class="ml-upload-progress-value">{{ f.value }}%</span><span class="ml-upload-progress-bar" ng-style="{ width: f.value + \'%\' }">&nbsp;</span></span></li></ul></div></div>'
      };
    }
})();

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

      mlRest.updateDocument(
        data, 
        angular.extend(
          {
            uri: data.name,
            format: format
          },
          opts
        )
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
