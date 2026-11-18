import { PunchPriority, PunchStatus } from '../types/punch';

export function getStatusLabel(status: PunchStatus): string {
  switch (status) {
    case PunchStatus.Open:
      return 'Open';
    case PunchStatus.InReview:
      return 'In Review';
    case PunchStatus.Resolved:
      return 'Resolved';
  }
}

export function getStatusTextClass(status: PunchStatus): string {
  switch (status) {
    case PunchStatus.Open:
      return 'text-red-700';
    case PunchStatus.InReview:
      return 'text-amber-700';
    case PunchStatus.Resolved:
      return 'text-emerald-700';
  }
}

export function getPriorityLabel(priority: PunchPriority): string {
  switch (priority) {
    case PunchPriority.Critical:
      return 'Critical';
    case PunchPriority.Standard:
      return 'Standard';
    case PunchPriority.Cosmetic:
      return 'Cosmetic';
  }
}

export function getPriorityTextClass(priority: PunchPriority): string {
  switch (priority) {
    case PunchPriority.Critical:
      return 'text-red-700 font-semibold';
    case PunchPriority.Standard:
      return 'text-slate-700 font-medium';
    case PunchPriority.Cosmetic:
      return 'text-slate-500 font-normal';
  }
}

export function formatShortDate(dateString: string): string {
  if (!dateString) return 'No date';
  const parsed = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatTimestamp(isoString: string): string {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return isoString;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isOverdue(dueDate: string, status: PunchStatus): boolean {
  if (status === PunchStatus.Resolved || !dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  return !Number.isNaN(due.getTime()) && due.getTime() < today.getTime();
}

export function generateNextPunchCode(existingCodes: string[]): string {
  let maxNum = 0;
  for (const code of existingCodes) {
    const match = code.match(/PL-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  const next = maxNum + 1;
  return `PL-${String(next).padStart(3, '0')}`;
}
