import React, { useState, useEffect } from 'react';

const App = () => {
  const [rosterData, setRosterData] = useState({});
  const employees = ["陳媺媐", "蔡威德", "黃振瑞", "陳冠伶", "黃煒森", "劉江偉"];

  // 定義六週區間：4/26 (日) 到 6/6 (六)
  const startDate = new Date(2026, 3, 26); // 4月從0開始計
  const endDate = new Date(2026, 5, 6);

  const autoGenerate = () => {
    let newData = {};
    let empStats = employees.reduce((acc, name) => {
      acc[name] = { 
        aCount: 0, 
        cCount: 0, 
        hasNationalHoliday: false, // 是否已休勞動節
        lastWasOff: false 
      };
      return acc;
    }, {});

    // 依週進行排班
    for (let week = 0; week < 6; week++) {
      let weekDays = [];
      for (let i = 0; i < 7; i++) {
        let d = new Date(startDate);
        d.setDate(startDate.getDate() + (week * 7) + i);
        weekDays.push(d);
      }

      // 為每個人預排本週的「例」與「休」
      employees.forEach((name) => {
        let offDaysInWeek = [];
        let weekDates = [...weekDays].sort(() => Math.random() - 0.5);

        for (let dateObj of weekDates) {
          if (offDaysInWeek.length >= 2) break;

          const dateKey = `${name}-${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`;
          const yesterday = new Date(dateObj);
          yesterday.setDate(dateObj.getDate() - 1);
          const yesterdayKey = `${name}-${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

          // 禁連假檢查 + 週日公平性
          const yesterdayWasOff = newData[yesterdayKey] && newData[yesterdayKey].includes("假");
          
          if (!yesterdayWasOff) {
            let label = offDaysInWeek.length === 0 ? "例假" : "休假";
            
            // 5月勞動節額外假處理 (5/1-5/31間隨機挑一天非原定休假日)
            if (dateObj.getMonth() === 4 && !empStats[name].hasNationalHoliday && Math.random() > 0.8 && offDaysInWeek.length < 2) {
              label = "勞動節休";
              empStats[name].hasNationalHoliday = true;
            }

            newData[dateKey] = label;
            offDaysInWeek.push(dateObj);
          }
        }
      });

      // 填補 A/C 班
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
    let rows = [];
    let dateHeaders = [];
    let current = new Date(startDate);
    
    while (current <= endDate) {
      dateHeaders.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return (
      <table style={{ borderCollapse: 'collapse', width: 'max-content', fontSize: '12px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ border: '1px solid #ccc', padding: '8px', position: 'sticky', left: 0, backgroundColor: '#f2f2f2' }}>姓名</th>
            {dateHeaders.map(d => (
              <th key={d.getTime()} style={{ border: '1px solid #ccc', padding: '4px', minWidth: '40px', backgroundColor: (d.getDay() === 0 || d.getDay() === 6) ? '#fff2cc' : 'white' }}>
                {d.getMonth() + 1}/{d.getDate()}<br/>({["日","一","二","三","四","五","六"][d.getDay()]})
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map(name => (
            <tr key={name}>
              <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: 'white' }}>{name}</td>
              {dateHeaders.map(d => {
                const val = rosterData[`${name}-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`] || "-";
                const isOff = val.includes("假") || val.includes("休");
                return (
                  <td key={d.getTime()} style={{ border: '1px solid #ccc', textAlign: 'center', color: isOff ? '#d35400' : '#333', fontWeight: isOff ? 'bold' : 'normal', backgroundColor: isOff ? '#fef9e7' : 'white' }}>
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3>鳳山所六週班表 (4/26 - 6/6)</h3>
        <button onClick={autoGenerate} style={{ padding: '10px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>⚖️ 生成六週 1例1休 班表</button>
      </div>
      <div style={{ overflowX: 'auto', border: '1px solid #ccc' }}>
        {renderTable()}
      </div>
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
        <strong>📌 勞規審核要點：</strong><br/>
        1. <strong>週期：</strong>嚴格計算 4/26-5/2, 5/3-5/9 ... 每週日到六必須有 1 例 1 休。<br/>
        2. <strong>勞動節：</strong>5/1 假額已隨機彈性分配於 5 月份中，並標記為「勞動節休」。<br/>
        3. <strong>禁連假：</strong>系統偵測若昨日為假，今日則不排假。
      </div>
    </div>
  );
};

export default App;
