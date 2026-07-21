import React, { useState, useEffect } from 'react';
import {
  InventarioItem,
  Sistema,
  TipoItem,
  Transporte,
  Prioridade,
  StatusIda,
  StatusChegada,
  StatusVolta
} from '../types';
import { X, Save, AlertCircle } from 'lucide-react';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<InventarioItem> & { item: string; sistema: Sistema }) => Promise<void>;
  initialData?: InventarioItem | null;
  isSaving: boolean;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isSaving
}) => {
  const [formData, setFormData] = useState<Partial<InventarioItem>>({
    sistema: 'Oficina',
    item: '',
    descricao: '',
    valor_estimado: null,
    quantidade: 1,
    tipo_item: 'Retornável',
    transporte: 'SENAI',
    caixa: '1.1',
    prioridade_abertura: 'Média',
    descricao_envio: 'Padrão',
    responsavel: 'Membro KRT',
    status_ida: 'Pendente',
    status_chegada: 'Pendente',
    status_volta: 'Pendente'
  });

  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        sistema: 'Oficina',
        item: '',
        descricao: '',
        valor_estimado: null,
        quantidade: 1,
        tipo_item: 'Retornável',
        transporte: 'SENAI',
        caixa: '1.1',
        prioridade_abertura: 'Média',
        descricao_envio: 'Padrão',
        responsavel: 'Membro KRT',
        status_ida: 'Pendente',
        status_chegada: 'Pendente',
        status_volta: 'Pendente'
      });
    }
    setErrorMessage('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item || !formData.item.trim()) {
      setErrorMessage('O nome do item é obrigatório.');
      return;
    }
    if (!formData.sistema) {
      setErrorMessage('Selecione um sistema.');
      return;
    }

    try {
      await onSave(formData as any);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao salvar item.');
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h3 className="font-bold text-slate-900 text-base">
            {initialData ? 'Editar Item do Inventário' : 'Novo Item do Inventário'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-slate-800 p-1 rounded-lg hover:bg-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-center gap-2 font-sans">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome do Item */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Item / Equipamento <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: FT450, Braço Superior, Paquímetro..."
                value={formData.item || ''}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-red-500 font-sans"
              />
            </div>

            {/* Sistema */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sistema (1 a 9) <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.sistema || 'Oficina'}
                onChange={(e) =>
                  setFormData({ ...formData, sistema: e.target.value as Sistema })
                }
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-sans"
              >
                {SISTEMAS_LIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Caixa / Subdomínio */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Caixa / Subdomínio (Ex: 1.1, 3.2, 8.1)
              </label>
              <input
                type="text"
                placeholder="Ex: 3.1"
                value={formData.caixa || ''}
                onChange={(e) => setFormData({ ...formData, caixa: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantidade
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantidade ?? 1}
                onChange={(e) =>
                  setFormData({ ...formData, quantidade: parseInt(e.target.value) || 1 })
                }
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-sans"
              />
            </div>

            {/* Valor Estimado (R$) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor Estimado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.valor_estimado ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    valor_estimado: e.target.value ? parseFloat(e.target.value) : null
                  })
                }
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-sans"
              />
            </div>

            {/* Tipo de Item */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo do Item
              </label>
              <select
                value={formData.tipo_item || 'Retornável'}
                onChange={(e) =>
                  setFormData({ ...formData, tipo_item: e.target.value as TipoItem })
                }
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-sans"
              >
                <option value="Retornável">Retornável</option>
                <option value="Consumível">Consumível</option>
              </select>
            </div>

            {/* Transporte */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Modal de Transporte
              </label>
              <select
                value={formData.transporte || 'SENAI'}
                onChange={(e) =>
                  setFormData({ ...formData, transporte: e.target.value as Transporte })
                }
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-sans"
              >
                <option value="SENAI">SENAI (Caminhão de Carga)</option>
                <option value="ÔNIBUS">ÔNIBUS (Bagagem da Equipe)</option>
              </select>
            </div>

            {/* Prioridade de Abertura */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prioridade de Abertura no Paddock
              </label>
              <select
                value={formData.prioridade_abertura || 'Média'}
                onChange={(e) =>
                  setFormData({ ...formData, prioridade_abertura: e.target.value as Prioridade })
                }
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-sans"
              >
                <option value="Alta">Alta (Abrir Primeiro)</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>

            {/* Responsável */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Responsável Direto
              </label>
              <input
                type="text"
                placeholder="Ex: Gabriel (Eletrônica)"
                value={formData.responsavel || ''}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-sans"
              />
            </div>

            {/* Descrição de Envio / Cuidados */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cuidados Especiais de Envio
              </label>
              <input
                type="text"
                placeholder="Ex: Frágil, Plástico Bolha, Durex na tampa, Caixa especial..."
                value={formData.descricao_envio || ''}
                onChange={(e) => setFormData({ ...formData, descricao_envio: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-sans"
              />
            </div>

            {/* Descrição / Observações */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição Geral & Especificações
              </label>
              <textarea
                rows={2}
                placeholder="Observações adicionais do equipamento..."
                value={formData.descricao || ''}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-sans"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold transition border border-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center space-x-2 shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
