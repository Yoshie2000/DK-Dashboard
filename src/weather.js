// Node Imports
const request = require("request");
const path = require("path");

// Custom Imports
const storage = require("./storage");

const openWeatherURL = () =>
  `https://api.openweathermap.org/data/2.5/onecall?lat=${storage.latitude()}&lon=${storage.longitude()}&appid=${storage.openWeatherKey()}&units=metric&lang=de`;

const loadWeather = (weatherCallback) => {
  request(openWeatherURL(), (error, response) => {
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
        "../",
        "assets",
        "weather_icons",
        `${nextHourData.weather[0].icon}@2x.png`
      ),
      timestamp: weatherTimestampString,
    };

    // Display the weather data
    updateWeatherData(resultWeatherData);

    if (weatherCallback) weatherCallback();
  });

  updateWeatherData = (weatherData) => {
    document.getElementById("clouds").innerHTML = weatherData.cloudPercentage;
    document.getElementById("feelsLikeTemperature").innerHTML =
      weatherData.feelsLike;
    document.getElementById("humidity").innerHTML = weatherData.humidity;
    document.getElementById("temperature").innerHTML = weatherData.temperature;
    document.getElementById("description").innerHTML = weatherData.description;
    document.getElementById("weatherIcon").src = weatherData.icon;
    document.getElementById("timestamp").innerHTML = weatherData.timestamp;
  };
};

exports.loadWeather = loadWeather;
