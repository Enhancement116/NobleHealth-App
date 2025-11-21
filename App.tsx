
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { NutritionLogger } from './components/NutritionLogger';
import { WaterTracker } from './components/WaterTracker';
import { ZeppImport } from './components/ZeppImport';
import { UserData, DailyLog, AppView, DailyNutrition, WaterLog } from './types';
import { HashRouter } from 'react-router-dom';

// Icons
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const UtensilsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>;
const DropletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-2-3-2-3L12 2 7 12s-2 1-2 3a7 7 0 0 0 7 7z"/></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;

// Initial Data Factories
const createInitialNutrition = (): DailyNutrition => ({
  calories: 0,
  sugar: 0,
  fat: 0,
  carbs: 0,
  protein: 0,
  meals: [],
  limits: {
    calories: 2200,
    sugar: 40,
    fat: 70,
    carbs: 250,
    protein: 150
  }
});

const createInitialWater = (): WaterLog => ({
  current: 0,
  goal: 2500,
  unitSize: 250,
  history: []
});

const createDailyLog = (date: string): DailyLog => ({
  date,
  weight: 0,
  bodyMetrics: null,
  nutrition: createInitialNutrition(),
  water: createInitialWater(),
  aiReport: null
});

const INITIAL_USER_DATA: UserData = {
  currentWeight: 0,
  weightGoal: 0,
  lastSync: null,
  waterPresets: [150, 250, 500, 700] // Default presets
};

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  
  // Date State - Force Taiwan Time (GMT+8)
  const getToday = () => {
    const date = new Date();
    // en-CA gives YYYY-MM-DD format
    return date.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
  };
  
  const [selectedDate, setSelectedDate] = useState<string>(getToday());
  
  // Data State
  const [userData, setUserData] = useState<UserData>(INITIAL_USER_DATA);
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [loaded, setLoaded] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedUserData = localStorage.getItem('noble_userData');
    const savedLogs = localStorage.getItem('noble_logs');

    if (savedUserData) {
      const parsedUser = JSON.parse(savedUserData);
      if (!parsedUser.waterPresets) parsedUser.waterPresets = [150, 250, 500, 700];
      setUserData(parsedUser);
    }
    if (savedLogs) {
      const parsedLogs = JSON.parse(savedLogs);
      
      // Data Migration: Ensure all logs have new fields (history, bodyMetrics)
      Object.keys(parsedLogs).forEach(key => {
        const log = parsedLogs[key];
        if (log.water && !Array.isArray(log.water.history)) {
          log.water.history = [];
        }
        if (log.bodyMetrics === undefined) {
          log.bodyMetrics = null;
        }
      });
      
      setLogs(parsedLogs);
    }
    
    setLoaded(true);
  }, []);

  // Save to LocalStorage whenever data changes
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('noble_userData', JSON.stringify(userData));
    localStorage.setItem('noble_logs', JSON.stringify(logs));
  }, [userData, logs, loaded]);

  const getCurrentLog = (): DailyLog => {
    if (logs[selectedDate]) return logs[selectedDate];
    const newLog = createDailyLog(selectedDate);
    return newLog;
  };

  const updateCurrentLog = (updater: (prev: DailyLog) => DailyLog) => {
    setLogs(prev => {
      const current = prev[selectedDate] || createDailyLog(selectedDate);
      const updated = updater(current);
      return { ...prev, [selectedDate]: updated };
    });
  };

  const activeLog = getCurrentLog();

  // Navigation wrapper
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            userData={userData} 
            dailyLog={activeLog} 
            onUpdateLog={updateCurrentLog}
            date={selectedDate}
            setDate={setSelectedDate}
            allLogs={logs}
          />
        );
      case 'nutrition':
        return (
          <NutritionLogger 
            nutrition={activeLog.nutrition} 
            onUpdate={(newNut) => updateCurrentLog(log => ({ ...log, nutrition: newNut }))} 
          />
        );
      case 'water':
        return (
          <WaterTracker 
            water={activeLog.water} 
            onUpdate={(newWater) => updateCurrentLog(log => ({ ...log, water: newWater }))}
            userData={userData}
            setUserData={setUserData}
          />
        );
      case 'settings':
        return (
          <ZeppImport 
            userData={userData} 
            setUserData={setUserData} 
            dailyLog={activeLog}
            updateDailyLog={updateCurrentLog}
          />
        );
      default:
        return null;
    }
  };

  if (!loaded) return <div className="min-h-screen bg-noble-black flex items-center justify-center text-noble-gold">Loading...</div>;

  return (
    <HashRouter>
      <div className="min-h-screen bg-noble-black text-noble-text font-sans selection:bg-noble-gold selection:text-noble-black">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-noble-black/90 backdrop-blur-md border-b border-noble-border h-16 flex items-center justify-center">
          <h1 className="text-xl font-light tracking-widest text-noble-gold uppercase">
            Noble<span className="font-bold text-white">Health</span>
          </h1>
        </header>

        {/* Main Content Area */}
        <main className="pt-20 pb-24 px-4 max-w-md mx-auto min-h-screen">
          {renderView()}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-noble-panel border-t border-noble-border pb-safe">
          <div className="flex justify-around items-center h-16 max-w-md mx-auto">
            <NavButton 
              active={currentView === 'dashboard'} 
              onClick={() => setCurrentView('dashboard')} 
              icon={<HomeIcon />} 
              label="今日總覽" 
            />
            <NavButton 
              active={currentView === 'nutrition'} 
              onClick={() => setCurrentView('nutrition')} 
              icon={<UtensilsIcon />} 
              label="飲食紀錄" 
            />
            <NavButton 
              active={currentView === 'water'} 
              onClick={() => setCurrentView('water')} 
              icon={<DropletIcon />} 
              label="水分補充" 
            />
            <NavButton 
              active={currentView === 'settings'} 
              onClick={() => setCurrentView('settings')} 
              icon={<SettingsIcon />} 
              label="數據連結" 
            />
          </div>
        </nav>
      </div>
    </HashRouter>
  );
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick} 
    className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-300 ${active ? 'text-noble-gold' : 'text-noble-muted hover:text-white'}`}
  >
    <div className="mb-1 scale-90">{icon}</div>
    <span className="text-[10px] font-medium tracking-wider">{label}</span>
  </button>
);
