import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316'];

const DashboardCard = ({ title, children }) => (
  <div className="bg-surface-950 border border-white/[0.06] rounded-2xl p-6 shadow-xl flex flex-col w-full h-full">
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

const CenterTotal = ({ viewBox, total }) => {
  const { cx, cy } = viewBox || { cx: 0, cy: 0 };
  return (
    <text x={cx} y={cy} fill="white" textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-0.5em" className="text-2xl font-bold">{total}</tspan>
      <tspan x={cx} dy="1.5em" className="text-[10px] text-surface-200/60 uppercase tracking-widest font-medium">Total</tspan>
    </text>
  );
};

const Dashboard = () => {
  const [laptops, setLaptops] = useState([]);
  const [trash, setTrash] = useState([]);
  const [loading, setLoading] = useState(true);

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
    // 1. Laptop Availability
    const availabilityMap = { Available: 0, Assigned: 0, Maintenance: 0, Retired: 0 };
    laptops.forEach(l => { if (availabilityMap[l.status] !== undefined) availabilityMap[l.status]++; });
    const availabilityData = Object.keys(availabilityMap).map(name => ({ name, value: availabilityMap[name] }));

    // 2. Defective Products
    let defective = 0;
    let nonDefective = 0;
    laptops.forEach(l => { if (l.is_defective === true || l.status === 'Defective') defective++; else nonDefective++; });
    const defectiveData = [ { name: 'Defective', value: defective }, { name: 'Non-Defective', value: nonDefective } ];

    // 3. Incoming Laptops
    const incomingMap = { 'This Month': 0, 'Last Month': 0, 'Older': 0 };
    laptops.forEach(l => { incomingMap[categorizeDate(l.purchase_date)]++; });
    const incomingData = Object.keys(incomingMap).map(name => ({ name, value: incomingMap[name] }));

    // 4. Outgoing Laptops
    const outgoingMap = { 'This Month': 0, 'Last Month': 0, 'Older': 0 };
    trash.forEach(t => { outgoingMap[categorizeDate(t.deleted_at)]++; });
    const outgoingData = Object.keys(outgoingMap).map(name => ({ name, value: outgoingMap[name] }));

    // 5. Remaining Laptops
    let remainingAvailable = 0;
    let inUse = 0;
    laptops.forEach(l => { if (l.status === 'Available') remainingAvailable++; else if (l.status === 'Assigned' || l.status === 'Maintenance') inUse++; });
    const remainingData = [ { name: 'Available', value: remainingAvailable }, { name: 'In Use', value: inUse } ];

    // 6. Variant Chart (Brands)
    const brandMap = {};
    laptops.forEach(l => { const brand = l.brand || 'Unknown'; brandMap[brand] = (brandMap[brand] || 0) + 1; });
    const variantData = Object.keys(brandMap).map(name => ({ name, value: brandMap[name] })).sort((a,b) => b.value - a.value);

    // 7. Variant Availability
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

  const renderChart = (data, title, isVariantAvail = false) => {
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
                labelLine={false}
                label={CustomLabel}
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <Label content={<CenterTotal total={total} />} position="center" />
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                itemStyle={{ color: '#f1f5f9', fontSize: '12px' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Divider line */}
        <div className="w-full h-px bg-white/[0.08] mb-6"></div>

        {/* Breakdown List */}
        <div className="w-full flex flex-col gap-1">
          {data.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            const color = COLORS[index % COLORS.length];
            return (
              <div key={item.name} className="flex flex-col py-2 group">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: color }}></div>
                    <span className="text-xs font-semibold text-surface-200 group-hover:text-white transition-colors">
                      {item.name}
                      {isVariantAvail && <span className="ml-2 text-[10px] text-surface-200/40 font-normal">
                        (Avail: {item.available} | Assig: {item.assigned})
                      </span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-white">{item.value}</span>
                    <span className="text-[10px] font-medium text-surface-200/40 w-10 text-right">{percentage}%</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700 ease-out" 
                    style={{ width: `${percentage}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}33` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total at bottom */}
        <div className="mt-auto pt-4 flex justify-center">
          <div className="px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
            <span className="text-[10px] font-bold text-surface-200/30 uppercase tracking-[0.2em]">
              Total Units: <span className="text-brand-400">{total}</span>
            </span>
          </div>
        </div>
      </DashboardCard>
    );
  };

  return (
    <div className="animate-fade-in grid grid-cols-1 xl:grid-cols-2 gap-8 pb-12">
      {renderChart(datasets.availabilityData, "1. Laptop Availability")}
      {renderChart(datasets.defectiveData, "2. Defective Products")}
      {renderChart(datasets.incomingData, "3. Incoming Laptops")}
      {renderChart(datasets.outgoingData, "4. Outgoing Laptops")}
      {renderChart(datasets.remainingData, "5. Remaining Laptops")}
      {renderChart(datasets.variantData, "6. Variant Chart")}
      {renderChart(datasets.variantAvailabilityData, "7. Variant Availability", true)}
    </div>
  );
};

export default Dashboard;
