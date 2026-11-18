/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutGrid,
  List,
  Menu,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { NewProjectModal } from './components/NewProjectModal';
import { PunchCardGrid } from './components/PunchCardGrid';
import { PunchDetailDrawer } from './components/PunchDetailDrawer';
import { PunchFormModal } from './components/PunchFormModal';
import { PunchTable } from './components/PunchTable';
import { Sidebar } from './components/Sidebar';
import {
  PhotoPin,
  Project,
  PunchItem,
  PunchPriority,
  PunchStatus,
  SortOption,
  TradeName,
  ViewMode,
} from './types/punch';
import { formatShortDate, generateNextPunchCode, getStatusLabel } from './utils/formatters';
import { exportProjectCsv, loadWorkspaceState, saveWorkspaceState } from './utils/storage';

const PRIORITY_WEIGHT: Record<PunchPriority, number> = {
  [PunchPriority.Critical]: 0,
  [PunchPriority.Standard]: 1,
  [PunchPriority.Cosmetic]: 2,
};

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<PunchItem[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');

  // Workspace UI filters & modes
  const [selectedTrade, setSelectedTrade] = useState<TradeName | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<PunchStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<PunchPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Drawers & Modals
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PunchItem | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);

  // Load workspace from IndexedDB on mount
  useEffect(() => {
    let active = true;
    void loadWorkspaceState().then((state) => {
      if (!active) return;
      setProjects(state.projects);
      setItems(state.items);
      setActiveProjectId(state.activeProjectId || state.projects[0]?.id || '');
      setIsLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist workspace whenever state mutates after initial load
  useEffect(() => {
    if (!isLoaded) return;
    void saveWorkspaceState({
      projects,
      items,
      activeProjectId,
    });
  }, [isLoaded, projects, items, activeProjectId]);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0] || null,
    [projects, activeProjectId]
  );

  const projectItems = useMemo(
    () => items.filter((item) => item.projectId === activeProject?.id),
    [items, activeProject?.id]
  );

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) || null,
    [items, selectedItemId]
  );

  // Compute summary metrics for active project
  const metrics = useMemo(() => {
    const total = projectItems.length;
    const open = projectItems.filter((i) => i.status === PunchStatus.Open).length;
    const inReview = projectItems.filter((i) => i.status === PunchStatus.InReview).length;
    const resolved = projectItems.filter((i) => i.status === PunchStatus.Resolved).length;
    const completionPct = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, open, inReview, resolved, completionPct };
  }, [projectItems]);

  // Apply trade, status, priority, search, and sort
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = projectItems.filter((item) => {
      if (selectedTrade !== 'all' && item.trade !== selectedTrade) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
      if (query) {
        const haystack = [
          item.code,
          item.title,
          item.description,
          item.trade,
          item.subcontractor,
          item.location,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'priority': {
          const pDiff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
          if (pDiff !== 0) return pDiff;
          return b.createdAt.localeCompare(a.createdAt);
        }
        case 'trade':
          return a.trade.localeCompare(b.trade);
        case 'due_date':
          return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
        case 'newest':
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    });
  }, [projectItems, selectedTrade, statusFilter, priorityFilter, searchQuery, sortBy]);

  const hasActiveFilters =
    selectedTrade !== 'all' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    searchQuery.trim() !== '';

  const resetFilters = () => {
    setSelectedTrade('all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSearchQuery('');
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (item: PunchItem) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleSavePunchItem = (formData: {
    title: string;
    description: string;
    trade: TradeName;
    subcontractor: string;
    location: string;
    priority: PunchPriority;
    status: PunchStatus;
    dueDate: string;
    photoUrl: string;
    photoPin?: PhotoPin;
  }) => {
    const now = new Date().toISOString();

    if (editingItem) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                ...formData,
                updatedAt: now,
              }
            : item
        )
      );
      setFormModalOpen(false);
      setEditingItem(null);
      return;
    }

    if (!activeProject) return;
    const nextCode = generateNextPunchCode(projectItems.map((i) => i.code));
    const newItem: PunchItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      code: nextCode,
      projectId: activeProject.id,
      ...formData,
      createdAt: now,
      updatedAt: now,
      notes: [],
    };

    setItems((prev) => [newItem, ...prev]);
    setFormModalOpen(false);
  };

  const handleStatusChange = (itemId: string, nextStatus: PunchStatus) => {
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: nextStatus,
              updatedAt: now,
            }
          : item
      )
    );
  };

  const handleTradeReassign = (itemId: string, trade: TradeName, subcontractor: string) => {
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              trade,
              subcontractor,
              updatedAt: now,
            }
          : item
      )
    );
  };

  const handleAddNote = (itemId: string, text: string) => {
    const now = new Date().toISOString();
    const author = activeProject?.superintendent || 'Field Contractor';
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              updatedAt: now,
              notes: [
                ...item.notes,
                {
                  id: `note-${Date.now()}`,
                  author,
                  text,
                  createdAt: now,
                },
              ],
            }
          : item
      )
    );
  };

  const handleAttachAfterPhoto = (itemId: string, dataUrl: string) => {
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              afterPhotoUrl: dataUrl,
              updatedAt: now,
            }
          : item
      )
    );
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
    }
  };

  const handleCreateProject = (data: {
    name: string;
    code: string;
    address: string;
    superintendent: string;
  }) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: data.name,
      code: data.code,
      address: data.address,
      superintendent: data.superintendent,
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setSelectedTrade('all');
    setStatusFilter('all');
    setNewProjectModalOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <Sidebar
        projects={projects}
        activeProjectId={activeProject?.id || ''}
        onSelectProject={(id) => {
          setActiveProjectId(id);
          setSelectedTrade('all');
          setSelectedItemId(null);
        }}
        onOpenNewProject={() => setNewProjectModalOpen(true)}
        selectedTrade={selectedTrade}
        onSelectTrade={setSelectedTrade}
        projectItems={projectItems}
        onExportCsv={() => {
          if (activeProject) exportProjectCsv(activeProject, filteredItems);
        }}
        onPrintReport={() => window.print()}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header Bar */}
        <header className="no-print h-16 px-4 sm:px-8 bg-white border-b border-slate-200 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 hidden sm:inline whitespace-nowrap">Projects</span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-slate-900 truncate">
                {activeProject?.name || 'Loading Jobsite...'}
              </span>
              {selectedTrade !== 'all' && (
                <>
                  <span className="text-slate-300" aria-hidden="true">
                    /
                  </span>
                  <span className="text-blue-700 font-medium truncate">{selectedTrade}</span>
                </>
              )}
            </nav>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Add Punch Item</span>
          </button>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-[1360px] w-full mx-auto space-y-6">
          {/* Jobsite Header & Summary Strip */}
          {activeProject && (
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {activeProject.name}
                  </h1>
                  <p className="text-sm text-slate-500 mt-0.5">
                    <span className="font-mono text-xs text-slate-700">{activeProject.code}</span>
                    <span className="mx-2 text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    <span>{activeProject.address}</span>
                    <span className="mx-2 text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    <span>Superintendent: {activeProject.superintendent}</span>
                  </p>
                </div>
              </div>

              {/* Single-elevation 5-column metric strip */}
              <div className="bg-white border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                <div className="p-4">
                  <div className="text-xs font-medium text-slate-500">Total Items</div>
                  <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
                    {metrics.total}
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs font-medium text-slate-500">Open Defects</div>
                  <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-red-700">
                    {metrics.open}
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs font-medium text-slate-500">In Review</div>
                  <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-amber-700">
                    {metrics.inReview}
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs font-medium text-slate-500">Resolved</div>
                  <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-700">
                    {metrics.resolved}
                  </div>
                </div>
                <div className="p-4 col-span-2 sm:col-span-1">
                  <div className="text-xs font-medium text-slate-500">Closeout Rate</div>
                  <div className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
                    {metrics.completionPct}%
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Filter & Search Toolbar */}
          <section className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search & Status Segmented Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search punch ID, room, trade, or subcontractor..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                />
              </div>

              <div
                className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start"
                role="group"
                aria-label="Filter by status"
              >
                {[
                  { value: 'all', label: 'All' },
                  { value: PunchStatus.Open, label: 'Open' },
                  { value: PunchStatus.InReview, label: 'In Review' },
                  { value: PunchStatus.Resolved, label: 'Resolved' },
                ].map((tab) => {
                  const active = statusFilter === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setStatusFilter(tab.value as PunchStatus | 'all')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority, Sort & View Mode */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  aria-label="Filter by priority"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as PunchPriority | 'all')}
                  className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none"
                >
                  <option value="all">All Priorities</option>
                  <option value={PunchPriority.Critical}>Critical Only</option>
                  <option value={PunchPriority.Standard}>Standard Only</option>
                  <option value={PunchPriority.Cosmetic}>Cosmetic Only</option>
                </select>
              </div>

              <select
                aria-label="Sort punch items"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="newest">Sort: Newest</option>
                <option value="priority">Sort: Priority</option>
                <option value="trade">Sort: Trade</option>
                <option value="due_date">Sort: Due Date</option>
              </select>

              <div
                className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg"
                role="group"
                aria-label="Switch layout view"
              >
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-label="Photo card grid view"
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-label="Inspection table view"
                  title="Table view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Items Feed: Loading / Empty / Populated */}
          {!isLoaded ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-slate-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 w-1/2 bg-slate-200 rounded" />
                    <div className="h-4 w-5/6 bg-slate-200 rounded" />
                    <div className="h-3 w-2/3 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : projectItems.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl py-16 px-6 text-center">
              <h2 className="text-lg font-semibold text-slate-900">
                No punch items logged for {activeProject?.name}
              </h2>
              <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
                Start your site walkthrough by capturing a defect photo and assigning the
                responsible subcontractor trade.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Log First Punch Item</span>
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl py-14 px-6 text-center">
              <h2 className="text-base font-semibold text-slate-900">
                No punch items match your active filters
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Try clearing the trade, status, or search filter to see all {projectItems.length}{' '}
                items on this jobsite.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="no-print">
              {viewMode === 'grid' ? (
                <PunchCardGrid
                  items={filteredItems}
                  onSelectItem={(item) => setSelectedItemId(item.id)}
                  onStatusChange={handleStatusChange}
                />
              ) : (
                <PunchTable
                  items={filteredItems}
                  onSelectItem={(item) => setSelectedItemId(item.id)}
                  onStatusChange={handleStatusChange}
                />
              )}
            </div>
          )}

          {/* Clean Print Walkthrough Table (only rendered when printing) */}
          <section className="hidden print:block pt-4">
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              Walkthrough Punch Report ({filteredItems.length} items)
            </h2>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-left">
                  <th className="py-2 pr-2">ID</th>
                  <th className="py-2 px-2">Photo</th>
                  <th className="py-2 px-2">Issue & Location</th>
                  <th className="py-2 px-2">Trade / Subcontractor</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 pl-2 text-right">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-2 font-mono font-semibold">{item.code}</td>
                    <td className="py-2 px-2">
                      <img
                        src={item.photoUrl}
                        alt={item.title}
                        className="w-20 h-14 object-cover rounded border border-slate-200"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-slate-600">{item.location}</div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="font-medium">{item.trade}</div>
                      <div className="text-slate-600">{item.subcontractor}</div>
                    </td>
                    <td className="py-2 px-2">{getStatusLabel(item.status)}</td>
                    <td className="py-2 pl-2 text-right font-mono">
                      {formatShortDate(item.dueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      </div>

      {/* Add / Edit Punch Item Modal */}
      <PunchFormModal
        isOpen={formModalOpen}
        editingItem={editingItem}
        defaultTrade={selectedTrade === 'all' ? 'Electrical' : selectedTrade}
        onClose={() => {
          setFormModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSavePunchItem}
      />

      {/* Item Detail Slide-Over Drawer */}
      <PunchDetailDrawer
        item={selectedItem}
        onClose={() => setSelectedItemId(null)}
        onEdit={(item) => {
          handleOpenEditModal(item);
        }}
        onStatusChange={handleStatusChange}
        onTradeReassign={handleTradeReassign}
        onAddNote={handleAddNote}
        onAttachAfterPhoto={handleAttachAfterPhoto}
        onDelete={handleDeleteItem}
      />

      {/* New Jobsite Modal */}
      <NewProjectModal
        isOpen={newProjectModalOpen}
        onClose={() => setNewProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}
