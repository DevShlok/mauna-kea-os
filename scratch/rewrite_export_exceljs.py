import re

filepath = r"c:\Users\LENOVO\OneDrive\Desktop\Mauna Kea OS\mauna-kea-os\src\app\dashboard\candidates\CandidatesClient.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to extract the existing exportToExcel block and replace it.
# The block starts at `const exportToExcel = () => {` and ends before `return (`

start_pattern = "  const exportToExcel = () => {"
end_pattern = "  return ("

start_idx = content.find(start_pattern)
end_idx = content.find(end_pattern, start_idx)

if start_idx != -1 and end_idx != -1:
    new_export_logic = """  const exportToExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const { saveAs } = await import('file-saver');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Candidates');

    // Define columns with widths for even spacing
    worksheet.columns = [
      { header: 'Candidate ID', key: 'id', width: 20 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Mobile', key: 'mobile', width: 20 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Current Company', key: 'company', width: 25 },
      { header: 'Current Designation', key: 'designation', width: 25 },
      { header: 'Total Experience (Years)', key: 'exp', width: 25 },
      { header: 'Tenure in Current Org (Years)', key: 'tenure', width: 28 },
      { header: 'CTC (Lakhs)', key: 'ctc', width: 15 },
      { header: 'Fixed CTC (Lakhs)', key: 'fixedCtc', width: 20 },
      { header: 'Variable CTC (Lakhs)', key: 'variableCtc', width: 22 },
      { header: 'Expected CTC (Lakhs)', key: 'expected', width: 22 },
      { header: 'Notice Period (Days)', key: 'notice', width: 22 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Qualifications', key: 'qual', width: 40 },
      { header: 'Prior Employers / Exp Tags', key: 'expTags', width: 30 },
      { header: 'Dream Roles', key: 'dreamRoles', width: 25 },
      { header: 'Dream Companies', key: 'dreamCos', width: 25 },
      { header: 'LinkedIn Profile URL', key: 'linkedin', width: 25 },
      { header: 'Target Company', key: 'targetCompany', width: 25 },
      { header: 'Notes', key: 'notes', width: 40 },
      { header: 'Resume/CV (Drive Link)', key: 'cvLink', width: 25 },
      { header: 'LinkedIn PDF (Drive Link)', key: 'linkedinPdf', width: 28 }
    ];

    // Style header row: bold and centrally aligned
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    filtered.forEach(c => {
      const qualsStr = c.qual && Array.isArray(c.qual) 
        ? c.qual.map((q: any) => typeof q === 'string' ? q : `${q.degree || ''} ${q.institute ? `from ${q.institute}` : ''} ${q.year ? `(${q.year})` : ''}`).join('; ')
        : '';

      const row = worksheet.addRow({
        id: c.id,
        name: c.name,
        email: c.email || '',
        mobile: c.mobile || '',
        location: c.location || '',
        company: c.company || '',
        designation: c.designation || '',
        exp: c.exp ?? '',
        tenure: c.tenure ?? '',
        ctc: c.ctc ?? '',
        fixedCtc: c.fixedCtc ?? '',
        variableCtc: c.variableCtc ?? '',
        expected: c.expected ?? '',
        notice: c.notice ?? '',
        status: c.status || '',
        qual: qualsStr,
        expTags: (c.expTags || []).join(', '),
        dreamRoles: (c.dreamRoles || []).join(', '),
        dreamCos: (c.dreamCos || []).join(', '),
        linkedin: c.linkedin || '',
        targetCompany: c.targetCompany || '',
        notes: c.notes || '',
        cvLink: c.cvFileName || '',
        linkedinPdf: c.linkedinPdf || ''
      });

      // Align all cells centrally
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Format Hyperlinks
      if (c.linkedin && c.linkedin.startsWith('http')) {
        row.getCell('linkedin').value = { text: c.name || 'LinkedIn', hyperlink: c.linkedin };
      }
      
      const cvCell = row.getCell('cvLink');
      if (c.cvFileName && c.cvFileName.startsWith('http')) {
        cvCell.value = { text: c.name || 'Resume', hyperlink: c.cvFileName };
      } else if (c.cvFileName) {
        cvCell.value = 'Yes';
      }

      const pdfCell = row.getCell('linkedinPdf');
      if (c.linkedinPdf && c.linkedinPdf.startsWith('http')) {
        pdfCell.value = { text: c.name || 'LinkedIn PDF', hyperlink: c.linkedinPdf };
      } else if (c.linkedinPdf) {
        pdfCell.value = 'Yes';
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "Candidates_Export.xlsx");
  };

"""
    
    new_content = content[:start_idx] + new_export_logic + content[end_idx:]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Done")
else:
    print("Could not find patterns")
