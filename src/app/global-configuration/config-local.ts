// Configuración central. Única fuente de verdad para la URL del backend,
// el nombre de la cookie de sesión y formatos.
const config_local = {
  // URLBACKEND la inyecta Docker (server-to-server). En local apunta a la API.
  backendBaseUrl: process.env.URLBACKEND ?? "http://localhost:5063",
  sessionCookieName: "session_bk",
  format_date: "dd/MM/yyyy HH:mm",
};

export default config_local;
