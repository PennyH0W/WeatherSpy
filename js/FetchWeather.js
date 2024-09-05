// API keys
const weatherApiKey = '222ad89775048088f77904f7776645a4'; // Replace with your actual API key

// API links
const weatherUrl = 'https://api.openweathermap.org/data/2.5/weather'; // openweathermap weather
const citySearchUrl = 'https://api.openweathermap.org/data/2.5/find'; // openweathermap cities

// Event listener for search button using NWS functions
document.getElementById('searchButtonNws').addEventListener('click', async () => {
    const locationInputNws = document.getElementById('locationInputNws').value.trim();
    
    if (!locationInputNws) {
        console.log('No input provided.');
        document.getElementById('weatherInfoNws').innerHTML = `<p>Please enter a valid location.</p>`;
        return;
    }

    const coordinates = await getCoordinates(locationInputNws);

    if (coordinates) {
        console.log('Coordinates for entered location:', coordinates);
        getCurrentWeatherNws(coordinates.lat, coordinates.lon);
        getWeatherForecastNws(coordinates.lat, coordinates.lon);
        getWeatherAlerts(coordinates.lat, coordinates.lon);
        map.setView([coordinates.lat, coordinates.lon], 10); // Ensure map updates with correct view
    } else {
        console.log('Location not found or invalid input');
        document.getElementById('weatherInfoNws').innerHTML = `<p>Location not found. Please check the input and try again.</p>`;
    }
});


// Event listener for current location button using NWS functions
document.getElementById('currentLocationButtonNws').addEventListener('click', async () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            getCurrentWeatherNws(lat, lon);
            getWeatherForecastNws(lat, lon);
            map.setView([lat, lon], 10); // Ensure lat, lon are valid and zoom level is correct

        });
    } else {
        document.getElementById('weatherInfoNws').innerHTML = `<p>Geolocation is not supported by this browser.</p>`;
    }
});



// Initialize the map with a default view (World view)
const map = L.map('map').setView([20, 0], 2); // Center on the world with a zoom level of 2

// Add OpenStreetMap base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    noWrap: true, // Prevent the map from wrapping around when zoomed out
    maxZoom: 18, // Set the maximum zoom level
    minZoom: 2, // Optional: Set a minimum zoom level to prevent excessive zooming out
}).addTo(map);

// Add OpenWeatherMap layers with noWrap and zoom options
const cloudsLayer = L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${weatherApiKey}`, {
    noWrap: true,
    maxZoom: 18,
    minZoom: 2,
});
const precipitationLayer = L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${weatherApiKey}`, {
    noWrap: true,
    maxZoom: 18,
    minZoom: 2,
});
const tempLayer = L.tileLayer(`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${weatherApiKey}`, {
    noWrap: true,
    maxZoom: 18,
    minZoom: 2,
});
const pressureLayer = L.tileLayer(`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${weatherApiKey}`, {
    noWrap: true,
    maxZoom: 18,
    minZoom: 2,
});
const windLayer = L.tileLayer(`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${weatherApiKey}`, {
    noWrap: true,
    maxZoom: 18,
    minZoom: 2,
});

// Base layers
const baseMaps = {
    "Clouds": cloudsLayer,
    "Precipitation": precipitationLayer,
    "Temperature": tempLayer,
    "Sea Level Pressure": pressureLayer,
    "Wind Speed": windLayer
};

L.control.layers(baseMaps).addTo(map);
cloudsLayer.addTo(map); // Set default layer



// Get Weather by Geolocation or Cooridnates
function getWeatherByGeolocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            console.log(`Latitude: ${lat}, Longitude: ${lon}`);

            // Fetch and display weather data
            getWeatherByCoordinates(lat, lon);
            getForecast(lat, lon);
            getWeatherAlerts(lat, lon);

            // Update the map view to center on the user's current location
            map.setView([lat, lon], 10); // Adjust the zoom level as needed
        }, function(error) {
            console.error("Error getting the location: ", error);
            document.getElementById('weatherInfoNws').innerHTML = `<p>Error getting the location. Please allow location access.</p>`;
        });
    } else {
        console.error("Geolocation is not supported by this browser.");
        document.getElementById('weatherInfoNews').innerHTML = `<p>Geolocation is not supported by this browser.</p>`;
    }
}

async function getWeatherByCoordinates(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        displayWeather(data);

        // Update the map view after getting weather data
        map.setView([lat, lon], 10); // Adjust the zoom level as needed
    } catch (error) {
        console.error('Error fetching the weather data:', error);
        document.getElementById('weatherInfoNws').innerHTML = `<p>Error fetching weather data. Please try again.</p>`;
    }
}



// Check if the input is a ZIP code
function isZipCode(input) {
    return /^\d{5}$/.test(input);
}



