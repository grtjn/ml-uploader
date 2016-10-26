(function() {

  'use strict';

  MLUploadDirective.$injector = ['mlUploadService'];

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
          multiple: '@',
          collection: '@mlCollection',
          fileList: '=uploadFileList',
          transform: '=mlTransform',
          uploadOptions: '=uploadOptions'
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

          // clicking the dropzone is like clicking the file input
          dropzone
            .on('click', function(evt) {
              console.log('dz click');
              fileInp.click();
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
        template:
          '<div class="ml-upload">' +
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
          '</span></li></ul></div></div>'
      };
    }
})();
