// Attend que le document HTML soit complètement chargé
document.addEventListener('DOMContentLoaded', function () {
  // Récupère le bouton de soumission
  const submitButton = document.getElementById('submit-button');
  // Récupère le champ de saisie de la ville
  const cityInput = document.getElementById('city-input');
  // Récupère la liste d'autocomplétion
  const autocompleteList = document.getElementById('autocomplete-list');

  // Ajoute un écouteur d'événements au bouton de soumission pour déclencher la fonction getWeather
  submitButton.addEventListener('click', getWeather);
  // Ajoute un écouteur d'événements au champ de saisie pour déclencher la fonction getWeather lorsqu'on appuie sur la touche "Enter"
  cityInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();  // Empêche la soumission par défaut du formulaire
      getWeather();
    }
  });
  // Ajoute un écouteur d'événements au champ de saisie pour déclencher la fonction handleInput après une pause de 300 ms après la dernière frappe
  cityInput.addEventListener('input', debounce(handleInput, 300));

  // Ajoute un écouteur d'événements au document pour masquer la liste d'autocomplétion lorsque l'utilisateur clique en dehors du champ de saisie ou de la liste
  document.addEventListener('click', function (event) {
    if (event.target !== cityInput && event.target !== autocompleteList) {
      autocompleteList.innerHTML = '';
      autocompleteList.style.display = 'none';
    }
  });

  // Charge la dernière ville recherchée depuis le stockage local
  const lastSearchedCity = localStorage.getItem('lastSearchedCity');
  if (lastSearchedCity) {
    cityInput.value = lastSearchedCity;
    getWeather(); // Lance automatiquement la recherche météo pour la dernière ville recherchée
  }

  // Fonction appelée lors de la saisie dans le champ de recherche
  async function handleInput() {
    // Obtient le texte saisi dans le champ, supprime les espaces avant et après
    const inputText = cityInput.value.trim();
    // Si le champ est vide, vide la liste d'autocomplétion et la masque
    if (inputText === '') {
      autocompleteList.innerHTML = '';
      autocompleteList.style.display = 'none';
      return;
    }

    try {
      // Récupère la liste des villes autocomplétées depuis l'API
      const cities = await fetchCityAutocomplete(inputText);
      // Affiche les résultats de l'autocomplétion
      displayAutocompleteResults(cities);
    } catch (error) {
      console.error('Error fetching city autocomplete:', error.message);
    }
  }

  // Fonction qui interroge l'API pour obtenir des suggestions de villes
  async function fetchCityAutocomplete(query) {
    const apiKey = '2b2c9d01ac6496165684a510e7f794e8';
    const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=10&appid=${apiKey}`);

    if (!response.ok) {
      throw new Error('City data not available.');
    }

    const data = await response.json();
    return data.map(city => city.name);
  }

  // Fonction pour afficher les résultats de l'autocomplétion
  function displayAutocompleteResults(cities) {
    autocompleteList.innerHTML = '';
    // Pour chaque ville suggérée
    cities.forEach(city => {
      const listItem = document.createElement('li');
      // Définit le texte de l'élément de liste comme le nom de la ville
      listItem.textContent = city;
      // Ajoute un écouteur d'événements pour gérer le clic sur une ville suggérée
      listItem.addEventListener('click', function () {
        cityInput.value = city;
        autocompleteList.innerHTML = '';
        autocompleteList.style.display = 'none';
        getWeather();
      });
      // Ajoute un écouteur d'événements pour gérer la touche "Enter" sur une ville suggérée
      listItem.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          cityInput.value = city;
          autocompleteList.innerHTML = '';
          autocompleteList.style.display = 'none';
          getWeather();
        }
      });
      // Ajoute l'élément de liste à la liste d'autocomplétion
      autocompleteList.appendChild(listItem);
    });

    // Affiche la liste d'autocomplétion
    autocompleteList.style.display = 'block';
  }

  // Fonction pour obtenir les informations météorologiques
  async function getWeather() {
    const apiKey = '2b2c9d01ac6496165684a510e7f794e8';
    const cityElement = document.getElementById('city');
    const countryElement = document.getElementById('country');
    const temperatureElement = document.getElementById('temperature');
    const descriptionElement = document.getElementById('description');
    const iconElement = document.getElementById('icon');
    const dateOptions = { day: 'numeric', month: 'numeric', year: 'numeric' };

    // Vérifie si la ville est saisie
    if (!cityInput.value) {
      console.error('Please enter a city.');
      return;
    }

    try {
      // Appelle l'API pour obtenir les données météorologiques
      const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${cityInput.value}&appid=${apiKey}&units=metric`);

      // Vérifie si la réponse de l'API est réussie
      if (!response.ok) {
        throw new Error('Weather data not available.');
      }

      const data = await response.json();

      // Met à jour les éléments HTML avec les données météorologiques
      cityElement.textContent = data.city.name;
      countryElement.textContent = data.city.country;
      temperatureElement.textContent = `${Math.round(data.list[0].main.temp)}°C`;
      descriptionElement.textContent = data.list[0].weather[0].description;
      iconElement.src = `http://openweathermap.org/img/wn/${data.list[0].weather[0].icon}.png`;
      iconElement.alt = data.list[0].weather[0].description;

      // Enregistre la ville dans le stockage local
      localStorage.setItem('lastSearchedCity', cityInput.value);

      // Crée et affiche les résultats météorologiques
      const resultContainer = document.createElement('div');
      resultContainer.classList.add('result-container');

      const cityTitle = document.createElement('h1');
      cityTitle.textContent = cityInput.value;
      // Ajoute chaque lettre dans un span pour l'effet d'apparition
      cityTitle.innerHTML = cityTitle.textContent
        .split('')
        .map((letter, index) => `<span style="animation-delay: ${0.1 * (index + 1)}s">${letter}</span>`)
        .join('');

      resultContainer.appendChild(cityTitle);

      const cityImageElement = document.createElement('img');
      cityImageElement.src = `https://source.unsplash.com/400x300/?${cityInput.value},city`;
      cityImageElement.alt = `Image of ${cityInput.value}`;
      cityImageElement.classList.add('city-image');
      resultContainer.appendChild(cityImageElement);

      // Crée dynamiquement l'élément wind-speed
      const windSpeedElement = document.createElement('p');
      windSpeedElement.id = 'wind-speed';
      resultContainer.appendChild(windSpeedElement);

      // Pour les 5 prochains jours
      for (let i = 0; i < 5; i++) {
        const forecast = data.list[i * 8];
        const forecastElement = document.createElement('div');
        forecastElement.classList.add('forecast-item');

        const forecastDate = new Date(forecast.dt_txt);
        const formattedDate = forecastDate.toLocaleDateString('en-GB', dateOptions);

        forecastElement.innerHTML = `
          <p>Date: ${formattedDate}</p>
          <p>Temperature: ${Math.round(forecast.main.temp)}°C</p>
          <p>Wind Speed: ${forecast.wind.speed} m/s</p>
          <p>Description: ${forecast.weather[0].description}</p>
          <img src="http://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="${forecast.weather[0].description}">
        `;

        resultContainer.appendChild(forecastElement);
      }

      // Ajoute les résultats météorologiques au corps du document
      document.body.appendChild(resultContainer);
    } catch (error) {
      console.error('Error fetching weather data:', error.message);
    }
  }

  // Fonction qui crée une fonction de délai (debounce) pour retarder l'exécution de la fonction d'entrée
  function debounce(func, delay) {
    let timer;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        func.apply(context, args);
      }, delay);
    };
  }
});
