// Node Imports
const request = require("request");
const cheerio = require("cheerio");
const { shell } = require("electron");

// Custom Imports
const storage = require("./storage");

let dkUUID;

const dkLoginUrl = () =>
  `https://digitalesklassenbuch.alstergym.logoip.de/login/register?user=${storage.dkUser()}&password=${storage.dkPassword()}`;

const dkHomeworkUrl = () =>
  `https://digitalesklassenbuch.alstergym.logoip.de/hausaufgaben/index?user=${storage.dkUser()}&uuid=${dkUUID}`;

const dkHomeworkDeleteUrl = (homeworkID) =>
  `https://digitalesklassenbuch.alstergym.logoip.de/hausaufgaben/changeStatus?user=${storage.dkUser()}&uuid=${dkUUID}&homeworkID=${homeworkID}&status=true&_action_changeStatus=Abschicken`;

const login = (callback) => {
  request(dkLoginUrl(), (error, response) => {
    if (error) throw error;

    $ = cheerio.load(response.body);
    dkUUID = $("#uuid").val();

    if (callback) callback();
  });
};

const loadHomework = (homeworkCallback) => {
  login(() => {
    request(dkHomeworkUrl(), (error, response) => {
      if (error) throw error;

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

        deleteButton.onclick = () => {
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

      if (homeworkCallback) homeworkCallback();
    });
  });
};

const deleteHomework = (id) =>
  request(dkHomeworkDeleteUrl(id), (error) => {
    loadHomework();
    if (error) throw error;
  });

//#endregion Homework

//#region Conferences

const dkConferencesUrl = () =>
  `https://digitalesklassenbuch.alstergym.logoip.de/konferenzen/index?user=${storage.dkUser()}&uuid=${dkUUID}`;

const dkConferenceJoinUrl = (conferenceID) =>
  `https://digitalesklassenbuch.alstergym.logoip.de/konferenzen/join?user=${storage.dkUser()}&uuid=${dkUUID}&id=${conferenceID}&_action_join=submit`;

const loadConferences = (conferencesCallback) => {
  login(() => {
    request(dkConferencesUrl(), (error, response) => {
      if (error) throw error;

      $ = cheerio.load(response.body);

      let allConferences = [];
      let tomorrowConferences = [];

      // Go through all the conferences
      $(".calendar-cell-active")
        .get(0)
        .children.forEach((element) => {
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
          element.children.forEach((element, index) => {
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
          .each((index, item) => {
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
          .children[0].children.forEach((element) => {
            if (element.name != "div") return;

            let conference = [];

            let conferenceID = element.attribs.onclick.substring(
              6,
              element.attribs.onclick.length - 3
            );
            conference.push(parseInt(conferenceID));

            element.children.forEach((element, index) => {
              if (index == 1) return;

              conference.push(element.children[0].data);
            });

            tomorrowConferences.push(conference);
          });
      }

      // Clear the current conference container
      let conferencesContainer = document.getElementById(
        "conferences-container"
      );
      conferencesContainer.innerHTML = "";

      if (allConferences.length == 0) {
        conferencesContainer.innerHTML =
          "<p class='no-homework'>Du hast keine anstehenden Konferenzen</p>";
      }

      // Go through all conferences to display them
      allConferences.forEach((conference) => {
        // Create a parent div
        let conferenceElement = document.createElement("div");
        conferenceElement.className = `conference${
          isNaN(conference[0]) ? "" : " active"
        }`;

        // If the conference is running, create a button to join
        if (!isNaN(conference[0])) {
          conferenceElement.setAttribute("data-id", conference[0]);
          conferenceElement.onclick = () =>
            joinConference(this.getAttribute("data-id"));
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
      tomorrowConferences.forEach((conference) => {
        let conferenceElement = document.createElement("div");
        conferenceElement.className = `conference${
          isNaN(conference[0]) ? "" : " active"
        }`;

        if (!isNaN(conference[0])) {
          conferenceElement.setAttribute("data-id", conference[0]);
          conferenceElement.onclick = () =>
            joinConference(this.getAttribute("data-id"));
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

      if (conferencesCallback) conferencesCallback();
    });
  });
};

const joinConference = (id) => shell.openExternal(dkConferenceJoinUrl(id));

exports.loadHomework = loadHomework;
exports.loadConferences = loadConferences;
