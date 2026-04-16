function sanitizeCsvFormula(text: string) {
  const trimmed = text.trimStart();
  if (!trimmed) return text;

  // Tránh CSV formula injection khi mở file bằng Excel/Sheets.
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${text}`;
  }

  return text;
}

export function escapeCsvCell(value: unknown) {
  if (value === null || value === undefined) return "";

  // Escape dấu " theo chuẩn CSV.
  const safeText = sanitizeCsvFormula(String(value)).replace(/"/g, '""');
  return /[",\n]/.test(safeText) ? `"${safeText}"` : safeText;
}

function needsQuote(text: string, delimiter: string) {
  const escapedDelimiter = delimiter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = new RegExp(`[\\"\\n\\r${escapedDelimiter}]`);
  return matcher.test(text);
}

export function toCsv(rows: Array<Array<unknown>>, delimiter = ",") {
  // Chuyển ma trận dữ liệu thành chuỗi CSV theo delimiter cấu hình.
  return rows
    .map((row) =>
      row
        .map((value) => {
          const cell = sanitizeCsvFormula(String(value ?? "")).replace(/"/g, '""');
          return needsQuote(cell, delimiter) ? `"${cell}"` : cell;
        })
        .join(delimiter),
    )
    .join("\r\n");
}
