import React, { useEffect, useRef, useState } from 'react';
import { Camera, Crosshair, Trash2, Upload, X } from 'lucide-react';
import { TRADE_DEFINITIONS } from '../data/seedData';
import { PhotoPin, PunchItem, PunchPriority, PunchStatus, TradeName } from '../types/punch';
import { compressImageFile } from '../utils/storage';
import { PunchImage } from './PunchImage';

interface PunchFormModalProps {
  isOpen: boolean;
  editingItem?: PunchItem | null;
  defaultTrade?: TradeName;
  onClose: () => void;
  onSubmit: (data: {
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
  }) => void;
}

export const PunchFormModal: React.FC<PunchFormModalProps> = ({
  isOpen,
  editingItem,
  defaultTrade = 'Electrical',
  onClose,
  onSubmit,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trade, setTrade] = useState<TradeName>(defaultTrade);
  const [subcontractor, setSubcontractor] = useState('');
  const [subEditedManually, setSubEditedManually] = useState(false);
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<PunchPriority>(PunchPriority.Standard);
  const [status, setStatus] = useState<PunchStatus>(PunchStatus.Open);
  const [dueDate, setDueDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPin, setPhotoPin] = useState<PhotoPin | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      setTitle(editingItem.title);
      setDescription(editingItem.description);
      setTrade(editingItem.trade);
      setSubcontractor(editingItem.subcontractor);
      setSubEditedManually(true);
      setLocation(editingItem.location);
      setPriority(editingItem.priority);
      setStatus(editingItem.status);
      setDueDate(editingItem.dueDate);
      setPhotoUrl(editingItem.photoUrl);
      setPhotoPin(editingItem.photoPin);
    } else {
      const initialTradeDef =
        TRADE_DEFINITIONS.find((t) => t.name === defaultTrade) || TRADE_DEFINITIONS[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 5);
      setTitle('');
      setDescription('');
      setTrade(initialTradeDef.name);
      setSubcontractor(initialTradeDef.defaultSubcontractor);
      setSubEditedManually(false);
      setLocation('');
      setPriority(PunchPriority.Standard);
      setStatus(PunchStatus.Open);
      setDueDate(nextWeek.toISOString().slice(0, 10));
      setPhotoUrl('');
      setPhotoPin(undefined);
    }
    setErrorMsg('');
  }, [isOpen, editingItem, defaultTrade]);

  if (!isOpen) return null;

  const handleTradeChange = (nextTrade: TradeName) => {
    setTrade(nextTrade);
    if (!subEditedManually) {
      const def = TRADE_DEFINITIONS.find((t) => t.name === nextTrade);
      if (def) setSubcontractor(def.defaultSubcontractor);
    }
  };

  const handleFileProcess = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }
    setErrorMsg('');
    setIsCompressing(true);
    try {
      const compressed = await compressImageFile(file);
      setPhotoUrl(compressed);
      setPhotoPin(undefined);
    } catch {
      setErrorMsg('Could not process that image. Please try another photo.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    void handleFileProcess(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) {
      setErrorMsg('Attach or capture a site photo so the assigned trade can locate the issue.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Enter a clear issue summary title.');
      return;
    }
    if (!location.trim()) {
      setErrorMsg('Specify the floor, zone, or room location.');
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      trade,
      subcontractor: subcontractor.trim() || 'Unassigned Subcontractor',
      location: location.trim(),
      priority,
      status,
      dueDate,
      photoUrl,
      photoPin,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="punch-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h2 id="punch-modal-title" className="text-lg font-semibold text-slate-900">
              {editingItem ? `Edit ${editingItem.code}` : 'Add Punch Item'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Attach a site inspection photo, mark the defect spot, and assign the responsible trade.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {errorMsg && (
            <div
              role="alert"
              className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 font-medium"
            >
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: Photo Capture & Defect Pinning */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Site Photo <span className="text-red-600">*</span>
                </label>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl('');
                      setPhotoPin(undefined);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Replace photo</span>
                  </button>
                )}
              </div>

              {!photoUrl ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`aspect-[4/3] rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-5 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-600 bg-blue-50/70'
                      : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  <Camera className="w-8 h-8 text-slate-400 mb-3" strokeWidth={1.6} />
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    {isCompressing ? 'Optimizing photo...' : 'Drop site photo here'}
                  </p>
                  <p className="text-xs text-slate-500 mb-4">JPEG, PNG, or mobile camera capture</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Take Photo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-lg overflow-hidden border border-slate-200">
                    <PunchImage
                      src={photoUrl}
                      alt={title || 'Punch item site photo'}
                      pin={photoPin}
                      interactivePin
                      onPinChange={(pin) => setPhotoPin(pin)}
                      showPinLabel
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>
                        {photoPin ? 'Pin placed. Click photo to move.' : 'Click photo to pin exact defect.'}
                      </span>
                    </span>
                    {photoPin && (
                      <button
                        type="button"
                        onClick={() => setPhotoPin(undefined)}
                        className="text-slate-500 hover:text-slate-900 font-medium whitespace-nowrap shrink-0 ml-2"
                      >
                        Clear pin
                      </button>
                    )}
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  void handleFileProcess(file);
                  e.target.value = '';
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  void handleFileProcess(file);
                  e.target.value = '';
                }}
              />
            </div>

            {/* Right Column: Trade Assignment & Defect Details */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <label htmlFor="punch-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Issue Summary <span className="text-red-600">*</span>
                </label>
                <input
                  id="punch-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Loose GFCI receptacle box beside sink vanity"
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="punch-trade" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Assigned Trade <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="punch-trade"
                    value={trade}
                    onChange={(e) => handleTradeChange(e.target.value as TradeName)}
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                  >
                    {TRADE_DEFINITIONS.map((def) => (
                      <option key={def.name} value={def.name}>
                        {def.name} ({def.csiDivision})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="punch-sub" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Subcontractor
                  </label>
                  <input
                    id="punch-sub"
                    type="text"
                    value={subcontractor}
                    onChange={(e) => {
                      setSubcontractor(e.target.value);
                      setSubEditedManually(true);
                    }}
                    placeholder="Company or foreman name"
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="punch-location" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Floor / Room Location <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="punch-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Level 2 · Exam Room 204"
                    className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                  />
                </div>

                <div>
                  <label htmlFor="punch-due" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Due Date
                  </label>
                  <input
                    id="punch-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                  />
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-1.5">Priority</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: PunchPriority.Critical, label: 'Critical' },
                    { value: PunchPriority.Standard, label: 'Standard' },
                    { value: PunchPriority.Cosmetic, label: 'Cosmetic' },
                  ].map((option) => {
                    const active = priority === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPriority(option.value)}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="punch-desc" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Scope & Corrective Action Notes
                </label>
                <textarea
                  id="punch-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the defect condition and required fix for the trade crew..."
                  className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCompressing}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              {editingItem ? 'Save Changes' : 'Create Punch Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
