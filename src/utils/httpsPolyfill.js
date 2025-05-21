// Polyfill básico para o módulo 'https' do Node.js
// Este é um stub mínimo para evitar erros de importação

// Importar o polyfill do http para reutilizar suas classes
import http from './httpPolyfill';

// Exportar as mesmas classes e funções do http
export default {
  ...http,
  // Adicionar qualquer função específica do https aqui, se necessário
}; 