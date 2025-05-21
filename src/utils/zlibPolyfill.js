// Polyfill básico para o módulo 'zlib' do Node.js
// Este é um stub mínimo para evitar erros de importação

import { Transform } from './streamPolyfill';

// Funções de compressão e descompressão (stubs)
function createDeflate() {
  return new Transform();
}

function createInflate() {
  return new Transform();
}

function createDeflateRaw() {
  return new Transform();
}

function createInflateRaw() {
  return new Transform();
}

function createGzip() {
  return new Transform();
}

function createGunzip() {
  return new Transform();
}

function createUnzip() {
  return new Transform();
}

// Versões síncronas (stubs)
function deflateSync(buffer, options) {
  return buffer;
}

function inflateSync(buffer, options) {
  return buffer;
}

function deflateRawSync(buffer, options) {
  return buffer;
}

function inflateRawSync(buffer, options) {
  return buffer;
}

function gzipSync(buffer, options) {
  return buffer;
}

function gunzipSync(buffer, options) {
  return buffer;
}

function unzipSync(buffer, options) {
  return buffer;
}

// Constantes
const constants = {
  Z_NO_FLUSH: 0,
  Z_PARTIAL_FLUSH: 1,
  Z_SYNC_FLUSH: 2,
  Z_FULL_FLUSH: 3,
  Z_FINISH: 4,
  Z_BLOCK: 5,
  Z_TREES: 6,
  Z_OK: 0,
  Z_STREAM_END: 1,
  Z_NEED_DICT: 2,
  Z_ERRNO: -1,
  Z_STREAM_ERROR: -2,
  Z_DATA_ERROR: -3,
  Z_MEM_ERROR: -4,
  Z_BUF_ERROR: -5,
  Z_VERSION_ERROR: -6,
  Z_NO_COMPRESSION: 0,
  Z_BEST_SPEED: 1,
  Z_BEST_COMPRESSION: 9,
  Z_DEFAULT_COMPRESSION: -1,
  Z_FILTERED: 1,
  Z_HUFFMAN_ONLY: 2,
  Z_RLE: 3,
  Z_FIXED: 4,
  Z_DEFAULT_STRATEGY: 0,
};

export default {
  createDeflate,
  createInflate,
  createDeflateRaw,
  createInflateRaw,
  createGzip,
  createGunzip,
  createUnzip,
  deflateSync,
  inflateSync,
  deflateRawSync,
  inflateRawSync,
  gzipSync,
  gunzipSync,
  unzipSync,
  constants,
}; 