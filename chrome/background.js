'use strict';

var animateIconInterval;
var animateIconState = 0;
var notification = null;

function checkTimesheet(callback) {
  callback = callback || function() {};
  var opts = {
    urlBase: localStorage.url,
    username: localStorage.username,
    password: localStorage.password
  };

  return checkTimesheets(opts, function(err, timesheetErrors, timesheets) {
    localStorage.timesheetErrors = null;
    localStorage.errorMessages = null;
    localStorage.lastCheck = new Date();
    localStorage.currentTimesheetId = null;

    if (err) {
      localStorage.errorMessages = err.toString();
      setBadgeToError();
      return;
    }

    if (timesheets && timesheets.length > 0) {
      localStorage.currentTimesheetId = timesheets[0].id;
    }

    if (timesheetErrors.length > 0) {
      localStorage.timesheetErrors = JSON.stringify(timesheetErrors);

      var timesheetErrorMessages = [];
      timesheetErrors.forEach(function(timesheetError) {
        timesheetError.errors.forEach(function(error) {
          timesheetErrorMessages.push(error.message);
        });
      });

      if (!notification) {
        notification = webkitNotifications.createNotification(
          'unanet128.png',
          'Timesheet Errors',
          timesheetErrorMessages.join('\n')
        );
        notification.show();
      }

      setBadgeToError();
    } else {
      if (notification) {
        notification.cancel();
        notification = null;
      }
      setBadgeToOk();
    }
    return callback();
  });

  function setBadgeToOk() {
    if (animateIconInterval) {
      clearInterval(animateIconInterval);
      animateIconInterval = null;
    }
    chrome.browserAction.setBadgeText({text: ''});
    chrome.browserAction.setIcon({path: "unanet128.png"});
  }

  function setBadgeToError() {
    if (animateIconInterval) {
      clearInterval(animateIconInterval);
      animateIconInterval = null;
    }
    chrome.browserAction.setBadgeText({text: 'ERR'});
    animateIconInterval = setInterval(animateBadgeIcon, 1000);
  }

  function animateBadgeIcon() {
    if (animateIconState == 0) {
      chrome.browserAction.setIcon({path: "unanetError128.png"});
      animateIconState = 1;
    } else {
      chrome.browserAction.setIcon({path: "unanet128.png"});
      animateIconState = 0;
    }

  }
}

setInterval(checkTimesheet, 10 * 60 * 1000);
checkTimesheet();

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  if (request && request.action && request.action == 'recheck') {
    checkTimesheet(function() {
      // NOTE: Couldn't get sendResponse to work inside this callback
      chrome.extension.sendMessage({action: 'checkComplete'});
    });
  }
});
