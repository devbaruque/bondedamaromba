// Polyfill para o módulo 'events' do Node.js

export class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  once(event, listener) {
    const onceWrapper = (...args) => {
      listener.apply(this, args);
      this.removeListener(event, onceWrapper);
    };
    this.on(event, onceWrapper);
    return this;
  }

  emit(event, ...args) {
    if (!this.events[event]) {
      return false;
    }
    this.events[event].forEach((listener) => {
      listener.apply(this, args);
    });
    return true;
  }

  addListener(event, listener) {
    return this.on(event, listener);
  }

  removeListener(event, listener) {
    if (!this.events[event]) {
      return this;
    }
    this.events[event] = this.events[event].filter((l) => l !== listener);
    return this;
  }

  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }

  listeners(event) {
    return this.events[event] || [];
  }

  listenerCount(event) {
    return this.listeners(event).length;
  }
}

// Exportar o construtor como propriedade padrão para compatibilidade com require('events')
export default {
  EventEmitter
}; 