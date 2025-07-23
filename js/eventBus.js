// js\eventBus.js
window.eventBus = (() => {
  const listeners = {};
  return {
    on: (event, cb) => {
      (listeners[event] ||= []).push(cb);
      return () =>
        (listeners[event] = listeners[event].filter((c) => c !== cb));
    },
    emit: (event, data) => (listeners[event] || []).forEach((cb) => cb(data)),
  };
})();
