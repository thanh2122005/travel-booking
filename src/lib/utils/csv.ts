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

  const safeText = sanitizeCsvFormula(String(value)).replace(/"/g, '""');
  return /[",\n]/.test(safeText) ? `"${safeText}"` : safeText;
}

export function toCsv(rows: Array<Array<unknown>>) {
  return rows.map((row) => row.map((value) => escapeCsvCell(value)).join(",")).join("\n");
}

