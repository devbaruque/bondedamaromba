// Polyfill básico para o módulo 'http' do Node.js
// Este é um stub mínimo para evitar erros de importação

import { EventEmitter } from './eventsPolyfill';

class Server extends EventEmitter {
  listen() {
    return this;
  }
  
  close() {
    return this;
  }
}

class IncomingMessage extends EventEmitter {
  constructor() {
    super();
    this.headers = {};
    this.method = 'GET';
    this.url = '';
    this.statusCode = 200;
    this.statusMessage = 'OK';
  }
}

class ServerResponse extends EventEmitter {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
  }
  
  setHeader(name, value) {
    this.headers[name] = value;
    return this;
  }
  
  getHeader(name) {
    return this.headers[name];
  }
  
  removeHeader(name) {
    delete this.headers[name];
    return this;
  }
  
  write(chunk) {
    this.emit('data', chunk);
    return true;
  }
  
  end(data) {
    if (data) {
      this.write(data);
    }
    this.emit('end');
    return this;
  }
}

function createServer(requestListener) {
  const server = new Server();
  if (requestListener) {
    server.on('request', requestListener);
  }
  return server;
}

export default {
  createServer,
  Server,
  IncomingMessage,
  ServerResponse,
}; 