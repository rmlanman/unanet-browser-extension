'use strict';

var ONE_DAY_MS = 24 * 60 * 60 * 1000;

var Days = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
};

function checkTimesheets(opts, callback) {
  var allTimesheetErrors = [];
  return getActiveTimesheets(opts, function(err, timesheets) {
    if (err) {
      return callback(err);
    }
    if (timesheets.length == 0) {
      return callback(null, [
        {
          timesheetId: null,
          errors: [
            {
              date: new Date(),
              message: 'No active timesheets'
            }
          ]
        }
      ], timesheets);
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
      return callback(null, allTimesheetErrors, timesheets);
    });
  });

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

function getBaseUrl(url) {
  var idx = url.indexOf('/', 'https://aa'.length);
  if (idx > 0) {
    url = url.substr(0, idx);
  }
  return url;
}

function getActiveTimesheets(opts, callback) {
  return getUrl(opts, '/action/time/list', function(err, body) {
    if (err) {
      return callback(err);
    }
    var rows = [];

    body = body.substr(body.indexOf('<div id="active-timesheet-list"'));
    var activeTimesheetElem = $(body)[0];
    $('tr', activeTimesheetElem).each(function() {
      var rowId = $(this).attr('id');
      if (rowId) {
        var columns = $('td', this);
        var status = $(columns.get(7)).text();
        if (status === 'INUSE') {
          rows.push({
            id: parseInt(rowId.substr('t'.length)),
            startDate: new Date($(columns.get(3)).text()),
            endDate: new Date($(columns.get(5)).text()),
            status: status
          });
        }
      }
    });
    return callback(null, rows);
  });
}

function getTimesheet(opts, timesheetId, callback) {
  return getUrl(opts, '/action/time/view?timesheetkey=' + timesheetId, function(err, body) {
    if (err) {
      return callback(err);
    }
    var timesheet = {
      columns: [],
      rows: [],
      totals: []
    };

    var timesheetDatesMatch = body.match(/Timesheet for (.*?) \((.*?) - (.*?)\)/);
    if (timesheetDatesMatch) {
      timesheet.startDate = new Date(timesheetDatesMatch[2]);
      timesheet.startDate.setHours(0, 0, 0, 0);
      timesheet.endDate = new Date(timesheetDatesMatch[3]);
      timesheet.endDate.setHours(0, 0, 0, 0);
      timesheet.endDate = new Date(+timesheet.endDate + ONE_DAY_MS - 1);
    }

    body = body.substr(body.indexOf('<div class="timesheet"'));
    var activeTimesheetElem = $(body)[0];
    $('tr', activeTimesheetElem).each(function() {
      var rowClass = $(this).attr('class');
      var columns = $('td', this);
      if (rowClass) { // this is a project row
        updateTimesheetWithProjectRow(timesheet, columns);
      } else { // this is a title or total row
        if ($(columns.get(0)).text().toLowerCase().indexOf('totals') >= 0) {
          updateTimesheetWithTotalsRow(timesheet, columns);
        } else {
          updateTimesheetWithHeaderRow(timesheet, columns);
        }
      }
    });
    return callback(null, timesheet);
  });

  function updateTimesheetWithTotalsRow(timesheet, columns) {
    // totals start at 1 and the last column is the grand total
    for (var i = 1; i < columns.length - 1; i++) {
      var t = $(columns.get(i)).text();
      var v = null;
      if (t && t.length > 0) {
        v = parseFloat(t);
      }
      timesheet.totals.push(v);
    }

    timesheet.total = parseFloat($(columns.get(columns.length - 1)).text());
  }

  function updateTimesheetWithHeaderRow(timesheet, columns) {
    // date columns start at 5 and the last column is the totals column
    var date = new Date(+timesheet.startDate);
    for (var i = 5; i < columns.length - 1; i++) {
      var t = $(columns.get(i)).text().toLowerCase();
      var m = t.match(/[a-z]*([0-9]*)/);
      if (m && m[1].length > 0) {
        timesheet.columns.push(date);
        date = new Date(+date + ONE_DAY_MS);
      }
    }
  }

  function updateTimesheetWithProjectRow(timesheet, columns) {
    var projectRow = {
      name: $(columns.get(0)).text(),
      laborCategory: $(columns.get(1)).text(),
      location: $(columns.get(2)).text(),
      projectType: $(columns.get(3)).text(),
      payCode: $(columns.get(4)).text(),
      columns: [],
      total: parseFloat($(columns.get(columns.length - 1)).text())
    };

    // hour columns start at 5 and the last column is the totals column
    for (var i = 5; i < columns.length - 1; i++) {
      var t = $(columns.get(i)).text();
      var v = null;
      if (t && t.length > 0) {
        v = parseFloat(t);
      }
      projectRow.columns.push(v);
    }

    timesheet.rows.push(projectRow);
  }
}

function getUrl(opts, url, callback) {
  $.get(opts.urlBase + url, function(body, err) {
    if (/<title>.* Login<\/title>/.test(body)) {
      return login(opts, function(err) {
        if (err) {
          return callback(err);
        }
        return $.get(opts.urlBase + url, function(body) {
          return callback(null, body);
        });
      });
    }
    return callback(null, body);
  });
}

function login(opts, callback) {
  return $.ajax({
      type: "POST",
      url: opts.urlBase + '/action/login/validate',
      data: {
        username: opts.username,
        password: opts.password
      },
      success: function(body) {
        if (/Invalid username or password/.test(body)) {
          return callback(new Error('Invalid username or password.'));
        }
        return callback();
      }
    }
  );
}

function formatDate_MM_dd_yyyy(d) {
  return (d.getMonth() + 1) + '/' + d.getDate() + '/' + (d.getYear() + 1900);
}