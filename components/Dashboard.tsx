
import React, { useState } from 'react';
import { UserData, DailyLog } from '../types';
import { generateHealthReport } from '../services/geminiService';

interface DashboardProps {
  userData: UserData;
  dailyLog: DailyLog;
  onUpdateLog: (updater: (prev: DailyLog) => DailyLog) => void;
  date: string;
  setDate: (date: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userData, dailyLog, onUpdateLog, date, setDate }) => {
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const report = await generateHealthReport(userData, dailyLog);
    onUpdateLog(prev => ({ ...prev, aiReport: report }));
    setLoading(false);
  };

  // Date Navigation Helpers
  const changeDate = (offset: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    setDate(d.toISOString().split('T')[0]);
  };

  const isToday = date === new Date().toISOString().split('T')[0];

  // Data Derivations
  const displayWeight = dailyLog.weight > 0 ? dailyLog.weight : userData.currentWeight;
  const weightDiff = (displayWeight - userData.weightGoal).toFixed(1);
  const isAboveGoal = displayWeight > userData.weightGoal;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Date Navigator */}
      <div className="flex items-center justify-between bg-noble-panel border border-noble-border rounded-lg p-2 mb-4">
        <button onClick={() => changeDate(-1)} className="p-2 text-noble-muted hover:text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="text-center">
          <span className="block text-white font-medium tracking-wide">{date}</span>
          {isToday && <span className="text-[10px] text-noble-gold uppercase tracking-widest">Today</span>}
        </div>
        <button onClick={() => changeDate(1)} className="p-2 text-noble-muted hover:text-white" disabled={isToday}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* Zepp Life Summary Card */}
      <div className="bg-gradient-to-br from-noble-panel to-noble-black border border-noble-border rounded-2xl p-6 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
        
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-noble-muted text-xs font-bold tracking-widest uppercase">Zepp Life 同步數據</h2>
            <p className="text-2xl font-light text-white mt-1">
              {displayWeight > 0 ? `${displayWeight} kg` : '-- kg'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-noble-muted uppercase tracking-wider">目標差距</p>
            <p className={`text-lg font-medium ${isAboveGoal ? 'text-red-400' : 'text-green-400'}`}>
              {displayWeight > 0 ? (isAboveGoal ? `+${weightDiff}` : weightDiff) : '--'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 border-t border-noble-border pt-4">
          <div>
            <span className="text-noble-muted text-xs block">當日步數</span>
            <span className="text-lg text-white">{dailyLog.steps.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-noble-muted text-xs block">睡眠時數</span>
            <span className="text-lg text-white">{dailyLog.sleepHours} <span className="text-sm text-noble-muted">hr</span></span>
          </div>
        </div>

        <div className="mt-6">
           <button 
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-3 px-4 bg-noble-gold/10 hover:bg-noble-gold/20 border border-noble-gold/30 text-noble-gold rounded-lg text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="animate-pulse">AI 生成報告中...</span>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 12z"/><path d="M21 3v9h-9"/></svg>
                {dailyLog.aiReport ? "重新生成今日報告" : "生成今日健康報告"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Report Area */}
      {dailyLog.aiReport && (
        <div className="bg-noble-panel border border-noble-gold/20 rounded-xl p-6 shadow-lg shadow-noble-gold/5 animate-slide-up">
          <h3 className="text-noble-gold text-sm font-bold tracking-widest mb-3 uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-noble-gold"></span>
            AI 每日尊榮分析
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {dailyLog.aiReport}
          </p>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-noble-panel border border-noble-border rounded-xl p-4">
          <h3 className="text-noble-muted text-xs uppercase tracking-wider mb-2">剩餘卡路里</h3>
          <div className="relative pt-2">
            <div className="flex items-end gap-1">
              <span className="text-2xl font-light text-white">{Math.max(0, dailyLog.nutrition.limits.calories - dailyLog.nutrition.calories)}</span>
              <span className="text-xs text-noble-muted mb-1">kcal</span>
            </div>
            <div className="h-1 w-full bg-noble-border mt-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full" 
                style={{ width: `${Math.min(100, (dailyLog.nutrition.calories / dailyLog.nutrition.limits.calories) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-noble-panel border border-noble-border rounded-xl p-4">
          <h3 className="text-noble-muted text-xs uppercase tracking-wider mb-2">水分攝取</h3>
          <div className="relative pt-2">
             <div className="flex items-end gap-1">
              <span className="text-2xl font-light text-blue-400">{dailyLog.water.current}</span>
              <span className="text-xs text-noble-muted mb-1">/ {dailyLog.water.goal}ml</span>
            </div>
            <div className="h-1 w-full bg-noble-border mt-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${Math.min(100, (dailyLog.water.current / dailyLog.water.goal) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
