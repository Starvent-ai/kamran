import { useMemo, useState } from "react";
import { useInventory } from "@/modules/inventory/useInventory";
import { useCustomers } from "@/modules/customers/useCustomers";
import { useSales } from "@/modules/sales/useSales";
import { useRepairs } from "@/modules/repairs/useRepairs";
import { useSuppliers } from "@/modules/suppliers/useSuppliers";
import { useInstallments } from "@/modules/installments/useInstallments";
import { useCollateral } from "@/modules/collateral/useCollateral";
import { navigationActions } from "@/state/navigationStore";

interface SearchResult {
  id: string;
  group: string;
  title: string;
  subtitle: string;
  moduleId: string;
}

function matches(haystack: (string | number)[], needle: string): boolean {
  return haystack.some((field) => String(field).toLowerCase().includes(needle));
}

/**
 * One search box, all modules. Reads through the same hooks each module's
 * own screen uses (no separate index to keep in sync) — so results are
 * always as fresh as what's on screen, and adding a field to search later
 * is a one-line change here, not a new indexing pipeline.
 */
export function GlobalSearch(): JSX.Element {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const { items } = useInventory();
  const { customers } = useCustomers();
  const { sales } = useSales();
  const { tickets } = useRepairs();
  const { suppliers } = useSuppliers();
  const { contracts } = useInstallments();
  const { records: collateralRecords } = useCollateral();

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const out: SearchResult[] = [];

    for (const item of items) {
      if (matches([item.name, item.category, item.sku], q)) {
        out.push({
          id: item.id,
          group: "کالا",
          title: item.name,
          subtitle: `${item.category} — کد: ${item.sku}`,
          moduleId: "inventory"
        });
      }
    }

    for (const customer of customers) {
      if (matches([customer.fullName, customer.phone], q)) {
        out.push({
          id: customer.id,
          group: "مشتری",
          title: customer.fullName,
          subtitle: customer.phone || "—",
          moduleId: "customers"
        });
      }
    }

    for (const sale of sales) {
      if (matches([sale.itemName, sale.id], q)) {
        out.push({
          id: sale.id,
          group: "فاکتور",
          title: sale.itemName,
          subtitle: `${sale.quantity} عدد — ${sale.total.toLocaleString("fa-IR")} تومان`,
          moduleId: "sales"
        });
      }
    }

    for (const ticket of tickets) {
      if (matches([ticket.deviceModel, ticket.imei, ticket.serialNumber, ticket.customerName], q)) {
        out.push({
          id: ticket.id,
          group: "تعمیرات",
          title: ticket.deviceModel,
          subtitle: `${ticket.status} — ${ticket.customerName || "بدون نام"}`,
          moduleId: "repairs"
        });
      }
    }

    for (const supplier of suppliers) {
      if (matches([supplier.name, supplier.phone], q)) {
        out.push({
          id: supplier.id,
          group: "تأمین‌کننده",
          title: supplier.name,
          subtitle: supplier.phone || "—",
          moduleId: "suppliers"
        });
      }
    }

    for (const contract of contracts) {
      if (matches([contract.customerName, contract.itemDescription], q)) {
        out.push({
          id: contract.id,
          group: "قسط",
          title: contract.customerName,
          subtitle: `${contract.itemDescription} — ${contract.status}`,
          moduleId: "installments"
        });
      }
    }

    for (const record of collateralRecords) {
      if (matches([record.relatedTo, record.description, record.guarantorName], q)) {
        out.push({
          id: record.id,
          group: "ضمانت",
          title: record.description,
          subtitle: `${record.type} — ${record.relatedTo || "بدون ارجاع"}`,
          moduleId: "collateral"
        });
      }
    }

    return out.slice(0, 20);
  }, [query, items, customers, sales, tickets, suppliers, contracts, collateralRecords]);

  function goToResult(result: SearchResult): void {
    navigationActions.goTo(result.moduleId);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="global-search">
      <input
        type="text"
        className="global-search__input"
        placeholder="جستجوی کالا، مشتری، فاکتور، تعمیرات، تأمین‌کننده..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      />

      {open && query.trim().length >= 2 ? (
        <div className="global-search__results">
          {results.length === 0 ? (
            <div className="global-search__empty">نتیجه‌ای یافت نشد</div>
          ) : (
            results.map((result) => (
              <button
                type="button"
                key={`${result.moduleId}-${result.id}`}
                className="global-search__result"
                onMouseDown={() => goToResult(result)}
              >
                <span className="global-search__result-group">{result.group}</span>
                <span className="global-search__result-title">{result.title}</span>
                <span className="global-search__result-subtitle">{result.subtitle}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
