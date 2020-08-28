const request = require("request");
const cheerio = require("cheerio");
const { shell } = require("electron");
const storage = require("electron-json-storage");
const path = require("path");
const fileSystem = require("fs");

// Quote of the day
request("http://quotes.rest/qod", function (error, response) {
  if (error) throw error;

  try {
    let data = JSON.parse(response.body);

    if (data.error) {
      console.log(data.error);
      return;
    }

    let quote = data.contents.quotes[0].quote;
    let author = data.contents.quotes[0].author;

    document.getElementById("qod").innerHTML = quote;
    document.getElementById("qod-author").innerHTML = author;
  } catch (error) {
    console.log(error);
  }
});

//#region Storage

let latitude = "",
  longitude = "",
  openWeatherKey = "",
  dkUser = "",
  dkPassword = "",
  userName = "";

const defaultStorage = {
  coordinates: {
    latitude: "",
    longitude: "",
  },
  dk: {
    user: "",
    password: "",
  },
  openWeatherMapKey: "",
  userName: "",
  backgroundImage: "",
};

// Load from the storage
storage.get("userData", function (error, data) {
  if (error) throw error;

  // If the storage is empty, prompt the user to fill it and quit
  if (
    Object.keys(data).length == 0 ||
    JSON.stringify(defaultStorage) == JSON.stringify(data)
  ) {
    storage.set("userData", defaultStorage, function () {
      shell
        .openExternal(storage.getDataPath() + "/userData.json")
        .then(function () {
          quit();
        });
    });
  } else {
    // Storage is fine, start the application
    latitude = data.coordinates.latitude;
    longitude = data.coordinates.longitude;
    dkUser = data.dk.user;
    dkPassword = data.dk.password;
    openWeatherKey = data.openWeatherMapKey;
    userName = data.userName;

    // If the background image exists, copy it over and set the new path. Otherwise the default image will be used
    let backgroundImage = data.backgroundImage;
    let backgroundImageStorage = path
      .join(storage.getDataPath(), "background.png")
      .replace(/\\/g, "\\\\");
    if (backgroundImage) {
      fileSystem.copyFile(backgroundImage, backgroundImageStorage, function () {
        document.body.style.backgroundImage = `url('${backgroundImageStorage}')`;
      });
    }

    storage.set("userData_backup", data);

    loadWeather();
    loadHomework();
  }
});

//#endregion Storage

//#region Weather

let openWeatherURL = function () {
  return `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&appid=${openWeatherKey}&units=metric&lang=de`;
};

function loadWeather() {
  activateSpinner();

  request(openWeatherURL(), function (error, response) {
    if (error) throw error;

    // Load the weather data from the response JSON

    let weatherData = JSON.parse(response.body);

    let nextHourData = weatherData.hourly[0];

    let weatherTimestamp = new Date(nextHourData.dt * 1000);
    let weatherTimestampString = `${`0${weatherTimestamp.getDate()}`.substr(
      -2
    )}.${`0${weatherTimestamp.getMonth() + 1}`.substr(
      -2
    )}. ${`0${weatherTimestamp.getHours()}`.substr(
      -2
    )}:${`0${weatherTimestamp.getMinutes()}`.substr(-2)}`;

    let resultWeatherData = {
      cloudPercentage: `${parseInt(nextHourData.clouds)}%`,
      feelsLike: `${parseInt(nextHourData.feels_like)}°C`,
      humidity: `${parseInt(nextHourData.humidity)}%`,
      temperature: `${parseInt(nextHourData.temp)}°C`,
      description: nextHourData.weather[0].description,
      icon: path.join(
        __dirname,
        "assets",
        "weather_icons",
        `${nextHourData.weather[0].icon}@2x.png`
      ),
      timestamp: weatherTimestampString,
    };

    // Display the weather data
    updateWeatherData(resultWeatherData);
  });

  function updateWeatherData(weatherData) {
    document.getElementById("clouds").innerHTML = weatherData.cloudPercentage;
    document.getElementById("feelsLikeTemperature").innerHTML =
      weatherData.feelsLike;
    document.getElementById("humidity").innerHTML = weatherData.humidity;
    document.getElementById("temperature").innerHTML = weatherData.temperature;
    document.getElementById("description").innerHTML = weatherData.description;
    document.getElementById("weatherIcon").src = weatherData.icon;
    document.getElementById("timestamp").innerHTML = weatherData.timestamp;
  }
}

//#endregion Weather

//#region Homework

let dkUUID;
let dkLoginUrl = function () {
  return `https://digitalesklassenbuch.alstergym.logoip.de/login/register?user=${dkUser}&password=${dkPassword}`;
};

let dkHomeworkUrl = function () {
  return `https://digitalesklassenbuch.alstergym.logoip.de/hausaufgaben/index?user=${dkUser}&uuid=${dkUUID}`;
};

let dkHomeworkDeleteUrl = function (homeworkID) {
  return `https://digitalesklassenbuch.alstergym.logoip.de/hausaufgaben/changeStatus?user=${dkUser}&uuid=${dkUUID}&homeworkID=${homeworkID}&status=true&_action_changeStatus=Abschicken`;
};

