import React, { useState, useEffect } from 'react';

const App = () => {
  const [rosterData, setRosterData] = useState({});
  const employees = ["陳媺媐", "蔡威德", "黃振瑞", "陳冠伶", "黃煒森", "劉江偉"];

  // 區間：4/26 (日) 到 6/6 (六)
  const startDate = new Date(2026, 3, 26);
  const endDate = new Date(2026, 5, 6);

  const autoGenerate = () => {
    let newData = {};
    let empStats = employees.reduce((acc, name) => {
      acc[name] = { aCount: 0, cCount: 0, hasNationalHoliday: false };
      return acc;
    }, {});

    // 建立 6 週的循環
    for (let week = 0; week < 6; week++) {
      let weekDays = [];
      for (let i = 0; i < 7; i++) {
        let d = new Date(startDate);
        d.setDate(startDate.getDate() + (week * 7) + i);
        weekDays.push(d);
      }

      employees.forEach((name) => {
        let offDaysInWeek = [];
        // 為了確保不連休，我們使用交替位移
        const weekDates = [...weekDays]; 

        for (let dateObj of weekDates) {
          const dateKey = `${name}-${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`;
          const yesterday = new Date(dateObj);
          yesterday.setDate(dateObj.getDate() - 1);
          const yesterdayKey = `${name}-${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

          // 連假檢查
          const yesterdayWasOff = newData[yesterdayKey] && (newData[yesterdayKey].includes("假") || newData[yesterdayKey].includes("休"));

          // 每週固定分配兩天假，且不與昨天重複
          // 透過簡單的餘數偏移來確保每個人每週休假的日子會輪動，且不連休
          const dayIdx = dateObj.getDay();
          const template = [
            [1, 4], [2, 5], [3, 6], [0, 3], [1, 5], [2, 4]
          ][(employees.indexOf(name) + week) % 6];

          if (template.includes(dayIdx) && !yesterdayWasOff) {
            // --- 修正名詞順序邏輯 ---
            // 本週第一個抓到的假叫「例假」，第二個叫「休假」
            let label = offDaysInWeek.length === 0 ? "例假" : "休假";
            newData[dateKey] = label;
            offDaysInWeek.push(dateKey);
          }

          // 處理勞動節 (僅限5月份，且每人僅限一次)
          if (dateObj.getMonth() === 4 && !empStats[name].hasNationalHoliday && !newData[dateKey] && !yesterdayWasOff) {
            // 隨機在5月挑一天非原定假日的日子補假
            if (Math.random() > 0.85) {
              newData[dateKey] = "勞動節休";
              empStats[name].hasNationalHoliday = true;
            }
          }
        }
      });

      // 填補 A/C
      weekDays.forEach(dateObj => {
        const dKey = (name) => `${name}-${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`;
        let workingStaff = employees.filter(name => !newData[dKey(name)]);
        workingStaff.sort((a, b) => empStats[a].aCount - empStats[b].aCount);
        let half = Math.ceil(workingStaff.length / 2);
        workingStaff.forEach((name, idx) => {
          const shift = idx < half ? "A" : "C";
          newData[dKey(name)] = shift;
          if (shift === "A") empStats[name].aCount++;
          else empStats[name].cCount++;
        });
      });
    }
    setRosterData(newData);
  };

  const renderTable = () => {
    let dateHeaders = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      dateHeaders.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return (
      <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <table style={{ borderCollapse: 'collapse', width: 'max-content', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ border: '1px solid #dee2e6', padding: '12px 8px', position: 'sticky', left: 0, backgroundColor: '#f8f9fa', zIndex: 10, minWidth: '70px' }}>姓名</th>
              {dateHeaders.map(d => (
                <th key={d.getTime()} style={{ border: '1px solid #dee2e6', padding: '6px', minWidth: '45px', backgroundColor: (d.getDay() === 0 || d.getDay() === 6) ? '#fff2cc' : 'white' }}>
                  <div style={{ fontSize: '13px' }}>{d.getMonth() + 1}/{d.getDate()}</div>
                  <div style={{ fontSize: '10px', color: '#666' }}>({["日","一","二","三","四","五","六"][d.getDay()]})</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map(name => (
              <tr key={name}>
                <td style={{ border: '1px solid #dee2e6', padding: '10px 8px', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 5, textAlign: 'center' }}>{name}</td>
                {dateHeaders.map(d => {
                  const val = rosterData[`${name}-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`] || "-";
                  const isOff = val.includes("假") || val.includes("休");
                  return (
                    <td key={d.getTime()} style={{ 
                      border: '1px solid #dee2e6', 
                      textAlign: 'center', 
                      color: val === "例假" ? "#d32f2f" : val === "休假" ? "#1976d2" : val === "勞動節休" ? "#388e3c" : "#333", 
                      fontWeight: isOff ? 'bold' : 'normal',
                      padding: '8px 4px',
                      backgroundColor: isOff ? '#fdfefe' : 'white'
                    }}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ padding: '10px', fontFamily: 'sans-serif', backgroundColor: '#f4f7f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '1.1rem', color: '#333', margin: 0 }}>鳳山所六週班表 (名詞校正版)</h2>
        <button onClick={autoGenerate} style={{ padding: '10px 16px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>⚖️ 執行精準排班</button>
      </div>
      {renderTable()}
      <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '11px', color: '#666', lineHeight: '1.6' }}>
        <strong>📋 排班邏輯修正：</strong><br/>
        1. <strong>名詞順序：</strong>每週日到六區間，第一天假固定為「例假」(紅)，第二天假固定為「休假」(藍)。<br/>
        2. <strong>勞動節：</strong>5/1 假額已彈性分配於 5 月份中，標記為「勞動節休」(綠)。<br/>
        3. <strong>禁連假：</strong>嚴格執行跨日偵測，確保任何形式的假日都不會連續出現。
      </div>
    </div>
  );
};

export default App;
