if (!window.TicoAutos.isAuthenticated()) {
  window.location.href = "./login.html";
}

window.TicoAutos.bindNavigation();

const form = document.getElementById("vehicleForm");
const msg = document.getElementById("vehicleMsg");
const submitButton = document.getElementById("vehicleSubmit");

const setMsg = (text, type = "") => {
  msg.textContent = text;
  msg.className = `msg ${type}`.trim();
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMsg("");

  submitButton.disabled = true;
  submitButton.textContent = "Publicando...";

  try {
    const formData = new FormData(form);
    const response = await fetch(`${window.TicoAutos.API_BASE}/api/vehicles`, {
      method: "POST",
      headers: window.TicoAutos.getAuthHeaders(),
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "No se pudo publicar el vehiculo");
    }

    setMsg("Vehiculo publicado correctamente", "ok");
    window.setTimeout(() => {
      window.location.href = "./myVehicles.html";
    }, 700);
  } catch (error) {
    console.error(error);
    setMsg(error.message || "No se pudo publicar el vehiculo", "err");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Publicar vehiculo";
  }
});
