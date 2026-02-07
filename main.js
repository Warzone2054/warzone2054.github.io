(function () {
  'use strict';
  const dateFormatLocal = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const dateFormatServer = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Etc/GMT+2",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  var localTimeElement = document.getElementById('local-time');
  var serverTimeElement = document.getElementById('server-time');
  setInterval(function () {
    var timeNow = Date.now();
    localTimeElement.innerText = dateFormatLocal.format(timeNow);
    serverTimeElement.innerText = dateFormatServer.format(timeNow);
  }, 100);
})()
