if (!window.TicoAutos.isAuthenticated()) {
  window.location.href = "./login.html";
}

window.TicoAutos.bindNavigation();

const container = document.getElementById("myVehicleList");

const loadMyVehicles = async () => {
  container.innerHTML = '<div class="empty-state">Cargando tus vehiculos...</div>';

  try {
    const response = await fetch(`${window.TicoAutos.API_BASE}/api/vehicles/mine`, {
      headers: window.TicoAutos.getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "No se pudieron cargar tus vehiculos");
    }

    const vehicles = data.results || [];
    container.innerHTML = "";

    if (!vehicles.length) {
      container.innerHTML =
        '<div class="empty-state">Todavia no has publicado vehiculos. Usa el boton "Publicar nuevo" para comenzar.</div>';
      return;
    }

    vehicles.forEach((vehicle) => {
      const card = window.TicoAutos.createVehicleCard(vehicle, {
        showOwner: false,
        showActions: true,
        onEdit: (item) => {
          window.location.href = `./editVehicle.html?id=${item._id}`;
        },
        onDelete: async (item) => {
          const confirmed = window.confirm("Seguro que deseas eliminar este vehiculo?");
          if (!confirmed) {
            return;
          }

          const deleteResponse = await fetch(`${window.TicoAutos.API_BASE}/api/vehicles/${item._id}`, {
            method: "DELETE",
            headers: window.TicoAutos.getAuthHeaders(),
          });
          const deleteData = await deleteResponse.json().catch(() => ({}));

          if (!deleteResponse.ok) {
            return alert(deleteData.message || "No se pudo eliminar");
          }

          loadMyVehicles();
        },
        onSold: async (item) => {
          const soldResponse = await fetch(`${window.TicoAutos.API_BASE}/api/vehicles/${item._id}/sold`, {
            method: "PATCH",
            headers: window.TicoAutos.getAuthHeaders(),
          });
          const soldData = await soldResponse.json().catch(() => ({}));

          if (!soldResponse.ok) {
            return alert(soldData.message || "No se pudo marcar como vendido");
          }

          loadMyVehicles();
        },
      });

      container.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    container.innerHTML =
      '<div class="empty-state">No se pudieron cargar tus vehiculos. Revisa el backend y tu token.</div>';
  }
};

loadMyVehicles();
