(function(){
  'use strict';
  const developerMode = location.hostname === "localhost";
  const dataUrl = developerMode ? "data.json" : "https://fox2code.com/w2054/data.json";
  const formatterHelper = new Intl.DateTimeFormat('en-GB', {
    timeZone: "Etc/GMT+2",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  });
  function getWeekNumber(date) {
    const parts = formatterHelper.formatToParts(date);
    const year = parseInt(parts.find(p => p.type === 'year').value);
    const month = parseInt(parts.find(p => p.type === 'month').value) - 1;
    const day = parseInt(parts.find(p => p.type === 'day').value);

    const d = new Date(Date.UTC(year, month, day));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }
  const weekOfYear = getWeekNumber(Date.now());
  const armsRacesTypes = [
    "Hero Advancement",
    "Base Building",
    "Unit Progression",
    "Tech Research",
    "Drone Boost",
    "Shiny Tasks",
  ];
  const weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const armsRaceTimes = [
    "0", "4", "8", "12", "16", "20"
  ];
  window.openArmsRacePopup = function() {
    const armsRacePopup = new W2054Popup();
    armsRacePopup.form("action.php");
    armsRacePopup.constant("csrf-token", csrfToken);
    armsRacePopup.constant("action-type", "arms-race-update");
    armsRacePopup.constant("weekOfYear", weekOfYear);
    let weekdayNumber = 1;
    for (const weekday of weekdays) {
      armsRacePopup.checkNewLine();
      armsRacePopup.text("> " + weekday + " (Day " + weekdayNumber + ")");
      armsRacePopup.indexSelect("a" + weekday + "0", "0:00 -> ", armsRacesTypes);
      armsRacePopup.indexSelect("a" + weekday + "4", " | 4:00 -> ", armsRacesTypes);
      armsRacePopup.indexSelect("a" + weekday + "8", " | 8:00 -> ", armsRacesTypes);
      armsRacePopup.checkNewLine();
      armsRacePopup.indexSelect("a" + weekday + "12", "12:00 -> ", armsRacesTypes);
      armsRacePopup.indexSelect("a" + weekday + "16", " | 16:00 -> ", armsRacesTypes);
      armsRacePopup.indexSelect("a" + weekday + "20", " | 20:00 -> ", armsRacesTypes);
      weekdayNumber++;
    }
    armsRacePopup.checkNewLine();
    armsRacePopup.addFormCopyPasteButtons();
    armsRacePopup.checkNewLine();
    armsRacePopup.text("Note: The displayed times are in GMT+2");
    armsRacePopup.open();
  }
  window.openMakeNewsPopup = function() {
    const newsPopup = new W2054Popup();
    newsPopup.form("action.php");
    newsPopup.constant("csrf-token", csrfToken);
    newsPopup.constant("action-type", "publish-news");
    newsPopup.markdownInput("content", "News content", "# My title\n\nSome text here. :fox:");
    newsPopup.textInput("keywords", "Keywords (for search, comma separated)");
    newsPopup.checkNewLine();
    newsPopup.text("Author: " + window.adminUser);
    newsPopup.open();
  }
  window.openLockdownPopup = function () {
    const lockdownPopup = new W2054Popup();
    lockdownPopup.form("action.php");
    lockdownPopup.text("Are you sure you want to lock down the admin panel?");
    lockdownPopup.newline();
    lockdownPopup.markdown("__/!\\\\__ This action cannot be undone. __/!\\\\__");
    lockdownPopup.constant("csrf-token", window.csrfToken);
    lockdownPopup.constant("action-type", "lockdown");
    lockdownPopup.open();
  }
  window.w2054InitializeNews(true);
})();
