'use strict';

var pageMod = require("page-mod");
var self = require("self");

pageMod.PageMod({
  include: "https://timecards.nearinfinity.com/action/home",
  contentScriptFile: [self.data.url("unanet.js"),
                      self.data.url("jquery-1.8.3.min.js"),
                      self.data.url("content-script-home.js")]
});