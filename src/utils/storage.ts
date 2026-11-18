import { INITIAL_PROJECTS, INITIAL_PUNCH_ITEMS } from '../data/seedData';
import { Project, PunchItem } from '../types/punch';

const DB_NAME = 'sitecheck_punch_db';
const DB_VERSION = 1;
const STORE_NAME = 'workspace_state';
const STATE_KEY = 'primary_workspace';
const LS_FALLBACK_KEY = 'sitecheck_workspace_fallback_v1';

export interface WorkspaceState {
  projects: Project[];
  items: PunchItem[];
  activeProjectId: string;
}

function getDefaultState(): WorkspaceState {
  return {
    projects: INITIAL_PROJECTS,
    items: INITIAL_PUNCH_ITEMS,
    activeProjectId: INITIAL_PROJECTS[0].id,
  };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

export async function loadWorkspaceState(): Promise<WorkspaceState> {
  try {
    const db = await openDatabase();
    return await new Promise<WorkspaceState>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STATE_KEY);
      req.onsuccess = () => {
        if (req.result && Array.isArray(req.result.projects) && Array.isArray(req.result.items)) {
          resolve(req.result as WorkspaceState);
        } else {
          resolve(getDefaultState());
        }
      };
      req.onerror = () => resolve(getDefaultState());
    });
  } catch {
    try {
      const raw = localStorage.getItem(LS_FALLBACK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as WorkspaceState;
        if (Array.isArray(parsed.projects) && Array.isArray(parsed.items)) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage parsing failures
    }
    return getDefaultState();
  }
}

export async function saveWorkspaceState(state: WorkspaceState): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(state, STATE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors on fallback
    }
  }
}

export async function compressImageFile(file: File, maxDimension = 1400, quality = 0.84): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Could not decode selected image file.'));
      img.src = dataUrl;
    };
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.readAsDataURL(file);
  });
}

export function exportProjectCsv(project: Project, items: PunchItem[]): void {
  const headers = [
    'Item Code',
    'Title',
    'Trade',
    'Subcontractor',
    'Location',
    'Status',
    'Priority',
    'Due Date',
    'Description',
    'Created At',
  ];

  const escapeCell = (val: string) => {
    const clean = (val || '').replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = items.map((item) => [
    escapeCell(item.code),
    escapeCell(item.title),
    escapeCell(item.trade),
    escapeCell(item.subcontractor),
    escapeCell(item.location),
    escapeCell(item.status),
    escapeCell(item.priority),
    escapeCell(item.dueDate),
    escapeCell(item.description),
    escapeCell(item.createdAt.slice(0, 10)),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${project.code.toLowerCase()}-punch-list.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
