const UNSPLASH_ACCESS_KEY = "v-KOWSDxVYDsPSpPH89f0LhM3oUdJnAwuQri9fjTMo8";
const WEATHER_API_KEY = "37cb84cca39fb0ca74161e505ce6f7e6";

/* list of historic places (Karnataka) */
const places = [
  { name: "Hampi", city: "Hampi" },
  { name: "Mysore Palace", city: "Mysore" },
  { name: "Gol Gumbaz", city: "Vijayapura" },
  { name: "Badami Caves", city: "Badami" },
  { name: "Aihole", city: "Aihole" },
  { name: "Pattadakal", city: "Pattadakal" },
  { name: "Belur", city: "Belur" },
  { name: "Halebidu", city: "Halebidu" },
  { name: "Chitradurga Fort", city: "Chitradurga" },
  { name: "Shravanabelagola", city: "Shravanabelagola" },
  { name: "Bidar Fort", city: "Bidar" },
  { name: "Srirangapatna", city: "Srirangapatna" },
  { name: "Nandi Hills", city: "Chikkaballapur" },
  { name: "Somnathpura", city: "Somnathpura" }
];

const placesContainer = document.getElementById("places");
const loader = document.getElementById("loader");
const searchBar = document.getElementById("searchBar");

let placesData = [];            // cached objects with img & weather
const PLACEHOLDER = "https://via.placeholder.com/600x400?text=No+Image";

/* helper: fetch an image from Unsplash (uses Authorization header) */
async function fetchPhoto(placeName) {
  try {
    const url = new URL("https://api.unsplash.com/search/photos");
    url.search = new URLSearchParams({ query: `${placeName} Karnataka`, per_page: "1" });

    const res = await fetch(url.toString(), {
      headers: { Authorization: "Client-ID " + UNSPLASH_ACCESS_KEY }
    });

    if (!res.ok) {
      throw new Error(`Unsplash ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    return json.results?.[0]?.urls?.small || PLACEHOLDER;
  } catch (err) {
    console.error("fetchPhoto error:", err);
    return PLACEHOLDER;
  }
}

/* helper: fetch weather from OpenWeatherMap */
async function fetchWeather(city) {
  try {
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.search = new URLSearchParams({ q: `${city},IN`, appid: WEATHER_API_KEY, units: "metric" });

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`OpenWeather ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    return {
      text: `${Math.round(json.main.temp)}°C, ${json.weather[0].description}`,
      raw: json
    };
  } catch (err) {
    console.error("fetchWeather error:", err);
    return { text: "Weather unavailable" };
  }
}

/* load all data in parallel (for each place we request photo+weather in parallel) */
async function loadData() {
  loader.style.display = "block";
  loader.textContent = "Loading places — fetching photos & weather…";

  // Map each place to a promise that resolves to a full data object
  const fetchPromises = places.map(async (p) => {
    const [imgUrl, weather] = await Promise.all([
      fetchPhoto(p.name),
      fetchWeather(p.city)
    ]);
    return { ...p, imgUrl, weatherText: weather.text || "Unavailable" };
  });

  // Wait for all
  placesData = await Promise.all(fetchPromises);
  loader.style.display = "none";
  renderPlaces();
}

/* Render cards from cached placesData (local filtering) */
function renderPlaces(filter = "") {
  placesContainer.innerHTML = "";
  const query = filter.trim().toLowerCase();
  const filtered = placesData.filter(p => p.name.toLowerCase().includes(query) || p.city.toLowerCase().includes(query));

  if (filtered.length === 0) {
    placesContainer.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#666;">No matching places found.</p>`;
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img src="${p.imgUrl}" alt="${p.name}">
      <div class="card-body">
        <div class="card-title">${p.name}</div>
        <div class="card-row">${p.city} <span style="color:#999">•</span> <span>${p.weatherText}</span></div>

        <div class="card-actions">
          <button class="btn link" data-place="${p.name}">View Info</button>
          <a class="btn primary" href="https://www.google.com/maps/search/${encodeURIComponent(p.name + " " + p.city)}" target="_blank" rel="noopener">Open in Maps</a>
        </div>
      </div>
    `;

    // "View Info" opens Wikipedia in new tab (quick)
    card.querySelector("[data-place]").addEventListener("click", (e) => {
      const placeName = e.currentTarget.dataset.place;
      const wiki = `https://en.wikipedia.org/wiki/${encodeURIComponent(placeName)}`;
      window.open(wiki, "_blank", "noopener");
    });

    placesContainer.appendChild(card);
  });
}

/* search listener (filter locally, instant) */
searchBar.addEventListener("input", (e) => {
  renderPlaces(e.target.value);
});

/* Start */
loadData().catch(err => {
  console.error("loadData error", err);
  loader.textContent = "Failed to load some data — check the console.";
});
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("places-container");

  places.forEach(place => {
    const card = document.createElement("div");
    card.classList.add("place-card");

    card.innerHTML = `
      <img src="${place.image}" alt="${place.name}">
      <h2>${place.name}</h2>
      <p>${place.description}</p>
      <small>${place.location}</small>
    `;

    container.appendChild(card);
  });
});
