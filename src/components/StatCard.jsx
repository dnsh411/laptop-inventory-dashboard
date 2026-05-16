import React from 'react';
import { Icon, icons } from './Icons';

const StatCard = ({ label, value, accent, icon, animClass }) => (
  <div className={`animate-fade-in ${animClass} bg-surface-900/60 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 flex items-center gap-4 hover:border-white/[0.12] transition-colors duration-300`}>
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
      <Icon d={icons[icon]} className="w-5 h-5" />
    </div>
    <div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-surface-200/60 font-medium mt-0.5">{label}</p>
    </div>
  </div>
);

export default StatCard;
