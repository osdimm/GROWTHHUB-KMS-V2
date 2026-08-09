export function isSpreadsheetFile(fileType?: string, fileUrl?: string): boolean {
  const typeUpper = (fileType || '').toUpperCase();
  if (typeUpper === 'XLSX' || typeUpper === 'XLS' || typeUpper === 'CSV' || typeUpper === 'SPREADSHEET') {
    return true;
  }
  if (fileUrl) {
    const urlLower = fileUrl.toLowerCase();
    if (
      urlLower.endsWith('.xlsx') ||
      urlLower.endsWith('.xls') ||
      urlLower.endsWith('.csv') ||
      urlLower.includes('.xlsx?') ||
      urlLower.includes('.xls?') ||
      urlLower.includes('.csv?') ||
      urlLower.startsWith('data:application/vnd') ||
      urlLower.startsWith('data:text/csv')
    ) {
      return true;
    }
  }
  return false;
}

export function isPdfFile(fileType?: string, fileUrl?: string): boolean {
  const typeUpper = (fileType || '').toUpperCase();
  if (typeUpper === 'PDF') {
    return true;
  }
  if (fileUrl) {
    const urlLower = fileUrl.toLowerCase();
    if (
      urlLower.endsWith('.pdf') ||
      urlLower.includes('.pdf?') ||
      urlLower.startsWith('data:application/pdf')
    ) {
      return true;
    }
  }
  return false;
}

export function isImageFile(fileType?: string, fileUrl?: string): boolean {
  const typeUpper = (fileType || '').toUpperCase();
  if (typeUpper === 'IMAGE' || typeUpper === 'GAMBAR' || typeUpper === 'PNG' || typeUpper === 'JPG') {
    return true;
  }
  if (fileUrl) {
    const urlLower = fileUrl.toLowerCase();
    if (
      urlLower.startsWith('data:image/') ||
      urlLower.endsWith('.png') ||
      urlLower.endsWith('.jpg') ||
      urlLower.endsWith('.jpeg') ||
      urlLower.endsWith('.webp') ||
      urlLower.endsWith('.gif') ||
      urlLower.endsWith('.svg') ||
      urlLower.includes('.png?') ||
      urlLower.includes('.jpg?') ||
      urlLower.includes('.jpeg?') ||
      urlLower.includes('.webp?')
    ) {
      return true;
    }
  }
  return false;
}
