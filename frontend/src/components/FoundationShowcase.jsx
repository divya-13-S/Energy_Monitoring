import React, { useState } from 'react';
import {
  FiZap,
  FiActivity,
  FiAlertTriangle,
  FiCpu,
  FiTrendingUp,
  FiShield,
  FiCheckCircle,
  FiRefreshCw,
  FiSliders,
} from 'react-icons/fi';
import KpiCard from './common/KpiCard/KpiCard';
import ChartCard from './common/ChartCard/ChartCard';
import AlertCard from './common/AlertCard/AlertCard';
import StatusCard from './common/StatusCard/StatusCard';
import DataTable from './common/DataTable/DataTable';
import Button from './common/Button/Button';
import Badge from './common/Badge/Badge';
import Input from './common/Input/Input';
import Select from './common/Select/Select';
import Skeleton from './common/Skeleton/Skeleton';
import EmptyState from './common/EmptyState/EmptyState';
import ErrorState from './common/ErrorState/ErrorState';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const mockChartData = [
  { time: '00:00', kWh: 120, solar: 0 },
  { time: '04:00', kWh: 95, solar: 0 },
  { time: '08:00', kWh: 340, solar: 110 },
  { time: '12:00', kWh: 520, solar: 380 },
  { time: '16:00', kWh: 480, solar: 290 },
  { time: '20:00', kWh: 210, solar: 40 },
];

const mockTableColumns = [
  { key: 'nodeId', title: 'Meter / Node ID', sortable: true },
  { key: 'building', title: 'Building / Block', sortable: true },
  { key: 'loadKwh', title: 'Current Load (kW)', sortable: true },
  {
    key: 'status',
    title: 'Grid Status',
    render: (val) => (
      <Badge variant={val === 'Optimal' ? 'success' : 'warning'} dot>
        {val}
      </Badge>
    ),
  },
  { key: 'efficiency', title: 'Efficiency Factor' },
];

const mockTableData = [
  { id: '1', nodeId: 'EM-BLDG-A01', building: 'Engineering Block A', loadKwh: '42.5 kW', status: 'Optimal', efficiency: '98.2%' },
  { id: '2', nodeId: 'EM-BLDG-B04', building: 'Science Lab Block B', loadKwh: '88.1 kW', status: 'High Load', efficiency: '91.4%' },
  { id: '3', nodeId: 'EM-BLDG-C02', building: 'Library & Admin', loadKwh: '18.3 kW', status: 'Optimal', efficiency: '99.1%' },
  { id: '4', nodeId: 'EM-SOLAR-PV1', building: 'Main Rooftop Solar', loadKwh: '145.0 kW', status: 'Optimal', efficiency: '97.8%' },
];

const FoundationShowcase = ({ role = 'Administrator', section, mode }) => {
  const [currentPage, setCurrentPage] = useState(1);

  if (mode === 'login') {
    return (
      <div className="login-showcase">
        <h2 className="text-xl font-bold mb-2">System Login Foundation</h2>
        <p className="text-sm text-secondary mb-6">
          AuthLayout & Protected Route architecture ready for integration.
        </p>

        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
          <Input label="Institutional Email" placeholder="user@institution.edu" isRequired />
          <Input label="Password" type="password" placeholder="••••••••" isRequired />
          <Select
            label="Role Select (Testing)"
            options={[
              { label: 'Administrator', value: 'Administrator' },
              { label: 'Department Staff (HOD)', value: 'Department Staff (HOD)' },
              { label: 'Electrician / Maintenance', value: 'Electrician / Maintenance Staff' },
            ]}
          />
          <Button variant="primary" fullWidth type="submit">
            Sign In to Smart Grid
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="foundation-showcase flex flex-col gap-6">
      {/* Header Banner */}
      <div className="card glass-card flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan" size="md">
              {role} Role Active
            </Badge>
            <Badge variant="primary" size="md">
              React Foundation Ready
            </Badge>
          </div>
          <h2 className="text-2xl font-bold">
            {section ? `${section}` : `${role} Dashboard Foundation`}
          </h2>
          <p className="text-sm text-secondary">
            AI-Based Smart Energy Consumption Monitoring & Optimization Foundation Setup
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" icon={FiRefreshCw}>
            Sync Metrics
          </Button>
          <Button variant="primary" icon={FiZap}>
            Optimize Grid
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-4 gap-4">
        <KpiCard
          title="Total Campus Power"
          value="482.4"
          unit="kW"
          change="-4.2%"
          changeType="positive"
          icon={FiZap}
          iconBgVariant="primary"
        />
        <KpiCard
          title="Solar Generation"
          value="185.0"
          unit="kWh"
          change="+18.5%"
          changeType="positive"
          icon={FiActivity}
          iconBgVariant="cyan"
        />
        <KpiCard
          title="Peak Anomaly Load"
          value="94.2"
          unit="kW"
          change="+12.1%"
          changeType="negative"
          icon={FiAlertTriangle}
          iconBgVariant="warning"
        />
        <KpiCard
          title="AI Efficiency Rating"
          value="96.8"
          unit="%"
          change="+2.4%"
          changeType="positive"
          icon={FiCpu}
          iconBgVariant="info"
        />
      </div>

      {/* Analytics Chart & Alerts Side-by-Side */}
      <div className="grid grid-3 gap-6">
        <div style={{ gridColumn: 'span 2' }}>
          <ChartCard
            title="Real-Time Energy Consumption vs Solar Output"
            subtitle="24-hour campus telemetry data curve"
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="time" stroke="var(--text-tertiary)" fontSize={12} />
                <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                />
                <Area type="monotone" dataKey="kWh" stroke="#10b981" fillOpacity={1} fill="url(#colorKwh)" name="Grid Consumption (kW)" />
                <Area type="monotone" dataKey="solar" stroke="#06b6d4" fillOpacity={1} fill="url(#colorSolar)" name="Solar PV (kW)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold">Grid Diagnostics</h3>
          <AlertCard
            title="Transformer #3 Overload"
            message="Voltage harmonic distortion detected."
            location="Substation 2"
            timestamp="5m ago"
            severity="danger"
            status="Critical"
          />
          <StatusCard
            name="Rooftop Solar PV Array"
            code="NODE-PV-904"
            status="online"
            location="Block A Roof"
            lastReading="145.0 kW"
            voltage="415 V"
            signalStrength={94}
          />
        </div>
      </div>

      {/* Telemetry Data Table Showcase */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold">IoT Substation Telemetry Table</h3>
          <Badge variant="neutral">4 Active Nodes</Badge>
        </div>
        <DataTable
          columns={mockTableColumns}
          data={mockTableData}
          pagination={{
            currentPage,
            totalPages: 1,
            totalItems: mockTableData.length,
            itemsPerPage: 5,
            onPageChange: (p) => setCurrentPage(p),
          }}
        />
      </div>
    </div>
  );
};

export default FoundationShowcase;
