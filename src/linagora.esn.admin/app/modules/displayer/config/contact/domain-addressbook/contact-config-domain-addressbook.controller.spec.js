'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ContactConfigDomainAddressbookController controller', function() {
  var $rootScope, $controller, $stateParams;
  var contactAddressbookServiceMock;

  beforeEach(function() {

    contactAddressbookServiceMock = {
      getAddressbookByBookName: sinon.stub().returns(Promise.resolve()),
      createGroupAddressbook: sinon.stub().returns(Promise.resolve())
    };
    angular.mock.module('linagora.esn.admin');

    angular.mock.module(function($provide) {
      $provide.value('contactAddressbookService', contactAddressbookServiceMock);
    });
    angular.mock.inject(function(
      _$rootScope_,
      _$controller_,
      _$stateParams_
    ) {
      $controller = _$controller_;
      $stateParams = _$stateParams_;
      $rootScope = _$rootScope_;
    });
  });

  function initController() {
    var $scope = $rootScope.$new();
    var controller = $controller('ContactConfigDomainAddressbookController', { $scope: $scope });

    controller.registerPostSaveHandler = sinon.spy();

    $rootScope.$digest();

    return controller;
  }

  describe('The $onInit function', function() {
    it('should set state to "loading"', function() {
      var controller = initController();

      controller.registerPostSaveHandler = sinon.spy();

      controller.$onInit();

      expect(controller.state).to.equal('loading');
    });

    it('should register post save handler if domain address book is not exist', function() {
      contactAddressbookServiceMock.getAddressbookByBookName = sinon.stub().returns($q.reject({ status: 404 }));
      var controller = initController();

      controller.$onInit();

      $rootScope.$digest();

      expect(controller.state).to.equal('success');
      expect(controller.isDomainAddressbookEnabled).to.be.false;
      expect(controller.registerPostSaveHandler)
        .to.have.been.calledWith(sinon.match.func);
    });

    it('should register post save handler if success to get domain address book', function() {
      contactAddressbookServiceMock.getAddressbookByBookName = sinon.stub().returns($q.when({ state: 'enabled' }));
      var controller = initController();

      controller.$onInit();

      $rootScope.$digest();

      expect(controller.state).to.equal('success');
      expect(controller.isDomainAddressbookEnabled).to.be.true;
      expect(controller.registerPostSaveHandler)
        .to.have.been.calledWith(sinon.match.func);
    });

    it('should set state to "error" without registering post save handler if failed to get domain address book', function() {
      contactAddressbookServiceMock.getAddressbookByBookName = sinon.stub().returns($q.reject({ status: 'not-404' }));
      var controller = initController();

      controller.$onInit();

      $rootScope.$digest();

      expect(controller.state).to.equal('error');
      expect(controller.isDomainAddressbookEnabled).to.be.undefined;
      expect(controller.registerPostSaveHandler)
        .to.not.have.been.called;
    });
  });

  describe('The post save handler (updateDomainAddressbookConfigurations function)', function() {
    var postSaveHandler;
    var controller;

    beforeEach(function() {
      controller = initController();

      controller.registerPostSaveHandler = function(handler) {
        postSaveHandler = handler;
      };
    });

    it('should call contactAddressbookService.createGroupAddressbook to create domain address book', function(done) {
      $stateParams.domainId = 'domain-id';
      contactAddressbookServiceMock.getAddressbookByBookName = sinon.stub().returns($q.reject({ status: 404 }));

      controller.$onInit();
      $rootScope.$digest();

      contactAddressbookServiceMock.createGroupAddressbook = sinon.stub().returns($q.when());

      postSaveHandler().then(function() {
        expect(contactAddressbookServiceMock.createGroupAddressbook).to.have.been.calledWith({
          id: 'dab',
          name: 'Domain address book'
        }, $stateParams.domainId);

        done();
      });

      $rootScope.$digest();
    });

    it('should call contactAddressbookService.updateAddressbook to update state of domain address book', function(done) {
      contactAddressbookServiceMock.getAddressbookByBookName = sinon.stub().returns($q.when({ state: 'enabled' }));

      controller.$onInit();
      $rootScope.$digest();

      contactAddressbookServiceMock.updateAddressbook = sinon.stub().returns($q.when());
      controller.isDomainAddressbookEnabled = false;
      postSaveHandler().then(function() {
        expect(contactAddressbookServiceMock.updateAddressbook).to.have.been.calledWith({
          state: 'disabled'
        });

        done();
      });

      $rootScope.$digest();
    });

    it('should revert if failed to update state of domain address book', function(done) {
      contactAddressbookServiceMock.getAddressbookByBookName = sinon.stub().returns($q.when({ state: 'enabled' }));

      controller.$onInit();
      $rootScope.$digest();

      contactAddressbookServiceMock.updateAddressbook = sinon.stub().returns($q.reject(new Error('update failed')));
      controller.isDomainAddressbookEnabled = false;
      postSaveHandler().catch(function() {
        expect(controller.isDomainAddressbookEnabled).to.be.true;

        done();
      });

      $rootScope.$digest();
    });
  });
});
