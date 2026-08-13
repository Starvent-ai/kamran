import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

/**
 * Generic client-side sort for a table's row array. Kept as one shared
 * hook instead of duplicating sort logic per module — Inventory, Sales,
 * and Customers all use it the same way: pick a column, click its header,
 * it sorts; click again, it flips direction.
 *
 * Column keys are passed/stored as plain strings (matching SortableTh,
 * which is intentionally non-generic — see that file for why). Rows are
 * cast to a string-indexable shape only at the point of comparison, so
 * this works for any row interface without requiring it to declare an
 * index signature.
 */
export function useSortableRows<T>(rows: T[], defaultKey: Extract<keyof T, string>, defaultDirection: SortDirection = "asc") {
  const [sortKey, setSortKey] = useState<string>(defaultKey);
  const [direction, setDirection] = useState<SortDirection>(defaultDirection);

  function toggleSort(key: string): void {
    if (key === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("asc");
    }
  }

  const sorted = useMemo(() => {
    const copy = rows.slice();
    copy.sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortKey];
      const bValue = (b as Record<string, unknown>)[sortKey];
      let comparison = 0;

      if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue ?? "").localeCompare(String(bValue ?? ""), "fa");
      }

      return direction === "asc" ? comparison : -comparison;
    });
    return copy;
  }, [rows, sortKey, direction]);

  return { sorted, sortKey, direction, toggleSort };
}
