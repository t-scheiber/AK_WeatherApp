# Weather App

A practice project: a current weather and five-day forecast page in vanilla JavaScript, using the OpenWeatherMap API. The page text is German.

Live site: https://weatherapp-vanillajs.thomasscheiber.com

## What the app does

On load, the page asks the browser for the device location. If the browser refuses, does not support geolocation, or does not answer within 8 seconds, the page uses Vienna (48.208174, 16.373819).

With the coordinates, the page makes three requests to OpenWeatherMap:

- `/data/2.5/weather` for the current conditions.
- `/data/2.5/forecast` for the 3-hour forecast over five days.
- `/geo/1.0/reverse` to turn the coordinates into a place name. If this request fails, the page shows "Unbekannte Position".

The current section shows the temperature, the feels-like temperature, cloud cover, humidity, wind speed and direction, and the sunrise and sunset times. Icons come from `openweathermap.org/img/wn/`.

The forecast table has one column per later local calendar day. Each column uses the 3-hour entry closest to 12:00 local time for its icon, description and temperature. Today is skipped, and the first column is labelled "Morgen" (tomorrow).

The page loads its data once. It does not refresh on a timer.

## Stack

- HTML, CSS and JavaScript in `index.html`, `style.css` and `script.js`. There is no framework and no bundler.
- jQuery 4.0.0 for the AJAX calls (`$.getJSON`, `$.when`).
- Bootstrap 5.3.9 stylesheet.
- Node.js 22.23.2 or newer and npm. Node runs the build, validation and test scripts. The app itself runs in the browser.

## Run it locally

`index.html` loads `./assets/`, which exists only in the build output. Open the built `dist/` folder, not the repository root.

1. Install the packages: `npm install`
2. Set the API key (see below).
3. Build: `npm run build`
4. Serve `dist/` with any static file server, for example `npx --yes serve dist`.

## API key

Get a key from [OpenWeatherMap](https://openweathermap.org/api). The key is read from the `OPENWEATHER_API_KEY` variable when `npm run build` runs.

- Put it in a `.env` file. Copy `.env.example` to `.env` and replace the placeholder. `generate-config.js` reads `.env`, and its values override variables already set in the shell.
- Or set `OPENWEATHER_API_KEY` in the shell before `npm run build`.

`generate-config.js` writes `config.js` with the key as a plain string. The browser loads that file, so anyone who opens the page can read the key. Treat the key as public.

Without a key, `config.js` holds an empty value. The page shows an "API key not configured" alert and sends no requests.

`config.js` and `.env` are in `.gitignore`.

## Scripts

- `npm run build` runs `generate-config.js`, checks that the installed Bootstrap and jQuery versions match `package.json`, and copies the static files into `dist/`.
- `npm run validate` checks the JavaScript syntax, that both browser libraries are pinned in `package.json` and `package-lock.json`, that the HTML loads local assets only, and that the forecast table IDs exist.
- `npm test` runs the Node test runner on `tests/`. The tests cover the location fallback, forecast grouping, API error handling and the build output.
- `npm run dev` and `npm run setup` only run `generate-config.js`. The project has no development server.

## Deployment

The live site runs on a self-hosted Coolify server. The build runs `npm ci` and `npm run build` with `OPENWEATHER_API_KEY` set as a build variable, and nginx serves `dist/`.

`.github/workflows/pages.yml` also publishes the build to GitHub Pages on pushes to `main`, at https://t-scheiber.github.io/AK_WeatherApp/. It runs only when the repository variable `STATIC_PAGES_ENABLED` is `true`. The workflow passes no secrets, so that copy's `config.js` contains an empty key. It shows the "API key not configured" alert and no weather data.

`nixpacks.toml` describes a third setup that serves the repository root with `serve`. The root has no `assets/` folder, so serve `dist/` instead.

## Project files

- `index.html`: page markup and the element IDs the script fills.
- `script.js`: location lookup, API requests and rendering.
- `style.css`: layout. The forecast table scrolls sideways on narrow screens.
- `generate-config.js`: writes `config.js` from the API key.
- `scripts/build.mjs` and `scripts/validate.mjs`: build and validation.
- `tests/`: Node tests for the script, the config generator and the build.
- `images/`: favicons, touch icons and the web app manifest.
