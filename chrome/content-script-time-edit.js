'use strict';

(function() {
  $(function() {
    $('#button_save-button').click(function() {
      chrome.extension.sendMessage({ action: 'recheck' }, function(res) {
        console.log(res);
      });
    });
  });
})();