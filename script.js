document.addEventListener("DOMContentLoaded", function () {
  $("#locationText").text("Unbekannte Position");
  apicalls();
});
function apicalls() {
  if (typeof CONFIG === "undefined") {
    alert("API keys not configured. Please copy config.example.js to config.js and add your API keys.");
    return;
  }

  const openweatherApiKey = CONFIG.OPENWEATHER_API_KEY;

  if (
    !openweatherApiKey ||
    openweatherApiKey === "your_openweather_api_key_here"
  ) {
    alert("API key not configured. Please edit config.js and add your API key.");
    return;
  }

  let lat = "48.208174";
  let lon = "16.373819";

  function makeWeatherAPICall(lat, lon) {
    let currentURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&lang=de&units=metric&appid=${openweatherApiKey}`;
    let forecastURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&lang=de&units=metric&appid=${openweatherApiKey}`;

    $.when($.getJSON(currentURL), $.getJSON(forecastURL))
      .done(function (currentResponse, forecastResponse) {
        const currentData = currentResponse[0];
        const forecastData = forecastResponse[0];

        const combinedData = {
          current: {
            dt: currentData.dt,
            temp: currentData.main.temp,
            feels_like: currentData.main.feels_like,
            clouds: currentData.clouds ? currentData.clouds.all : 0,
            humidity: currentData.main.humidity,
            wind_speed: currentData.wind ? currentData.wind.speed : 0,
            wind_deg: currentData.wind ? currentData.wind.deg : 0,
            sunrise: currentData.sys.sunrise,
            sunset: currentData.sys.sunset,
            weather: currentData.weather,
          },
          daily: transformForecastToDaily(forecastData),
        };
        callbackFuncWithData(combinedData);
        geoAPIcall(lat, lon);
      })
      .fail(function (jqXHR2, textStatus2, errorThrown2) {
        const errorMsg =
          jqXHR2.responseJSON?.message ||
          errorThrown2 ||
          textStatus2 ||
          "Unknown error";

        let alertMsg = `Error fetching weather data: ${errorMsg}\n\n`;

        if (jqXHR2.status === 401) {
          alertMsg += "Your API key is invalid or inactive.\n\n";
          alertMsg += "Please:\n";
          alertMsg +=
            "1. Check your API key at https://home.openweathermap.org/api_keys\n";
          alertMsg +=
            "2. Make sure the key is activated (may take a few minutes)\n";
          alertMsg += "3. Verify you have access to the required APIs\n";
          alertMsg += "4. Update config.js with the correct API key\n\n";
        } else {
          alertMsg += "Please check:\n";
          alertMsg += "1. Your API key is valid\n";
          alertMsg += "2. You have access to the required APIs\n";
          alertMsg += "3. Your API key is not restricted\n\n";
        }

        alert(alertMsg);
      });
  }

  function transformForecastToDaily(forecastData) {
    if (!forecastData || !forecastData.list || forecastData.list.length === 0) {
      return [null, null, null, null, null, null, null, null];
    }

    const dailyGroups = {};

    forecastData.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toISOString().split("T")[0];

      if (!dailyGroups[dayKey]) {
        dailyGroups[dayKey] = [];
      }
      dailyGroups[dayKey].push(item);
    });

    const dailyForecasts = [];
    const sortedDays = Object.keys(dailyGroups).sort();

    sortedDays.forEach((dayKey) => {
      const dayForecasts = dailyGroups[dayKey];

      let middayForecast = dayForecasts[0];
      let minDiff = Math.abs(
        new Date(dayForecasts[0].dt * 1000).getHours() - 12
      );

      dayForecasts.forEach((item) => {
        const hour = new Date(item.dt * 1000).getHours();
        const diff = Math.abs(hour - 12);
        if (diff < minDiff) {
          minDiff = diff;
          middayForecast = item;
        }
      });

      const temps = dayForecasts.map((f) => f.main.temp);
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);

      dailyForecasts.push({
        dt: middayForecast.dt,
        temp: {
          day: middayForecast.main.temp,
          min: minTemp,
          max: maxTemp,
        },
        weather: middayForecast.weather,
        clouds: middayForecast.clouds ? middayForecast.clouds.all : 0,
        humidity: middayForecast.main.humidity,
        wind_speed: middayForecast.wind ? middayForecast.wind.speed : 0,
        wind_deg: middayForecast.wind ? middayForecast.wind.deg : 0,
      });
    });

    const dailyArray = [null];

    let startIndex = 0;
    if (dailyForecasts.length > 0) {
      const firstForecastDate = new Date(dailyForecasts[0].dt * 1000);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      firstForecastDate.setHours(0, 0, 0, 0);

      if (firstForecastDate.getTime() === today.getTime()) {
        startIndex = 1;
      }
    }

    for (
      let i = startIndex;
      i < dailyForecasts.length && dailyArray.length < 6;
      i++
    ) {
      dailyArray.push(dailyForecasts[i]);
    }

    while (dailyArray.length < 6) {
      dailyArray.push(null);
    }

    while (dailyArray.length > 6) {
      dailyArray.pop();
    }

    return dailyArray;
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        lat = position.coords.latitude;
        lon = position.coords.longitude;
        makeWeatherAPICall(lat, lon);
      },
      function (error) {
        makeWeatherAPICall(lat, lon);
      }
    );
  } else {
    makeWeatherAPICall(lat, lon);
  }
}
function callbackFuncWithData(data) {
  if (!$("#locationText").text() || $("#locationText").text().trim() === "") {
    $("#locationText").text("Unbekannte Position");
  }

  let d = new Date(data.current.dt * 1000);
  const months = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];
  const days = [
    "Sonntag",
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
  ];
  let datumsText =
    days[d.getDay()] +
    ", " +
    d.getDate() +
    ". " +
    months[d.getMonth()] +
    " " +
    d.getUTCFullYear();
  let uhrzeitText =
    addNull(d.getHours()) + ":" + addNull(d.getMinutes()) + " Uhr";

  $("#dateText").text(datumsText);
  $("#timeText").text(uhrzeitText);

  let image = document.createElement("img");
  let imageParent = document.getElementById("currentWeatherIcon");
  let searchPic = new Image(100, 100);
  searchPic.src =
    "https://openweathermap.org/img/wn/" +
    data.current.weather[0].icon +
    "@2x.png";
  image.id = "currentWeatherPic";
  image.src = searchPic.src;
  imageParent.appendChild(image);

  $("#currentWeatherText").text(data.current.weather[0].description);
  $("#currentWeatherTemp").text("Temperatur: " + data.current.temp + "°C");
  $("#currentWeatherTempFeelsLike").text(
    "Fühlt sich an wie: " + data.current.feels_like + "°C"
  );
  $("#currentWeatherCloud").text(data.current.clouds + "% bewölkt");
  $("#currentWeatherHumidity").text(
    data.current.humidity + "% Luftfeuchtigkeit"
  );
  $("#currentWeatherWind").text(
    "Windgeschwindigkeit: " + data.current.wind_speed + " m/s"
  );
  $("#currentWeatherWindDirection").text(
    "Windrichtung: " + data.current.wind_deg + "°"
  );

  let dateSunrise = new Date(data.current.sunrise * 1000);
  let dateSunset = new Date(data.current.sunset * 1000);

  $("#currentWeatherSunrise").text(
    "Sonnenaufgang: " +
      addNull(dateSunrise.getHours()) +
      ":" +
      addNull(dateSunrise.getMinutes()) +
      " Uhr"
  );
  $("#currentWeatherSunset").text(
    "Sonnenuntergang: " +
      addNull(dateSunset.getHours()) +
      ":" +
      addNull(dateSunset.getMinutes()) +
      " Uhr"
  );

  function hideColumn(dayIndex) {
    $(
      `#textTag${dayIndex}, #imgTag${dayIndex}, #descrTag${dayIndex}, #tempTag${dayIndex}`
    ).each(function () {
      $(this).parent().hide();
    });
  }

  function showColumn(dayIndex) {
    $(
      `#textTag${dayIndex}, #imgTag${dayIndex}, #descrTag${dayIndex}, #tempTag${dayIndex}`
    ).each(function () {
      $(this).parent().show();
    });
  }

  function renderDayForecast(dayIndex, dayLabel, isTomorrow = false) {
    // Validate dayIndex is within expected range (1-5)
    if (dayIndex < 1 || dayIndex > 5) {
      return;
    }

    if (!data.daily[dayIndex]) {
      hideColumn(dayIndex);
      return;
    }

    const dayData = data.daily[dayIndex];
    if (!dayData || !dayData.weather || !dayData.weather[0]) {
      hideColumn(dayIndex);
      return;
    }

    const dateTime = new Date(dayData.dt * 1000);
    const dayText = isTomorrow
      ? "Morgen, " + days[dateTime.getDay()]
      : days[dateTime.getDay()];

    // Safely set text elements
    const textElement = document.getElementById(`textTag${dayIndex}`);
    if (textElement) {
      $(textElement).text(dayText);
    }

    const imageTag = document.createElement("img");
    const imageParent = document.getElementById(`imgTag${dayIndex}`);

    // Check if element exists before manipulating it
    if (!imageParent) {
      return;
    }

    // Clear any existing images safely
    try {
      imageParent.innerHTML = "";
    } catch (error) {
      return;
    }

    const searchPic = new Image(100, 100);
    searchPic.src = `https://openweathermap.org/img/wn/${dayData.weather[0].icon}@2x.png`;
    imageTag.id = `imageTag${dayIndex}`;
    imageTag.src = searchPic.src;
    
    try {
      imageParent.appendChild(imageTag);
    } catch (error) {
      return;
    }

    // Safely set description and temperature
    const descrElement = document.getElementById(`descrTag${dayIndex}`);
    const tempElement = document.getElementById(`tempTag${dayIndex}`);
    
    if (descrElement) {
      $(descrElement).text(dayData.weather[0].description);
    }
    
    if (tempElement) {
      $(tempElement).text("Temp: " + dayData.temp.day + "°C");
    }
    
    showColumn(dayIndex);
  }

  if (data.daily[1]) renderDayForecast(1, "Morgen", true);
  if (data.daily[2]) renderDayForecast(2, "Übermorgen", true);
  if (data.daily[3]) renderDayForecast(3);
  if (data.daily[4]) renderDayForecast(4);
  if (data.daily[5]) renderDayForecast(5);
}
function geoAPIcall(lat, lon) {
  if (typeof CONFIG === "undefined" || !CONFIG.OPENWEATHER_API_KEY) {
    $("#locationText").text("Unbekannte Position");
    return;
  }

  const geoAPIurl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${CONFIG.OPENWEATHER_API_KEY}`;

  $.getJSON(geoAPIurl, geoLocCallbackFuncWithData).fail(function (
    jqXHR,
    textStatus,
    errorThrown
  ) {
    $("#locationText").text("Unbekannte Position");
  });
}

function geoLocCallbackFuncWithData(data) {
  if (data && Array.isArray(data) && data.length > 0) {
    try {
      const location = data[0];
      let locationText = "";

      if (location.name) {
        locationText = location.name;
      }

      if (location.state && location.state !== location.name) {
        locationText += location.state ? `, ${location.state}` : "";
      }

      if (location.country) {
        locationText += locationText
          ? `, ${location.country}`
          : location.country;
      }

      if (locationText) {
        $("#locationText").text(locationText);
      } else {
        $("#locationText").text("Unbekannte Position");
      }
    } catch (error) {
      $("#locationText").text("Unbekannte Position");
    }
  } else {
    $("#locationText").text("Unbekannte Position");
  }
}
function addNull(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}
