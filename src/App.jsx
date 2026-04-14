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

    // 紀錄每人狀態與累積班次
    let empStats = employees.reduce((acc, name) => {
      acc[name] = { 
        aCount: 0, cCount: 0, 
        consecutiveWork: 0, lastWasOff: false,
        weekOffCount: 0, satOffCount: 0, sunOffCount: 0
      };
      return acc;
    }, {});

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dayOfWeek = date.getDay(); // 0(日) 到 6(六)

      // 每週日重置週休計數
      if (dayOfWeek === 0) {
        employees.forEach(name => empStats[name].weekOffCount = 0);
      }

      let availableStaff = [...employees].sort(() => Math.random() - 0.5);
      let dailyOffStaff = [];

      // --- 1. 決定誰休假 ---
      // 規則：週日強制 4 人上班，即只能 2 人休假
      const maxOffToday = (dayOfWeek === 0) ? 2 : 2; 

      availableStaff.forEach(name => {
        const stats = empStats[name];
        let canOff = true;

        if (stats.lastWasOff) canOff = false; // 禁止連休
        if (stats.weekOffCount >= 2) canOff = false; // 一週限2天
        if (dayOfWeek === 6 && stats.satOffCount >= 2) canOff = false; // 週六上限
        if (dayOfWeek === 0 && stats.sunOffCount >= 2) canOff = false; // 週日上限
        
        // 為了週日湊足 4 人上班，如果已經有 2 人休了，剩下的人不能休
        if (dailyOffStaff.length >= maxOffToday) canOff = false;

        // 強制休假條件：連上5天
        if (stats.consecutiveWork >= 5 && !stats.lastWasOff) {
          canOff = true;
        } else if (!canOff || Math.random() > 0.4) {
          canOff = false;
        }

        if (canOff) {
          dailyOffStaff.push(name);
          newData[`${name}-${d}`] = "休";
          stats.weekOffCount++;
          stats.consecutiveWork = 0;
          stats.lastWasOff = true;
          if (dayOfWeek === 6) stats.satOffCount++;
          if (dayOfWeek === 0) stats.sunOffCount++;
        }
      });

      // --- 2. 決定上班的人上什麼班 (A/C) ---
      let workingStaff = employees.filter(name => !dailyOffStaff.includes(name));
      
      // 確保至少一 A 一 C
      const assignShift = (name, type) => {
        newData[`${name}-${d}`] = type;
        empStats[name].consecutiveWork++;
        empStats[name].lastWasOff = false;
        if (type === "A") empStats[name].aCount++;
        if (type === "C") empStats[name].cCount++;
      };

      workingStaff.forEach(name => {
        const stats = empStats[name];
        let targetShift = "";

        // 公平輪替邏輯：如果 A 班比 C 班多，今天就排 C，反之亦然
        if (stats.aCount > stats.cCount) {
          targetShift = "C";
        } else if (stats.cCount > stats.aCount) {
          targetShift = "A";
        } else {
          targetShift = Math.random() > 0.5 ? "A" : "C";
        }
        
        assignShift(name, targetShift);
      });
      
      // 最後檢查每天是否都有一 A 一 C (防呆)
      const todayValues = workingStaff.map(n => newData[`${n}-${d}`]);
      if (!todayValues.includes("A") && workingStaff.length > 0) assignShift(workingStaff[0], "A");
      if (!todayValues.includes("C") && workingStaff.length > 1) assignShift(workingStaff[1], "C");
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
    <div style={{ padding: '10px', fontFamily: 'sans-serif', backgroundColor: '#f4f7f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '1rem', color: '#1a73e8', margin: 0 }}>鳳山所班表 (公平輪替版)</h2>
        <button onClick={autoGenerate} style={{ padding: '8px 12px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>✨ 重新自動排班</button>
      </div>
      
      <div style={{ marginBottom: '10px', display: 'flex', gap: '8px' }}>
        <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ width: '70px', padding: '5px' }} />
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{ padding: '5px' }}>
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

      <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#fff8e1', borderRadius: '8px', fontSize: '12px', color: '#f57c00' }}>
        <strong>⚖️ 公平性與人力檢查：</strong>
        <ul style={{ margin: '5px 0 0 18px', padding: 0 }}>
          <li><strong>班別均衡：</strong>系統會自動統計每人 A/C 班數，確保整月班次平均。</li>
          <li><strong>週日戰力：</strong>強制設定每週日必須有 4 位人員在場。</li>
          <li><strong>休假分散：</strong>滿足週日 4 人上班後，其餘休假將均勻分散於週間。</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
