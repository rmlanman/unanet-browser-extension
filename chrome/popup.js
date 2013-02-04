'use strict';

(function() {
  var EndOfDayInterval = 15 * 60 * 1000;

  $(function() {
    $('#saveSettingsButton').click(onSaveSettings);
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

  function loadTimesheetErrors() {
    var hasError = false;
    var html = '';
    if (localStorage.errorMessages || localStorage.timesheetErrors) {
      html = '<ul>';

      if (localStorage.errorMessages && localStorage.errorMessages != 'null') {
        var errorMessages = JSON.parse(localStorage.errorMessages);
        if (errorMessages.length > 0) {
          errorMessages.forEach(function(errorMessage) {
            html += '<li>' + errorMessage + '</li>';
            hasError = true;
          });
        }
      }

      if (localStorage.timesheetErrors && localStorage.timesheetErrors != 'null') {
        var timesheetErrors = JSON.parse(localStorage.timesheetErrors);
        if (timesheetErrors.length > 0) {
          timesheetErrors.forEach(function(timesheetError) {
            timesheetError.errors.forEach(function(error) {
              html += '<li>' + error.message + ' <a href="#" class="openTimesheetLink" timesheetId="' + (timesheetError.timesheetId || '') + '">open timesheet</a></li>';
              hasError = true;
            });
          });
        }
      }

      html += '</ul>';
    }
    if (hasError) {
      $('#timesheetErrors').html(html);
      $('#timesheetErrors').show();
    } else {
      $('#timesheetErrors').hide();
    }

    $('.openTimesheetLink').click(function() {
      var timesheetId = $(this).attr('timesheetId');
      var timesheetUrl;
      if (timesheetId) {
        timesheetUrl = localStorage.url + '/action/time/edit?timesheetkey=' + timesheetId;
      } else {
        timesheetUrl = localStorage.url + '/action/time';
      }
      chrome.tabs.create({
        url: timesheetUrl,
        active: true
      });
    });
  }

  function onCheckNow() {
    saveSettings();
    checkNow();
  }

  function checkNow() {
    $('#checkNowButton').attr('disabled', 'disabled');
    $('#checkNowButton').val('Checking...');
    chrome.extension.sendMessage({ action: 'recheck' }, function(res) {});
  }

  function loadSettings() {
    $('#url').val(localStorage.url);
    $('#username').val(localStorage.username);
    $('#password').val(localStorage.password);

    localStorage.endOfDayHours = localStorage.endOfDayHours || (12 + 5);
    localStorage.endOfDayMinutes = localStorage.endOfDayMinutes || 0;
    var endOfDayDate = new Date();
    endOfDayDate.setHours(parseInt(localStorage.endOfDayHours), parseInt(localStorage.endOfDayMinutes));
    var hours0to12 = endOfDayDate.getHours();
    if (hours0to12 >= 12) {
      hours0to12 -= 12;
    }
    $('#endOfDayTimeHour').val(hours0to12);
    $('#endOfDayTimeMinute').val(localStorage.endOfDayMinutes);
    $('#endOfDayTimeAmPm').val(endOfDayDate.getHours() < 12 ? 0 : 1);

    updateUrlLink();
  }

  function saveSettings() {
    localStorage.url = getBaseUrl($('#url').val());
    localStorage.username = $('#username').val();
    localStorage.password = $('#password').val();
    localStorage.endOfDayMinutes = $('#endOfDayTimeMinute').val();
    localStorage.endOfDayHours = parseInt($('#endOfDayTimeHour').val()) + (parseInt($('#endOfDayTimeAmPm').val()) * 12);
    updateUrlLink();
  }

  function onSaveSettings() {
    saveSettings();
    window.close();
    checkNow();
  }

  function updateUrlLink() {
    if (localStorage.url.length > 0) {
      $('#urlLink').show();
      $('#urlLink').click(function() {
        chrome.tabs.create({
          url: localStorage.url,
          active: true
        });
      });
    } else {
      $('#urlLink').hide();
    }
  }
})();