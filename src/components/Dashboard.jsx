import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';

const COLORS = {
  indigo: '#6366f1',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  cyan: '#22d3ee',
  purple: '#8b5cf6',
  slate: '#94a3b8'
};

const CHART_COLORS = [COLORS.indigo, COLORS.cyan, COLORS.amber, COLORS.emerald, COLORS.red, COLORS.purple, '#f97316'];

// Helper for animated numbers
const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    if (start === end) {
      setDisplayValue(end);
      return;
    }
    let totalMilisecondDuraton = 1000;
    let incrementTime = (totalMilisecondDuraton / end) > 10 ? (totalMilisecondDuraton / end) : 10;
    let timer = setInterval(() => {
      start += Math.ceil(end / 50);
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, incrementTime);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{displayValue}</span>;
};

const StatCard = ({ label, value, icon, gradient, trend }) => (
  <div className={`relative overflow-hidden bg-surface-950 border border-white/10 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-white/20`}>
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 blur-3xl -mr-16 -mt-16`}></div>
    <div className="relative flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-surface-200/50 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-3xl font-black text-white tracking-tight">
          <AnimatedNumber value={value} />
        </h3>
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-emerald-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            <span>+12%</span>
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shadow-black/20`}>
        {icon}
      </div>
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

const CenterTotal = ({ viewBox, total, label = "Total" }) => {
  const { cx, cy } = viewBox || { cx: 0, cy: 0 };
  return (
    <text x={cx} y={cy} fill="white" textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-0.5em" className="text-3xl font-black">{total}</tspan>
      <tspan x={cx} dy="1.5em" className="text-[10px] text-surface-200/40 uppercase tracking-[0.2em] font-bold">{label}</tspan>
    </text>
  );
};

