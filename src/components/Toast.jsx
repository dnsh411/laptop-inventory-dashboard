import React, { useState, useEffect } from 'react';
import { Icon, icons } from './Icons';

const Toast = ({ show, message, type = "success", action, onClose }) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (show && !isHovered) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, isHovered, onClose]);

  if (!show && !message) return null;

  const iconsMap = { success: icons.check, error: icons.alert, info: icons.info };
  const colors = {
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    error: "bg-red-500/15 text-red-400 border-red-500/30",
    info: "bg-blue-500/15 text-blue-400 border-blue-500/30"
  };

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl ${show ? 'toast-enter' : 'toast-exit'} ${colors[type] || colors.info}`}
    >
      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-current opacity-20 relative shrink-0">
        <Icon d={iconsMap[type]} className="w-4 h-4 absolute text-current opacity-100" />
      </div>
      <p className="text-sm font-semibold pr-2">{message}</p>
      {action && (
        <button onClick={() => { action.onClick(); onClose(); }} className="ml-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5">
          <Icon d={icons.undo} className="w-3.5 h-3.5" />
          {action.label}
        </button>
      )}
      <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity ml-2 shrink-0">
        <Icon d={icons.close} className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
