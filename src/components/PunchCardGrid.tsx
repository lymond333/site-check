import React from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { PunchItem, PunchStatus } from '../types/punch';
import {
  formatShortDate,
  getPriorityLabel,
  getPriorityTextClass,
  getStatusLabel,
  getStatusTextClass,
  isOverdue,
} from '../utils/formatters';
import { PunchImage } from './PunchImage';

interface PunchCardGridProps {
  items: PunchItem[];
  onSelectItem: (item: PunchItem) => void;
  onStatusChange: (itemId: string, nextStatus: PunchStatus) => void;
}

export const PunchCardGrid: React.FC<PunchCardGridProps> = ({
  items,
  onSelectItem,
  onStatusChange,
}) => {
  const getNextStatusAction = (status: PunchStatus): { label: string; next: PunchStatus } => {
    switch (status) {
      case PunchStatus.Open:
        return { label: 'Mark In Review', next: PunchStatus.InReview };
      case PunchStatus.InReview:
        return { label: 'Verify & Resolve', next: PunchStatus.Resolved };
      case PunchStatus.Resolved:
        return { label: 'Reopen', next: PunchStatus.Open };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {items.map((item) => {
        const overdue = isOverdue(item.dueDate, item.status);
        const action = getNextStatusAction(item.status);
        const StatusIcon =
          item.status === PunchStatus.Resolved
            ? CheckCircle2
            : item.status === PunchStatus.InReview
              ? Clock
              : AlertCircle;

        return (
          <article
            key={item.id}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col hover:border-slate-300 transition-colors"
          >
            {/* Photo Slot */}
            <button
              type="button"
              onClick={() => onSelectItem(item)}
              className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
              aria-label={`Inspect ${item.code}: ${item.title}`}
            >
              <PunchImage src={item.photoUrl} alt={item.title} pin={item.photoPin} />
            </button>

            {/* Card Body */}
            <div className="p-4 flex-1 flex flex-col">
              {/* Unboxed metadata line with typographic separators */}
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <div className="truncate">
                  <span className="font-mono font-semibold tabular-nums text-slate-800">
                    {item.code}
                  </span>
                  <span className="mx-1.5 text-slate-300" aria-hidden="true">
                    ·
                  </span>
                  <span className="font-medium text-slate-700">{item.trade}</span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 font-semibold whitespace-nowrap shrink-0 ${getStatusTextClass(
                    item.status
                  )}`}
                >
                  <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{getStatusLabel(item.status)}</span>
                </span>
              </div>

              {/* Title */}
              <button
                type="button"
                onClick={() => onSelectItem(item)}
                className="mt-2 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
              >
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">
                  {item.title}
                </h3>
              </button>

              {/* Location & Priority unboxed line */}
              <div className="mt-1.5 text-xs text-slate-500 truncate">
                <span>{item.location}</span>
                <span className="mx-1.5 text-slate-300" aria-hidden="true">
                  ·
                </span>
                <span className={getPriorityTextClass(item.priority)}>
                  {getPriorityLabel(item.priority)}
                </span>
              </div>

              {/* Subcontractor & Due Date */}
              <div className="mt-auto pt-4 flex items-center justify-between gap-3 border-t border-slate-100 mt-4">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-700 truncate">
                    {item.subcontractor}
                  </div>
                  <div
                    className={`text-xs font-mono tabular-nums mt-0.5 ${
                      overdue ? 'text-red-700 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    Due {formatShortDate(item.dueDate)}
                    {overdue ? ' · Overdue' : ''}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onStatusChange(item.id, action.next)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  {action.label}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};
