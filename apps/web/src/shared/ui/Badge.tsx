import React from 'react';

export interface BadgeProps {
  variant?: 'active' | 'paused' | 'archived' | 'success' | 'warning' | 'info';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'info', children }) => {
  const badgeStyles: Record<string, { bg: string; text: string; border: string }> = {
    active: { bg: 'rgba(39, 91, 192, 0.12)', text: '#275BC0', border: 'rgba(39, 91, 192, 0.3)' },
    paused: { bg: 'rgba(245, 158, 11, 0.15)', text: '#B45309', border: 'rgba(245, 158, 11, 0.3)' },
    archived: { bg: 'rgba(138, 153, 173, 0.2)', text: '#4B5563', border: 'rgba(138, 153, 173, 0.4)' },
    success: { bg: 'rgba(16, 185, 129, 0.15)', text: '#065F46', border: 'rgba(16, 185, 129, 0.3)' },
    warning: { bg: 'rgba(245, 158, 11, 0.15)', text: '#B45309', border: 'rgba(245, 158, 11, 0.3)' },
    info: { bg: 'rgba(14, 165, 233, 0.15)', text: '#0369A1', border: 'rgba(14, 165, 233, 0.3)' },
  };

  const current = badgeStyles[variant] || badgeStyles.info;

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        fontSize: '12px',
        fontWeight: 600,
        borderRadius: '9999px',
        backgroundColor: current.bg,
        color: current.text,
        border: `1px solid ${current.border}`,
        lineHeight: '18px',
      }}
    >
      {children}
    </span>
  );
};

