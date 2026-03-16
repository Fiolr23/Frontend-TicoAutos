window.TicoAutos.bindNavigation();

const form = document.getElementById("catalogFilters");
const summary = document.getElementById("catalogSummary");
const list = document.getElementById("catalogList");

const readFilters = () => {
  const formData = new FormData(form);
  const params = new URLSearchParams();

  for (const [key, value] of formData.entries()) {
    const trimmed = `${value}`.trim();
    if (trimmed) {
      params.set(key, trimmed);
    }
  }

  params.set("limit", "12");
  return params;
};

const fillFiltersFromUrl = () => {
  const params = new URLSearchParams(window.location.search);

  ["brand", "model", "minYear", "maxYear", "minPrice", "maxPrice", "status"].forEach((key) => {
    const field = form.elements.namedItem(key);
    if (field && params.has(key)) {
      field.value = params.get(key);
    }
  });
};

const renderVehicles = (vehicles, currentUserId) => {
  list.innerHTML = "";

  if (!vehicles.length) {
    list.innerHTML = '<div class="empty-state">No encontramos vehiculos con esos filtros.</div>';
    return;
  }

  vehicles.forEach((vehicle) => {
    const ownerId = vehicle.owner?._id || vehicle.userId?._id;
    const isOwner = Boolean(currentUserId && ownerId === currentUserId);

    const card = window.TicoAutos.createCatalogVehicleCard(vehicle, {
      isOwner,
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
          return window.alert(deleteData.message || "No se pudo eliminar");
        }

        loadVehicles(readFilters());
      },
      onShare: (item) => {
        window.TicoAutos.shareVehicleLink(item);
      },
      onToggleStatus: async (item) => {
        const nextStatus = item.status === "vendido" ? "disponible" : "vendido";
        const statusResponse = await fetch(`${window.TicoAutos.API_BASE}/api/vehicles/${item._id}/status`, {
          method: "PATCH",
          headers: {
            ...window.TicoAutos.getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        });
        const statusData = await statusResponse.json().catch(() => ({}));

        if (!statusResponse.ok) {
          return window.alert(statusData.message || "No se pudo actualizar el estado");
        }

        loadVehicles(readFilters());
      },
    });

    list.appendChild(card);
  });
};

const loadVehicles = async (params = readFilters()) => {
  list.innerHTML = '<div class="empty-state">Cargando vehiculos...</div>';
  summary.textContent = "Consultando catalogo";

  try {
    const currentUserId = await window.TicoAutos.syncSessionUser();
    const query = params.toString();
    const response = await fetch(`${window.TicoAutos.API_BASE}/api/vehicles${query ? `?${query}` : ""}`);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "No se pudo cargar el catalogo");
    }

    const results = data.results || [];
    summary.textContent = `${data.total || results.length} vehiculos encontrados`;
    renderVehicles(results, currentUserId);

    const nextUrl = query ? `./index.html?${query}#catalogo` : "./index.html#catalogo";
    window.history.replaceState(null, "", nextUrl);
  } catch (error) {
    console.error(error);
    summary.textContent = "No fue posible cargar el catalogo";
    list.innerHTML = '<div class="empty-state">Revisa que el backend este encendido y con acceso a MongoDB.</div>';
  }
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  loadVehicles(readFilters());
});

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    loadVehicles(new URLSearchParams({ limit: "12" }));
  }, 0);
});

fillFiltersFromUrl();

const initialParams = new URLSearchParams(window.location.search);
if (!initialParams.has("limit")) {
  initialParams.set("limit", "12");
}

loadVehicles(initialParams);
