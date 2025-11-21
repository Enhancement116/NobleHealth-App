
import React, { useState } from 'react';
import { UserData, DailyLog } from '../types';
import { MOCK_ZEPP_DATA } from '../constants';

interface Props {
  userData: UserData;
  setUserData: (data: UserData) => void;
  dailyLog: DailyLog;
  updateDailyLog: (updater: (prev: DailyLog) => DailyLog) => void;
}

export const ZeppImport: React.FC<Props> = ({ userData, setUserData, dailyLog, updateDailyLog }) => {
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSimulateSync = () => {
    setImportStatus('loading');
    
    setTimeout(() => {
      // Update Global User Data (Current known weight)
      setUserData({
        ...userData,
        currentWeight: MOCK_ZEPP_DATA.weight,
        weightGoal: MOCK_ZEPP_DATA.weightGoal,
        lastSync: new Date().toISOString()
      });

      // Update Daily Specifics (Steps, Sleep, Weight Measurement for today)
      updateDailyLog(prev => ({
        ...prev,
        weight: MOCK_ZEPP_DATA.weight,
        steps: MOCK_ZEPP_DATA.steps,
        sleepHours: MOCK_ZEPP_DATA.sleepHours
      }));

      setImportStatus('success');
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-light text-white mb-1">資料來源設定</h2>
        <p className="text-sm text-noble-muted">連結您的健康裝置數據</p>
      </div>

      {/* Sync Card */}
      <div className="bg-noble-panel border border-noble-border rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
           <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xl">
            Z
          </div>
          <div>
            <h3 className="text-white font-bold">Zepp Life (原小米運動)</h3>
            <p className="text-xs text-noble-muted">狀態: {userData.lastSync ? '已連結' : '未連結'}</p>
          </div>
        </div>

        <div className="space-y-4">
            {/* One-Click Demo Sync */}
            <button 
                onClick={handleSimulateSync}
                className="w-full bg-noble-gold text-noble-black font-bold py-3 rounded-lg hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
            >
                {importStatus === 'loading' ? '同步中...' : '一鍵同步 (模擬 Demo)'}
            </button>
        </div>
        
        {importStatus === 'success' && (
            <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 text-green-400 text-xs rounded text-center">
                數據匯入成功！步數、體重與睡眠數據已更新至今日紀錄。
            </div>
        )}
      </div>

      <div className="bg-noble-panel border border-noble-border rounded-xl p-6">
        <h3 className="text-white font-bold mb-4">個人目標設定</h3>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs text-noble-muted mb-1">體重目標 (kg)</label>
                <input type="number" disabled value={userData.weightGoal || 70} className="w-full bg-noble-dark border border-noble-border rounded p-2 text-white" />
            </div>
            <div>
                <label className="block text-xs text-noble-muted mb-1">每日步數</label>
                <input type="number" disabled value="10000" className="w-full bg-noble-dark border border-noble-border rounded p-2 text-white" />
            </div>
        </div>
        <p className="text-[10px] text-noble-muted mt-4 text-center">
            * Zepp Life 數據需透過官方 APP 匯出功能取得，或使用第三方工具同步至 Google Fit 後匯入。本 APP 提供 CSV 解析與 AI 分析功能。
        </p>
      </div>
    </div>
  );
};
