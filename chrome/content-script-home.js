var baseUrl;

(function() {
  $(function() {
    baseUrl = getBaseUrl(document.location.href);
    addImportedExpenses(function() {
      addTrainingExpenses(function() {
        addBookBudgetExpenses();
      });  
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
        var sectionBody = addSectionToHomeBody('Imported Expenses', 'importedExpensesSection', document.getElementById('importedExpensesTable'));
        console.log(sectionBody.innerHTML);
        sectionBody.innerHTML += data;
        callback();
      }
    });
  }

  function addBookBudgetExpenses() {
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
        if (dataIndex === -1) {
          dataIndex = data.indexOf('<table>');
          data = data.substr(dataIndex);
          data = data.replace(/<table/, '<table id="bookBudgetExpensesTable" class="list"');
        } else {
          data = data.substr(dataIndex);
          data = data.replace(/<table class="report"/, '<table id="bookBudgetExpensesTable" class="list"');
        }
        data = data.substr(0, data.indexOf('</table>') + '</table>'.length);
        data = data.replace(/<script(.*?)<\/script>/g, '');
        var sectionBody = addSectionToHomeBody('Book Budget Expenses', 'bookBudgetExpensesSection', document.getElementById('bookBudgetExpensesTable'));
        sectionBody.innerHTML += data;
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
        if (dataIndex === -1) {
          dataIndex = data.indexOf('<table>');
          data = data.substr(dataIndex);
          data = data.replace(/<table/, '<table id="trainingBudgetExpensesTable" class="list"');
        } else {
          data = data.substr(dataIndex);
          data = data.replace(/<table class="report"/, '<table id="trainingBudgetExpensesTable" class="list"');
        }
        data = data.substr(0, data.indexOf('</table>') + '</table>'.length);
        data = data.replace(/<script(.*?)<\/script>/g, '');
        var sectionBody = addSectionToHomeBody('Training Budget Expenses', 'trainingBudgetExpensesSection', document.getElementById('trainingBudgetExpensesTable'));
        sectionBody.innerHTML += data;
        callback();
      }
    });
  }

  function addSectionToHomeBody(title, sectionId, newElem) {
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
    return document.getElementById(sectionId + '_body');
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
