import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { Icon, icons } from './components/Icons';
import Sidebar from './components/Sidebar';
import StatCard from './components/StatCard';
import StatusBadge from './components/StatusBadge';
import Toast from './components/Toast';
import AddLaptopModal from './components/AddLaptopModal';
import QRScannerModal, { QRGeneratorModal } from './components/QRScannerModal';
import Dashboard from './components/Dashboard';

const App = () => {
  const [activeNav, setActiveNav] = useState("inventory");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showQrGen, setShowQrGen] = useState(false);
  const [qrLaptop, setQrLaptop] = useState(null);
  
  // Dynamic Data State
  const [inventory, setInventory] = useState([]);
  const [trash, setTrash] = useState([]);
  const [editingLaptop, setEditingLaptop] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success', action: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [nextAssetId, setNextAssetId] = useState('');
  
  const itemsPerPage = 8;

  const showToast = (message, type = 'success', action = null) => {
    setToast({ show: true, message, type, action });
  };

  // Fetch Data from Supabase
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [laptopsRes, trashRes] = await Promise.all([
        supabase.from('laptops').select('*').order('created_at', { ascending: false }),
        supabase.from('trash_laptops').select('*').order('deleted_at', { ascending: false })
      ]);

      if (laptopsRes.error) throw laptopsRes.error;
      if (trashRes.error) throw trashRes.error;

      setInventory(laptopsRes.data || []);
      setTrash(trashRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast(error.message ? `Load error: ${error.message}` : 'Failed to load data from database', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateNextAssetId = async () => {
    try {
      const [laptopsRes, trashRes] = await Promise.all([
        supabase.from('laptops').select('asset_id'),
        supabase.from('trash_laptops').select('asset_id')
      ]);
      
      const allAssetIds = [
        ...(laptopsRes.data || []).map(l => l.asset_id),
        ...(trashRes.data || []).map(t => t.asset_id)
      ];

      let maxId = 0;
      allAssetIds.forEach(id => {
        if (!id) return;
        const match = id.match(/^LAP-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxId) maxId = num;
        }
      });
      return `LAP-${String(maxId + 1).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating asset ID:', error);
      return `LAP-${Math.floor(Math.random() * 10000)}`;
    }
  };

  const handleOpenAddModal = async () => {
    setEditingLaptop(null);
    setNextAssetId('Generating...');
    setShowModal(true);
    const newId = await generateNextAssetId();
    setNextAssetId(newId);
  };

  const handleRegisterFromQr = async (data) => {
    try {
      setLoading(true);
      // Check if asset_id exists
      const { data: existing, error: checkError } = await supabase
        .from('laptops')
        .select('id')
        .eq('asset_id', data.asset_id)
        .single();

      if (existing) {
        setToast({
          show: true,
          message: `Laptop ${data.asset_id} is already registered.`,
          type: 'warning',
          action: {
            label: 'Update Info',
            onClick: () => handleSaveLaptop(data, true) // Pass true to force update
          }
        });
        return;
      }

      // New registration
      const { error: insertError } = await supabase
        .from('laptops')
        .insert([{ ...data, created_at: new Date() }]);

      if (insertError) throw insertError;

      showToast(`Successfully registered ${data.brand} ${data.model}`, 'success');
      fetchData();
    } catch (error) {
      console.error('Error registering from QR:', error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLaptop = async (newLaptop, forceUpdate = false) => {
    if (!newLaptop) return;
    const status = newLaptop.defective ? 'Defective' : (newLaptop.status || 'Available');
    
    // Clean up fields specific to frontend logic before sending to supabase
    const laptopToSave = {
      ...newLaptop,
      brand: newLaptop.brand || 'Unknown',
      model: newLaptop.model || 'Unknown',
      status,
      assigned_to: newLaptop.assigned_to || '—',
    };
    
    // Convert empty strings to null for date/numeric fields to prevent Postgres type errors
    if (!laptopToSave.purchase_date) laptopToSave.purchase_date = null;
    if (!laptopToSave.warranty_expiry) laptopToSave.warranty_expiry = null;
    if (laptopToSave.price === '') laptopToSave.price = null;
    
    delete laptopToSave.isNew;
    delete laptopToSave.isUpdated;

    try {
      if (editingLaptop || forceUpdate) {
        // Update
        let query = supabase.from('laptops').update(laptopToSave);
        if (editingLaptop) {
          query = query.eq('id', editingLaptop.id);
        } else {
          query = query.eq('asset_id', laptopToSave.asset_id);
        }
        
        const { data, error } = await query.select().single();
          
        if (error) throw error;
        
        setInventory(prev => prev.map(item => item.id === data.id ? { ...data, isUpdated: true } : item));
        showToast('Laptop Updated Successfully', 'success');
        
        setTimeout(() => {
          setInventory(prev => prev.map(item => item.id === data.id ? { ...item, isUpdated: false } : item));
        }, 1500);
      } else {
        // Insert
        const { data, error } = await supabase
          .from('laptops')
          .insert([laptopToSave])
          .select()
          .single();
          
        if (error) throw error;
        
        setInventory(prev => [{ ...data, isNew: true }, ...prev]);
        showToast('Laptop Added Successfully', 'success');
        
        setTimeout(() => {
          setInventory(prev => prev.map(item => item.id === data.id ? { ...item, isNew: false } : item));
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving laptop:', error);
      showToast(error.message ? `Save error: ${error.message}` : 'Failed to save laptop', 'error');
      throw error; // Rethrow so modal doesn't close
    }
  };

  const handleDeleteLaptop = async (id) => {
    const laptopToTrash = inventory.find(item => item.id === id);
    if (!laptopToTrash) return;
    
    // Prepare for trash insertion
    const { isNew, isUpdated, created_at, updated_at, ...trashData } = laptopToTrash;
    trashData.original_created_at = created_at;
    
    try {
      // 1. Insert to trash
      const { error: insertError } = await supabase.from('trash_laptops').insert([trashData]);
      if (insertError) throw insertError;
      
      // 2. Delete from laptops
      const { error: deleteError } = await supabase.from('laptops').delete().eq('id', id);
      if (deleteError) throw deleteError;
      
      // Update local state immediately
      setInventory(prev => prev.filter(item => item.id !== id));
      setTrash(prev => [{...trashData, deleted_at: new Date().toISOString()}, ...prev]);
      
      showToast('Laptop moved to Trash', 'error', {
        label: 'Undo',
        onClick: () => handleRestoreLaptop(id)
      });
    } catch (error) {
      console.error("Error moving to trash:", error);
      showToast('Failed to move laptop to trash', 'error');
    }
  };

  const handleRestoreLaptop = async (id) => {
    const laptopToRestore = trash.find(item => item.id === id);
    if (!laptopToRestore) return;
    
    const { deleted_at, original_created_at, ...restoreData } = laptopToRestore;
    restoreData.created_at = original_created_at || new Date().toISOString();
    
    try {
      // 1. Insert back to laptops
      const { data, error: insertError } = await supabase.from('laptops').insert([restoreData]).select().single();
      if (insertError) throw insertError;
      
      // 2. Delete from trash
      const { error: deleteError } = await supabase.from('trash_laptops').delete().eq('id', id);
      if (deleteError) throw deleteError;
      
      setTrash(prev => prev.filter(item => item.id !== id));
      setInventory(prev => [{...data, isUpdated: true}, ...prev]);
      
      showToast('Laptop restored successfully', 'success');
      setTimeout(() => {
        setInventory(prev => prev.map(item => item.id === data.id ? { ...item, isUpdated: false } : item));
      }, 1500);
    } catch (error) {
      console.error("Error restoring laptop:", error);
      showToast('Failed to restore laptop', 'error');
    }
  };

  const handlePermanentDeleteLaptop = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this laptop? This action cannot be undone.")) {
      try {
        const { error } = await supabase.from('trash_laptops').delete().eq('id', id);
        if (error) throw error;
        
        setTrash(prev => prev.filter(item => item.id !== id));
        showToast('Laptop permanently deleted', 'info');
      } catch (error) {
        console.error("Error deleting permanently:", error);
        showToast('Failed to delete permanently', 'error');
      }
    }
  };

  const handleDownloadReport = () => {
    if (!inventory || inventory.length === 0) {
      showToast('No data available to download', 'error');
      return;
    }

    const escapeCSV = (val) => {
      if (val === null || val === undefined || val === "") return '"N/A"';
      let s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const sections = [];

    // SECTION 1: SUMMARY STATS
    sections.push("=== SUMMARY STATS ===");
    sections.push("Metric,Value");
    const total = inventory.length;
    const available = inventory.filter(l => l.status === 'Available').length;
    const assigned = inventory.filter(l => l.status === 'Assigned').length;
    const maintenance = inventory.filter(l => l.status === 'Maintenance').length;
    const retired = inventory.filter(l => l.status === 'Retired').length;
    const defective = inventory.filter(l => l.is_defective === true || l.status === 'Defective').length;
    const nonDefective = total - defective;

    sections.push(`Total Laptops,${total}`);
    sections.push(`Available,${available}`);
    sections.push(`Assigned,${assigned}`);
    sections.push(`Under Maintenance,${maintenance}`);
    sections.push(`Retired,${retired}`);
    sections.push(`Defective,${defective}`);
    sections.push(`Non-Defective,${nonDefective}`);
    sections.push("");

    // SECTION 2: BRAND DISTRIBUTION
    sections.push("=== BRAND DISTRIBUTION ===");
    sections.push("Brand,Total Count,Available,Assigned,Maintenance,Retired,Defective,Percentage%");
    const brands = {};
    inventory.forEach(l => {
      const b = l.brand || 'Unknown';
      if (!brands[b]) brands[b] = { total: 0, available: 0, assigned: 0, maintenance: 0, retired: 0, defective: 0 };
      brands[b].total++;
      if (l.status === 'Available') brands[b].available++;
      if (l.status === 'Assigned') brands[b].assigned++;
      if (l.status === 'Maintenance') brands[b].maintenance++;
      if (l.status === 'Retired') brands[b].retired++;
      if (l.is_defective === true || l.status === 'Defective') brands[b].defective++;
    });
    Object.keys(brands).sort().forEach(b => {
      const data = brands[b];
      const perc = ((data.total / total) * 100).toFixed(1);
      sections.push(`${escapeCSV(b)},${data.total},${data.available},${data.assigned},${data.maintenance},${data.retired},${data.defective},${perc}%`);
    });
    sections.push("");

    // Helper for simple distribution sections
    const addDistributionSection = (title, header, field) => {
      sections.push(`=== ${title} ===`);
      sections.push(`${header},Count,Percentage%`);
      const counts = {};
      inventory.forEach(l => {
        const val = l[field] || 'Unknown';
        counts[val] = (counts[val] || 0) + 1;
      });
      Object.keys(counts).sort((a, b) => counts[b] - counts[a]).forEach(val => {
        const c = counts[val];
        const perc = ((c / total) * 100).toFixed(1);
        sections.push(`${escapeCSV(val)},${c},${perc}%`);
      });
      sections.push("");
    };

    addDistributionSection("MODEL DISTRIBUTION", "Brand,Model", "model"); // Note: simplified to just model for now as requested
    addDistributionSection("RAM DISTRIBUTION", "RAM", "ram");
    addDistributionSection("STORAGE DISTRIBUTION", "Storage", "storage");
    addDistributionSection("PROCESSOR DISTRIBUTION", "Processor", "processor");
    addDistributionSection("GRAPHICS CARD DISTRIBUTION", "Graphics Card", "graphics_card");
    addDistributionSection("COLOR DISTRIBUTION", "Color", "color");

    // SECTION 9: FULL LAPTOP LIST
    sections.push("=== FULL LAPTOP LIST ===");
    sections.push("Asset ID,Brand,Model,Processor,RAM,Storage,Graphics Card,Color,Screen Size,Status,Assigned To,Department,Location,Purchase Date,Warranty Expiry,Purchase Vendor,Price,Defective");
    inventory.forEach(l => {
      const row = [
        l.asset_id, l.brand, l.model, l.processor, l.ram, l.storage,
        l.graphics_card, l.color, l.screen_size, l.status,
        l.assigned_to, l.department, l.location, l.purchase_date,
        l.warranty_expiry, l.purchase_vendor, l.price,
        (l.is_defective === true || l.status === 'Defective') ? 'Yes' : 'No'
      ].map(escapeCSV).join(",");
      sections.push(row);
    });

    const csvContent = "data:text/csv;charset=utf-8," + sections.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laptop-Analytics-Report-${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report Downloaded Successfully', 'success');
  };

  const currentData = activeNav === 'trash' ? trash : inventory;

  const filteredData = useMemo(() => {
    if (!Array.isArray(currentData)) return [];
    return currentData.filter((item) => {
      if (!item) return false;
      const safeBrand = item.brand || "";
      const safeModel = item.model || "";
      const safeId = item.asset_id || "";
      const safeAssignedTo = item.assigned_to || "";
      
      const matchesSearch =
        searchQuery === "" ||
        safeBrand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        safeModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        safeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        safeAssignedTo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, currentData, activeNav]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const safeInventory = Array.isArray(inventory) ? inventory : [];
    return {
      total:       safeInventory.length,
      available:   safeInventory.filter(i => i && i.status === "Available").length,
      assigned:    safeInventory.filter(i => i && i.status === "Assigned").length,
      maintenance: safeInventory.filter(i => i && i.status === "Maintenance").length,
    };
  }, [inventory]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />

      <main className="flex-1 ml-[260px]">
        <header className="sticky top-0 z-20 bg-surface-950/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight">{activeNav === 'trash' ? 'Recycle Bin' : 'Laptop Inventory'}</h2>
              <p className="text-xs text-surface-200/40 mt-0.5">{activeNav === 'trash' ? 'Manage deleted laptops' : 'Manage and track all company laptops'}</p>
            </div>
            {activeNav !== 'trash' && (
              <div className="flex items-center gap-3">
                <button 
                  id="btn-download-report" 
                  onClick={handleDownloadReport} 
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-xl border border-white/20 transition-all duration-200"
                >
                  <Icon d={icons.reports} className="w-4 h-4" />
                  Download Report
                </button>
                
                <button
                  onClick={() => setShowQRScanner(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'transparent',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  📷 QR Scanner
                </button>

                <button 
                  id="btn-add-laptop" 
                  onClick={handleOpenAddModal} 
                  className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-brand-600/20 hover:shadow-brand-500/30 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Icon d={icons.plus} className="w-4 h-4" />
                  Add Laptop
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="p-8">
          {activeNav === 'dashboard' ? (
            <Dashboard />
          ) : activeNav === 'trash' ? (
            <React.Fragment>
              <div className="animate-fade-in bg-surface-900/60 backdrop-blur-sm border border-red-500/10 rounded-2xl p-5 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.03)]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                    <Icon d={icons.trash} className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-red-400">Deleted Laptops</h3>
                    <p className="text-xs text-surface-200/40 mt-0.5">Items here will be permanently removed if deleted again.</p>
                  </div>
                  <div className="relative w-full max-w-sm">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-200/30">
                      <Icon d={icons.search} className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search trash..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-surface-200/30 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              <div className="animate-fade-in animate-fade-in-delay-1 bg-surface-900/60 backdrop-blur-sm border border-red-500/10 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.03)]">
                <div className="overflow-x-auto min-h-[300px]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-red-500/10">
                        {["Asset ID", "Brand", "Model", "Processor", "RAM", "Storage", "Deleted At", "Actions"].map((h) => (
                          <th key={h} className="text-left px-5 py-4 text-[11px] font-semibold text-red-400/50 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-surface-900/90 backdrop-blur-md z-10">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={8} className="text-center py-16"><div className="spinner mx-auto border-surface-200 border-t-red-500"></div></td></tr>
                      ) : paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-16 text-surface-200/30 text-sm">
                            Trash is empty.
                          </td>
                        </tr>
                      ) : (
                        paginatedData.map((item, idx) => (
                          <tr key={item.id} className="group table-row border-b border-white/[0.03] last:border-0 hover:bg-red-500/[0.02]">
                            <td className="px-5 py-3.5 font-mono text-xs text-brand-400 font-semibold">{item.asset_id}</td>
                            <td className="px-5 py-3.5 font-medium">{item.brand}</td>
                            <td className="px-5 py-3.5 text-surface-200/70 whitespace-nowrap">{item.model}</td>
                            <td className="px-5 py-3.5 text-surface-200/50 text-xs whitespace-nowrap">{item.processor}</td>
                            <td className="px-5 py-3.5 text-surface-200/50 text-xs">{item.ram}</td>
                            <td className="px-5 py-3.5 text-surface-200/50 text-xs whitespace-nowrap">{item.storage}</td>
                            <td className="px-5 py-3.5 text-surface-200/40 text-xs flex items-center gap-1.5 whitespace-nowrap"><Icon d={icons.clock} className="w-3 h-3"/> {formatDate(item.deleted_at)}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleRestoreLaptop(item.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all text-xs font-bold">
                                  <Icon d={icons.restore} className="w-3.5 h-3.5" /> Restore
                                </button>
                                <button onClick={() => handlePermanentDeleteLaptop(item.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all text-xs font-bold">
                                  <Icon d={icons.trash} className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {!loading && (
                  <div className="px-5 py-3 border-t border-red-500/10 flex items-center justify-between text-xs text-surface-200/30">
                    <span>Showing {paginatedData.length} of {filteredData.length} laptops (Total {trash.length})</span>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-7 h-7 flex items-center justify-center rounded border border-white/[0.06] hover:bg-white/[0.04] disabled:opacity-30 transition-colors"><Icon d={icons.chevron} className="w-3 h-3 rotate-180" /></button>
                        <span className="px-3 font-medium text-surface-200/60">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-7 h-7 flex items-center justify-center rounded border border-white/[0.06] hover:bg-white/[0.04] disabled:opacity-30 transition-colors"><Icon d={icons.chevron} className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <div className="grid grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Laptops"  value={stats.total}       accent="bg-brand-500/15 text-brand-400"    icon="laptop"     animClass="" />
                <StatCard label="Available"       value={stats.available}   accent="bg-emerald-500/15 text-emerald-400" icon="inventory"  animClass="animate-fade-in-delay-1" />
                <StatCard label="Assigned"        value={stats.assigned}    accent="bg-blue-500/15 text-blue-400"      icon="users"      animClass="animate-fade-in-delay-2" />
                <StatCard label="Maintenance"     value={stats.maintenance} accent="bg-amber-500/15 text-amber-400"    icon="settings"   animClass="animate-fade-in-delay-3" />
              </div>

              <div className="animate-fade-in animate-fade-in-delay-2 bg-surface-900/60 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-200/30">
                      <Icon d={icons.search} className="w-4 h-4" />
                    </span>
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Search by ID, brand, model, or user..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-surface-200/30 focus:outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/20 transition-all duration-200"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {["All", "Available", "Assigned", "Maintenance", "Retired"].map((s) => (
                      <button
                        key={s}
                        id={`filter-${s.toLowerCase()}`}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer
                          ${statusFilter === s
                            ? "bg-brand-600/20 text-brand-400 border border-brand-500/30"
                            : "text-surface-200/40 hover:text-surface-200/60 border border-transparent hover:border-white/[0.06]"
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="animate-fade-in animate-fade-in-delay-3 bg-surface-900/60 backdrop-blur-sm border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto min-h-[300px]">
                  <table id="inventory-table" className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {["Asset ID", "Brand", "Model", "Processor", "RAM", "Storage", "Status", "Assigned To", "Purchase Date", "Price", "Actions"].map((h) => (
                          <th key={h} className="text-left px-5 py-4 text-[11px] font-semibold text-surface-200/35 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-surface-900/90 backdrop-blur-md z-10">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={11} className="text-center py-16"><div className="spinner mx-auto border-surface-200 border-t-brand-500"></div></td></tr>
                      ) : paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center py-16 text-surface-200/30 text-sm">
                            No laptops found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedData.map((item, idx) => (
                          <tr key={item.id} className={`group table-row border-b border-white/[0.03] last:border-0 ${item.isNew ? 'row-insert' : ''} ${item.isUpdated ? 'row-update' : ''}`} style={{ animationDelay: item.isNew ? '0ms' : `${idx * 40}ms` }}>
                            <td className="px-5 py-3.5 font-mono text-xs text-brand-400 font-semibold">{item.asset_id}</td>
                            <td className="px-5 py-3.5 font-medium">{item.brand}</td>
                            <td className="px-5 py-3.5 text-surface-200/70 whitespace-nowrap">{item.model}</td>
                            <td className="px-5 py-3.5 text-surface-200/50 text-xs whitespace-nowrap">{item.processor}</td>
                            <td className="px-5 py-3.5 text-surface-200/50 text-xs">{item.ram}</td>
                            <td className="px-5 py-3.5 text-surface-200/50 text-xs whitespace-nowrap">{item.storage}</td>
                            <td className="px-5 py-3.5"><StatusBadge status={item.status} /></td>
                            <td className="px-5 py-3.5 text-surface-200/60 whitespace-nowrap">{item.assigned_to}</td>
                            <td className="px-5 py-3.5 text-surface-200/40 text-xs">{item.purchase_date}</td>
                            <td className="px-5 py-3.5 font-semibold text-surface-200/70">{item.price}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setQrLaptop(item); setShowQrGen(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-200/40 hover:text-brand-400 hover:bg-brand-500/10 transition-colors shadow-sm hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]" title="QR Code">
                                  <Icon d={icons.qr} className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { setEditingLaptop(item); setShowModal(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-200/40 hover:text-blue-400 hover:bg-blue-500/10 transition-colors shadow-sm hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]" title="Edit">
                                  <Icon d={icons.edit} className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteLaptop(item.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-200/40 hover:text-red-400 hover:bg-red-500/10 transition-colors shadow-sm hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]" title="Delete">
                                  <Icon d={icons.trash} className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {!loading && (
                  <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-surface-200/30">
                    <span>Showing {paginatedData.length} of {filteredData.length} laptops (Total {inventory.length})</span>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="w-7 h-7 flex items-center justify-center rounded border border-white/[0.06] hover:bg-white/[0.04] disabled:opacity-30 transition-colors"
                        >
                          <Icon d={icons.chevron} className="w-3 h-3 rotate-180" />
                        </button>
                        <span className="px-3 font-medium text-surface-200/60">Page {currentPage} of {totalPages}</span>
                        <button 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="w-7 h-7 flex items-center justify-center rounded border border-white/[0.06] hover:bg-white/[0.04] disabled:opacity-30 transition-colors"
                        >
                          <Icon d={icons.chevron} className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </React.Fragment>
          )}
        </div>
      </main>

      <Toast show={toast.show} message={toast.message} type={toast.type} action={toast.action} onClose={() => setToast(p => ({...p, show: false}))} />

      {showModal && (
        <AddLaptopModal 
          isOpen={showModal} 
          onClose={() => { setShowModal(false); setEditingLaptop(null); }} 
          onSave={handleSaveLaptop} 
          editingLaptop={editingLaptop} 
          nextAssetId={nextAssetId} 
        />
      )}

      {showQRScanner && (
        <QRScannerModal 
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onRegister={(data) => handleRegisterFromQr(data)}
        />
      )}

      {showQrGen && (
        <QRGeneratorModal 
          isOpen={showQrGen} 
          onClose={() => { setShowQrGen(false); setQrLaptop(null); }} 
          laptop={qrLaptop} 
        />
      )}
    </div>
  );
};

export default App;
