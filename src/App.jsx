import React, { useState, useEffect } from 'react';

const App = () => {
  // --- 系統設定狀態 ---
  const [config, setConfig] = useState({
    startDate: "2026-04-26",
    weeks: 6,
    employees: "陳媺媐, 蔡威德, 黃振瑞, 陳冠伶, 黃煒森, 劉江偉",
    shifts: "A, C",
    offLabels: "例假, 休假, 勞動節休"
  });

  const [rosterData, setRosterData] = useState({});
  const [dateHeaders, setDateHeaders] = useState([]);

  // 解析設定字串為陣列
  const empList = config.employees.split(',').map(s => s.trim()).filter(s => s);
  const shiftList = config.shifts.split(',').map(s => s.trim()).filter(s => s);
  const offLabelList = config.offLabels.split(',').map(s => s.trim()).filter(s => s);
  
  // 所有的可選選項彙整 (供下拉選單使用)
  const allOptions = ["-", ...shiftList, ...offLabelList];

  // 初始化日期標頭
  useEffect(() => {
    const start = new Date(config.startDate);
    const headers = [];
    for (let i = 0; i < config.weeks * 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      headers.push(d);
    }
    setDateHeaders(headers);

    // 嘗試從本地儲存讀取舊班表
    const saved = localStorage.getItem(`roster-master`);
    if (saved) setRosterData(JSON.parse(saved));
  }, [config.startDate, config.weeks]);

  // 手動更改格子的函數
  const handleCellChange = (empName, dateTimestamp, newValue) => {
    const updatedData = { ...rosterData, [`${empName}-${dateTimestamp}`]: newValue };
    setRosterData(updatedData);
    localStorage.setItem(`roster-master`, JSON.stringify(updatedData));
  };

  const autoGenerate = () => {
    let newData = {};
    let empStats = empList.reduce((acc, name) => {
      acc[name] = { aCount: 0, hasNational: false };
      return acc;
    }, {});

    for (let w = 0; w < config.weeks; w++) {
      const weekStartIdx = w * 7;
      
      empList.forEach((name, empIdx) => {
        let offInWeek = 0;
        for (let i = 0; i < 7; i++) {
          const currentDate = dateHeaders[weekStartIdx + i];
          if (!currentDate) continue;
          const dateKey = `${name}-${currentDate.getTime()}`;
          const dayOfWeek = currentDate.getDay();
          const template = [[1, 4], [2, 5], [3, 6], [0, 3], [1, 5], [2, 4]][(empIdx + w) % 6] || [1, 4];

          if (template.includes(dayOfWeek) && offInWeek < 2) {
            const yesterday = new Date(currentDate);
            yesterday.setDate(currentDate.getDate() - 1);
            if (!newData[`${name}-${yesterday.getTime()}`]?.includes("假")) {
              newData[dateKey] = offInWeek === 0 ? offLabelList[0] : offLabelList[1];
              offInWeek++;
            }
          }
          if (currentDate.getMonth() === 4 && offLabelList[2] && !empStats[name].hasNational && !newData[dateKey]) {
            if (Math.random() > 0.9) {
               newData[dateKey] = offLabelList[2];
               empStats[name].hasNational = true;
            }
          }
        }
      });

      for (let i = 0; i < 7; i++) {
        const currentDate = dateHeaders[weekStartIdx + i];
        if (!currentDate) continue;
        let workingStaff = empList.filter(name => !newData[`${name}-${currentDate.getTime()}`]);
        workingStaff.sort((a, b) => (empStats[a].aCount || 0) - (empStats[b].aCount || 0));
        let half = Math.ceil(workingStaff.length / 2);
        workingStaff.forEach((name, idx) => {
          const shift = idx < half ? shiftList[0] : shiftList[1];
          newData[`${name}-${currentDate.getTime()}`] = shift;
          if (shift === shiftList[0]) empStats[name].aCount++;
        });
      }
    }
    setRosterData(newData);
    localStorage.setItem(`roster-master`, JSON.stringify(newData));
  };

  return (
    <div style={{ padding: '15px', fontFamily: 'sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      <h2 style={{ color: '#0f172a', fontSize: '1.2rem', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
        📅 鳳山所智慧排班 (可編輯版)
      </h2>
      
      {/* 控制台 */}
      <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '15px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>起始日期</label>
          <input type="date" value={config.startDate} onChange={e => setConfig({...config, startDate: e.target.value})} style={{ width: '100%', padding: '6px', marginTop: '4px' }} />
        </div>
        <div style={{ flex: '2 1 300px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>人員名單</label>
          <input type="text" value={config.employees} onChange={e => setConfig({...config, employees: e.target.value})} style={{ width: '100%', padding: '6px', marginTop: '4px' }} />
        </div>
        <div style={{ flex: '1 1 100px', display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={autoGenerate} style={{ width: '100%', padding: '8px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
            重新計算生成
          </button>
        </div>
      </div>

      {/* 班表區 */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: 'max-content', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #e2e8f0', padding: '12px 8px', backgroundColor: '#f8fafc', position: 'sticky', left: 0, zIndex: 20 }}>姓名</th>
              {dateHeaders.map(d => (
                <th key={d.getTime()} style={{ border: '1px solid #e2e8f0', padding: '6px', minWidth: '55px', backgroundColor: (d.getDay() === 0 || d.getDay() === 6) ? '#fef3c7' : 'white' }}>
                  <div>{d.getMonth()+1}/{d.getDate()}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>{['日','一','二','三','四','五','六'][d.getDay()]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {empList.map(name => (
              <tr key={name}>
                <td style={{ border: '1px solid #e2e8f0', padding: '10px 8px', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 10, textAlign: 'center' }}>{name}</td>
                {dateHeaders.map(d => {
                  const val = rosterData[`${name}-${d.getTime()}`] || "-";
                  // 動態顏色樣式
                  const getColor = (v) => {
                    if (v === offLabelList[0]) return '#dc2626'; // 例假 紅
                    if (v === offLabelList[1]) return '#2563eb'; // 休假 藍
                    if (v === offLabelList[2]) return '#059669'; // 勞動節 綠
                    return '#1e293b'; // A/C 黑
                  };

                  return (
                    <td key={d.getTime()} style={{ border: '1px solid #e2e8f0', padding: '0', textAlign: 'center' }}>
                      <select 
                        value={val}
                        onChange={(e) => handleCellChange(name, d.getTime(), e.target.value)}
                        style={{ 
                          width: '100%', 
                          height: '40px', 
                          border: 'none', 
                          background: 'transparent', 
                          textAlign: 'center', 
                          textAlignLast: 'center',
                          fontSize: '14px',
                          fontWeight: val.includes("假") || val.includes("休") ? 'bold' : '500',
                          color: getColor(val),
                          cursor: 'pointer',
                          appearance: 'none'
                        }}
                      >
                        {allOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>* 直接點擊格子即可手動微調班別，系統會自動儲存。</p>
    </div>
  );
};

export default App;
