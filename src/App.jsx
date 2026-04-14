import React, { useState, useEffect } from 'react';

const App = () => {
  // --- 系統設定狀態 ---
  const [config, setConfig] = useState({
    startDate: "2026-04-26",
    weeks: 6,
    employees: "陳媺媐, 蔡威德, 黃振瑞, 陳冠伶, 黃煒森, 劉江偉",
    shifts: "A, C",
    offLabels: "例假, 休假, 國定假日休"
  });

  const [rosterData, setRosterData] = useState({});
  const [dateHeaders, setDateHeaders] = useState([]);

  // --- 2026 年度國定假日資料庫 ---
  const nationalHolidays2026 = [
    "2026-01-01", // 元旦
    "2026-02-16", "2026-02-17", "2026-02-18", "2026-02-19", "2026-02-20", "2026-02-21", // 春節
    "2026-02-27", // 228補假
    "2026-02-28", // 和平紀念日
    "2026-04-02", // 清明連假
    "2026-04-03", // 兒童節補假
    "2026-04-06", // 清明補假
    "2026-05-01", // 勞動節
    "2026-06-19", // 端午連假
    "2026-09-25", // 中秋連假
    "2026-10-09", // 國慶連假
  ];

  const empList = config.employees.split(',').map(s => s.trim()).filter(s => s);
  const shiftList = config.shifts.split(',').map(s => s.trim()).filter(s => s);
  const offLabelList = config.offLabels.split(',').map(s => s.trim()).filter(s => s);
  const allOptions = ["-", ...shiftList, ...offLabelList];

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
      acc[name] = { aCount: 0, nationalQuotas: 0 };
      return acc;
    }, {});

    // 先計算本區間內包含多少個國定假日
    const currentHolidays = dateHeaders.filter(d => {
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return nationalHolidays2026.includes(dStr);
    });
    const holidayQuota = currentHolidays.length;

    for (let w = 0; w < config.weeks; w++) {
      const weekStartIdx = w * 7;
      
      empList.forEach((name, empIdx) => {
        let offInWeek = 0;
        for (let i = 0; i < 7; i++) {
          const currentDate = dateHeaders[weekStartIdx + i];
          if (!currentDate) continue;
          const dateKey = `${name}-${currentDate.getTime()}`;
          const dayOfWeek = currentDate.getDay();
          const template = [[1, 4], [2, 5], [3, 6], [0, 3], [1, 5], [2, 4]][(empIdx + w) % 6] || [1, 4];

          // 1. 基本 1例 1休
          if (template.includes(dayOfWeek) && offInWeek < 2) {
            const yesterdayKey = `${name}-${new Date(currentDate).getTime() - 86400000}`;
            if (!newData[yesterdayKey]?.includes("假") && !newData[yesterdayKey]?.includes("休")) {
              newData[dateKey] = offInWeek === 0 ? offLabelList[0] : offLabelList[1];
              offInWeek++;
            }
          }

          // 2. 國定假日額度補償 (在非休假日隨機安插)
          if (!newData[dateKey] && empStats[name].nationalQuotas < holidayQuota) {
            const yesterdayKey = `${name}-${new Date(currentDate).getTime() - 86400000}`;
            const yesterdayWasOff = newData[yesterdayKey]?.includes("假") || newData[yesterdayKey]?.includes("休");
            if (!yesterdayWasOff && Math.random() > 0.8) {
              newData[dateKey] = offLabelList[2];
              empStats[name].nationalQuotas++;
            }
          }
        }
      });

      // 3. 分配 A/C 班
      for (let i = 0; i < 7; i++) {
        const currentDate = dateHeaders[weekStartIdx + i];
        if (!currentDate) continue;
        let workingStaff = empList.filter(name => !newData[`${name}-${currentDate.getTime()}`]);
        workingStaff.sort((a, b) => (empStats[a].aCount || 0) - (empStats[b].aCount || 0));
        let half = Math.ceil(workingStaff.length / 2);
        workingStaff.forEach((name, idx) => {
          const shift = idx < half ? shiftList[0] : shiftList[1];
          newData[`${name}-${currentDate.getTime()}`] = shift;
          if (shift === shiftList[0]) empStats[name].aCount++;
        });
      }
    }
    setRosterData(newData);
    localStorage.setItem(`roster-master`, JSON.stringify(newData));
  };

  return (
    <div style={{ padding: '15px', fontFamily: 'sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      <h2 style={{ color: '#0f172a', fontSize: '1.2rem', marginBottom: '15px' }}>📅 鳳山所智慧排班 (全年度國定假日版)</h2>
      
      <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '15px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ flex: '1 1 150px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>起始日期</label>
          <input type="date" value={config.startDate} onChange={e => setConfig({...config, startDate: e.target.value})} style={{ width: '100%', padding: '6px', marginTop: '4px' }} />
        </div>
        <div style={{ flex: '1 1 100px', display: 'flex', alignItems: 'flex-end' }}>
          <button onClick={autoGenerate} style={{ width: '100%', padding: '8px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
            🔄 生成合規班表
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: 'max-content', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #e2e8f0', padding: '12px 8px', backgroundColor: '#f8fafc', position: 'sticky', left: 0, zIndex: 20 }}>姓名</th>
              {dateHeaders.map(d => {
                const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const isNational = nationalHolidays2026.includes(dStr);
                return (
                  <th key={d.getTime()} style={{ border: '1px solid #e2e8f0', padding: '6px', minWidth: '55px', backgroundColor: isNational ? '#fee2e2' : (d.getDay() === 0 || d.getDay() === 6) ? '#fef3c7' : 'white' }}>
                    <div style={{ color: isNational ? '#dc2626' : 'inherit' }}>{d.getMonth()+1}/{d.getDate()}</div>
                    <div style={{ fontSize: '10px', color: isNational ? '#dc2626' : '#64748b' }}>{isNational ? '國定' : ['日','一','二','三','四','五','六'][d.getDay()]}</div>
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
                  const getColor = (v) => {
                    if (v === offLabelList[0]) return '#dc2626'; 
                    if (v === offLabelList[1]) return '#2563eb'; 
                    if (v === offLabelList[2]) return '#059669'; 
                    return '#1e293b'; 
                  };
                  return (
                    <td key={d.getTime()} style={{ border: '1px solid #e2e8f0', padding: '0', textAlign: 'center' }}>
                      <select value={val} onChange={(e) => handleCellChange(name, d.getTime(), e.target.value)}
                        style={{ width: '100%', height: '40px', border: 'none', background: 'transparent', textAlign: 'center', textAlignLast: 'center', fontSize: '14px', fontWeight: val.includes("假") || val.includes("休") ? 'bold' : '500', color: getColor(val), cursor: 'pointer', appearance: 'none' }}>
                        {allOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
