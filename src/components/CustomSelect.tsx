import React, { useState, useRef, useEffect, useId } from 'react';

export interface CustomSelectOption {
  label: string;
  value: string;
}

export interface CustomSelectProps {
  options: (string | CustomSelectOption)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string | boolean;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Pilih opsi...',
  label,
  required,
  error,
  className = '',
  disabled = false,
  id: customId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = customId || generatedId;

  // Normalize options to { label, value } objects
  const normalizedOptions: CustomSelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(
          selectedOption ? normalizedOptions.findIndex((o) => o.value === selectedOption.value) : 0
        );
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < normalizedOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : normalizedOptions.length - 1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
          onChange(normalizedOptions[highlightedIndex].value);
          setIsOpen(false);
        }
        break;
      case 'Escape':
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const handleSelectOption = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full h-[40px] px-3.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium flex items-center justify-between transition-all outline-none cursor-pointer ${
          error
            ? 'border-rose-400 ring-2 ring-rose-400/20'
            : isOpen
            ? 'border-[#006194] dark:border-cyan-400 ring-2 ring-[#006194]/20 dark:ring-cyan-500/20 bg-white dark:bg-slate-800/90'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`truncate ${
            selectedOption
              ? 'text-slate-800 dark:text-slate-100 font-semibold'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span
          className={`material-symbols-outlined text-slate-400 dark:text-slate-400 text-lg transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#006194] dark:text-cyan-400' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1 custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
          {normalizedOptions.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 text-center">
              Tidak ada opsi tersedia
            </div>
          ) : (
            normalizedOptions.map((opt, idx) => {
              const isSelected = selectedOption?.value === opt.value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={`opt-${opt.value}-${idx}`}
                  onClick={() => handleSelectOption(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`px-3.5 py-2.5 text-xs font-medium cursor-pointer flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-cyan-950/60 text-[#006194] dark:text-cyan-300 font-bold'
                      : isHighlighted
                      ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-sm text-[#006194] dark:text-cyan-400 font-bold shrink-0">
                      check
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
