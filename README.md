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
  }
})();
``` 
html 
```html
<ml-upload multiple="true" ml-collection="my-collection" upload-file-list="ctrl.fileList">
  <p><strong>Drop files here or click to select files.</strong></p>
  <em>(Files will be uploaded automatically)</em>
</ml-upload>
```
