const ELITE_BUS_NAMESPACE = 'zaire:elite-component';

const createFallbackBus = () => {
  const listeners = new Map();
  return {
    addEventListener(type, listener) {
      const existing = listeners.get(type) || [];
      listeners.set(type, [...existing, listener]);
    },
    removeEventListener(type, listener) {
      const existing = listeners.get(type) || [];
      listeners.set(type, existing.filter((entry) => entry !== listener));
    },
    dispatchEvent(event) {
      const existing = listeners.get(event.type) || [];
      existing.forEach((listener) => listener(event));
    }
  };
};

const eliteBus = typeof window !== 'undefined' && typeof window.EventTarget !== 'undefined'
  ? new window.EventTarget()
  : createFallbackBus();

export const emitEliteBusEvent = (type, detail = {}) => {
  const eventType = `${ELITE_BUS_NAMESPACE}:${type}`;
  if (typeof window !== 'undefined' && typeof window.CustomEvent !== 'undefined') {
    eliteBus.dispatchEvent(new window.CustomEvent(eventType, { detail }));
    return;
  }

  eliteBus.dispatchEvent({ type: eventType, detail });
};

export const subscribeEliteBusEvent = (type, listener) => {
  const eventType = `${ELITE_BUS_NAMESPACE}:${type}`;
  eliteBus.addEventListener(eventType, listener);
  return () => eliteBus.removeEventListener(eventType, listener);
};
