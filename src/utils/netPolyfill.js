// Polyfill básico para o módulo 'net' do Node.js
// Este é um stub mínimo para evitar erros de importação

import { EventEmitter } from './eventsPolyfill';

class Socket extends EventEmitter {
  constructor() {
    super();
    this.connecting = false;
    this.destroyed = false;
    this.readable = true;
    this.writable = true;
  }

  connect(options, connectListener) {
    if (connectListener) {
      this.on('connect', connectListener);
    }
    // Simular conexão bem-sucedida após um pequeno delay
    setTimeout(() => {
      this.emit('connect');
    }, 0);
    return this;
  }

  end(data, encoding) {
    if (data) {
      this.write(data, encoding);
    }
    this.writable = false;
    this.emit('end');
    return this;
  }

  destroy() {
    this.destroyed = true;
    this.readable = false;
    this.writable = false;
    return this;
  }

  write(data, encoding, callback) {
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = null;
    }
    
    if (callback) {
      callback();
    }
    
    return true;
  }
}

class Server extends EventEmitter {
  constructor(options, connectionListener) {
    super();
    if (typeof options === 'function') {
      connectionListener = options;
      options = {};
    }
    
    if (connectionListener) {
      this.on('connection', connectionListener);
    }
  }

  listen(port, host, backlog, callback) {
    if (typeof port === 'function') {
      callback = port;
      port = 0;
    } else if (typeof host === 'function') {
      callback = host;
      host = null;
    } else if (typeof backlog === 'function') {
      callback = backlog;
      backlog = null;
    }
    
    if (callback) {
      this.on('listening', callback);
    }
    
    // Simular evento de listening após um pequeno delay
    setTimeout(() => {
      this.emit('listening');
    }, 0);
    
    return this;
  }

  close(callback) {
    if (callback) {
      this.on('close', callback);
    }
    
    // Simular evento de close após um pequeno delay
    setTimeout(() => {
      this.emit('close');
    }, 0);
    
    return this;
  }
}

function createServer(options, connectionListener) {
  return new Server(options, connectionListener);
}

function createConnection(options, connectListener) {
  const socket = new Socket();
  return socket.connect(options, connectListener);
}

export default {
  Socket,
  Server,
  createServer,
  createConnection,
  connect: createConnection,
}; 