import { contextBridge, ipcRenderer } from 'electron';
import { Participant, SessionRecord, SessionTemplate, Settings, AppData, DateMarker } from '../shared/types';

interface SaveDialogOptions {
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
}

interface SaveDialogResult {
  canceled: boolean;
  filePath?: string;
}

// API exposée au renderer
const api = {
  getData: (): Promise<AppData> => ipcRenderer.invoke('get-data'),
  saveParticipants: (participants: Participant[]): Promise<boolean> =>
    ipcRenderer.invoke('save-participants', participants),
  saveArchive: (archive: Participant[]): Promise<boolean> =>
    ipcRenderer.invoke('save-archive', archive),
  saveSessionsHistory: (history: SessionRecord[]): Promise<boolean> =>
    ipcRenderer.invoke('save-sessions-history', history),
  saveSessionTemplates: (templates: SessionTemplate[]): Promise<boolean> =>
    ipcRenderer.invoke('save-session-templates', templates),
  saveSettings: (settings: Settings): Promise<boolean> =>
    ipcRenderer.invoke('save-settings', settings),
  saveDateMarkers: (markers: DateMarker[]): Promise<boolean> =>
    ipcRenderer.invoke('save-date-markers', markers),
  showSaveDialog: (options: SaveDialogOptions): Promise<SaveDialogResult> =>
    ipcRenderer.invoke('show-save-dialog', options),
  saveFile: (filePath: string, content: string | Uint8Array, encoding: 'utf-8' | 'binary'): Promise<boolean> =>
    ipcRenderer.invoke('save-file', filePath, content, encoding),
};

// Expose l'API au renderer
contextBridge.exposeInMainWorld('api', api);

// Types pour TypeScript côté renderer
export type ElectronAPI = typeof api;