const BrandDetailModal = ({ brand, laptops, onClose }) => {
  const [activeTab, setActiveTab] = useState('specs');
  const brandData = useMemo(() => laptops.filter(l => (l.brand || 'Unknown') === brand), [brand, laptops]);
  
  const getDistribution = (data, field) => {
    const map = {};
    data.forEach(item => {
      const val = item[field] || 'Unknown';
      map[val] = (map[val] || 0) + 1;
    });
    return Object.keys(map).map(name => ({ name, value: map[name] })).sort((a,b) => b.value - a.value);
  };

  const specsSections = [
    { title: "Model Lineup", field: 'model' },
    { title: "RAM Config", field: 'ram' },
    { title: "Storage Space", field: 'storage' },
    { title: "Processors", field: 'processor' },
    { title: "Graphics", field: 'graphics' },
    { title: "Color Ways", field: 'color' },
  ];

  const renderMiniChart = (data, title) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col h-full transition-all hover:bg-white/10">
        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">{title}</h4>
        <div className="w-full h-40 relative mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.filter(d => d.value > 0)} innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value" stroke="none">
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                <Label content={<CenterTotal total={total} label="Units" />} position="center" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 overflow-y-auto max-h-48 pr-2 custom-scrollbar">
          {data.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            const color = CHART_COLORS[index % CHART_COLORS.length];
            return (
              <div key={item.name} className="bg-black/20 rounded-lg p-2 group">
                <div className="flex justify-between items-center text-[10px] mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></div>
                    <span className="text-surface-200 font-bold group-hover:text-white transition-colors truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <span className="text-white font-black">{item.value} <span className="text-surface-200/30 ml-1">({percentage}%)</span></span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-surface-950/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(99,102,241,0.2)] flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="relative px-8 py-8 border-b border-white/5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                <span className="text-3xl font-black text-white">{brand.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter mb-1">{brand}</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                    <span className="text-[10px] font-bold text-surface-200/50 uppercase tracking-widest">Total Stock:</span>
                    <span className="text-xs font-black text-indigo-400">{brandData.length}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    <span className="text-[10px] font-bold text-emerald-400/50 uppercase tracking-widest">Available:</span>
                    <span className="text-xs font-black text-emerald-400">{brandData.filter(l => l.status === 'Available').length}</span>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-surface-200 hover:text-white hover:bg-red-500/20 transition-all active:scale-90 border border-white/10">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-8 py-4 gap-4 bg-black/20">
          {['specs', 'status'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-surface-200/40 hover:text-white hover:bg-white/5'}`}
            >
              {tab} Details
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'specs' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {specsSections.map((s, i) => <div key={i}>{renderMiniChart(getDistribution(brandData, s.field), s.title)}</div>)}
            </div>
          ) : (
            <div className="max-w-xl mx-auto animate-fade-in">
              {renderMiniChart(getDistribution(brandData, 'status'), "Availability Status")}
            </div>
          )}
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
  const [now, setNow] = useState(new Date());

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
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const categorizeDate = (dateString) => {
    if (!dateString) return 'Older';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Older';
    const current = new Date();
    if (date.getMonth() === current.getMonth() && date.getFullYear() === current.getFullYear()) return 'This Month';
    const lastMonth = new Date(); lastMonth.setMonth(lastMonth.getMonth() - 1);
    if (date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear()) return 'Last Month';
    return 'Older';
  };

  const datasets = useMemo(() => {
    // 1. Availability
    const availMap = { Available: 0, Assigned: 0, Maintenance: 0, Retired: 0 };
    laptops.forEach(l => { if (availMap[l.status] !== undefined) availMap[l.status]++; });
    
    // 2. Defective
    let defective = 0;
    laptops.forEach(l => { if (l.is_defective === true || l.status === 'Defective') defective++; });
    const defectiveData = [ { name: 'Defective', value: defective }, { name: 'Functional', value: laptops.length - defective } ];

    // 3. Incoming
    const inMap = { 'This Month': 0, 'Last Month': 0, 'Older': 0 };
    laptops.forEach(l => { inMap[categorizeDate(l.purchase_date)]++; });

    // 4. Outgoing
    const outMap = { 'This Month': 0, 'Last Month': 0, 'Older': 0 };
    trash.forEach(t => { outMap[categorizeDate(t.deleted_at)]++; });

    // 5. Brand Merged
    const brandMap = {};
    laptops.forEach(l => {
      const brand = l.brand || 'Unknown';
      if (!brandMap[brand]) brandMap[brand] = { name: brand, value: 0, available: 0, assigned: 0 };
      brandMap[brand].value++;
      if (l.status === 'Available') brandMap[brand].available++;
      if (l.status === 'Assigned') brandMap[brand].assigned++;
    });
    const variantData = Object.values(brandMap).sort((a,b) => b.value - a.value);

    return {
      availability: Object.keys(availMap).map(name => ({ name, value: availMap[name] })),
      defective: defectiveData,
      incoming: Object.keys(inMap).map(name => ({ name, value: inMap[name] })),
      outgoing: Object.keys(outMap).map(name => ({ name, value: outMap[name] })),
      brands: variantData,
      summary: {
        total: laptops.length,
        available: availMap.Available,
        assigned: availMap.Assigned,
        defective
      }
    };
  }, [laptops, trash]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner mx-auto border-surface-200 border-t-brand-500 w-12 h-12 rounded-full border-4 animate-spin"></div>
      </div>
    );
  }

  const renderChartCard = (data, title, type = "normal") => {
    const total = data.reduce((acc, item) => acc + (item.value || 0), 0);
    const chartData = data.filter(d => d.value > 0);

    return (
      <div className="group relative bg-surface-950 border border-white/10 rounded-[2rem] p-6 shadow-xl shadow-indigo-500/5 transition-all duration-500 hover:scale-[1.01] hover:border-white/20 hover:shadow-indigo-500/10 flex flex-col mb-8 break-inside-avoid">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          </div>
          <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{total} Total</span>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full h-64 relative mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} innerRadius={65} outerRadius={95} paddingAngle={5} dataKey="value" stroke="none" label={CustomLabel}>
                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                <Label content={<CenterTotal total={total} />} position="center" />
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#f1f5f9', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          {data.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            const color = CHART_COLORS[index % CHART_COLORS.length];
            return (
              <div 
                key={item.name} 
                className={`bg-white/5 rounded-xl p-3 flex flex-col gap-2 transition-all hover:bg-white/10 ${type === "brand" ? "cursor-pointer" : ""}`}
                onClick={() => type === "brand" && setSelectedBrand(item.name)}
              >
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-surface-200/30 w-5">#{index + 1}</span>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                    <span className="text-surface-200 font-bold group-hover:text-white transition-colors">
                      {item.name}
                      {type === "brand" && <span className="ml-2 text-[10px] text-surface-200/40 font-normal">(Avail: {item.available})</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-white">{item.value}</span>
                    <span className="text-xs font-medium text-surface-200/40 w-10 text-right">{percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-[2.5rem] p-10 mb-10 shadow-2xl shadow-indigo-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-md border border-white/20">
              <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Live Analytics</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-4">Analytics Overview</h1>
          <div className="flex items-center gap-6 text-white/60 text-sm font-bold">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Last Updated: {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard label="Total Inventory" value={datasets.summary.total} icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} gradient="from-blue-500 to-indigo-600" trend={true} />
        <StatCard label="Available Units" value={datasets.summary.available} icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} gradient="from-emerald-500 to-teal-600" />
        <StatCard label="Assigned Laptops" value={datasets.summary.assigned} icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} gradient="from-purple-500 to-indigo-600" />
        <StatCard label="Defective Units" value={datasets.summary.defective} icon={<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} gradient="from-red-500 to-orange-600" />
      </div>

      {/* Charts Grid */}
      <div className="columns-1 md:columns-2 gap-8 pb-12">
        {renderChartCard(datasets.availability, "Device Status Distribution")}
        {renderChartCard(datasets.defective, "Health Overview")}
        {renderChartCard(datasets.incoming, "Acquisition Trends")}
        {renderChartCard(datasets.outgoing, "Disposal Analysis")}
        {renderChartCard(datasets.brands, "Brand Market Share", "brand")}
      </div>

      {selectedBrand && <BrandDetailModal brand={selectedBrand} laptops={laptops} onClose={() => setSelectedBrand(null)} />}
    </div>
  );
};

export default Dashboard;
