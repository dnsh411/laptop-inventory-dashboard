import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Icon, icons } from './Icons';
import StatusBadge from './StatusBadge';

const DownloadModal = ({ isOpen, onClose, inventory, showToast }) => {
  const [closing, setClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Reset search and selections when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedIds(new Set());
      setClosing(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 220);
  }, [onClose]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Filter laptops based on name, brand, or model
  const filteredLaptops = useMemo(() => {
    if (!Array.isArray(inventory)) return [];
    return inventory.filter(l => {
      if (!l) return false;
      const brand = (l.brand || "").toLowerCase();
      const model = (l.model || "").toLowerCase();
      const assetId = (l.asset_id || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      return brand.includes(query) || model.includes(query) || assetId.includes(query);
    });
  }, [inventory, searchQuery]);

  // Toggle selection for a single laptop
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select all (for currently filtered laptops)
  const handleSelectAllToggle = () => {
    const allFilteredSelected = filteredLaptops.every(l => selectedIds.has(l.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        // Deselect all filtered laptops
        filteredLaptops.forEach(l => next.delete(l.id));
      } else {
        // Select all filtered laptops
        filteredLaptops.forEach(l => next.add(l.id));
      }
      return next;
    });
  };

  const escapeCSV = (val) => {
    if (val === null || val === undefined || val === "") return '"N/A"';
    let s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const triggerCSVDownload = (laptopsList, reportType) => {
    if (laptopsList.length === 0) {
      showToast('No data available to download', 'error');
      return;
    }

    const headers = [
      "asset_id", "brand", "model", "color", "quantity", "processor",
      "ram", "storage", "screen_size", "graphics", "status",
      "assigned_to", "department", "location", "purchase_date",
      "warranty_expiry", "vendor", "price", "defective",
      "defect_type", "defect_desc", "severity", "repair_status"
    ];

    const rows = [];
    rows.push(headers.join(","));

    laptopsList.forEach(l => {
      const row = [
        l.asset_id,
        l.brand,
        l.model,
        l.color,
        l.quantity,
        l.processor,
        l.ram,
        l.storage,
        l.screen_size,
        l.graphics,
        l.status,
        l.assigned_to,
        l.department,
        l.location,
        l.purchase_date,
        l.warranty_expiry,
        l.vendor,
        l.price,
        (l.defective === true || l.status === 'Defective') ? 'Yes' : 'No',
        l.defect_type,
        l.defect_desc,
        l.severity,
        l.repair_status
      ].map(escapeCSV).join(",");
      rows.push(row);
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(rows.join("\n"));
    const link = document.createElement("a");
    const date = new Date().toISOString().split('T')[0];
    
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `Laptop-Report-${reportType}-${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Report Downloaded Successfully (${laptopsList.length} items)`, 'success');
  };

  const handleDownloadSelected = () => {
    const selectedLaptops = inventory.filter(l => selectedIds.has(l.id));
    triggerCSVDownload(selectedLaptops, "Selected");
    handleClose();
  };

  const handleDownloadAll = () => {
    triggerCSVDownload(inventory, "All");
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      id="download-modal-overlay" 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${closing ? 'modal-overlay-out' : 'modal-overlay-in'}`}
      onClick={(e) => { if (e.target.id === 'download-modal-overlay') handleClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
      
      <div 
        className={`relative w-full max-w-4xl max-h-[80vh] flex flex-col bg-surface-900/95 backdrop-blur-2xl border border-white/[0.08] rounded-3xl shadow-2xl shadow-black/40 ${closing ? 'modal-slide-out' : 'modal-slide-in'}`}
        style={{ boxShadow: '0 0 60px rgba(99,102,241,0.08), 0 25px 50px rgba(0,0,0,0.4)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Icon d={icons.reports} className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Download Report</h3>
              <p className="text-[11px] text-surface-200/40 mt-0.5">Select laptops to download</p>
            </div>
          </div>
          <button 
            id="download-modal-close" 
            onClick={handleClose} 
            className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-surface-200/40 hover:text-white hover:bg-white/[0.08] transition-all duration-200 cursor-pointer"
          >
            <Icon d={icons.close} className="w-4 h-4" />
          </button>
        </div>

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-7 py-4 bg-white/[0.01] border-b border-white/[0.04]">
          <div className="flex items-center gap-4 flex-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filteredLaptops.length > 0 && filteredLaptops.every(l => selectedIds.has(l.id))}
                onChange={handleSelectAllToggle}
                className="w-4.5 h-4.5 accent-indigo-500 cursor-pointer rounded border-white/10 bg-white/5"
              />
              <span className="text-xs font-semibold text-surface-200/50 uppercase tracking-wider">Select All</span>
            </label>

            <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
              {selectedIds.size} selected
            </span>
            
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-200/30">
                <Icon d={icons.search} className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search by ID, brand, model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-surface-200/25 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadSelected}
              disabled={selectedIds.size === 0}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-md shadow-indigo-600/20"
            >
              Download Selected
            </button>
            <button
              onClick={handleDownloadAll}
              className="px-4 py-2 rounded-xl text-xs font-bold text-surface-200/60 hover:text-white hover:bg-white/[0.05] transition-all duration-200 cursor-pointer"
            >
              Download All
            </button>
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-y-auto min-h-[250px]">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="w-12 px-5 py-4 sticky top-0 bg-surface-900/95 backdrop-blur-md z-10"></th>
                {["Asset ID", "Brand", "Model", "Status", "Assigned To", "Price"].map((h) => (
                  <th 
                    key={h} 
                    className="text-left px-5 py-4 text-[11px] font-semibold text-surface-200/35 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-surface-900/95 backdrop-blur-md z-10"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLaptops.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-surface-200/30 text-sm">
                    No laptops found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLaptops.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => toggleSelect(item.id)}
                      className={`group cursor-pointer border-b border-white/[0.03] transition-colors duration-150
                        ${isSelected 
                          ? 'bg-indigo-500/10 hover:bg-indigo-500/15' 
                          : 'hover:bg-white/5'
                        }`}
                    >
                      <td className={`px-5 py-3 border-y transition-colors duration-150 ${isSelected ? 'border-indigo-500/20 border-l border-l-indigo-500/20' : 'border-transparent border-l border-l-transparent'}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelect(item.id);
                          }}
                          className="w-4 h-4 accent-indigo-500 cursor-pointer rounded border-white/10 bg-white/5"
                        />
                      </td>
                      <td className={`px-5 py-3 font-mono text-xs text-brand-400 font-semibold border-y transition-colors duration-150 ${isSelected ? 'border-indigo-500/20' : 'border-transparent'}`}>
                        {item.asset_id}
                      </td>
                      <td className={`px-5 py-3 font-medium border-y transition-colors duration-150 ${isSelected ? 'border-indigo-500/20' : 'border-transparent'}`}>
                        {item.brand}
                      </td>
                      <td className={`px-5 py-3 text-surface-200/70 whitespace-nowrap border-y transition-colors duration-150 ${isSelected ? 'border-indigo-500/20' : 'border-transparent'}`}>
                        {item.model}
                      </td>
                      <td className={`px-5 py-3 border-y transition-colors duration-150 ${isSelected ? 'border-indigo-500/20' : 'border-transparent'}`}>
                        <StatusBadge status={item.status} />
                      </td>
                      <td className={`px-5 py-3 text-surface-200/60 whitespace-nowrap border-y transition-colors duration-150 ${isSelected ? 'border-indigo-500/20' : 'border-transparent'}`}>
                        {item.assigned_to || 'N/A'}
                      </td>
                      <td className={`px-5 py-3 font-semibold text-surface-200/70 border-y border-r transition-colors duration-150 ${isSelected ? 'border-indigo-500/20 border-r-indigo-500/20' : 'border-transparent border-r-transparent'}`}>
                        {item.price ? `$${item.price}` : 'N/A'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-900/80 backdrop-blur-sm rounded-b-3xl">
          <p className="text-[11px] text-surface-200/30">
            {selectedIds.size} of {inventory.length} laptops selected
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button 
              id="btn-download-cancel" 
              onClick={handleClose} 
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-surface-200/60 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={handleDownloadSelected}
              disabled={selectedIds.size === 0}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-md shadow-indigo-600/20"
            >
              Download Selected ({selectedIds.size})
            </button>
            <button 
              onClick={handleDownloadAll} 
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-surface-200/60 hover:text-white bg-transparent hover:bg-white/[0.05] transition-all duration-200 cursor-pointer"
            >
              Download All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;
