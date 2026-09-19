/* ===== Painel Meteorológico (API OpenWeather) ===== */

const API_BASE = "https://api.openweathermap.org/data/2.5";

let tempChart = null;
let humidityChart = null;
let hourlyChart = null;

// Ícones do OpenWeather (ex.: "04d") -> emoji
const ICONS = {
    "01d": "☀️", "01n": "🌙",
    "02d": "⛅", "02n": "☁️",
    "03d": "☁️", "03n": "☁️",
    "04d": "☁️", "04n": "☁️",
    "09d": "🌦️", "09n": "🌧️",
    "10d": "🌦️", "10n": "🌧️",
    "11d": "⛈️", "11n": "⛈️",
    "13d": "🌨️", "13n": "🌨️",
    "50d": "🌫️", "50n": "🌫️"
};

// AQI (índice de qualidade do ar) 1-5 -> rótulo e cor
const AQI_INFO = {
    1: ["Boa", "#22c55e"],
    2: ["Justa", "#a3e635"],
    3: ["Moderada", "#f59e0b"],
    4: ["Ruim", "#ef4444"],
    5: ["Péssima", "#a855f7"]
};

const POLLUTANTS = [
    ["pm2_5", "PM2.5"],
    ["pm10", "PM10"],
    ["o3", "O₃"],
    ["no2", "NO₂"],
    ["so2", "SO₂"],
    ["co", "CO"]
];

function iconFor(iconCode) {
    return ICONS[iconCode] || "❔";
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function showError(msg) {
    document.getElementById("result").innerHTML =
        `<div class="error">⚠️ ${msg}</div>`;
    document.getElementById("airQuality").innerHTML = "";
}

function checkKey() {
    if (!API_KEY || API_KEY === "COLE_SUA_CHAVE_AQUI") {
        showError("Chave da API ausente. Cole sua chave no arquivo js/config.js");
        return false;
    }
    return true;
}

async function fetchJson(url) {
    const res = await fetch(url);
    if (res.status === 401) throw new Error("Chave da API inválida. Verifique js/config.js");
    if (res.status === 429) throw new Error("Limite de requisições atingido. Aguarde um minuto.");
    if (!res.ok) throw new Error("Falha ao consultar o clima.");
    return res.json();
}

// Busca por cidade digitada
async function fetchWeather() {
    if (!checkKey()) return;

    const city = document.getElementById("cityInput").value.trim();
    if (!city) {
        showError("Digite o nome de uma cidade.");
        return;
    }

    document.getElementById("result").innerHTML =
        '<div class="loading">⏳ Consultando...</div>';

    try {
        const geo = await fetchJson(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`
        );
        if (!geo.length) {
            showError(`Cidade "${city}" não encontrada.`);
            return;
        }
        const { lat, lon, name, country } = geo[0];
        await loadWeather(lat, lon, name, country);
    } catch (err) {
        showError(err.message || "Erro inesperado. Tente novamente.");
    }
}

// Busca pela localização do dispositivo
function useMyLocation() {
    if (!checkKey()) return;

    if (!navigator.geolocation) {
        showError("Seu navegador não suporta geolocalização.");
        return;
    }

    document.getElementById("result").innerHTML =
        '<div class="loading">📍 Obtendo sua localização...</div>';

    navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
            const { latitude, longitude } = coords;
            let name = "Minha localização";
            let country = "";

            // Geocodificação reversa (BigDataCloud, gratuito, sem chave)
            try {
                const rg = await fetchJson(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`
                );
                name = rg.city || rg.locality || name;
                country = rg.countryName || "";
            } catch {
                // segue com nome genérico
            }

            await loadWeather(latitude, longitude, name, country);
        },
        () => showError("Não foi possível obter sua localização. Permita o acesso e tente de novo."),
        { timeout: 10000 }
    );
}

// Carrega todos os dados a partir de coordenadas
async function loadWeather(lat, lon, name, country) {
    document.getElementById("result").innerHTML =
        '<div class="loading">⏳ Consultando...</div>';

    try {
        const [current, forecast, pollution] = await Promise.all([
            fetchJson(`${API_BASE}/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt&appid=${API_KEY}`),
            fetchJson(`${API_BASE}/forecast?lat=${lat}&lon=${lon}&units=metric&lang=pt&appid=${API_KEY}`),
            fetchJson(`${API_BASE}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`).catch(() => null)
        ]);

        renderCurrent(current, name, country);
        const days = groupByDay(forecast.list);
        renderForecast(days);
        renderCharts(days);
        renderHourlyChart(forecast.list);
        renderAirQuality(pollution);
    } catch (err) {
        showError(err.message || "Erro inesperado. Tente novamente.");
    }
}

// Agrupa as entradas de 3 em 3 horas por dia
function groupByDay(list) {
    const byDate = {};
    for (const item of list) {
        const date = item.dt_txt.slice(0, 10);
        (byDate[date] ||= []).push(item);
    }

    return Object.entries(byDate).map(([date, items]) => {
        const noon = items.find(i => i.dt_txt.includes("12:00")) ?? items[0];
        return {
            date,
            max: Math.max(...items.map(i => i.main.temp_max)),
            min: Math.min(...items.map(i => i.main.temp_min)),
            humidity: Math.round(items.reduce((s, i) => s + i.main.humidity, 0) / items.length),
            icon: noon.weather[0].icon,
            desc: noon.weather[0].description
        };
    });
}

