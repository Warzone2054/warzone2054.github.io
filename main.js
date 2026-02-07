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
  const weekDayFormatServer = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Etc/GMT+2",
    weekday: "long",
  });
  const functionDictionary = {};
  const localTimeElement = document.getElementById('local-time');
  const serverTimeElement = document.getElementById('server-time');
  const todayActionsElement = document.getElementById('today-actions');
  let cacheHash = localStorage.getItem("cacheHash") || "";
  let oldWeekDay = "";
  setInterval(function () {
    const timeNow = Date.now();
    localTimeElement.innerText = dateFormatLocal.format(timeNow);
    const newServerText = dateFormatServer.format(timeNow);
    const oldServerText = serverTimeElement.innerText;
    if (newServerText !== oldServerText) {
      serverTimeElement.innerText = dateFormatServer.format(timeNow);
      functionDictionary.updateSeconds()
    }
  }, 100);
  functionDictionary.updateSeconds = function () {
    const weekDay = weekDayFormatServer.format(Date.now());
    if (oldWeekDay !== weekDay) {
      oldWeekDay = weekDay;
      functionDictionary.updateTasks(weekDay);
    }
  }
  functionDictionary.updateTasks = function (weekDay) {
    let tasksList = [];
    tasksList.push("Do daily tasks until you get the cosmetic chest!");
    functionDictionary.appendVersusEventTasks(tasksList, weekDay);

    const expectedHash = weekDay + tasksList.hash + "l" + tasksList.length;
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
        tasksList.push("Gather resource so it complete on monday!");
        break;
    }
  }
  window.onTaskClickedListener = functionDictionary.onTaskClickedListener;
  functionDictionary.updateSeconds()
})()
