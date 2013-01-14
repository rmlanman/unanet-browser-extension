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

  return doCheck(function(err, timesheetErrors) {
    localStorage.timesheetErrors = null;
    localStorage.errorMessages = null;

    if (err) {
      localStorage.errorMessages = err.toString();
      setBadgeToError();
      return;
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
    chrome.browserAction.setIcon({path: "unanet.png"});
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
      chrome.browserAction.setIcon({path: "unanet.png"});
      animateIconState = 0;
    }

  }

  function doCheck(callback) {
    var allTimesheetErrors = [];
    return getActiveTimesheets(opts, function(err, timesheets) {
      if (err) {
        return callback(err);
      }
      return async.forEach(timesheets, function(timesheet, callback) {
        return getTimesheet(opts, timesheet.id, function(err, timesheetData) {
          if (err) {
            return callback(err);
          }
          return checkTimesheet(timesheetData, function(err, timesheetErrors) {
            if (err) {
              return callback(err);
            }
            if (timesheetErrors && timesheetErrors.length > 0) {
              allTimesheetErrors.push({
                timesheetId: timesheet.id,
                errors: timesheetErrors
              });
            }
            return callback();
          });
        });
      }, function(err) {
        if (err) {
          return callback(err);
        }
        return callback(null, allTimesheetErrors);
      });
    });
  }

  function checkTimesheet(timesheet, callback) {
    var endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    var startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    var endOfWorkDay = new Date();
    endOfWorkDay.setHours(localStorage.endOfDayHours, localStorage.endOfDayMinutes, 0, 0);

    var errors = [];
    timesheet.columns.forEach(function(column, i) {
      var columnDate = new Date(column);
      var columnDay = columnDate.getDay();
      if (columnDay == Days.Saturday || columnDay == Days.Sunday) {
        return;
      }
      if (columnDate > endOfToday) {
        return;
      }
      if (columnDate >= startOfToday && columnDate <= endOfToday && new Date() < endOfWorkDay) {
        return;
      }
      if (!timesheet.totals[i] || timesheet.totals[i] == 0) {
        errors.push({
          date: columnDate,
          message: 'No time filled in for ' + formatDate_MM_dd_yyyy(columnDate)
        });
      }
    });
    return callback(null, errors);
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
