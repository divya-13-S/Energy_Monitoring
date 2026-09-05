import React from 'react';
import './Select.css';

const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  error,
  helperText,
  isDisabled = false,
  isRequired = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`select-group ${error ? 'has-error' : ''} ${className}`}>
      {label && (
        <label className="select-label" htmlFor={name}>
          {label} {isRequired && <span className="required-star">*</span>}
        </label>
      )}
      <div className="select-wrapper">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={isDisabled}
          required={isRequired}
          className="select-field"
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="select-arrow">▼</span>
      </div>
      {error && <span className="select-error-text">{error}</span>}
      {!error && helperText && <span className="select-helper-text">{helperText}</span>}
    </div>
  );
};

export default Select;
