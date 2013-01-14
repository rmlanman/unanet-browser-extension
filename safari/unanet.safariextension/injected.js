
if (window.location && document.title.match(/Unanet.*Login\s*$/)) {

  safari.self.addEventListener("message", function(event) {
    if (event.name == 'credentials') {
      var credentials = event.message
      document.getElementById('username').value = credentials.username;
      document.getElementById('password').value = credentials.password;

      document.forms[0].submit();
    }
  }, false);

  safari.self.tab.dispatchMessage("credientialsNeeded", {
    url: window.location.href
  });
}

if (document.title && document.title.match(/Timesheet for/)) {
  var saveButton = document.querySelector("#button_save button");
  if (saveButton) {
    saveButton.addEventListener("click", function() {
      safari.self.tab.dispatchMessage("recheck");
    }, false);
  }
}

