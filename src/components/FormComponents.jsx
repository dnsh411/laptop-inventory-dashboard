import React from 'react';
import { Icon, icons } from './Icons';

export const FormInput = ({ icon, label, id, error, className, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-[11px] font-semibold text-surface-200/50 uppercase tracking-wider mb-1.5">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-200/25"><Icon d={icons[icon]||icons.tag} className="w-4 h-4" /></span>
      <input id={id} {...props} className={className || `w-full pl-10 pr-3 py-2.5 bg-white/[0.04] border rounded-xl text-sm text-white placeholder:text-surface-200/25 focus:outline-none input-glow transition-all duration-200 ${error ? 'input-glow-error border-red-500/40' : 'border-white/[0.08]'}`} />
    </div>
    {error && <p className="text-red-400 text-[10px] mt-1 font-medium">{error}</p>}
  </div>
);

export const FormSelect = ({ icon, label, id, options, error, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-[11px] font-semibold text-surface-200/50 uppercase tracking-wider mb-1.5">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-200/25"><Icon d={icons[icon]||icons.tag} className="w-4 h-4" /></span>
      <select id={id} {...props} className={`w-full pl-10 pr-3 py-2.5 bg-white/[0.04] border rounded-xl text-sm text-white focus:outline-none input-glow transition-all duration-200 appearance-none cursor-pointer ${error ? 'input-glow-error border-red-500/40' : 'border-white/[0.08]'}`}>
        <option value="" className="bg-surface-900">Select...</option>
        {options.map(o => <option key={o} value={o} className="bg-surface-900">{o}</option>)}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-200/25 pointer-events-none"><Icon d={icons.chevron} className="w-3 h-3 rotate-90" /></span>
    </div>
    {error && <p className="text-red-400 text-[10px] mt-1 font-medium">{error}</p>}
  </div>
);

export const SectionHeader = ({ icon, title }) => (
  <div className="mb-4 mt-2">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-7 h-7 rounded-lg bg-brand-500/15 flex items-center justify-center text-brand-400"><Icon d={icons[icon]} className="w-3.5 h-3.5" /></div>
      <h4 className="text-sm font-bold text-white/90 tracking-tight">{title}</h4>
    </div>
    <div className="section-glow"></div>
  </div>
);
