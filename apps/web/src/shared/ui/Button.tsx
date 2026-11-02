import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  style,
  disabled,
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 600,
    fontSize: size === 'sm' ? '14px' : size === 'lg' ? '18px' : '16px',
    padding: size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 24px' : '8px 16px',
    borderRadius: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
    border: '1px solid transparent',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    ...style,
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--qc-action, #275BC0)',
      color: 'var(--qc-on-action, #FFFFFF)',
      borderColor: 'var(--qc-action, #275BC0)',
    },
    secondary: {
      backgroundColor: 'var(--qc-surface, #FFFFFF)',
      color: 'var(--qc-text, #0B0F17)',
      borderColor: 'var(--qc-control-border, #283548)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--qc-action, #275BC0)',
      borderColor: 'var(--qc-action, #275BC0)',
    },
    danger: {
      backgroundColor: '#EF4444',
      color: '#FFFFFF',
      borderColor: '#EF4444',
    },
  };

  return (
    <button
      className={`qc-button qc-button-${variant} ${className}`}
      style={{ ...baseStyle, ...variantStyles[variant] }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

