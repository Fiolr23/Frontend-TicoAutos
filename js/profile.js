if (!window.TicoAutos.isAuthenticated()) {
  window.location.href = "./login.html";
}

window.TicoAutos.bindNavigation();

const profileCard = document.getElementById("profileCard");
const profileStats = document.getElementById("profileStats");

const loadProfile = async () => {
  try {
    const [meResponse, vehiclesResponse] = await Promise.all([
      fetch(`${window.TicoAutos.API_BASE}/api/auth/me`, {
        headers: window.TicoAutos.getAuthHeaders(),
      }),
      fetch(`${window.TicoAutos.API_BASE}/api/vehicles/mine?limit=50`, {
        headers: window.TicoAutos.getAuthHeaders(),
      }),
    ]);

    const meData = await meResponse.json().catch(() => ({}));
    const vehiclesData = await vehiclesResponse.json().catch(() => ({}));

    if (!meResponse.ok) {
      throw new Error(meData.message || "No se pudo cargar el perfil");
    }

    const vehicles = vehiclesData.results || [];
    const soldCount = vehicles.filter((vehicle) => vehicle.status === "vendido").length;
    const availableCount = vehicles.length - soldCount;

    profileCard.innerHTML = `
      <span class="eyebrow">Tu cuenta</span>
      <h2>${window.TicoAutos.escapeHtml(meData.user.name)} ${window.TicoAutos.escapeHtml(meData.user.lastname)}</h2>
      <p class="muted">Correo registrado: ${window.TicoAutos.escapeHtml(meData.user.email)}</p>
      <div class="inline-actions">
        <a class="btn btn-primary" href="./createVehicle.html">Publicar vehiculo</a>
        <a class="btn btn-outline" href="./myVehicles.html">Ver mis vehiculos</a>
      </div>
    `;

    profileStats.innerHTML = `
      <div class="spec-item">
        <span>Total publicados</span>
        <strong>${vehicles.length}</strong>
      </div>
      <div class="spec-item">
        <span>Disponibles</span>
        <strong>${availableCount}</strong>
      </div>
      <div class="spec-item">
        <span>Vendidos</span>
        <strong>${soldCount}</strong>
      </div>
    `;
  } catch (error) {
    console.error(error);
    profileCard.innerHTML =
      '<div class="empty-state">No se pudo cargar el perfil del usuario autenticado.</div>';
    profileStats.innerHTML = "";
  }
};

loadProfile();
