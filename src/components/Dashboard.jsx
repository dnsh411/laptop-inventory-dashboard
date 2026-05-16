import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316'];

const DashboardCard = ({ title, children, className = "" }) => (
  <div className={`bg-surface-950 border border-white/[0.06] rounded-2xl p-6 shadow-xl flex flex-col w-full h-full ${className}`}>
    <h3 className="text-sm font-bold text-surface-200 mb-6 w-full text-left flex items-center gap-2">
      <span className="w-1.5 h-4 bg-brand-500 rounded-full"></span>
      {title}
    </h3>
    <div className="flex-1 flex flex-col">
      {children}
    </div>
  </div>
);

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (!percent || percent < 0.05) return null;

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold drop-shadow-md">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CenterTotal = ({ viewBox, total, label = "Total", size = "text-2xl" }) => {
  const { cx, cy } = viewBox || { cx: 0, cy: 0 };
  return (
    <text x={cx} y={cy} fill="white" textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-0.5em" className={`${size} font-bold`}>{total}</tspan>
      <tspan x={cx} dy="1.5em" className="text-[10px] text-surface-200/60 uppercase tracking-widest font-medium">{label}</tspan>
    </text>
  );
};

const BrandDetailModal = ({ brand, laptops, onClose }) => {
  const brandData = useMemo(() => laptops.filter(l => (l.brand || 'Unknown') === brand), [brand, laptops]);
  
  const getDistribution = (data, field) => {
    const map = {};
    data.forEach(item => {
      const val = item[field] || 'Unknown';
      map[val] = (map[val] || 0) + 1;
    });
    return Object.keys(map).map(name => ({ name, value: map[name] })).sort((a,b) => b.value - a.value);
  };

  const sections = [
    { title: "Model Distribution", data: getDistribution(brandData, 'model') },
    { title: "Color Distribution", data: getDistribution(brandData, 'color') },
    { title: "RAM Distribution", data: getDistribution(brandData, 'ram') },
    { title: "Storage Distribution", data: getDistribution(brandData, 'storage') },
    { title: "Graphics Card", data: getDistribution(brandData, 'graphics_card') },
    { title: "Status Distribution", data: getDistribution(brandData, 'status') },
    { title: "Processor Distribution", data: getDistribution(brandData, 'processor') },
  ];

  const renderMiniChart = (data, title) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    return (
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 flex flex-col h-full">
        <h4 className="text-[11px] font-bold text-surface-200/60 uppercase tracking-wider mb-4">{title}</h4>
        <div className="w-full h-40 relative mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.filter(d => d.value > 0)}
                innerRadius={40}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <Label content={<CenterTotal total={total} label="Units" size="text-lg" />} position="center" />
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#f1f5f9', fontSize: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1 overflow-y-auto max-h-40 pr-1 custom-scrollbar">
          {data.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            const color = COLORS[index % COLORS.length];
            return (
              <div key={item.name} className="flex flex-col py-1.5">
                <div className="flex justify-between items-center mb-1 text-[10px]">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></div>
                    <span className="text-surface-200 font-medium truncate max-w-[100px]">{item.name}</span>
                  </div>
                  <span className="text-white font-bold">{item.value} <span className="text-surface-200/40 ml-1">({percentage}%)</span></span>
                </div>
                <div className="w-full h-1 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-surface-950 border border-white/[0.1] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/[0.05] bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
              <span className="text-xl font-black text-brand-400">{brand.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">{brand}</h2>
              <p className="text-xs text-surface-200/40 font-medium">Detailed variant analysis • {brandData.length} Total Units</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-surface-200/40 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gradient-to-b from-transparent to-brand-500/[0.02]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section, idx) => (
              <div key={idx} className="h-full">
                {renderMiniChart(section.data, section.title)}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-white/[0.05] text-center bg-white/[0.01]">
          <p className="text-[10px] font-bold text-surface-200/20 uppercase tracking-[0.3em]">End of report for {brand}</p>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [laptops, setLaptops] = useState([]);
  const [trash, setTrash] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [laptopsRes, trashRes] = await Promise.all([
          supabase.from('laptops').select('*'),
          supabase.from('trash_laptops').select('*')
        ]);

        if (laptopsRes.error) throw laptopsRes.error;
        if (trashRes.error) throw trashRes.error;

        setLaptops(laptopsRes.data || []);
        setTrash(trashRes.data || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categorizeDate = (dateString) => {
    if (!dateString) return 'Older';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Older';
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const dateMonth = date.getMonth();
    const dateYear = date.getFullYear();
    if (currentYear === dateYear && currentMonth === dateMonth) return 'This Month';
    if ((currentYear === dateYear && currentMonth - 1 === dateMonth) || (currentYear - 1 === dateYear && currentMonth === 0 && dateMonth === 11)) return 'Last Month';
    return 'Older';
  };

  const datasets = useMemo(() => {
    const availabilityMap = { Available: 0, Assigned: 0, Maintenance: 0, Retired: 0 };
    laptops.forEach(l => { if (availabilityMap[l.status] !== undefined) availabilityMap[l.status]++; });
    const availabilityData = Object.keys(availabilityMap).map(name => ({ name, value: availabilityMap[name] }));

    let defective = 0;
    let nonDefective = 0;
    laptops.forEach(l => { if (l.is_defective === true || l.status === 'Defective') defective++; else nonDefective++; });
    const defectiveData = [ { name: 'Defective', value: defective }, { name: 'Non-Defective', value: nonDefective } ];

    const incomingMap = { 'This Month': 0, 'Last Month': 0, 'Older': 0 };
    laptops.forEach(l => { incomingMap[categorizeDate(l.purchase_date)]++; });
    const incomingData = Object.keys(incomingMap).map(name => ({ name, value: incomingMap[name] }));

    const outgoingMap = { 'This Month': 0, 'Last Month': 0, 'Older': 0 };
    trash.forEach(t => { outgoingMap[categorizeDate(t.deleted_at)]++; });
    const outgoingData = Object.keys(outgoingMap).map(name => ({ name, value: outgoingMap[name] }));

    let remainingAvailable = 0;
    let inUse = 0;
    laptops.forEach(l => { if (l.status === 'Available') remainingAvailable++; else if (l.status === 'Assigned' || l.status === 'Maintenance') inUse++; });
    const remainingData = [ { name: 'Available', value: remainingAvailable }, { name: 'In Use', value: inUse } ];

    const brandMap = {};
    laptops.forEach(l => { const brand = l.brand || 'Unknown'; brandMap[brand] = (brandMap[brand] || 0) + 1; });
    const variantData = Object.keys(brandMap).map(name => ({ name, value: brandMap[name] })).sort((a,b) => b.value - a.value);

    const varAvailMap = {};
    laptops.forEach(l => {
      if (l.status === 'Available' || l.status === 'Assigned') {
        const brand = l.brand || 'Unknown';
        if (!varAvailMap[brand]) varAvailMap[brand] = { available: 0, assigned: 0 };
        if (l.status === 'Available') varAvailMap[brand].available++;
        if (l.status === 'Assigned') varAvailMap[brand].assigned++;
      }
    });
    const variantAvailabilityData = Object.keys(varAvailMap).map(name => ({
      name,
      value: varAvailMap[name].available + varAvailMap[name].assigned,
      available: varAvailMap[name].available,
      assigned: varAvailMap[name].assigned
    })).sort((a,b) => b.value - a.value);

    return { availabilityData, defectiveData, incomingData, outgoingData, remainingData, variantData, variantAvailabilityData };
  }, [laptops, trash]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner mx-auto border-surface-200 border-t-brand-500 w-8 h-8 rounded-full border-2 animate-spin"></div>
      </div>
    );
  }

  const renderChart = (data, title, isVariantAvail = false, isClickable = false) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    const chartData = data.filter(d => d.value > 0);

    return (
      <DashboardCard title={title}>
        <div className="w-full h-64 mb-6 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={65}
                outerRadius={95}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
                label={CustomLabel}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <Label content={<CenterTotal total={total} />} position="center" />
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#f1f5f9', fontSize: '12px' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full h-px bg-white/[0.08] mb-6"></div>
        <div className="w-full flex flex-col gap-1">
          {data.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            const color = COLORS[index % COLORS.length];
            return (
              <div 
                key={item.name} 
                className={`flex flex-col py-2 group ${isClickable ? 'cursor-pointer' : ''}`}
                onClick={() => isClickable && setSelectedBrand(item.name)}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></div>
                    <span className="text-xs font-semibold text-surface-200 group-hover:text-brand-400 transition-colors">
                      {item.name}
                      {isVariantAvail && <span className="ml-2 text-[10px] text-surface-200/40 font-normal">
                        (Avail: {item.available} | Assig: {item.assigned})
                      </span>}
                    </span>
                    {isClickable && (
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-brand-400/60 font-bold ml-1 flex items-center gap-1">
                        View Details <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-white">{item.value}</span>
                    <span className="text-[10px] font-medium text-surface-200/40 w-10 text-right">{percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-auto pt-4 flex justify-center">
          <div className="px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
            <span className="text-[10px] font-bold text-surface-200/30 uppercase tracking-[0.2em]">Total Units: <span className="text-brand-400">{total}</span></span>
          </div>
        </div>
      </DashboardCard>
    );
  };

  return (
    <div className="relative">
      <div className="animate-fade-in grid grid-cols-1 xl:grid-cols-2 gap-8 pb-12">
        {renderChart(datasets.availabilityData, "1. Laptop Availability")}
        {renderChart(datasets.defectiveData, "2. Defective Products")}
        {renderChart(datasets.incomingData, "3. Incoming Laptops")}
        {renderChart(datasets.outgoingData, "4. Outgoing Laptops")}
        {renderChart(datasets.remainingData, "5. Remaining Laptops")}
        {renderChart(datasets.variantData, "6. Variant Chart", false, true)}
        {renderChart(datasets.variantAvailabilityData, "7. Variant Availability", true, true)}
      </div>

      {selectedBrand && (
        <BrandDetailModal 
          brand={selectedBrand} 
          laptops={laptops} 
          onClose={() => setSelectedBrand(null)} 
        />
      )}
    </div>
  );
};

export default Dashboard;
