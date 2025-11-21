import React, { useState, useEffect, useRef } from 'react';
import { UserData, DailyLog, BodyMetrics } from '../types';
import { generateHealthReport } from '../services/geminiService';
import Chart from 'chart.js/auto';

interface Props {
  userData: UserData;
  setUserData: (data: UserData) => void;
  dailyLog: DailyLog;
  updateDailyLog: (updater: (prev: DailyLog) => DailyLog) => void;
}

export const ZeppImport: React.FC<Props> = ({ userData, setUserData, dailyLog, updateDailyLog }) => {
  // Form State
  const [formData, setFormData] = useState({
    weight: dailyLog.weight > 0 ? dailyLog.weight.toString() : (userData.currentWeight > 0 ? userData.currentWeight.toString() : ''),
    bodyFat: dailyLog.bodyMetrics?.bodyFat?.toString() || '',
    muscleMass: dailyLog.bodyMetrics?.muscleMass?.toString() || '',
    bmr: dailyLog.bodyMetrics?.bmr?.toString() || ''
  });

  const [status, setStatus] = useState<'idle' | 'analyzing' | 'success'>('idle');
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Calculate Nutrition Limits based on BMR & Goals
  const calculateAutoNutrition = (bmr: number, weight: number) => {
    // Estimation Logic:
    // TDEE (Sedentary/Office + Light Exercise) approx BMR * 1.3
    const tdee = Math.round(bmr * 1.3);
    
    // Protein: 2g per kg (High protein for muscle/fat loss context)
    const protein = Math.round(weight * 2);
    
    // Fat: 0.8g per kg
    const fat = Math.round(weight * 0.8);
    
    // Carbs: Remaining calories
    // Protein(4) + Fat(9) + Carbs(4) = TDEE
    const remainingCals = tdee - (protein * 4) - (fat * 9);
    const carbs = Math.max(50, Math.round(remainingCals / 4)); // Minimum 50g buffer
    
    // Sugar: < 10% of TDEE (approx 10% / 4)
    const sugar = Math.round((tdee * 0.1) / 4);

    return {
      calories: tdee,
      protein,
      fat,
      carbs,
      sugar
    };
  };

  const handleAnalyze = async () => {
    // Validation
    if (!formData.weight || !formData.bodyFat || !formData.muscleMass || !formData.bmr) {
      alert("請填寫完整數據以進行精準分析");
      return;
    }

    setStatus('analyzing');
    
    const newWeight = parseFloat(formData.weight);
    const newBodyFat = parseFloat(formData.bodyFat);
    const newMuscle = parseFloat(formData.muscleMass);
    const newBMR = parseInt(formData.bmr);

    const newMetrics: BodyMetrics = {
      bodyFat: newBodyFat,
      muscleMass: newMuscle,
      bmr: newBMR,
      water: 0, // Default if not input
      visceralFat: 0,
      boneMass: 0,
      protein: 0
    };

    // 1. Update Data
    setUserData({
      ...userData,
      currentWeight: newWeight,
      lastSync: new Date().toISOString()
    });

    // 2. Auto-Calculate Nutrition Limits
    const newLimits = calculateAutoNutrition(newBMR, newWeight);

    // 3. Update Daily Log (Metrics & Limits)
    let updatedLog: DailyLog | null = null;
    updateDailyLog(prev => {
      const next = {
        ...prev,
        weight: newWeight,
        bodyMetrics: newMetrics,
        nutrition: {
          ...prev.nutrition,
          limits: {
            ...prev.nutrition.limits,
            ...newLimits
          }
        }
      };
      updatedLog = next;
      return next;
    });

    // 4. Trigger AI Coach Analysis immediately
    if (updatedLog) {
        // Wait a microtask for state to settle logically or use the object directly
        const report = await generateHealthReport(userData, updatedLog as DailyLog);
        updateDailyLog(prev => ({ ...prev, aiReport: report }));
    }

    setStatus('success');
    setTimeout(() => setStatus('idle'), 2000);
  };

  // Initialize Chart
  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Mock Historical Data Generation
        const generateMockHistory = (base: number, variance: number) => {
           return Array.from({length: 7}, (_, i) => base + (Math.random() * variance * 2 - variance));
        };
        
        const weightHistory = generateMockHistory(Number(formData.weight) || 75, 0.5);
        const fatHistory = generateMockHistory(Number(formData.bodyFat) || 20, 0.3);
        
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['6天前', '5天前', '4天前', '3天前', '前天', '昨天', '今天'],
            datasets: [
              {
                label: '體重 (kg)',
                data: weightHistory,
                borderColor: '#D4AF37', // Noble Gold
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                yAxisID: 'y'
              },
              {
                label: '體脂 (%)',
                data: fatHistory,
                borderColor: '#a3a3a3', // Muted Silver
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.4,
                yAxisID: 'y1'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: {
                labels: { color: '#e5e5e5', font: { size: 10 } }
              },
              tooltip: {
                backgroundColor: 'rgba(18, 18, 18, 0.9)',
                titleColor: '#D4AF37',
                bodyColor: '#fff',
                borderColor: '#262626',
                borderWidth: 1
              }
            },
            scales: {
              x: {
                grid: { color: '#262626' },
                ticks: { color: '#a3a3a3', font: { size: 10 } }
              },
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                grid: { color: '#262626' },
                ticks: { color: '#D4AF37' }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: { drawOnChartArea: false },
                ticks: { color: '#a3a3a3' }
              },
            }
          }
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [formData.weight, formData.bodyFat]); // Re-render when primary data changes

  const InputField = ({ label, value, onChange, unit, placeholder }: any) => (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-noble-gold uppercase tracking-widest font-bold">{label}</label>
      <div className="relative">
        <input 
          type="number" 
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-noble-dark border border-noble-border rounded-lg py-3 pl-4 pr-8 text-white focus:border-noble-gold focus:ring-1 focus:ring-noble-gold/50 outline-none transition-all"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-noble-muted">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-xl font-light text-white mb-1">身體數據中心</h2>
            <p className="text-[10px] text-noble-muted uppercase tracking-wider">Body Metrics & Analysis</p>
        </div>
        <div className="px-2 py-1 rounded bg-noble-panel border border-noble-border">
            <span className="text-[10px] text-noble-gold">AI 教練模式</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="h-64 bg-noble-panel border border-noble-border rounded-xl p-4 shadow-lg relative">
         <h3 className="text-[10px] text-noble-muted absolute top-4 left-4 z-10">近期趨勢模擬</h3>
         <div className="w-full h-full pt-4">
            <canvas ref={chartRef} />
         </div>
      </div>

      {/* Manual Input Form */}
      <div className="bg-noble-panel border border-noble-border rounded-xl p-6 shadow-xl">
         <div className="flex items-center gap-2 mb-6 border-b border-noble-border pb-4">
            <div className="w-1 h-4 bg-noble-gold rounded-full"></div>
            <h3 className="text-white font-bold text-sm">今日數據錄入</h3>
         </div>

         <div className="grid grid-cols-2 gap-5">
            <InputField 
                label="目前體重" 
                unit="kg" 
                value={formData.weight} 
                onChange={(v: string) => setFormData({...formData, weight: v})}
                placeholder="0.0"
            />
            <InputField 
                label="體脂率" 
                unit="%" 
                value={formData.bodyFat} 
                onChange={(v: string) => setFormData({...formData, bodyFat: v})}
                placeholder="0.0"
            />
            <InputField 
                label="骨骼肌重" 
                unit="kg" 
                value={formData.muscleMass} 
                onChange={(v: string) => setFormData({...formData, muscleMass: v})}
                placeholder="0.0"
            />
            <InputField 
                label="基礎代謝 (BMR)" 
                unit="kcal" 
                value={formData.bmr} 
                onChange={(v: string) => setFormData({...formData, bmr: v})}
                placeholder="0000"
            />
         </div>

         <div className="mt-8">
            <button 
                onClick={handleAnalyze}
                disabled={status === 'analyzing'}
                className={`w-full py-4 rounded-lg font-bold text-sm tracking-widest uppercase transition-all shadow-lg
                    ${status === 'analyzing' 
                        ? 'bg-noble-border text-noble-muted cursor-wait' 
                        : 'bg-gradient-to-r from-noble-gold to-yellow-600 text-black hover:shadow-noble-gold/20 hover:scale-[1.02]'
                    }`}
            >
                {status === 'analyzing' ? (
                    <span className="flex items-center justify-center gap-2">
                         <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        AI 深度分析中...
                    </span>
                ) : status === 'success' ? (
                    "記錄完成！請查看今日總覽"
                ) : (
                    "記錄數據並開始分析"
                )}
            </button>
            <p className="text-[10px] text-center text-noble-muted mt-3">
                * 系統將自動依據 BMR 計算您的最佳營養攝取上限
            </p>
         </div>
      </div>

      {/* Info Section */}
      <div className="p-4 border border-dashed border-noble-border rounded-lg bg-noble-black/50">
         <h4 className="text-noble-gold text-xs font-bold mb-2">📊 專業教練功能說明</h4>
         <ul className="text-[10px] text-noble-muted space-y-1 list-disc list-inside">
            <li>輸入上方四項核心數據，AI 將自動判定您的「體態類型」。</li>
            <li>根據體態，系統會生成專屬的「明日飲食建議」與「運動菜單」。</li>
            <li>點擊按鈕後，今日的營養攝取目標 (卡路里/蛋白質等) 將自動更新為適合您的數值。</li>
            <li>分析結果將顯示於首頁「今日總覽」的 AI 報告欄位。</li>
         </ul>
      </div>
    </div>
  );
};