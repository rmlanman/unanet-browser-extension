'use strict';

(function() {
  $(function() {
    $('#checkNowButton').click(onCheckNow);
    loadSettings();
    loadLastCheckTime();
    loadTimesheetErrors();

    chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
      if (request && request.action && request.action == 'checkComplete') {
        loadTimesheetErrors();
        loadLastCheckTime();
        $('#checkNowButton').val('Check Now');
        $('#checkNowButton').removeAttr('disabled');
      }
    });
  });

  function loadLastCheckTime() {
    if (localStorage.lastCheck && localStorage.lastCheck != 'null') {
      var lastChecked = new Date(localStorage.lastCheck);
      var ampm = 'am';
      var hours12 = lastChecked.getHours()
      if (hours12 > 12) {
        hours12 -= 12;
        ampm = 'pm';
      } else if (hours12 == 0) {
        hours12 = 12;
      }
      var lastCheckedStr = (lastChecked.getMonth() + 1) + '/' + lastChecked.getDate() + '/' + (lastChecked.getYear() + 1900);
      lastCheckedStr += ' ' + hours12 + ':' + lastChecked.getMinutes() + ':' + lastChecked.getSeconds() + ampm;
      $('#lastCheckedTime').html(lastCheckedStr);
    } else {
      $('#lastCheckedTime').html('Not Checked');
    }
  }

  function onCheckNow() {
    checkNow();
  }

  function checkNow() {
    $('#checkNowButton').attr('disabled', 'disabled');
    $('#checkNowButton').val('Checking...');
    chrome.extension.sendMessage({ action: 'recheck' }, function(res) {});
  }
})();