/**
 * Format a date string for display
 * @param dateString ISO date string or null
 * @returns Formatted date (e.g., "Jan 15, 2025") or null
 */
export function formatDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

/**
 * Calculate date range for join date filter options
 * @param filterValue Filter option value (e.g., 'last_30_days')
 * @returns Object with joinDateFrom and joinDateTo ISO date strings, or empty object
 */
export function getJoinDateRange(filterValue: string): { joinDateFrom?: string; joinDateTo?: string } {
  if (!filterValue) return {};

  const today = new Date();
  const toDate = today.toISOString().split('T')[0]; // YYYY-MM-DD

  switch (filterValue) {
    case 'last_30_days': {
      const from = new Date(today);
      from.setDate(from.getDate() - 30);
      return { joinDateFrom: from.toISOString().split('T')[0], joinDateTo: toDate };
    }
    case 'last_90_days': {
      const from = new Date(today);
      from.setDate(from.getDate() - 90);
      return { joinDateFrom: from.toISOString().split('T')[0], joinDateTo: toDate };
    }
    case 'this_year': {
      const from = new Date(today.getFullYear(), 0, 1); // Jan 1 of current year
      return { joinDateFrom: from.toISOString().split('T')[0], joinDateTo: toDate };
    }
    case 'last_year': {
      const lastYear = today.getFullYear() - 1;
      const from = new Date(lastYear, 0, 1); // Jan 1 of last year
      const to = new Date(lastYear, 11, 31); // Dec 31 of last year
      return { joinDateFrom: from.toISOString().split('T')[0], joinDateTo: to.toISOString().split('T')[0] };
    }
    default:
      return {};
  }
}
