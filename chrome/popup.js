'use strict';

(function() {
  $(function() {
    $('#checkNowButton').click(onCheckNow);
    loadSettings();
    loadTimesheetErrors();

    chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
      if (request && request.action && request.action == 'checkComplete') {
        loadTimesheetErrors();
        $('#checkNowButton').val('Check Now');
        $('#checkNowButton').removeAttr('disabled');
      }
    });
  });

  function onCheckNow() {
    checkNow();
  }

  function checkNow() {
    $('#checkNowButton').attr('disabled', 'disabled');
    $('#checkNowButton').val('Checking...');
    chrome.extension.sendMessage({ action: 'recheck' }, function(res) {});
  }
})();