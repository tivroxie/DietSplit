import React from 'react';
import { DietType } from '../types';
import { DIET_COLORS, DIET_LABELS } from '../constants';

interface DietBadgeProps {
  type: DietType;
  className?: string;
}

export const DietBadge: React.FC<DietBadgeProps> = ({ type, className = '' }) => {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${DIET_COLORS[type]} ${className}`}>
      {DIET_LABELS[type]}
    </span>
  );
};
