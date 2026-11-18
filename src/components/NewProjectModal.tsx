import React, { useState } from 'react';
import { X } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    code: string;
    address: string;
    superintendent: string;
  }) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [superintendent, setSuperintendent] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter a jobsite or building name.');
      return;
    }
    const cleanCode =
      code.trim().toUpperCase() ||
      name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 3)
        .toUpperCase() + '-101';

    onCreate({
      name: name.trim(),
      code: cleanCode,
      address: address.trim() || 'Site address pending',
      superintendent: superintendent.trim() || 'Field Superintendent',
    });

    setName('');
    setCode('');
    setAddress('');
    setSuperintendent('');
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-project-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 id="new-project-title" className="text-base font-semibold text-slate-900">
            Add New Jobsite
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-800">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="proj-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Jobsite Name <span className="text-red-600">*</span>
            </label>
            <input
              id="proj-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mercer Street Retail Buildout"
              className="w-full px-3.5 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="proj-code" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Project Code
              </label>
              <input
                id="proj-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="MSR-310"
                className="w-full px-3.5 py-2.5 text-sm font-mono uppercase text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label htmlFor="proj-super" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Superintendent
              </label>
              <input
                id="proj-super"
                type="text"
                value={superintendent}
                onChange={(e) => setSuperintendent(e.target.value)}
                placeholder="Jordan Hayes"
                className="w-full px-3.5 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="proj-address" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Site Address
            </label>
            <input
              id="proj-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="410 Mercer St, Seattle, WA"
              className="w-full px-3.5 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Create Jobsite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
