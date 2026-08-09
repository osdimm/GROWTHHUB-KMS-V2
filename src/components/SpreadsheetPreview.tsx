import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

interface SpreadsheetPreviewProps {
  fileUrl: string;
  maxRows?: number;
}

export const SpreadsheetPreview: React.FC<SpreadsheetPreviewProps> = ({ fileUrl, maxRows = 200 }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [sheets, setSheets] = useState<Record<string, (string | number | boolean | null)[][]>>({});

  useEffect(() => {
    let isMounted = true;

    const loadSpreadsheet = async () => {
      if (!fileUrl) {
        setError('Tautan berkas spreadsheet tidak ditemukan.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Gagal mengunduh berkas spreadsheet (HTTP status: ${response.status})`);
        }

        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });

        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Berkas spreadsheet tidak memiliki lembar kerja (sheet).');
        }

        const parsedSheets: Record<string, (string | number | boolean | null)[][]> = {};
        workbook.SheetNames.forEach((name) => {
          const worksheet = workbook.Sheets[name];
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as (string | number | boolean | null)[][];
          // Filter out completely empty trailing rows
          parsedSheets[name] = rawRows.filter((row) => row && row.some((cell) => cell !== '' && cell !== null && cell !== undefined));
        });

        if (isMounted) {
          setSheetNames(workbook.SheetNames);
          setActiveSheet(workbook.SheetNames[0]);
          setSheets(parsedSheets);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('SpreadsheetPreview error:', err);
          setError(err?.message || 'Gagal memproses pratinjau spreadsheet.');
          setIsLoading(false);
        }
      }
    };

    loadSpreadsheet();

    return () => {
      isMounted = false;
    };
  }, [fileUrl]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[220px] bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Memuat & Memproses Spreadsheet...</p>
        <p className="text-[11px] text-slate-400 mt-1">Membaca data lembar kerja (.xlsx, .xls, .csv)</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-3 text-xs">
        <span className="material-symbols-outlined text-rose-500 text-xl shrink-0 mt-0.5">warning</span>
        <div>
          <p className="font-bold text-rose-900 dark:text-rose-100">Gagal Menampilkan Pratinjau Spreadsheet</p>
          <p className="mt-1 text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      </div>
    );
  }

  const currentRows = sheets[activeSheet] || [];
  const totalRows = currentRows.length;

  if (totalRows === 0) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        <span className="material-symbols-outlined text-2xl text-slate-400 mb-1 block">table_rows</span>
        Lembar kerja <strong>"{activeSheet}"</strong> tidak memiliki data.
      </div>
    );
  }

  const headerRow = currentRows[0] || [];
  const dataRows = currentRows.slice(1, maxRows + 1);
  const isTruncated = totalRows - 1 > maxRows;

  return (
    <div className="space-y-2.5">
      {/* Sheet Tabs */}
      {sheetNames.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 custom-scrollbar">
          {sheetNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setActiveSheet(name)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
                activeSheet === name
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">description</span>
              <span>{name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto overflow-y-auto max-h-[300px] border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 shadow-xs custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10 shadow-2xs">
              <th className="px-2.5 py-2 w-10 text-center border-r border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase select-none">
                #
              </th>
              {headerRow.map((cell, idx) => (
                <th
                  key={idx}
                  className="px-3 py-2 border-r border-slate-200 dark:border-slate-800 font-semibold whitespace-nowrap min-w-[100px]"
                >
                  {cell !== '' && cell !== null && cell !== undefined ? String(cell) : `Kolom ${idx + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
            {dataRows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors"
              >
                <td className="px-2.5 py-1.5 text-center border-r border-slate-100 dark:border-slate-900 font-mono text-[10px] text-slate-400 select-none bg-slate-50/50 dark:bg-slate-900/30">
                  {rIdx + 1}
                </td>
                {headerRow.map((_, cIdx) => {
                  const cellVal = row[cIdx];
                  const displayVal = cellVal !== '' && cellVal !== null && cellVal !== undefined ? String(cellVal) : '';
                  return (
                    <td
                      key={cIdx}
                      className="px-3 py-1.5 border-r border-slate-100 dark:border-slate-900 text-slate-800 dark:text-slate-200 whitespace-nowrap"
                    >
                      {displayVal}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Row Count / Truncation Banner */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span>
          Menampilkan <strong>{dataRows.length}</strong> dari <strong>{totalRows - 1}</strong> baris data.
        </span>
        {isTruncated && (
          <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">info</span>
            Dibatasi 200 baris pertama untuk performa.
          </span>
        )}
      </div>
    </div>
  );
};
