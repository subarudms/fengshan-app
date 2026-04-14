import React, { useState, useEffect } from 'react';

const App = () => {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [days, setDays] = useState([]);

  // --- 後台管理區：在這裡增減員工名字即可 ---
  const employees = ["陳胤合", "員工B", "員工C", "新同事"]; 
  // ---------------------------------------

  const holidays = ["2026-05-01"]; 

  useEffect(() => {
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
    <div style={{ padding: '15px', fontFamily: 'sans-serif', maxWidth: '100vw' }}>
      <h2 style={{ color: '#2c3e50', fontSize: '1.2rem' }}>鳳山所 {year}年{month}月 班表</h2>
      
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
        <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ width: '80px', padding: '5px' }} />
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{ padding: '5px' }}>
          {[...Array(12).keys()].map(m => <option key={m+1} value={m+1}>{m+1}月</option>)}
        </select>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#eee' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px', position: 'sticky', left: 0, backgroundColor: '#eee', zIndex: 10 }}>姓名</th>
              {days.map(d => (
                <th key={d.day} style={{ border: '1px solid #ddd', padding: '5px', backgroundColor: d.isOffDay ? '#fff2cc' : 'white', minWidth: '35px' }}>
                  {d.day}<br/><small>{d.weekDay}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 5 }}>
                  {emp}
                </td>
                {days.map(d => (
                  <td key={d.day} style={{ border: '1px solid #ddd', padding: '2px', textAlign: 'center', backgroundColor: d.isOffDay ? '#fffdf5' : 'white' }}>
                    <input maxLength="1" style={{ width: '25px', textAlign: 'center', border: 'none', background: 'transparent' }} placeholder="-" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;
