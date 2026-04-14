import React, { useState, useEffect } from 'react';

const App = () => {
  const [config, setConfig] = useState({
    startDate: "2026-04-26",
    weeks: 6,
    employees: "陳媺媐, 蔡威德, 黃振瑞, 陳冠伶, 黃煒森, 劉江偉",
    shifts: "A, C"
  });

  const [rosterData, setRosterData] = useState({});
  const [dateHeaders, setDateHeaders] = useState([]);

  const holidayMap = {
    "2026-01-01": "元旦休", "2026-02-16": "除夕休", "2026-02-17": "初一休",
    "2026-02-18": "初二休", "2026-02-19": "初三休", "2026-02-20": "初四休",
    "2026-02-21": "初五休", "2026-02-27": "228補休", "2026-02-28": "228紀念日",
    "2026-04-02": "清明連休", "2026-04-03": "兒童節補休", "2026-04-06": "清明補休",
    "2026-05-01": "勞動節休", "2026-06-19": "端午節休", "2026-09-25": "中秋節休",
    "2026-10-09": "國慶節休"
  };

  const empList = config.employees.split(',').map(s => s.trim()).filter(s => s);
  const shiftList = config.shifts.split(',').map(s => s.trim()).filter(s => s);

  useEffect(() => {
    const start = new Date(config.startDate);
    const headers = [];
    for (let i = 0; i < config.weeks * 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      headers.push(d);
    }
    setDateHeaders(headers);
    const saved = localStorage.getItem(`roster-master`);
    if (saved) setRosterData(JSON.parse(saved));
  }, [config.startDate, config.weeks]);

  const handleCellChange = (empName, dateTimestamp, newValue) => {
    const updatedData = { ...rosterData, [`${empName}-${dateTimestamp}`]: newValue };
    setRosterData(updatedData);
    localStorage.setItem(`roster-master`, JSON.stringify(updatedData));
  };

  const autoGenerate = () => {
    let newData = {};
    let empStats = empList.reduce((acc, name) => {
      acc[name] = { aCount: 0, cCount: 0, consecutiveWork: 0, weekOffCount: 0, monthNationalCount: 0 };
      return acc;
    }, {});

    for (let d = 1; d <= config.weeks * 7; d++) {
      const currentDate = dateHeaders[d - 1];
      if (!currentDate) continue;
      const dayOfWeek = currentDate.getDay();
      const dStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

      // 週日重置週休計數
      if (dayOfWeek === 0) {
        empList.forEach(n => empStats[n].weekOffCount = 0);
      }

      empList.forEach((name, empIdx) => {
        const stats = empStats[name];
        const dateKey = `${name}-${currentDate.getTime()}`;
        const yesterdayKey = `${name}-${currentDate.getTime() - 86400000}`;
        const yesterdayWasOff = newData[yesterdayKey] && (newData[yesterdayKey].includes("休") || newData[yesterdayKey].includes("假"));

        // 樣板邏輯：確保每週有休假
        const template = [[1, 4], [2, 5], [3, 6], [0, 3], [1, 5], [2, 4]][(empIdx + Math.floor((d-1)/7)) % 6];
        
        let shouldOff = false;
        let offLabel = "";

        // 1. 勞基法強制：連上五天必休
        if (stats.consecutiveWork >= 5 && !yesterdayWasOff) {
          shouldOff = true;
        } 
        // 2. 樣板預排休假
        else if (template.includes(dayOfWeek) && stats.weekOffCount < 2 && !yesterdayWasOff) {
          shouldOff = true;
        }
        // 3. 國定假日補休 (隨機安插在5月或其他月份)
        else if (holidayMap[dStr] && stats.monthNationalCount < 1 && !yesterdayWasOff && Math.random() > 0.7) {
          shouldOff = true;
          offLabel = holidayMap[dStr];
        }

        if (shouldOff) {
          if (!offLabel) {
            // 精準名詞順序：週內第一個假叫例假，第二個叫休假
            offLabel = stats.weekOffCount === 0 ? "例假" : "休假";
          }
          newData[dateKey] = offLabel;
          stats.weekOffCount++;
          stats.consecutiveWork = 0;
          if (offLabel.includes("節") || offLabel.includes("元旦")) stats.monthNationalCount++;
        }
      });

      // 分配 A/C
      let workingStaff = empList.filter(name => !newData[`${name}-${currentDate.getTime()}`]);
      workingStaff.sort((a, b) => empStats[a].aCount - empStats[b].aCount);
      let half = Math.ceil(workingStaff.length / 2);
      workingStaff.forEach((name, idx) => {
        const shift = idx < half ? "A" : "C";
        newData[`${name}-${currentDate.getTime()}`] = shift;
        empStats[name].consecutiveWork++;
        if (shift === "A") empStats[name].aCount++;
      });
    }
    setRosterData(newData);
    localStorage.setItem(`roster-master`, JSON.stringify(newData));
  };

  return (
    <div style={{ padding: '15px', fontFamily: 'sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#1e293b', fontSize: '1.1rem' }}>鳳山所智慧排班 (例休順序校正版)</h2>
        <button onClick={autoGenerate} style={{ padding: '10px 16px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>重新計算生成</button>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '15px', display: 'flex', gap: '10px' }}>
        <input type="date" value={config.startDate} onChange={e => setConfig({...config, startDate: e.target.value})} style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: 'max-content', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #e2e8f0', padding: '12px 8px', backgroundColor: '#f8fafc', position: 'sticky', left: 0, zIndex: 20 }}>姓名</th>
              {dateHeaders.map(d => {
                const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const hName = holidayMap[dStr];
                return (
                  <th key={d.getTime()} style={{ border: '1px solid #e2e8f0', padding: '6px', minWidth: '60px', backgroundColor: hName ? '#fee2e2' : (d.getDay() === 0 || d.getDay() === 6) ? '#fef3c7' : 'white' }}>
                    <div style={{ color: hName ? '#dc2626' : 'inherit' }}>{d.getMonth()+1}/{d.getDate()}</div>
                    <div style={{ fontSize: '10px', color: hName ? '#dc2626' : '#64748b' }}>{hName ? hName.replace('休','') : ['日','一','二','三','四','五','六'][d.getDay()]}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {empList.map(name => (
              <tr key={name}>
                <td style={{ border: '1px solid #e2e8f0', padding: '10px 8px', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 10, textAlign: 'center' }}>{name}</td>
                {dateHeaders.map(d => {
                  const val = rosterData[`${name}-${d.getTime()}`] || "-";
                  const s = {
                    color: val === "例假" ? "#dc2626" : val === "休假" ? "#2563eb" : (val.includes("休") && val.length > 1) ? "#059669" : "#1e293b",
                    fontWeight: (val.includes("假") || val.includes("休")) && val.length > 1 ? "bold" : "normal"
                  };
                  return (
                    <td key={d.getTime()} style={{ border: '1px solid #e2e8f0', padding: '0', textAlign: 'center' }}>
                      <select value={val} onChange={(e) => handleCellChange(name, d.getTime(), e.target.value)}
                        style={{ width: '100%', height: '40px', border: 'none', background: 'transparent', textAlign: 'center', textAlignLast: 'center', fontSize: '13px', ...s, appearance: 'none', cursor: 'pointer' }}>
                        {["-", "A", "C", "例假", "休假", ...Object.values(holidayMap)].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;
