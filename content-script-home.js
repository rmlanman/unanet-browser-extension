//shared by Chrome & Firefox extensions
var baseUrl;

(function() {
  $(function() {
    baseUrl = getBaseUrl(document.location.href);
    async.parallel({
        imported: addImportedExpenses,
        leave: addLeaveBudget,
        training: addTrainingExpenses,
        book: addBookBudgetExpenses
      },
      function(err, results) {
        addSectionToHomeBody(results.imported.sectionTitle, results.imported.sectionId, results.imported.newElem, addHTML.bind(null, results.imported.html));
        addSectionToHomeBody(results.leave.sectionTitle, results.leave.sectionId, results.leave.newElem, addHTML.bind(null, results.leave.html));
        addSectionToHomeBody(results.training.sectionTitle, results.training.sectionId, results.training.newElem, addHTML.bind(null, results.training.html));
        addSectionToHomeBody(results.book.sectionTitle, results.book.sectionId, results.book.newElem, addHTML.bind(null, results.book.html));
      });
  });

  function addImportedExpenses(callback) {
    return getImportedExpensesHtml(baseUrl, function(err, data) {
      if (err) {
        return callback(err);
      }
      return callback(null, {sectionTitle: 'Imported Expenses', sectionId: 'importedExpensesSection', newElem: document.getElementById('importedExpensesTable'), html: data});
    });
  }

  function addLeaveBudget(callback) {
    return getLeaveBudgetHtml(baseUrl, function(err, data) {
      if (err) {
        return callback(err);
      }
      return callback(null, {sectionTitle: 'Leave Balances', sectionId: 'leaveBalancesSection', newElem: document.getElementById('leaveBalanceTable'), html: data});
    });
  }

  function addTrainingExpenses(callback) {
    if (typeof chrome !== 'undefined') {
      chrome.extension.sendMessage({method: "getLocalStorage", key: "trainingBudget"}, function(response) {
        localStorage.trainingBudget = parseInt(response);
      });
    }
    getTrainingExpensesHtml(baseUrl, function(err, data) {
      if (err) {
        return callback(err);
      }
      return callback(null, {sectionTitle: 'Training Budget Expenses', sectionId: 'trainingBudgetExpensesSection', newElem: document.getElementById('trainingBudgetExpensesTable'), html: data});
    });
  }

  function addBookBudgetExpenses(callback) {
    if (typeof chrome !== 'undefined') {
      chrome.extension.sendMessage({method: "getLocalStorage", key: "bookBudget"}, function(response) {
        localStorage.bookBudget = parseInt(response);
      });
    }
    return getBookBudgetExpensesHtml(baseUrl, function(err, data) {
      if (err) {
        return callback(err);
      }
      return callback(null, {sectionTitle: 'Book Budget Expenses', sectionId: 'bookBudgetExpensesSection', newElem: document.getElementById('bookBudgetExpensesTable'), html: data});
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
