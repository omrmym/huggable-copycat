import ExcelJS from 'exceljs';

/**
 * Read an Excel file from an ArrayBuffer and return rows as JSON objects.
 */
export async function readExcelFile(buffer: ArrayBuffer): Promise<Record<string, any>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount < 2) return [];

  const headers: string[] = [];
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? '').trim();
  });

  const rows: Record<string, any>[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, any> = {};
    row.eachCell((cell, colNumber) => {
      const key = headers[colNumber];
      if (key) obj[key] = cell.value;
    });
    if (Object.keys(obj).length > 0) rows.push(obj);
  });

  return rows;
}

/**
 * Write data to an Excel file and trigger download.
 */
export async function writeExcelFile(
  data: Record<string, any>[],
  fileName: string,
  sheetName = 'Sheet1',
  columnWidths?: number[]
) {
  if (data.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Set columns from keys of first row
  const keys = Object.keys(data[0]);
  worksheet.columns = keys.map((key, i) => ({
    header: key,
    key,
    width: columnWidths?.[i] ?? Math.max(key.length + 2, 12),
  }));

  // Add rows
  data.forEach(row => worksheet.addRow(row));

  // Style header row
  worksheet.getRow(1).font = { bold: true };

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer, fileName);
}

/**
 * Write data as CSV and trigger download.
 */
export async function writeCsvFile(
  data: Record<string, any>[],
  fileName: string,
  sheetName = 'Sheet1'
) {
  if (data.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  const keys = Object.keys(data[0]);
  worksheet.columns = keys.map(key => ({ header: key, key }));
  data.forEach(row => worksheet.addRow(row));

  const buffer = await workbook.csv.writeBuffer();
  downloadBuffer(buffer, fileName, 'text/csv');
}

function downloadBuffer(
  buffer: ExcelJS.Buffer,
  fileName: string,
  mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
) {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
