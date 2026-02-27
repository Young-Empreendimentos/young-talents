import React, { useState, useMemo } from 'react';
import { BarChart3, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

import { PIPELINE_STAGES } from '../constants';
import { getCandidateTimestamp } from '../utils/timestampUtils';
import { normalizeCity } from '../utils/cityNormalizer';
import { normalizeSource } from '../utils/sourceNormalizer';
import { normalizeInterestArea } from '../utils/interestAreaNormalizer';

const COLORS = ['#4285F4', '#34A853', '#FBBC04', '#EA4335', '#9C27B0', '#FF9800', '#00BCD4', '#E91E63', '#3F51B5', '#009688'];

const tooltipStyle = {
  backgroundColor: '#ffffff',
  color: '#1e293b',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  padding: '12px',
  fontSize: '14px',
  fontWeight: '500'
};

function CustomPieLegend({ allItems, hiddenSet, onToggle, colors }) {
  return (
    <div className="flex flex-wrap justify-center gap-3 pt-2" style={{ cursor: 'pointer' }}>
      {allItems.map((item, i) => {
        const hidden = hiddenSet.has(item.name);
        return (
          <span
            key={item.name}
            onClick={() => onToggle(item.name)}
            className="inline-flex items-center gap-1.5 text-sm"
            style={{ opacity: hidden ? 0.5 : 1 }}
          >
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
            {item.name}
          </span>
        );
      })}
    </div>
  );
}

export default function ReportsPage({ candidates = [], jobs = [], applications = [], statusMovements = [] }) {
  const [periodFilter, setPeriodFilter] = useState('all');
  const [showCustomPeriod, setShowCustomPeriod] = useState(false);
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [hiddenAreaSeries, setHiddenAreaSeries] = useState(new Set());
  const [hiddenOriginSeries, setHiddenOriginSeries] = useState(new Set());

  const filteredByPeriod = useMemo(() => {
    if (periodFilter === 'all') return candidates;
    if (periodFilter === 'custom' && customDateStart && customDateEnd) {
      const startDate = new Date(customDateStart).getTime() / 1000;
      const endDate = new Date(customDateEnd).getTime() / 1000 + 86400;
      return candidates.filter(c => {
        const ts = getCandidateTimestamp(c);
        if (!ts) return false;
        return ts >= startDate && ts <= endDate;
      });
    }
    const now = Date.now() / 1000;
    const periods = { 'today': 86400, '7d': 7 * 86400, '30d': 30 * 86400, '90d': 90 * 86400 };
    const cutoff = now - (periods[periodFilter] || 0);
    return candidates.filter(c => {
      const ts = getCandidateTimestamp(c);
      if (!ts) return false;
      return ts >= cutoff;
    });
  }, [candidates, periodFilter, customDateStart, customDateEnd]);

  const statusData = useMemo(() => {
    const counts = {};
    PIPELINE_STAGES.forEach(stage => {
      counts[stage] = filteredByPeriod.filter(c => (c.status || 'Inscrito') === stage).length;
    });
    counts['Contratado'] = filteredByPeriod.filter(c => c.status === 'Contratado').length;
    counts['Reprovado'] = filteredByPeriod.filter(c => c.status === 'Reprovado').length;
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredByPeriod]);

  const areaData = useMemo(() => {
    const areas = {};
    filteredByPeriod.forEach(c => {
      if (c.interestAreas) {
        const areasList = c.interestAreas.split(',').map(a => normalizeInterestArea(a.trim())).filter(Boolean);
        areasList.forEach(area => { areas[area] = (areas[area] || 0) + 1; });
      }
    });
    const total = filteredByPeriod.length;
    return Object.entries(areas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value, percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0 }));
  }, [filteredByPeriod]);

  const cityData = useMemo(() => {
    const cities = {};
    filteredByPeriod.forEach(c => {
      if (c.city) {
        const norm = normalizeCity(c.city);
        if (norm) cities[norm] = (cities[norm] || 0) + 1;
      }
    });
    return Object.entries(cities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [filteredByPeriod]);

  const originData = useMemo(() => {
    const origins = {};
    filteredByPeriod.forEach(c => {
      if (c.source) {
        const norm = normalizeSource(c.source);
        if (norm) origins[norm] = (origins[norm] || 0) + 1;
      }
    });
    const total = filteredByPeriod.length;
    return Object.entries(origins)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value, percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0 }));
  }, [filteredByPeriod]);

  const inscriptionsPerDayData = useMemo(() => {
    const byDay = {};
    filteredByPeriod.forEach(c => {
      const ts = getCandidateTimestamp(c);
      if (!ts) return;
      const d = new Date(ts * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      byDay[key] = (byDay[key] || 0) + 1;
    });
    return Object.entries(byDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => {
        const [, m, d] = date.split('-');
        return { date, label: `${d}/${m}`, count };
      });
  }, [filteredByPeriod]);

  const visibleAreaData = useMemo(() => {
    const all = areaData.filter(d => d.value > 0);
    const visible = all.filter(d => !hiddenAreaSeries.has(d.name));
    const sum = visible.reduce((s, d) => s + d.value, 0);
    return visible.map((d, i) => ({
      ...d,
      percentage: sum > 0 ? ((d.value / sum) * 100).toFixed(1) : 0,
      colorIndex: all.findIndex(x => x.name === d.name)
    }));
  }, [areaData, hiddenAreaSeries]);

  const visibleOriginData = useMemo(() => {
    const all = originData.filter(d => d.value > 0);
    const visible = all.filter(d => !hiddenOriginSeries.has(d.name));
    const sum = visible.reduce((s, d) => s + d.value, 0);
    return visible.map((d, i) => ({
      ...d,
      percentage: sum > 0 ? ((d.value / sum) * 100).toFixed(1) : 0,
      colorIndex: all.findIndex(x => x.name === d.name)
    }));
  }, [originData, hiddenOriginSeries]);

  const jobStats = useMemo(() => ({
    open: jobs.filter(j => j.status === 'Aberta').length,
    filled: jobs.filter(j => j.status === 'Preenchida').length,
    closed: jobs.filter(j => j.status === 'Fechada').length
  }), [jobs]);

  const handleExport = () => {
    const data = [
      ['Relatório de Candidatos e Vagas'],
      [],
      ['Estatísticas Gerais'],
      ['Total de Candidatos', candidates.length],
      ['Total de Vagas', jobs.length],
      ['Total de Candidaturas', applications.length],
      ['Total de Movimentações', statusMovements.length],
      [],
      ['Candidatos por Status'],
    ];
    const statusCounts = {};
    candidates.forEach(c => {
      const status = c.status || 'Inscrito';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    data.push(['Status', 'Quantidade']);
    Object.entries(statusCounts).forEach(([status, count]) => data.push([status, count]));
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `relatorio_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="p-6 overflow-y-auto h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm text-gray-600 dark:text-gray-400">Período:</label>
            <select
              value={periodFilter}
              onChange={e => {
                const v = e.target.value;
                setPeriodFilter(v);
                setShowCustomPeriod(v === 'custom');
                if (v !== 'custom') {
                  setCustomDateStart('');
                  setCustomDateEnd('');
                }
              }}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Todo o período</option>
              <option value="today">Hoje</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="custom">Personalizado</option>
            </select>
            {showCustomPeriod && (
              <div className="flex items-center gap-2">
                <input type="date" value={customDateStart} onChange={e => setCustomDateStart(e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm" />
                <span className="text-gray-500">até</span>
                <input type="date" value={customDateEnd} onChange={e => setCustomDateEnd(e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm" />
              </div>
            )}
            <button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Download size={18} /> Exportar Excel
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Candidatos</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filteredByPeriod.length}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Vagas</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{jobs.length}</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Candidaturas</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{applications.length}</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Movimentações</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{statusMovements.length}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Distribuição por Status */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <h3 className="font-bold text-lg mb-4">Distribuição por Status</h3>
            {statusData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 80, left: 180, bottom: 5 }}>
                  <defs>
                    <linearGradient id="reports-grad-status" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4285F4" stopOpacity={1} />
                      <stop offset="100%" stopColor="#1a56db" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" width={170} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.06)' }} formatter={(value) => [value, 'Valor']} />
                  <Bar dataKey="value" name="Valor" fill="url(#reports-grad-status)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[380px] flex items-center justify-center text-gray-500">Sem dados</div>
            )}
          </div>

          {/* Inscritos por dia */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <h3 className="font-bold text-lg mb-4">Candidatos inscritos por dia</h3>
            {inscriptionsPerDayData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={inscriptionsPerDayData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} inscrições`, 'Valor']} />
                  <Bar dataKey="count" name="Inscrições" fill="#4285F4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-500">Nenhuma inscrição no período</div>
            )}
          </div>

          {/* Áreas de Interesse */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <h3 className="font-bold text-lg mb-4">Principais Áreas de Interesse</h3>
            {areaData.length > 0 && areaData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={visibleAreaData}
                    cx="50%" cy="45%" innerRadius={60} outerRadius={100}
                    dataKey="value" label={({ value, percentage }) => `${value} (${percentage}%)`}
                  >
                    {visibleAreaData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[(entry.colorIndex ?? index) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, name]} />
                  <Legend
                    verticalAlign="bottom"
                    height={50}
                    content={() => (
                      <CustomPieLegend
                        allItems={areaData.filter(d => d.value > 0)}
                        hiddenSet={hiddenAreaSeries}
                        onToggle={name => setHiddenAreaSeries(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; })}
                        colors={COLORS}
                      />
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">Sem dados</div>
            )}
          </div>

          {/* Origem */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <h3 className="font-bold text-lg mb-4">Origem dos Candidatos</h3>
            {originData.length > 0 && originData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={visibleOriginData}
                    cx="50%" cy="45%" innerRadius={60} outerRadius={100}
                    dataKey="value" label={({ value, percentage }) => `${value} (${percentage}%)`}
                  >
                    {visibleOriginData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[(entry.colorIndex ?? index) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, name]} />
                  <Legend
                    verticalAlign="bottom"
                    height={50}
                    content={() => (
                      <CustomPieLegend
                        allItems={originData.filter(d => d.value > 0)}
                        hiddenSet={hiddenOriginSeries}
                        onToggle={name => setHiddenOriginSeries(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; })}
                        colors={COLORS}
                      />
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">Sem dados</div>
            )}
          </div>

          {/* Cidades Top 5 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <h3 className="font-bold text-lg mb-4">Candidatos por Cidade (Top 5)</h3>
            {cityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cityData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" width={110} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [value, 'Valor']} />
                  <Bar dataKey="value" name="Valor" fill="#00BCD4" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">Sem dados</div>
            )}
          </div>

          {/* Status das Vagas */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <h3 className="font-bold text-lg mb-4">Status das Vagas</h3>
            {jobStats.open > 0 || jobStats.filled > 0 || jobStats.closed > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={[
                    { name: 'Abertas', value: jobStats.open, fill: '#FBBC04' },
                    { name: 'Preenchidas', value: jobStats.filled, fill: '#34A853' },
                    { name: 'Fechadas', value: jobStats.closed, fill: '#9E9E9E' }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [value, 'Valor']} />
                  <Bar dataKey="value" name="Valor" radius={[8, 8, 0, 0]} label={{ position: 'top', fill: '#94a3b8' }}>
                    <Cell fill="#FBBC04" />
                    <Cell fill="#34A853" />
                    <Cell fill="#9E9E9E" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-gray-500">Sem dados</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
