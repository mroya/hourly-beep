import { useEffect, useRef } from 'react';
import { useAppState, useAppDispatch, ACTIONS } from '../contexts/AppContext';
import { loadSettings, saveSettings } from '../services/premium';
import { trackEvent, EVENTS, setUserProperty } from '../services/analytics';

/**
 * Hook que gerencia persistência de configurações.
 * - Carrega do AsyncStorage na montagem (hydrate)
 * - Salva automaticamente quando o estado muda (com guard de settingsLoaded)
 */
export function useSettings() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const settingsLoaded = useRef(false);

  const {
    intervalTime,
    useAtomicSync,
    selectedSound,
    quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd,
    isEnabled,
    selectedVibration,
  } = state;

  // ─── Carregar configurações do AsyncStorage ──────────────────────────────────
  const hydrateSettings = async () => {
    const saved = await loadSettings();
    if (saved) {
      dispatch({
        type: ACTIONS.HYDRATE_SETTINGS,
        payload: {
          ...(saved.intervalTime !== undefined && { intervalTime: saved.intervalTime }),
          ...(saved.useAtomicSync !== undefined && { useAtomicSync: saved.useAtomicSync }),
          ...(saved.selectedSound && { selectedSound: saved.selectedSound }),
          ...(saved.quietHoursEnabled !== undefined && { quietHoursEnabled: saved.quietHoursEnabled }),
          ...(saved.quietHoursStart !== undefined && { quietHoursStart: saved.quietHoursStart }),
          ...(saved.quietHoursEnd !== undefined && { quietHoursEnd: saved.quietHoursEnd }),
          ...(saved.isEnabled !== undefined && { isEnabled: saved.isEnabled }),
          ...(saved.selectedVibration && { selectedVibration: saved.selectedVibration }),
        },
      });
    }
    dispatch({ type: ACTIONS.SETTINGS_LOADED });
    settingsLoaded.current = true;

    trackEvent(EVENTS.APP_OPEN, {
      isPremium: state.isPremium,
      intervalTime: saved?.intervalTime || 3600,
      useAtomicSync: saved?.useAtomicSync || false,
    });

    return saved;
  };

  // ─── Salvar configurações quando mudam ───────────────────────────────────────
  useEffect(() => {
    if (!settingsLoaded.current) return;
    saveSettings({
      intervalTime,
      useAtomicSync,
      selectedSound,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      isEnabled,
      selectedVibration,
    });
  }, [intervalTime, useAtomicSync, selectedSound, quietHoursEnabled, quietHoursStart, quietHoursEnd, isEnabled, selectedVibration]);

  return {
    hydrateSettings,
    settingsLoaded,
  };
}
