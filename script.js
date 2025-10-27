        // Featured destinations data
        const featuredDestinations = [
            { name: 'Manila', lat: 14.5995, lon: 120.9842, facts: [
                'Manila is home to the oldest Chinatown in the world.',
                'The walled city of Intramuros in Manila dates back to the 16th century.'
            ] },
            { name: 'Cebu', lat: 10.3157, lon: 123.8854, facts: [
                'Cebu is known as the "Queen City of the South" and is famous for Sinulog Festival.',
                'Magellan\'s Cross in Cebu marks the arrival of Christianity in the Philippines.'
            ] },
            { name: 'Davao', lat: 7.1907, lon: 125.4553, facts: [
                'Davao is home to the Philippine Eagle, one of the world\'s largest eagles.',
                'Mount Apo, the highest peak in the Philippines, is in Davao.'
            ] },
            { name: 'Baguio', lat: 16.4023, lon: 120.5960, facts: [
                'Baguio is called the "Summer Capital of the Philippines" due to its cool climate.',
                'The Panagbenga Festival in Baguio is a month-long annual flower festival.'
            ] },
            { name: 'Boracay', lat: 11.9674, lon: 121.9248, facts: [
                'Boracay\'s White Beach is consistently ranked among the world\'s best beaches.',
                'Boracay is famous for its vibrant nightlife and water sports.'
            ] },
            { name: 'Palawan', lat: 9.8432, lon: 118.7384, facts: [
                'Palawan\'s Puerto Princesa Underground River is a UNESCO World Heritage Site.',
                'El Nido in Palawan is known for its stunning limestone cliffs and lagoons.'
            ] },
            { name: 'Siargao', lat: 9.8487, lon: 126.0456, facts: [
                'Siargao is the surfing capital of the Philippines, famous for Cloud 9 wave.',
                'Siargao is also known for its beautiful lagoons and rock pools.'
            ] },
            { name: 'Vigan', lat: 17.5747, lon: 120.3869, facts: [
                'Vigan is a UNESCO World Heritage City known for its preserved Spanish colonial streets.',
                'Vigan is famous for its local delicacy, Vigan longganisa.'
            ] },
            { name: 'Bohol', lat: 9.84999, lon: 124.1435, facts: [
                'Bohol is famous for the Chocolate Hills, a unique geological formation of over 1,200 hills.',
                'The Philippine Tarsier, one of the world\'s smallest primates, can be found in Bohol.'
            ] },
            { name: 'Iloilo', lat: 10.7202, lon: 122.5621, facts: [
                'Iloilo is known for its grand Dinagyang Festival and historic Spanish-era churches.',
                'The city is called the "Heart of the Philippines" due to its central location and warm people.'
            ] },
        ];

        // State variables
        let currentLocation = featuredDestinations[Math.floor(Math.random() * featuredDestinations.length)];
        let customLocation = '';
        let searchResults = [];
        let lastLocation = null;

        // DOM elements
        const searchForm = document.getElementById('searchForm');
        const searchInput = document.getElementById('searchInput');
        const clearButton = document.getElementById('clearButton');
        const searchButton = document.getElementById('searchButton');
        const featuredButtons = document.getElementById('featuredButtons');
        const currentLocationElement = document.getElementById('currentLocation');
        const weatherContent = document.getElementById('weatherContent');
        const factContent = document.getElementById('factContent');
        const searchResultsElement = document.getElementById('searchResults');

        // Get API key from config
        function getApiKey() {
            if (typeof CONFIG !== 'undefined' && CONFIG.OPENWEATHER_API_KEY && CONFIG.OPENWEATHER_API_KEY !== 'YOUR_API_KEY_WILL_BE_HERE') {
                return CONFIG.OPENWEATHER_API_KEY;
            } else {
                showError('API configuration missing. Please check deployment.');
                return null;
            }
        }

        // Initialize the app
        function init() {
            // Set up event listeners
            searchForm.addEventListener('submit', handleSearch);
            clearButton.addEventListener('click', clearSearch);
            searchInput.addEventListener('input', updateCustomLocation);
            
            // Initialize featured buttons
            renderFeaturedButtons();
            
            // Load initial weather and fact
            fetchWeather(currentLocation);
            setLocationFact(currentLocation);
            
            // Set up auto-rotation
            setInterval(() => {
                if (!customLocation) {
                    const nextDest = featuredDestinations[Math.floor(Math.random() * featuredDestinations.length)];
                    currentLocation = nextDest;
                    fetchWeather(nextDest);
                    setLocationFact(nextDest);
                    updateUI();
                }
            }, 30000);
        }

        // Render featured destination buttons
        function renderFeaturedButtons() {
            featuredButtons.innerHTML = '';
            featuredDestinations.forEach(dest => {
                const button = document.createElement('button');
                button.className = `featured-button ${currentLocation.name === dest.name ? 'active' : ''}`;
                button.textContent = dest.name;
                button.addEventListener('click', () => selectFeaturedDestination(dest));
                featuredButtons.appendChild(button);
            });
        }

        // Handle search form submission
        function handleSearch(e) {
            e.preventDefault();
            if (customLocation.trim()) {
                searchLocation(customLocation);
            }
        }

        // Update custom location from input
        function updateCustomLocation() {
            customLocation = searchInput.value;
        }

        // Clear search input
        function clearSearch() {
            searchInput.value = '';
            customLocation = '';
            hideSearchResults();
        }

        // Select a featured destination
        function selectFeaturedDestination(dest) {
            currentLocation = dest;
            fetchWeather(dest);
            setLocationFact(dest);
            updateUI();
            hideSearchResults();
        }

        // Search for a location
        async function searchLocation(query) {
            if (!query.trim()) return;
            
            const apiKey = getApiKey();
            if (!apiKey) return;
            
            // Show loading state
            searchButton.innerHTML = '<div class="spinner"></div> Searching...';
            searchButton.disabled = true;
            hideSearchResults();
            
            try {
                const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)},PH&limit=10&appid=${apiKey}`);
                
                if (!response.ok) {
                    throw new Error('Location not found');
                }
                
                const data = await response.json();
                
                if (data.length === 0) {
                    showError('Location not found. Please try a different search term.');
                    return;
                }
                
                if (data.length === 1) {
                    const location = data[0];
                    const newLocation = {
                        name: location.name,
                        lat: location.lat,
                        lon: location.lon,
                        country: location.country,
                        state: location.state
                    };
                    currentLocation = newLocation;
                    await fetchWeather(newLocation);
                    setLocationFact(newLocation);
                    updateUI();
                } else {
                    // Multiple results, show selection
                    searchResults = data.map(location => ({
                        name: location.name,
                        lat: location.lat,
                        lon: location.lon,
                        country: location.country,
                        state: location.state
                    }));
                    showSearchResults();
                }
            } catch (error) {
                showError('Unable to find location. Please check your search term.');
            } finally {
                // Reset button state
                searchButton.innerHTML = '<i class="fas fa-search"></i> Search';
                searchButton.disabled = false;
            }
        }

        // Fetch weather data
        async function fetchWeather(location) {
            const apiKey = getApiKey();
            if (!apiKey) return;
            
            // Show loading state
            weatherContent.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <span>Loading weather data...</span>
                </div>
            `;
            
            try {
                const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric`);
                
                if (!response.ok) {
                    throw new Error('Weather data unavailable');
                }
                
                const weatherData = await response.json();
                renderWeather(weatherData);
            } catch (error) {
                showError('Weather data unavailable');
            }
        }

        // Render weather data
        function renderWeather(weather) {
            weatherContent.innerHTML = `
                <div class="weather-display">
                    <img src="https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png" 
                         alt="${weather.weather[0].main}" class="weather-icon">
                    <div>
                        <h4 class="temperature">${Math.round(weather.main.temp)}°C</h4>
                        <p class="weather-description">${weather.weather[0].description}</p>
                    </div>
                </div>
                <div class="weather-details">
                    <div class="weather-detail">
                        <i class="fas fa-temperature-high"></i>
                        <span>Feels like: ${Math.round(weather.main.feels_like)}°C</span>
                    </div>
                    <div class="weather-detail">
                        <i class="fas fa-wind"></i>
                        <span>Humidity: ${weather.main.humidity}%</span>
                    </div>
                </div>
            `;
        }

        // Set location fact
        function setLocationFact(location) {
            // Show loading state
            factContent.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <span>Loading fun fact...</span>
                </div>
            `;
            
            // Find if it's a featured destination
            const featuredDest = featuredDestinations.find(d => d.name.toLowerCase() === location.name.toLowerCase());
            
            if (featuredDest) {
                // Use one of the predefined facts
                const randomFact = featuredDest.facts[Math.floor(Math.random() * featuredDest.facts.length)];
                setTimeout(() => {
                    factContent.innerHTML = `<p class="fact-content ${lastLocation !== location.name ? 'fade-in' : ''}">${randomFact}</p>`;
                    lastLocation = location.name;
                }, 500);
            } else {
                // For non-featured locations, use Wikipedia API or fallback
                fetchWikipediaFact(location);
            }
        }

        // Fetch Wikipedia fact for non-featured locations
        async function fetchWikipediaFact(location) {
            try {
                // Only fetch Wikipedia for Philippine locations
                if (!location.country || location.country === 'PH' || location.country === 'Philippines') {
                    const searchQuery = `${location.name}, Philippines`;
                    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchQuery)}`);
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.extract) {
                            const extract = data.extract;
                            const sentences = extract.split('. ').slice(0, 2).join('. ');
                            const fact = sentences + (sentences.endsWith('.') ? '' : '.');
                            factContent.innerHTML = `<p class="fact-content ${lastLocation !== location.name ? 'fade-in' : ''}">${fact}</p>`;
                            lastLocation = location.name;
                            return;
                        }
                    }
                }
                
                // Fallback for non-Philippine locations or failed Wikipedia fetch
                const fallbackFacts = [
                    `${location.name} is a unique destination in the Philippines with its own local charm.`,
                    `Discover the culture and attractions of ${location.name}, Philippines.`
                ];
                const randomFact = fallbackFacts[Math.floor(Math.random() * fallbackFacts.length)];
                factContent.innerHTML = `<p class="fact-content ${lastLocation !== location.name ? 'fade-in' : ''}">${randomFact}</p>`;
                lastLocation = location.name;
            } catch (error) {
                // Final fallback
                factContent.innerHTML = `<p class="fact-content ${lastLocation !== location.name ? 'fade-in' : ''}">${location.name} is a fascinating place in the Philippines!</p>`;
                lastLocation = location.name;
            }
        }

        // Show search results
        function showSearchResults() {
            searchResultsElement.innerHTML = '';
            searchResults.forEach((loc, idx) => {
                const item = document.createElement('button');
                item.className = 'search-result-item';
                item.textContent = getDisplayName(loc);
                item.addEventListener('click', () => pickSearchResult(loc));
                searchResultsElement.appendChild(item);
            });
            searchResultsElement.style.display = 'block';
        }

        // Hide search results
        function hideSearchResults() {
            searchResultsElement.style.display = 'none';
        }

        // Pick a search result
        function pickSearchResult(location) {
            currentLocation = location;
            fetchWeather(location);
            setLocationFact(location);
            updateUI();
            hideSearchResults();
        }

        // Get display name for location
        function getDisplayName(location) {
            if (location.state && location.country) {
                return `${location.name}, ${location.state}, ${location.country}`;
            } else if (location.country) {
                return `${location.name}, ${location.country}`;
            }
            return location.name;
        }

        // Show error message
        function showError(message) {
            weatherContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${message}</span>
                </div>
            `;
        }

        // Update UI with current state
        function updateUI() {
            currentLocationElement.textContent = getDisplayName(currentLocation);
            renderFeaturedButtons();
        }

        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', init);