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

interface PunchTableProps {
  items: PunchItem[];
  onSelectItem: (item: PunchItem) => void;
  onStatusChange: (itemId: string, nextStatus: PunchStatus) => void;
}

export const PunchTable: React.FC<PunchTableProps> = ({
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
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
              <th className="py-3 pl-4 pr-3 whitespace-nowrap">Photo</th>
              <th className="py-3 px-3 whitespace-nowrap">Item ID</th>
              <th className="py-3 px-3">Issue & Location</th>
              <th className="py-3 px-3 whitespace-nowrap">Assigned Trade</th>
              <th className="py-3 px-3 whitespace-nowrap">Priority</th>
              <th className="py-3 px-3 whitespace-nowrap">Status</th>
              <th className="py-3 px-3 text-right whitespace-nowrap">Due Date</th>
              <th className="py-3 pl-3 pr-4 text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
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
                <tr
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="hover:bg-slate-50/90 transition-colors cursor-pointer"
                >
                  <td className="py-2.5 pl-4 pr-3 w-20">
                    <div className="w-16 rounded-md overflow-hidden border border-slate-200">
                      <PunchImage
                        src={item.photoUrl}
                        alt={item.title}
                        aspectClassName="aspect-[4/3]"
                      />
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs font-semibold tabular-nums text-slate-800 whitespace-nowrap">
                    {item.code}
                  </td>
                  <td className="py-2.5 px-3 min-w-[220px]">
                    <div className="font-semibold text-slate-900 line-clamp-1">{item.title}</div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">{item.location}</div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{item.trade}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[180px]">
                      {item.subcontractor}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-xs">
                    <span className={getPriorityTextClass(item.priority)}>
                      {getPriorityLabel(item.priority)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${getStatusTextClass(
                        item.status
                      )}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{getStatusLabel(item.status)}</span>
                    </span>
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-mono text-xs tabular-nums whitespace-nowrap ${
                      overdue ? 'text-red-700 font-semibold' : 'text-slate-600'
                    }`}
                  >
                    {formatShortDate(item.dueDate)}
                  </td>
                  <td
                    className="py-2.5 pl-3 pr-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onStatusChange(item.id, action.next)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      {action.label}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
