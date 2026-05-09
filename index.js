import { registerRootComponent } from 'expo';
import PushNotificationService from './src/services/PushNotificationService';

import App from './App';

// Setup FCM Background Handler
PushNotificationService.setupBackgroundHandler();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
