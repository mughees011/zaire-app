const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);
const LOCAL_BACKEND_PORT = '10000';

export function resolveApiBase() {
  const configured = process.env.REACT_APP_API_URL;
  if (configured) {
    return configured;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, origin, port } = window.location;

    if (protocol === 'file:') {
      return `http://127.0.0.1:${LOCAL_BACKEND_PORT}`;
    }

    if (LOCAL_HOSTS.has(hostname)) {
      if (port && port !== LOCAL_BACKEND_PORT) {
        return `${protocol}//${hostname}:${LOCAL_BACKEND_PORT}`;
      }
      return origin;
    }
  }

  return 'https://zaire-backend.onrender.com';
}
