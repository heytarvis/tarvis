import { useState, useEffect } from 'preact/hooks';
import { z } from 'zod';
import CustomSelect from './CustomSelect';

interface ToolConfirmationModalProps {
  isOpen: boolean;
  toolName: string;
  toolDescription: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, z.ZodSchema>;
    required?: string[];
  };
  suggestedParameters?: Record<string, any>;
  onConfirm: (parameters: Record<string, any>) => void;
  onCancel: () => void;
}

export default function ToolConfirmationModal({
  isOpen,
  toolName,
  toolDescription,
  inputSchema,
  suggestedParameters,
  onConfirm,
  onCancel,
}: ToolConfirmationModalProps) {
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens and pre-fill with suggested parameters
  useEffect(() => {
    if (isOpen) {
      setParameters(suggestedParameters || {});
      setErrors({});
    }
  }, [isOpen, suggestedParameters]);

  const handleParameterChange = (key: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [key]: value,
    }));

    // Clear error for this parameter
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateParameters = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check required fields
    const required = inputSchema.required || [];
    for (const field of required) {
      if (!(field in parameters) || parameters[field] === undefined || parameters[field] === '') {
        newErrors[field] = 'This field is required';
      }
    }

    // Validate each parameter with its Zod schema
    for (const [key, value] of Object.entries(parameters)) {
      const schema = inputSchema.properties[key];
      if (schema && value !== undefined && value !== '') {
        try {
          schema.parse(value);
        } catch (error) {
          if (error instanceof z.ZodError) {
            newErrors[key] = error.errors[0].message;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validateParameters()) {
      onConfirm(parameters);
    }
  };

  const renderParameterInput = (key: string, schema: z.ZodSchema) => {
    const isRequired = inputSchema.required?.includes(key) || false;
    const value = parameters[key] || '';
    const error = errors[key];

    // Determine input type based on schema
    let inputType = 'text';
    let inputProps: any = {};
    const zodSchemaDef = schema._def as z.ZodTypeDef | z.ZodEnumDef;
    const zodTypeName = (schema._def as { typeName: 'ZodString' | 'ZodNumber' | 'ZodBoolean' | 'ZodEnum' }).typeName;

    if (zodTypeName === 'ZodString') {
      inputType = 'text';
    } else if (zodTypeName === 'ZodNumber') {
      inputType = 'number';
    } else if (zodTypeName === 'ZodBoolean') {
      inputType = 'checkbox';
      inputProps.checked = value;
    } else if (zodTypeName === 'ZodEnum') {
      inputType = 'select';
      inputProps.options = (zodSchemaDef as z.ZodEnumDef).values;
    }

    console.log(inputType)

    return (
      <div key={key} className="tarvis__tool-parameter">
        <label className="tarvis__tool-parameter-label">
          {key}
          {isRequired && <span className="tarvis__required">*</span>}
        </label>

        {inputType === 'select' ? (
          <CustomSelect
            options={inputProps.options.map((option: string) => ({
              value: option,
              label: option,
            }))}
            value={value}
            onChange={(selectedValue) => handleParameterChange(key, selectedValue)}
            placeholder="Select an option"
            error={!!error}
          />
        ) : inputType === 'checkbox' ? (
          <input
            type="checkbox"
            className={`tarvis__tool-parameter-input ${error ? 'tarvis__error' : ''}`}
            checked={value}
            onChange={(e) => handleParameterChange(key, e.currentTarget.checked)}
            required={isRequired}
          />
        ) : (
          <input
            type={inputType}
            className={`tarvis__tool-parameter-input ${error ? 'tarvis__error' : ''}`}
            value={value}
            onChange={(e) => handleParameterChange(key, e.currentTarget.value)}
            required={isRequired}
            placeholder={`Enter ${key}...`}
          />
        )}

        {error && <div className="tarvis__tool-parameter-error">{error}</div>}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="tarvis__modal-overlay">
      <div className="tarvis__tool-modal">
        <div className="tarvis__tool-modal-header">
          <h3>Use Tool: {toolName}</h3>
          <button
            className="tarvis__tool-modal-close"
            onClick={onCancel}
            aria-label="Close modal"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="tarvis__tool-modal-content">
          <p className="tarvis__tool-description">{toolDescription}</p>

          {Object.keys(inputSchema.properties).length > 0 && (
            <div className="tarvis__tool-parameters">
              <h4>Parameters</h4>
              {Object.entries(inputSchema.properties).map(([key, schema]) =>
                renderParameterInput(key, schema)
              )}
            </div>
          )}
        </div>

        <div className="tarvis__tool-modal-actions">
          <button
            className="tarvis__tool-modal-button tarvis__tool-modal-button--cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="tarvis__tool-modal-button tarvis__tool-modal-button--confirm"
            onClick={handleConfirm}
          >
            Use Tool
          </button>
        </div>
      </div>
    </div>
  );
}
