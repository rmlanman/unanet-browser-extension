'use strict';

(function() {
  $(function() {
    $('#saveSettingsButton').click(onSaveSettings);
    $('#checkNowButton').click(onCheckNow);
    loadSettings();
    loadTimesheetErrors();
  });

  function onCheckNow() {
    saveSettings();
    checkNow();
  }

  function checkNow() {
    $('#checkNowButton').attr('disabled', 'disabled');
    $('#checkNowButton').val('Checking...');
    var opts = {
      urlBase: localStorage.url,
      username: localStorage.username,
      password: localStorage.password
    };
    checkTimesheets(opts, function(err, timesheetErrors) {
      localStorage.timesheetErrors = null;
      localStorage.errorMessages = null;
      localStorage.lastCheck = new Date();

      if (err) {
        localStorage.errorMessages = err.toString();
      } else if (timesheetErrors.length > 0) {
        localStorage.timesheetErrors = JSON.stringify(timesheetErrors);
      }

      loadTimesheetErrors();
      $('#checkNowButton').val('Check Now');
      $('#checkNowButton').removeAttr('disabled');
    });
  }
})();
