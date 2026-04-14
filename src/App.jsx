import React, { useState, useEffect } from 'react';

const App = () => {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [days, setDays] = useState([]);

  // --- 後台管理區：在此修改員工名單 ---
  const employees = ["陳德珊", "陳媺媐", "蔡威德", "黃振瑞","陳冠伶","黃煒森","劉江偉"]; 
  
  // --- 下拉選單設定：在此修改班別選項 ---
  const shiftOptions = [
    { label: "-", value: "" },
    { label: "早1", value: "A" },
    { label: "早2", value: "A2" },
    { label: "早3", value: "A3" },
    { label: "晚1", value: "C1" },
    { label: "晚2", value: "C2"},
    { label: "晚3", value: "C3"},
    { label: "休", value: "休"},
    { label: "全", value: "O"},
    { label: "備", value: "備"},
  ];

  const holidays = ["2026-05-01"]; 

  useEffect(() => {
    const date = new Date(year, month - 1, 1);
    const result = [];
    while (date.getMonth() === month - 1) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isHoliday = holidays.includes(dateStr);
      result.push({
        day: date.getDate(),
        weekDay: ["日", "一", "二", "三", "四", "五", "六"][date.getDay()],
        isOffDay: isWeekend || isHoliday,
      });
      date.setDate(date.getDate() + 1);
    }
    setDays(result);
  }, [year, month]);

  return (
    <div style={{ padding: '15px', fontFamily: 'sans-serif', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      <h2 style={{ color: '#2c3e50', borderLeft: '5px solid #3498db', paddingLeft: '10px', fontSize: '1.2rem' }}>
        鳳山所 {year}年{month}月 班表
      </h2>
      
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
        <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ width: '80px', padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }} />
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}>
          {[...Array(12).keys()].map(m => <option key={m+1} value={m+1}>{m+1}月</option>)}
        </select>
      </div>

      <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f3f5' }}>
              <th style={{ border: '1px solid #dee2e6', padding: '10px', position: 'sticky', left: 0, backgroundColor: '#f1f3f5', zIndex: 10, minWidth: '80px' }}>姓名</th>
              {days.map(d => (
                <th key={d.day} style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'center', backgroundColor: d.isOffDay ? '#fff2cc' : 'white' }}>
                  {d.day}<br/><span style={{ fontSize: '11px' }}>{d.weekDay}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid #dee2e6', padding: '10px', textAlign: 'center', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 5 }}>
                  {emp}
                </td>
                {days.map(d => (
                  <td key={d.day} style={{ border: '1px solid #dee2e6', padding: '2px', textAlign: 'center', backgroundColor: d.isOffDay ? '#fffdf5' : 'white' }}>
                    {/* 這裡改成下拉選單 */}
                    <select style={{ 
                      width: '35px', 
                      border: 'none', 
                      background: 'transparent', 
                      fontSize: '14px', 
                      appearance: 'none', // 隱藏原生箭頭讓介面更乾淨
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#34495e'
                    }}>
                      {shiftOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#7f8c8d', padding: '10px', backgroundColor: '#eef2f7', borderRadius: '5px' }}>
        <strong>手機操作提示：</strong> 點擊格子即可選擇班別 A/C/O/休。 <br/>
        <span style={{ color: '#e67e22' }}>※ 系統已自動標記國定假日與週末。</span>
      </div>
    </div>
  );
};

export default App;
