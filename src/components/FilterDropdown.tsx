import { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Button } from '@hnc-partners/ui-components';

// ===== FILTER DROPDOWN COMPONENT =====

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDropdownProps {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

/**
 * FilterDropdown Component
 *
 * A custom single-select filter dropdown with:
 * - Pill-style trigger showing label + selected value
 * - Teal highlight when a filter is active
 * - Gray/muted when no filter (empty value)
 * - Clear button (X) to reset
 * - Popover list with options
 *
 * Usage:
 *   <FilterDropdown
 *     label="Type"
 *     value={filterType}
 *     options={[
 *       { value: '', label: 'All Types' },
 *       { value: 'person', label: 'Person' },
 *       { value: 'organization', label: 'Organization' },
 *     ]}
 *     onChange={(v) => setFilterType(v)}
 *   />
 *
 * Note: The option with value='' is treated as "no filter" and won't
 * appear in the dropdown list. It's the reset/clear state.
 */
export function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const hasValue = value !== '';

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm transition-colors ${
          hasValue
            ? 'bg-brand/5 dark:bg-brand/20 text-foreground'
            : 'bg-muted text-muted-foreground hover:text-foreground'
        }`}
      >
        <span className="text-muted-foreground">{label}</span>
        {hasValue && (
          <span className="font-medium text-brand">
            {selectedOption?.label}
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        {hasValue && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); setOpen(false); }}
            className="ml-0.5 p-0.5 rounded hover:bg-muted-foreground/20 text-muted-foreground"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 min-w-[160px] rounded-xl bg-popover shadow-lg ring-1 ring-black/5 dark:ring-white/10 p-1.5">
          {options.filter((o) => o.value !== '').map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              onClick={() => { onChange(option.value); setOpen(false); }}
              className={`w-full text-left justify-start px-3 py-2 rounded-lg text-sm transition-colors ${
                value === option.value
                  ? 'text-brand bg-brand/5 dark:bg-brand/20 font-medium'
                  : 'text-foreground hover:bg-brand/5 dark:hover:bg-brand/20 hover:text-brand'
              }`}
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
