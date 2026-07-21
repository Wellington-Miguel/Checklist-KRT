import React, { useState } from 'react';
import { Sistema, InventarioItem } from '../types';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  ArrowRight,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelImporterProps {
  onBulkImport: (items: Omit<InventarioItem, 'id'>[]) => Promise<{ count: number; error?: string }>;
  onReloadOfficialInventory: () => Promise<void>;
  isImporting: boolean;
}

export const ExcelImporter: React.FC<ExcelImporterProps> = ({
  onBulkImport,
  onReloadOfficialInventory,
  isImporting
}) => {
  const [parsedData, setParsedData] = useState<Omit<InventarioItem, 'id'>[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const SISTEMAS_VALIDOS: Sistema[] = [
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        setSheetNames(workbook.SheetNames);

        const extractedItems: Omit<InventarioItem, 'id'>[] = [];

        // Iterate through sheets
        workbook.SheetNames.forEach((sheetName) => {
          // Determine matching system from sheet name
          let sistemaDetectado: Sistema = 'Oficina';
          const match = SISTEMAS_VALIDOS.find(
            (s) => s.toLowerCase() === sheetName.trim().toLowerCase()
          );
          if (match) {
            sistemaDetectado = match;
          }

          const worksheet = workbook.Sheets[sheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          rawRows.forEach((row) => {
            // Map column variations from Excel
            const nameKey =
              Object.keys(row).find(
                (k) =>
                  k.toLowerCase().includes('item') ||
                  k.toLowerCase().includes('itens') ||
                  k.toLowerCase().includes('nome') ||
                  k.toLowerCase().includes('equipamento')
              ) || Object.keys(row)[0];

            const itemName = row[nameKey];

            if (!itemName || String(itemName).trim() === '' || String(itemName).toUpperCase().includes('PRODUTOS DE LIMPEZA') || String(itemName).toUpperCase().includes('INSUMOS') || String(itemName).toUpperCase().includes('FERRAMENTAS')) {
              return; // Skip section headers or blank rows
            }

            // Extract numeric estimated value
            let valEstimado: number | null = null;
            const valKey = Object.keys(row).find(
              (k) => k.toLowerCase().includes('valor') || k.toLowerCase().includes('estimado')
            );
            if (valKey && row[valKey]) {
              const cleanVal = String(row[valKey])
                .replace('R$', '')
                .replace('.', '')
                .replace(',', '.')
                .trim();
              const parsed = parseFloat(cleanVal);
              if (!isNaN(parsed)) valEstimado = parsed;
            }

            // Extract Quantity
            let quantidade = 1;
            const qtdKey = Object.keys(row).find(
              (k) => k.toLowerCase().includes('quantidade') || k.toLowerCase().includes('qtd')
            );
            if (qtdKey && row[qtdKey]) {
              const parsedQtd = parseInt(row[qtdKey]);
              if (!isNaN(parsedQtd) && parsedQtd > 0) quantidade = parsedQtd;
            }

            // Extract Description
            const descKey = Object.keys(row).find((k) => k.toLowerCase().includes('descriç'));
            const desc = descKey ? String(row[descKey] || '') : '';

            // Extract Transport
            const transpKey = Object.keys(row).find((k) => k.toLowerCase().includes('transporte'));
            let transp = 'SENAI';
            if (transpKey && row[transpKey]) {
              const rawT = String(row[transpKey]).toUpperCase();
              if (rawT.includes('ÔNIBUS') || rawT.includes('ONIBUS') || rawT.includes('BUS')) {
                transp = 'ÔNIBUS';
              }
            }

            // Extract Caixa
            const caixaKey = Object.keys(row).find((k) => k.toLowerCase().includes('caixa'));
            const caixaStr = caixaKey ? String(row[caixaKey] || '1.1').trim() : '1.1';

            // Extract Descrição Envio
            const envioKey = Object.keys(row).find(
              (k) => k.toLowerCase().includes('envio') || k.toLowerCase().includes('cuidados')
            );
            const envioStr = envioKey ? String(row[envioKey] || 'Padrão') : 'Padrão';

            extractedItems.push({
              sistema: sistemaDetectado,
              item: String(itemName).trim(),
              descricao: desc,
              valor_estimado: valEstimado,
              quantidade: quantidade,
              tipo_item: 'Retornável',
              transporte: transp as any,
              caixa: caixaStr || '1.1',
              prioridade_abertura: 'Média',
              descricao_envio: envioStr,
              responsavel: `${sistemaDetectado} Team`,
              status_ida: 'Pendente',
              status_chegada: 'Pendente',
              status_volta: 'Pendente'
            });
          });
        });

        setParsedData(extractedItems);
        setImportStatus({
          type: 'info',
          message: `Arquivo lidado com sucesso! ${extractedItems.length} itens extraídos de ${workbook.SheetNames.length} abas.`
        });
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: `Erro ao processar planilha Excel: ${err?.message || 'Arquivo inválido'}`
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExecuteImport = async () => {
    if (parsedData.length === 0) return;
    const res = await onBulkImport(parsedData);
    if (res.error) {
      setImportStatus({
        type: 'error',
        message: res.error
      });
    } else {
      setImportStatus({
        type: 'success',
        message: `${res.count} itens importados com sucesso para o banco de dados!`
      });
      setParsedData([]);
    }
  };

  const handleReloadOfficial = async () => {
    const confirmed = window.confirm(
      'Deseja carregar a planilha oficial pré-definida com os 9 sistemas da KRT no banco de dados?'
    );
    if (confirmed) {
      await onReloadOfficialInventory();
      setImportStatus({
        type: 'success',
        message: 'Inventário oficial do KRT (120+ itens) reloaded com sucesso!'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 font-mono">
            MIGRAÇÃO DE DADOS EXCEL / CSV
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mt-1">
          Importação da Planilha Oficial "Itens de transporte para competição.xlsx"
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
          Carregue o arquivo Excel com as abas dos 9 sistemas (Oficina, Baja, Eletrônica, Drivetrain, Frame & Body, Freios, Gerenciamento, Suspensão, Powertrain). O script faz a extração automática das colunas e grava diretamente no Supabase!
        </p>
      </div>

      {/* Quick Action: Reload Default Inventory */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg border border-red-200">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Restaurar Inventário Oficial KRT Integrado</h3>
            <p className="text-xs text-slate-500">
              Carrega instantaneamente os 120+ itens dos 9 sistemas já parseados do dataset oficial.
            </p>
          </div>
        </div>

        <button
          onClick={handleReloadOfficial}
          disabled={isImporting}
          className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-sm flex items-center space-x-2 transition flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isImporting ? 'animate-spin' : ''}`} />
          <span>Carregar Planilha Oficial Integrada</span>
        </button>
      </div>

      {/* File Upload Zone */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Upload de Arquivo Excel (.xlsx / .xls)
        </h3>

        <div className="border-2 border-dashed border-gray-300 hover:border-red-500 rounded-xl p-8 text-center bg-gray-50/50 transition group cursor-pointer relative">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="space-y-2">
            <Upload className="w-10 h-10 text-gray-400 group-hover:text-red-600 mx-auto transition" />
            <p className="text-sm font-semibold text-slate-800">
              Arraste e solte seu arquivo Excel aqui ou clique para selecionar
            </p>
            <p className="text-xs text-gray-500">
              Suporta abas 'Oficina', 'Baja', 'Eletrônica', 'Drivetrain', 'Frame & Body', 'Freios', 'Gerenciamento', 'Suspensão', 'Powertrain'
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {importStatus && (
          <div
            className={`p-4 rounded-lg border text-xs flex items-center gap-3 font-sans ${
              importStatus.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : importStatus.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {importStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : importStatus.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            ) : (
              <FileSpreadsheet className="w-5 h-5 text-blue-600 flex-shrink-0" />
            )}
            <span className="font-medium">{importStatus.message}</span>
          </div>
        )}

        {/* Preview of Parsed Data */}
        {parsedData.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Pré-visualização dos Itens Extraídos ({parsedData.length})
                </h4>
                <p className="text-xs text-gray-500">
                  Arquivo: <span className="font-mono text-red-600 font-bold">{fileName}</span> ({sheetNames.length} abas)
                </p>
              </div>

              <button
                onClick={handleExecuteImport}
                disabled={isImporting}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                <span>Confirmar e Importar {parsedData.length} Itens</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-gray-50 sticky top-0 text-[10px] text-slate-600 uppercase border-b border-gray-200 font-bold">
                  <tr>
                    <th className="py-2 px-3">Sistema</th>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3">Qtd</th>
                    <th className="py-2 px-3">Valor Est.</th>
                    <th className="py-2 px-3">Transporte</th>
                    <th className="py-2 px-3">Caixa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[11px]">
                  {parsedData.slice(0, 20).map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50">
                      <td className="py-1.5 px-3 font-bold text-slate-700">{row.sistema}</td>
                      <td className="py-1.5 px-3 text-slate-900 font-sans font-medium">{row.item}</td>
                      <td className="py-1.5 px-3">{row.quantidade}</td>
                      <td className="py-1.5 px-3 text-emerald-700 font-bold">
                        {row.valor_estimado ? `R$ ${row.valor_estimado}` : '-'}
                      </td>
                      <td className="py-1.5 px-3">{row.transporte}</td>
                      <td className="py-1.5 px-3 font-bold text-red-600">{row.caixa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 20 && (
                <div className="p-2 text-center text-[11px] text-gray-500 bg-gray-50 font-mono border-t border-gray-200">
                  ...e mais {parsedData.length - 20} itens.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
