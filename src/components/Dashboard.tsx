import React from 'react';
import { InventarioItem, Sistema } from '../types';
import {
  Package,
  Truck,
  CheckCircle2,
  Box,
  DollarSign,
  AlertTriangle,
  Clock,
  Bus,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardProps {
  items: InventarioItem[];
  onNavigateToChecklist: () => void;
  onNavigateToItems: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  items,
  onNavigateToChecklist,
  onNavigateToItems
}) => {
  // Metric calculations
  const totalItemsCount = items.length;
  const totalUnitsCount = items.reduce((acc, curr) => acc + (curr.quantidade || 1), 0);

  // Status Ida counts
  const statusIdaPacked = items.filter((i) => i.status_ida === 'Embalado' || i.status_ida === 'Despachado').length;
  const pctIdaPacked = totalItemsCount > 0 ? Math.round((statusIdaPacked / totalItemsCount) * 100) : 0;

  // Status Chegada counts
  const statusChegadaReceived = items.filter((i) => i.status_chegada === 'Recebido no Paddock').length;
  const pctChegada = totalItemsCount > 0 ? Math.round((statusChegadaReceived / totalItemsCount) * 100) : 0;

  // Status Volta counts
  const statusVoltaReturned = items.filter((i) => i.status_volta === 'Retornou à Oficina').length;
  const statusVoltaDamaged = items.filter((i) => i.status_volta === 'Avariado/Perdido').length;

  // Unique Boxes
  const uniqueBoxes = Array.from(new Set(items.map((i) => i.caixa).filter(Boolean)));
  const dispatchedBoxes = Array.from(
    new Set(
      items
        .filter((i) => i.status_ida === 'Despachado')
        .map((i) => i.caixa)
        .filter(Boolean)
    )
  ).length;

  // Total Estimated Value
  const totalEstimatedValue = items.reduce((acc, i) => {
    if (i.valor_estimado && i.valor_estimado > 0) {
      return acc + i.valor_estimado * (i.quantidade || 1);
    }
    return acc;
  }, 0);

  // Transport Split Data
  const transportSenai = items.filter((i) => i.transporte === 'SENAI').length;
  const transportOnibus = items.filter((i) => i.transporte === 'ÔNIBUS').length;

  const transportData = [
    { name: 'SENAI (Caminhão)', value: transportSenai, color: '#f97316' },
    { name: 'ÔNIBUS (Equipe)', value: transportOnibus, color: '#3b82f6' }
  ];

  // Systems Breakdown Data
  const SISTEMAS_LIST: Sistema[] = [
    'Oficina',
    'Baja',
    'Eletrônica',
    'Drivetrain',
    'Frame & Body',
    'Freios',
    'Gerenciamento',
    'Suspensão',
    'Powertrain'
  ];

  const systemStatusData = SISTEMAS_LIST.map((sis) => {
    const sysItems = items.filter((i) => i.sistema === sis);
    const embalados = sysItems.filter((i) => i.status_ida === 'Embalado').length;
    const despachados = sysItems.filter((i) => i.status_ida === 'Despachado').length;
    const pendentes = sysItems.filter((i) => i.status_ida === 'Pendente').length;

    return {
      sistema: sis,
      Pendente: pendentes,
      Embalado: embalados,
      Despachado: despachados,
      total: sysItems.length
    };
  });

  // High Value / Critical Items
  const highValueItems = [...items]
    .filter((i) => (i.valor_estimado || 0) >= 300)
    .sort((a, b) => (b.valor_estimado || 0) - (a.valor_estimado || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl p-6 border border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold mb-2">
            <span>🏁 LOGÍSTICA KRT DE COMPETIÇÃO</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Paddock & Operações de Viagem
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Acompanhe o empacotamento, envio SENAI/ÔNIBUS e conferência de retorno das caixas por subdomínio.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onNavigateToChecklist}
            className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-sm flex items-center space-x-2 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Abrir Checklist de Viagem</span>
          </button>
          <button
            onClick={onNavigateToItems}
            className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-600 flex items-center space-x-2 transition"
          >
            <Package className="w-4 h-4" />
            <span>Ver Inventário</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Row - Design Theme Metric Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Total Itens */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            Total de Itens
          </p>
          <p className="text-3xl font-mono font-bold text-slate-900">{totalItemsCount}</p>
          <p className="text-xs text-green-600 font-mono mt-2 flex items-center gap-1">
            <span>+</span><span>{totalUnitsCount} unidades totais</span>
          </p>
        </div>

        {/* Metric 2: Embalados para Ida */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            Embalados (Ida)
          </p>
          <p className="text-3xl font-mono font-bold text-blue-600">{pctIdaPacked}%</p>
          <div className="w-full h-1.5 bg-gray-100 mt-3 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-500"
              style={{ width: `${pctIdaPacked}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Caixas Despachadas */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            Caixas Despachadas
          </p>
          <p className="text-3xl font-mono font-bold text-red-600">{dispatchedBoxes}</p>
          <p className="text-xs text-gray-500 mt-2 font-mono">
            De {uniqueBoxes.length} caixas previstas
          </p>
        </div>

        {/* Metric 4: Patrimônio Mapeado */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            Patrimônio Estimado
          </p>
          <p className="text-2xl sm:text-3xl font-mono font-bold text-slate-900">
            {totalEstimatedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-xs text-gray-500 mt-2 font-mono">
            Ferramentas & Eletrônica
          </p>
        </div>
      </div>

      {/* Travel Cycle Stages Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stage 1: Ida */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm text-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">1</span>
              1. Ida (Oficina → Paddock)
            </h3>
            <span className="text-xs font-mono text-red-600 font-bold">{pctIdaPacked}% Pronto</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Pendente de Embalagem:</span>
              <span className="font-bold text-amber-600">
                {items.filter((i) => i.status_ida === 'Pendente').length}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Embalado na Caixa:</span>
              <span className="font-bold text-blue-600">
                {items.filter((i) => i.status_ida === 'Embalado').length}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">Despachado no Transporte:</span>
              <span className="font-bold text-emerald-600">
                {items.filter((i) => i.status_ida === 'Despachado').length}
              </span>
            </div>
          </div>
        </div>

        {/* Stage 2: Chegada */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm text-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
              2. Chegada no Evento
            </h3>
            <span className="text-xs font-mono text-blue-600 font-bold">{pctChegada}% Recebido</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Aguardando Descarregamento:</span>
              <span className="font-bold text-slate-700">
                {items.filter((i) => i.status_chegada === 'Pendente').length}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">Recebido & Conferido no Box:</span>
              <span className="font-bold text-emerald-600">{statusChegadaReceived}</span>
            </div>
          </div>
        </div>

        {/* Stage 3: Volta */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm text-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">3</span>
              3. Volta para Oficina
            </h3>
            <span className="text-xs font-mono text-emerald-600 font-bold">{statusVoltaReturned} Retornados</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Retornou em Segurança:</span>
              <span className="font-bold text-emerald-600">{statusVoltaReturned}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500">Avariado ou Perdido:</span>
              <span className={`font-bold ${statusVoltaDamaged > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {statusVoltaDamaged}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Status de Empacotamento por Sistema */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Status por Sistema (9 Sistemas)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Divisão dos itens entre Pendente, Embalado e Despachado</p>
            </div>
          </div>

          <div className="h-72 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={systemStatusData}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="sistema"
                  stroke="#64748b"
                  fontSize={10}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Pendente" stackId="a" fill="#eab308" />
                <Bar dataKey="Embalado" stackId="a" fill="#2563eb" />
                <Bar dataKey="Despachado" stackId="a" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Divisão de Transporte (SENAI vs ÔNIBUS) */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Modal de Transporte</h3>
            <p className="text-xs text-slate-400 mb-4 mt-0.5">Caminhão SENAI vs ÔNIBUS da Equipe</p>

            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={transportData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {transportData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 mt-2 pt-3 border-t border-gray-100 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-slate-600">SENAI (Caminhão)</span>
              </div>
              <span className="font-bold text-slate-900">{transportSenai} itens</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-slate-600">ÔNIBUS (Equipe)</span>
              </div>
              <span className="font-bold text-slate-900">{transportOnibus} itens</span>
            </div>
          </div>
        </div>
      </div>

      {/* High Value / Essential Items Alert Data Grid Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Itens Críticos & Alto Valor
            </h3>
            <p className="text-[11px] text-slate-500">
              Acompanhamento de segurança para equipamentos caros e prioritários
            </p>
          </div>
          <button
            onClick={onNavigateToItems}
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            Ver todos ({items.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-mono">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase">
              <tr>
                <th className="p-3">Item / Equipamento</th>
                <th className="p-3">Sistema</th>
                <th className="p-3">Caixa</th>
                <th className="p-3">Valor Estimado</th>
                <th className="p-3">Transporte</th>
                <th className="p-3">Status Ida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {highValueItems.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/60 transition">
                  <td className="p-3 font-semibold text-slate-900 font-sans">
                    {item.item}
                    {item.descricao && (
                      <div className="text-[10px] text-gray-500 font-normal">{item.descricao}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-slate-700 text-[10px]">
                      {item.sistema}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-red-600">{item.caixa}</td>
                  <td className="p-3 font-bold text-emerald-700">
                    {(item.valor_estimado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.transporte === 'SENAI'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.transporte}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.status_ida === 'Despachado'
                          ? 'bg-green-100 text-green-800'
                          : item.status_ida === 'Embalado'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status_ida}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
