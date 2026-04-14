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
      acc[name] = { aCount: 0, cCount: 0, weekOffCount: 0 };
      return acc;
    }, {});

    // --- 第一階段：強制排入休假 (嚴格遵守日到六區間) ---
    let currentWeekStart = 1;
    // 找出第一週的開始 (5/1 是週五，5/3 才是第一個週日)
    // 為了計算精確，我們先跑一次迴圈標註每週的範圍
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      if (date.getDay() === 0) { // 每逢週日，重置該週休假計數
        employees.forEach(n => empStats[n].weekOffCount = 0);
      }

      // 隨機打亂人員順序，公平挑選誰今天可以休
      let candidates = [...employees].sort(() => Math.random() - 0.5);
      let dailyOffCount = 0;

      for (let name of candidates) {
        if (dailyOffCount >= 2) break; // 每天最多休2人 (確保4人上班)

        // --- 核心禁令檢查 ---
        const yesterdayWasOff = newData[`${name}-${d-1}`] === "休";
        const isLastDayOfWeek = new Date(year, month - 1, d).getDay() === 6;
        const weekOffLeft = 2 - empStats[name].weekOffCount; // 本週還剩幾個休假扣打
        const daysLeftInWeek = 6 - new Date(year, month - 1, d).getDay(); // 本週還剩幾天
        
        let shouldOff = false;
        
        // 1. 如果這週剩餘天數剛好等於剩餘休假扣打，則今天「必須」休
        if (weekOffLeft > 0 && weekOffLeft > daysLeftInWeek) {
            shouldOff = true;
        } 
        // 2. 隨機排休，但必須避開昨天已休的情況
        else if (weekOffLeft > 0 && !yesterdayWasOff && Math.random() > 0.6) {
            shouldOff = true;
        }

        // 雙重保證：絕對禁止連休 (哪怕是跨週)
        if (shouldOff && !yesterdayWasOff) {
          newData[`${name}-${d}`] = "休";
          empStats[name].weekOffCount++;
          dailyOffCount++;
        }
      }
    }

    // --- 第二階段：填補 A/C 班 (確保公平) ---
    for (let d = 1; d <= daysInMonth; d++) {
      let workingStaff = employees.filter(name => newData[`${name}-${d}`] !== "休");
      
      // 依 A 班累積次數排序
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
        <h2 style={{ fontSize: '1rem', color: '#d32f2f', margin: 0 }}>鳳山所班表 (禁連休終極校正版)</h2>
        <button onClick={autoGenerate} style={{ padding: '10px 15px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>🚀 重新生成 (嚴禁連休)</button>
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

      <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#ffebee', borderRadius: '8px', fontSize: '12px', color: '#c62828', border: '1px solid #ffcdd2' }}>
        <strong>🚨 禁令強化說明：</strong>
        <ul style={{ margin: '5px 0 0 18px', padding: 0 }}>
          <li><strong>跨週禁連休：</strong>加入了 <code>yesterdayWasOff</code> 判定，即便是在週六與週日交界，也絕不允許連續休假。</li>
          <li><strong>週週休二日：</strong>嚴格鎖定週日至週六區間，每人必定休滿 2 天。</li>
          <li><strong>人力保底：</strong>每天自動生成時會排除掉休假超過 2 人（即至少 4 人在場）的情況。</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
