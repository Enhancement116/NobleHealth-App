import React, { useState } from 'react';

// 您的 Google API Key 已填入
const API_KEY = "AIzaSyBau9KxgBf2NvkyQoPOcZY9S4Z0AJgXFcY"; 

function App() {
  // 定義變數來存資料
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscle, setMuscle] = useState('');
  const [analysis, setAnalysis] = useState(''); // 存 AI 的分析結果
  const [loading, setLoading] = useState(false); // 控制轉圈圈

  // 核心功能：呼叫 Gemini AI
  const runAIAnalysis = async () => {
    if (!weight) {
      alert("請至少輸入體重！");
      return;
    }

    setLoading(true);
    setAnalysis("正在請求 AI 分析您的數據...");

    // 1. 準備要問 AI 的話 (Prompt)
    const prompt = `
      我是一位使用者，我的身體數據如下：
      - 體重: ${weight} kg
      - 體脂率: ${bodyFat || '未提供'} %
      - 肌肉量: ${muscle || '未提供'} kg
      
      請扮演專業的健身教練與營養師：
      1. 分析我的體態類型（如：是否過重、泡芙人、精壯等）。
      2. 給我 3 點具體的飲食建議。
      3. 給我 1 個適合我的運動方向。
      請用繁體中文，語氣正向鼓勵，並使用列點呈現。
    `;

    try {
      // 2. 發送訊號給 Google Gemini (使用 REST API)
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      const data = await response.json();

      // 3. 接收並顯示結果
      if (data.candidates && data.candidates[0].content) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        setAnalysis(aiResponse);
      } else {
        console.error("API Error:", data);
        setAnalysis("分析失敗，請稍後再試。(可能是 API Key 額度不足或格式錯誤)");
      }

    } catch (error) {
      console.error("Error:", error);
      setAnalysis("連線錯誤，請檢查網路。");
    }

    setLoading(false);
  };

  return (
    <div style={{ backgroundColor: '#050505', color: '#e5e5e5', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      <h1 style={{ color: '#d4af37', textAlign: 'center', fontSize: '24px', marginBottom: '30px' }}>NOIR HEALTH AI</h1>
      
      {/* 輸入區塊 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px', margin: '0 auto' }}>
        
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <label style={{fontSize: '12px', color: '#888', marginBottom: '5px'}}>體重 (Weight)</label>
          <input 
            type="number" 
            placeholder="輸入公斤 (kg)" 
            value={weight} 
            onChange={(e) => setWeight(e.target.value)}
            style={{ padding: '15px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#1a1a1a', color: 'white', fontSize: '16px' }}
          />
        </div>

        <div style={{display: 'flex', flexDirection: 'column'}}>
          <label style={{fontSize: '12px', color: '#888', marginBottom: '5px'}}>體脂率 (Body Fat %)</label>
          <input 
            type="number" 
            placeholder="輸入百分比 (%)" 
            value={bodyFat} 
            onChange={(e) => setBodyFat(e.target.value)}
            style={{ padding: '15px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#1a1a1a', color: 'white', fontSize: '16px' }}
          />
        </div>

        <div style={{display: 'flex', flexDirection: 'column'}}>
          <label style={{fontSize: '12px', color: '#888', marginBottom: '5px'}}>肌肉量 (Muscle Mass)</label>
          <input 
            type="number" 
            placeholder="輸入公斤 (kg)" 
            value={muscle} 
            onChange={(e) => setMuscle(e.target.value)}
            style={{ padding: '15px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#1a1a1a', color: 'white', fontSize: '16px' }}
          />
        </div>

        {/* 執行按鈕 */}
        <button 
          onClick={runAIAnalysis} 
          disabled={loading}
          style={{ 
            marginTop: '10px',
            padding: '15px', 
            borderRadius: '8px', 
            border: 'none', 
            backgroundColor: '#d4af37', 
            color: 'black', 
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "🤖 AI 正在思考中..." : "✨ 執行 AI 深度分析"}
        </button>
      </div>

      {/* 顯示結果區塊 */}
      {analysis && (
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: '#1a1a1a', 
          borderRadius: '10px', 
          maxWidth: '600px', 
          margin: '30px auto',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          borderLeft: '4px solid #d4af37'
        }}>
          <h3 style={{ color: '#d4af37', marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '10px' }}>AI 分析報告：</h3>
          {analysis}
        </div>
      )}
    </div>
  );
}

export default App;
