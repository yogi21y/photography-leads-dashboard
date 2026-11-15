const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

function setup(fetch) {
  const elements = Object.fromEntries(
    ["weather-load", "weather-status", "weather-days"].map((id) => [id, element()])
  );
  function element() {
    return {
      children: [],
      appendChild(child) { this.children.push(child); },
      replaceChildren(...children) { this.children = children; },
      addEventListener(event, listener) { this[event] = listener; }
    };
  }
  const document = { getElementById: (id) => elements[id], createElement: element };
  vm.runInNewContext(fs.readFileSync(__dirname + "/weather.js", "utf8"), {
    document, fetch, URL, URLSearchParams
  });
  return {
    click: elements["weather-load"].click,
    button: elements["weather-load"],
    status: elements["weather-status"],
    list: elements["weather-days"]
  };
}

test("requests and displays three forecast days without a key", async () => {
  const ui = setup(async (url) => {
    assert.equal(url.origin, "https://api.open-meteo.com");
    assert.equal(url.searchParams.get("forecast_days"), "3");
    assert.equal(url.searchParams.get("timezone"), "Asia/Jerusalem");
    assert.equal(url.searchParams.has("apikey"), false);
    return { ok: true, json: async () => ({
      daily: {
        time: ["2026-11-15", "2026-11-16", "2026-11-17"],
        temperature_2m_min: [17, 16, 14],
        temperature_2m_max: [24, 23, 20],
        precipitation_probability_max: [0, 15, null],
        wind_speed_10m_max: [12, 14, 25]
      }
    }) };
  });
  await ui.click();
  assert.equal(ui.list.hidden, false);
  assert.equal(ui.list.children.length, 3);
  assert.match(ui.list.children[0].children[3].textContent, /0%/);
  assert.match(ui.list.children[2].children[3].textContent, /לא זמין/);
  assert.equal(ui.button.disabled, false);
});

test("allows retry after an unavailable or empty response", async () => {
  for (const response of [{ ok: false }, { ok: true, json: async () => ({ daily: { time: [] } }) }]) {
    const ui = setup(async () => response);
    await ui.click();
    assert.match(ui.status.textContent, /אפשר לנסות שוב/);
    assert.equal(ui.list.hidden, true);
    assert.equal(ui.button.disabled, false);
  }
});
