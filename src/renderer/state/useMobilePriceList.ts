import { useEffect, useState } from "react";
import type { MobilePriceListResult } from "@shared/types";

const EMPTY: MobilePriceListResult = { items: [], updatedAt: null, error: null };

/** Live-subscribes to the mobile/tablet reference-site price list (see modules/settings/MobilePriceSource.tsx for how it's configured). */
export function useMobilePriceList(): MobilePriceListResult {
  const [list, setList] = useState<MobilePriceListResult>(EMPTY);

  useEffect(() => {
    if (!window.starvent?.mobilePrices) return;
    let cancelled = false;

    window.starvent.mobilePrices.getList().then((result) => {
      if (!cancelled) setList(result);
    });

    const unsubscribe = window.starvent.mobilePrices.onUpdated((result) => {
      if (!cancelled) setList(result);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return list;
}
