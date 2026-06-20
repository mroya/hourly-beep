import { createContext, useReducer, useContext, useRef } from 'react';

// ─── Estado Inicial ─────────────────────────────────────────────────────────────
const initialState = {
  // Core
  isEnabled: false,
  intervalTime: 3600,

  // Sincronização Temporal
  timeOffset: 0,
  isSyncing: false,
  lastSyncTime: null,
  useAtomicSync: false,

  // Premium
  isPremium: false,
  showUpgrade: false,

  // Configurações Premium
  selectedSound: 'beep',
  selectedVibration: 'short',
  quietHoursEnabled: false,
  quietHoursStart: 22,
  quietHoursEnd: 7,

  // Controle interno
  settingsLoaded: false,
};

// ─── Actions ────────────────────────────────────────────────────────────────────
const ACTIONS = {
  SET_ENABLED: 'SET_ENABLED',
  SET_INTERVAL: 'SET_INTERVAL',
  SET_SOUND: 'SET_SOUND',
  SET_VIBRATION: 'SET_VIBRATION',
  SET_ATOMIC_SYNC: 'SET_ATOMIC_SYNC',
  SYNC_START: 'SYNC_START',
  SYNC_SUCCESS: 'SYNC_SUCCESS',
  SYNC_FAIL: 'SYNC_FAIL',
  SET_PREMIUM: 'SET_PREMIUM',
  TOGGLE_UPGRADE: 'TOGGLE_UPGRADE',
  SET_QUIET_HOURS_ENABLED: 'SET_QUIET_HOURS_ENABLED',
  SET_QUIET_HOURS_START: 'SET_QUIET_HOURS_START',
  SET_QUIET_HOURS_END: 'SET_QUIET_HOURS_END',
  HYDRATE_SETTINGS: 'HYDRATE_SETTINGS',
  SETTINGS_LOADED: 'SETTINGS_LOADED',
};

// ─── Reducer ────────────────────────────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_ENABLED:
      return { ...state, isEnabled: action.payload };
    case ACTIONS.SET_INTERVAL:
      return { ...state, intervalTime: action.payload };
    case ACTIONS.SET_SOUND:
      return { ...state, selectedSound: action.payload };
    case ACTIONS.SET_VIBRATION:
      return { ...state, selectedVibration: action.payload };
    case ACTIONS.SET_ATOMIC_SYNC:
      return { ...state, useAtomicSync: action.payload };
    case ACTIONS.SYNC_START:
      return { ...state, isSyncing: true };
    case ACTIONS.SYNC_SUCCESS:
      return {
        ...state,
        isSyncing: false,
        timeOffset: action.payload.offset,
        lastSyncTime: new Date(),
      };
    case ACTIONS.SYNC_FAIL:
      return { ...state, isSyncing: false };
    case ACTIONS.SET_PREMIUM:
      return { ...state, isPremium: action.payload };
    case ACTIONS.TOGGLE_UPGRADE:
      return { ...state, showUpgrade: action.payload };
    case ACTIONS.SET_QUIET_HOURS_ENABLED:
      return { ...state, quietHoursEnabled: action.payload };
    case ACTIONS.SET_QUIET_HOURS_START:
      return { ...state, quietHoursStart: action.payload };
    case ACTIONS.SET_QUIET_HOURS_END:
      return { ...state, quietHoursEnd: action.payload };
    case ACTIONS.HYDRATE_SETTINGS:
      return { ...state, ...action.payload };
    case ACTIONS.SETTINGS_LOADED:
      return { ...state, settingsLoaded: true };
    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────────
const AppContext = createContext(null);
const AppDispatchContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppContext.Provider>
  );
}

// ─── Hooks de acesso ────────────────────────────────────────────────────────────
export function useAppState() {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useAppState deve ser usado dentro de um AppProvider');
  }
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (context === null) {
    throw new Error('useAppDispatch deve ser usado dentro de um AppProvider');
  }
  return context;
}

export { ACTIONS };
