document.addEventListener('DOMContentLoaded', () => {
  // ดึงอีเลเมนต์ที่เกี่ยวข้อง
  const studentInputs = document.getElementById('student-inputs');
  const seatingChart = document.getElementById('seating-chart');
  const generateSeatingButton = document.getElementById('generate-seating');
  const generateInputsButton = document.getElementById('generate-inputs');

  // ส่วนที่เพิ่มเข้ามา: ช่องกรอกแถวตอนลึกและแถวตอนหน้า
  const numRowsInput = document.getElementById('num-rows');
  const numColsInput = document.getElementById('num-cols');
  const numStudentsInput = document.getElementById('num-students');

  // เมื่อกดปุ่ม "สร้างฟอร์ม" -> สร้างช่องกรอกข้อมูลตามจำนวนที่กรอก
  generateInputsButton.addEventListener('click', () => {
      const numStudents = parseInt(numStudentsInput.value, 10) || 1;

      // เคลียร์ตารางเก่า (ถ้ามี)
      studentInputs.innerHTML = '';

      // สร้างแถวในตารางตามจำนวนที่กำหนด
      for (let i = 1; i <= numStudents; i++) {
          const row = document.createElement('tr');
          row.innerHTML = `
              <td>${i}</td>
              <td><input type="number" min="1" max="10" id="score-${i}" required></td>
              <td><input type="number" min="0" max="1" id="eyes-${i}" value="0" required></td>
              <td><input type="number" min="0" max="1" id="size-${i}" value="0" required></td>
              <td><input type="number" min="0" max="1" id="history-${i}" value="0" required></td>
          `;
          studentInputs.appendChild(row);
      }
  });

  // เมื่อกดปุ่ม "สุ่มที่นั่ง"
  generateSeatingButton.addEventListener('click', () => {
      const numRows = parseInt(numRowsInput.value, 10) || 1;
      const numCols = parseInt(numColsInput.value, 10) || 1;
      const numStudents = parseInt(numStudentsInput.value, 10) || 1;

      // เก็บข้อมูลนักเรียนจากตาราง
      const students = [];
      for (let i = 1; i <= numStudents; i++) {
          students.push({
              id: i,
              score: +document.getElementById(`score-${i}`).value,
              eyes: +document.getElementById(`eyes-${i}`).value,
              size: +document.getElementById(`size-${i}`).value,
              history: +document.getElementById(`history-${i}`).value
          });
      }

      // จัดที่นั่งตามเงื่อนไข
      const arrangedSeats = arrangeSeating(students, numRows, numCols);

      // เคลียร์ผังที่นั่งเก่า
      seatingChart.innerHTML = '';

      // กำหนดรูปแบบ Grid ใหม่ให้ตรงกับจำนวน columns (แถวตอนหน้า) ที่ผู้ใช้ระบุ
      seatingChart.style.gridTemplateColumns = `repeat(${numCols}, 1fr)`;

      // แสดงผลที่นั่งใหม่
      arrangedSeats.forEach((row) => {
          row.forEach((student) => {
              const seatDiv = document.createElement('div');
              seatDiv.classList.add('seat');
              if (student) {
                  seatDiv.textContent = `#${student.id}`;
                  if (student.eyes === 1) seatDiv.classList.add('front');
                  if (student.size === 1) seatDiv.classList.add('large');
                  if (student.history === 1) seatDiv.classList.add('bad-history');
              }
              seatingChart.appendChild(seatDiv);
          });
      });
  });

  // ฟังก์ชันจัดที่นั่ง
  function arrangeSeating(students, ROWS, COLUMNS) {
      // สร้างอาเรย์ 2 มิติ [ROWS x COLUMNS] ให้เป็น null ก่อน
      const rows = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(null));

      // แบ่งกลุ่มนักเรียนตามเงื่อนไข
      const badHistory = shuffleArray(students.filter(s => s.history === 1));
      // คนสายตาเสีย (eyes=1) ทั้งหมด
      const badEyes = shuffleArray(students.filter(s => s.eyes === 1));
      // คนตัวใหญ่ (size=1) แต่สายตาปกติ (eyes=0)
      const largeStudents = shuffleArray(students.filter(s => s.size === 1 && s.eyes === 0));
      // ที่เหลือ (eyes=0, size=0, history=0)
      const others = shuffleArray(students.filter(s => s.eyes === 0 && s.size === 0 && s.history === 0));

      // วางนักเรียนประวัติไม่ดีให้ห่างกัน 1 ช่อง (x±1, y±1)
      badHistory.forEach(student => {
          let placed = false;
          while (!placed) {
              const rowIndex = Math.floor(Math.random() * ROWS);
              const colIndex = Math.floor(Math.random() * COLUMNS);

              if (canPlaceBadHistory(rows, rowIndex, colIndex, ROWS, COLUMNS)) {
                  rows[rowIndex][colIndex] = student;
                  placed = true;
              }
              // หมายเหตุ: ควรเพิ่มเงื่อนไขกัน infinite loop ถ้าวางไม่ลง
          }
      });

      // วางนักเรียนสายตาเสีย (eyes=1) ไว้ใน 2 คอลัมน์ซ้าย (0,1) ถ้า COLUMNS >= 2
      badEyes.forEach(student => {
          let placed = false;
          while (!placed) {
              const rowIndex = Math.floor(Math.random() * ROWS);
              // ถ้า columns < 2 อาจต้อง fallback แต่ในที่นี้จะสมมติว่ามีอย่างน้อย 2
              const colIndex = Math.random() < 0.5 ? 0 : 1;

              if (colIndex < COLUMNS && !rows[rowIndex][colIndex]) {
                  rows[rowIndex][colIndex] = student;
                  placed = true;
              }
              // อาจตรวจสอบเพิ่มว่า ถ้า colIndex >= COLUMNS แล้วสุ่มซ้ำ
          }
      });

      // วางนักเรียนตัวใหญ่ (size=1, eyes=0) ใน 2 คอลัมน์ขวา (COLUMNS-2, COLUMNS-1) ถ้า COLUMNS >= 2
      largeStudents.forEach(student => {
          let placed = false;
          while (!placed) {
              const rowIndex = Math.floor(Math.random() * ROWS);
              // สุ่มเป็น COLUMNS-2 หรือ COLUMNS-1
              const possibleCols = [COLUMNS - 2, COLUMNS - 1].filter(c => c >= 0);
              const colIndex = possibleCols[Math.floor(Math.random() * possibleCols.length)];

              if (colIndex !== undefined && !rows[rowIndex][colIndex]) {
                  rows[rowIndex][colIndex] = student;
                  placed = true;
              }
          }
      });

      // วางนักเรียนที่เหลือในที่ว่าง
      others.forEach(student => {
          for (let r = 0; r < ROWS; r++) {
              for (let c = 0; c < COLUMNS; c++) {
                  if (!rows[r][c]) {
                      rows[r][c] = student;
                      return; // วางสำเร็จแล้วหยุด
                  }
              }
          }
      });

      return rows;
  }

  // ฟังก์ชันเช็คว่าวางคน history=1 ได้ไหม (ต้องห่างคน history=1 อื่น ๆ 1 ช่อง)
  function canPlaceBadHistory(rows, rowIndex, colIndex, ROWS, COLUMNS) {
      for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
              const checkRow = rowIndex + i;
              const checkCol = colIndex + j;
              if (
                  checkRow >= 0 && checkRow < ROWS &&
                  checkCol >= 0 && checkCol < COLUMNS
              ) {
                  const occupant = rows[checkRow][checkCol];
                  if (occupant && occupant.history === 1) {
                      return false;
                  }
              }
          }
      }
      return true;
  }

  // ฟังก์ชันสุ่มข้อมูลในอาเรย์
  function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
  }
});
