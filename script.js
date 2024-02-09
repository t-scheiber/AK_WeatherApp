document.addEventListener("DOMContentLoaded", function () {
    apicalls();
});
function apicalls(){
    let urlstart = "https://api.openweathermap.org/data/2.5/onecall?lat=";
    let urlmitte = "&lon=";
    let urlende = "&exclude=minutely,hourly,alerts&lang=de&units=metric&appid=fb10ff32edbb6db7af29f531410a338d";
    
    let lat = "48.208174";
    let lon = "16.373819";

    navigator.geolocation.getCurrentPosition(function(position) {
        lat = position.coords.latitude;
        lon = position.coords.longitude;
    console.log("Koordinaten von API: " + lat + " " + lon); 
    
    let URL = urlstart + lat + urlmitte + lon + urlende;
    console.log(URL);
    $.getJSON(URL, callbackFuncWithData);
    geoAPIcall(lat, lon);
    });
}
function callbackFuncWithData(data){
    
    let d = new Date(data.current.dt*1000);
    const months = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
    const days = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];
    let datumsText = days[d.getDay()] + ", " + d.getDate() + ". " + months[d.getMonth()] + " " + d.getUTCFullYear();
    let uhrzeitText = addNull(d.getHours()) + ":" + addNull(d.getMinutes()) + " Uhr";
    
    $(dateText).text(datumsText);
    $(timeText).text(uhrzeitText);

    let image = document.createElement("img");
    let imageParent = document.getElementById("currentWeatherIcon");
    let searchPic = new Image(100,100);
    searchPic.src = "https://openweathermap.org/img/wn/" + data.current.weather[0].icon + "@2x.png";
    image.id = "currentWeatherPic";
    image.src = searchPic.src;            // image.src = "IMAGE URL/PATH"
    imageParent.appendChild(image);

    $(currentWeatherText).text(data.current.weather[0].description);
    $(currentWeatherTemp).text("Temperatur: " + data.current.temp + "°C");
    $(currentWeatherTempFeelsLike).text("Fühlt sich an wie: " + data.current.feels_like + "°C");
    $(currentWeatherCloud).text(data.current.clouds + "% bewölkt");
    $(currentWeatherHumidity).text(data.current.humidity + "% Luftfeuchtigkeit");
    $(currentWeatherWind).text("Windgeschwindigkeit: " + data.current.wind_speed + " m/s");
    $(currentWeatherWindDirection).text("Windrichtung: " + data.current.wind_deg + "°");

    let dateSunrise = new Date(data.current.sunrise*1000);
    let dateSunset = new Date(data.current.sunset*1000);

    $(currentWeatherSunrise).text("Sonnenaufgang: " + addNull(dateSunrise.getHours()) + ":" + addNull(dateSunrise.getMinutes()) + " Uhr");
    $(currentWeatherSunset).text("Sonnenuntergang: " + addNull(dateSunset.getHours()) + ":" + addNull(dateSunset.getMinutes()) + " Uhr");
    
    //Ende, CurrentWeather
    //Beginn Prognose

    //Tag1
    let dateTimeTag1 = new Date(data.daily[1].dt*1000);
    $(textTag1).text("Morgen, " + days[dateTimeTag1.getDay()]);
    
    let imageTag1 = document.createElement("img");
    let imageParentTag1 = document.getElementById("imgTag1");
    let searchPicTag1 = new Image(100,100);
    searchPicTag1.src = "https://openweathermap.org/img/wn/" + data.daily[1].weather[0].icon + "@2x.png";
    imageTag1.id = "imageTag1";
    imageTag1.src = searchPicTag1.src;
    imageParentTag1.appendChild(imageTag1);

    $(descrTag1).text(data.daily[1].weather[0].description);
    $(tempTag1).text("Temp: " + data.daily[1].temp.day + "°C");
    
    //Tag2
    let dateTimeTag2 = new Date(data.daily[2].dt*1000);
    $(textTag2).text("Übermorgen, " + days[dateTimeTag2.getDay()]);
    
    let imageTag2 = document.createElement("img");
    let imageParentTag2 = document.getElementById("imgTag2");
    let searchPicTag2 = new Image(100,100);
    searchPicTag2.src = "https://openweathermap.org/img/wn/" + data.daily[2].weather[0].icon + "@2x.png";
    imageTag2.id = "imageTag2";
    imageTag2.src = searchPicTag2.src;
    imageParentTag2.appendChild(imageTag2);

    $(descrTag2).text(data.daily[2].weather[0].description);
    $(tempTag2).text("Temp: " + data.daily[2].temp.day + "°C");

    //Tag3
    let dateTimeTag3 = new Date(data.daily[3].dt*1000);
    $(textTag3).text(days[dateTimeTag3.getDay()]);
    
    let imageTag3 = document.createElement("img");
    let imageParentTag3 = document.getElementById("imgTag3");
    let searchPicTag3 = new Image(100,100);
    searchPicTag3.src = "https://openweathermap.org/img/wn/" + data.daily[3].weather[0].icon + "@2x.png";
    imageTag3.id = "imageTag3";
    imageTag3.src = searchPicTag3.src;
    imageParentTag3.appendChild(imageTag3);

    $(descrTag3).text(data.daily[3].weather[0].description);
    $(tempTag3).text("Temp: " + data.daily[3].temp.day + "°C");

    //Tag4
    let dateTimeTag4 = new Date(data.daily[4].dt*1000);
    $(textTag4).text(days[dateTimeTag4.getDay()]);
    
    let imageTag4 = document.createElement("img");
    let imageParentTag4 = document.getElementById("imgTag4");
    let searchPicTag4 = new Image(100,100);
    searchPicTag4.src = "https://openweathermap.org/img/wn/" + data.daily[4].weather[0].icon + "@2x.png";
    imageTag4.id = "imageTag4";
    imageTag4.src = searchPicTag4.src;
    imageParentTag4.appendChild(imageTag4);

    $(descrTag4).text(data.daily[4].weather[0].description);
    $(tempTag4).text("Temp: " + data.daily[4].temp.day + "°C");
    
    //Tag5
    let dateTimeTag5 = new Date(data.daily[5].dt*1000);
    $(textTag5).text(days[dateTimeTag5.getDay()]);
    
    let imageTag5 = document.createElement("img");
    let imageParentTag5 = document.getElementById("imgTag5");
    let searchPicTag5 = new Image(100,100);
    searchPicTag5.src = "https://openweathermap.org/img/wn/" + data.daily[5].weather[0].icon + "@2x.png";
    imageTag5.id = "imageTag5";
    imageTag5.src = searchPicTag5.src;
    imageParentTag5.appendChild(imageTag5);

    $(descrTag5).text(data.daily[5].weather[0].description);
    $(tempTag5).text("Temp: " + data.daily[5].temp.day + "°C");
    
    //Tag6
    let dateTimeTag6 = new Date(data.daily[6].dt*1000);
    $(textTag6).text(days[dateTimeTag6.getDay()]);
    
    let imageTag6 = document.createElement("img");
    let imageParentTag6 = document.getElementById("imgTag6");
    let searchPicTag6 = new Image(100,100);
    searchPicTag6.src = "https://openweathermap.org/img/wn/" + data.daily[6].weather[0].icon + "@2x.png";
    imageTag6.id = "imageTag5";
    imageTag6.src = searchPicTag6.src;
    imageParentTag6.appendChild(imageTag6);

    $(descrTag6).text(data.daily[6].weather[0].description);
    $(tempTag6).text("Temp: " + data.daily[6].temp.day + "°C");
    
    //Tag7
    let dateTimeTag7 = new Date(data.daily[7].dt*1000);
    $(textTag7).text(days[dateTimeTag7.getDay()]);
    
    let imageTag7 = document.createElement("img");
    let imageParentTag7 = document.getElementById("imgTag7");
    let searchPicTag7 = new Image(100,100);
    searchPicTag7.src = "https://openweathermap.org/img/wn/" + data.daily[7].weather[0].icon + "@2x.png";
    imageTag7.id = "imageTag7";
    imageTag7.src = searchPicTag7.src;
    imageParentTag7.appendChild(imageTag7);

    $(descrTag7).text(data.daily[7].weather[0].description);
    $(tempTag7).text("Temp: " + data.daily[7].temp.day + "°C");

    
}
function geoAPIcall(lat, lon){
    const geoAPIurl = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + ","  + lon + "&key=AIzaSyD9Q9ReYYVC92AiA4GV589_RcqZfYfiN1Q";
    $.getJSON(geoAPIurl, geoLocCallbackFuncWithData);
    console.log(geoAPIurl);
}
function geoLocCallbackFuncWithData(data){
    $(locationText).text(data.results[0].address_components[2].long_name + ", " + data.results[0].address_components[3].long_name);
}
function addNull(i) {
    if (i < 10) {
      i = "0" + i;
    }
    return i;
  }