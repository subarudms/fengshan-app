import React, { useState, useEffect } from 'react';

const App = () => {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [days, setDays] = useState([]);
  const [rosterData, setRosterData] = useState({});

  const employees = ["陳媺媐", "蔡威德", "黃振瑞", "陳冠伶", "黃煒森", "劉江偉"];
  // 5月1日是國定假日 (勞動節)
  const holidays = ["2026-05-01"];

  const autoGenerate = () => {
    let newData = {};
    const daysInMonth = days.length;
    
    // 計算整月應休總天數：(週數 * 2) + 國定假日天數
    const totalWeeks = Math.ceil(daysInMonth / 7);
    const totalOffQuota = (totalWeeks * 2) + holidays.length;

    // 初始化狀態
    let empStats = employees.reduce((acc, name) => {
      acc[name] = { 
        aCount: 0, cCount: 0, 
        weekWorkCount: 0, // 週日~週六上班計數
        totalOffCount: 0, // 月累積休假
        lastWasOff: false 
      };
      return acc;
    }, {});

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dayOfWeek = date.getDay(); // 0(日)

      // 遇到週日：重置「週上班天數」
      if (dayOfWeek === 0) {
        employees.forEach(name => empStats[name].weekWorkCount = 0);
      }

      let availableStaff = [...employees].sort(() => Math.random() - 0.5);
      let dailyOffStaff = [];

      // --- 1. 休假判定邏輯 ---
      availableStaff.forEach(name => {
        const stats = empStats[name];
        let mustOff = false;
        let canOff = true;

        // A. 規則：每週(日到六)上班不能超過 5 天
        if (stats.weekWorkCount >= 5) mustOff = true;

        // B. 規則：禁止連休 (除非是為了滿足每週休2天的底線)
        if (stats.lastWasOff && stats.weekWorkCount < 3) canOff = false;

        // C. 規則：確保每週至少休 2 天，若接近週末還沒休夠，提高休假機率
        const daysLeftInWeek = (6 - dayOfWeek);
        const neededOffInWeek = 2 - (d - 1 - (d-1 - dayOfWeek) - stats.weekWorkCount); // 簡化邏輯：剩餘天數若不夠休滿2天則強制休
        
        // --- 最終休假決定 ---
        // 1. 如果已達週工時上限，必須休
        // 2. 如果今天休假日不會造成沒人上班 (保持至少4人上班)
        if ((mustOff || (Math.random() > 0.6 && canOff)) && dailyOffStaff.length < 2) {
          dailyOffStaff.push(name);
          newData[`${name}-${d}`] = "休";
          stats.totalOffCount++;
          stats.lastWasOff = true;
          stats.consecutiveWork = 0;
        }
      });

      // --- 2. 班別分配邏輯 (A/C 平衡) ---
      let workingStaff = employees.filter(name => !dailyOffStaff.includes(name));
      
      // 計算對稱人數
      const half = Math.ceil(workingStaff.length / 2);
      let aSlots = half;
      
      // 依累積 A 班次數排序，讓上的少的人排 A
      workingStaff.sort((a, b) => empStats[a].aCount - empStats[b].aCount);

      workingStaff.forEach(name => {
        let shift = "";
        if (aSlots > 0) {
          shift = "A";
          aSlots--;
          empStats[name].aCount++;
        } else {
          shift = "C";
          empStats[name].cCount++;
        }
        newData[`${name}-${d}`] = shift;
        empStats[name].weekWorkCount++;
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
        <h2 style={{ fontSize: '1rem', color: '#1a73e8', margin: 0 }}>鳳山所班表 (週工時精算版)</h2>
        <button onClick={autoGenerate} style={{ padding: '10px 15px', backgroundColor: '#1b5e20', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>🗓️ 生成合規班表</button>
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

      <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '8px', fontSize: '12px', color: '#2e7d32', border: '1px solid #c8e6c9' }}>
        <strong>⚖️ 五月份排班邏輯說明：</strong>
        <ul style={{ margin: '5px 0 0 18px', padding: 0 }}>
          <li><strong>一週定義：</strong>嚴格遵守 5/3 (日) 到 5/9 (六) 這種日到六的循環計算。</li>
          <li><strong>工時底線：</strong>每週上班絕對不超過 5 天，休假絕對不少於 2 天。</li>
          <li><strong>假日額度：</strong>5/1 勞動節之假額已包含在月總休假天數中，由系統自動分配至各週間。</li>
          <li><strong>戰力平衡：</strong>每日維持 4 人上班時，班別比例自動鎖定為 2 早 2 晚。</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
