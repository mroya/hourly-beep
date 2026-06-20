/**
 * Camada de abstração de Analytics.
 *
 * Em __DEV__, loga eventos no console.
 * Em produção, delega para o provider configurado (Firebase, PostHog, Mixpanel).
 *
 * Para integrar um provider, implemente as funções no objeto `provider`
 * e chame `initAnalytics(providerImpl)` no boot do app.
 */

// ─── Catálogo de Eventos ────────────────────────────────────────────────────────
export const EVENTS = {
  APP_OPEN: 'app_open',
  BEEP_ACTIVATED: 'beep_activated',
  BEEP_DEACTIVATED: 'beep_deactivated',
  SYNC_COMPLETED: 'sync_completed',
  SYNC_FAILED: 'sync_failed',
  INTERVAL_CHANGED: 'interval_changed',
  SOUND_CHANGED: 'sound_changed',
  VIBRATION_CHANGED: 'vibration_changed',
  PREMIUM_BANNER_VIEW: 'premium_banner_view',
  UPGRADE_CLICK: 'upgrade_click',
  PURCHASE_COMPLETED: 'purchase_completed',
  PURCHASE_RESTORED: 'purchase_restored',
  QUIET_HOURS_TOGGLED: 'quiet_hours_toggled',
  ATOMIC_SYNC_TOGGLED: 'atomic_sync_toggled',
};

// ─── Provider (null = dev-only logging) ─────────────────────────────────────────
let provider = null;

/**
 * Inicializa o analytics com um provider real.
 * @param {{ trackEvent: Function, setUserProperty: Function, identify: Function }} impl
 */
export function initAnalytics(impl) {
  provider = impl;
}

/**
 * Rastreia um evento com parâmetros opcionais.
 * @param {string} eventName - Nome do evento (use EVENTS constants)
 * @param {Object} [params={}] - Parâmetros adicionais
 */
export function trackEvent(eventName, params = {}) {
  const enrichedParams = {
    ...params,
    timestamp: Date.now(),
  };

  if (__DEV__) {
    console.log(`[Analytics] ${eventName}`, enrichedParams);
  }

  if (provider?.trackEvent) {
    try {
      provider.trackEvent(eventName, enrichedParams);
    } catch (e) {
      console.warn('[Analytics] Erro ao rastrear evento:', e);
    }
  }
}

/**
 * Define uma propriedade persistente do usuário.
 * @param {string} key
 * @param {string|number|boolean} value
 */
export function setUserProperty(key, value) {
  if (__DEV__) {
    console.log(`[Analytics] setUserProperty: ${key} = ${value}`);
  }

  if (provider?.setUserProperty) {
    try {
      provider.setUserProperty(key, value);
    } catch (e) {
      console.warn('[Analytics] Erro ao definir propriedade:', e);
    }
  }
}

/**
 * Identifica o usuário (para analytics que suportam user ID).
 * @param {string} userId
 */
export function identifyUser(userId) {
  if (__DEV__) {
    console.log(`[Analytics] identifyUser: ${userId}`);
  }

  if (provider?.identify) {
    try {
      provider.identify(userId);
    } catch (e) {
      console.warn('[Analytics] Erro ao identificar usuário:', e);
    }
  }
}
