const API_BASE = "http://localhost:3000";
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 520'%3E%3Crect width='800' height='520' fill='%230e2433'/%3E%3Cpath d='M145 330h40l38-92h257l56 92h84' fill='none' stroke='%23f4c95d' stroke-width='18' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='250' cy='350' r='34' fill='%23f4c95d'/%3E%3Ccircle cx='542' cy='350' r='34' fill='%23f4c95d'/%3E%3Ctext x='50%25' y='120' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Verdana' font-size='42'%3ETicoAutos%3C/text%3E%3C/svg%3E";

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const escapeHtml = (value = "") =>
  `${value}`
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const getToken = () => sessionStorage.getItem("token");
const getUserId = () => sessionStorage.getItem("userId");
const isAuthenticated = () => Boolean(getToken());

const getAuthHeaders = (headers = {}) => {
  const token = getToken();
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
};

const buildImageUrl = (imagePath) => {
  if (!imagePath) {
    return PLACEHOLDER_IMAGE;
  }

  if (imagePath.startsWith("http") || imagePath.startsWith("data:")) {
    return imagePath;
  }

  return `${API_BASE}${imagePath}`;
};

const getVehicleImage = (vehicle) => buildImageUrl(vehicle.images?.[0]);

const showMessagesPlaceholder = () => {
  alert("La seccion de mensajes estara disponible mas adelante.");
};

const logout = async () => {
  const token = getToken();

  if (token) {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.error("Error en logout:", error);
    }
  }

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("userId");
  sessionStorage.removeItem("lastEmail");
  window.location.href = "./login.html";
};

const bindNavigation = () => {
  const authOnly = document.querySelectorAll("[data-auth='private']");
  const guestOnly = document.querySelectorAll("[data-auth='guest']");
  const userLabel = document.querySelector("[data-user-label]");
  const logoutButtons = document.querySelectorAll("[data-logout]");
  const placeholderButtons = document.querySelectorAll("[data-messages-placeholder]");

  authOnly.forEach((element) => {
    element.hidden = !isAuthenticated();
  });

  guestOnly.forEach((element) => {
    element.hidden = isAuthenticated();
  });

  if (userLabel) {
    userLabel.textContent = isAuthenticated() ? "Mi cuenta" : "Invitado";
  }

  logoutButtons.forEach((button) => {
    button.addEventListener("click", logout);
  });

  placeholderButtons.forEach((button) => {
    button.addEventListener("click", showMessagesPlaceholder);
  });
};

const createVehicleCard = (vehicle, options = {}) => {
  const {
    showOwner = true,
    showActions = false,
    onEdit,
    onDelete,
    onSold,
  } = options;
  const card = document.createElement("article");
  card.className = "vehicle-card";

  const ownerName = vehicle.owner
    ? `${vehicle.owner.name} ${vehicle.owner.lastname}`
    : vehicle.userId
      ? `${vehicle.userId.name} ${vehicle.userId.lastname}`
      : "Sin propietario";

  card.innerHTML = `
    <a class="vehicle-card-media" href="./vehicle.html?id=${vehicle._id}">
      <img src="${getVehicleImage(vehicle)}" alt="${escapeHtml(vehicle.brand)} ${escapeHtml(vehicle.model)}" />
      <span class="vehicle-badge ${vehicle.status === "vendido" ? "sold" : ""}">
        ${vehicle.status === "vendido" ? "Vendido" : "Disponible"}
      </span>
    </a>
    <div class="vehicle-card-body">
      <div class="vehicle-card-top">
        <div>
          <p class="vehicle-kicker">${escapeHtml(vehicle.brand)}</p>
          <h3>${escapeHtml(vehicle.brand)} ${escapeHtml(vehicle.model)}</h3>
        </div>
        <strong>${formatCurrency(vehicle.price)}</strong>
      </div>
      <div class="vehicle-meta">
        <span>${vehicle.year}</span>
        <span>${escapeHtml(vehicle.color)}</span>
        <span>${escapeHtml(vehicle.location || "Costa Rica")}</span>
      </div>
      ${
        showOwner
          ? `<p class="vehicle-owner">Publicado por ${escapeHtml(ownerName)}</p>`
          : ""
      }
      <p class="vehicle-description">${escapeHtml(vehicle.description || "Vehiculo disponible para consulta.")}</p>
      <div class="vehicle-card-actions">
        <a class="btn btn-outline" href="./vehicle.html?id=${vehicle._id}">Ver detalle</a>
      </div>
    </div>
  `;

  if (showActions) {
    const actions = document.createElement("div");
    actions.className = "vehicle-admin-actions";

    const editButton = document.createElement("button");
    editButton.className = "btn btn-primary";
    editButton.textContent = "Editar";
    editButton.addEventListener("click", () => onEdit?.(vehicle));

    const soldButton = document.createElement("button");
    soldButton.className = "btn btn-muted";
    soldButton.textContent = vehicle.status === "vendido" ? "Vendido" : "Marcar vendido";
    soldButton.disabled = vehicle.status === "vendido";
    soldButton.addEventListener("click", () => onSold?.(vehicle));

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-danger";
    deleteButton.textContent = "Eliminar";
    deleteButton.addEventListener("click", () => onDelete?.(vehicle));

    actions.append(editButton, soldButton, deleteButton);
    card.querySelector(".vehicle-card-actions").append(actions);
  }

  return card;
};

window.TicoAutos = {
  API_BASE,
  bindNavigation,
  buildImageUrl,
  createVehicleCard,
  escapeHtml,
  formatCurrency,
  getAuthHeaders,
  getToken,
  getUserId,
  isAuthenticated,
  logout,
  showMessagesPlaceholder,
};
