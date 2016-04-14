# ml-uploader
AngularJS library for uploading documents into MarkLogic.

#### getting started

    bower install ml-uploader --save

#### services

- `mlUploadService`: Service for uploading files.

#### directives

- `ml-upload`: accepts a fileList array, a collection, an options object, and multiple boolean for allowing multiple files.
  - `upload-options` [Object] with following parameters (See the [PUT /v1/documents documentation](http://docs.marklogic.com/REST/PUT/v1/documents) for more details on most of these options)
    - `collection` String or Array of strings specifying the collection(s) a document should belong to.
    - `quality` The quality of this document. A positive value increases the relevance score of the document in text search functions. The converse is true for a negative value.
    - `perm:{role}` Assign the document to the listed role, with the permission given in the parameter value. For example, perm:editor=update. Valid values: read, update, execute.
    - `prop:{name}` Attach the named property to the document, with the given property value. For example, prop:decade=70. The property name must be an xs:NCName.
    - `transform` Names a content transformation previously installed via the /transforms service. The service applies the transformation to the content prior to updating or inserting the document or metadata.
    - `trans:{name}` A transform parameter name and value. For example, trans:myparam=1.
    - `uriPrefix` String or Function that accepts a File object. It is the uri prefix added before the filename at upload. It highly recommended that this be used as files will otherwise be placed in the database with a uri equal to only the file name.

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
      'transform': 'my-custom-transform',
      'trans:tags': ['tag1', 'tag2'],
      // uriPrefix 
      'uriPrefix': function(file) {
        var extenstion = file.name.replace('^.*\.([^\.]+)$');
        return '/my-upload-location/' + extenstion + '/';
      } 
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
