// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  backendURL: "http://localhost:8081/api/v1",
  keycloakConfig: {
    url: 'http://localhost:8080/',
    realm: 'medbox',
    clientId: 'medbox-app',
  },
  firebase: {
    apiKey: "AIzaSyD2mHNZGqgdsYp0jcKu4RiuEV93C4ZLElQ",
    authDomain: "medbox-5339d.firebaseapp.com",
    projectId: "medbox-5339d",
    storageBucket: "medbox-5339d.firebasestorage.app",
    messagingSenderId: "376604264813",
    appId: "1:376604264813:web:d6e95a020fff7ff7c57264",
    measurementId: "G-9TFLH3JWRY",
    vapidKey: "BKm62PsCspKX5riK3OIk25mVo7FFxOlajOa6WOpqOP5jhXyiK4adgYLNYgb4qpxMiUV6VRzTMEbd8Ug8oG2zG58"
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
