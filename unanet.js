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
      shouldHaveActiveTimesheet(opts, function (err, shouldWarn) {
        if (shouldWarn) {
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
      });

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
    console.log('checking timesheet', timesheet);
    timesheet.columns.forEach(function(column, i) {
      var columnDate = new Date(column);
      console.log('checking column', i, columnDate);

      var columnDay = columnDate.getDay();
      if (columnDay == Days.Saturday || columnDay == Days.Sunday) {
        console.log('skipping column Saturday/Sunday');
        return;
      }
      if (columnDate > endOfToday) {
        console.log('skipping column.', columnDate, '>', endOfToday);
        return;
      }
      if (columnDate >= startOfToday && columnDate <= endOfToday && new Date() < endOfWorkDay) {
        console.log('skipping column.', columnDate, '>=', startOfToday, ' && ', columnDate, '<=', endOfToday, ' && ', new Date(), '<', endOfWorkDay);
        return;
      }
      if (!timesheet.totals[i] || timesheet.totals[i] == 0) {
        var error = {
          date: columnDate,
          message: 'No time filled in for ' + formatDate_MM_dd_yyyy(columnDate)
        };
        console.log('Found error for column', i, timesheet.totals[i], error);
        errors.push(error);
        return;
      }

      console.log('column ok');
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

function getAllTimesheets(opts, callback) {
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
        rows.push({
          id: parseInt(rowId.substr('t'.length)),
          startDate: new Date($(columns.get(3)).text()),
          endDate: new Date($(columns.get(5)).text()),
          status: status
        });
      }
    });

    body = body.substr(body.indexOf('<div id="inactive-timesheet-list"'));
    var inactiveTimesheetElem = $(body)[0];
    $('tr', inactiveTimesheetElem).each(function() {
      var rowId = $(this).attr('id');
      if (rowId) {
        var columns = $('td', this);
        rows.push({
          id: parseInt(rowId.substr('t'.length)),
          startDate: new Date($(columns.get(3)).text()),
          endDate: new Date($(columns.get(5)).text()),
          status: status
        });
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
      timesheet.endDate.setHours(23, 59, 59, 999);
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
    for (var i = 5; i < columns.length - 1; i++) {
      var t = $(columns.get(i)).text().toLowerCase();
      var m = t.match(/[a-z]*([0-9]*)/);
      if (m && m[1].length > 0) {
        var date = new Date(timesheet.startDate.getFullYear(), timesheet.startDate.getMonth(), timesheet.startDate.getDate() + (i - 5));
        console.log('updateTimesheetWithHeaderRow', date, m);
        timesheet.columns.push(date);
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
      data: unanetPostDataSerialize({
        username: opts.username,
        password: opts.password
      }),
      success: function(body) {
        if (/Invalid username or password/.test(body)) {
          return callback(new Error('Invalid username or password.'));
        }
        return callback();
      }
    }
  );
}

function shouldHaveActiveTimesheet(opts, callback) {
  var currentDate = new Date();
  currentDate.setDate(currentDate.getDate());
  var dayOfTheWeek = currentDate.getDay();
  var shouldWarn = false;
  if (dayOfTheWeek === Days.Saturday || dayOfTheWeek === Days.Sunday) {
    return callback(null, shouldWarn);
  } else {
    getAllTimesheets(opts, function (err, timesheets) {
      if (err) {
        return callback(err);
      }
      timesheetExistsForCurrentDay(timesheets, currentDate, function (exists) {
        return callback(null, !exists);
      });
    });
  }
}

function timesheetExistsForCurrentDay(timesheets, date, callback) {
  //Set timesheet end date hours to 11:59:59
  for(var i = 0; i < timesheets.length; i++) {
    timesheets[i].endDate.setHours(23, 59, 59, 999);
    if ((+timesheets[i].startDate < +date) && (+date < +timesheets[i].endDate)) {
      return callback(true);
    }
  }
  return callback(false);
}

function formatDate_MM_dd_yyyy(d) {
  return (d.getMonth() + 1) + '/' + d.getDate() + '/' + (d.getYear() + 1900);
}

function getImportedExpensesHtml(baseUrl, callback) {
  $.ajax({
    type: "POST",
    url: baseUrl + "/action/expense/imported/list",
    data: unanetPostDataSerialize({
      voucher_mod: false,
      voucherClass: 'com.unanet.page.criteria.UserVoucherNumberMenu',
      voucher_dbValue: null,
      voucher_voucherNumber_fltr: null,
      vendor_mod: false,
      vendorClass: 'com.unanet.page.criteria.VendorMenu',
      vendor_dbValue: null,
      vendor_vendor_fltr: null,
      expense_date_bDate: 'BOT',
      expense_date_eDate: 'EOT',
      expense_date: 'bot_eot',
      imported_date_bDate: 'BOT',
      imported_date_eDate: 'EOT',
      imported_date: 'bot_eot',
      reportStatus: 'AVAILABLE',
      savedListName: 'criteriaClass:com.unanet.page.expense.ImportedExpensePage$ImportedExpenseSearchCriteria',
      loadValues: true,
      restore: false,
      list: true,
      edit: false,
      addNext: false,
      blindInsert: false
    }),
    success: function getImportedExpensesHtmlSuccess(data) {
      data = data.substr(data.indexOf('<table class="list"'));
      data = data.substr(0, data.indexOf('</table>') + '</table>'.length);
      data = data.replace(/<table class="list"/, '<table id="importedExpensesTable" class="list"');
      data = data.replace(/<script(.*?)<\/script>/g, '');
      return callback(null, data);
    }
  });
}

function getLeaveBudgetHtml(baseUrl, callback) {
  $.ajax({
    type: "POST",
    url: baseUrl + "/action/reports/user/detail/schedule/report",
    data: unanetPostDataSerialize({
      loadValues: true,
      targetPath: '/reports/user/detail/schedule/report',
      managerPath: '/reports/user/detail/schedule/search',
      criteriaClass: 'com.unanet.page.reports.search.UserScheduleDetailsCriteria',
      project_orgMode: false,
      project_filterClosedProjects: false,
      status: "1",
      dateType: "range",
      pPeriod: 'c_yr',
      reportAssign: true,
      allocateBudgets: true,
      accruals: true,
      projectedAccruals: false,
      leave_request: "INCLUDE_LEAVE",
      unapprovedLeave: false,
      includeBoundOnly: false,
      includeUnsched: false,
      leaveBalance: true,
      showProjTitle: true
    }),
    success: function getLeaveBudgetHtmlSuccess(data) {
      var dataIndex = data.indexOf('<table class=report');
      if (dataIndex === -1) {
        dataIndex = data.indexOf('<table>');
        data = data.substr(dataIndex);
        data = data.replace(/<table/, '<table id="leaveBalanceTable" class="list"');
      } else {
        data = data.substr(dataIndex);
        data = data.replace(/<table class=report/, '<table id="leaveBalanceTable" class="list"');
      }
      var first = data.indexOf('</table>');
      var second = data.substr(data.indexOf('</table>') + 1).indexOf('</table>');
      data = data.substr(0, first + second + '</table>'.length);
      data = data.replace(/<script(.*?)<\/script>/g, '');
      return callback(null, data);
    }
  });
}

function getTrainingExpensesHtml(baseUrl, callback) {
  $.ajax({
    type: "POST",
    url: baseUrl + "/action/reports/user/detail/expense/report",
    data: unanetPostDataSerialize({
      loadValues: true,
      targetPath: '/reports/user/detail/expense/report',
      managerPath: '/reports/user/detail/expense/search',
      criteriaClass: 'com.unanet.page.reports.search.UserExpenseDetailsCriteria',
      project_orgMode: false,
      project_filterClosedProjects: false,
      expensetype: ['55','54','53'],
      dateRange: 'c_yr',
      expenseDates: 'INCURRED',
      includeNonCompletedExpenses: true,
      showVoucherNumber: true,
      showComments: false,
      showPaymentMethod: false,
      showProjTitle: false,
      groupType: 'byProject'
    }),
    success: function getTrainingExpensesHtmlSuccess(data) {
      var dataIndex = data.indexOf('<table class="report"');
      var remainingBudget = parseInt(localStorage.trainingBudget) || 5000;
      var totalExpenses = 0;
      var firstHalf;
      var secondHalf;
      if (dataIndex === -1) {
        dataIndex = data.indexOf('<table>');
        data = data.substr(dataIndex);
        data = data.replace(/<table/, '<table id="trainingBudgetExpensesTable" class="list"');
        data = data.substr(0, data.indexOf('</table>') + '</table>'.length);
        firstHalf = data.substr(0, data.indexOf('<table id="trainingBudgetExpensesTable" class="list">') + '<table id="trainingBudgetExpensesTable" class="list">'.length);
        secondHalf = data.substr(data.indexOf('</table'));
      } else {
        totalExpenses = data.substring(data.indexOf('<td class="total">$') + '<td class="total">$'.length);
        totalExpenses = parseFloat(totalExpenses.replace(/,/g, ''));
        data = data.substr(dataIndex);
        data = data.replace(/<table class="report"/, '<table id="trainingBudgetExpensesTable" class="list"');
        data = data.substr(0, data.indexOf('</table>') + '</table>'.length);
        firstHalf = data.substr(0, data.indexOf('</tbody>'));
        secondHalf = data.substr(data.indexOf('</tbody>'));
      }
      remainingBudget = (remainingBudget - totalExpenses).toFixed(2);
      formatMoney(remainingBudget, function (formattedRemainder) {
        var remainingHTML = '<tr class="t1"><td colspan="5" class="label">Remaining Training Budget:</td><td class="total">$' + formattedRemainder + '</td></tr>';
        data = firstHalf.concat(remainingHTML).concat(secondHalf);
        return callback(null, data);
      });
    }
  });
}

function getBookBudgetExpensesHtml(baseUrl, callback) {
  $.ajax({
    type: "POST",
    url: baseUrl + "/action/reports/user/detail/expense/report",
    data: unanetPostDataSerialize({
      loadValues: true,
      targetPath: '/reports/user/detail/expense/report',
      managerPath: '/reports/user/detail/expense/search',
      criteriaClass: 'com.unanet.page.reports.search.UserExpenseDetailsCriteria',
      project_orgMode: false,
      project_filterClosedProjects: false,
      expensetype: '22',
      dateRange: 'c_yr',
      expenseDates: 'INCURRED',
      includeNonCompletedExpenses: true,
      showVoucherNumber: true,
      showComments: false,
      showPaymentMethod: false,
      showProjTitle: false,
      groupType: 'byProject'
    }),
    success: function getBookBudgetExpensesHtmlSuccess(data) {
      var dataIndex = data.indexOf('<table class="report"');
      var remainingBudget = parseInt(localStorage.bookBudget) || 500;
      var totalExpenses = 0;
      var firstHalf;
      var secondHalf;
      if (dataIndex === -1) {
        dataIndex = data.indexOf('<table>');
        data = data.substr(dataIndex);
        data = data.replace(/<table/, '<table id="bookBudgetExpensesTable" class="list"');
        data = data.substr(0, data.indexOf('</table>') + '</table>'.length);
        firstHalf = data.substr(0, data.indexOf('<table id="bookBudgetExpensesTable" class="list">') + '<table id="bookBudgetExpensesTable" class="list">'.length);
        secondHalf = data.substr(data.indexOf('</table'));
      } else {
        totalExpenses = data.substring(data.indexOf('<td class="total">$') + '<td class="total">$'.length);
        totalExpenses = parseFloat(totalExpenses.replace(/,/g, ''));        data = data.substr(dataIndex);
        data = data.replace(/<table class="report"/, '<table id="bookBudgetExpensesTable" class="list"');
        data = data.substr(0, data.indexOf('</table>') + '</table>'.length);
        firstHalf = data.substr(0, data.indexOf('</tbody>'));
        secondHalf = data.substr(data.indexOf('</tbody>'));
      }
      remainingBudget = (remainingBudget - totalExpenses).toFixed(2);
      formatMoney(remainingBudget, function (formattedRemainder) {
        var remainingHTML = '<tr class="t1"><td colspan="5" class="label">Remaining Book Budget:</td><td class="total">$' + formattedRemainder + '</td></tr>';
        data = firstHalf.concat(remainingHTML).concat(secondHalf);
        return callback(null, data);
      });

    }
  });
}

// Short Versions of the HTMLs
function getShortLeaveBudgetHTML(baseUrl, callback) {
  $.ajax({
    type: "POST",
    url: baseUrl + "/action/reports/user/detail/schedule/report",
    data: unanetPostDataSerialize({
      loadValues: true,
      targetPath: '/reports/user/detail/schedule/report',
      managerPath: '/reports/user/detail/schedule/search',
      criteriaClass: 'com.unanet.page.reports.search.UserScheduleDetailsCriteria',
      project_orgMode: false,
      project_filterClosedProjects: false,
      status: "1",
      dateType: "range",
      pPeriod: 'c_yr',
      reportAssign: true,
      allocateBudgets: true,
      accruals: true,
      projectedAccruals: false,
      leave_request: "INCLUDE_LEAVE",
      unapprovedLeave: false,
      includeBoundOnly: false,
      includeUnsched: false,
      leaveBalance: true,
      showProjTitle: true
    }),
    success: function getLeaveBudgetHtmlSuccess(data) {
      data = data.substr(data.indexOf('PTO'));
      data = data.substr(data.indexOf('number') + 8);
      data = data.substr(data.indexOf('number') + 8);
      data = data.substr(data.indexOf('number') + 8);
      data = data.substr(data.indexOf('number') + 8);
      data = data.substr(data.indexOf('number') + 8);
      data = parseFloat(data);
      return callback(null, data + " hours");
    }
  });
}

function getShortTrainingBudgetExpensesHtml(baseUrl, callback) {
  $.ajax({
    type: "POST",
    url: baseUrl + "/action/reports/user/detail/expense/report",
    data: unanetPostDataSerialize({
      loadValues: true,
      targetPath: '/reports/user/detail/expense/report',
      managerPath: '/reports/user/detail/expense/search',
      criteriaClass: 'com.unanet.page.reports.search.UserExpenseDetailsCriteria',
      project_orgMode: false,
      project_filterClosedProjects: false,
      expensetype: ['55','54','53'],
      dateRange: 'c_yr',
      expenseDates: 'INCURRED',
      includeNonCompletedExpenses: true,
      showVoucherNumber: true,
      showComments: false,
      showPaymentMethod: false,
      showProjTitle: false,
      groupType: 'byProject'
    }),
    success: function getTrainingExpensesHtmlSuccess(data) {
      var dataIndex = data.indexOf('<table class="report"');
      var remainingBudget = parseInt(localStorage.trainingBudget) || 5000;
      var totalExpenses = 0;
      if (dataIndex != -1) {
        totalExpenses = data.substring(data.indexOf('<td class="total">$') + '<td class="total">$'.length);
        totalExpenses = parseFloat(totalExpenses.replace(/,/g, ''));
      }
      remainingBudget = (remainingBudget - totalExpenses).toFixed(2);
      formatMoney(remainingBudget, function (formattedRemainder) {
        return callback(null, '$' + formattedRemainder);
      });

    }
  });
}

function getShortBookBudgetExpensesHtml(baseUrl, callback) {
  $.ajax({
    type: "POST",
    url: baseUrl + "/action/reports/user/detail/expense/report",
    data: unanetPostDataSerialize({
      loadValues: true,
      targetPath: '/reports/user/detail/expense/report',
      managerPath: '/reports/user/detail/expense/search',
      criteriaClass: 'com.unanet.page.reports.search.UserExpenseDetailsCriteria',
      project_orgMode: false,
      project_filterClosedProjects: false,
      expensetype: '22',
      dateRange: 'c_yr',
      expenseDates: 'INCURRED',
      includeNonCompletedExpenses: true,
      showVoucherNumber: true,
      showComments: false,
      showPaymentMethod: false,
      showProjTitle: false,
      groupType: 'byProject'
    }),
    success: function getBookBudgetExpensesHtmlSuccess(data) {
      var dataIndex = data.indexOf('<table class="report"');
      var remainingBudget = parseInt(localStorage.bookBudget) || 500;
      var totalExpenses = 0;
      if (dataIndex != -1) {
        totalExpenses = data.substring(data.indexOf('<td class="total">$') + '<td class="total">$'.length);
        totalExpenses = parseFloat(totalExpenses.replace(/,/g, ''));
      }
      remainingBudget = (remainingBudget - totalExpenses).toFixed(2);
      formatMoney(remainingBudget, function (formattedRemainder) {
        return callback(null, '$' + formattedRemainder);
      });
    }
  });
}

function getShortImportedExpensesHtml(baseUrl, callback) {
  $.ajax({
    type: "POST",
    url: baseUrl + "/action/expense/imported/list",
    data: unanetPostDataSerialize({
      voucher_mod: false,
      voucherClass: 'com.unanet.page.criteria.UserVoucherNumberMenu',
      voucher_dbValue: null,
      voucher_voucherNumber_fltr: null,
      vendor_mod: false,
      vendorClass: 'com.unanet.page.criteria.VendorMenu',
      vendor_dbValue: null,
      vendor_vendor_fltr: null,
      expense_date_bDate: 'BOT',
      expense_date_eDate: 'EOT',
      expense_date: 'bot_eot',
      imported_date_bDate: 'BOT',
      imported_date_eDate: 'EOT',
      imported_date: 'bot_eot',
      reportStatus: 'AVAILABLE',
      savedListName: 'criteriaClass:com.unanet.page.expense.ImportedExpensePage$ImportedExpenseSearchCriteria',
      loadValues: true,
      restore: false,
      list: true,
      edit: false,
      addNext: false,
      blindInsert: false
    }),
    success: function getImportedExpensesHtmlSuccess(data) {
      if (data.indexOf('No data found') === -1) {
        return callback(null, "<div class=\"warn\">You have unreported expenses</div>");
      } else {
        return callback(null, "<div class=\"okay\">No unreported expenses</div>");
      }
    }
  });
}

function formatMoney(floatValue, callback) {
  var floatParts = floatValue.split('.');
  var dollars = floatParts[0];
  var cents = floatParts[1];
  if (dollars.length > 3) {
    var dollars = dollars.substr(0,dollars.length - 3) + ',' + dollars.substr(dollars.length - 3);
  }
  return callback(dollars + '.' + cents);
}

// need this because jquery does not handle arrays correctly for unanet.
// jquery will add '[]' to the name of the variable and unanet does not expect '[]'
function unanetPostDataSerialize(data) {
  var items = [];
  Object.keys(data).forEach(function(key) {
    var value = data[key];
    if(value instanceof Array) {
      value.forEach(function(v) {
        items.push(encodeURIComponent(key) + "=" + encodeURIComponent(v));
      });
    } else {
      items.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    }
  });
  return items.join('&').replace(/%20/g, '+');
}
