// Redirige al login si el usuario no ha iniciado sesión.
if (!window.TicoAutos.isAuthenticated()) { 
  window.location.href = "./login.html";
}

// Activa la navegación compartida de la aplicación.
window.TicoAutos.bindNavigation();

// Obtiene el id del vehículo desde la URL.
const params = new URLSearchParams(window.location.search);
const vehicleId = params.get("id");

const chatHeader = document.getElementById("chatHeader");
const chatThread = document.getElementById("chatThread");

// Formatea fechas en formato local de Costa Rica.
const formatDate = (value) => {
  if (!value) {
    return "Sin registro";
  }

  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

// Muestra mensajes inline en un elemento del DOM.
const setInlineMessage = (element, text, type = "") => {
  if (!element) {
    return;
  }

  element.textContent = text;
  element.className = `msg ${type}`.trim();
};

// Genera el HTML de una burbuja de pregunta/respuesta.
const renderQuestionBubble = (question, isOwner) => `
  <article class="form-card">
    <p><strong>Pregunta:</strong> ${window.TicoAutos.escapeHtml(question.questionText)}</p>
    <p class="muted">
      Realizada por:
      ${window.TicoAutos.escapeHtml(question.askedByUserId?.name || "")}
      ${window.TicoAutos.escapeHtml(question.askedByUserId?.lastname || "")}
    </p>
    <p class="muted">Fecha de pregunta: ${formatDate(question.askedAt)}</p>

    ${
      question.status === "answered"
        ? `
          <p><strong>Respuesta:</strong> ${window.TicoAutos.escapeHtml(question.answerText)}</p>
          <p class="muted">
            Respondida por:
            ${window.TicoAutos.escapeHtml(question.answeredByUserId?.name || "")}
            ${window.TicoAutos.escapeHtml(question.answeredByUserId?.lastname || "")}
          </p>
          <p class="muted">Fecha de respuesta: ${formatDate(question.answeredAt)}</p>
        `
        : '<p class="muted">Estado actual: Pendiente de respuesta.</p>'
    }

    ${
      isOwner && question.status === "pending"
        ? `
          <form data-answer-form="${question._id}">
            <label>
              Respuesta
              <textarea
                name="answerText"
                rows="3"
                placeholder="Escribe una respuesta clara para el interesado"
                required
              ></textarea>
            </label>
            <p class="msg" data-answer-msg="${question._id}" aria-live="polite"></p>
            <div class="inline-actions">
              <button class="btn btn-primary" type="submit">Responder</button>
            </div>
          </form>
        `
        : ""
    }
  </article>
`;

// Vincula los formularios de respuesta para el propietario del vehículo.
const bindAnswerForms = (vehicleIdValue, isOwner) => {
  if (!isOwner) {
    return;
  }

  chatThread.querySelectorAll("[data-answer-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const questionId = form.dataset.answerForm;
      const formData = new FormData(form);
      const answerText = `${formData.get("answerText") || ""}`.trim();
      const answerMsg = document.querySelector(`[data-answer-msg="${questionId}"]`);

      // Valida que la respuesta no vaya vacía.
      if (!answerText) {
        setInlineMessage(answerMsg, "Debes ingresar una respuesta antes de enviarla.", "err");
        return;
      }

      try {
        const response = await fetch(`${window.TicoAutos.API_BASE}/api/questions/${questionId}/answer`, {
          method: "POST",
          headers: {
            ...window.TicoAutos.getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ answerText }),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "No fue posible registrar la respuesta.");
        }

        // Recarga el chat para reflejar la respuesta guardada.
        await loadChat(vehicleIdValue);
      } catch (error) {
        setInlineMessage(answerMsg, error.message || "No fue posible registrar la respuesta.", "err");
      }
    });
  });
};

