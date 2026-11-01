// The problems inside a merged ticket: the causes from causes.ts, plus the reports the desk itself
// read as a one-day move (desk-notes.json). Those move by one day; a month/day fix won't reach them.
// Like CauseTable, they stay counted where the desk files them; `shift` lists them again on their own.
import { groupByCause, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'shift' | 'unplaced';

export type ProblemGroup = { problem: Problem; reports: Report[]; tenants: number; firstSeen: string; lastSeen: string };

export function groupByProblem(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const shift = merged.filter((r) => oneDayMove.includes(r.id));
  const groups = groupByCause(merged, tenantOf).map((g) => ({ problem: g.cause as Problem, reports: g.reports }));
  if (shift.length) groups.push({ problem: 'shift', reports: shift });
  return groups
    .map((g) => {
      const days = g.reports.map((r) => r.receivedAt.slice(0, 10)).sort();
      return { ...g, tenants: new Set(g.reports.map((r) => r.tenant)).size, firstSeen: days[0], lastSeen: days[days.length - 1] };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}
