import Store from 'electron-store';
import { Participant, SessionRecord, SessionTemplate, Settings, AppData, defaultAppData, defaultSettings, DateMarker } from '../shared/types';

interface StoreSchema {
  participants: Participant[];
  archive: Participant[];
  sessionsHistory: SessionRecord[];
  sessionTemplates: SessionTemplate[];
  settings: Settings;
  dateMarkers: DateMarker[];
}

let store: Store<StoreSchema>;

export function initStorage(): void {
  store = new Store<StoreSchema>({
    name: 'paintracker-data',
    defaults: {
      participants: defaultAppData.participants,
      archive: defaultAppData.archive,
      sessionsHistory: defaultAppData.sessionsHistory,
      sessionTemplates: defaultAppData.sessionTemplates,
      settings: defaultSettings,
      dateMarkers: defaultAppData.dateMarkers,
    },
  });
}

export function getData(): AppData {
  return {
    participants: store.get('participants', []),
    archive: store.get('archive', []),
    sessionsHistory: store.get('sessionsHistory', []),
    sessionTemplates: store.get('sessionTemplates', []),
    settings: store.get('settings', defaultSettings),
    dateMarkers: store.get('dateMarkers', []),
  };
}

export function saveParticipants(participants: Participant[]): void {
  store.set('participants', participants);
}

export function saveArchive(archive: Participant[]): void {
  store.set('archive', archive);
}

export function saveSessionsHistory(history: SessionRecord[]): void {
  store.set('sessionsHistory', history);
}

export function saveSessionTemplates(templates: SessionTemplate[]): void {
  store.set('sessionTemplates', templates);
}

export function saveSettings(settings: Settings): void {
  store.set('settings', settings);
}

export function saveDateMarkers(markers: DateMarker[]): void {
  store.set('dateMarkers', markers);
}
