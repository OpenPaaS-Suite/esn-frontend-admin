'use strict';

require('./inbox-config-form.constants.js');
const inboxAPi = require('esn-api-client/src/api/inbox');

angular.module('linagora.esn.admin')
  .controller('InboxConfigFormController', InboxConfigFormController);

function InboxConfigFormController(
  $scope,
  $stateParams,
  $q,
  $modal,
  INBOX_CONFIG_EVENTS,
  esnApiClient

) {
  var self = this;
  var originalConfigs;

  const inboxAPiClient = inboxAPi.default(esnApiClient);

  self.$onInit = $onInit;
  self.onForwardingChange = onForwardingChange;
  self.onLocalCopyChange = onLocalCopyChange;

  function $onInit() {
    // only domain admin can configure forwarding configurations
    if (self.mode !== self.availableModes.domain) {
      return;
    }

    self.forwardingConfigs = {
      forwarding: angular.copy(self.configurations.forwarding),
      isLocalCopyEnabled: angular.copy(self.configurations.isLocalCopyEnabled)
    };
    originalConfigs = angular.copy(self.forwardingConfigs);

    self.registerPostSaveHandler(_updateForwardingConfigurations);

    $scope.$on(INBOX_CONFIG_EVENTS.DISABLE_FORWARDING_CANCELLED, _onCancelDisableForwarding);
    $scope.$on(INBOX_CONFIG_EVENTS.DISABLE_LOCAL_COPY_CANCELLED, _onCancelDisableLocalCopy);
  }

  function onForwardingChange() {
    self.forwardingConfigs.isLocalCopyEnabled.value = self.forwardingConfigs.forwarding.value;
    if (originalConfigs.forwarding.value && !self.forwardingConfigs.forwarding.value) {
      $modal({
        template: require('./disable-forwarding/inbox-config-form-disable-forwarding.pug'),
        backdrop: 'static',
        placement: 'center',
        controller: 'InboxConfigFormDisableForwardingController',
        controllerAs: '$ctrl'
      });
    }
  }

  function onLocalCopyChange() {
    if (originalConfigs.isLocalCopyEnabled.value && !self.forwardingConfigs.isLocalCopyEnabled.value) {
      $modal({
        template: require('./disable-local-copy/inbox-config-form-disable-local-copy.pug'),
        backdrop: 'static',
        placement: 'center',
        controller: 'InboxConfigFormDisableLocalCopyController',
        controllerAs: '$ctrl'
      });
    }
  }

  function _onCancelDisableForwarding() {
    self.forwardingConfigs.forwarding.value = !self.forwardingConfigs.forwarding.value;
    if (originalConfigs.isLocalCopyEnabled.value) {
      self.forwardingConfigs.isLocalCopyEnabled.value = !self.forwardingConfigs.isLocalCopyEnabled.value;
    }
  }

  function _onCancelDisableLocalCopy() {
    self.forwardingConfigs.isLocalCopyEnabled.value = !self.forwardingConfigs.isLocalCopyEnabled.value;
  }

  function _updateForwardingConfigurations() {
    var configurations = {
      forwarding: self.forwardingConfigs.forwarding.value,
      isLocalCopyEnabled: self.forwardingConfigs.isLocalCopyEnabled.value
    };

    return inboxAPiClient.inboxForwarding.updateForwardingConfigurations($stateParams.domainId, configurations)
      .then(function() {
        originalConfigs = angular.copy(self.forwardingConfigs);
      })
      .catch(function(err) {
        self.forwardingConfigs = angular.copy(originalConfigs);

        return $q.reject(err);
      });
  }
}
