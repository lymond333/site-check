import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  Pencil,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { TRADE_DEFINITIONS } from '../data/seedData';
import { PunchItem, PunchStatus, TradeName } from '../types/punch';
import {
  formatShortDate,
  formatTimestamp,
  getPriorityLabel,
  getPriorityTextClass,
  getStatusLabel,
  getStatusTextClass,
  isOverdue,
} from '../utils/formatters';
import { compressImageFile } from '../utils/storage';
import { PunchImage } from './PunchImage';

interface PunchDetailDrawerProps {
  item: PunchItem | null;
  onClose: () => void;
  onEdit: (item: PunchItem) => void;
  onStatusChange: (itemId: string, status: PunchStatus) => void;
  onTradeReassign: (itemId: string, trade: TradeName, subcontractor: string) => void;
  onAddNote: (itemId: string, text: string) => void;
  onAttachAfterPhoto: (itemId: string, dataUrl: string) => void;
  onDelete: (itemId: string) => void;
}

export const PunchDetailDrawer: React.FC<PunchDetailDrawerProps> = ({
  item,
  onClose,
  onEdit,
  onStatusChange,
  onTradeReassign,
  onAddNote,
  onAttachAfterPhoto,
  onDelete,
}) => {
  const afterPhotoRef = useRef<HTMLInputElement>(null);
  const [photoTab, setPhotoTab] = useState<'before' | 'after'>('before');
  const [noteInput, setNoteInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!item) return null;

  const overdue = isOverdue(item.dueDate, item.status);

  const StatusIcon =
    item.status === PunchStatus.Resolved
      ? CheckCircle2
      : item.status === PunchStatus.InReview
        ? Clock
        : AlertCircle;

  const handleAfterPhotoSelect = async (file?: File) => {
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      onAttachAfterPhoto(item.id, compressed);
      setPhotoTab('after');
    } catch {
      // Handled gracefully
    }
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    onAddNote(item.id, noteInput.trim());
    setNoteInput('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px] no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-item-title"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <aside className="relative z-10 w-full max-w-xl bg-white h-full border-l border-slate-200 flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-sm font-semibold tabular-nums text-slate-900">
              {item.code}
            </span>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${getStatusTextClass(item.status)}`}>
              <StatusIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{getStatusLabel(item.status)}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Metadata */}
          <div>
            <h2 id="drawer-item-title" className="text-xl font-semibold text-slate-900 leading-snug">
              {item.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              <span>{item.location}</span>
              <span aria-hidden="true">·</span>
              <span className={getPriorityTextClass(item.priority)}>
                {getPriorityLabel(item.priority)} priority
              </span>
              <span aria-hidden="true">·</span>
              <span className={`font-mono tabular-nums ${overdue ? 'text-red-700 font-semibold' : ''}`}>
                Due {formatShortDate(item.dueDate)}
                {overdue ? ' (Overdue)' : ''}
              </span>
            </div>
          </div>

          {/* Photo Evidence Viewer */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPhotoTab('before')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    photoTab === 'before'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Issue Photo
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoTab('after')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    photoTab === 'after'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Completion Photo
                </button>
              </div>

              <button
                type="button"
                onClick={() => afterPhotoRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{item.afterPhotoUrl ? 'Replace After Photo' : 'Add After Photo'}</span>
              </button>
              <input
                ref={afterPhotoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  void handleAfterPhotoSelect(file);
                  e.target.value = '';
                }}
              />
            </div>

            {photoTab === 'before' ? (
              <div className="rounded-lg overflow-hidden border border-slate-200">
                <PunchImage
                  src={item.photoUrl}
                  alt={item.title}
                  pin={item.photoPin}
                  showPinLabel={Boolean(item.photoPin)}
                />
              </div>
            ) : item.afterPhotoUrl ? (
              <div className="rounded-lg overflow-hidden border border-slate-200">
                <PunchImage src={item.afterPhotoUrl} alt={`${item.title} completion verification`} />
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-lg border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <Camera className="w-7 h-7 text-slate-400 mb-2" strokeWidth={1.6} />
                <p className="text-sm font-medium text-slate-700">No completion photo uploaded</p>
                <p className="text-xs text-slate-500 mt-1 mb-4 max-w-xs">
                  Upload a verification photo after the subcontractor completes corrective work.
                </p>
                <button
                  type="button"
                  onClick={() => afterPhotoRef.current?.click()}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Upload Completion Photo
                </button>
              </div>
            )}
          </div>

          {/* Status Workflow Controls */}
          <div className="pt-4 border-t border-slate-200">
            <span className="block text-xs font-semibold text-slate-500 mb-2.5">
              Inspection Status
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: PunchStatus.Open, label: 'Open' },
                { value: PunchStatus.InReview, label: 'In Review' },
                { value: PunchStatus.Resolved, label: 'Resolved' },
              ].map((step) => {
                const isActive = item.status === step.value;
                return (
                  <button
                    key={step.value}
                    type="button"
                    onClick={() => onStatusChange(item.id, step.value)}
                    className={`py-2.5 px-3 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      isActive
                        ? step.value === PunchStatus.Resolved
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : step.value === PunchStatus.InReview
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {step.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assigned Trade Quick Reassignment */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="drawer-trade-select"
                className="block text-xs font-semibold text-slate-500 mb-1.5"
              >
                Assigned Trade
              </label>
              <select
                id="drawer-trade-select"
                value={item.trade}
                onChange={(e) => {
                  const nextTrade = e.target.value as TradeName;
                  const def = TRADE_DEFINITIONS.find((t) => t.name === nextTrade);
                  onTradeReassign(
                    item.id,
                    nextTrade,
                    def ? def.defaultSubcontractor : item.subcontractor
                  );
                }}
                className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              >
                {TRADE_DEFINITIONS.map((def) => (
                  <option key={def.name} value={def.name}>
                    {def.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-500 mb-1.5">
                Subcontractor Crew
              </span>
              <div className="px-3 py-2 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg truncate">
                {item.subcontractor}
              </div>
            </div>
          </div>

          {/* Scope Description */}
          {item.description && (
            <div className="pt-4 border-t border-slate-200">
              <span className="block text-xs font-semibold text-slate-500 mb-1.5">
                Scope & Corrective Action
              </span>
              <p className="text-sm text-slate-700 leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Field Notes Log */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Field Log Notes</span>
              <span className="font-mono text-xs tabular-nums text-slate-400">
                {item.notes.length} entries
              </span>
            </div>

            {item.notes.length > 0 ? (
              <div className="space-y-3">
                {item.notes.map((note) => (
                  <div key={note.id} className="py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-slate-800">{note.author}</span>
                      <span className="font-mono tabular-nums">{formatTimestamp(note.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-700">{note.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No follow-up notes logged yet.</p>
            )}

            <form onSubmit={handleNoteSubmit} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Add site inspection update or trade note..."
                className="flex-1 px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                disabled={!noteInput.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="font-mono text-xs tabular-nums text-slate-500">
            Logged {formatShortDate(item.createdAt)}
          </span>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Item</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">Remove permanently?</span>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  onDelete(item.id);
                }}
                className="px-2.5 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Confirm Delete
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
