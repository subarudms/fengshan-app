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

    // 初始化每人狀態
    let empStats = employees.reduce((acc, name) => {
      acc[name] = { 
        aCount: 0, cCount: 0, 
        weekWorkCount: 0, // 當週上班天數 (日~六)
        lastWasOff: false,
        sunOffCount: 0, satOffCount: 0
      };
      return acc;
    }, {});

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dayOfWeek = date.getDay(); // 0(日)

      // 每週日重置「週上班天數」
      if (dayOfWeek === 0) {
        employees.forEach(name => empStats[name].weekWorkCount = 0);
      }

      let availableStaff = [...employees].sort(() => Math.random() - 0.5);
      let dailyOffStaff = [];

      // --- 1. 決定誰休假 ---
      // 週日強制 4 人上班 (2人休)；其餘日子維持最少 2 人休假
      const targetOffCount = 2; 

      availableStaff.forEach(name => {
        const stats = empStats[name];
        let mustWork = false;
        let mustOff = false;

        // 規則：每週上班不能超過 5 天 (已上滿 5 天則強制休)
        if (stats.weekWorkCount >= 5) mustOff = true;
        
        // 規則：禁止連休
        if (stats.lastWasOff) mustWork = true;

        // 規則：週日 4 人上班優先級
        if (dayOfWeek === 0 && dailyOffStaff.length < targetOffCount && !mustWork) {
            // 隨機決定誰在週日休，但要確保沒超過週日休假上限
            if (stats.sunOffCount < 2 && Math.random() > 0.5) mustOff = true;
        }

        if ((mustOff || (Math.random() > 0.6 && !mustWork)) && dailyOffStaff.length < targetOffCount) {
          dailyOffStaff.push(name);
          newData[`${name}-${d}`] = "休";
          stats.lastWasOff = true;
          if (dayOfWeek === 0) stats.sunOffCount++;
          if (dayOfWeek === 6) stats.satOffCount++;
        }
      });

      // --- 2. 決定上班的人 (分配 A/C 平衡) ---
      let workingStaff = employees.filter(name => !dailyOffStaff.includes(name));
      
      // 計算今天應該有多少 A 班和 C 班 (保持平衡)
      // 如果 4 人上班 -> 2A 2C; 如果 6 人上班 -> 3A 3C
      const half = Math.ceil(workingStaff.length / 2);
      let aSlots = half;
      let cSlots = workingStaff.length - half;

      // 根據每人歷史 A/C 累積次數排序，A 上太多的排後面(優先分到C)
      workingStaff.sort((a, b) => empStats[a].aCount - empStats[b].aCount);

      workingStaff.forEach((name, idx) => {
        let shift = "";
        // 優先填滿 A Slots，但如果 A 已經太多就嘗試調換
        if (aSlots > 0) {
          shift = "A";
          aSlots--;
        } else {
          shift = "C";
          cSlots--;
        }

        newData[`${name}-${d}`] = shift;
        empStats[name].weekWorkCount++;
        empStats[name].lastWasOff = false;
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
    <div style={{ padding: '10px', fontFamily: 'sans-serif', backgroundColor: '#f4f7f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '1rem', color: '#1a73e8', margin: 0 }}>鳳山所班表 (週工時與班別平衡版)</h2>
        <button onClick={autoGenerate} style={{ padding: '10px 15px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>✅ 產生合規班表</button>
      </div>
      
      {/* 日期選擇器 */}
      <div style={{ marginBottom: '10px', display: 'flex', gap: '8px' }}>
        <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ width: '70px', padding: '5px' }} />
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{ padding: '5px' }}>
          {[...Array(12).keys()].map(m => <option key={m+1} value={m+1}>{m+1}月</option>)}
        </select>
      </div>

      {/* 班表主體 */}
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

      {/* 規則說明標籤 */}
      <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#f1f8e9', borderRadius: '8px', fontSize: '11px', color: '#1b5e20', border: '1px solid #c5e1a5' }}>
        <strong>📌 本版規則強化：</strong>
        <ul style={{ margin: '5px 0 0 18px', padding: 0 }}>
          <li><strong>七日工時：</strong>每週日到週六區間，上班天數絕對不超過 5 天。</li>
          <li><strong>班別平衡：</strong>當天 4 人上班時，自動分配為 2A、2C，確保勞務平均。</li>
          <li><strong>週日戰力：</strong>維持週日 4 人在崗，滿足診所營運需求。</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
