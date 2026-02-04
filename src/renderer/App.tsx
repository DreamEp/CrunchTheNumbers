import { useEffect } from 'react';
import { useAppStore } from './stores/useAppStore';
import Dashboard from './components/Dashboard/Dashboard';
import Planning from './components/Planning/Planning';
import Config from './components/Config/Config';
import Templates from './components/Templates/Templates';
import { Reports } from './components/Reports';
import { Tabs, Tab, Tooltip } from './components/ui';

type TabId = 'dashboard' | 'planning' | 'config' | 'templates' | 'reports';

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'planning', label: 'Planning', icon: '📅' },
  { id: 'config', label: 'Gestion', icon: '👥' },
  { id: 'templates', label: 'Séances', icon: '📋' },
  { id: 'reports', label: 'Rapports', icon: '📈' },
];

function Logo() {
  return (
    <div className="logo-font text-xl md:text-2xl">
      <span className="text-red">Crunch</span>
      <span className="text-accent">TheNumbers</span>
    </div>
  );
}

function Footer() {
  return (
    <footer className="text-muted/50 text-xs text-right py-3 tracking-wide">
      powered by Etienne Pin-Claret
    </footer>
  );
}

function App() {
  const { isLoading, activeTab, setActiveTab, loadData, settings, updateSettings } = useAppStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-base">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-overlay border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-base">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-border">
        <div className="w-full px-6 md:px-8 lg:px-10 py-4">
          <div className="flex items-center justify-between gap-4">
            <Logo />

            {/* Navigation tabs */}
            <Tabs>
              {tabs.map((tab) => (
                <Tab
                  key={tab.id}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="flex items-center gap-2">
                    <span>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>
                </Tab>
              ))}
            </Tabs>

            {/* Tooltip toggle */}
            <Tooltip
              content={
                <div className="text-xs">
                  {settings.showTooltips
                    ? "Cliquez pour masquer les infobulles d'aide"
                    : "Cliquez pour afficher les infobulles d'aide"}
                </div>
              }
            >
              <button
                onClick={() => updateSettings({ showTooltips: !settings.showTooltips })}
                className={`p-2 rounded-lg transition-colors ${
                  settings.showTooltips
                    ? 'bg-accent/20 text-accent hover:bg-accent/30'
                    : 'bg-overlay text-muted hover:bg-overlay/80'
                }`}
                title={settings.showTooltips ? "Masquer les infobulles" : "Afficher les infobulles"}
              >
                <span className="text-lg">{settings.showTooltips ? '💡' : '🔕'}</span>
              </button>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full px-6 md:px-8 lg:px-10 py-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'planning' && <Planning />}
        {activeTab === 'config' && <Config />}
        {activeTab === 'templates' && <Templates />}
        {activeTab === 'reports' && <Reports />}
      </main>

      {/* Footer */}
      <div className="w-full px-6 md:px-8 lg:px-10 pb-4">
        <Footer />
      </div>
    </div>
  );
}

export default App;
