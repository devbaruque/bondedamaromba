// Polyfill básico para o módulo 'crypto' do Node.js
// Este é um stub mínimo para evitar erros de importação

// Função para gerar um ID aleatório
function randomBytes(size) {
  const result = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    result[i] = Math.floor(Math.random() * 256);
  }
  
  // Adicionar um método toString para compatibilidade
  result.toString = function(encoding) {
    if (encoding === 'hex') {
      return Array.from(this)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return String.fromCharCode.apply(null, this);
  };
  
  return result;
}

// Função para criar um hash
function createHash(algorithm) {
  return {
    update: function(data) {
      this.data = data;
      return this;
    },
    digest: function(encoding) {
      // Implementação muito simples, apenas para evitar erros
      if (encoding === 'hex') {
        return Array.from(randomBytes(16))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      }
      return randomBytes(16);
    }
  };
}

export default {
  randomBytes,
  createHash,
}; 