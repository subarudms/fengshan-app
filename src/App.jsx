
import React, { useState, useEffect } from 'react';

const App = () => {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [days, setDays] = useState([]);

  // 2026 台灣國定假日預設 (勞動節 5/1)
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
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
        鳳山所 {year}年{month}月 班表生成器
      </h2>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <div>
          <label>年份：</label>
          <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </div>
        <div>
          <label>月份：</label>
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}>
            {[...Array(12).keys()].map(m => <option key={m+1} value={m+1}>{m+1}月</option>)}
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', backgroundColor: '#eee' }}>員工姓名</th>
              {days.map(d => (
                <th key={d.day} style={{ 
                  border: '1px solid #ddd', 
                  padding: '8px', 
                  textAlign: 'center',
                  backgroundColor: d.isOffDay ? '#fff2cc' : 'white',
                  color: d.isOffDay ? '#e67e22' : 'black'
                }}>
                  {d.day}<br/><span style={{ fontSize: '0.8em' }}>{d.weekDay}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 預設一行範例，您可以之後自行增加更多行 */}
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>陳胤合</td>
              {days.map(d => (
                <td key={d.day} style={{ 
                  border: '1px solid #ddd', 
                  padding: '5px', 
                  textAlign: 'center', 
                  backgroundColor: d.isOffDay ? '#fffdf5' : 'white' 
                }}>
                  <input maxLength="1" style={{ 
                    width: '30px', 
                    textAlign: 'center', 
                    border: '1px solid #eee', 
                    borderRadius: '4px',
                    fontSize: '1.1em',
                    fontWeight: 'bold'
                  }} placeholder="-" />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fdf6e3', borderRadius: '5px', fontSize: '0.9em' }}>
        <strong>填寫說明：</strong> A:早班 | C:晚班 | O:全天 | 休:休息 <br/>
        <span style={{ color: '#e67e22' }}>※ 橘色背景自動標記為週末或國定假日。</span>
      </div>
    </div>
  );
};

export default App;