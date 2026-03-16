// Redirige al login si el usuario no está autenticado.
if (!window.TicoAutos.isAuthenticated()) {
  window.location.href = "./login.html";
}

// Activa la navegación general de la aplicación.
window.TicoAutos.bindNavigation();

// Obtiene el id del vehículo desde la URL.
const params = new URLSearchParams(window.location.search);
const vehicleId = params.get("id");

const historyHeader = document.getElementById("historyHeader");
const historyContent = document.getElementById("historyContent");

// Formatea fechas al formato local de Costa Rica.
const formatDate = (value) => {
  if (!value) {
    return "Sin registro";
  }

  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

// Genera el HTML de un registro de pregunta/respuesta del historial.
const renderHistoryItem = (question) => `
  <article class="form-card">
    <p><strong>Pregunta:</strong> ${window.TicoAutos.escapeHtml(question.questionText)}</p>
    <p class="muted">
      Usuario que pregunta:
      ${window.TicoAutos.escapeHtml(question.askedByUserId?.name || "")}
      ${window.TicoAutos.escapeHtml(question.askedByUserId?.lastname || "")}
    </p>
    <p class="muted">Fecha de pregunta: ${formatDate(question.askedAt)}</p>

    ${
      question.status === "answered"
        ? `
          <p><strong>Respuesta:</strong> ${window.TicoAutos.escapeHtml(question.answerText)}</p>
          <p class="muted">
            Usuario que responde:
            ${window.TicoAutos.escapeHtml(question.answeredByUserId?.name || "")}
            ${window.TicoAutos.escapeHtml(question.answeredByUserId?.lastname || "")}
          </p>
          <p class="muted">Fecha de respuesta: ${formatDate(question.answeredAt)}</p>
        `
        : '<p class="muted">Estado actual: Pendiente de respuesta.</p>'
    }
  </article>
`;

// Carga el historial de preguntas y respuestas del vehículo.
const loadHistory = async () => {
  // Verifica que exista un id de vehículo en la URL.
  if (!vehicleId) {
    historyHeader.innerHTML = '<div class="empty-state">No fue posible identificar el historial solicitado.</div>';
    historyContent.innerHTML = "";
    return;
  }

  // Muestra mensaje de carga mientras se obtiene la información.
  historyHeader.innerHTML = '<div class="empty-state">Cargando historial...</div>';
  historyContent.innerHTML = "";

  try {
    // Solicita al backend el historial de preguntas del vehículo.
    const response = await fetch(`${window.TicoAutos.API_BASE}/api/questions/vehicle/${vehicleId}`, {
      headers: window.TicoAutos.getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "No fue posible cargar el historial del vehiculo.");
    }

    const vehicle = data.vehicle || {};
    const questions = data.results || [];

    // Renderiza el encabezado del historial.
    historyHeader.innerHTML = `
      <div class="section-head">
        <div>
          <h1>Historial de ${window.TicoAutos.escapeHtml(vehicle.brand || "Vehiculo")} ${window.TicoAutos.escapeHtml(vehicle.model || "")}</h1>
          <p class="page-subtitle">Registro completo de preguntas y respuestas asociadas a este vehiculo.</p>
        </div>
        <div class="inline-actions">
          <a class="btn btn-outline" href="./chat.html?id=${vehicle._id}">Volver al chat</a>
          <a class="btn btn-outline" href="./vehicle.html?id=${vehicle._id}">Ver vehiculo</a>
        </div>
      </div>
    `;

    // Renderiza todas las preguntas del historial o un mensaje si no existen.
    historyContent.innerHTML = questions.length
      ? questions.map(renderHistoryItem).join("")
      : '<div class="empty-state">Todavia no existen registros para este vehiculo.</div>';
  } catch (error) {
    console.error(error);
    historyHeader.innerHTML = '<div class="empty-state">No fue posible cargar el historial solicitado.</div>';
    historyContent.innerHTML = "";
  }
};

loadHistory();