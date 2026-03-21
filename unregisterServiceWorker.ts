export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        console.log('Unregistering service worker:', registration);
        registration.unregister();
      }
      if (registrations.length === 0) {
        console.log('No service workers found to unregister.');
      }
    }).catch((error) => {
      console.error('Error unregistering service workers:', error);
    });
  }
}
