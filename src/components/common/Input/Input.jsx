import React from 'react';
import './Input.css';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  helperText,
  icon: Icon,
  iconPosition = 'left',
  isDisabled = false,
  isRequired = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`input-group ${error ? 'has-error' : ''} ${isDisabled ? 'is-disabled' : ''} ${className}`}>
      {label && (
        <label className="input-label" htmlFor={name}>
          {label} {isRequired && <span className="required-star">*</span>}
        </label>
      )}
      <div className={`input-wrapper ${Icon ? `has-icon icon-${iconPosition}` : ''}`}>
        {Icon && iconPosition === 'left' && <Icon className="input-icon left" />}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={isDisabled}
          required={isRequired}
          className="input-field"
          {...props}
        />
        {Icon && iconPosition === 'right' && <Icon className="input-icon right" />}
      </div>
      {error && <span className="input-error-text">{error}</span>}
      {!error && helperText && <span className="input-helper-text">{helperText}</span>}
    </div>
  );
};

export default Input;
