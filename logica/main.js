import { geocodificarCiudad, obtenerClimaActual, obtenerProyeccionClimatica } from "./service.js";
import { mostrarCargador, mostrarVacio, mostrarError, renderizarClima } from "./ui.js";

const formularioBusqueda = document.getElementById("formulario-busqueda");
const entradaCiudad      = document.getElementById("entrada-ciudad");
const botonBuscar        = document.getElementById("boton-buscar");
const botonReintentar    = document.getElementById("boton-reintentar");
const cargaTexto         = document.getElementById("carga-texto");
const cargaSubtexto      = document.getElementById("carga-subtexto");

let ultimaBusqueda = "";

// Espera un numero de milisegundos antes de continuar
const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

const buscarCiudad = async (nombreCiudad) => {
    const consulta = nombreCiudad.trim();
    if (!consulta) return;

    ultimaBusqueda = consulta;
    botonBuscar.disabled = true;

    // Mostrar pantalla de carga al presionar Buscar
    cargaTexto.textContent    = "Buscando ciudad...";
    cargaSubtexto.textContent = "Obteniendo coordenadas geograficas";
    mostrarCargador();

    try {
        // Geocodificar y esperar minimo 2 segundos en paralelo
        const [ciudad] = await Promise.all([geocodificarCiudad(consulta), esperar(2000)]);

        cargaTexto.textContent    = "Ciudad encontrada";
        cargaSubtexto.textContent = "Consultando datos del clima...";

        const [resultadoClima, resultadoProyeccion] = await Promise.allSettled([
            obtenerClimaActual(ciudad.latitud, ciudad.longitud, ciudad.zonaHoraria),
            obtenerProyeccionClimatica(ciudad.latitud, ciudad.longitud),
        ]);

        if (resultadoClima.status === "rejected") throw resultadoClima.reason;

        const climaActual = resultadoClima.value;
        const proyeccion  = resultadoProyeccion.status === "fulfilled" ? resultadoProyeccion.value : null;

        renderizarClima(ciudad, climaActual, proyeccion);

    } catch (error) {
        mostrarError(error.message || "No se pudo obtener el clima. Intenta de nuevo.");
    } finally {
        botonBuscar.disabled = false;
    }
};

formularioBusqueda.addEventListener("submit", (evento) => {
    evento.preventDefault();
    buscarCiudad(entradaCiudad.value);
});

botonReintentar.addEventListener("click", () => {
    ultimaBusqueda ? buscarCiudad(ultimaBusqueda) : mostrarVacio();
});

mostrarVacio();
