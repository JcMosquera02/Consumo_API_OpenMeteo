const URL_GEOCODIFICACION = "https://geocoding-api.open-meteo.com/v1/search";
const URL_CLIMA_ACTUAL    = "https://api.open-meteo.com/v1/forecast";
const URL_PROYECCION      = "https://climate-api.open-meteo.com/v1/climate";

// Convierte el nombre de una ciudad en coordenadas geograficas
export const geocodificarCiudad = async (nombreCiudad) => {
    const respuesta = await fetch(`${URL_GEOCODIFICACION}?name=${encodeURIComponent(nombreCiudad)}&count=1&language=es&format=json`);
    const datos = await respuesta.json();

    if (!datos.results || datos.results.length === 0) {
        throw new Error(`No se encontro la ciudad "${nombreCiudad}". Verifica la ortografia.`);
    }

    const ciudad = datos.results[0];
    return {
        nombre:      ciudad.name,
        pais:        ciudad.country || "",
        latitud:     ciudad.latitude,
        longitud:    ciudad.longitude,
        zonaHoraria: ciudad.timezone || "UTC",
    };
};

// Consulta el clima actual usando las coordenadas de la ciudad
export const obtenerClimaActual = async (latitud, longitud, zonaHoraria = "auto") => {
    const respuesta = await fetch(`${URL_CLIMA_ACTUAL}?latitude=${latitud}&longitude=${longitud}&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code&timezone=${zonaHoraria}`);
    const datos = await respuesta.json();

    if (!datos.current) {
        throw new Error("La API no devolvio datos de clima actual. Intenta de nuevo.");
    }

    return datos.current;
};

// Consulta la proyeccion climatica anual entre 2010 y 2050
export const obtenerProyeccionClimatica = async (latitud, longitud) => {
    const modelos = "CMCC_CM2_VHR4,FGOALS_f3_H,HiRAM_SIT_HR,MRI_AGCM3_2_S,EC_Earth3P_HR,MPI_ESM1_2_XR,NICAM16_8S";
    const respuesta = await fetch(`${URL_PROYECCION}?latitude=${latitud}&longitude=${longitud}&start_date=2010-01-01&end_date=2050-12-31&models=${modelos}&daily=temperature_2m_max,temperature_2m_min`);
    const datos = await respuesta.json();

    return datos.daily || null;
};
