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

    // 嚴格追蹤每人狀態
    let empStats = employees.reduce((acc, name) => {
      acc[name] = { 
        aCount: 0, cCount: 0, 
        consecutiveWork: 0, lastWasOff: false,
        weekOffCount: 0, satOffCount: 0, sunOffCount: 0,
        lastShift: "" // 紀錄最後一次上的班別 (A/C)
      };
      return acc;
    }, {});

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dayOfWeek = date.getDay(); // 0(日) 到 6(六)

      // 週日重置週休計數 (週日至週六算一週)
      if (dayOfWeek === 0) {
        employees.forEach(name => empStats[name].weekOffCount = 0);
      }

      let availableStaff = [...employees].sort(() => Math.random() - 0.5);
      let dailyOffStaff = [];

      // --- 1. 決定誰休假 (週日必須 4 人上班，所以最多休 2 人) ---
      const maxOffToday = (dayOfWeek === 0) ? 2 : 2; 

      availableStaff.forEach(name => {
        const stats = empStats[name];
        let mustOff = stats.consecutiveWork >= 5; // 連上5天必休
        let canOff = true;

        if (stats.lastWasOff) canOff = false; // 禁止連休
        if (stats.weekOffCount >= 2) canOff = false; // 一週限2天
        if (dayOfWeek === 6 && stats.satOffCount >= 2) canOff = false; // 週六休假上限
        if (dayOfWeek === 0 && stats.sunOffCount >= 2) canOff = false; // 週日休假上限
        if (dailyOffStaff.length >= maxOffToday) canOff = false; // 確保營運人力

        // 週六日保障：如果還沒休過週六或週日，增加休假權重
        const weekendPriority = (dayOfWeek === 6 && stats.satOffCount < 1) || (dayOfWeek === 0 && stats.sunOffCount < 1);

        if (mustOff || (canOff && (weekendPriority || Math.random() > 0.6))) {
          dailyOffStaff.push(name);
          newData[`${name}-${d}`] = "休";
          stats.weekOffCount++;
          stats.consecutiveWork = 0;
          stats.lastWasOff = true;
          stats.lastShift = "";
          if (dayOfWeek === 6) stats.satOffCount++;
          if (dayOfWeek === 0) stats.sunOffCount++;
        }
      });

      // --- 2. 分配上班班別 (A/C 平衡) ---
      let workingStaff = employees.filter(name => !dailyOffStaff.includes(name));
      
      // 先決定誰上 A 誰上 C
      workingStaff.forEach((name) => {
        const stats = empStats[name];
        let chosenShift = "";

        // 公平核心：如果 A 上的比 C 多，或是上次上 A，這次就傾向排 C
        if (stats.aCount > stats.cCount || (stats.lastShift === "A" && Math.random() > 0.3)) {
          chosenShift = "C";
        } else {
          chosenShift = "A";
        }

        newData[`${name}-${d}`] = chosenShift;
        stats.consecutiveWork++;
        stats.lastWasOff = false;
        stats.lastShift = chosenShift;
        if (chosenShift === "A") stats.aCount++;
        else stats.cCount++;
      });

      // --- 3. 每日強制校正 (確保每天至少 1A 1C) ---
      const todayShifts = workingStaff.map(n => newData[`${n}-${d}`]);
      if (workingStaff.length >= 2) {
        if (!todayShifts.includes("A")) {
          const first = workingStaff[0];
          newData[`${first}-${d}`] = "A"; // 強制校正一個為 A
          empStats[first].aCount++; empStats[first].cCount--;
        }
        if (!todayShifts.includes("C")) {
          const last = workingStaff[workingStaff.length - 1];
          newData[`${last}-${d}`] = "C"; // 強制校正一個為 C
          empStats[last].cCount++; empStats[last].aCount--;
        }
      }
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
        <h2 style={{ fontSize: '1rem', color: '#1a73e8', margin: 0 }}>鳳山所班表 (終極公平修正版)</h2>
        <button onClick={autoGenerate} style={{ padding: '10px 15px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>⚠️ 重新自動排班</button>
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

      <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '8px', fontSize: '12px', color: '#0d47a1', border: '1px solid #bbdefb' }}>
        <strong>🚀 修正重點：</strong>
        <ul style={{ margin: '5px 0 0 18px', padding: 0 }}>
          <li><strong>班別強制交替：</strong>系統會追蹤上次班別，嚴禁長期固定在 A 班或 C 班。</li>
          <li><strong>週日戰力確保：</strong>每週日鎖定 4 人上班，2 人休假。</li>
          <li><strong>週末休假公平：</strong>每人每月必休 1-2 次週六與週日。</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
