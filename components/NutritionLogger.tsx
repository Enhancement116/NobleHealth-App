
import React, { useState, useRef } from 'react';
import { DailyNutrition, Meal } from '../types';
import { analyzeFood } from '../services/geminiService';

interface Props {
  nutrition: DailyNutrition;
  onUpdate: (n: DailyNutrition) => void;
}

export const NutritionLogger: React.FC<Props> = ({ nutrition, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  
  // AI State
  const [foodInput, setFoodInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Manual State
  const [manualData, setManualData] = useState({
    name: '', calories: '', protein: '', carbs: '', fat: '', sugar: ''
  });

  const [analysisResult, setAnalysisResult] = useState<Meal | null>(null);

  // --- Handlers ---

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!foodInput.trim() && !selectedImage) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      // Strip base64 prefix for API if needed, but usually better to handle in service
      // Here we pass the full string, service handles it or logic here
      let imageBase64 = undefined;
      let mimeType = undefined;

      if (selectedImage) {
        const parts = selectedImage.split(',');
        mimeType = parts[0].match(/:(.*?);/)?.[1];
        imageBase64 = parts[1];
      }

      const result = await analyzeFood({
        text: foodInput,
        imageBase64,
        mimeType
      });

      setAnalysisResult({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        name: result.name,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        sugar: result.sugar,
        aiAdvice: result.advice
      });
    } catch (e) {
      alert("AI 分析失敗，請確認網路或 API Key 權限。");
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const saveMeal = (meal: Meal) => {
    onUpdate({
      ...nutrition,
      calories: nutrition.calories + meal.calories,
      protein: nutrition.protein + meal.protein,
      carbs: nutrition.carbs + meal.carbs,
      fat: nutrition.fat + meal.fat,
      sugar: nutrition.sugar + meal.sugar,
      meals: [meal, ...nutrition.meals]
    });
    closeModal();
  };

  const handleManualSubmit = () => {
    if (!manualData.name || !manualData.calories) {
      alert("請至少輸入名稱與熱量");
      return;
    }
    const meal: Meal = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      name: manualData.name,
      calories: Number(manualData.calories) || 0,
      protein: Number(manualData.protein) || 0,
      carbs: Number(manualData.carbs) || 0,
      fat: Number(manualData.fat) || 0,
      sugar: Number(manualData.sugar) || 0,
      aiAdvice: "使用者自行輸入紀錄"
    };
    saveMeal(meal);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFoodInput("");
    setSelectedImage(null);
    setAnalysisResult(null);
    setManualData({ name: '', calories: '', protein: '', carbs: '', fat: '', sugar: '' });
  };

  const MacroBar = ({ label, current, max, colorClass }: { label: string, current: number, max: number, colorClass: string }) => {
    const percent = Math.min(100, (current / max) * 100);
    return (
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-noble-muted uppercase tracking-wide">{label}</span>
          <span className={`${current > max ? 'text-red-500' : 'text-white'}`}>
            {current.toFixed(1)} / {max}g
          </span>
        </div>
        <div className="h-1.5 bg-noble-border rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${colorClass} ${current > max ? 'bg-red-500' : ''}`} 
            style={{ width: `${percent}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-20 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-light text-white">飲食紀錄</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-noble-gold text-noble-black px-4 py-2 rounded-lg text-sm font-bold tracking-wide hover:bg-yellow-400 transition-colors shadow-lg shadow-noble-gold/10"
        >
          + 新增餐點
        </button>
      </div>

      {/* Stats Cards */}
      <div className="bg-noble-panel border border-noble-border rounded-xl p-6 mb-6 shadow-lg">
        <MacroBar label="蛋白質" current={nutrition.protein} max={nutrition.limits.protein} colorClass="bg-blue-500" />
        <MacroBar label="碳水化合物" current={nutrition.carbs} max={nutrition.limits.carbs} colorClass="bg-green-500" />
        <MacroBar label="脂肪" current={nutrition.fat} max={nutrition.limits.fat} colorClass="bg-yellow-500" />
        <MacroBar label="糖分" current={nutrition.sugar} max={nutrition.limits.sugar} colorClass="bg-pink-500" />
      </div>

      {/* Meal List */}
      <div className="space-y-4">
        <h3 className="text-noble-muted text-xs uppercase tracking-widest mb-2 pl-1">今日餐點</h3>
        {nutrition.meals.length === 0 ? (
          <div className="text-center py-10 text-noble-border">
            <p className="text-sm">尚無紀錄</p>
          </div>
        ) : (
          nutrition.meals.map(meal => (
            <div key={meal.id} className="bg-noble-panel border border-noble-border rounded-lg p-4 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="text-white font-medium">{meal.name}</span>
                <span className="text-noble-gold font-bold text-sm">{meal.calories} kcal</span>
              </div>
              <div className="flex gap-3 text-[10px] text-noble-muted uppercase tracking-wider">
                <span>P: {meal.protein}g</span>
                <span>C: {meal.carbs}g</span>
                <span>F: {meal.fat}g</span>
                <span>Sugar: {meal.sugar}g</span>
              </div>
              {meal.aiAdvice && (
                <div className="mt-2 pt-2 border-t border-noble-border/50 text-xs text-gray-400 italic">
                  💡 {meal.aiAdvice}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Meal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-noble-panel border border-noble-border w-full max-w-md rounded-2xl p-0 shadow-2xl animate-slide-up overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header / Tabs */}
            <div className="flex border-b border-noble-border">
              <button 
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-4 text-sm font-bold tracking-wider transition-colors ${activeTab === 'ai' ? 'bg-noble-gold text-noble-black' : 'bg-noble-panel text-noble-muted hover:text-white'}`}
              >
                ✨ AI 智慧分析
              </button>
              <button 
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-4 text-sm font-bold tracking-wider transition-colors ${activeTab === 'manual' ? 'bg-noble-gold text-noble-black' : 'bg-noble-panel text-noble-muted hover:text-white'}`}
              >
                ✏️ 手動輸入
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* --- AI TAB --- */}
              {activeTab === 'ai' && (
                <>
                  {!analysisResult ? (
                    <div className="space-y-4">
                       {/* Image Upload Area */}
                       <div 
                         onClick={() => fileInputRef.current?.click()}
                         className={`border-2 border-dashed border-noble-border rounded-xl p-6 text-center cursor-pointer transition-colors ${selectedImage ? 'bg-noble-black' : 'hover:border-noble-gold/50 hover:bg-noble-gold/5'}`}
                       >
                         {selectedImage ? (
                           <div className="relative h-32 w-full">
                              <img src={selectedImage} alt="Selected" className="h-full w-full object-contain" />
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6L6 18M6 6l12 12"/></svg>
                              </button>
                           </div>
                         ) : (
                           <div className="flex flex-col items-center text-noble-muted">
                             <svg className="mb-2" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                             <span className="text-xs">點擊上傳或拍攝食物照片</span>
                           </div>
                         )}
                         <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleImageSelect}
                          />
                       </div>

                      {/* Text Input */}
                      <textarea
                        className="w-full bg-noble-dark border border-noble-border rounded-lg p-3 text-white placeholder-noble-muted focus:border-noble-gold focus:outline-none resize-none text-sm"
                        rows={2}
                        placeholder="或用文字描述 (例如：一個雞腿便當，飯少一點...)"
                        value={foodInput}
                        onChange={(e) => setFoodInput(e.target.value)}
                      />

                      <div className="flex gap-3 pt-2">
                        <button 
                          onClick={closeModal}
                          className="flex-1 py-3 text-noble-muted hover:text-white transition-colors text-sm"
                        >
                          取消
                        </button>
                        <button 
                          onClick={handleAnalyze}
                          disabled={analyzing || (!foodInput && !selectedImage)}
                          className="flex-1 bg-noble-gold text-noble-black font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {analyzing ? "AI 分析中..." : "開始分析"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-fade-in">
                      <div className="bg-noble-dark rounded-lg p-4 mb-6 border border-noble-border">
                        <h4 className="text-noble-gold font-bold mb-2 text-lg">{analysisResult.name}</h4>
                        <div className="grid grid-cols-2 gap-y-3 text-sm text-gray-300">
                          <div className="flex justify-between border-b border-white/10 pb-1"><span>熱量</span> <span className="text-white font-bold">{analysisResult.calories}</span></div>
                          <div className="flex justify-between border-b border-white/10 pb-1"><span>蛋白質</span> <span className="text-white font-bold">{analysisResult.protein}g</span></div>
                          <div className="flex justify-between border-b border-white/10 pb-1"><span>碳水</span> <span className="text-white font-bold">{analysisResult.carbs}g</span></div>
                          <div className="flex justify-between border-b border-white/10 pb-1"><span>脂肪</span> <span className="text-white font-bold">{analysisResult.fat}g</span></div>
                          <div className="flex justify-between border-b border-white/10 pb-1"><span>糖分</span> <span className="text-white font-bold">{analysisResult.sugar}g</span></div>
                        </div>
                        <p className="mt-3 text-xs text-gray-400 border-t border-noble-border pt-2">
                          {analysisResult.aiAdvice}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setAnalysisResult(null)}
                          className="flex-1 py-3 text-noble-muted hover:text-white text-sm"
                        >
                          重新輸入
                        </button>
                        <button 
                          onClick={() => saveMeal(analysisResult)}
                          className="flex-1 bg-white text-black font-bold rounded-lg text-sm"
                        >
                          確認紀錄
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* --- MANUAL TAB --- */}
              {activeTab === 'manual' && (
                 <div className="space-y-4">
                    <div>
                      <label className="text-xs text-noble-muted block mb-1">餐點名稱</label>
                      <input 
                        type="text" 
                        className="w-full bg-noble-dark border border-noble-border rounded p-2 text-white focus:border-noble-gold outline-none"
                        value={manualData.name}
                        onChange={e => setManualData({...manualData, name: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                        <label className="text-xs text-noble-muted block mb-1">熱量 (kcal)</label>
                        <input type="number" className="w-full bg-noble-dark border border-noble-border rounded p-2 text-white focus:border-noble-gold outline-none" value={manualData.calories} onChange={e => setManualData({...manualData, calories: e.target.value})} />
                      </div>
                       <div>
                        <label className="text-xs text-noble-muted block mb-1">蛋白質 (g)</label>
                        <input type="number" className="w-full bg-noble-dark border border-noble-border rounded p-2 text-white focus:border-noble-gold outline-none" value={manualData.protein} onChange={e => setManualData({...manualData, protein: e.target.value})} />
                      </div>
                       <div>
                        <label className="text-xs text-noble-muted block mb-1">碳水 (g)</label>
                        <input type="number" className="w-full bg-noble-dark border border-noble-border rounded p-2 text-white focus:border-noble-gold outline-none" value={manualData.carbs} onChange={e => setManualData({...manualData, carbs: e.target.value})} />
                      </div>
                       <div>
                        <label className="text-xs text-noble-muted block mb-1">脂肪 (g)</label>
                        <input type="number" className="w-full bg-noble-dark border border-noble-border rounded p-2 text-white focus:border-noble-gold outline-none" value={manualData.fat} onChange={e => setManualData({...manualData, fat: e.target.value})} />
                      </div>
                       <div className="col-span-2">
                        <label className="text-xs text-noble-muted block mb-1">糖分 (g)</label>
                        <input type="number" className="w-full bg-noble-dark border border-noble-border rounded p-2 text-white focus:border-noble-gold outline-none" value={manualData.sugar} onChange={e => setManualData({...manualData, sugar: e.target.value})} />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button 
                          onClick={closeModal}
                          className="flex-1 py-3 text-noble-muted hover:text-white transition-colors text-sm"
                        >
                          取消
                        </button>
                        <button 
                          onClick={handleManualSubmit}
                          className="flex-1 bg-white text-black font-bold rounded-lg text-sm"
                        >
                          新增紀錄
                        </button>
                      </div>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
