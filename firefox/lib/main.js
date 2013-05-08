'use strict';

var pageMod = require("page-mod");
var data = require("self").data;

pageMod.PageMod({
  include: ["https://timecards.nearinfinity.com/action/home","https://timecards.altamiracorp.com/action/home"],
  contentScriptFile: [data.url("unanet.js"),
                      data.url("async.min.js"),
                      data.url("jquery-1.8.3.min.js"),
                      data.url("content-script-home.js")]
});
