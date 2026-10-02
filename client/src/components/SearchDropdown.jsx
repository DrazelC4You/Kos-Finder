import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const MENU_GAP = 8;

export default function SearchDropdown({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  options = [],
  placeholder = 'Pilih...',
  menuWidth = 'w-full sm:w-[220px]',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [placement, setPlacement] = useState('down');
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click (mouse or touch)
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Buka ke atas bila ruang di bawah menu tidak cukup agar menu tetap utuh di viewport.
  // Diukur dari container (offset parent menu) dan sebelum paint agar tidak berkedip.
  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current || !menuRef.current) return;

    const anchor = containerRef.current.getBoundingClientRect();
    const needed = menuRef.current.offsetHeight + MENU_GAP;
    const spaceBelow = window.innerHeight - anchor.bottom;
    const spaceAbove = anchor.top;

    setPlacement(spaceBelow < needed && spaceAbove > spaceBelow ? 'up' : 'down');
  }, [isOpen]);

  // Jaga opsi yang di-highlight tetap terlihat saat menu discroll (navigasi keyboard)
  useEffect(() => {
    if (!isOpen || highlightedIndex < 0 || !menuRef.current) return;

    const items = menuRef.current.querySelectorAll('[role="option"]');
    items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, highlightedIndex]);

  // Handle item selection
  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        const currIdx = options.findIndex((opt) => opt.value === value);
        setHighlightedIndex(currIdx >= 0 ? currIdx : 0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        handleSelect(options[highlightedIndex].value);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        if (e.target === containerRef.current) {
          triggerRef.current?.click();
        }
      }}
      className={`relative px-4 py-2 sm:border-r border-slate-200 transition-colors ${
        isOpen ? 'z-30' : 'z-10'
      } ${className}`}
    >
      <button
        ref={triggerRef}
        type="button"
        id={id}
        onClick={() => {
          setIsOpen((prev) => {
            const next = !prev;
            if (next) {
              const currIdx = options.findIndex((opt) => opt.value === value);
              setHighlightedIndex(currIdx >= 0 ? currIdx : 0);
            }
            return next;
          });
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${id}-label`}
        aria-controls={`${id}-menu`}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-lg group cursor-pointer block select-none"
      >
        <span
          id={`${id}-label`}
          className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 group-hover:text-slate-500 transition-colors"
        >
          {label}
        </span>
        <div className="flex items-center justify-between gap-1.5 min-h-[20px]">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {Icon && <Icon className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
            <span className="text-sm font-medium text-slate-800 truncate block">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200 ease-out ${
              isOpen ? 'rotate-180 text-emerald-600' : 'group-hover:text-slate-600'
            }`}
          />
        </div>
      </button>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div
          id={`${id}-menu`}
          ref={menuRef}
          role="listbox"
          aria-labelledby={`${id}-label`}
          className={`absolute left-0 ${menuWidth} max-h-[240px] overflow-y-auto overscroll-contain bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/70 p-1.5 z-50 ${
            placement === 'up'
              ? 'bottom-[calc(100%+8px)] animate-dropdown-up'
              : 'top-[calc(100%+8px)] animate-dropdown'
          }`}
        >
          <ul className="space-y-0.5 focus:outline-none" tabIndex={-1}>
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <li key={opt.value || '__all'} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-colors duration-150 text-left cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : isHighlighted
                        ? 'bg-slate-50 text-slate-900 font-medium'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-2" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
