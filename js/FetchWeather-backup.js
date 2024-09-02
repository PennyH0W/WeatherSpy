// API keys
const weatherApiKey = '222ad89775048088f77904f7776645a4'; // Replace with your actual API key

// API links
const weatherUrl = 'https://api.openweathermap.org/data/2.5/weather'; // openweathermap weather
const citySearchUrl = 'https://api.openweathermap.org/data/2.5/find'; // openweathermap cities

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


// Check buttons
document.getElementById('searchButton').addEventListener('click', () => {
    console.log('Search button clicked!');
});

document.getElementById('currentLocationButton').addEventListener('click', () => {
    console.log('Current location button clicked!');
});

// Event listener for the search button
document.getElementById('searchButton').addEventListener('click', async () => {
    const locationInput = document.getElementById('locationInput').value.trim();
    let coordinates;

    if (isZipCode(locationInput)) {
        coordinates = await getCoordinatesByZip(locationInput);
    } else {
        coordinates = await getCoordinates(locationInput);
    }

    if (coordinates) {
        const locationName = await getLocationName(coordinates.lat, coordinates.lon);
        getWeather(locationName || locationInput);
        getForecast(coordinates.lat, coordinates.lon);
        getWeatherAlerts(coordinates.lat, coordinates.lon);

        // Update the map view to center on the searched location
        map.setView([coordinates.lat, coordinates.lon], 10); // Adjust the zoom level as needed
    } else {
        document.getElementById('weatherInfo').innerHTML = `<p>Location not found.</p>`;
    }
});

// Event listener for current location button
document.getElementById('currentLocationButton').addEventListener('click', getWeatherByGeolocation);

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
            document.getElementById('weatherInfo').innerHTML = `<p>Error getting the location. Please allow location access.</p>`;
        });
    } else {
        console.error("Geolocation is not supported by this browser.");
        document.getElementById('weatherInfo').innerHTML = `<p>Geolocation is not supported by this browser.</p>`;
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
        document.getElementById('weatherInfo').innerHTML = `<p>Error fetching weather data. Please try again.</p>`;
    }
}



// Check if the input is a ZIP code
function isZipCode(input) {
    return /^\d{5}$/.test(input);
}

// Geocoding functions
async function getCoordinates(city) {
    const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${weatherApiKey}`;
    const response = await fetch(geoUrl);
    const data = await response.json();
    if (data.length > 0) {
        return { lat: data[0].lat, lon: data[0].lon };
    }
    return null;
}

async function getCoordinatesByZip(zipCode, countryCode = 'US') {
    const geoUrl = `http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},${countryCode}&appid=${weatherApiKey}`;
    const response = await fetch(geoUrl);
    const data = await response.json();
    return { lat: data.lat, lon: data.lon };
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
        document.getElementById('weatherInfo').innerHTML = `<p>Error fetching weather data. Please try again.</p>`;
    }
}

function displayWeather(data) {
    const weatherInfo = document.getElementById('weatherInfo');
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
    weatherInfo.innerHTML = weatherContent;
}

// Weather alerts
async function getWeatherAlerts(lat, lon) {
    const oneCallUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily&appid=${weatherApiKey}`;
    try {
        const response = await fetch(oneCallUrl);
        const data = await response.json();
        displayWeatherAlerts(data);
    } catch (error) {
        console.error('Error fetching weather alerts:', error);
    }
}

function displayWeatherAlerts(data) {
    console.log(data); // Log the data to inspect it
    const alertsInfo = document.getElementById('alertsInfo');
    let alertsContent = `<h2>Weather Alerts</h2>`; // Add the header here

    if (data.alerts && data.alerts.length > 0) {
        // There are weather alerts, so no calm sky image
        alertsContent += data.alerts.map(alert => `
            <h3>${alert.event}</h3>
            <p>${alert.description}</p>
            <p><em>From: ${new Date(alert.start * 1000).toLocaleString()}</em></p>
            <p><em>To: ${new Date(alert.end * 1000).toLocaleString()}</em></p>
        `).join('');
    } else {
        // No weather alerts, so show the calm sky image and message
        alertsContent += `
        <img src="../images/calm-bg-1.webp" alt="Calm weather" class="calm-weather-image">
        <p class="calm-weather-message">It's all clear skies and calm weather in your area. Enjoy the day!</p>
    `;
    }

    alertsInfo.innerHTML = alertsContent;
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