// Vincula el formulario para crear una nueva pregunta.
const bindAskForm = (vehicleIdValue, canAsk) => {
  const form = document.getElementById("askQuestionForm");
  const questionMsg = document.getElementById("questionMsg");

  if (!form || !canAsk) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setInlineMessage(questionMsg, "");

    const formData = new FormData(form);
    const questionText = `${formData.get("questionText") || ""}`.trim();

    // Valida que la pregunta no vaya vacía.
    if (!questionText) {
      setInlineMessage(questionMsg, "Debes ingresar una pregunta antes de enviarla.", "err");
      return;
    }

    try {
      const response = await fetch(`${window.TicoAutos.API_BASE}/api/questions/vehicle/${vehicleIdValue}`, {
        method: "POST",
        headers: {
          ...window.TicoAutos.getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionText }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "No fue posible registrar la pregunta.");
      }

      // Recarga el chat para mostrar la nueva pregunta.
      await loadChat(vehicleIdValue);
    } catch (error) {
      setInlineMessage(questionMsg, error.message || "No fue posible registrar la pregunta.", "err");
    }
  });
};

// Carga toda la información del chat de un vehículo.
const loadChat = async (vehicleIdValue) => {
  if (!vehicleIdValue) {
    chatHeader.innerHTML = '<div class="empty-state">No fue posible identificar el chat solicitado.</div>';
    chatThread.innerHTML = "";
    return;
  }

  chatHeader.innerHTML = '<div class="empty-state">Cargando informacion del chat...</div>';
  chatThread.innerHTML = "";

  try {
    const response = await fetch(`${window.TicoAutos.API_BASE}/api/questions/vehicle/${vehicleIdValue}`, {
      headers: window.TicoAutos.getAuthHeaders(),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "No fue posible cargar el chat del vehiculo.");
    }

    const vehicle = data.vehicle || {};
    const isOwner = Boolean(data.isOwner);
    const questions = data.results || [];

    // Renderiza el encabezado principal del chat.
    chatHeader.innerHTML = `
      <div class="section-head">
        <div>
          <h1>Chat de ${window.TicoAutos.escapeHtml(vehicle.brand || "Vehiculo")} ${window.TicoAutos.escapeHtml(vehicle.model || "")}</h1>
          <p class="page-subtitle">
            ${isOwner
              ? "Estas visualizando las consultas recibidas en este vehiculo."
              : "Estas visualizando tus preguntas y respuestas sobre este vehiculo."}
          </p>
        </div>
        <div class="inline-actions">
          <a class="btn btn-outline" href="./vehicle.html?id=${vehicle._id}">Ver vehiculo</a>
          <a class="btn btn-outline" href="./history.html?id=${vehicle._id}">Ver historial</a>
          <a class="btn btn-outline" href="./chats.html">Volver a chats</a>
        </div>
      </div>
    `;

    // El interesado solo puede volver a preguntar si no tiene una pregunta pendiente.
    const askFormHtml = !isOwner
      ? `
        <div class="form-card">
          <h2>Nueva pregunta</h2>
          <form id="askQuestionForm">
            <label>
              Tu pregunta
              <textarea
                name="questionText"
                rows="4"
                placeholder="Escribe tu consulta sobre este vehiculo"
                ${data.canAsk ? "" : "disabled"}
                required
              ></textarea>
            </label>
            <p class="msg" id="questionMsg" aria-live="polite"></p>
            <div class="inline-actions">
              <button class="btn btn-primary" type="submit" ${data.canAsk ? "" : "disabled"}>
                Enviar pregunta
              </button>
            </div>
            ${
              data.canAsk
                ? ""
                : '<p class="muted">Debes esperar la respuesta del propietario antes de enviar una nueva pregunta.</p>'
            }
          </form>
        </div>
      `
      : "";

    // Renderiza el formulario de pregunta y la conversación completa.
    chatThread.innerHTML = `
      ${askFormHtml}

      <section class="section">
        <div class="section-head">
          <div>
            <h2>Conversacion</h2>
            <p class="page-subtitle">Mensajes registrados para este vehiculo.</p>
          </div>
        </div>

        <div class="questions-list">
          ${
            questions.length
              ? questions.map((question) => renderQuestionBubble(question, isOwner)).join("")
              : '<div class="empty-state">Todavia no existen mensajes registrados en este chat.</div>'
          }
        </div>
      </section>
    `;

    // Vuelve a enlazar eventos después de renderizar el HTML dinámico.
    bindAskForm(vehicleIdValue, data.canAsk);
    bindAnswerForms(vehicleIdValue, isOwner);
  } catch (error) {
    console.error(error);
    chatHeader.innerHTML = '<div class="empty-state">No fue posible cargar el chat solicitado.</div>';
    chatThread.innerHTML = "";
  }
};

loadChat(vehicleId);