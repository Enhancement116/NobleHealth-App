
import React, { useState } from 'react';
import { UserData, DailyLog, BodyMetrics } from '../types';
import { generateHealthReport } from '../services/geminiService';

interface DashboardProps {
  userData: UserData;
  dailyLog: DailyLog;
  onUpdateLog: (updater: (prev: DailyLog) => DailyLog) => void;
  date: string;
  setDate: (date: string) => void;
  allLogs?: Record<string, DailyLog>;
}

export const Dashboard: React.FC<DashboardProps> = ({ userData, dailyLog, onUpdateLog, date, setDate, allLogs }) => {
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
    const newDateStr = d.toISOString().split('T')[0];
    setDate(newDateStr);
  };

  const isToday = date === new Date().toISOString().split('T')[0];

  // Data Derivations
  const displayWeight = dailyLog.weight > 0 ? dailyLog.weight : userData.currentWeight;
  
  // Find previous valid log for comparison
  const getComparisonData = (): { weightDiff: string, bodyMetricsDiff: Partial<BodyMetrics> } => {
    if (!allLogs) return { weightDiff: '--', bodyMetricsDiff: {} };
    
    const sortedDates = Object.keys(allLogs)
      .filter(d => d < date && allLogs[d].weight > 0)
      .sort((a, b) => b.localeCompare(a));
    
    const prevLog = sortedDates.length > 0 ? allLogs[sortedDates[0]] : null;

    if (!prevLog) return { weightDiff: '--', bodyMetricsDiff: {} };

    const wDiff = (displayWeight - prevLog.weight).toFixed(2);
    const wDiffStr = Number(wDiff) > 0 ? `+${wDiff}` : wDiff;

    const bmDiff: Partial<BodyMetrics> = {};
    if (dailyLog.bodyMetrics && prevLog.bodyMetrics) {
      bmDiff.bodyFat = Number((dailyLog.bodyMetrics.bodyFat - prevLog.bodyMetrics.bodyFat).toFixed(1));
      bmDiff.muscleMass = Number((dailyLog.bodyMetrics.muscleMass - prevLog.bodyMetrics.muscleMass).toFixed(1));
      bmDiff.water = Number((dailyLog.bodyMetrics.water - prevLog.bodyMetrics.water).toFixed(1));
      bmDiff.protein = Number((dailyLog.bodyMetrics.protein - prevLog.bodyMetrics.protein).toFixed(1));
      bmDiff.bmr = Math.round(dailyLog.bodyMetrics.bmr - prevLog.bodyMetrics.bmr);
      bmDiff.visceralFat = Number((dailyLog.bodyMetrics.visceralFat - prevLog.bodyMetrics.visceralFat).toFixed(1));
      bmDiff.boneMass = Number((dailyLog.bodyMetrics.boneMass - prevLog.bodyMetrics.boneMass).toFixed(1));
    }

    return { weightDiff: wDiffStr, bodyMetricsDiff: bmDiff };
  };

  const comparison = getComparisonData();

  const MiniMetric = ({ label, value, unit }: { label: string, value: string | number, unit: string }) => (
    <div className="flex flex-col items-center justify-center p-2 bg-black/20 rounded-lg border border-white/5">
      <span className="text-[9px] text-noble-muted uppercase tracking-wide mb-1">{label}</span>
      <div className="flex items-baseline gap-0.5">
        <span className="text-sm text-white font-medium">{value}</span>
        <span className="text-[9px] text-noble-muted">{unit}</span>
      </div>
    </div>
  );

  const MacroRow = ({ label, current, max, color }: { label: string, current: number, max: number, color: string }) => {
    const pct = Math.min(100, (current / max) * 100);
    return (
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-noble-muted uppercase">{label}</span>
          <span className="text-white">{current.toFixed(0)}/{max}g</span>
        </div>
        <div className="h-1 w-full bg-noble-border rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${pct}%` }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-6">
      
      {/* Date Navigator */}
      <div className="flex items-center justify-between bg-noble-panel border border-noble-border rounded-lg p-2 mb-2">
        <button onClick={() => changeDate(-1)} className="p-2 text-noble-muted hover:text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="text-center">
          <span className="block text-white font-medium tracking-wide text-sm">{date}</span>
          {isToday && <span className="text-[9px] text-noble-gold uppercase tracking-widest">Today</span>}
        </div>
        <button onClick={() => changeDate(1)} className="p-2 text-noble-muted hover:text-white" disabled={isToday}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* Main Status Card (Weight & Fat) */}
      <div className="bg-gradient-to-br from-noble-panel to-noble-black border border-noble-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
         {/* Background Decoration */}
        <div className="absolute -right-6 -top-6 w-32 h-32 border border-noble-gold/10 rounded-full opacity-50 pointer-events-none"></div>
        
        <div className="flex justify-between items-start relative z-10">
          {/* Weight Section */}
          <div>
             <div className="flex items-center gap-2 mb-1">
                <h2 className="text-noble-muted text-[10px] font-bold tracking-widest uppercase">目前體重</h2>
                {comparison.weightDiff !== '--' && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${Number(comparison.weightDiff) > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                    {Number(comparison.weightDiff) > 0 ? '↑' : ''}{comparison.weightDiff}
                  </span>
                )}
             </div>
             <div className="flex items-baseline gap-1">
                <span className="text-4xl font-light text-white">{displayWeight > 0 ? displayWeight : '--'}</span>
                <span className="text-sm text-noble-muted">kg</span>
             </div>
          </div>

          {/* Body Fat Section - Prominent */}
          <div className="text-right">
             <div className="flex items-center gap-2 justify-end mb-1">
                {comparison.bodyMetricsDiff.bodyFat !== undefined && (
                   <span className={`text-[10px] px-1.5 py-0.5 rounded ${comparison.bodyMetricsDiff.bodyFat > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                     {comparison.bodyMetricsDiff.bodyFat > 0 ? '↑' : ''}{comparison.bodyMetricsDiff.bodyFat}%
                   </span>
                )}
                <h2 className="text-noble-gold text-[10px] font-bold tracking-widest uppercase">體脂率</h2>
             </div>
             <div className="flex items-baseline gap-1 justify-end">
                <span className="text-4xl font-light text-noble-gold">{dailyLog.bodyMetrics?.bodyFat || '--'}</span>
                <span className="text-sm text-noble-goldDim">%</span>
             </div>
          </div>
        </div>

        {/* Secondary Metrics Grid */}
        {dailyLog.bodyMetrics ? (
          <div className="grid grid-cols-4 gap-2 mt-6 pt-4 border-t border-noble-border/30">
             <MiniMetric label="肌肉量" value={dailyLog.bodyMetrics.muscleMass} unit="kg" />
             <MiniMetric label="水分" value={dailyLog.bodyMetrics.water} unit="%" />
             <MiniMetric label="內臟脂" value={dailyLog.bodyMetrics.visceralFat} unit="" />
             <MiniMetric label="代謝" value={dailyLog.bodyMetrics.bmr} unit="kcal" />
          </div>
        ) : (
          <div className="mt-4 text-center">
            <span className="text-[10px] text-noble-muted">連結 Zepp Life 獲取詳細數據</span>
          </div>
        )}

        {/* AI Action */}
        <div className="mt-5">
           <button 
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-3 bg-noble-gold/5 hover:bg-noble-gold/10 border border-noble-gold/20 text-noble-gold rounded-lg text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2"
          >
            {loading ? <span className="animate-pulse">AI 分析中...</span> : (dailyLog.aiReport ? "更新 AI 報告" : "生成 AI 健康報告")}
          </button>
        </div>
      </div>

      {/* AI Report View */}
      {dailyLog.aiReport && (
        <div className="bg-noble-panel border border-noble-gold/20 rounded-xl p-5 shadow-lg shadow-noble-gold/5">
          <h3 className="text-noble-gold text-xs font-bold tracking-widest mb-3 uppercase flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-noble-gold"></span>
            AI 每日尊榮分析
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-light">
            {dailyLog.aiReport}
          </p>
        </div>
      )}

      {/* Vital Stats Grid */}
      <div className="grid grid-cols-1 gap-4">
         {/* Nutrition Summary */}
         <div className="bg-noble-panel border border-noble-border rounded-xl p-5">
            <div className="flex justify-between items-end mb-4">
               <div>
                  <h3 className="text-white text-sm font-bold">今日營養攝取</h3>
                  <p className="text-[10px] text-noble-muted uppercase tracking-wider">Nutrition Intake</p>
               </div>
               <div className="text-right">
                  <span className="text-2xl font-light text-white">{dailyLog.nutrition.calories}</span>
                  <span className="text-[10px] text-noble-muted"> / {dailyLog.nutrition.limits.calories} kcal</span>
               </div>
            </div>
            
            <div className="space-y-4">
               <MacroRow label="蛋白質 (Protein)" current={dailyLog.nutrition.protein} max={dailyLog.nutrition.limits.protein} color="bg-blue-500" />
               <MacroRow label="碳水化合物 (Carbs)" current={dailyLog.nutrition.carbs} max={dailyLog.nutrition.limits.carbs} color="bg-green-500" />
               <MacroRow label="脂肪 (Fat)" current={dailyLog.nutrition.fat} max={dailyLog.nutrition.limits.fat} color="bg-yellow-500" />
            </div>
         </div>
         
         {/* Water Summary */}
         <div className="bg-noble-panel border border-noble-border rounded-xl p-5 flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-white text-sm font-bold">水分補充</h3>
              <p className="text-[10px] text-noble-muted uppercase tracking-wider mb-2">Hydration</p>
              <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-light text-blue-400">{dailyLog.water.current}</span>
                  <span className="text-[10px] text-noble-muted">/ {dailyLog.water.goal} ml</span>
              </div>
            </div>
            <div className="relative z-10 w-16 h-16">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-noble-border" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path className="text-blue-500" strokeDasharray={`${Math.min(100, (dailyLog.water.current / dailyLog.water.goal) * 100)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
            </div>
            {/* Water BG Effect */}
             <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500/10"></div>
         </div>
      </div>
    </div>
  );
};
