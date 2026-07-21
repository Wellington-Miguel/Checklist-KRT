import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InventarioItem, SupabaseConfig, StatusIda, StatusChegada, StatusVolta } from '../types';
import { INITIAL_INVENTORY } from '../data/initialInventory';

const CONFIG_KEY = 'krt_supabase_config_v2';
const LOCAL_STORAGE_KEY = 'krt_inventory_local_db_v2';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseConfig(): SupabaseConfig {
  const stored = localStorage.getItem(CONFIG_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        url: parsed.url || '',
        anonKey: parsed.anonKey || '',
        isConnected: Boolean(parsed.url && parsed.anonKey && parsed.isConnected)
      };
    } catch {
      // ignore
    }
  }

  // Fallback to import.meta.env if provided
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: envUrl,
    anonKey: envKey,
    isConnected: Boolean(envUrl && envKey)
  };
}

export function saveSupabaseConfig(url: string, anonKey: string, isConnected = true): SupabaseConfig {
  const config: SupabaseConfig = {
    url: url.trim(),
    anonKey: anonKey.trim(),
    isConnected
  };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  cachedClient = null; // reset client cache
  return config;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  try {
    cachedClient = createClient(config.url, config.anonKey);
    return cachedClient;
  } catch (err) {
    console.error('Erro ao inicializar cliente Supabase:', err);
    return null;
  }
}

// Ensure local storage has initial data if empty
export function getLocalItems(): InventarioItem[] {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_INVENTORY));
    return INITIAL_INVENTORY;
  }
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // fallback
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_INVENTORY));
  return INITIAL_INVENTORY;
}

