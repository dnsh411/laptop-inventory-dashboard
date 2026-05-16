import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316'];

const DashboardCard = ({ title, children }) => (
  <div className="bg-surface-950 border border-white/[0.06] rounded-2xl p-5 shadow-lg flex flex-col items-center">
    <h3 className="text-sm font-bold text-surface-200 mb-4 w-full text-left">{title}</h3>
    <div className="w-full h-64">
      {children}
    </div>
  </div>
);

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent === 0) return null;

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold drop-shadow-md">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CenterTotal = ({ viewBox, total }) => {
  const { cx, cy } = viewBox;
  return (
    <text x={cx} y={cy} fill="white" textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-0.5em" className="text-2xl font-bold">{total}</tspan>
      <tspan x={cx} dy="1.5em" className="text-[10px] text-surface-200/60 uppercase tracking-widest">Total</tspan>
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

    if (currentYear === dateYear && currentMonth === dateMonth) {
      return 'This Month';
    } else if (
      (currentYear === dateYear && currentMonth - 1 === dateMonth) ||
      (currentYear - 1 === dateYear && currentMonth === 0 && dateMonth === 11)
    ) {
      return 'Last Month';
    }
    return 'Older';
  };

  const datasets = useMemo(() => {
    // 1. Laptop Availability
    const availabilityMap = { Available: 0, Assigned: 0, Maintenance: 0, Retired: 0 };
    laptops.forEach(l => {
      if (availabilityMap[l.status] !== undefined) {
        availabilityMap[l.status]++;
      } else {
        availabilityMap['Available']++; // fallback
      }
    });
    const availabilityData = Object.keys(availabilityMap)
      .map(name => ({ name, value: availabilityMap[name] }))
      .filter(d => d.value > 0);

    // 2. Defective Products
    let defective = 0;
    let nonDefective = 0;
    laptops.forEach(l => {
      if (l.is_defective === true || l.status === 'Defective') {
        defective++;
      } else {
        nonDefective++;
      }
    });
    const defectiveData = [
      { name: 'Defective', value: defective },
      { name: 'Non-Defective', value: nonDefective }
    ].filter(d => d.value > 0);

    // 3. Incoming Laptops
    const incomingMap = { 'This Month': 0, 'Last Month': 0, 'Older': 0 };
    laptops.forEach(l => {
      incomingMap[categorizeDate(l.purchase_date)]++;
    });
    const incomingData = Object.keys(incomingMap)
      .map(name => ({ name, value: incomingMap[name] }))
      .filter(d => d.value > 0);

    // 4. Outgoing Laptops
    const outgoingMap = { 'This Month': 0, 'Last Month': 0, 'Older': 0 };
    trash.forEach(t => {
      outgoingMap[categorizeDate(t.deleted_at)]++;
    });
    const outgoingData = Object.keys(outgoingMap)
      .map(name => ({ name, value: outgoingMap[name] }))
      .filter(d => d.value > 0);

    // 5. Remaining Laptops
    let remainingAvailable = 0;
    let inUse = 0;
    laptops.forEach(l => {
      if (l.status === 'Available') remainingAvailable++;
      else if (l.status === 'Assigned' || l.status === 'Maintenance') inUse++;
    });
    const remainingData = [
      { name: 'Available', value: remainingAvailable },
      { name: 'In Use', value: inUse }
    ].filter(d => d.value > 0);

    // 6. Variant Chart (Brands)
    const brandMap = {};
    laptops.forEach(l => {
      const brand = l.brand || 'Unknown';
      brandMap[brand] = (brandMap[brand] || 0) + 1;
    });
    const variantData = Object.keys(brandMap)
      .map(name => ({ name, value: brandMap[name] }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);

    // 7. Variant Availability
    const variantAvailabilityMap = {};
    laptops.forEach(l => {
      if (l.status === 'Available' || l.status === 'Assigned') {
        const brand = l.brand || 'Unknown';
        const key = `${brand} - ${l.status}`;
        variantAvailabilityMap[key] = (variantAvailabilityMap[key] || 0) + 1;
      }
    });
    const variantAvailabilityData = Object.keys(variantAvailabilityMap)
      .map(name => ({ name, value: variantAvailabilityMap[name] }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);

    return {
      availabilityData,
      defectiveData,
      incomingData,
      outgoingData,
      remainingData,
      variantData,
      variantAvailabilityData
    };
  }, [laptops, trash]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner mx-auto border-surface-200 border-t-brand-500 w-8 h-8 rounded-full border-2 animate-spin"></div>
      </div>
    );
  }

  const renderChart = (data, title) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    return (
      <DashboardCard title={title}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              labelLine={false}
              label={CustomLabel}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
              <CustomLabel viewBox={{ cx: '50%', cy: '50%' }} total={total} content={<CenterTotal total={total} />} />
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </DashboardCard>
    );
  };

  return (
    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
      {renderChart(datasets.availabilityData, "1. Laptop Availability")}
      {renderChart(datasets.defectiveData, "2. Defective Products")}
      {renderChart(datasets.incomingData, "3. Incoming Laptops")}
      {renderChart(datasets.outgoingData, "4. Outgoing Laptops")}
      {renderChart(datasets.remainingData, "5. Remaining Laptops")}
      {renderChart(datasets.variantData, "6. Variant Chart")}
      {renderChart(datasets.variantAvailabilityData, "7. Variant Availability")}
    </div>
  );
};

export default Dashboard;
