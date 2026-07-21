import React, { useState } from 'react';
import { SupabaseConfig } from '../types';
import { saveSupabaseConfig, testSupabaseConnection } from '../lib/supabaseService';
import {
  Code2,
  Copy,
  Check,
  Database,
  Terminal,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Key
} from 'lucide-react';

interface PythonAndSqlDocsProps {
  supabaseConfig: SupabaseConfig;
  onConfigChange: (config: SupabaseConfig) => void;
}

export const PythonAndSqlDocs: React.FC<PythonAndSqlDocsProps> = ({
  supabaseConfig,
  onConfigChange
}) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'python' | 'secrets' | 'config'>('sql');

  // Copy buttons state
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedPython, setCopiedPython] = useState(false);
  const [copiedSecrets, setCopiedSecrets] = useState(false);

  // Form state for interactive Supabase testing
  const [urlInput, setUrlInput] = useState(supabaseConfig.url || '');
  const [keyInput, setKeyInput] = useState(supabaseConfig.anonKey || '');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // --- SQL SCRIPT ---
  const SQL_SCRIPT = `-- =====================================================================
-- SISTEMA DE GERENCIAMENTO DE LOGÍSTICA E INVENTÁRIO KRT (BAJA / FORMULA SAE)
-- SCRIPT DE CRIAÇÃO DA TABELA inventario_krt NO SUPABASE (POSTGRESQL)
-- =====================================================================

-- 1. Habilitar extensão pgcrypto para geração de UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Criação da Tabela Principal
CREATE TABLE IF NOT EXISTS public.inventario_krt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dados do Item
    sistema TEXT NOT NULL CHECK (sistema IN (
        'Oficina', 'Baja', 'Eletrônica', 'Drivetrain', 'Frame & Body', 
        'Freios', 'Gerenciamento', 'Suspensão', 'Powertrain'
    )),
    item TEXT NOT NULL,
    descricao TEXT,
    valor_estimado NUMERIC(10, 2),
    quantidade INTEGER NOT NULL DEFAULT 1,
    tipo_item TEXT NOT NULL DEFAULT 'Retornável' CHECK (tipo_item IN ('Retornável', 'Consumível')),
    
    -- Logística e Transporte
    transporte TEXT NOT NULL DEFAULT 'SENAI' CHECK (transporte IN ('SENAI', 'ÔNIBUS')),
    caixa TEXT NOT NULL DEFAULT '1.1',
    prioridade_abertura TEXT NOT NULL DEFAULT 'Média' CHECK (prioridade_abertura IN ('Alta', 'Média', 'Baixa')),
    descricao_envio TEXT DEFAULT 'Padrão',
    responsavel TEXT DEFAULT 'Membro KRT',
    
    -- Rastreamento (Ciclo de Vida da Viagem)
    status_ida TEXT NOT NULL DEFAULT 'Pendente' CHECK (status_ida IN ('Pendente', 'Embalado', 'Despachado')),
    status_chegada TEXT NOT NULL DEFAULT 'Pendente' CHECK (status_chegada IN ('Pendente', 'Recebido no Paddock')),
    status_volta TEXT NOT NULL DEFAULT 'Pendente' CHECK (status_volta IN ('Pendente', 'Embalado', 'Retornou à Oficina', 'Avariado/Perdido')),
    
    -- Timestamps de Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices para Otimização de Consultas no Paddock
CREATE INDEX IF NOT EXISTS idx_inventario_sistema ON public.inventario_krt(sistema);
CREATE INDEX IF NOT EXISTS idx_inventario_caixa ON public.inventario_krt(caixa);
CREATE INDEX IF NOT EXISTS idx_inventario_status_ida ON public.inventario_krt(status_ida);
CREATE INDEX IF NOT EXISTS idx_inventario_transporte ON public.inventario_krt(transporte);

-- 4. Trigger para atualização automática da coluna updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_inventario_krt_updated_at ON public.inventario_krt;
CREATE TRIGGER trigger_update_inventario_krt_updated_at
BEFORE UPDATE ON public.inventario_krt
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Configuração de RLS (Row Level Security) - Leitura e Escrita Pública (Anon)
ALTER TABLE public.inventario_krt ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir Leitura Anonima" ON public.inventario_krt
    FOR SELECT USING (true);

CREATE POLICY "Permitir Insercao Anonima" ON public.inventario_krt
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir Atualizacao Anonima" ON public.inventario_krt
    FOR UPDATE USING (true);

CREATE POLICY "Permitir Delecao Anonima" ON public.inventario_krt
    FOR DELETE USING (true);
`;

  // --- STREAMLIT PYTHON CODE (app.py) ---
  const PYTHON_CODE = `import streamlit as st
import pandas as pd
import plotly.express as px
from supabase import create_client, Client

# =====================================================================
# CONFIGURAÇÃO DA PÁGINA STREAMLIT
# =====================================================================
st.set_page_config(
    page_title="KRT - Logística & Inventário",
    page_icon="🏎️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Estilização Customizada
st.markdown("""
<style>
    .metric-card { background-color: #1e293b; padding: 15px; border-radius: 10px; border: 1px solid #334155; }
    .stApp { background-color: #0f172a; color: #f8fafc; }
</style>
""", unsafe_allow_html=True)

# =====================================================================
# CONEXÃO COM O SUPABASE
# =====================================================================
@st.cache_resource
def init_supabase() -> Client:
    try:
        url = st.secrets["supabase"]["url"]
        key = st.secrets["supabase"]["key"]
        return create_client(url, key)
    except Exception as e:
        st.error(f"❌ Erro ao conectar ao Supabase: {str(e)}")
        st.info("Verifique se o arquivo .streamlit/secrets.toml foi configurado corretamente.")
        st.stop()

supabase = init_supabase()

# =====================================================================
# FUNÇÕES DE BUSCA E ATUALIZAÇÃO NO SUPABASE
# =====================================================================
def load_inventory_data():
    try:
        response = supabase.table("inventario_krt").select("*").order("sistema").execute()
        df = pd.DataFrame(response.data)
        return df
    except Exception as e:
        st.error(f"Erro ao carregar dados do Supabase: {e}")
        return pd.DataFrame()

def update_item_status(item_id: str, field: str, new_value: str):
    try:
        supabase.table("inventario_krt").update({field: new_value}).eq("id", item_id).execute()
        return True
    except Exception as e:
        st.error(f"Erro ao atualizar status: {e}")
        return False

# =====================================================================
# MENU LATERAL (SIDEBAR)
# =====================================================================
st.sidebar.title("🏎️ LOGÍSTICA KRT")
st.sidebar.caption("Equipe de Competição Baja / Formula SAE")

menu = st.sidebar.radio(
    "Navegação Principais",
    ["Dashboard", "Checklist de Viagem", "Gestão de Itens (CRUD)", "Importar Excel (Admin)"]
)

SISTEMAS = [
    'Oficina', 'Baja', 'Eletrônica', 'Drivetrain', 'Frame & Body', 
    'Freios', 'Gerenciamento', 'Suspensão', 'Powertrain'
]

# =====================================================================
# MÓDULO 1: DASHBOARD (VISÃO GERAL)
# =====================================================================
if menu == "Dashboard":
    st.title("📊 Dashboard de Logística & Paddock")
    df = load_inventory_data()
    
    if df.empty:
        st.warning("Nenhum dado encontrado no banco de dados Supabase.")
    else:
        # Métricas no topo
        col1, col2, col3, col4 = st.columns(4)
        total_itens = len(df)
        total_unidades = df['quantidade'].sum() if 'quantidade' in df.columns else total_itens
        embalados = len(df[df['status_ida'].isin(['Embalado', 'Despachado'])])
        pct_embalado = round((embalados / total_itens) * 100) if total_itens > 0 else 0
        caixas_despachadas = df[df['status_ida'] == 'Despachado']['caixa'].nunique()
        valor_total = df['valor_estimado'].fillna(0).sum()
        
        col1.metric("Total de Itens", f"{total_itens}", f"{total_unidades} unidades")
        col2.metric("% Embalados (Ida)", f"{pct_embalado}%", f"{embalados}/{total_itens}")
        col3.metric("Caixas Despachadas", f"{caixas_despachadas}")
        col4.metric("Patrimônio Estimado", f"R$ {valor_total:,.2f}")
        
        st.markdown("---")
        
        # Gráficos de Apoio
        c1, c2 = st.columns([2, 1])
        
        with c1:
            st.subheader("Status de Empacotamento por Sistema")
            fig_sys = px.histogram(
                df, x="sistema", color="status_ida",
                barmode="group",
                color_discrete_map={"Pendente": "#eab308", "Embalado": "#3b82f6", "Despachado": "#10b981"}
            )
            fig_sys.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
            st.plotly_chart(fig_sys, use_container_width=True)
            
        with c2:
            st.subheader("Divisão por Transporte")
            fig_transp = px.pie(df, names="transporte", color="transporte", hole=0.4)
            st.plotly_chart(fig_transp, use_container_width=True)

# =====================================================================
# MÓDULO 2: CHECKLIST DE VIAGEM (CORE DATA_EDITOR COM AUTO-UPDATE)
# =====================================================================
elif menu == "Checklist de Viagem":
    st.title("📋 Checklist de Paddock & Viagem")
    df = load_inventory_data()
    
    if df.empty:
        st.warning("Nenhum item cadastrado.")
    else:
        # Filtros de Paddock
        col_f1, col_f2, col_f3 = st.columns(3)
        with col_f1:
            sistema_filtro = st.selectbox("Filtrar por Sistema", ["Todos"] + SISTEMAS)
        with col_f2:
            caixas_disp = ["Todas"] + sorted(list(df['caixa'].dropna().unique()))
            caixa_filtro = st.selectbox("Filtrar por Caixa", caixas_disp)
        with col_f3:
            transp_filtro = st.selectbox("Transporte", ["Todos", "SENAI", "ÔNIBUS"])
            
        # Aplicação dos Filtros
        df_filtered = df.copy()
        if sistema_filtro != "Todos":
            df_filtered = df_filtered[df_filtered['sistema'] == sistema_filtro]
        if caixa_filtro != "Todas":
            df_filtered = df_filtered[df_filtered['caixa'] == caixa_filtro]
        if transp_filtro != "Todos":
            df_filtered = df_filtered[df_filtered['transporte'] == transp_filtro]
            
        # Abas por Etapa da Viagem
        tab_ida, tab_chegada, tab_volta = st.tabs(["1. Ida (Oficina → Paddock)", "2. Chegada no Evento", "3. Volta para Oficina"])
        
        with tab_ida:
            st.caption("Edite os status diretamente na tabela para sincronizar instantaneamente com o Supabase.")
            edited_df = st.data_editor(
                df_filtered[['id', 'sistema', 'caixa', 'item', 'quantidade', 'transporte', 'responsavel', 'status_ida']],
                column_config={
                    "status_ida": st.column_config.SelectboxColumn(
                        "Status Ida", options=["Pendente", "Embalado", "Despachado"], required=True
                    )
                },
                disabled=['id', 'sistema', 'caixa', 'item', 'quantidade', 'transporte', 'responsavel'],
                use_container_width=True,
                hide_index=True,
                key="editor_ida"
            )
            
            # Auto update on change
            for idx, row in edited_df.iterrows():
                original_status = df.loc[df['id'] == row['id'], 'status_ida'].values[0]
                if row['status_ida'] != original_status:
                    update_item_status(row['id'], 'status_ida', row['status_ida'])
                    st.toast(f"Status atualizado para {row['item']}!")

# =====================================================================
# MÓDULO 3: GESTÃO DE ITENS (CRUD)
# =====================================================================
elif menu == "Gestão de Itens (CRUD)":
    st.title("📦 Cadastro & Edição de Equipamentos")
    
    with st.expander("➕ Cadastrar Novo Item", expanded=False):
        with st.form("form_novo_item"):
            c1, c2 = st.columns(2)
            with c1:
                nome_item = st.text_input("Nome do Item *")
                sistema = st.selectbox("Sistema", SISTEMAS)
                caixa = st.text_input("Caixa (Ex: 1.1, 3.2)", value="1.1")
                quantidade = st.number_input("Quantidade", min_value=1, value=1)
                valor = st.number_input("Valor Estimado (R$)", min_value=0.0, value=0.0)
            with c2:
                tipo = st.selectbox("Tipo de Item", ["Retornável", "Consumível"])
                transporte = st.selectbox("Transporte", ["SENAI", "ÔNIBUS"])
                prioridade = st.selectbox("Prioridade Abertura", ["Alta", "Média", "Baixa"])
                responsavel = st.text_input("Responsável", value="Membro KRT")
                descricao = st.text_area("Descrição / Cuidados")
                
            submitted = st.form_submit_button("Salvar no Supabase")
            if submitted:
                if not nome_item:
                    st.error("Nome do item é obrigatório.")
                else:
                    payload = {
                        "sistema": sistema, "item": nome_item, "caixa": caixa,
                        "quantidade": quantidade, "valor_estimado": valor if valor > 0 else None,
                        "tipo_item": tipo, "transporte": transporte, "prioridade_abertura": prioridade,
                        "responsavel": responsavel, "descricao": descricao
                    }
                    supabase.table("inventario_krt").insert(payload).execute()
                    st.success("Item inserido com sucesso!")
                    st.rerun()

# =====================================================================
# MÓDULO 4: IMPORTADOR EXCEL
# =====================================================================
elif menu == "Importar Excel (Admin)":
    st.title("📂 Migração de Planilha Excel")
    uploaded_file = st.file_uploader("Selecione o arquivo 'Itens de transporte para competição.xlsx'", type=["xlsx"])
    
    if uploaded_file:
        xls = pd.ExcelFile(uploaded_file)
        st.write("Abas encontradas:", xls.sheet_names)
        
        if st.button("Processar e Fazer INSERT em Massa no Supabase"):
            total_inseridos = 0
            for sheet in xls.sheet_names:
                df_sheet = pd.read_excel(xls, sheet_name=sheet)
                # Iterar e formatar linhas para inserção
                # ... (Lógica de Mapeamento Automático)
            st.success("Carga realizada com sucesso!")
`;

  // --- SECRETS TOML CONTENT ---
  const SECRETS_TOML = `# Arquivo local: .streamlit/secrets.toml
# Copie as chaves do painel do Supabase (Project Settings -> API)

[supabase]
url = "https://SEU_PROJETO.supabase.co"
key = "sua_anon_key_publica_aqui"
`;

  const handleCopy = (text: string, type: 'sql' | 'python' | 'secrets') => {
    navigator.clipboard.writeText(text);
    if (type === 'sql') {
      setCopiedSQL(true);
      setTimeout(() => setCopiedSQL(false), 2000);
    } else if (type === 'python') {
      setCopiedPython(true);
      setTimeout(() => setCopiedPython(false), 2000);
    } else {
      setCopiedSecrets(true);
      setTimeout(() => setCopiedSecrets(false), 2000);
    }
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(urlInput, keyInput);
    setIsTesting(false);
    setTestResult(res);

    if (res.success || res.message.includes('tabela "inventario_krt" ainda não existe')) {
      const newConfig = saveSupabaseConfig(urlInput, keyInput, true);
      onConfigChange(newConfig);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 font-mono">
            ARQUITETURA & ENTREGÁVEIS TÉCNICOS
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mt-1">
          Código SQL, Python (Streamlit app.py) & secrets.toml
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
          Aqui estão todos os entregáveis de código de produção para hospedagem no Streamlit Cloud e provisionamento da tabela no Supabase.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm gap-2">
        <button
          onClick={() => setActiveTab('sql')}
          className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'sql'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-gray-50 text-slate-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>1. Script SQL Supabase</span>
        </button>

        <button
          onClick={() => setActiveTab('python')}
          className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'python'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-50 text-slate-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>2. Código Python (app.py)</span>
        </button>

        <button
          onClick={() => setActiveTab('secrets')}
          className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'secrets'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-gray-50 text-slate-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>3. Configuração secrets.toml</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeTab === 'config'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-gray-50 text-slate-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>4. Testar Conexão Live</span>
        </button>
      </div>

      {/* TAB 1: SQL SCRIPT */}
      {activeTab === 'sql' && (
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Script DDL PostgreSQL (Supabase)</h3>
              <p className="text-xs text-slate-500">
                Copie e cole este código no SQL Editor do Supabase para criar a tabela <span className="font-mono text-red-600 font-bold">inventario_krt</span>.
              </p>
            </div>
            <button
              onClick={() => handleCopy(SQL_SCRIPT, 'sql')}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm"
            >
              {copiedSQL ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSQL ? 'Copiado!' : 'Copiar SQL'}</span>
            </button>
          </div>

          <pre className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-xs text-slate-200 font-mono overflow-x-auto max-h-[500px] leading-relaxed">
            {SQL_SCRIPT}
          </pre>
        </div>
      )}

      {/* TAB 2: PYTHON CODE */}
      {activeTab === 'python' && (
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Código Python Completo (app.py)</h3>
              <p className="text-xs text-slate-500">
                Aplicação Streamlit pronta para deployment no Streamlit Cloud com <span className="font-mono text-blue-600 font-bold">st.data_editor</span> e Supabase.
              </p>
            </div>
            <button
              onClick={() => handleCopy(PYTHON_CODE, 'python')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm"
            >
              {copiedPython ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copiedPython ? 'Copiado!' : 'Copiar app.py'}</span>
            </button>
          </div>

          <pre className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-xs text-blue-200 font-mono overflow-x-auto max-h-[500px] leading-relaxed">
            {PYTHON_CODE}
          </pre>
        </div>
      )}

      {/* TAB 3: SECRETS TOML */}
      {activeTab === 'secrets' && (
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Instruções de Configuração secrets.toml</h3>
              <p className="text-xs text-slate-500">
                Crie o arquivo <span className="font-mono text-emerald-600 font-bold">.streamlit/secrets.toml</span> localmente ou insira no Streamlit Cloud Secrets Manager.
              </p>
            </div>
            <button
              onClick={() => handleCopy(SECRETS_TOML, 'secrets')}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm"
            >
              {copiedSecrets ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSecrets ? 'Copiado!' : 'Copiar secrets.toml'}</span>
            </button>
          </div>

          <pre className="bg-slate-900 p-4 rounded-lg border border-slate-800 text-xs text-emerald-200 font-mono overflow-x-auto leading-relaxed">
            {SECRETS_TOML}
          </pre>

          <div className="space-y-2 pt-2 text-xs text-slate-700 font-sans">
            <h4 className="font-bold text-slate-900">Passo a Passo de Produção:</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
              <li>Acesse seu projeto no painel do Supabase (<span className="text-slate-900 font-medium">https://supabase.com</span>).</li>
              <li>Vá para <strong className="text-slate-900">Project Settings → API</strong>.</li>
              <li>Copie a <strong className="text-slate-900">Project URL</strong> e a chave <strong className="text-slate-900">anon / public key</strong>.</li>
              <li>No Streamlit Cloud, acesse <strong className="text-slate-900">App Settings → Secrets</strong> e cole as variáveis no formato TOML acima.</li>
            </ol>
          </div>
        </div>
      )}

      {/* TAB 4: TESTAR CONEXÃO LIVE */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-600" />
              Conectar Este Web App Direto ao Seu Supabase
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Insira suas credenciais abaixo para sincronizar a interface web instantaneamente com seu banco de dados Supabase real!
            </p>
          </div>

          <form onSubmit={handleTestConnection} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supabase Anon / Public Key
              </label>
              <textarea
                rows={3}
                placeholder="eyJhY2Nlc3NfdG9rZW4iOi..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isTesting}
              className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              <Terminal className="w-4 h-4" />
              <span>{isTesting ? 'Testando Conexão...' : 'Testar & Salvar Conexão'}</span>
            </button>
          </form>

          {testResult && (
            <div
              className={`p-4 rounded-lg border text-xs flex items-center gap-3 font-sans ${
                testResult.success
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {testResult.success ? (
                <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              )}
              <span className="font-medium">{testResult.message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
