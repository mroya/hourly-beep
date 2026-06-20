import * as Notifications from 'expo-notifications';
import { AppProvider } from './contexts/AppContext';
import HomeScreen from './screens/HomeScreen';

// ─── Handler global de notificações ─────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <HomeScreen />
    </AppProvider>
  );
}
