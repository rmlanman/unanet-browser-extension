
function openTimesheet() {
  var timesheetId = localStorage.currentTimesheetId;
  var timesheetUrl;
  if (timesheetId && timesheetId != "null") {
    timesheetUrl = localStorage.url + '/action/time/edit?timesheetkey=' + timesheetId;
  } else {
    timesheetUrl = localStorage.url + '/action/time';
  }
  chrome.tabs.create({
    url: timesheetUrl,
    active: true
  });
}
