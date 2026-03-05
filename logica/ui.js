const CODIGOS_WMO = {
    0: "Cielo despejado", 1: "Mayormente despejado", 2: "Parcialmente nublado",
    3: "Nublado", 45: "Niebla", 48: "Niebla con escarcha",
    51: "Llovizna leve", 53: "Llovizna moderada", 55: "Llovizna intensa",
    61: "Lluvia leve", 63: "Lluvia moderada", 65: "Lluvia intensa",
    71: "Nieve leve", 73: "Nieve moderada", 75: "Nieve intensa",
    80: "Chubascos leves", 81: "Chubascos moderados", 82: "Chubascos fuertes",
    95: "Tormenta electrica", 99: "Tormenta con granizo",
};

let graficoActivo = null;

const pantallaCarga = document.getElementById("pantalla-carga");

// Muestra la pantalla de carga con transicion
export const mostrarCargador = () => {
    document.getElementById("estado-vacio").classList.add("oculto");
    document.getElementById("estado-error").classList.add("oculto");
    document.getElementById("seccion-resultado").classList.add("oculto");
    pantallaCarga.getBoundingClientRect(); // fuerza reflow para activar la transicion
    pantallaCarga.classList.add("visible");
};

// Oculta la pantalla de carga con transicion
export const ocultarCargador = () => {
    pantallaCarga.classList.remove("visible");
};

// Muestra la pantalla inicial vacia
export const mostrarVacio = () => {
    ocultarCargador();
    document.getElementById("estado-error").classList.add("oculto");
    document.getElementById("seccion-resultado").classList.add("oculto");
    document.getElementById("estado-vacio").classList.remove("oculto");
};

// Muestra un mensaje de error
export const mostrarError = (mensaje) => {
    ocultarCargador();
    document.getElementById("seccion-resultado").classList.add("oculto");
    document.getElementById("estado-vacio").classList.add("oculto");
    document.getElementById("mensaje-error").textContent = mensaje;
    document.getElementById("estado-error").classList.remove("oculto");
};

// Muestra todos los datos del clima en pantalla
export const renderizarClima = (ciudad, climaActual, proyeccion) => {
    ocultarCargador();
    document.getElementById("estado-vacio").classList.add("oculto");
    document.getElementById("estado-error").classList.add("oculto");

    document.getElementById("nombre-ciudad").textContent =
        `${ciudad.nombre}${ciudad.pais ? ", " + ciudad.pais : ""}`;
    document.getElementById("coordenadas-ciudad").textContent =
        `Lat: ${ciudad.latitud.toFixed(4)} · Lon: ${ciudad.longitud.toFixed(4)}`;

    const descripcion = CODIGOS_WMO[climaActual.weather_code] || "Estado desconocido";
    document.getElementById("descripcion-estado").textContent  = descripcion;
    document.getElementById("valor-temperatura").textContent   = climaActual.temperature_2m ?? "-";
    document.getElementById("sensacion-termica").textContent   = climaActual.apparent_temperature != null ? `Sensacion: ${climaActual.apparent_temperature} C` : "";
    document.getElementById("valor-viento").textContent        = climaActual.wind_speed_10m ?? "-";
    document.getElementById("valor-codigo").textContent        = climaActual.weather_code ?? "-";
    document.getElementById("descripcion-codigo").textContent  = descripcion;

    if (climaActual.time) {
        const fecha = new Date(climaActual.time);
        document.getElementById("valor-hora").textContent  = fecha.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
        document.getElementById("valor-fecha").textContent = fecha.toLocaleDateString("es", { day: "2-digit", month: "long", year: "numeric" });
    }

    if (proyeccion) {
        renderizarGrafico(proyeccion);
        document.getElementById("seccion-proyeccion").style.display = "";
    } else {
        document.getElementById("seccion-proyeccion").style.display = "none";
    }

    document.getElementById("seccion-resultado").classList.remove("oculto");
};

// Dibuja el grafico de proyeccion con Chart.js
const renderizarGrafico = (datosDiarios) => {
    if (graficoActivo) { graficoActivo.destroy(); graficoActivo = null; }

    const claveMax = Object.keys(datosDiarios).find(k => k.startsWith("temperature_2m_max"));
    const claveMin = Object.keys(datosDiarios).find(k => k.startsWith("temperature_2m_min"));
    if (!claveMax || !claveMin) return;

    const mapaAnual = {};
    datosDiarios.time.forEach((fecha, i) => {
        const anio = fecha.substring(0, 4);
        if (!mapaAnual[anio]) mapaAnual[anio] = { sumaMax: 0, sumaMin: 0, conteo: 0 };
        if (datosDiarios[claveMax][i] != null) mapaAnual[anio].sumaMax += datosDiarios[claveMax][i];
        if (datosDiarios[claveMin][i] != null) mapaAnual[anio].sumaMin += datosDiarios[claveMin][i];
        mapaAnual[anio].conteo++;
    });

    const anios = Object.keys(mapaAnual).sort();
    const maximos = anios.map(a => +(mapaAnual[a].sumaMax / mapaAnual[a].conteo).toFixed(1));
    const minimos = anios.map(a => +(mapaAnual[a].sumaMin / mapaAnual[a].conteo).toFixed(1));

    graficoActivo = new Chart(document.getElementById("grafico-clima").getContext("2d"), {
        type: "line",
        data: {
            labels: anios,
            datasets: [
                { label: "Temp. max. (C)", data: maximos, borderColor: "#e74c3c", backgroundColor: "rgba(231,76,60,0.08)", borderWidth: 2, tension: 0.3, pointRadius: 2 },
                { label: "Temp. min. (C)", data: minimos, borderColor: "#2980b9", backgroundColor: "rgba(41,128,185,0.08)", borderWidth: 2, tension: 0.3, pointRadius: 2 },
            ],
        },
        options: {
            responsive: true,
            interaction: { mode: "index", intersect: false },
            plugins: { legend: { position: "top" } },
            scales: { y: { ticks: { callback: v => `${v} C` } } },
        },
    });
};
