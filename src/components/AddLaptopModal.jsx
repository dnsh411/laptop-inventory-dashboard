import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Icon, icons } from './Icons';
import { FormInput, FormSelect, SectionHeader } from './FormComponents';

const AddLaptopModal = ({ isOpen, onClose, onSave, editingLaptop, nextAssetId }) => {
  const [closing, setClosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [defective, setDefective] = useState(false);
  
  const initialForm = useMemo(() => ({
    asset_id: nextAssetId || '', brand:'', model:'', color:'', quantity: 1,
    processor:'', ram:'', storage:'', graphics:'', screen_size:'',
    status:'', assigned_to:'', department:'', location:'',
    purchase_date:'', warranty_expiry:'', vendor:'', price:'',
    defect_type:'', defect_desc:'', severity:'', repair_status:''
  }), [nextAssetId]);

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (isOpen) {
      if (editingLaptop) {
        setForm({ ...initialForm, ...editingLaptop });
        setDefective(editingLaptop.status === 'Defective' || editingLaptop.defective);
      } else {
        setForm(initialForm);
        setDefective(false);
      }
      setErrors({});
    }
  }, [isOpen, editingLaptop, initialForm]);

  const set = (k,v) => { setForm(p => ({...p,[k]:v})); setErrors(p => ({...p,[k]:undefined})); };

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 220);
  }, [onClose]);

  const validate = () => {
    const e = {};
    if(!form.asset_id?.trim()) e.asset_id = 'Asset ID is required';
    if(!form.brand) e.brand = 'Brand is required';
    if(!form.model?.trim()) e.model = 'Model is required';
    if(!form.status) e.status = 'Status is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if(!validate()) return;
    setSaving(true);
    try {
      await onSave({...form, defective});
      handleClose();
      setTimeout(() => {
        setForm(initialForm);
        setDefective(false);
      }, 300);
    } catch (err) {
      console.error(err);
      // Let the parent component show the error toast
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if(!isOpen) return;
    const handler = (e) => { if(e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, handleClose]);

  if(!isOpen) return null;

  const statusColors = { Available:'text-emerald-400', Assigned:'text-blue-400', Maintenance:'text-amber-400', Retired:'text-gray-400', Defective:'text-red-400' };

  return (
    <div id="modal-overlay" className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${closing ? 'modal-overlay-out' : 'modal-overlay-in'}`} onClick={(e) => { if(e.target.id === 'modal-overlay') handleClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
      <div className={`relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-surface-900/95 backdrop-blur-2xl border border-white/[0.08] rounded-3xl shadow-2xl shadow-black/40 ${closing ? 'modal-slide-out' : 'modal-slide-in'}`}
           style={{ boxShadow: '0 0 60px rgba(99,102,241,0.08), 0 25px 50px rgba(0,0,0,0.4)' }}>

        <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Icon d={icons.plus} className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">{editingLaptop ? 'Edit Laptop Details' : 'Add New Laptop'}</h3>
              <p className="text-[11px] text-surface-200/40 mt-0.5">{editingLaptop ? 'Update the details for this device' : 'Fill in the details to register a new device'}</p>
            </div>
          </div>
          <button id="modal-close" onClick={handleClose} className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-surface-200/40 hover:text-white hover:bg-white/[0.08] transition-all duration-200 cursor-pointer">
            <Icon d={icons.close} className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-6">
          <SectionHeader icon="tag" title="Basic Information" />
          <div className="grid grid-cols-2 gap-4">
            <FormInput icon="hash" label="Asset ID" id="f-assetId" value={form.asset_id} onChange={e=>set('asset_id',e.target.value)} error={errors.asset_id} className="w-full pl-10 pr-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-surface-200/25 focus:outline-none input-glow transition-all duration-200" />
            <FormSelect icon="laptop" label="Brand" id="f-brand" options={['Apple','Dell','Lenovo','HP','Asus','Microsoft','Acer','Samsung']} value={form.brand} onChange={e=>set('brand',e.target.value)} error={errors.brand} />
            <FormInput icon="monitor" label="Model" id="f-model" placeholder='e.g. MacBook Pro 16 inch' value={form.model} onChange={e=>set('model',e.target.value)} error={errors.model} />
            <FormInput icon="color" label="Color" id="f-color" placeholder="e.g. Space Gray" value={form.color} onChange={e=>set('color',e.target.value)} />
            <FormInput icon="box" label="Quantity" id="f-quantity" type="number" placeholder="1" value={form.quantity} onChange={e=>set('quantity',e.target.value)} />
          </div>

          <SectionHeader icon="cpu" title="Hardware Specifications" />
          <div className="grid grid-cols-2 gap-4">
            <FormInput icon="cpu" label="Processor" id="f-processor" placeholder="e.g. Apple M3 Max" value={form.processor} onChange={e=>set('processor',e.target.value)} />
            <FormInput icon="cpu" label="RAM" id="f-ram" placeholder="e.g. 32 GB" value={form.ram} onChange={e=>set('ram',e.target.value)} />
            <FormInput icon="box" label="Storage" id="f-storage" placeholder="e.g. 1 TB SSD" value={form.storage} onChange={e=>set('storage',e.target.value)} />
            <FormInput icon="monitor" label="Graphics Card" id="f-graphics" placeholder="e.g. RTX 4070" value={form.graphics} onChange={e=>set('graphics',e.target.value)} />
            <FormInput icon="monitor" label="Screen Size" id="f-screenSize" placeholder="e.g. 16 inch" value={form.screen_size} onChange={e=>set('screen_size',e.target.value)} />
          </div>

          <SectionHeader icon="box" title="Inventory Details" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="f-status" className="block text-[11px] font-semibold text-surface-200/50 uppercase tracking-wider mb-1.5">Status</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-200/25"><Icon d={icons.shield} className="w-4 h-4" /></span>
                <select id="f-status" value={form.status} onChange={e=>set('status',e.target.value)} className={`w-full pl-10 pr-3 py-2.5 bg-white/[0.04] border rounded-xl text-sm focus:outline-none input-glow transition-all duration-200 appearance-none cursor-pointer ${statusColors[form.status]||'text-white'} ${errors.status ? 'input-glow-error border-red-500/40' : 'border-white/[0.08]'}`}>
                  <option value="" className="bg-surface-900 text-white">Select status...</option>
                  {['Available','Assigned','Maintenance','Retired','Defective'].map(s => <option key={s} value={s} className="bg-surface-900 text-white">{s}</option>)}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-200/25 pointer-events-none"><Icon d={icons.chevron} className="w-3 h-3 rotate-90" /></span>
              </div>
              {errors.status && <p className="text-red-400 text-[10px] mt-1 font-medium">{errors.status}</p>}
            </div>
            <FormInput icon="users" label="Assigned To" id="f-assignedTo" placeholder="Employee name" value={form.assigned_to} onChange={e=>set('assigned_to',e.target.value)} />
            <FormInput icon="building" label="Department" id="f-department" placeholder="e.g. Engineering" value={form.department} onChange={e=>set('department',e.target.value)} />
            <FormInput icon="location" label="Location" id="f-location" placeholder="e.g. Floor 3, Bldg A" value={form.location} onChange={e=>set('location',e.target.value)} />
          </div>

          <SectionHeader icon="cart" title="Purchase and Warranty" />
          <div className="grid grid-cols-2 gap-4">
            <FormInput icon="calendar" label="Purchase Date" id="f-purchaseDate" type="date" value={form.purchase_date} onChange={e=>set('purchase_date',e.target.value)} />
            <FormInput icon="calendar" label="Warranty Expiry" id="f-warrantyExpiry" type="date" value={form.warranty_expiry} onChange={e=>set('warranty_expiry',e.target.value)} />
            <FormInput icon="vendor" label="Purchase Vendor" id="f-vendor" placeholder="e.g. Amazon Business" value={form.vendor} onChange={e=>set('vendor',e.target.value)} />
            <FormInput icon="dollar" label="Price" id="f-price" placeholder="e.g. $2,499" value={form.price} onChange={e=>set('price',e.target.value)} error={errors.price} />
          </div>

          <SectionHeader icon="alert" title="Defective Status" />
          <div className="flex items-center gap-3 mb-3">
            <div id="toggle-defective" className={`toggle-track ${defective ? 'active' : ''}`} onClick={() => setDefective(!defective)}></div>
            <span className="text-sm font-medium text-surface-200/70">Mark as Defective</span>
            {defective && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20">DEFECTIVE</span>}
          </div>
          {defective && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-red-500/[0.03] border border-red-500/10 rounded-2xl">
              <FormSelect icon="alert" label="Defect Type" id="f-defectType" options={['Hardware Failure','Screen Damage','Battery Issue','Keyboard Malfunction','Port Damage','Overheating','Other']} value={form.defect_type} onChange={e=>set('defect_type',e.target.value)} />
              <FormSelect icon="shield" label="Severity Level" id="f-severity" options={['Low','Medium','High','Critical']} value={form.severity} onChange={e=>set('severity',e.target.value)} />
              <FormSelect icon="wrench" label="Repair Status" id="f-repairStatus" options={['Pending Review','Under Repair','Repaired','Unrepairable']} value={form.repair_status} onChange={e=>set('repair_status',e.target.value)} />
              <div className="col-span-2">
                <label htmlFor="f-defectDesc" className="block text-[11px] font-semibold text-surface-200/50 uppercase tracking-wider mb-1.5">Defect Description</label>
                <textarea id="f-defectDesc" rows={3} placeholder="Describe the defect in detail..." value={form.defect_desc} onChange={e=>set('defect_desc',e.target.value)} className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-surface-200/25 focus:outline-none input-glow transition-all duration-200 resize-none"></textarea>
              </div>
            </div>
          )}
        </div>

        <div className="px-7 py-4 border-t border-white/[0.06] flex items-center justify-between bg-surface-900/80 backdrop-blur-sm rounded-b-3xl">
          <p className="text-[11px] text-surface-200/30">All fields marked are validated on save</p>
          <div className="flex items-center gap-3">
            <button id="btn-cancel" onClick={handleClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-surface-200/60 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-all duration-200 cursor-pointer">Cancel</button>
            <button id="btn-save" onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 cursor-pointer shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow:'0 4px 20px rgba(99,102,241,0.3)' }}>
              {saving ? <React.Fragment><span className="spinner"></span> Saving...</React.Fragment> : <React.Fragment><Icon d={editingLaptop ? icons.check : icons.plus} className="w-4 h-4" /> {editingLaptop ? 'Save Changes' : 'Save Laptop'}</React.Fragment>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLaptopModal;
