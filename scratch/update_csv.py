import re

filepath = r"c:\Users\LENOVO\OneDrive\Desktop\Mauna Kea OS\mauna-kea-os\src\app\dashboard\candidates\CandidatesClient.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_func = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error("No worksheet found");

      const rows: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        const rowData: any[] = [];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          rowData[colNumber - 1] = cell.value?.toString() || "";
        });
        rows.push(rowData);
      });

      if (rows.length < 2) {"""

new_func = """  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      let rows: any[] = [];

      if (fileExt === 'csv') {
        const text = await file.text();
        let row: string[] = [];
        let inQuotes = false;
        let val = '';
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === '"') {
            if (inQuotes && text[i+1] === '"') {
              val += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            row.push(val);
            val = '';
          } else if ((char === '\\n' || char === '\\r') && !inQuotes) {
            if (char === '\\r' && text[i+1] === '\\n') i++;
            row.push(val);
            if (row.some(c => c.trim() !== '')) {
              rows.push(row);
            }
            row = [];
            val = '';
          } else {
            val += char;
          }
        }
        if (val || row.length > 0) {
          row.push(val);
          if (row.some(c => c.trim() !== '')) {
            rows.push(row);
          }
        }
      } else {
        const ExcelJS = (await import('exceljs')).default;
        const workbook = new ExcelJS.Workbook();
        const arrayBuffer = await file.arrayBuffer();
        await workbook.xlsx.load(arrayBuffer);
        
        const worksheet = workbook.worksheets[0];
        if (!worksheet) throw new Error("No worksheet found");

        worksheet.eachRow((row, rowNumber) => {
          const rowData: any[] = [];
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            rowData[colNumber - 1] = cell.value?.toString() || "";
          });
          rows.push(rowData);
        });
      }

      if (rows.length < 2) {"""

content = content.replace(old_func, new_func)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
