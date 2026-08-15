export function autoDetectFileType(fileName?: string): 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'LINK' {
  if (!fileName) return 'PDF';
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'PDF';
  if (['docx', 'doc'].includes(ext || '')) return 'DOCX';
  if (['xlsx', 'xls', 'csv'].includes(ext || '')) return 'XLSX';
  if (['pptx', 'ppt'].includes(ext || '')) return 'PPTX';
  return 'PDF';
}

export function formatBytes(bytes?: number | string | null): string {
  if (bytes === null || bytes === undefined || bytes === '') return '1.0 MB';
  if (typeof bytes === 'string') {
    if (bytes.includes('KB') || bytes.includes('MB') || bytes.includes('GB') || bytes.includes('B') || bytes.includes('Tautan')) {
      return bytes;
    }
    const num = Number(bytes);
    if (isNaN(num)) return bytes;
    bytes = num;
  }
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function parseBytes(sizeStr?: string | number | null): number | null {
  if (sizeStr === null || sizeStr === undefined || sizeStr === '') return null;
  if (typeof sizeStr === 'number') return Math.round(sizeStr);
  const str = String(sizeStr).trim();
  if (str.toLowerCase().includes('tautan') || str.toUpperCase() === 'LINK') return null;
  const upper = str.toUpperCase();
  if (upper.includes('MB')) {
    const num = parseFloat(upper.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? null : Math.round(num * 1024 * 1024);
  }
  if (upper.includes('KB')) {
    const num = parseFloat(upper.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? null : Math.round(num * 1024);
  }
  if (upper.includes('GB')) {
    const num = parseFloat(upper.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? null : Math.round(num * 1024 * 1024 * 1024);
  }
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : Math.round(num);
}

export function isLinkDocument(doc: { fileType?: string; contentType?: string; fileUrl?: string; linkUrl?: string }): boolean {
  if (doc.fileType === 'LINK' || doc.contentType === 'link') {
    return true;
  }
  if (doc.linkUrl && doc.linkUrl.trim().length > 0) {
    return true;
  }
  if (doc.fileUrl && (doc.fileUrl.startsWith('http://') || doc.fileUrl.startsWith('https://'))) {
    const isDocFile = Boolean(doc.fileUrl.match(/\.(pdf|docx?|xlsx?|pptx?|png|jpe?g|gif|webp)(\?.*)?$/i));
    if (!isDocFile) {
      return true;
    }
  }
  return false;
}

export function getEffectiveFileType(doc: { fileType?: string; contentType?: string; fileUrl?: string; linkUrl?: string; title?: string }): string {
  if (isLinkDocument(doc)) {
    return 'LINK';
  }
  if (doc.fileType && doc.fileType !== 'LINK') {
    return doc.fileType;
  }
  if (doc.fileUrl) {
    const url = doc.fileUrl.toLowerCase();
    if (url.includes('.xlsx') || url.includes('.xls') || url.includes('.csv')) return 'XLSX';
    if (url.includes('.pdf')) return 'PDF';
    if (url.includes('.docx') || url.includes('.doc')) return 'DOCX';
    if (url.includes('.pptx') || url.includes('.ppt')) return 'PPTX';
  }
  if (doc.title) {
    const titleLower = doc.title.toLowerCase();
    if (titleLower.endsWith('.xlsx') || titleLower.endsWith('.xls') || titleLower.endsWith('.csv')) return 'XLSX';
    if (titleLower.endsWith('.pdf')) return 'PDF';
    if (titleLower.endsWith('.docx') || titleLower.endsWith('.doc')) return 'DOCX';
    if (titleLower.endsWith('.pptx') || titleLower.endsWith('.ppt')) return 'PPTX';
  }
  return doc.fileType || 'PDF';
}

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
