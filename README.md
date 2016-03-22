# ml-uploader
AngularJS library for uploading documents into MarkLogic.

#### getting started

    bower install ml-uploader --save

#### services

- `mlUploadService`: Service for uploading files.

#### directives

- `ml-upload`: accepts a fileList array, a collection, and multiple boolean for allowing multiple files.

#### example

app.js
```javascript
(function() {
  'use strict';

  angular.module('app', ['ml.uploader']).controller('UploaderCtrl', UploaderCtrl);

  UploaderCtrl.$inject = ['$scope', '$location'];

  function UploaderCtrl($scope, $location) {
    var ctrl = this;
    ctrl.fileList = [];
    ctrl.uploadOptions = {
      'trans:tags': ['tag1', 'tag2']
    };
  }
})();
``` 
html 
```html
<div class="panel panel-default">
  <div class="panel-heading">
    Upload files
  </div>
  <div class="panel-body">
    <ml-upload multiple="true" ml-collection="my-collection" ml-transform="'filter-doc'" 
    upload-options="ctrl.uploadOptions"
    upload-file-list="ctrl.fileList">
      <p><strong>Drop files here or click to select files.</strong></p>
      <em>(Files will be uploaded automatically)</em>
    </ml-upload>
  </div>
</div>
```