async function getLocationName(lat, lon) {
    const geoUrl = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${weatherApiKey}`;
    const response = await fetch(geoUrl);
    const data = await response.json();
    if (data.length > 0) {
        return data[0].name; // Return the name of the location
    }
    return null;
}

// Get Weather
async function getWeather(location) {
    try {
        let url;
        if (isZipCode(location)) {
            const cityName = zipToCityMap[location];
            if (cityName) {
                url = `${weatherUrl}?q=${cityName}&appid=${weatherApiKey}&units=metric`;
            } else {
                url = `${weatherUrl}?zip=${location},us&appid=${weatherApiKey}&units=metric`;
            }
        } else {
            url = `${weatherUrl}?q=${location}&appid=${weatherApiKey}&units=metric`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        displayWeather(data);
    } catch (error) {
        console.error('Error fetching the weather data:', error);
        document.getElementById('weatherInfoNws').innerHTML = `<p>Error fetching weather data. Please try again.</p>`;
    }
}

function displayWeather(data) {
    const weatherInfoNws = document.getElementById('weatherInfoNws');
    let weatherContent = `
        <h2>Weather Info</h2>
        <h3>Weather in ${data.name}</h3>
        <p>Temperature: ${data.main.temp}°C</p>
        <p>Weather: ${data.weather[0].description}</p>
        <p>Humidity: ${data.main.humidity}%</p>
        <p>Wind Speed: ${data.wind.speed} m/s</p>
        <p>Pressure: ${data.main.pressure} hPa</p>
        <p>Visibility: ${data.visibility} meters</p>
        <p>Sunrise: ${new Date(data.sys.sunrise * 1000).toLocaleTimeString()}</p>
        <p>Sunset: ${new Date(data.sys.sunset * 1000).toLocaleTimeString()}</p>
    `;
    weatherInfoNws.innerHTML = weatherContent;
}

// Get Weather Alerts using NWS API
async function getWeatherAlerts(lat, lon) {
    const alertsUrl = `https://api.weather.gov/alerts?point=${lat},${lon}`;
    console.log('Alerts URL:', alertsUrl); // Log the alerts URL

    try {
        const alertsResponse = await fetch(alertsUrl);
        if (!alertsResponse.ok) {
            throw new Error(`HTTP error! status: ${alertsResponse.status}`);
        }

        const alertsData = await alertsResponse.json();
        console.log('Alerts Data:', alertsData); // Log alerts data to inspect it

        displayWeatherAlerts(alertsData);
    } catch (error) {
        console.error('Error fetching weather alerts:', error.message);
        document.getElementById('alertsInfoNws').innerHTML = `
            <h2>Weather Alerts</h2>
            <p>Error fetching weather alerts. Please try again later.</p>`;
    }
}

function displayWeatherAlerts(data) {
    const alertsContainer = document.querySelector('#alertsInfoNws .alerts-content');
    let alertsContent = '';

    if (data.features && data.features.length > 0) {
        alertsContent = data.features.map(alert => `
            <h3>${alert.properties.headline}</h3>
            <p>${alert.properties.description}</p>
            <p><em>From: ${new Date(alert.properties.sent).toLocaleString()}</em></p>
            <p><em>Effective: ${new Date(alert.properties.effective).toLocaleString()}</em></p>
        `).join('');
    } else {
        // Filler content for when there are no active alerts
        alertsContent = `
            <p>No active weather alerts for this location.</p>
            <img src="../images/calm-bg-1.webp" alt="Calm weather" class="calm-weather-image">
            <p class="calm-weather-message">It's all clear skies and calm weather in your area. Enjoy the day!</p>
        `;
    }

    // Update the alerts content in the DOM, replacing the default message
    alertsContainer.innerHTML = alertsContent;
}


