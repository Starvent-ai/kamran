interface SortableThProps {
  label: string;
  sortKeyName: string;
  activeKey: string;
  direction: "asc" | "desc";
  onSort: (key: string) => void;
}

/**
 * Deliberately typed with plain `string` keys instead of a generic
 * `keyof T` — keeps this component free of TS generic-JSX syntax
 * (`<SortableTh<Foo> ... />`), which some toolchains parse
 * inconsistently. Callers pass their row type's field names as
 * strings; useSortableRows does the actual keyed sorting.
 */
export function SortableTh({ label, sortKeyName, activeKey, direction, onSort }: SortableThProps): JSX.Element {
  const isActive = sortKeyName === activeKey;

  return (
    <th
      className="data-table__sortable-th"
      data-active={isActive}
      role="button"
      tabIndex={0}
      onClick={() => onSort(sortKeyName)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSort(sortKeyName);
        }
      }}
    >
      <span className="data-table__sortable-th-inner">
        <span>{label}</span>
        <span className="data-table__sort-icon" aria-hidden="true">
          {isActive ? (direction === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </span>
    </th>
  );
}
