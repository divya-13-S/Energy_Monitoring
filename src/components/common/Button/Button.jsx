import React from 'react';
import './Button.css';

const Button = ({
  children,
  variant = 'primary', // primary, secondary, outline, danger, success, ghost
  size = 'md', // sm, md, lg
  isLoading = false,
  isDisabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const classNames = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full' : '',
    isLoading ? 'btn-loading' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classNames}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <span className="btn-spinner" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="btn-icon left" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="btn-icon right" />}
        </>
      )}
    </button>
  );
};

export default Button;
