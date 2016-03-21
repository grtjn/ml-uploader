/* global describe, beforeEach, module, it, expect, inject */

describe('MLUploader#mock-service', function () {

  var mockMLRest, $rootScope, $q;

  // fixture

  beforeEach(module('ml.uploader'));
  beforeEach(module('ml.common'));

  beforeEach(function() {
    mockMLRest = {
      updateDocument: jasmine.createSpy('updateDocument').and.callFake(function() {
        var d = $q.defer();
        d.resolve({ data: '' });
        return d.promise;
      })
    };
  });

  beforeEach(module(function($provide) {
    $provide.value('MLRest', mockMLRest);
  }));

  beforeEach(inject(function ($injector) {
    $q = $injector.get('$q');
    // $httpBackend = $injector.get('$httpBackend');
    // $location = $injector.get('$location');
    $rootScope = $injector.get('$rootScope');

  }));

});