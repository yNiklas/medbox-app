export const environment = {
  production: true,
  backendURL: "https://medbox-api.juliany.de/api/v1",
  keycloakConfig: {
    url: 'https://medbox-auth.juliany.de/',
    realm: 'medbox',
    clientId: 'medbox-app',
  },
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    vapidKey: "YOUR_VAPID_KEY"
  }
};
