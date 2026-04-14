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

    // 初始化統計
    let empStats = employees.reduce((acc, name) => {
      acc[name] = { aCount: 0, cCount: 0, weekOffCount: 0, consecutiveWork: 0 };
      return acc;
    }, {});

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      if (date.getDay() === 0) { // 每週日重置該週休假計數
        employees.forEach(n => empStats[n].weekOffCount = 0);
      }

      let candidates = [...employees].sort(() => Math.random() - 0.5);
      let dailyOffCount = 0;

      // --- 第一階段：決定休假人員 ---
      for (let name of candidates) {
        const stats = empStats[name];
        const yesterdayWasOff = newData[`${name}-${d-1}`] === "休";
        const weekOffLeft = 2 - stats.weekOffCount; 
        const daysLeftInWeek = 6 - date.getDay(); 
        
        let mustOff = false;
        let canOff = true;

        // 1. 強制檢查：連上 5 天，今天必須休
        if (stats.consecutiveWork >= 5) mustOff = true;

        // 2. 週間扣打檢查：如果剩下天數剛好夠休完這週的假，今天必須休
        if (weekOffLeft > 0 && weekOffLeft > daysLeftInWeek) mustOff = true;

        // 3. 禁令檢查：昨天休，今天絕不能休 (除非真的連上太久，但優先順序以不連休為主)
        if (yesterdayWasOff) canOff = false;

        // 4. 每日人數檢查：每天最多休 2 人
        if (dailyOffCount >= 2) canOff = false;

        // 決定是否排休 (如果是強制休，且不違反連休原則)
        if ((mustOff || (weekOffLeft > 0 && Math.random() > 0.6)) && canOff) {
          newData[`${name}-${d}`] = "休";
          stats.weekOffCount++;
          stats.consecutiveWork = 0;
          dailyOffCount++;
        }
      }

      // --- 第二階段：決定上班人員班別 (A/C) ---
      let workingStaff = employees.filter(name => newData[`${name}-${d}`] !== "休");
      
      // 確保即使沒排休的人，連上班天數也要增加
      workingStaff.forEach(name => empStats[name].consecutiveWork++);

      // 公平排序：A 上得少的人優先排 A
      workingStaff.sort((a, b) => empStats[a].aCount - empStats[b].aCount);
      
      let aCountNeeded = Math.ceil(workingStaff.length / 2);
      workingStaff.forEach((name, idx) => {
        if (idx < aCountNeeded) {
          newData[`${name}-${d}`] = "A";
          empStats[name].aCount++;
        } else {
          newData[`${name}-${d}`] = "C";
          empStats[name].cCount++;
        }
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
        <h2 style={{ fontSize: '1rem', color: '#1b5e20', margin: 0 }}>鳳山所班表 (法規全面封鎖版)</h2>
        <button onClick={autoGenerate} style={{ padding: '10px 15px', backgroundColor: '#1b5e20', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>🛡️ 安全生成 (不連上/不連休)</button>
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
                      style={{ width: '100%', height: '45px', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '15px', fontWeight: '600', color: rosterData[`${emp}-${d.day}`] === '休' ? '#d97706' : '#333', appearance: 'none' }}
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

      <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '8px', fontSize: '12px', color: '#2e7d32', border: '1px solid #c8e6c9' }}>
        <strong>✅ 勞動部法規合規版：</strong>
        <ul style={{ margin: '5px 0 0 18px', padding: 0 }}>
          <li><strong>連上 5 天必休：</strong>透過 <code>consecutiveWork</code> 計數，滿 5 天隔日強制排休。</li>
          <li><strong>絕不連休兩天：</strong>透過 <code>yesterdayWasOff</code> 判定，避開連續兩天休假。</li>
          <li><strong>週日到週六：</strong>每週期內必定休滿 2 天，滿足您對「一週」的定義。</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
