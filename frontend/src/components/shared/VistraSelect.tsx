'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import Icon from '@/components/ui/Icon';

export interface VistraSelectOption<T extends string | number = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface VistraSelectProps<T extends string | number = string> {
  id?: string;
  label?: string;
  value: T;
  onChange: (value: T) => void;
  options: VistraSelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  error?: string;
  'aria-label'?: string;
}

export default function VistraSelect<T extends string | number = string>({
  id: propId,
  label,
  value,
  onChange,
  options,
  placeholder = 'Chọn một mục...',
  disabled = false,
  className = '',
  triggerClassName = '',
  error,
  'aria-label': ariaLabel,
}: VistraSelectProps<T>) {
  const generatedId = useId();
  const selectId = propId || generatedId;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const openMenu = () => {
    const idx = options.findIndex((opt) => opt.value === value);
    setHighlightedIndex(idx >= 0 ? idx : 0);
    setIsOpen(true);
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      openMenu();
    } else {
      setIsOpen(false);
    }
  };

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev + 1;
          while (next < options.length && options[next].disabled) {
            next++;
          }
          return next < options.length ? next : prev;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && options[next].disabled) {
            next--;
          }
          return next >= 0 ? next : prev;
        });
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < options.length &&
          !options[highlightedIndex].disabled
        ) {
          handleSelect(options[highlightedIndex].value);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={`relative flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={`${selectId}-trigger`}
          className="block text-xs font-label-caps uppercase font-bold text-[#0E1D4F] tracking-wide"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <button
          ref={triggerRef}
          id={`${selectId}-trigger`}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={ariaLabel || label}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-medium text-left transition-all ${triggerClassName} ${
            disabled
              ? 'bg-[#EBF1F0]/50 border-[#0E1D4F]/5 text-[#4B5875]/60 cursor-not-allowed'
              : isOpen
              ? 'bg-[#EBF1F0] border-[#205BD6] ring-1 ring-[#205BD6]/20 text-[#0E1D4F] shadow-2xs'
              : 'bg-[#EBF1F0] hover:bg-[#E4ECEB] border-[#0E1D4F]/10 text-[#0E1D4F] cursor-pointer'
          } ${error ? 'border-red-400' : ''} focus-visible:outline-2 focus-visible:outline-[#205BD6]`}
        >
          <span className={`truncate flex-1 ${selectedOption ? 'text-[#0E1D4F] font-semibold' : 'text-[#4B5875]/70'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <Icon
            name="expand_more"
            className={`size-4 text-[#4B5875] shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#205BD6]' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div
            ref={menuRef}
            role="listbox"
            id={`${selectId}-menu`}
            tabIndex={-1}
            aria-label={ariaLabel || label || 'Danh sách lựa chọn'}
            className="absolute left-0 top-full mt-1.5 w-full min-w-[200px] max-h-60 overflow-y-auto bg-white/95 backdrop-blur-md rounded-xl border border-[#0E1D4F]/15 shadow-lg p-1 z-50 animate-in fade-in-0 zoom-in-95 duration-100"
          >
            {options.map((option, idx) => {
              const isSelected = option.value === value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={String(option.value)}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled}
                  onClick={() => {
                    if (!option.disabled) {
                      handleSelect(option.value);
                    }
                  }}
                  onMouseEnter={() => {
                    if (!option.disabled) setHighlightedIndex(idx);
                  }}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-colors select-none ${
                    option.disabled
                      ? 'opacity-40 cursor-not-allowed text-[#4B5875]'
                      : isSelected
                      ? 'bg-[#205BD6]/10 text-[#205BD6] font-bold cursor-pointer'
                      : isHighlighted
                      ? 'bg-[#EBF1F0] text-[#0E1D4F] cursor-pointer'
                      : 'text-[#0E1D4F] hover:bg-[#EBF1F0] cursor-pointer'
                  }`}
                >
                  <span className="truncate flex-1">{option.label}</span>
                  {isSelected && (
                    <Icon name="check" className="size-4 text-[#205BD6] shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && <span className="text-[11px] text-red-500 font-medium">{error}</span>}
    </div>
  );
}
