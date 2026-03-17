// Redirige al login si el usuario no está autenticado.
if (!window.TicoAutos.isAuthenticated()) {
  window.location.href = "./login.html";
}

// Activa la navegación común del sistema.
window.TicoAutos.bindNavigation();

const buyerChatsList = document.getElementById("buyerChatsList");
const ownerChatsList = document.getElementById("ownerChatsList");

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

// Genera el HTML de una tarjeta de chat.
const renderChatCard = (chat) => {
  const vehicle = chat.vehicle || {};
  const otherUser = chat.otherUser || {};

  return `
    <article class="form-card">
      <div class="section-head">
        <div>
          <h3>${window.TicoAutos.escapeHtml(vehicle.brand || "Vehiculo")} ${window.TicoAutos.escapeHtml(vehicle.model || "")}</h3>
          <p class="page-subtitle">${window.TicoAutos.escapeHtml(vehicle.location || "Ubicacion no registrada")}</p>
        </div>
      </div>

      <p><strong>Ultima pregunta:</strong> ${window.TicoAutos.escapeHtml(chat.lastQuestionText || "Sin mensajes registrados")}</p>
      <p class="muted">
        ${chat.isOwner ? "Interesado" : "Propietario"}:
        ${window.TicoAutos.escapeHtml(otherUser.name || "")}
        ${window.TicoAutos.escapeHtml(otherUser.lastname || "")}
      </p>
      <p class="muted">Ultima actividad: ${formatDate(chat.lastActivityAt)}</p>
      <p class="muted">Estado actual: ${chat.hasPendingQuestion ? "Pendiente de respuesta" : "Respondido"}</p>

      <div class="inline-actions">
        <a class="btn btn-primary" href="./chat.html?id=${vehicle._id}">Abrir chat</a>
        <a class="btn btn-outline" href="./history.html?id=${vehicle._id}">Ver historial</a>
        <a class="btn btn-outline" href="./vehicle.html?id=${vehicle._id}">Ver vehiculo</a>
      </div>
    </article>
  `;
};

// Renderiza una sección de chats dentro de un contenedor.
const renderChatSection = (chats, container, emptyMessage) => {
  if (!chats.length) {
    container.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
    return;
  }

  container.innerHTML = chats.map(renderChatCard).join("");
};

// Carga la bandeja de chats desde el backend.
const loadChats = async () => {
  buyerChatsList.innerHTML = '<div class="empty-state">Cargando tus chats...</div>';
  ownerChatsList.innerHTML = '<div class="empty-state">Cargando chats de tus vehiculos...</div>';

  try {
    const response = await fetch(`${window.TicoAutos.API_BASE}/api/questions/chats`, {
      headers: window.TicoAutos.getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "No fue posible cargar la bandeja de chats.");
    }

    const results = data.results || [];

    // Se separan los chats donde el usuario es comprador o propietario.
    const buyerChats = results.filter((chat) => !chat.isOwner);
    const ownerChats = results.filter((chat) => chat.isOwner);

    // Renderiza los chats iniciados por el usuario.
    renderChatSection(
      buyerChats,
      buyerChatsList,
      "Todavia no has iniciado chats con otros vehiculos."
    );

    // Renderiza los chats recibidos como propietario.
    renderChatSection(
      ownerChats,
      ownerChatsList,
      "Todavia no has recibido consultas en tus vehiculos."
    );
  } catch (error) {
    console.error(error);
    buyerChatsList.innerHTML = '<div class="empty-state">No fue posible cargar tus chats.</div>';
    ownerChatsList.innerHTML = '<div class="empty-state">No fue posible cargar los chats de tus vehiculos.</div>';
  }
};

loadChats();