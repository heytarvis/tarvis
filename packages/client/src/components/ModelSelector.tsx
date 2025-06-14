import { useState, useEffect, useRef } from 'preact/hooks';
import { ModelInfo } from '../../../shared/src';
import { createPortal } from 'preact/compat';

interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export default function ModelSelector({
  models,
  selectedModelId,
  onModelChange,
  disabled,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(
    null
  );
  const inputRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel = models.find(model => model.id === selectedModelId);

  // If there's only one model, just display its name
  if (models.length === 1) {
    return (
      <div className="tarvis__model-selector">
        <div className="tarvis__model-selector__input tarvis__model-selector__input--disabled">
          <span>{models[0].name}</span>
        </div>
      </div>
    );
  }

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
      const dropdownHeight = 300; // max-height from SCSS

      const top =
        spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove
          ? rect.bottom + 4 // 4px margin from SCSS
          : rect.top - dropdownHeight - 4;

      setDropdownPosition({
        top,
        left: rect.left,
      });
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (modelId: string) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  return (
    <div className="tarvis__model-selector">
      <div
        ref={inputRef}
        className={`tarvis__model-selector__input ${disabled ? 'tarvis__model-selector__input--disabled' : ''}`}
        onClick={handleInputClick}
      >
        <span>{selectedModel?.name || 'Select Model'}</span>
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
            className={`tarvis__model-selector__dropdown ${isOpen ? 'tarvis__model-selector__dropdown--visible' : ''}`}
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
            {models.map(model => (
              <div
                key={model.id}
                className={`tarvis__model-selector__option ${model.id === selectedModelId ? 'tarvis__model-selector__option--selected' : ''}`}
                onClick={() => handleOptionClick(model.id)}
              >
                <span className="tarvis__model-selector__option-name">{model.name}</span>
                {model.description && (
                  <span className="tarvis__model-selector__option-description">
                    {model.description}
                  </span>
                )}
                <span className="tarvis__model-selector__option-provider">{model.provider}</span>
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
