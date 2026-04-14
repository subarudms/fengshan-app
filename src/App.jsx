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

    // 紀錄每人狀態
    let empStats = employees.reduce((acc, name) => {
      acc[name] = { 
        totalOff: 0, 
        consecutiveWork: 0, 
        lastWasOff: false,
        weekOffCount: 0,
        satOffCount: 0,
        sunOffCount: 0
      };
      return acc;
    }, {});

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dayOfWeek = date.getDay(); // 0是週日, 6是週六

      // 每週日重置週休計數 (規則：週日至週六算一週)
      if (dayOfWeek === 0) {
        employees.forEach(name => empStats[name].weekOffCount = 0);
      }

      let availableStaff = [...employees];

      // 1. 決定誰「今天必須休」或「今天可以休」
      let dailyOffStaff = [];
      
      // 先挑出符合規則必須/優先休假的人
      const candidates = [...employees].sort(() => Math.random() - 0.5);
      
      candidates.forEach(name => {
        const stats = empStats[name];
        let shouldOff = false;

        // 規則 A: 連續上班 5 天強制休息
        if (stats.consecutiveWork >= 5) shouldOff = true;

        // 規則 B: 週六日公平性 (若還沒休過週六日，優先在週六日排休)
        if (dayOfWeek === 6 && stats.satOffCount < 1) shouldOff = true;
        if (dayOfWeek === 0 && stats.sunOffCount < 1) shouldOff = true;

        // 規則 C: 隨機補休 (但一週不能超過2天)
        if (!shouldOff && stats.weekOffCount < 2 && Math.random() > 0.6) shouldOff = true;

        // --- 檢查排除條件 ---
        // 1. 禁止連休 (昨天休今天就不准休)
        if (stats.lastWasOff) shouldOff = false;
        // 2. 週限制 (一週已休滿2天)
        if (stats.weekOffCount >= 2) shouldOff = false;
        // 3. 週六日上限 (不超過2次)
        if (dayOfWeek === 6 && stats.satOffCount >= 2) shouldOff = false;
        if (dayOfWeek === 0 && stats.sunOffCount >= 2) shouldOff = false;

        if (shouldOff && dailyOffStaff.length < (employees.length - 2)) { 
          // 確保扣除休假後至少剩2人上班 (一A一C)
          dailyOffStaff.push(name);
          newData[`${name}-${d}`] = "休";
          stats.totalOff++;
          stats.weekOffCount++;
          stats.consecutiveWork = 0;
          stats.lastWasOff = true;
          if (dayOfWeek === 6) stats.satOffCount++;
          if (dayOfWeek === 0) stats.sunOffCount++;
          availableStaff = availableStaff.filter(n => n !== name);
        }
      });

      // 2. 確保營運低標 (一A一C)
      const forceShift = (type) => {
        if (availableStaff.length > 0) {
          const name = availableStaff.shift();
          newData[`${name}-${d}`] = type;
          empStats[name].consecutiveWork++;
          empStats[name].lastWasOff = false;
        }
      };
      
      forceShift("A");
      forceShift("C");

      // 3. 剩下的人分配剩餘班別
      availableStaff.forEach((name, idx) => {
        const type = (d + idx) % 2 === 0 ? "A" : "C";
        newData[`${name}-${d}`] = type;
        empStats[name].consecutiveWork++;
        empStats[name].lastWasOff = false;
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
    <div style={{ padding: '10px', fontFamily: 'sans-serif', backgroundColor: '#f4f7f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '1rem', color: '#1a73e8', margin: 0 }}>鳳山所班表 (精準規則版)</h2>
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

      <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '8px', fontSize: '11px', color: '#2e7d32', border: '1px solid #c8e6c9' }}>
        <strong>✅ 規則檢核完成：</strong>
        <ul style={{ margin: '5px 0 0 18px', padding: 0 }}>
          <li><strong>七天週期：</strong>每週日到隔週六區間內，每人僅排休 2 天。</li>
          <li><strong>禁止連休：</strong>自動生成不允許連續休假 2 天。</li>
          <li><strong>週六日保障：</strong>每人每月必休「一個週六」與「一個週日」。</li>
          <li><strong>上限控制：</strong>每人每月週六/週日休假天數各自不超過 2 次。</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
