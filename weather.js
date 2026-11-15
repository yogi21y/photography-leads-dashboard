(function () {
  var load = document.getElementById("weather-load");
  var status = document.getElementById("weather-status");
  var days = document.getElementById("weather-days");
  var url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: "32.794",
    longitude: "34.9896",
    daily: "temperature_2m_min,temperature_2m_max,precipitation_probability_max,wind_speed_10m_max",
    forecast_days: "3",
    timezone: "Asia/Jerusalem",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh"
  });

  function measurement(value, unit) {
    return Number.isFinite(value) ? Math.round(value) + unit : "לא זמין";
  }

  function showForecast(daily) {
    if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
      throw new Error("Missing forecast dates");
    }
    var entries = daily.time.map(function (date, index) {
      var entry = document.createElement("li");
      var heading = document.createElement("h3");
      var time = document.createElement("time");
      time.dateTime = date;
      time.textContent = date.split("-").reverse().join("/");
      heading.appendChild(time);
      entry.appendChild(heading);

      var details = [
        "טמפרטורה מזערית " + measurement(daily.temperature_2m_min?.[index], "°"),
        "טמפרטורה מרבית " + measurement(daily.temperature_2m_max?.[index], "°"),
        "סיכוי מרבי למשקעים " + measurement(daily.precipitation_probability_max?.[index], "%"),
        "רוח מרבית " + measurement(daily.wind_speed_10m_max?.[index], " קמ״ש")
      ];
      details.forEach(function (detail) {
        var line = document.createElement("p");
        line.textContent = detail;
        entry.appendChild(line);
      });
      return entry;
    });
    days.replaceChildren(...entries);
    days.hidden = false;
  }

  load.addEventListener("click", async function () {
    load.disabled = true;
    status.textContent = "טוען תחזית…";
    days.hidden = true;
    try {
      var response = await fetch(url);
      if (!response.ok) throw new Error("Forecast request failed");
      showForecast((await response.json()).daily);
      status.textContent = "התחזית נטענה.";
    } catch (error) {
      status.textContent = "לא הצלחנו לטעון את התחזית. אפשר לנסות שוב.";
    } finally {
      load.disabled = false;
    }
  });
})();
