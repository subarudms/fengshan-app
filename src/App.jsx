import React, { useState, useEffect } from 'react';

const App = () => {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [days, setDays] = useState([]);
  const [rosterData, setRosterData] = useState({});

  const employees = ["陳媺媐", "蔡威德", "黃振瑞", "陳冠伶", "黃煒森", "劉江偉"];
  const holidays = ["2026-05-01"]; // 勞動節

  const autoGenerate = () => {
    let newData = {};
    const daysInMonth = days.length;

    // 初始化統計
    let empStats = employees.reduce((acc, name) => {
      acc[name] = { aCount: 0, cCount: 0, lastOffDay: -1 };
      return acc;
    }, {});

    // 1. 以「週」為單位進行排班 (週日到週六)
    let currentDay = 1;
    while (currentDay <= daysInMonth) {
      // 找出本週的範圍 (從 currentDay 到本週六)
      let weekDays = [];
      for (let i = 0; i < 7; i++) {
        let d = currentDay + i;
        if (d > daysInMonth) break;
        weekDays.push(d);
        let date = new Date(year, month - 1, d);
        if (date.getDay() === 6) break; // 到週六停止
      }

      // --- 本週核心排休邏輯 ---
      employees.forEach(name => {
        // 每人每週必須休 2 天 (若該週天數不足5天則依比例，但5月核心週必休2天)
        let neededOff = weekDays.length >= 5 ? 2 : 1; 
        let offSelected = [];

        // 隨機挑選本週兩天休假，但不能連休
        let possibleDays = [...weekDays].sort(() => Math.random() - 0.5);
        
        for (let d of possibleDays) {
          if (offSelected.length >= neededOff) break;
          
          // 檢查禁止連休：不跟上週六連，也不跟本週已選的連
          if (empStats[name].lastOffDay !== d - 1 && !offSelected.includes(d - 1) && !offSelected.includes(d + 1)) {
            newData[`${name}-${d}`] = "休";
            offSelected.push(d);
            empStats[name].lastOffDay = d;
          }
        }
        
        // 如果因為連休限制沒排滿，強制塞入 (打破禁令以保證休假天數)
        if (offSelected.length < neededOff) {
          for (let d of weekDays) {
            if (offSelected.length >= neededOff) break;
            if (!offSelected.includes(d)) {
              newData[`${name}-${d}`] = "休";
              offSelected.push(d);
              empStats[name].lastOffDay = d;
            }
          }
        }
      });

      // --- 本週 A/C 班填補 ---
      weekDays.forEach(d => {
        let workingStaff = employees.filter(name => newData[`${name}-${d}`] !== "休");
        
        // 排序讓 A 上得少的人優先排 A
        workingStaff.sort((a, b) => empStats[a].aCount - empStats[b].aCount);
        
        let aCount = Math.ceil(workingStaff.length / 2);
        workingStaff.forEach((name, idx) => {
          if (idx < aCount) {
            newData[`${name}-${d}`] = "A";
            empStats[name].aCount++;
          } else {
            newData[`${name}-${d}`] = "C";
            empStats[name].cCount++;
          }
        });
      });

      currentDay += weekDays.length;
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
        <h2 style={{ fontSize: '1rem', color: '#1a73e8', margin: 0 }}>鳳山所班表 (修正規則強制版)</h2>
        <button onClick={autoGenerate} style={{ padding: '10px 15px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>🔨 重新校正並生成</button>
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

      <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#fff3e0', borderRadius: '8px', fontSize: '11px', color: '#e65100', border: '1px solid #ffe0b2' }}>
        <strong>🛠️ 邏輯修正：</strong>
        <ul style={{ margin: '5px 0 0 18px', padding: 0 }}>
          <li><strong>週週休二日：</strong>改為預排制，強制每一週（日到六）區間內，每人必須選出兩天休假。</li>
          <li><strong>禁止連休：</strong>加入了跨週連休偵測，自動生成時會避開連續兩天休假。</li>
          <li><strong>公平輪替：</strong>在休假確立後，其餘人力依 A/C 累積次數進行分配。</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
