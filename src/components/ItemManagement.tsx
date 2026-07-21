import React, { useState, useMemo } from 'react';
import { InventarioItem, Sistema } from '../types';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Download,
  Package,
  Layers,
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ItemManagementProps {
  items: InventarioItem[];
  onOpenCreateModal: () => void;
  onOpenEditModal: (item: InventarioItem) => void;
  onDeleteItem: (id: string) => Promise<void>;
  isDeleting: boolean;
}

export const ItemManagement: React.FC<ItemManagementProps> = ({
  items,
  onOpenCreateModal,
  onOpenEditModal,
  onDeleteItem,
  isDeleting
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSistema, setFilterSistema] = useState('todos');
  const [filterTransporte, setFilterTransporte] = useState('todos');
  const [filterCaixa, setFilterCaixa] = useState('todas');
  const [filterTipo, setFilterTipo] = useState('todos');

  // Sort state
  const [sortField, setSortField] = useState<'item' | 'sistema' | 'caixa' | 'valor_estimado'>('sistema');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const uniqueCaixas = useMemo(() => {
    const set = new Set(items.map((i) => i.caixa).filter(Boolean));
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

  const filteredItems = useMemo(() => {
    return items
      .filter((i) => {
        if (filterSistema !== 'todos' && i.sistema !== filterSistema) return false;
        if (filterTransporte !== 'todos' && i.transporte !== filterTransporte) return false;
        if (filterCaixa !== 'todas' && i.caixa !== filterCaixa) return false;
        if (filterTipo !== 'todos' && i.tipo_item !== filterTipo) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesItem = i.item.toLowerCase().includes(q);
          const matchesDesc = (i.descricao || '').toLowerCase().includes(q);
          const matchesResp = (i.responsavel || '').toLowerCase().includes(q);
          const matchesCaixa = (i.caixa || '').toLowerCase().includes(q);
          if (!matchesItem && !matchesDesc && !matchesResp && !matchesCaixa) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField] || '';
        let valB: any = b[sortField] || '';

        if (typeof valA === 'number' || typeof valB === 'number') {
          valA = Number(valA || 0);
          valB = Number(valB || 0);
        } else {
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [
    items,
    filterSistema,
    filterTransporte,
    filterCaixa,
    filterTipo,
    searchQuery,
    sortField,
    sortDirection
  ]);

  const handleSort = (field: 'item' | 'sistema' | 'caixa' | 'valor_estimado') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteConfirm = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o item "${name}" do inventário?`)) {
      await onDeleteItem(id);
    }
  };

  const handleExportXLSX = () => {
    const exportData = filteredItems.map((item) => ({
      Sistema: item.sistema,
      'Item / Equipamento': item.item,
      Descrição: item.descricao || '',
      Quantidade: item.quantidade,
      'Valor Estimado (R$)': item.valor_estimado || 0,
      'Tipo de Item': item.tipo_item,
      'Modal Transporte': item.transporte,
      'Caixa / Subdomínio': item.caixa,
      'Prioridade Abertura': item.prioridade_abertura,
      'Descrição Envio': item.descricao_envio,
      Responsável: item.responsavel,
      'Status Ida': item.status_ida,
      'Status Chegada': item.status_chegada,
      'Status Volta': item.status_volta
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario_KRT');
    XLSX.writeFile(workbook, `Inventario_Logistica_KRT_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 uppercase font-mono">
              GESTÃO DE BANCO DE DADOS
            </span>
            <span className="text-xs text-gray-500 font-mono">
              Exibindo {filteredItems.length} de {items.length} itens cadastrados
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Inventário do Paddock & Oficina KRT
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre, edite e acompanhe os dados dos equipamentos da equipe de competição.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={handleExportXLSX}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold border border-gray-300 flex items-center justify-center space-x-2 transition"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Item</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome, caixa, resp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-gray-400 focus:outline-none focus:border-red-500 font-sans"
          />
        </div>

        {/* Sistema Filter */}
        <div>
          <select
            value={filterSistema}
            onChange={(e) => setFilterSistema(e.target.value)}
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

        {/* Caixa Filter */}
        <div>
          <select
            value={filterCaixa}
            onChange={(e) => setFilterCaixa(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-sans"
          >
            <option value="todas">Todas as Caixas</option>
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
            value={filterTransporte}
            onChange={(e) => setFilterTransporte(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-sans"
          >
            <option value="todos">Todos os Transportes</option>
            <option value="SENAI">SENAI (Caminhão)</option>
            <option value="ÔNIBUS">ÔNIBUS (Equipe)</option>
          </select>
        </div>

        {/* Tipo Item Filter */}
        <div>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-sans"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="Retornável">Retornável</option>
            <option value="Consumível">Consumível</option>
          </select>
        </div>
      </div>

      {/* CRUD Data Grid Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-sans">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Nenhum item cadastrado ou encontrado com estes filtros</p>
            <p className="text-xs text-gray-400 mt-1">Clique em "Novo Item" para adicionar manualmente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] uppercase bg-gray-50 text-slate-600 border-b border-gray-200 font-bold">
                <tr>
                  <th
                    onClick={() => handleSort('sistema')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  >
                    <div className="flex items-center gap-1">
                      <span>Sistema</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('caixa')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  >
                    <div className="flex items-center gap-1">
                      <span>Caixa</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('item')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  >
                    <div className="flex items-center gap-1">
                      <span>Item / Equipamento</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Qtd</th>
                  <th
                    onClick={() => handleSort('valor_estimado')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  >
                    <div className="flex items-center gap-1">
                      <span>Valor (R$)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Transporte</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition">
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px]">
                        {item.sistema}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-red-600">
                      {item.caixa}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-bold text-slate-900 text-xs">{item.item}</div>
                      {item.descricao && (
                        <div className="text-[11px] text-gray-500">{item.descricao}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.quantidade}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      {item.valor_estimado
                        ? item.valor_estimado.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          })
                        : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.transporte === 'SENAI'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.transporte}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-sans text-[11px]">{item.responsavel}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onOpenEditModal(item)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-slate-600 hover:text-slate-900 transition border border-gray-200"
                          title="Editar Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteConfirm(item.id, item.item)}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 transition"
                          title="Excluir Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
