import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Puedes añadir funciones aquí si necesitas que React hable con Electron
});
