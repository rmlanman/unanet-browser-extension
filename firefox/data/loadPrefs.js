(function() {
  self.port.on('addonAttach', function(prefs) {
    $.extend(localStorage, prefs);
  });
  self.port.on('prefChange', function(name, value) {
    localStorage[name] = value;
  });
})();