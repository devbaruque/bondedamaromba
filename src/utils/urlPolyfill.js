// Polyfill básico para o módulo 'url' do Node.js
// Este é um stub mínimo para evitar erros de importação

// Usar a implementação nativa do URL no navegador/React Native
const URL = global.URL;

// Função para analisar URLs
function parse(urlString, parseQueryString = false, slashesDenoteHost = false) {
  try {
    const url = new URL(urlString);
    
    // Retornar um objeto com a mesma estrutura que url.parse() do Node.js
    return {
      protocol: url.protocol,
      slashes: url.protocol.includes(':'),
      auth: url.username ? (url.password ? `${url.username}:${url.password}` : url.username) : null,
      host: url.host,
      port: url.port,
      hostname: url.hostname,
      hash: url.hash,
      search: url.search,
      query: parseQueryString ? Object.fromEntries(new URLSearchParams(url.search)) : url.search.slice(1),
      pathname: url.pathname,
      path: `${url.pathname}${url.search}`,
      href: url.href
    };
  } catch (e) {
    // Retornar um objeto vazio em caso de erro
    return {};
  }
}

// Função para formatar URLs
function format(urlObj) {
  if (typeof urlObj === 'string') {
    return urlObj;
  }
  
  let result = '';
  
  if (urlObj.protocol) {
    result += urlObj.protocol;
    if (!result.endsWith(':')) {
      result += ':';
    }
  }
  
  if (urlObj.slashes || urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
    result += '//';
  }
  
  if (urlObj.auth) {
    result += urlObj.auth + '@';
  }
  
  if (urlObj.hostname) {
    result += urlObj.hostname;
  }
  
  if (urlObj.port) {
    result += ':' + urlObj.port;
  }
  
  if (urlObj.pathname) {
    result += urlObj.pathname;
  }
  
  if (urlObj.search) {
    if (!urlObj.search.startsWith('?')) {
      result += '?';
    }
    result += urlObj.search;
  } else if (urlObj.query && typeof urlObj.query === 'object') {
    result += '?' + new URLSearchParams(urlObj.query).toString();
  }
  
  if (urlObj.hash) {
    if (!urlObj.hash.startsWith('#')) {
      result += '#';
    }
    result += urlObj.hash;
  }
  
  return result;
}

// Função para resolver URLs relativos
function resolve(from, to) {
  try {
    return new URL(to, from).href;
  } catch (e) {
    return to;
  }
}

export default {
  parse,
  format,
  resolve,
  URL,
  URLSearchParams: global.URLSearchParams,
}; 