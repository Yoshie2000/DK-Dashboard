// Custom Imports
const storage = require("./storage");

const activateSpinner = () =>
  (document.getElementById("refresh").className = "refresh active");

const disableSpinner = () =>
  (document.getElementById("refresh").className = "refresh");

const updateClock = () => {
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
  document.getElementById(
    "header"
  ).innerHTML = `${typeOfDay}, ${storage.userName()}!`;
};

exports.activateSpinner = activateSpinner;
exports.disableSpinner = disableSpinner;
exports.updateClock = updateClock;