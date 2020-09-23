// Node Imports
const { shell } = require("electron");
const storage = require("electron-json-storage");
const path = require("path");
const fileSystem = require("fs");

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

const loadStorage = (callback) => {
  storage.get("userData", (error, data) => {
    if (error) throw error;

    // If the storage is empty, prompt the user to fill it and quit
    if (
      Object.keys(data).length == 0 ||
      JSON.stringify(defaultStorage) == JSON.stringify(data)
    ) {
      storage.set("userData", defaultStorage, () =>
        shell
          .openExternal(storage.getDataPath() + "/userData.json")
          .then(() => {
            const remote = require("electron").remote;
            let w = remote.getCurrentWindow();
            w.close();
          })
      );
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
        fileSystem.copyFile(
          backgroundImage,
          backgroundImageStorage,
          () =>
            (document.body.style.backgroundImage = `url('${backgroundImageStorage}')`)
        );
      }

      storage.set("userData_backup", data);

      if (callback) {
        callback();
      }
    }
  });
};

exports.loadStorage = loadStorage;
exports.latitude = () => latitude;
exports.longitude = () => longitude;
exports.openWeatherKey = () => openWeatherKey;
exports.dkUser = () => dkUser;
exports.dkPassword = () => dkPassword;
exports.userName = () => userName;
