(function () {
  'use strict';
  const developerMode = location.hostname === "localhost";
  const dataUrl = developerMode ? "data.json" : "https://fox2code.com/w2054/data.json";
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
  const weekDayFormatServer = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Etc/GMT+2",
    weekday: "long",
  });
  const hourDayFormatServer = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Etc/GMT+2",
    hour: "2-digit",
  });
  const formatterHelper = new Intl.DateTimeFormat('en-GB', {
    timeZone: "Etc/GMT+2",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short'
  });
  function formatDateDifferentialTimer(startDate, endDate) {
    const diffMs = endDate - startDate;
    let totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }
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
  const functionDictionary = {};
  const armsRacesTypes = [
    "Hero Advancement",
    "Base Building",
    "Unit Progression",
    "Tech Research",
    "Drone Boost",
    "Shiny Tasks",
  ];
  const localTimeElement = document.getElementById('local-time');
  const serverTimeElement = document.getElementById('server-time');
  const todayActionsElement = document.getElementById('today-actions');
  const armsRaceCurrent = document.getElementById('arms-race-current');
  const armsRaceNext = document.getElementById('arms-race-next');
  const armsRaceTimer = document.getElementById('arms-race-timer');
  const weekOfYear = getWeekNumber(Date.now());
  const armsRaceEntryCount = 42; // (24 / 4) * 7
  let cacheHash = localStorage.getItem("cacheHash") || "";
  let oldWeekDay = "";
  let oldHourTime = "";
  let nextArmsRace = Date.now();
  setInterval(function () {
    const timeNow = Date.now();
    localTimeElement.innerText = dateFormatLocal.format(timeNow);
    const newServerText = dateFormatServer.format(timeNow);
    const oldServerText = serverTimeElement.innerText;
    if (newServerText !== oldServerText) {
      serverTimeElement.innerText = dateFormatServer.format(timeNow);
      functionDictionary.updateSeconds()
    }
    armsRaceTimer.innerText = formatDateDifferentialTimer(timeNow, nextArmsRace);
  }, 100);
  functionDictionary.updateSeconds = function () {
    const weekDay = weekDayFormatServer.format(Date.now());
    if (oldWeekDay !== weekDay) {
      oldWeekDay = weekDay;
      functionDictionary.updateTasks(weekDay);
    }
    const hourTime = hourDayFormatServer.format(Date.now());
    if (oldHourTime !== hourTime) {
      oldHourTime = hourTime;
      functionDictionary.updateArmsRace();
    }
  }
  functionDictionary.updateTasks = function (weekDay) {
    let tasksList = [];
    tasksList.push("Do daily tasks until you get the cosmetic chest!");
    functionDictionary.appendVersusEventTasks(tasksList, weekDay);

    const expectedHash = weekDay + tasksList.hash + "l" + tasksList.length + "w" + weekOfYear;
    if (cacheHash !== expectedHash) {
      cacheHash = expectedHash;
      localStorage.clear();
      localStorage.setItem("cacheHash", cacheHash);
    }

    const tasksListDone = [];
    const tasksListWaiting = [];
    for (let i = 0; i < tasksList.length; i++) {
      const task = tasksList[i];
      const hashId = task.hash + "l" + task.length;
      if (localStorage.getItem(hashId) === "true") {
        tasksListDone.push(task);
      } else {
        tasksListWaiting.push(task);
      }
    }
    todayActionsElement.innerHTML = tasksListWaiting.map(function (task) {
      const hashId = task.hash + "l" + task.length;

      return "<input type='checkbox' id='" + hashId + "' name='"+ task +
        "' onclick='onTaskClickedListener()'><label for='" + hashId + "' onclick='onTaskClickedListener()'>" + task + "</label>";
    }).join("</br>\n") + "</br>\n" + tasksListDone.map(function (task) {
      const hashId = task.hash + "l" + task.length;

      return "<input type='checkbox' id='" + hashId + "' name='"+ task +
        "' onclick='onTaskClickedListener()' checked><label for='" + hashId + "' onclick='onTaskClickedListener()'>" + task + "</label>";
    }).join("</br>\n");
    console.log(tasksList);
  }
  functionDictionary.onTaskClickedListener = function () {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(function (checkbox) {
      const hashId = checkbox.id;
      localStorage.setItem(hashId, checkbox.checked);
    });
    const weekDay = weekDayFormatServer.format(Date.now());
    functionDictionary.updateTasks(weekDay);
  }
  functionDictionary.appendVersusEventTasks = function (tasksList, weekday) {
    switch (weekday) {
      case "Monday":
        tasksList.push("Complete radar tasks!");
        tasksList.push("Upgrade your drone!");
        tasksList.push("Gather resources!");
        break;
      case "Tuesday":
        tasksList.push("Save radar tasks for Wednesday");
        tasksList.push("Unwrap buildings!");
        tasksList.push("Recruit survivors!");
        tasksList.push("Dispatch UR Truck and secret tasks!");
        break;
      case "Wednesday":
        tasksList.push("Complete radar tasks!");
        tasksList.push("Open drone component chests!");
        tasksList.push("Use valor badges!");
        break;
      case "Thursday":
        tasksList.push("Save radar tasks for Friday");
        tasksList.push("Recruit heroes!");
        tasksList.push("Use hero shards and skill medals!");
        break;
      case "Friday":
        tasksList.push("Complete radar tasks!");
        tasksList.push("Train units!");
        tasksList.push("Put on a shield for saturday!");
        break;
      case "Saturday":
        tasksList.push("Dispatch UR Truck and secret tasks!");
        break;
      case "Sunday":
        tasksList.push("Save radar tasks for Monday");
        tasksList.push("Gather resources so it complete on monday!");
        break;
    }
  }
  functionDictionary.updateArmsRace = function () {
    const offsetHours = 18;
    const timeNow = Date.now();
    const hoursSinceLaunch = Math.floor((timeNow - Date.UTC(2026)) / (1000 * 60 * 60)) + offsetHours;
    if (armsRaceCurrent != null) {
      const remoteData = functionDictionary.remoteData;
      if (remoteData === undefined || remoteData === null) {
        armsRaceCurrent.innerText = "Loading...";
        armsRaceNext.innerText = "Loading...";
      } else if (remoteData['weekOfYear'] === weekOfYear) {
        const armsRaces = remoteData['armsRace']
        if (armsRaces.length !== armsRaceEntryCount) {
          armsRaceCurrent.innerText = "Data error!";
          armsRaceNext.innerText = "Data error!";
        } else {
          const armsRaceIndex = (Math.floor(hoursSinceLaunch / 4) + 13) % armsRaces.length;
          console.log(hoursSinceLaunch, armsRaceIndex);
          armsRaceCurrent.innerText = armsRacesTypes[armsRaces[armsRaceIndex]];
          const armsRaceIndexNext = armsRaceIndex + 1;
          armsRaceNext.innerText = armsRaceIndexNext === armsRaceEntryCount ?
            "???" : armsRacesTypes[armsRaces[armsRaceIndexNext]];
        }
      } else {
        armsRaceCurrent.innerText = "???";
        armsRaceNext.innerText = "???";
      }
    }
    nextArmsRace = Date.UTC(2026) +
      (((hoursSinceLaunch - offsetHours) + (4 - (hoursSinceLaunch % 4))) * (1000 * 60 * 60))
    if (developerMode) {
      console.log(oldHourTime + " -> " + hoursSinceLaunch + " -> " + nextArmsRace.toLocaleString());
    }
  }
  async function fetchData() {
    const response = await fetch(dataUrl);
    functionDictionary.remoteData = await response.json();
    functionDictionary.updateTasks(weekDayFormatServer.format(Date.now()));
    functionDictionary.updateArmsRace();
  }

  if (developerMode) {
    window.funtionDictionary = functionDictionary;
    console.log("Developer mode enabled!");
    console.log("Week of year: " + weekOfYear);
  }

  window.onTaskClickedListener = functionDictionary.onTaskClickedListener;
  functionDictionary.updateSeconds();
  window.w2054InitializeNews(false);
  fetchData().catch(function (error) {
    console.error("Failed to fetch data:", error);
  });
})()
