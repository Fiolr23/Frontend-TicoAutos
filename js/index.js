const API_BASE = "http://localhost:3000";

// Verifica si hay token al cargar la página
const token = sessionStorage.getItem("token");

// Si no hay token, manda al login
if (!token) {
  window.location.href = "./login.html";
}

// Botón cerrar sesión
const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", async () => {
  try {
    // Llamamos al backend para borrar el token en la BD
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Error en logout:", error);
  }

  // Borra token del navegador
  sessionStorage.removeItem("token");

  // Redirige al login
  window.location.href = "./login.html";
});