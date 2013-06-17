'use strict';

var pageMod = require("page-mod");
var data = require("self").data;
var prefSet = require("simple-prefs");

pageMod.PageMod({
  include: ["https://timecards.nearinfinity.com/action/home","https://timecards.altamiracorp.com/action/home"],
  contentScriptFile: [data.url("unanet.js"),
                      data.url("async.min.js"),
                      data.url("jquery-1.8.3.min.js"),
                      data.url("loadPrefs.js"),
                      data.url("content-script-home.js")],
    onAttach: function(worker) {
      worker.port.emit('addonAttach', {
        trainingBudget: prefSet.prefs.trainingBudget,
        bookBudget: prefSet.prefs.bookBudget
      });
      function onPrefChange(name) {
        worker.port.emit('prefChange', name, prefSet.prefs[name]);
      }

      prefSet.on("trainingBudget", onPrefChange);
      prefSet.on("bookBudget", onPrefChange);
    }
});
