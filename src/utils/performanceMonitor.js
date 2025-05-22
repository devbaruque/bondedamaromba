import { Platform } from 'react-native';
import { InteractionManager } from 'react-native';

/**
 * Utilitário para monitorar métricas de performance da aplicação
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      loadTimes: {},
      interactions: {},
      frameDrops: 0,
      memoryWarnings: 0,
      apiCallTimes: {},
    };

    this.observers = [];
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.lastFrameTimestamp = 0;
    this.frameCount = 0;
    this.currentFps = 0;
  }

  /**
   * Inicia o monitoramento de performance
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Resetar métricas
    this.resetMetrics();
    
    // Monitorar FPS se estiver em ambiente de desenvolvimento
    if (__DEV__ && Platform.OS !== 'web') {
      this.startFpsMonitoring();
    }
    
    console.log('[PerformanceMonitor] Monitoramento iniciado');
  }

  /**
   * Para o monitoramento de performance
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    // Parar monitoramento de FPS
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('[PerformanceMonitor] Monitoramento parado');
  }

  /**
   * Reseta todas as métricas
   */
  resetMetrics() {
    this.metrics = {
      loadTimes: {},
      interactions: {},
      frameDrops: 0,
      memoryWarnings: 0,
      apiCallTimes: {},
    };
    
    this.frameCount = 0;
    this.lastFrameTimestamp = 0;
    this.currentFps = 0;
  }

  /**
   * Inicia o monitoramento de FPS
   * @private
   */
  startFpsMonitoring() {
    // Inicializar valores
    this.lastFrameTimestamp = performance.now();
    this.frameCount = 0;
    
    // Monitorar a cada segundo
    this.monitoringInterval = setInterval(() => {
      const now = performance.now();
      const elapsed = now - this.lastFrameTimestamp;
      
      if (elapsed > 0) {
        // Calcular FPS com base na contagem de frames e tempo decorrido
        this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
        
        // Detectar quedas de FPS
        if (this.currentFps < 30 && this.frameCount > 0) {
          this.metrics.frameDrops++;
          console.warn(`[PerformanceMonitor] Queda de FPS detectada: ${this.currentFps} FPS`);
          
          // Notificar observadores
          this.notifyObservers({ 
            type: 'fps_drop', 
            fps: this.currentFps,
            timestamp: now
          });
        }
        
        // Resetar contagem para o próximo intervalo
        this.frameCount = 0;
        this.lastFrameTimestamp = now;
      }
    }, 1000);
    
    // Adicionar animação "fantasma" para forçar frames de renderização
    const scheduleNextFrame = () => {
      requestAnimationFrame(() => {
        this.frameCount++;
        if (this.isMonitoring) {
          scheduleNextFrame();
        }
      });
    };
    
    scheduleNextFrame();
  }

  /**
   * Registra o tempo de carregamento de uma tela
   * @param {string} screenName - Nome da tela
   * @param {number} startTime - Timestamp de início
   * @param {number} endTime - Timestamp de término (opcional, usa agora se não fornecido)
   */
  recordScreenLoad(screenName, startTime, endTime = performance.now()) {
    if (!this.isMonitoring) return;
    
    const loadTime = endTime - startTime;
    
    if (!this.metrics.loadTimes[screenName]) {
      this.metrics.loadTimes[screenName] = [];
    }
    
    this.metrics.loadTimes[screenName].push({
      timestamp: new Date().toISOString(),
      loadTime,
    });
    
    console.log(`[PerformanceMonitor] Tela ${screenName} carregada em ${loadTime.toFixed(2)}ms`);
    
    // Notificar observadores
    this.notifyObservers({
      type: 'screen_load',
      screenName,
      loadTime,
      timestamp: endTime
    });
    
    // Emitir alerta se o tempo for maior que 300ms
    if (loadTime > 300) {
      console.warn(`[PerformanceMonitor] Tempo de carregamento lento para ${screenName}: ${loadTime.toFixed(2)}ms`);
    }
  }

  /**
   * Registra o tempo de uma interação do usuário
   * @param {string} interactionName - Nome da interação
   * @param {Function} callback - Função a ser executada na interação
   * @returns {Function} - Função envolta que registra o tempo
   */
  trackInteraction(interactionName, callback) {
    return (...args) => {
      if (!this.isMonitoring) {
        return callback(...args);
      }
      
      const start = performance.now();
      
      // Executar callback dentro do InteractionManager para não bloquear animações
      InteractionManager.runAfterInteractions(() => {
        const result = callback(...args);
        const end = performance.now();
        const duration = end - start;
        
        if (!this.metrics.interactions[interactionName]) {
          this.metrics.interactions[interactionName] = [];
        }
        
        this.metrics.interactions[interactionName].push({
          timestamp: new Date().toISOString(),
          duration,
        });
        
        // Notificar observadores
        this.notifyObservers({
          type: 'interaction',
          name: interactionName,
          duration,
          timestamp: end
        });
        
        // Alerta se interação for lenta
        if (duration > 100) {
          console.warn(`[PerformanceMonitor] Interação lenta: ${interactionName} (${duration.toFixed(2)}ms)`);
        }
        
        return result;
      });
    };
  }

  /**
   * Registra o tempo de uma chamada de API
   * @param {string} endpoint - Nome do endpoint da API
   * @param {number} startTime - Timestamp de início
   * @param {number} endTime - Timestamp de término
   * @param {boolean} isSuccess - Se a chamada foi bem-sucedida
   */
  recordApiCall(endpoint, startTime, endTime, isSuccess) {
    if (!this.isMonitoring) return;
    
    const duration = endTime - startTime;
    
    if (!this.metrics.apiCallTimes[endpoint]) {
      this.metrics.apiCallTimes[endpoint] = [];
    }
    
    this.metrics.apiCallTimes[endpoint].push({
      timestamp: new Date().toISOString(),
      duration,
      isSuccess,
    });
    
    // Notificar observadores
    this.notifyObservers({
      type: 'api_call',
      endpoint,
      duration,
      isSuccess,
      timestamp: endTime
    });
    
    // Alerta se API for lenta
    if (duration > 1000) {
      console.warn(`[PerformanceMonitor] Chamada de API lenta: ${endpoint} (${duration.toFixed(2)}ms)`);
    }
  }

  /**
   * Registra um aviso de uso de memória
   */
  recordMemoryWarning() {
    if (!this.isMonitoring) return;
    
    this.metrics.memoryWarnings++;
    
    console.warn('[PerformanceMonitor] Aviso de uso de memória detectado');
    
    // Notificar observadores
    this.notifyObservers({
      type: 'memory_warning',
      count: this.metrics.memoryWarnings,
      timestamp: performance.now()
    });
  }

  /**
   * Obtém um relatório de todas as métricas coletadas
   * @returns {Object} - Relatório de métricas
   */
  getReport() {
    const report = {
      ...this.metrics,
      currentFps: this.currentFps,
      timestamp: new Date().toISOString(),
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version,
      },
    };
    
    return report;
  }

  /**
   * Adiciona um observador para receber notificações de eventos de performance
   * @param {Function} observer - Função observadora que receberá os eventos
   */
  addObserver(observer) {
    if (typeof observer === 'function' && !this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  /**
   * Remove um observador
   * @param {Function} observer - Função observadora a ser removida
   */
  removeObserver(observer) {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Notifica todos os observadores sobre um evento
   * @param {Object} event - Dados do evento
   * @private
   */
  notifyObservers(event) {
    this.observers.forEach(observer => {
      try {
        observer(event);
      } catch (error) {
        console.error('[PerformanceMonitor] Erro ao notificar observador:', error);
      }
    });
  }
}

// Exportar uma única instância para uso em toda a aplicação
export default new PerformanceMonitor(); 