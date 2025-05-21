// Este arquivo serve como polyfill para o módulo 'stream' do Node.js
// que algumas bibliotecas tentam usar no ambiente React Native
import { EventEmitter } from './eventsPolyfill';

// Polyfill simples para Stream que imita a API básica
export class Stream extends EventEmitter {
  pipe(destination) {
    // Implementação básica de pipe
    this.on('data', chunk => {
      destination.write(chunk);
    });
    
    this.on('end', () => {
      destination.end();
    });
    
    this.on('error', err => {
      destination.emit('error', err);
    });
    
    return destination;
  }

  write(chunk) {
    this.emit('data', chunk);
    return true;
  }

  end() {
    this.emit('end');
  }
}

// Expor outras classes comuns de Stream
export class Readable extends Stream {}
export class Writable extends Stream {}
export class Duplex extends Stream {}
export class Transform extends Stream {}
export class PassThrough extends Stream {}

export default { 
  Readable, 
  Writable, 
  Duplex,
  Transform,
  PassThrough,
  Stream
}; 