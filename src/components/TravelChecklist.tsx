import React, { useState, useMemo } from 'react';
import {
  InventarioItem,
  Sistema,
  StatusIda,
  StatusChegada,
  StatusVolta,
  Transporte
} from '../types';
import {
  CheckCircle2,
  Clock,
  Truck,
  Filter,
  Search,
  Box,
  User,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCheck,
  RotateCcw
} from 'lucide-react';

interface TravelChecklistProps {
  items: InventarioItem[];
  onUpdateStatus: (
    itemId: string,
    stage: 'status_ida' | 'status_chegada' | 'status_volta',
    newStatus: any
  ) => Promise<void>;
  isUpdating: boolean;
}

export const TravelChecklist: React.FC<TravelChecklistProps> = ({
  items,
  onUpdateStatus,
  isUpdating
}) => {
  const [activeStage, setActiveStage] = useState<'ida' | 'chegada' | 'volta'>('ida');

  // Filters
  const [selectedSistema, setSelectedSistema] = useState<string>('todos');
  const [selectedCaixa, setSelectedCaixa] = useState<string>('todas');
  const [selectedTransporte, setSelectedTransporte] = useState<string>('todos');
  const [selectedResponsavel, setSelectedResponsavel] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique values for filter dropdowns
  const uniqueCaixas = useMemo(() => {
    const set = new Set(items.map((i) => i.caixa).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  const uniqueResponsaveis = useMemo(() => {
    const set = new Set(items.map((i) => i.responsavel).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

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

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedSistema !== 'todos' && item.sistema !== selectedSistema) return false;
      if (selectedCaixa !== 'todas' && item.caixa !== selectedCaixa) return false;
      if (selectedTransporte !== 'todos' && item.transporte !== selectedTransporte) return false;
      if (selectedResponsavel !== 'todos' && item.responsavel !== selectedResponsavel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesItem = item.item.toLowerCase().includes(q);
        const matchesDesc = (item.descricao || '').toLowerCase().includes(q);
        const matchesCaixa = (item.caixa || '').toLowerCase().includes(q);
        if (!matchesItem && !matchesDesc && !matchesCaixa) return false;
      }
      return true;
    });
  }, [items, selectedSistema, selectedCaixa, selectedTransporte, selectedResponsavel, searchQuery]);

  // Stage progress calculations
  const totalFiltered = filteredItems.length;

  const stageProgress = useMemo(() => {
    if (totalFiltered === 0) return 0;
    if (activeStage === 'ida') {
      const completed = filteredItems.filter(
        (i) => i.status_ida === 'Embalado' || i.status_ida === 'Despachado'
      ).length;
      return Math.round((completed / totalFiltered) * 100);
    } else if (activeStage === 'chegada') {
      const completed = filteredItems.filter((i) => i.status_chegada === 'Recebido no Paddock').length;
      return Math.round((completed / totalFiltered) * 100);
    } else {
      const completed = filteredItems.filter((i) => i.status_volta === 'Retornou à Oficina').length;
      return Math.round((completed / totalFiltered) * 100);
    }
  }, [filteredItems, activeStage, totalFiltered]);

  // Bulk update handler for current filtered view
  const handleBatchUpdate = async (targetStatus: any) => {
    if (filteredItems.length === 0) return;
    const stageKey =
      activeStage === 'ida'
        ? 'status_ida'
        : activeStage === 'chegada'
        ? 'status_chegada'
        : 'status_volta';

    const confirmed = window.confirm(
      `Deseja alterar o status de TODOS os ${filteredItems.length} itens exibidos para "${targetStatus}"?`
    );

    if (confirmed) {
      for (const item of filteredItems) {
        await onUpdateStatus(item.id, stageKey, targetStatus);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 uppercase font-mono">
                CHECKLIST DE OPERAÇÕES DE CAMPO
              </span>
              <span className="text-xs text-gray-500 font-mono">
                {totalFiltered} de {items.length} itens no filtro
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Conferência Rápida de Paddock por Caixa
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Altere o status de cada item diretamente abaixo. Atualizações sincronizam instantaneamente no banco de dados!
            </p>
          </div>

          {/* Quick Batch Actions */}
          <div className="flex items-center gap-2">
            {activeStage === 'ida' && (
              <button
                onClick={() => handleBatchUpdate('Despachado')}
                disabled={isUpdating || totalFiltered === 0}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Marcar Despachados</span>
              </button>
            )}

            {activeStage === 'chegada' && (
              <button
                onClick={() => handleBatchUpdate('Recebido no Paddock')}
                disabled={isUpdating || totalFiltered === 0}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Marcar Recebidos</span>
              </button>
            )}

            {activeStage === 'volta' && (
              <button
                onClick={() => handleBatchUpdate('Retornou à Oficina')}
                disabled={isUpdating || totalFiltered === 0}
                className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Marcar Retornados</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar for Active Stage */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
            <span className="text-slate-700 font-bold flex items-center gap-1.5">
              Progresso da Etapa ({activeStage === 'ida' ? 'Ida' : activeStage === 'chegada' ? 'Chegada' : 'Volta'}):
            </span>
            <span className="font-bold text-red-600">{stageProgress}% Concluído</span>
          </div>
          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ width: `${stageProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stage Tabs Selection */}
      <div className="flex bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm gap-2">
        <button
          onClick={() => setActiveStage('ida')}
          className={`flex-1 py-3 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
            activeStage === 'ida'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-gray-50 text-slate-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>1. Ida (Oficina → Paddock)</span>
        </button>

        <button
          onClick={() => setActiveStage('chegada')}
          className={`flex-1 py-3 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
            activeStage === 'chegada'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-50 text-slate-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>2. Chegada no Evento</span>
        </button>

        <button
          onClick={() => setActiveStage('volta')}
          className={`flex-1 py-3 px-4 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
            activeStage === 'volta'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-gray-50 text-slate-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>3. Volta para Oficina</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-red-600" />
          <span>Filtros Rápidos por Caixa & Sistema</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Query */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar item ou caixa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-gray-400 focus:outline-none focus:border-red-500 font-sans"
            />
          </div>

          {/* Sistema Filter */}
          <div>
            <select
              value={selectedSistema}
              onChange={(e) => setSelectedSistema(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-sans"
            >
              <option value="todos">Todos os Sistemas (9)</option>
              {SISTEMAS_LIST.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Caixa Filter (Rule of Subdomains) */}
          <div>
            <select
              value={selectedCaixa}
              onChange={(e) => setSelectedCaixa(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-sans"
            >
              <option value="todas">Todas as Caixas ({uniqueCaixas.length})</option>
              {uniqueCaixas.map((c) => (
                <option key={c} value={c}>
                  Caixa / Subdomínio {c}
                </option>
              ))}
            </select>
          </div>

          {/* Transporte Filter */}
          <div>
            <select
              value={selectedTransporte}
              onChange={(e) => setSelectedTransporte(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-sans"
            >
              <option value="todos">Todos os Transportes</option>
              <option value="SENAI">SENAI (Caminhão)</option>
              <option value="ÔNIBUS">ÔNIBUS (Equipe)</option>
            </select>
          </div>

          {/* Responsável Filter */}
          <div>
            <select
              value={selectedResponsavel}
              onChange={(e) => setSelectedResponsavel(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-sans"
            >
              <option value="todos">Todos os Responsáveis</option>
              {uniqueResponsaveis.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Interactive Checklist Items Table / Data Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Box className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Nenhum item encontrado com os filtros selecionados</p>
            <p className="text-xs text-gray-400 mt-1 font-sans">Tente redefinir os filtros ou buscar outro termo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] uppercase bg-gray-50 text-slate-600 border-b border-gray-200 font-bold">
                <tr>
                  <th className="py-3 px-4">Caixa / Subdomínio</th>
                  <th className="py-3 px-4">Item & Especificação</th>
                  <th className="py-3 px-4">Sistema</th>
                  <th className="py-3 px-4">Qtd</th>
                  <th className="py-3 px-4">Cuidados Envio</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4 text-right">Alterar Status Em Tempo Real</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition">
                      {/* Caixa */}
                      <td className="py-3 px-4 font-mono font-bold text-red-600 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700">
                          {item.caixa || 'N/A'}
                        </span>
                      </td>

                      {/* Item */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 font-sans text-xs">{item.item}</div>
                        {item.descricao && (
                          <div className="text-[11px] text-gray-500 font-sans">{item.descricao}</div>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-mono">
                            {item.transporte}
                          </span>
                          <span className="text-[10px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-mono">
                            {item.tipo_item}
                          </span>
                        </div>
                      </td>

                      {/* Sistema */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-slate-700 font-medium text-[10px]">
                          {item.sistema}
                        </span>
                      </td>

                      {/* Quantidade */}
                      <td className="py-3 px-4 font-bold text-slate-900">{item.quantidade}</td>

                      {/* Descrição Envio */}
                      <td className="py-3 px-4 text-slate-600 text-[11px] font-sans">
                        {item.descricao_envio || 'Padrão'}
                      </td>

                      {/* Responsável */}
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-sans">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-gray-400" />
                          <span>{item.responsavel}</span>
                        </div>
                      </td>

                      {/* STATUS INTERACTIVE SELECT / BUTTONS */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {activeStage === 'ida' && (
                          <div className="flex items-center justify-end space-x-1">
                            {(['Pendente', 'Embalado', 'Despachado'] as StatusIda[]).map((st) => (
                              <button
                                key={st}
                                onClick={() => onUpdateStatus(item.id, 'status_ida', st)}
                                disabled={isUpdating}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                                  item.status_ida === st
                                    ? st === 'Despachado'
                                      ? 'bg-green-100 text-green-800 border border-green-300'
                                      : st === 'Embalado'
                                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        )}

                        {activeStage === 'chegada' && (
                          <div className="flex items-center justify-end space-x-1">
                            {(['Pendente', 'Recebido no Paddock'] as StatusChegada[]).map((st) => (
                              <button
                                key={st}
                                onClick={() => onUpdateStatus(item.id, 'status_chegada', st)}
                                disabled={isUpdating}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                                  item.status_chegada === st
                                    ? st === 'Recebido no Paddock'
                                      ? 'bg-green-100 text-green-800 border border-green-300'
                                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        )}

                        {activeStage === 'volta' && (
                          <div className="flex items-center justify-end space-x-1">
                            {(
                              [
                                'Pendente',
                                'Embalado',
                                'Retornou à Oficina',
                                'Avariado/Perdido'
                              ] as StatusVolta[]
                            ).map((st) => (
                              <button
                                key={st}
                                onClick={() => onUpdateStatus(item.id, 'status_volta', st)}
                                disabled={isUpdating}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                                  item.status_volta === st
                                    ? st === 'Retornou à Oficina'
                                      ? 'bg-green-100 text-green-800 border border-green-300'
                                      : st === 'Avariado/Perdido'
                                      ? 'bg-red-100 text-red-800 border border-red-300'
                                      : st === 'Embalado'
                                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200'
                                }`}
                              >
                                {st === 'Retornou à Oficina' ? 'Retornou' : st}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
