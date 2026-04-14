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
    const totalAllowedOff = Math.floor(daysInMonth / 7) * 2 + holidays.length;

    // 紀錄每人已休天數與連上天數
    let empStats = employees.reduce((acc, name) => {
      acc[name] = { off: 0, work: 0, lastOff: false };
      return acc;
    }, {});

    for (let d = 1; d <= daysInMonth; d++) {
      let dailyStaff = []; // 紀錄今天誰上班、上什麼班
      let availableStaff = [...employees]; // 今天還沒排的人

      // 1. 先處理「強制休假」(連上5天者)
      availableStaff = availableStaff.filter(name => {
        if (empStats[name].work >= 5 || (empStats[name].off < totalAllowedOff && Math.random() > 0.8 && !empStats[name].lastOff)) {
          newData[`${name}-${d}`] = "休";
          empStats[name].off++;
          empStats[name].work = 0;
          empStats[name].lastOff = true;
          return false;
        }
        return true;
      });

      // 2. 確保每天至少有一 A 一 C (營運低標)
      const forceShift = (type) => {
        if (availableStaff.length > 0) {
          const name = availableStaff.shift();
          newData[`${name}-${d}`] = type;
          empStats[name].work++;
          empStats[name].lastOff = false;
        }
      };
      
      forceShift("A"); // 第一人強制早班
      forceShift("C"); // 第二人強制晚班

      // 3. 剩下的人公平分配 A 或 C
      availableStaff.forEach((name, idx) => {
        const type = (d + idx) % 2 === 0 ? "A" : "C";
        newData[`${name}-${d}`] = type;
        empStats[name].work++;
        empStats[name].lastOff = false;
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
        <h2 style={{ fontSize: '1rem', color: '#1a73e8', margin: 0 }}>鳳山所班表 (營運保證版)</h2>
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

      <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '8px', fontSize: '12px', color: '#0d47a1' }}>
        <strong>🛡️ 營運保證邏輯：</strong>
        <ul style={{ margin: '5px 0 0 18px', padding: 0 }}>
          <li><strong>每日低標：</strong>確保每天至少有一位早班 (A) 與一位晚班 (C)。</li>
          <li><strong>防呆機制：</strong>自動過濾掉全天皆為同班別的錯誤情況。</li>
          <li><strong>合規檢查：</strong>維持連上 5 天必休與不連休之法規限制。</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
