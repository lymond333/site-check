import React from 'react';
import { Download, FolderPlus, Printer, X } from 'lucide-react';
import { TRADE_DEFINITIONS } from '../data/seedData';
import { Project, PunchItem, PunchStatus, TradeName } from '../types/punch';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onOpenNewProject: () => void;
  selectedTrade: TradeName | 'all';
  onSelectTrade: (trade: TradeName | 'all') => void;
  projectItems: PunchItem[];
  onExportCsv: () => void;
  onPrintReport: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onOpenNewProject,
  selectedTrade,
  onSelectTrade,
  projectItems,
  onExportCsv,
  onPrintReport,
  mobileOpen,
  onCloseMobile,
}) => {
  const openCountTotal = projectItems.filter((i) => i.status !== PunchStatus.Resolved).length;

  const getTradeCounts = (trade: TradeName) => {
    const items = projectItems.filter((i) => i.trade === trade);
    const open = items.filter((i) => i.status !== PunchStatus.Resolved).length;
    return { total: items.length, open };
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-[264px] shrink-0">
      {/* Brand Zone */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 shrink-0">
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          SiteCheck
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-2 -mr-2 text-slate-500 hover:text-slate-900 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Jobsite Switcher */}
      <div className="px-4 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">Active Jobsite</span>
          <button
            type="button"
            onClick={onOpenNewProject}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0 py-1 px-1.5 rounded hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Site</span>
          </button>
        </div>
        <div className="space-y-1">
          {projects.map((project) => {
            const isActive = project.id === activeProjectId;
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => {
                  onSelectProject(project.id);
                  onCloseMobile();
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="text-sm font-medium truncate">{project.name}</div>
                <div
                  className={`text-xs font-mono tabular-nums truncate mt-0.5 ${
                    isActive ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {project.code} · {project.superintendent}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trade Directory Filter */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="px-2 mb-2 text-xs font-semibold text-slate-500">Assigned Trades</div>
        <nav className="space-y-0.5" aria-label="Filter by trade">
          <button
            type="button"
            onClick={() => {
              onSelectTrade('all');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              selectedTrade === 'all'
                ? 'bg-blue-50 text-blue-800 font-semibold'
                : 'text-slate-700 hover:bg-slate-100 font-medium'
            }`}
          >
            <span className="truncate">All Trades</span>
            <span className="font-mono text-xs tabular-nums ml-2 shrink-0">
              {openCountTotal} open
            </span>
          </button>

          {TRADE_DEFINITIONS.map((trade) => {
            const { total, open } = getTradeCounts(trade.name);
            const isActive = selectedTrade === trade.name;
            return (
              <button
                key={trade.name}
                type="button"
                onClick={() => {
                  onSelectTrade(trade.name);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isActive
                    ? 'bg-blue-50 text-blue-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="truncate">{trade.name}</span>
                <span
                  className={`font-mono text-xs tabular-nums ml-2 shrink-0 ${
                    open > 0
                      ? isActive
                        ? 'text-blue-700 font-semibold'
                        : 'text-slate-700 font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  {open > 0 ? open : total > 0 ? '0' : '—'}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Export Actions */}
      <div className="p-4 border-t border-slate-200 space-y-2 shrink-0">
        <button
          type="button"
          onClick={onExportCsv}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Trade CSV</span>
        </button>
        <button
          type="button"
          onClick={onPrintReport}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Walkthrough</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block no-print h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile slide-over sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden no-print flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