function formatTime(unixSeconds) {
    return new Date(unixSeconds * 1000).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function renderCurrent(data, name, country) {
    const w = data.weather[0];
    const local = [name, data.sys?.country || country].filter(Boolean).join(", ");

    document.getElementById("result").innerHTML = `
        <div class="current-card">
            <div>
                <div class="city">${local}</div>
                <div class="desc">${capitalize(w.description)}</div>
            </div>
            <div class="temp">${Math.round(data.main.temp)}°C</div>
            <div class="icon">${iconFor(w.icon)}</div>
            <div class="current-details">
                <span>Sensação: <strong>${Math.round(data.main.feels_like)}°C</strong></span>
                <span>Umidade: <strong>${data.main.humidity}%</strong></span>
                <span>Vento: <strong>${Math.round(data.wind.speed * 3.6)} km/h</strong></span>
                <span>🌅 Nascer do sol: <strong>${formatTime(data.sys.sunrise)}</strong></span>
                <span>🌇 Pôr do sol: <strong>${formatTime(data.sys.sunset)}</strong></span>
            </div>
        </div>`;
}

function renderAirQuality(data) {
    const el = document.getElementById("airQuality");
    const item = data?.list?.[0];
    if (!item) {
        el.innerHTML = "";
        return;
    }

    const [label, color] = AQI_INFO[item.main.aqi] || ["Indisponível", "#64748b"];
    const comps = POLLUTANTS.map(([key, displayName]) => `
        <div class="air-item">
            <div class="air-name">${displayName}</div>
            <div class="air-val">${Math.round(item.components[key])}</div>
        </div>`).join("");

    el.innerHTML = `
        <div class="air-card">
            <div class="air-head">
                <h3>🫁 Qualidade do ar</h3>
                <span class="aqi-badge" style="background:${color}">${item.main.aqi} · ${label}</span>
            </div>
            <div class="air-grid">${comps}</div>
            <div class="air-note">Concentrações em µg/m³</div>
        </div>`;
}

function renderForecast(days) {
    const names = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    const html = days.map((d, i) => {
        const date = new Date(d.date + "T12:00:00");
        const label = i === 0 ? "Hoje" : names[date.getDay()];
        return `
            <div class="forecast-card" title="${capitalize(d.desc)}">
                <div class="day">${label}</div>
                <div class="f-icon">${iconFor(d.icon)}</div>
                <div class="max">${Math.round(d.max)}°</div>
                <div class="min">${Math.round(d.min)}°</div>
            </div>`;
    }).join("");

    document.getElementById("forecastCards").innerHTML = html;
}

function renderCharts(days) {
    const labels = days.map(d =>
        new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    );

    const chartDefaults = {
        responsive: true,
        plugins: { legend: { labels: { color: "#e2e8f0" } } },
        scales: {
            x: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" } },
            y: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" } }
        }
    };

    // Temperatura (máx/mín)
    if (tempChart) tempChart.destroy();
    tempChart = new Chart(document.getElementById("tempChart"), {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Máxima (°C)",
                    data: days.map(d => Math.round(d.max)),
                    borderColor: "#f97316",
                    backgroundColor: "rgba(249,115,22,0.15)",
                    fill: true,
                    tension: 0.35
                },
                {
                    label: "Mínima (°C)",
                    data: days.map(d => Math.round(d.min)),
                    borderColor: "#38bdf8",
                    backgroundColor: "rgba(56,189,248,0.15)",
                    fill: true,
                    tension: 0.35
                }
            ]
        },
        options: chartDefaults
    });

    // Umidade média por dia
    if (humidityChart) humidityChart.destroy();
    humidityChart = new Chart(document.getElementById("humidityChart"), {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Umidade média (%)",
                data: days.map(d => d.humidity),
                backgroundColor: "rgba(129,140,248,0.6)",
                borderRadius: 6
            }]
        },
        options: {
            ...chartDefaults,
            scales: {
                ...chartDefaults.scales,
                y: { ...chartDefaults.scales.y, max: 100 }
            }
        }
    });
}

// Gráfico de 3 em 3 horas (próximas 24h)
function renderHourlyChart(list) {
    const items = list.slice(0, 8);
    const labels = items.map(i => formatTime(i.dt));

    if (hourlyChart) hourlyChart.destroy();
    hourlyChart = new Chart(document.getElementById("hourlyChart"), {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "Temperatura (°C)",
                    data: items.map(i => Math.round(i.main.temp)),
                    borderColor: "#f97316",
                    backgroundColor: "rgba(249,115,22,0.15)",
                    fill: true,
                    tension: 0.35,
                    yAxisID: "y"
                },
                {
                    label: "Umidade (%)",
                    data: items.map(i => i.main.humidity),
                    borderColor: "#818cf8",
                    backgroundColor: "rgba(129,140,248,0.1)",
                    tension: 0.35,
                    yAxisID: "y1"
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: "#e2e8f0" } } },
            scales: {
                x: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" } },
                y: { position: "left", ticks: { color: "#f97316" }, grid: { color: "#334155" } },
                y1: { position: "right", min: 0, max: 100, ticks: { color: "#818cf8" }, grid: { drawOnChartArea: false } }
            }
        }
    });
}

// Buscar com a tecla Enter
document.getElementById("cityInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") fetchWeather();
});
