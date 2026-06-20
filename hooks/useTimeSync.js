import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useAppState, useAppDispatch, ACTIONS } from '../contexts/AppContext';
import { performTimeSync } from '../services/timeSync';
import { trackEvent, EVENTS } from '../services/analytics';

/**
 * Hook que encapsula toda a lógica de sincronização NTP.
 * Gerencia estados de sync, offset e última calibração.
 */
export function useTimeSync() {
  const { isSyncing, timeOffset, lastSyncTime, useAtomicSync } = useAppState();
  const dispatch = useAppDispatch();

  const effectiveOffset = useAtomicSync ? timeOffset : 0;

  const syncTime = useCallback(async (silent = false) => {
    if (isSyncing) return null;
    dispatch({ type: ACTIONS.SYNC_START });

    const { success, offset } = await performTimeSync();

    if (success) {
      dispatch({ type: ACTIONS.SYNC_SUCCESS, payload: { offset } });

      trackEvent(EVENTS.SYNC_COMPLETED, {
        offset,
        source: 'ntp_http',
        absOffsetMs: Math.abs(offset),
      });

      if (!silent) {
        const absOffsetSec = Math.abs(offset / 1000).toFixed(3);
        const driftText = offset >= 0
          ? `atrasado em +${absOffsetSec}s`
          : `adiantado em -${absOffsetSec}s`;
        Alert.alert(
          'Calibração de Alta Precisão',
          `Conectado ao servidor atômico!\n\nSeu relógio local está ${driftText}.\n\nCompensação ativa de ${offset >= 0 ? '+' : ''}${offset}ms aplicada com sucesso!`
        );
      }
      return offset;
    }

    dispatch({ type: ACTIONS.SYNC_FAIL });
    trackEvent(EVENTS.SYNC_FAILED);

    if (!silent) {
      Alert.alert(
        'Erro de Conexão',
        'Não foi possível calibrar o horário. Verifique sua conexão com a internet.'
      );
    }

    return null;
  }, [isSyncing, dispatch]);

  const getSyncModeText = useCallback(() => {
    if (useAtomicSync) return lastSyncTime ? 'NTP Compensado' : 'NTP Pendente';
    return 'Relógio do Celular';
  }, [useAtomicSync, lastSyncTime]);

  return {
    isSyncing,
    timeOffset,
    lastSyncTime,
    useAtomicSync,
    effectiveOffset,
    syncTime,
    getSyncModeText,
  };
}
