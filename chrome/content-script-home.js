'use strict';

var baseUrl;

(function() {
  $(function() {
    baseUrl = getBaseUrl(document.location.href);

    addImportedExpenses();
  });

  function addImportedExpenses() {
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
        sectionBody.innerHTML += data;
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