export function saveLocalItems(items: InventarioItem[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
}

// --- MAIN DATABASE OPERATIONS ---

export async function fetchInventoryItems(): Promise<{ items: InventarioItem[]; source: 'supabase' | 'local'; error?: string }> {
  const client = getSupabaseClient();
  const config = getSupabaseConfig();

  if (client && config.isConnected) {
    try {
      const { data, error } = await client
        .from('inventario_krt')
        .select('*')
        .order('sistema', { ascending: true })
        .order('caixa', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        // Map data from supabase format to domain interface
        const mappedData: InventarioItem[] = data.map((row: any) => ({
          id: row.id,
          sistema: row.sistema,
          item: row.item,
          descricao: row.descricao || '',
          valor_estimado: row.valor_estimado ? Number(row.valor_estimado) : null,
          quantidade: Number(row.quantidade || 1),
          tipo_item: row.tipo_item || 'Retornável',
          transporte: row.transporte || 'SENAI',
          caixa: row.caixa || '1.1',
          prioridade_abertura: row.prioridade_abertura || 'Média',
          descricao_envio: row.descricao_envio || 'Padrão',
          responsavel: row.responsavel || 'Equipe KRT',
          status_ida: row.status_ida || 'Pendente',
          status_chegada: row.status_chegada || 'Pendente',
          status_volta: row.status_volta || 'Pendente',
          created_at: row.created_at,
          updated_at: row.updated_at
        }));

        saveLocalItems(mappedData); // Sync local cache
        return { items: mappedData, source: 'supabase' };
      }
    } catch (err: any) {
      console.warn('Falha na busca via Supabase, alternando para cache local:', err?.message || err);
      return {
        items: getLocalItems(),
        source: 'local',
        error: `Supabase: ${err?.message || 'Falha de conexão'}`
      };
    }
  }

  return { items: getLocalItems(), source: 'local' };
}

export async function saveInventoryItem(item: Partial<InventarioItem> & { item: string; sistema: any }): Promise<{ success: boolean; item?: InventarioItem; error?: string }> {
  const client = getSupabaseClient();
  const config = getSupabaseConfig();

  const id = item.id || `krt-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newItem: InventarioItem = {
    id,
    sistema: item.sistema,
    item: item.item,
    descricao: item.descricao || '',
    valor_estimado: item.valor_estimado ?? null,
    quantidade: item.quantidade ?? 1,
    tipo_item: item.tipo_item || 'Retornável',
    transporte: item.transporte || 'SENAI',
    caixa: item.caixa || '1.1',
    prioridade_abertura: item.prioridade_abertura || 'Média',
    descricao_envio: item.descricao_envio || 'Padrão',
    responsavel: item.responsavel || 'Membro KRT',
    status_ida: item.status_ida || 'Pendente',
    status_chegada: item.status_chegada || 'Pendente',
    status_volta: item.status_volta || 'Pendente',
    updated_at: now
  };

  // Update local state first for instant UX
  const localItems = getLocalItems();
  const existingIndex = localItems.findIndex((i) => i.id === newItem.id);
  let updatedLocal: InventarioItem[];

  if (existingIndex >= 0) {
    updatedLocal = [...localItems];
    updatedLocal[existingIndex] = { ...updatedLocal[existingIndex], ...newItem };
  } else {
    updatedLocal = [newItem, ...localItems];
  }
  saveLocalItems(updatedLocal);

  // Sync with Supabase if connected
  if (client && config.isConnected) {
    try {
      const payload = {
        id: newItem.id,
        sistema: newItem.sistema,
        item: newItem.item,
        descricao: newItem.descricao,
        valor_estimado: newItem.valor_estimado,
        quantidade: newItem.quantidade,
        tipo_item: newItem.tipo_item,
        transporte: newItem.transporte,
        caixa: newItem.caixa,
        prioridade_abertura: newItem.prioridade_abertura,
        descricao_envio: newItem.descricao_envio,
        responsavel: newItem.responsavel,
        status_ida: newItem.status_ida,
        status_chegada: newItem.status_chegada,
        status_volta: newItem.status_volta
      };

      const { error } = await client.from('inventario_krt').upsert(payload);
      if (error) throw error;
    } catch (err: any) {
      return { success: true, item: newItem, error: `Salvo localmente. Erro no Supabase: ${err.message}` };
    }
  }

  return { success: true, item: newItem };
}

export async function updateItemStageStatus(
  itemId: string,
  stage: 'status_ida' | 'status_chegada' | 'status_volta',
  newStatus: StatusIda | StatusChegada | StatusVolta
): Promise<{ success: boolean; error?: string }> {
  // Update local storage immediately
  const localItems = getLocalItems();
  const targetIndex = localItems.findIndex((i) => i.id === itemId);

  if (targetIndex >= 0) {
    localItems[targetIndex] = {
      ...localItems[targetIndex],
      [stage]: newStatus,
      updated_at: new Date().toISOString()
    };
    saveLocalItems(localItems);
  }

  // Update Supabase instantly
  const client = getSupabaseClient();
  const config = getSupabaseConfig();

  if (client && config.isConnected) {
    try {
      const { error } = await client
        .from('inventario_krt')
        .update({ [stage]: newStatus, updated_at: new Date().toISOString() })
        .eq('id', itemId);

      if (error) {
        throw error;
      }
    } catch (err: any) {
      return { success: true, error: `Atualizado local. Falha ao sincronizar Supabase: ${err.message}` };
    }
  }

  return { success: true };
}

export async function deleteInventoryItem(itemId: string): Promise<{ success: boolean; error?: string }> {
  // Local delete
  const localItems = getLocalItems();
  const filtered = localItems.filter((i) => i.id !== itemId);
  saveLocalItems(filtered);

  // Supabase delete
  const client = getSupabaseClient();
  const config = getSupabaseConfig();

  if (client && config.isConnected) {
    try {
      const { error } = await client.from('inventario_krt').delete().eq('id', itemId);
      if (error) throw error;
    } catch (err: any) {
      return { success: true, error: `Removido localmente. Supabase error: ${err.message}` };
    }
  }

  return { success: true };
}

export async function bulkInsertInventoryItems(newItems: Omit<InventarioItem, 'id'>[]): Promise<{ count: number; error?: string }> {
  const createdItems: InventarioItem[] = newItems.map((item, idx) => ({
    ...item,
    id: `krt-import-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    status_ida: item.status_ida || 'Pendente',
    status_chegada: item.status_chegada || 'Pendente',
    status_volta: item.status_volta || 'Pendente',
    prioridade_abertura: item.prioridade_abertura || 'Média',
    descricao_envio: item.descricao_envio || 'Padrão',
    responsavel: item.responsavel || 'Membro KRT'
  }));

  const localItems = getLocalItems();
  const combined = [...createdItems, ...localItems];
  saveLocalItems(combined);

  const client = getSupabaseClient();
  const config = getSupabaseConfig();

  if (client && config.isConnected) {
    try {
      const payload = createdItems.map((i) => ({
        id: i.id,
        sistema: i.sistema,
        item: i.item,
        descricao: i.descricao,
        valor_estimado: i.valor_estimado,
        quantidade: i.quantidade,
        tipo_item: i.tipo_item,
        transporte: i.transporte,
        caixa: i.caixa,
        prioridade_abertura: i.prioridade_abertura,
        descricao_envio: i.descricao_envio,
        responsavel: i.responsavel,
        status_ida: i.status_ida,
        status_chegada: i.status_chegada,
        status_volta: i.status_volta
      }));

      const { error } = await client.from('inventario_krt').insert(payload);
      if (error) throw error;
    } catch (err: any) {
      return { count: createdItems.length, error: `Inseridos ${createdItems.length} localmente. Supabase error: ${err.message}` };
    }
  }

  return { count: createdItems.length };
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  if (!url || !anonKey) {
    return { success: false, message: 'Forneça a URL e a Anon Key do Supabase.' };
  }

  try {
    const testClient = createClient(url.trim(), anonKey.trim());
    const { data, error } = await testClient.from('inventario_krt').select('count', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01' || error.message.includes('relation "inventario_krt" does not exist')) {
        return {
          success: false,
          message: 'Conectado com sucesso ao Supabase, mas a tabela "inventario_krt" ainda não existe. Execute o script SQL no Editor de SQL do Supabase!'
        };
      }
      return { success: false, message: `Erro ao consultar Supabase: ${error.message}` };
    }

    return { success: true, message: `Conexão efetuada com sucesso ao Supabase! Tabela "inventario_krt" identificada.` };
  } catch (err: any) {
    return { success: false, message: `Erro inesperado de conexão: ${err?.message || err}` };
  }
}
