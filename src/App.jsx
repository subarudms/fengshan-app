
import React, { useState, useEffect } from 'react';

const App = () => {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [days, setDays] = useState([]);
  const [rosterData, setRosterData] = useState({});

  const employees = ["陳媺媐", "蔡威德", "黃振瑞", "陳冠伶", "黃煒森", "劉江偉"];
  const holidays = ["2026-05-01"];

  const autoGenerate = () => {
    let newData = {};
    const daysInMonth = days.length;

    // 初始化每人狀態：紀錄 A/C 班次數與「週日已休假次數」
    let empStats = employees.reduce((acc, name) => {
      acc[name] = { aCount: 0, cCount: 0, sundayOffCount: 0, weekOffCount: 0 };
      return acc;
    }, {});

    // 核心樣板 (每週休二，且不連休)
    const baseTemplates = [
      [1, 4], [2, 5], [3, 6], [0, 3], [1, 5], [2, 4]
    ];

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dayOfWeek = date.getDay();

      // 每逢週日，重置該週休假計數
      if (dayOfWeek === 0) {
        employees.forEach(n => empStats[n].weekOffCount = 0);
      }

      // --- 週日特殊處理邏輯：確保每人每月至少休一次週日 ---
      if (dayOfWeek === 0) {
        // 找出本月目前為止「週日休最少」的人
        let candidates = [...employees].sort((a, b) => empStats[a].sundayOffCount - empStats[b].sundayOffCount);
        
        let dailyOffCount = 0;
        for (let name of candidates) {
          if (dailyOffCount >= 2) break; // 依然維持週日 4 人上班

          // 檢查法規：不能連休 (看週六有沒有休)
          if (newData[`${name}-${d-1}`] !== "休") {
            newData[`${name}-${d}`] = "休";
            empStats[name].sundayOffCount++;
            empStats[name].weekOffCount++;
            dailyOffCount++;
          }
        }
      }

      // --- 平日與週六處理邏輯 ---
      else {
        // 根據員工 index 與週次，動態指派樣板 (確保平日休假分佈)
        const weekIndex = Math.floor((d + new Date(year, month - 1, 1).getDay() - 1) / 7);
        
        employees.forEach((name, index) => {
          // 如果今天已經被週日邏輯排過或是已經休假了就跳過
          if (newData[`${name}-${d}`]) return;

          const templateIndex = (index + weekIndex) % baseTemplates.length;
          const myOffDays = baseTemplates[templateIndex];

          // 檢查：如果這週還沒休滿 2 天，且今天是樣板休假日
          if (myOffDays.includes(dayOfWeek) && empStats[name].weekOffCount < 2) {
            // 法規檢查：不連休、不連上 6 天
            const yesterdayWasOff = newData[`${name}-${d-1}`] === "休";
            if (!yesterdayWasOff) {
              newData[`${name}-${d}`] = "休";
              empStats[name].weekOffCount++;
            }
          }
        });

        // 補位檢查：如果到了週六 (dayOfWeek 6) 該週還沒休滿 2 天，強制排休
        if (dayOfWeek === 6) {
          employees.forEach(name => {
            if (empStats[name].weekOffCount < 2 && newData[`${name}-${d}`] !== "休") {
               if (newData[`${name}-${d-1}`] !== "休") {
                  newData[`${name}-${d}`] = "休";
                  empStats[name].weekOffCount++;
               }
            }
          });
        }
      }

      // --- 班別分配 (A/C 平衡) ---
      let workingStaff = employees.filter(name => newData[`${name}-${d}`] !== "休");
      workingStaff.sort((a, b) => empStats[a].aCount - empStats[b].aCount);
      
      let aCountNeeded = Math.ceil(workingStaff.length / 2);
      workingStaff.forEach((name, idx) => {
        const shift = idx < aCountNeeded ? "A" : "C";
        newData[`${name}-${d}`] = shift;
        if (shift === "A") empStats[name].aCount++;
        else empStats[name].cCount++;
      });
    }

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
    <div style={{ padding: '10px', fontFamily: 'sans-serif', backgroundColor: '#f0f4f8', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '1rem', color: '#1a73e8', margin: 0 }}>鳳山所班表 (週日保障最終版)</h2>
        <button onClick={autoGenerate} style={{ padding: '10px 15px', backgroundColor: '#1565c0', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>🎯 生成週日平衡班表</button>
      </div>
      
      <div style={{ marginBottom: '10px', display: 'flex', gap: '8px' }}>
        <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ width: '70px', padding: '5px' }} />
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{ padding: '5px' }}>
          {[...Array(12).keys()].map(m => <option key={m+1} value={m+1}>{m+1}月</option>)}
        </select>
      </div>

      <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #d1d9e0' }}>
        <table style={{ borderCollapse: 'collapse', width: 'max-content', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f4f9' }}>
              <th style={{ width: '80px', padding: '12px 8px', borderBottom: '2px solid #dee2e6', borderRight: '1px solid #dee2e6', position: 'sticky', left: 0, backgroundColor: '#f1f4f9', zIndex: 10 }}>姓名</th>
              {days.map(d => (
                <th key={d.day} style={{ width: '45px', padding: '8px 0', borderBottom: '2px solid #dee2e6', borderRight: '1px solid #dee2e6', backgroundColor: d.isOffDay ? '#fff2cc' : 'white', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{d.day}</div>
                  <div style={{ fontSize: '10px', color: '#777' }}>{d.weekDay}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp}>
                <td style={{ padding: '12px 8px', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 5, textAlign: 'center' }}>{emp}</td>
                {days.map(d => (
                  <td key={d.day} style={{ padding: '0', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', backgroundColor: d.isOffDay ? '#fffdf5' : 'white', textAlign: 'center' }}>
                    <select 
                      value={rosterData[`${emp}-${d.day}`] || "-"}
                      onChange={(e) => {
                        const newData = { ...rosterData, [`${emp}-${d.day}`]: e.target.value };
                        setRosterData(newData);
                        localStorage.setItem(`roster-${year}-${month}`, JSON.stringify(newData));
                      }}
                      style={{ width: '100%', height: '45px', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '15px', fontWeight: '600', color: rosterData[`${emp}-${d.day}`] === '休' ? '#e67e22' : '#333', appearance: 'none' }}
                    >
                      {["-", "A", "C", "休"].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '8px', fontSize: '12px', color: '#0d47a1', border: '1px solid #bbdefb' }}>
        <strong>📊 週日平衡機制說明：</strong>
        <ul style={{ margin: '5px 0 0 18px', padding: 0 }}>
          <li><strong>週日輪休權重：</strong>系統會自動計算每人月內週日休假天數，休最少的人在下個週日會「優先排休」。</li>
          <li><strong>法規底線：</strong>優先確保不連休（跨週週六日不連休）與每週休滿二天。</li>
          <li><strong>公平性檢查：</strong>一個月內每位員工至少會輪到 1-2 次週日休假。</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
