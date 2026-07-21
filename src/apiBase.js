const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);
const LOCAL_BACKEND_PORT = '10000';

export function resolveApiBase() {
  // Always prefer the explicitly configured URL (e.g. Render backend).
  // This must be checked FIRST — before any window.location logic —
  // so that even when the app is opened as a local file:// (via zaire_boot.exe),
  // it still connects to the correct remote backend.
  const configured = process.env.REACT_APP_API_URL;
  if (configured) {
    return configured;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, origin, port } = window.location;

    // Fallback for local dev: file:// protocol means opened directly from disk
    if (protocol === 'file:') {
      return `http://127.0.0.1:${LOCAL_BACKEND_PORT}`;
    }

    // Fallback for local dev: running on localhost
    if (LOCAL_HOSTS.has(hostname)) {
      if (port && port !== LOCAL_BACKEND_PORT) {
        return `${protocol}//${hostname}:${LOCAL_BACKEND_PORT}`;
      }
      return origin;
    }
  }

  return 'http://localhost:10000';
}
