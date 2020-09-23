// Custom Imports
const quote = require("./quotes");
const storage = require("./storage");
const weather = require("./weather");
const tools = require("./tools");
const dk = require("./dk");

const reload = () => {
  tools.activateSpinner();

  let reloadTimerCount = 3;
  const reloadTimer = () => {
    reloadTimerCount--;
    if (reloadTimerCount == 0) {
      tools.disableSpinner();
    }
  };

  dk.loadHomework(reloadTimer);
  dk.loadConferences(reloadTimer);
  weather.loadWeather(reloadTimer);
};

quote.loadQuote();
storage.loadStorage(reload);

setInterval(reload, 5 * 60 * 1000);
setInterval(tools.updateClock, 1000);
tools.updateClock();

window.addEventListener("keyup", (event) => {
  if (event.code == "F5") reload();
});
document.getElementById("refresh").onclick = reload;