function loadHomework() {
  request(dkLoginUrl(), function (error, response) {
    if (error) {
      throw error;
    }

    $ = cheerio.load(response.body);

    dkUUID = $("#uuid").val();
    loadConferences();

    request(dkHomeworkUrl(), function (error, response) {
      if (error) {
        throw error;
      }

      $ = cheerio.load(response.body);

      let homeworkCells = $("table tbody tr");

      let allHomework = [];

      // Iterate over all homework rows
      for (let i = 0; i < homeworkCells.length; i++) {
        let homeworkContent = [];
        let homeworkID;

        let counter = 0;
        for (let homeworkCellChildren of homeworkCells[i].children) {
          if (homeworkCellChildren.type != "tag") continue;

          // Load the data from the table cell
          let homeworkCellData;
          for (let homeworkCellChildrenChildren of homeworkCellChildren.children) {
            if (homeworkCellChildrenChildren.type == "tag") {
              if (
                homeworkCellChildrenChildren.children[0].parent.name == "pre"
              ) {
                homeworkID =
                  homeworkCellChildrenChildren.children[0].parent.attribs.id;
              }

              homeworkCellData = homeworkCellChildrenChildren.children[0].data;
              break;
            }
          }

          // Push everything into an array
          homeworkContent.push(homeworkCellData);

          // We only need the first 4 cells
          counter++;
          if (counter >= 4) {
            break;
          }
        }

        // Insert the ID at position 0
        homeworkContent.unshift(homeworkID);

        allHomework.push(homeworkContent);
      }

      let homeworkTable = document.getElementById("homework");
      homeworkTable.innerHTML = "";

      // Iterate over the homework array and display it
      let homeworkCounter = 0;
      for (let homework of allHomework) {
        // Don't display the ID
        if (homework.length > 0 && homework[0] == undefined) {
          continue;
        }
        homeworkCounter++;

        let homeworkRow = document.createElement("tr");
        homeworkRow.className = "homework-entry";

        // Put the data in a table
        let index = 0;
        for (let homeworkEntry of homework) {
          if (index++ == 0) continue;

          let homeworkCell = document.createElement("td");
          homeworkCell.innerHTML = homeworkEntry.replace(/\n/g, "<br>");
          homeworkRow.appendChild(homeworkCell);
        }

        // Add a delete button with the ID
        let deleteButtonCell = document.createElement("td");
        let deleteButton = document.createElement("button");
        deleteButton.setAttribute("data-id", homework[0]);

        deleteButton.onclick = function () {
          deleteHomework(this.getAttribute("data-id"));
        };
        deleteButtonCell.appendChild(deleteButton);
        homeworkRow.appendChild(deleteButtonCell);

        homeworkTable.appendChild(homeworkRow);
      }

      // If there is no homework, let the user know
      if (homeworkCounter == 0) {
        homeworkTable.innerHTML +=
          "<p class='no-homework'>Du hast keine Hausaufgaben auf</p>";
      }
    });
  });
}

function deleteHomework(id) {
  request(dkHomeworkDeleteUrl(id), function (error, response) {
    loadHomework();
    if (error) throw error;
  });
}

//#endregion Homework

//#region Conferences

let dkConferencesUrl = function (uuid) {
  return `https://digitalesklassenbuch.alstergym.logoip.de/konferenzen/index?user=${dkUser}&uuid=${uuid}`;
};

let dkConferenceJoinUrl = function (uuid, conferenceID) {
  return `https://digitalesklassenbuch.alstergym.logoip.de/konferenzen/join?user=${dkUser}&uuid=${uuid}&id=${conferenceID}&_action_join=submit`;
};

