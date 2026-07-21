export type Sistema =
  | 'Oficina'
  | 'Baja'
  | 'Eletrônica'
  | 'Drivetrain'
  | 'Frame & Body'
  | 'Freios'
  | 'Gerenciamento'
  | 'Suspensão'
  | 'Powertrain';

export type TipoItem = 'Retornável' | 'Consumível';

export type Transporte = 'SENAI' | 'ÔNIBUS';

export type Prioridade = 'Alta' | 'Média' | 'Baixa';

export type DescricaoEnvio =
  | 'Padrão'
  | 'Frágil'
  | 'Plástico Bolha'
  | 'Caixa Especial'
  | 'Amarrado / Solto'
  | 'Durex na Tampa';

export type StatusIda = 'Pendente' | 'Embalado' | 'Despachado';

export type StatusChegada = 'Pendente' | 'Recebido no Paddock';

export type StatusVolta = 'Pendente' | 'Embalado' | 'Retornou à Oficina' | 'Avariado/Perdido';

export interface InventarioItem {
  id: string;
  sistema: Sistema;
  item: string;
  descricao: string;
  valor_estimado?: number | null;
  quantidade: number;
  tipo_item: TipoItem;
  transporte: Transporte;
  caixa: string;
  prioridade_abertura: Prioridade;
  descricao_envio: string;
  responsavel: string;
  status_ida: StatusIda;
  status_chegada: StatusChegada;
  status_volta: StatusVolta;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export interface FilterOptions {
  search: string;
  sistema: string;
  transporte: string;
  caixa: string;
  responsavel: string;
  prioridade: string;
  statusIda: string;
  statusChegada: string;
  statusVolta: string;
  tipoItem: string;
}
