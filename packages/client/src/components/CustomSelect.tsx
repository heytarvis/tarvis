import { useState, useEffect, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  error = false,
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(
    null
  );
  const inputRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = Math.min(300, options.length * 50); // Estimate height based on options

      const top =
        spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove
          ? rect.bottom + 4
          : rect.top - dropdownHeight - 4;

      setDropdownPosition({
        top,
        left: rect.left,
      });
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen, options.length]);

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`tarvis__custom-select ${className}`}>
      <div
        ref={inputRef}
        className={`tarvis__custom-select__input ${disabled ? 'tarvis__custom-select__input--disabled' : ''} ${error ? 'tarvis__custom-select__input--error' : ''}`}
        onClick={handleInputClick}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen &&
        dropdownPosition &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`tarvis__custom-select__dropdown ${isOpen ? 'tarvis__custom-select__dropdown--visible' : ''}`}
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
            {options.map(option => (
              <div
                key={option.value}
                className={`tarvis__custom-select__option ${option.value === value ? 'tarvis__custom-select__option--selected' : ''}`}
                onClick={() => handleOptionClick(option.value)}
              >
                <span className="tarvis__custom-select__option-label">{option.label}</span>
                {option.description && (
                  <span className="tarvis__custom-select__option-description">
                    {option.description}
                  </span>
                )}
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
} 