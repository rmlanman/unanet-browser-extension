
(function() {
  'use strict';

  var UnanetExtension = function() {
    this.button = this.getByIdentifier('toolbarItems', 'com.nearinfinity.unanet.button');
    this.popover = this.getByIdentifier('popovers', 'com.nearinfinity.unanet.settings-error');

    this.installListeners();
    this.validate();
  };

  UnanetExtension.prototype = {

    getByIdentifier: function(kind, identifier) {
      return safari.extension[kind].filter(function(thing) {
            return thing.identifier == identifier;
      })[0];
    },

    commands: {

      dispatch: function(event) {
        var identifierToAction = {
              'com.nearinfinity.unanet.button': 'open'
            }, 
            action = identifierToAction[event.command];

        if (action && this.commands[action]) {
          this.commands[action].call(this, event);
        }
      },

      open: function(e) {
        if (!this.validate()) {
          this.button.showPopover();
          return;
        }

        var win = e.target.browserWindow,
            baseUrl = safari.extension.settings.url,
            url = baseUrl;

        url = url.replace(/\/\s*$/, '');

        if (this.timesheetId) {
          url = url + "/action/time/preedit?timesheetkey=" + this.timesheetId;
        }

        win.openTab();
        var newTab = win.tabs[win.tabs.length - 1];

        newTab.addEventListener("message", function(event) {
          if (event.name == 'credientialsNeeded') {
            var loadingUrl = event.message.url;
            if (loadingUrl.match(new RegExp("^" + baseUrl))) {
              event.target.page.dispatchMessage('credentials', this.getCredentials());
            }
          } else if (event.name == 'recheck') {
            this.check();
          }
        }.bind(this), false);

        newTab.url = url;
      }
    },

    validate: function() {
      var valid = true,
          settings = safari.extension.settings;

      if (!settings.url || !settings.url.match(/^https?:\/\/.*$/))
        valid = false;

      this.button.popover = valid ? null : this.popover;
      this.button.badge = valid ? 0 : 1;

      if (valid && this.timesheetErrors && this.timesheetErrors.length) {
        var total = this.timesheetErrors.reduce(function(totalErrors, te) {
          return totalErrors + (te.errors ? te.errors.length : 0);
        }, 0);
        this.button.badge += total;
        this.button.toolTip = total +  " errors";
      }

      return valid;
    },

    installListeners: function() {
      var app = safari.application,
          ext = safari.extension;

      app.addEventListener("command", 
          this.commands.dispatch.bind(this), false);

      ext.settings.addEventListener("change",
          this.settingsChanged.bind(this), false);
    },

    settingsChanged: function() {
      this.check();
    },


    getCredentials: function() {
      var settings = safari.extension.settings,
          secureSettings = safari.extension.secureSettings;

      return {
        urlBase: settings.url,
        username: secureSettings.getItem('username'),
        password: secureSettings.getItem('password')
      };
    },

    check: function () {
      if (!this.validate()) return;

      var callback = function(err, timesheetErrors) {
            if (err) {
              alert(err);
            } else {
              this.timesheetErrors = timesheetErrors;
              this.validate();
            }
          }.bind(this),
          opts = this.getCredentials();

      var allTimesheetErrors = [];
      function checkTimesheet(timesheet, callback) {
          var endOfToday = new Date();
          endOfToday.setHours(23, 59, 59, 999);
          var startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          var endOfWorkDay = new Date();

          var end = safari.extension.settings.ends;
          if (end && end.length) {
            var m = end.match(/\s*(\d+)(?:[:](\d+))?\s*(?:[pa]m)?/),
                hours = +m[1],
                minutes = m[2] ? +m[2] : 0;

            if (hours < 10) hours += 12;

            endOfWorkDay.setHours(hours, minutes, 0, 0);
          } else {
            endOfWorkDay.setHours(17, 0, 0, 0);
          }

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
                message: 'No time filled in for ' + columnDate.getMonth() + "/" + columnDate.getDate()
              });
            }
          });
          return callback(null, errors);
        }

      var self = this;

      return getActiveTimesheets(opts, function(err, timesheets) {
        if (err) {
          return callback(err);
        }
        return async.forEach(timesheets, function(timesheet, callback) {
          self.timesheetId = timesheet.id;
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
  };

  var client = new UnanetExtension();
  var MINUTES = 60 * 1000;

  setInterval(function() {
    client.check();
  }, 10 * MINUTES);

  client.check();

})();
