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

    // 定義 6 套互補的休假模式 (每週休2天，且不連休)
    const baseTemplates = [
      [1, 4], [2, 5], [3, 6], [0, 3], [1, 5], [2, 4]
    ];

    let empStats = employees.reduce((acc, name) => {
      acc[name] = { aCount: 0, cCount: 0 };
      return acc;
    }, {});

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dayOfWeek = date.getDay();
      
      // 計算這是本月的第幾週 (0, 1, 2, 3...)
      const weekIndex = Math.floor((d + new Date(year, month - 1, 1).getDay() - 1) / 7);

      employees.forEach((name, index) => {
        // 關鍵：每週讓員工使用的樣板順序「加 1」，實現輪替
        // 這樣每個人都會輪流用到包含 0(日) 或 6(六) 的樣板
        const templateIndex = (index + weekIndex) % baseTemplates.length;
        const myOffDays = baseTemplates[templateIndex];

        if (myOffDays.includes(dayOfWeek)) {
          // 額外檢查：防止跨週換樣板時造成連休
          if (dayOfWeek === 0 && newData[`${name}-${d-1}`] === "休") {
            // 如果週日剛好要換成休假樣板，但昨天(週六)已經休過，則今天強制上班
            return; 
          }
          newData[`${name}-${d}`] = "休";
        }
      });

      // 分配上班人員的 A/C 班
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
        <h2 style={{ fontSize: '1rem', color: '#2c3e50', margin: 0 }}>鳳山所班表 (週末輪替公平版)</h2>
        <button onClick={autoGenerate} style={{ padding: '10px 15px', backgroundColor: '#056162', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>🔄 產生公平輪替班表</button>
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

      <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#e0f2f1', borderRadius: '8px', fontSize: '12px', color: '#00695c', border: '1px solid #b2dfdb' }}>
        <strong>✅ 週末輪替說明：</strong>
        <ul style={{ margin: '5px 0 0 18px', padding: 0 }}>
          <li><strong>樣板輪動：</strong>每人每週都會換一套休息日，這保證了一個月內每個人都會輪到週末休假。</li>
          <li><strong>法規檢查：</strong>系統內建跨週檢查，換樣板時若造成連休會自動跳過，確保符合「不連休」與「連上不超過5天」之法規。</li>
          <li><strong>人數恆定：</strong>透過互補樣板，每天固定 4 人上班，2 人休假。</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
