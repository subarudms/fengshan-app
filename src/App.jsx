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
  }, [config.startDate, config.weeks]);

  const autoGenerate = () => {
    let newData = {};
    let empStats = empList.reduce((acc, name) => {
      acc[name] = { aCount: 0, sundayOffCount: 0, hasNational: false };
      return acc;
    }, {});

    // 依週循環處理
    for (let w = 0; w < config.weeks; w++) {
      const weekStartIdx = w * 7;
      
      empList.forEach((name, empIdx) => {
        let offInWeek = 0;
        
        for (let i = 0; i < 7; i++) {
          const currentDate = dateHeaders[weekStartIdx + i];
          if (!currentDate) continue;

          const dateKey = `${name}-${currentDate.getTime()}`;
          const dayOfWeek = currentDate.getDay();
          
          // 樣板輪動邏輯 (確保不連休)
          const template = [
            [1, 4], [2, 5], [3, 6], [0, 3], [1, 5], [2, 4]
          ][(empIdx + w) % 6] || [1, 4];

          // 1. 排入 1例 1休
          if (template.includes(dayOfWeek) && offInWeek < 2) {
            const yesterday = new Date(currentDate);
            yesterday.setDate(currentDate.getDate() - 1);
            const yestKey = `${name}-${yesterday.getTime()}`;
            
            if (!newData[yestKey] || !newData[yestKey].includes("假") && !newData[yestKey].includes("休")) {
              newData[dateKey] = offInWeek === 0 ? offLabelList[0] : offLabelList[1];
              offInWeek++;
            }
          }

          // 2. 處理國定假日 (假設是 5 月份且設定中有第 3 個標籤)
          if (currentDate.getMonth() === 4 && offLabelList[2] && !empStats[name].hasNational && !newData[dateKey]) {
            if (Math.random() > 0.9) {
               newData[dateKey] = offLabelList[2];
               empStats[name].hasNational = true;
            }
          }
        }
      });

      // 3. 填補班別 (A/C)
      for (let i = 0; i < 7; i++) {
        const currentDate = dateHeaders[weekStartIdx + i];
        if (!currentDate) continue;

        let workingStaff = empList.filter(name => !newData[`${name}-${currentDate.getTime()}`]);
        workingStaff.sort((a, b) => empStats[a].aCount - empStats[b].aCount);
        
        let half = Math.ceil(workingStaff.length / 2);
        workingStaff.forEach((name, idx) => {
          const shift = idx < half ? shiftList[0] : shiftList[1];
          newData[`${name}-${currentDate.getTime()}`] = shift;
          if (shift === shiftList[0]) empStats[name].aCount++;
        });
      }
    }
    setRosterData(newData);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <h2 style={{ color: '#1e293b', marginBottom: '20px' }}>🏥 鳳山所智慧排班管理系統</h2>
      
      {/* 管理控制台 */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>起始日期</label>
          <input type="date" value={config.startDate} onChange={e => setConfig({...config, startDate: e.target.value})} style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>人員名單 (逗號隔開)</label>
          <input type="text" value={config.employees} onChange={e => setConfig({...config, employees: e.target.value})} style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>班別名稱 (逗號隔開)</label>
          <input type="text" value={config.shifts} onChange={e => setConfig({...config, shifts: e.target.value})} style={{ width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={autoGenerate} style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>🚀 重新計算並生成班表</button>
        </div>
      </div>

      {/* 班表顯示區 */}
      <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: 'max-content', fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #e2e8f0', padding: '12px', backgroundColor: '#f1f5f9', position: 'sticky', left: 0, zIndex: 20 }}>姓名</th>
              {dateHeaders.map(d => (
                <th key={d.getTime()} style={{ border: '1px solid #e2e8f0', padding: '8px', minWidth: '50px', backgroundColor: (d.getDay() === 0 || d.getDay() === 6) ? '#fef3c7' : 'white' }}>
                  <div style={{ fontWeight: 'bold' }}>{d.getMonth()+1}/{d.getDate()}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>{['日','一','二','三','四','五','六'][d.getDay()]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {empList.map(name => (
              <tr key={name}>
                <td style={{ border: '1px solid #e2e8f0', padding: '10px', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 10, textAlign: 'center' }}>{name}</td>
                {dateHeaders.map(d => {
                  const val = rosterData[`${name}-${d.getTime()}`] || "-";
                  const isOff = val.includes("假") || val.includes("休");
                  return (
                    <td key={d.getTime()} style={{ 
                      border: '1px solid #e2e8f0', 
                      textAlign: 'center', 
                      padding: '8px 4px',
                      fontWeight: isOff ? 'bold' : 'normal',
                      color: val === offLabelList[0] ? '#ef4444' : val === offLabelList[1] ? '#3b82f6' : val === offLabelList[2] ? '#10b981' : '#1e293b'
                    }}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;