function loadConferences() {
  request(dkConferencesUrl(dkUUID), function (error, response) {
    if (error) throw error;

    $ = cheerio.load(response.body);

    let allConferences = [];
    let tomorrowConferences = [];

    // Go through all the conferences
    $(".calendar-cell-active")
      .get(0)
      .children.forEach(function (element) {
        // Only div tags contain conference data
        if (element.name != "div") return;

        let conference = [];

        // Extract the conference ID from the onclick attribute
        let conferenceID = element.attribs.onclick.substring(
          6,
          element.attribs.onclick.length - 3
        );
        conference.push(parseInt(conferenceID));

        // Get the data from all the children and add it to the array
        element.children.forEach(function (element, index) {
          if (index == 1) return; // Index == 1 is the end time (Which I don't need)

          conference.push(element.children[0].data);
        });

        allConferences.push(conference);
      });

    // If after 18pm or no conference today, also show tomorrows conferences
    if (new Date().getHours() >= 18 || allConferences.length == 0) {
      let tomorrowIndex = -1;

      // Find the div that contains tomorrows conferences
      $(".day.calendar-cell-active")
        .parent()
        .parent()
        .parent()
        .children()
        .each(function (index, item) {
          if (
            (item,
            item.children[0].attribs.class.includes("calendar-cell-active"))
          ) {
            tomorrowIndex = index + 1;
          }
        });

      // Go through the children of that div to gather the data (Works like with todays conferences)
      $(".day.calendar-cell-active")
        .parent()
        .parent()
        .parent()
        .children()
        .get(tomorrowIndex)
        .children[0].children.forEach(function (element) {
          if (element.name != "div") return;

          let conference = [];

          let conferenceID = element.attribs.onclick.substring(
            6,
            element.attribs.onclick.length - 3
          );
          conference.push(parseInt(conferenceID));

          element.children.forEach(function (element, index) {
            if (index == 1) return;

            conference.push(element.children[0].data);
          });

          tomorrowConferences.push(conference);
        });
    }

    // Clear the current conference container
    let conferencesContainer = document.getElementById("conferences-container");
    conferencesContainer.innerHTML = "";

    // Go through all conferences to display them
    allConferences.forEach(function (conference) {
      // Create a parent div
      let conferenceElement = document.createElement("div");
      conferenceElement.className = `conference${
        isNaN(conference[0]) ? "" : " active"
      }`;

      // If the conference is running, create a button to join
      if (!isNaN(conference[0])) {
        conferenceElement.setAttribute("data-id", conference[0]);
        conferenceElement.onclick = function () {
          joinConference(this.getAttribute("data-id"));
        };
      }

      // Calculate how many hours until the conference starts
      let conferenceMinuteOfDay =
        60 * parseInt(conference[1].split(":")[0]) +
        parseInt(conference[1].split(":")[1]);

      let time = new Date();
      let currentMinuteOfDay = 60 * time.getHours() + time.getMinutes();

      let hourDiff = Math.floor(
        (conferenceMinuteOfDay - currentMinuteOfDay) / 60
      );
      if (hourDiff < 0) hourDiff++;

      let hourDiffString =
        hourDiff == 0
          ? "Jetzt"
          : hourDiff < 0
          ? `Vor ${Math.abs(hourDiff)} Stunden`
          : `In ${Math.abs(hourDiff)} Stunden`;

      // Create elements for the rest of the data
      let startTimeElement = document.createElement("span");
      startTimeElement.className = "starttime";
      startTimeElement.innerHTML = `${hourDiffString} - ${conference[1]}`;

      let descriptionElement = document.createElement("span");
      descriptionElement.className = "description";
      descriptionElement.innerHTML = conference[2];

      conferenceElement.appendChild(startTimeElement);
      conferenceElement.appendChild(descriptionElement);

      conferencesContainer.appendChild(conferenceElement);
    });

    // Show a seperator for tomorrows conferences
    if (tomorrowConferences.length > 0) {
      conferencesContainer.innerHTML +=
        "<p class='tomorrow-conferences'>Morgen</p>";
    }

    // Just like todays conferences
    tomorrowConferences.forEach(function (conference) {
      let conferenceElement = document.createElement("div");
      conferenceElement.className = `conference${
        isNaN(conference[0]) ? "" : " active"
      }`;

      if (!isNaN(conference[0])) {
        conferenceElement.setAttribute("data-id", conference[0]);
        conferenceElement.onclick = function () {
          joinConference(this.getAttribute("data-id"));
        };
      }

      let startTimeElement = document.createElement("span");
      startTimeElement.className = "starttime";
      startTimeElement.innerHTML = conference[1];

      let descriptionElement = document.createElement("span");
      descriptionElement.className = "description";
      descriptionElement.innerHTML = conference[2];

      conferenceElement.appendChild(startTimeElement);
      conferenceElement.appendChild(descriptionElement);

      conferencesContainer.appendChild(conferenceElement);
    });

    disableSpinner();
  });
}

function joinConference(id) {
  shell.openExternal(dkConferenceJoinUrl(dkUUID, id));
}

//#endregion Conferences

function quit() {
  const remote = require("electron").remote;
  let w = remote.getCurrentWindow();
  w.close();
}

function reload() {
  loadWeather();
  loadHomework();
}

function updateClock() {
  let date = new Date();
  document.getElementById(
    "currentTime"
  ).innerHTML = `${`0${date.getHours()}`.substr(
    -2
  )}:${`0${date.getMinutes()}`.substr(-2)}`;

  let typeOfDay =
    date.getHours() < 5
      ? "Gute Nacht"
      : date.getHours() < 12
      ? "Guten Morgen"
      : date.getHours() < 18
      ? "Guten Tag"
      : date.getHours() < 22
      ? "Guten Abend"
      : "Gute Nacht";
  document.getElementById("header").innerHTML = `${typeOfDay}, ${userName}!`;
}

function activateSpinner() {
  document.getElementById("refresh").className = "refresh active";
}

function disableSpinner() {
  document.getElementById("refresh").className = "refresh";
}

window.addEventListener("keyup", function (event) {
  if (event.code == "F5") reload();
});

document.getElementById("refresh").onclick = reload;

setInterval(reload, 5 * 60 * 1000);
setInterval(updateClock, 1000);
updateClock();
