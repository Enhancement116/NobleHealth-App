
import React, { useState } from 'react';
import { WaterLog, UserData } from '../types';

interface Props {
  water: WaterLog;
  onUpdate: (w: WaterLog) => void;
  userData: UserData;
  setUserData: (u: UserData) => void;
}

export const WaterTracker: React.FC<Props> = ({ water, onUpdate, userData, setUserData }) => {
  const [isEditingPresets, setIsEditingPresets] = useState(false);
  const [tempPresets, setTempPresets] = useState<string[]>([]);

  const addWater = (amount: number) => {
    onUpdate({
      ...water,
      current: water.current + amount,
      history: [...water.history, amount]
    });
  };

  const undoLast = () => {
    if (water.history.length === 0) return;
    const lastAmount = water.history[water.history.length - 1];
    const newHistory = water.history.slice(0, -1);
    onUpdate({
      ...water,
      current: Math.max(0, water.current - lastAmount),
      history: newHistory
    });
  };

  // Preset Management
  const startEditing = () => {
    setTempPresets(userData.waterPresets.map(String));
    setIsEditingPresets(true);
  };

  const savePresets = () => {
    const newPresets = tempPresets.map(s => parseInt(s) || 0).filter(n => n > 0);
    // Ensure we have at least some presets
    const finalPresets = newPresets.length > 0 ? newPresets : [100, 250, 500];
    setUserData({ ...userData, waterPresets: finalPresets });
    setIsEditingPresets(false);
  };

  const updateTempPreset = (index: number, val: string) => {
    const newArr = [...tempPresets];
    newArr[index] = val;
    setTempPresets(newArr);
  };

  const percentage = Math.min(100, (water.current / water.goal) * 100);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative">
        <h2 className="text-xl font-light text-white text-center uppercase tracking-widest">水分補充</h2>
        {/* Undo Button - Top Left/Right absolute? Or integrated nearby */}
        {water.history.length > 0 && (
           <button 
            onClick={undoLast}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-noble-muted hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14L4 9l5-5"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
            撤銷
          </button>
        )}
      </div>

      {/* Visualization Circle */}
      <div className="relative w-64 h-64 mx-auto">
        {/* Background Circle */}
        <div className="absolute inset-0 rounded-full border-4 border-noble-border"></div>
        
        {/* Info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <span className="text-5xl font-light text-blue-400">{water.current}</span>
          <span className="text-sm text-noble-muted mt-1 uppercase tracking-wide">/ {water.goal} ml</span>
          <span className="text-xs text-noble-muted mt-4">{percentage.toFixed(0)}% 達成</span>
        </div>

        {/* SVG for simple circular progress */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle 
            cx="50" cy="50" r="46" 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="4" 
            strokeDasharray="289" 
            strokeDashoffset={289 - (289 * percentage) / 100}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
      </div>

      {/* Control Area */}
      <div>
        <div className="flex justify-between items-center mb-3 px-1">
          <span className="text-xs text-noble-muted uppercase tracking-wide">快速紀錄 (ml)</span>
          <button 
            onClick={isEditingPresets ? savePresets : startEditing}
            className={`text-xs flex items-center gap-1 ${isEditingPresets ? 'text-noble-gold' : 'text-noble-muted hover:text-white'}`}
          >
            {isEditingPresets ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                完成設定
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                自訂單位
              </>
            )}
          </button>
        </div>

        {!isEditingPresets ? (
          <div className="grid grid-cols-4 gap-3">
            {userData.waterPresets.map((amount, idx) => (
              <button
                key={idx}
                onClick={() => addWater(amount)}
                className="bg-noble-panel border border-noble-border hover:border-blue-500 hover:text-blue-400 text-noble-muted py-4 rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95"
              >
                <span className="text-xs text-blue-500/50">+</span>
                <span className="font-bold text-lg">{amount}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 bg-noble-panel/50 p-3 rounded-xl border border-noble-border/50 border-dashed">
             {tempPresets.map((val, idx) => (
               <div key={idx} className="flex flex-col gap-1">
                  <input 
                    type="number"
                    value={val}
                    onChange={(e) => updateTempPreset(idx, e.target.value)}
                    className="w-full bg-noble-black border border-noble-border rounded-lg py-3 text-center text-white focus:border-noble-gold outline-none"
                  />
               </div>
             ))}
             <div className="col-span-4 text-center text-[10px] text-noble-muted pt-2">
               輸入常用容量，設定完成請按右上角「完成設定」
             </div>
          </div>
        )}
      </div>

      {/* Footer Reset */}
      <div className="text-center pt-4">
         {/* Hint Text */}
         <p className="text-[10px] text-noble-muted/50">每日 00:00 (GMT+8) 自動開啟新紀錄</p>
      </div>
    </div>
  );
};
