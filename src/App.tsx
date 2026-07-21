import React, { useState, useEffect, useCallback } from 'react';
import { InventarioItem, SupabaseConfig, Sistema } from './types';
import {
  fetchInventoryItems,
  saveInventoryItem,
  updateItemStageStatus,
  deleteInventoryItem,
  bulkInsertInventoryItems,
  getSupabaseConfig,
  saveLocalItems
} from './lib/supabaseService';
import { INITIAL_INVENTORY } from './data/initialInventory';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TravelChecklist } from './components/TravelChecklist';
import { ItemManagement } from './components/ItemManagement';
import { ExcelImporter } from './components/ExcelImporter';
import { PythonAndSqlDocs } from './components/PythonAndSqlDocs';
import { ItemFormModal } from './components/ItemFormModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSupabaseConfig());

  // Loading & Action States
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventarioItem | null>(null);

  // Load Inventory Data
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    const res = await fetchInventoryItems();
    setItems(res.items);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Item Save (Create or Edit)
  const handleSaveItem = async (itemData: Partial<InventarioItem> & { item: string; sistema: Sistema }) => {
    setIsSaving(true);
    await saveInventoryItem(itemData);
    await loadData();
    setIsSaving(false);
  };

  // Handle Interactive Status Change in Checklist
  const handleUpdateStatus = async (
    itemId: string,
    stage: 'status_ida' | 'status_chegada' | 'status_volta',
    newStatus: any
  ) => {
    // Optimistic UI update for instant response
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, [stage]: newStatus } : i))
    );

    await updateItemStageStatus(itemId, stage, newStatus);
  };

  // Handle Item Delete
  const handleDeleteItem = async (itemId: string) => {
    setIsDeleting(true);
    await deleteInventoryItem(itemId);
    await loadData();
    setIsDeleting(false);
  };

  // Handle Bulk Excel Import
  const handleBulkImport = async (newItems: Omit<InventarioItem, 'id'>[]) => {
    setIsImporting(true);
    const res = await bulkInsertInventoryItems(newItems);
    await loadData();
    setIsImporting(false);
    return res;
  };

  // Reload Official Default KRT Dataset
  const handleReloadOfficialInventory = async () => {
    setIsImporting(true);
    saveLocalItems(INITIAL_INVENTORY);
    await loadData();
    setIsImporting(false);
  };

  const uniqueSystemsCount = new Set(items.map((i) => i.sistema)).size;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <Header
        supabaseConfig={supabaseConfig}
        activeTab={activeTab}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onRefreshData={loadData}
        isRefreshing={isRefreshing}
        totalItemsCount={items.length}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          itemsCount={items.length}
          systemsCount={uniqueSystemsCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              items={items}
              onNavigateToChecklist={() => setActiveTab('checklist')}
              onNavigateToItems={() => setActiveTab('items')}
            />
          )}

          {activeTab === 'checklist' && (
            <TravelChecklist
              items={items}
              onUpdateStatus={handleUpdateStatus}
              isUpdating={false}
            />
          )}

          {activeTab === 'items' && (
            <ItemManagement
              items={items}
              onOpenCreateModal={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              onOpenEditModal={(item) => {
                setEditingItem(item);
                setIsModalOpen(true);
              }}
              onDeleteItem={handleDeleteItem}
              isDeleting={isDeleting}
            />
          )}

          {activeTab === 'importer' && (
            <ExcelImporter
              onBulkImport={handleBulkImport}
              onReloadOfficialInventory={handleReloadOfficialInventory}
              isImporting={isImporting}
            />
          )}

          {activeTab === 'docs' && (
            <PythonAndSqlDocs
              supabaseConfig={supabaseConfig}
              onConfigChange={(newCfg) => setSupabaseConfig(newCfg)}
            />
          )}
        </main>
      </div>

      {/* CRUD Form Modal */}
      <ItemFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        initialData={editingItem}
        isSaving={isSaving}
      />
    </div>
  );
}
