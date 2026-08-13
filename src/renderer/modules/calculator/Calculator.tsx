import { useEffect, useMemo, useState } from "react";
import { computeCalculatorResult, type DiscountType } from "./calculatorMath";
import { loadStoreProfile } from "@/lib/storeProfile";
import { CurrencyInput } from "@/components/CurrencyInput";

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function Calculator(): JSX.Element {
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [discountType, setDiscountType] = useState<DiscountType>("amount");
  const [discountValue, setDiscountValue] = useState("0");
  const [taxPercent, setTaxPercent] = useState("0");
  const [installmentCount, setInstallmentCount] = useState("1");
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadStoreProfile().then((profile) => {
      if (!cancelled) setTaxPercent(String(profile.defaultTaxPercent));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const result = useMemo(() => {
    return computeCalculatorResult({
      purchasePrice,
      salePrice,
      discountType,
      discountValue: toNumber(discountValue),
      taxPercent: toNumber(taxPercent),
      installmentCount: toNumber(installmentCount)
    });
  }, [purchasePrice, salePrice, discountType, discountValue, taxPercent, installmentCount]);

  function handlePrint(): void {
    window.print();
  }

  return (
    <div>
      <div className="card no-print">
        <h3 style={{ marginTop: 0 }}>ماشین‌حساب حرفه‌ای فروش</h3>
        <div className="form-row">
          <div>
            <label htmlFor="calc-purchase">قیمت خرید</label>
            <CurrencyInput id="calc-purchase" value={purchasePrice} onChange={setPurchasePrice} />
          </div>
          <div>
            <label htmlFor="calc-sale">قیمت فروش</label>
            <CurrencyInput id="calc-sale" value={salePrice} onChange={setSalePrice} />
          </div>
          <div>
            <label htmlFor="calc-discount-type">نوع تخفیف</label>
            <select id="calc-discount-type" value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)}>
              <option value="amount">مبلغ ثابت (تومان)</option>
              <option value="percent">درصد</option>
            </select>
          </div>
          <div>
            <label htmlFor="calc-discount-value">مقدار تخفیف</label>
            {discountType === "amount" ? (
              <CurrencyInput id="calc-discount-value" value={toNumber(discountValue)} onChange={(v) => setDiscountValue(String(v))} />
            ) : (
              <input
                id="calc-discount-value"
                type="number"
                min={0}
                max={100}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            )}
          </div>
        </div>
        <div className="form-row">
          <div>
            <label htmlFor="calc-tax">مالیات (درصد)</label>
            <input id="calc-tax" type="number" min={0} value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} />
          </div>
          <div>
            <label htmlFor="calc-installments">تعداد اقساط</label>
            <input id="calc-installments" type="number" min={1} value={installmentCount} onChange={(e) => setInstallmentCount(e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="calc-note">توضیح روی رسید (اختیاری)</label>
            <input id="calc-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثلاً: مدل و رنگ دستگاه" />
          </div>
        </div>
      </div>

      <div className="card calculator-print-area" id="calc-print-area" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>نتیجهٔ محاسبه</h3>
        {note ? <p style={{ color: "var(--sv-text-400)" }}>{note}</p> : null}

        <table className="data-table">
          <tbody>
            <ResultRow label="سود ناخالص" value={`${result.grossProfit.toLocaleString("fa-IR")} تومان`} />
            <ResultRow label="درصد سود" value={`${result.profitPercent.toFixed(1)}٪`} />
            <ResultRow label="مبلغ تخفیف" value={`${result.discountAmount.toLocaleString("fa-IR")} تومان`} />
            <ResultRow label="قیمت پس از تخفیف" value={`${result.priceAfterDiscount.toLocaleString("fa-IR")} تومان`} />
            <ResultRow label="مبلغ مالیات" value={`${result.taxAmount.toLocaleString("fa-IR")} تومان`} />
            <ResultRow label="قیمت نهایی قابل پرداخت" value={`${result.finalPrice.toLocaleString("fa-IR")} تومان`} strong />
            <ResultRow
              label={`مبلغ هر قسط (${result.installments} قسط)`}
              value={`${Math.round(result.perInstallment).toLocaleString("fa-IR")} تومان`}
            />
          </tbody>
        </table>

        <button type="button" className="btn-primary no-print" style={{ marginTop: "var(--sv-space-4)" }} onClick={handlePrint}>
          چاپ نتیجه
        </button>
      </div>
    </div>
  );
}

function ResultRow({ label, value, strong }: { label: string; value: string; strong?: boolean }): JSX.Element {
  return (
    <tr>
      <td>{label}</td>
      <td style={strong ? { fontWeight: 700, color: "var(--sv-gold-300)" } : undefined}>{value}</td>
    </tr>
  );
}
