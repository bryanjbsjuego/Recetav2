document.addEventListener("DOMContentLoaded", () => {
    registrarServiceWorker();
    solicitarPermisoNotificacion();
    cargarRecetas();
});


document.getElementById("btn-notificacion").addEventListener("click", () => {
    alert("📢 Notificaciones activadas");
    Notification.requestPermission().then(permission => {
        console.log("📢 Permiso de notificación:", permission);
        if (permission === "granted") {
            new Notification("Notificaciones activadas", {
                body: "Ahora recibirás alertas.",
                icon: "https://cdn-icons-png.flaticon.com/512/3095/3095583.png"
            });
        }
    }).catch(err => console.error("❌ Error al pedir permiso:", err));
});


const formReceta = document.getElementById("form-receta");
const listaMedicamentos = document.getElementById("lista-medicamentos");

// ✅ Registrar Service Worker
function registrarServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js")
            .then((registration) => {
                console.log("✅ Service Worker registrado con éxito:", registration);
                console.log("📢 Estado del SW:", registration.active ? "Activo" : "No activo");
            })
            .catch((error) => console.error("❌ Error al registrar el Service Worker:", error));
    } else {
        console.warn("⚠️ Service Worker no soportado en este navegador.");
    }
}

// ✅ Pedir permiso de notificación
function solicitarPermisoNotificacion() {
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            console.log("Permiso de notificación:", permission);
        });
    }
}

// ✅ Guardar receta
formReceta.addEventListener("submit", (e) => {
    e.preventDefault();

    const medicamento = document.getElementById("medicamento").value;
    const dosis = parseInt(document.getElementById("dosis").value);
    const duracion = parseInt(document.getElementById("duracion").value);
    const horaInicio = document.getElementById("horaInicio").value;

    const receta = generarReceta(medicamento, dosis, duracion, horaInicio);
    guardarReceta(receta);
    mostrarRecetas();
    programarNotificaciones();
    
    formReceta.reset();
});

// ✅ Generar horarios de receta
function generarReceta(medicamento, dosis, duracion, horaInicio) {
    let horarios = [];
    let fechaInicio = new Date();
    let [hora, minutos] = horaInicio.split(":").map(Number);
    fechaInicio.setHours(hora, minutos, 0, 0);

    let totalTomas = (duracion * 24) / dosis;
    for (let i = 0; i < totalTomas; i++) {
        let toma = new Date(fechaInicio.getTime() + i * dosis * 60 * 60 * 1000);
        horarios.push({
            fecha: toma.toLocaleDateString(),
            hora: toma.toLocaleTimeString(),
            completado: false
        });
    }

    return { medicamento, horarios };
}

// ✅ Guardar en localStorage
function guardarReceta(receta) {
    let recetas = JSON.parse(localStorage.getItem("recetas")) || [];
    recetas.push(receta);
    localStorage.setItem("recetas", JSON.stringify(recetas));
}

function eliminarReceta(index) {
    let recetas = JSON.parse(localStorage.getItem("recetas")) || [];
    recetas.splice(index, 1); // Elimina la receta en la posición 'index'
    localStorage.setItem("recetas", JSON.stringify(recetas)); // Guarda el nuevo array
    mostrarRecetas(); // Vuelve a mostrar la lista actualizada
}

// ✅ Mostrar recetas
function mostrarRecetas() {
    listaMedicamentos.innerHTML = "";
    let recetas = JSON.parse(localStorage.getItem("recetas")) || [];

    recetas.forEach((receta, index) => {
        let acordeon = `
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed bg-success text-white" 
                        data-bs-toggle="collapse" data-bs-target="#collapse-${index}">
                        ${receta.medicamento}
                    </button>
                </h2>
                <div id="collapse-${index}" class="accordion-collapse collapse">
                    <div class="accordion-body">
                        <ul class="list-group">
                            ${receta.horarios.map((toma, i) => `
                                <li class="list-group-item">
                                    <input type="checkbox" class="form-check-input me-2" 
                                        data-index="${index}" data-toma="${i}" ${toma.completado ? 'checked' : ''}>
                                    ${toma.fecha} - ${toma.hora}
                                </li>
                            `).join('')}
                        </ul>
                        <button class="btn btn-danger mt-3 w-100" onclick="eliminarReceta(${index})">
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
        listaMedicamentos.innerHTML += acordeon;
    });
}

// ✅ Programar Notificaciones
function programarNotificaciones() {
    let recetas = JSON.parse(localStorage.getItem("recetas")) || [];

    recetas.forEach((receta) => {
        receta.horarios.forEach((toma) => {
            let fechaToma = new Date(`${toma.fecha} ${toma.hora}`);
            let tiempoFaltante = fechaToma - new Date();

            if (tiempoFaltante > 0) {
                setTimeout(() => {
                    enviarNotificacionSW(receta.medicamento, toma.hora);
                }, tiempoFaltante);
            }
        });
    });
}

// ✅ Enviar Notificación al Service Worker
function enviarNotificacionSW(medicamento, hora) {
    if (Notification.permission === "granted") {
        navigator.serviceWorker.ready.then(registration => {
            registration.active.postMessage({
                title: "Hora de tu medicamento",
                body: `Es hora de tomar ${medicamento} (${hora}).`,
                icon: "https://cdn-icons-png.flaticon.com/512/3095/3095583.png"
            });
        });
    }
}

// ✅ Cargar recetas al iniciar
function cargarRecetas() {
    mostrarRecetas();
    programarNotificaciones();
}