// Get Forecast
async function getForecast(lat, lon) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`;
    try {
        const response = await fetch(forecastUrl);
        const data = await response.json();
        console.log('Forecast data:', data); // Log the forecast data to check if it exists
        displayForecast(data);
    } catch (error) {
        console.error('Error fetching the forecast data:', error);
    }
}

function displayForecast(data) {
    const forecastInfo = document.getElementById('forecastInfo');
    let forecastContent = `<h2 style="text-align: center;">5-Day Forecast</h2><div class="forecast-container">`; // Start the container div
    
    if (data.list && data.list.length > 0) {
        const dailyData = data.list.filter((entry, index) => index % 8 === 0); // Adjust to display every 8th item
        forecastContent += dailyData.map(entry => `
            <div class="forecast-day">
                <h3>${new Date(entry.dt * 1000).toLocaleDateString()}</h3>
                <p>Temp: ${entry.main.temp}°C</p>
                <p>Weather: ${entry.weather[0].description}</p>
                <img src="https://openweathermap.org/img/wn/${entry.weather[0].icon}@2x.png" alt="${entry.weather[0].description}">
            </div>
        `).join('');
        forecastContent += `</div>`; // Close the container div
    } else {
        forecastContent += `<p>No forecast data available.</p>`;
    }

    forecastInfo.innerHTML = forecastContent;
}

async function getCurrentWeatherNws(lat, lon) {
    try {
        const pointData = await getNwsPointData(lat, lon);
        const stationsUrl = pointData.observationStations;

        // Fetch the list of observation stations
        const responseStations = await fetch(stationsUrl);
        if (!responseStations.ok) {
            throw new Error(`HTTP error! status: ${responseStations.status}`);
        }
        const stationsData = await responseStations.json();

        // Loop through stations until we find one that works
        for (let station of stationsData.features) {
            const stationUrl = `${station.id}/observations/latest`;
            try {
                const response = await fetch(stationUrl);
                if (response.ok) {
                    const weatherData = await response.json();
                    console.log('Current Weather Data:', weatherData);
                    displayCurrentWeatherNws(weatherData);
                    return; // Exit once successful
                }
            } catch (error) {
                console.warn(`Station ${station.id} failed: ${error.message}`);
            }
        }

        // If no station worked, show a fallback message
        document.getElementById('weatherInfoNws').innerHTML = `<p>No current weather data available for this location.</p>`;
    } catch (error) {
        console.error('Error fetching current weather:', error);
        document.getElementById('weatherInfoNws').innerHTML = `<p>Error fetching current weather. Please try again later.</p>`;
    }
}

function displayCurrentWeatherNws(data) {
    const weatherInfoNws = document.getElementById('weatherInfoNws');

    // Convert Celsius to Fahrenheit
    const temperatureC = data.properties.temperature.value;
    const temperatureF = ((temperatureC * 9 / 5) + 32).toFixed(2);

    // Ensure wind speed and pressure are valid before display
    const windSpeed = data.properties.windSpeed.value ? `${data.properties.windSpeed.value} m/s` : 'N/A';
    const pressure = data.properties.barometricPressure.value ? `${(data.properties.barometricPressure.value / 100).toFixed(2)} hPa` : 'N/A';

    // Get the weather icon
    const iconUrl = data.properties.icon;

    weatherInfoNws.innerHTML = `
        <h2>Current Weather</h2>
        <p>Temperature: ${temperatureF}°F / ${temperatureC}°C</p>
        <img src="${iconUrl}" alt="Weather Icon">
        <p>Weather: ${data.properties.textDescription}</p>
        <p>Wind Speed: ${windSpeed}</p>
        <p>Pressure: ${pressure}</p>
        <p>Humidity: ${data.properties.relativeHumidity.value}%</p>
    `;
}

async function getWeatherForecastNws(lat, lon) {
    try {
        const pointData = await getNwsPointData(lat, lon);
        const forecastUrl = pointData.forecast;

        const response = await fetch(forecastUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const forecastData = await response.json();
        console.log('Forecast Data:', forecastData); // Log the forecast data
        displayWeatherForecastNws(forecastData);
    } catch (error) {
        console.error('Error fetching weather forecast:', error);
    }
}

async function getCoordinates(locationInputNws) {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationInputNws)},US`;
    try {
        const response = await fetch(geocodeUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.length > 0) {
            const coordinates = {
                lat: data[0].lat,
                lon: data[0].lon
            };
            console.log('Coordinates for entered location:', coordinates);
            return coordinates;
        } else {
            console.log('Location not found or invalid input');
            document.getElementById('weatherInfoNws').innerHTML = `<p>Location not found or invalid input.</p>`;
            return null;
        }
    } catch (error) {
        console.error('Error fetching coordinates:', error);
        document.getElementById('weatherInfoNws').innerHTML = `<p>Error fetching coordinates. Please try again later.</p>`;
    }
}

function displayWeatherForecastNws(data) {
    const forecastInfo = document.getElementById('forecastInfoNws');
    let forecastContent = `<h2>Extended Forecast</h2><div class="forecast-container">`;

    forecastContent += data.properties.periods.map(period => `
        <div class="forecast-day">
            <h3>${period.name}</h3>
            <p>Temperature: ${period.temperature}°${period.temperatureUnit}</p>
            <img src="${period.icon}" alt="${period.shortForecast}">
            <p>Weather: ${period.shortForecast}</p>
        </div>
    `).join('');

    forecastContent += `</div>`;
    forecastInfo.innerHTML = forecastContent;
}

async function getNwsPointData(lat, lon) {
    const pointUrl = `https://api.weather.gov/points/${lat},${lon}`;
    console.log('Point Data URL:', pointUrl); // Log the point data URL

    try {
        const response = await fetch(pointUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const pointData = await response.json();
        return pointData.properties;
    } catch (error) {
        console.error('Error fetching NWS point data:', error);
        throw error;
    }
}


