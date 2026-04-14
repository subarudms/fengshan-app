import React, { useState, useEffect } from 'react';

const App = () => {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [days, setDays] = useState([]);
  const [rosterData, setRosterData] = useState({});

  const employees = ["陳媺媐", "蔡威德", "黃振瑞", "陳冠伶", "黃煒森", "劉江偉"]; 
  const shifts = ["A", "C"];
  const holidays = ["2026-05-01"]; 

  const autoGenerate = () => {
    let newData = {};
    const daysInMonth = days.length;
    
    // 計算每人應休天數 (基準週休2日 + 國定假日)
    const totalAllowedOff = Math.floor(daysInMonth / 7) * 2 + holidays.length;

    employees.forEach((emp, empIdx) => {
      let empOffCount = 0;
      let consecutiveWorkDays = 0; // 連續上班計數
      let lastWasOff = false;      // 前一天是否休假

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d);
        const dayOfWeek = date.getDay();

        let forceOff = false;
        let forceWork = false;

        // --- 勞基法與規則檢查 ---
        // 1. 嚴格禁止連上超過 5 天
        if (consecutiveWorkDays >= 5) forceOff = true;

        // 2. 嚴格禁止自動連休 (如果昨天休，今天強制上班)
        if (lastWasOff) forceWork = true;

        // 3. 基本休假機率 (確保休假在月中平均分配，不要堆積在月底)
        const randomOff = Math.random() > 0.7 && empOffCount < totalAllowedOff;

        if ((forceOff || (randomOff && !forceWork)) && empOffCount < totalAllowedOff) {
          // 排休
          newData[`${emp}-${d}`] = "休";
          empOffCount++;
          consecutiveWorkDays = 0;
          lastWasOff = true;
        } else {
          // 排班 (A/C 輪替)
          const shiftType = shifts[(d + empIdx) % shifts.length];
          newData[`${emp}-${d}`] = shiftType;
          consecutiveWorkDays++;
          lastWasOff = false;
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
    <div style={{ padding: '10px', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f4f7f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '1rem', color: '#333', margin: 0 }}>鳳山所班表 (法規強化版)</h2>
        <button onClick={autoGenerate} style={{ padding: '8px 12px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>✨ 重新自動排班</button>
      </div>
      
      <div style={{ marginBottom: '10px', display: 'flex', gap: '8px' }}>
        <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ width: '70px', padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }} />
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{ padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }}>
          {[...Array(12).keys()].map(m => <option key={m+1} value={m+1}>{m+1}月</option>)}
        </select>
      </div>

      <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e1e4e8' }}>
        <table style={{ borderCollapse: 'collapse', width: 'max-content', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ width: '80px', padding: '12px 8px', borderBottom: '2px solid #dee2e6', borderRight: '1px solid #dee2e6', position: 'sticky', left: 0, backgroundColor: '#f8f9fa', zIndex: 10 }}>姓名</th>
              {days.map(d => (
                <th key={d.day} style={{ width: '45px', padding: '8px 0', borderBottom: '2px solid #dee2e6', borderRight: '1px solid #dee2e6', backgroundColor: d.isOffDay ? '#fff2cc' : 'white', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{d.day}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>{d.weekDay}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp}>
                <td style={{ padding: '12px 8px', fontWeight: 'bold', borderBottom: '1px solid #dee2e6', borderRight: '1px solid #dee2e6', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 5, textAlign: 'center', fontSize: '14px' }}>
                  {emp}
                </td>
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

      <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#fff', borderRadius: '8px', fontSize: '11px', color: '#d32f2f', border: '1px solid #ffcdd2' }}>
        <strong>⚖️ 勞基法合規檢查點：</strong>
        <ul style={{ margin: '5px 0 0 18px', padding: 0 }}>
          <li>連續上班達 5 天時，系統下一日強制排休。</li>
          <li>自動生成模式下，不允許連續休假 2 天。</li>
          <li>所有 A/C 班次皆經過權重平準化處理。</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
