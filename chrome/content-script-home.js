var baseUrl;
// var async = require('async');

(function() {
  $(function() {
    baseUrl = getBaseUrl(document.location.href);
    async.parallel({
      imported: function(callback) {
        addImportedExpenses(function(results) {
          callback(null, results);
        });
      },
      leave: function(callback) {
        addLeaveBudget(function(results) {
          callback(null, results);
        });
      },
      training: function(callback) {
        addTrainingExpenses(function(results) {
          callback(null, results);
        });
      },
      book: function(callback) {
        addBookBudgetExpenses(function(results) {
          callback(null, results);
        });
      }
    },
    function (err, results){
      async.series([
        addSectionToHomeBody(results.imported.sectionTitle, results.imported.sectionId, results.imported.newElem, addHTML.bind(null, results.imported.html)),
        addSectionToHomeBody(results.leave.sectionTitle, results.leave.sectionId, results.leave.newElem, addHTML.bind(null, results.leave.html)),
        addSectionToHomeBody(results.training.sectionTitle, results.training.sectionId, results.training.newElem, addHTML.bind(null, results.training.html)),
        addSectionToHomeBody(results.book.sectionTitle, results.book.sectionId, results.book.newElem, addHTML.bind(null, results.book.html)),
      ]);
    });
  });

  function addImportedExpenses(callback) {
    $.ajax({
      type: "POST",
      url: baseUrl + "/action/expense/imported/list",
      data: {
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
      },
      success: function(data) {
        data = data.substr(data.indexOf('<table class="list"'));
        data = data.substr(0, data.indexOf('</table>') + '</table>'.length);
        data = data.replace(/<table class="list"/, '<table id="importedExpensesTable" class="list"');
        data = data.replace(/<script(.*?)<\/script>/g, '');
        callback({sectionTitle:'Imported Expenses', sectionId:'importedExpensesSection', newElem:document.getElementById('importedExpensesTable'), html:data});
      }
    });
  }

  function addLeaveBudget (callback) {
    $.ajax({
      type: "POST",
      url: baseUrl + "/action/reports/user/detail/schedule/report",
      data: {
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
        showProjTitle: true,
      },
      success: function(data) {
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
        callback({sectionTitle:'Leave Balances', sectionId:'leaveBalancesSection', newElem:document.getElementById('leaveBalanceTable'), html:data});
      }
    });
  }

  function addTrainingExpenses(callback) {
    $.ajax({
      type: "POST",
      url: baseUrl + "/action/reports/user/detail/expense/report",
      data: {
        loadValues: true,
        targetPath: '/reports/user/detail/expense/report',
        managerPath: '/reports/user/detail/expense/search',
        criteriaClass: 'com.unanet.page.reports.search.UserExpenseDetailsCriteria',
        project_orgMode: false,
        project_filterClosedProjects: false,
        expensetype: '55',
        expensetype: '54',
        expensetype: '53',
        dateRange: 'c_yr',
        expenseDates: 'INCURRED',
        includeNonCompletedExpenses: true,
        showVoucherNumber: true,
        showComments: false,
        showPaymentMethod: false,
        showProjTitle: false,
        groupType:'byProject',
      },
      success: function(data) {
        var dataIndex = data.indexOf('<table class="report"');
        var remainingBudget = 5000;
        var totalExpenses = 0;
        var firstDataHalf;
        var secondDataHalf;
        if (dataIndex === -1) {
          dataIndex = data.indexOf('<table>');
          data = data.substr(dataIndex);
          data = data.replace(/<table/, '<table id="trainingBudgetExpensesTable" class="list"');
          data = data.substr(0, data.indexOf('</table>') + '</table>'.length);
          firstHalf = data.substr(0,data.indexOf('<table id="trainingBudgetExpensesTable" class="list">') + '<table id="trainingBudgetExpensesTable" class="list">'.length);
          secondHalf = data.substr(data.indexOf('</table'));
        } else {
          totalExpenses = data.substring(data.indexOf('<td class="total">$') +  '<td class="total">$'.length);
          totalExpenses = Number(totalExpenses.substring(0, totalExpenses.indexOf('</td>')));
          data = data.substr(dataIndex);
          data = data.replace(/<table class="report"/, '<table id="trainingBudgetExpensesTable" class="list"');
          data = data.substr(0, data.indexOf('</table>') + '</table>'.length);
          firstDataHalf = data.substr(0, data.indexOf('</tbody>'));
          secondDataHalf = data.substr(data.indexOf('</tbody>'));
        }
        remainingBudget = remainingBudget - totalExpenses;
        var remainingHTML = '<tr class="t1"><td colspan="5" class="label">Remaining Training Budget:</td><td class="total">$' + remainingBudget + '</td></tr>';
        data = firstHalf.concat(remainingHTML).concat(secondHalf);
        callback({sectionTitle:'Training Budget Expenses', sectionId:'trainingBudgetExpensesSection', newElem:document.getElementById('trainingBudgetExpensesTable'), html:data});
      }
    });
  }

  function addBookBudgetExpenses(callback) {
    $.ajax({
      type: "POST",
      url: baseUrl + "/action/reports/user/detail/expense/report",
      data: {
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
        groupType:'byProject',
      },
      success: function(data) {
        var dataIndex = data.indexOf('<table class="report"');
        var remainingBudget = 500;
        var totalExpenses = 0;
        var firstDataHalf;
        var secondDataHalf;
        if (dataIndex === -1) {
          dataIndex = data.indexOf('<table>');
          data = data.substr(dataIndex);
          data = data.replace(/<table/, '<table id="bookBudgetExpensesTable" class="list"');
          data = data.substr(0, data.indexOf('</table>') + '</table>'.length);
          firstHalf = data.substr(0,data.indexOf('<table id="bookBudgetExpensesTable" class="list">') + '<table id="bookBudgetExpensesTable" class="list">'.length);
          secondHalf = data.substr(data.indexOf('</table'));
        } else {
          totalExpenses = data.substring(data.indexOf('<td class="total">$') +  '<td class="total">$'.length);
          totalExpenses = Number(totalExpenses.substring(0, totalExpenses.indexOf('</td>')));
          data = data.substr(dataIndex);
          data = data.replace(/<table class="report"/, '<table id="bookBudgetExpensesTable" class="list"');
          data = data.substr(0, data.indexOf('</table>') + '</table>'.length);
          firstHalf = data.substr(0, data.indexOf('</tbody>'));
          secondHalf = data.substr(data.indexOf('</tbody>'));
        }
        remainingBudget = remainingBudget - totalExpenses;
        var remainingHTML = '<tr class="t1"><td colspan="5" class="label">Remaining Budget:</td><td class="total">$' + remainingBudget + '</td></tr>';
        data = firstHalf.concat(remainingHTML).concat(secondHalf);
        callback({sectionTitle:'Book Budget Expenses', sectionId:'bookBudgetExpensesSection', newElem:document.getElementById('bookBudgetExpensesTable'), html:data});
      }
    });
  }

  function addSectionToHomeBody(title, sectionId, newElem, callback) {
    var homeBodyElem = findHomeBodyElem();
    homeBodyElem.innerHTML +=
    "<table class='section' id='" + sectionId + "'>"
      + "<thead>"
      + "<tr>"
      + "<td class='label'>" + title + "</td>"
      + "<td class='label right'></td>"
      + "</tr>"
      + "</thead>"
      + "<tbody>"
      + "<tr>"
      + "<td class='section-body' colspan='2' id='" + sectionId + "_body'></td>"
      + "</tr>"
      + "</tbody>"
      + "</table>";
    return callback(document.getElementById(sectionId + '_body'));
  }

  function addHTML(data, sectionBody) {
    return sectionBody.innerHTML += data;
  }

  function findHomeBodyElem() {
    var bodyDiv = document.getElementById('body');
    var bodyTables = nodeListToArray(bodyDiv.getElementsByTagName('table'));
    var bodyMainTables = bodyTables.filter(function(table) {
      return table.className == 'body-main';
    });
    if (bodyMainTables.length != 1) {
      alert("Could not find home body table");
      return null;
    }
    var bodyMainTable = bodyMainTables[0];
    return bodyMainTable.rows[0].cells[1];
  }

  function nodeListToArray(nodeList) {
    return Array.prototype.slice.call(nodeList);
  }
})();
