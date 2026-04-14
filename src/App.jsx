import React, { useState, useEffect } from 'react';

const App = () => {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [days, setDays] = useState([]);
  const [rosterData, setRosterData] = useState({});

  // --- 後台管理區：人員清單 ---
  const employees = ["陳媺媐", "蔡威德", "黃振瑞", "陳冠伶", "黃煒森", "劉江偉"]; 
  const shifts = ["A", "C"]; // 已移除 O 班，只保留早班 A 與 晚班 C
  const holidays = ["2026-05-01"]; // 國定假日設定

  // --- 自動公平排班演算法 ---
  const autoGenerate = () => {
    let newData = {};
    const daysInMonth = days.length;
    
    // 計算該月應有的總休假天數 (週休2日 + 國定假日)
    const baseOffDays = Math.floor(daysInMonth / 7) * 2;
    const totalAllowedOff = baseOffDays + holidays.length;

    employees.forEach((emp, empIdx) => {
      let empOffCount = 0;
      let weeklyOff = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d);
        const dayOfWeek = date.getDay(); // 0(日) 到 6(六)

        // 每週六重置週休計數
        if (dayOfWeek === 6) weeklyOff = 0;

        // 休假判定邏輯
        const isLastDays = (daysInMonth - d) < 3;
        const needMoreOff = empOffCount < totalAllowedOff;
        
        if (weeklyOff < 2 && (Math.random() > 0.7 || (isLastDays && needMoreOff)) && empOffCount < totalAllowedOff) {
          newData[`${emp}-${d}`] = "休";
          weeklyOff++;
          empOffCount++;
        } else {
          // 公平輪替：只在 A 與 C 之間切換
          const shiftType = shifts[(d + empIdx) % shifts.length];
          newData[`${emp}-${d}`] = shiftType;
        }
      }
    });

    setRosterData(newData);
    localStorage.setItem(`roster-${year}-${month}`, JSON.stringify(newData));
  };

  useEffect(() => {
    const savedData = localStorage.getItem(`roster-${year}-${month}`);
    setRosterData(savedData ? JSON.parse(savedData) : {});
    
    const date = new Date(year, month - 1, 1);
    const result = [];
    while (date.getMonth() === month - 1) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      result.push({
        day: date.getDate(),
        weekDay: ["日", "一", "二", "三", "四", "五", "六"][date.getDay()],
        isOffDay: (date.getDay() === 0 || date.getDay() === 6 || holidays.includes(dateStr)),
      });
      date.setDate(date.getDate() + 1);
    }
    setDays(result);
  }, [year, month]);

  return (
    <div style={{ padding: '15px', fontFamily: 'sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#1a73e8', margin: 0 }}>鳳山所班表 ({year}/{month})</h2>
        <button 
          onClick={autoGenerate}
          style={{ padding: '8px 12px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
        >
          ✨ 自動排班
        </button>
      </div>
      
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
        <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ width: '70px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
          {[...Array(12).keys()].map(m => <option key={m+1} value={m+1}>{m+1}月</option>)}
        </select>
      </div>

      <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ border: '1px solid #ddd', padding: '10px', position: 'sticky', left: 0, backgroundColor: '#f8f9fa', zIndex: 10, minWidth: '70px' }}>姓名</th>
              {days.map(d => (
                <th key={d.day} style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', backgroundColor: d.isOffDay ? '#fff2cc' : 'white', color: d.isOffDay ? '#d97706' : '#333' }}>
                  {d.day}<br/><small>{d.weekDay}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp}>
                <td style={{ border: '1px solid #ddd', padding: '10px', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 5, textAlign: 'center' }}>
                  {emp}
                </td>
                {days.map(d => (
                  <td key={d.day} style={{ border: '1px solid #ddd', padding: '2px', textAlign: 'center', backgroundColor: d.isOffDay ? '#fffdf5' : 'white' }}>
                    <select 
                      value={rosterData[`${emp}-${d.day}`] || "-"}
                      onChange={(e) => {
                        const newData = { ...rosterData, [`${emp}-${d.day}`]: e.target.value };
                        setRosterData(newData);
                        localStorage.setItem(`roster-${year}-${month}`, JSON.stringify(newData));
                      }}
                      style={{ border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '14px', width: '30px', textAlign: 'center', cursor: 'pointer' }}
                    >
                      {/* 下拉選單也同步移除 O 選項 */}
                      {["-", "A", "C", "休"].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#fff', borderRadius: '8px', fontSize: '12px', color: '#666', border: '1px solid #e0e0e0' }}>
        <strong>💡 排班說明：</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>已移除全天班 (O)，僅分配早班 (A) 與晚班 (C)。</li>
          <li>自動生成會確保每人早晚班次數接近（公平原則）。</li>
          <li>每週休假嚴格限制在 2 天以內（國定假日額度另計）。</li>
        </ul>
      </div>
    </div>
  );
};

export default App;

