import React from 'react';

const StatusBadge = ({ status }) => {
  const styles = {
    Available:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    Assigned:    "bg-brand-500/15 text-brand-400 border-brand-500/20",
    Maintenance: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    Retired:     "bg-rose-500/15 text-rose-400 border-rose-500/20",
    Defective:   "bg-red-500/15 text-red-400 border-red-500/20",
  };
  const dotColors = {
    Available: "bg-emerald-400",
    Assigned: "bg-brand-400",
    Maintenance: "bg-amber-400",
    Retired: "bg-rose-400",
    Defective: "bg-red-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border badge-shimmer ${styles[status] || ""}`}>
      <span className={`w-1.5 h-1.5 rounded-full pulse-dot ${dotColors[status] || ""}`}></span>
      {status}
    </span>
  );
};

export default StatusBadge;
