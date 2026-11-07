"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";

type Row = {
  key: string;
  title: string;
  price: string;
  compareAt: string;
  cost: string;
  sku: string;
  inventory: string;
};

export type VariantFormValue = {
  title: string;
  price: number;
  compareAtPrice?: number | null;
  cost?: number | null;
  sku?: string | null;
  inventoryQty: number;
};

function makeKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emptyRow(index: number): Row {
  return {
    key: makeKey(),
    title: index === 0 ? "Default Title" : `Variant ${index + 1}`,
    price: "",
    compareAt: "",
    cost: "",
    sku: "",
    inventory: "0"
  };
}

export function VariantsEditor({ initial }: { initial?: VariantFormValue[] }) {
  const [rows, setRows] = useState<Row[]>(() => {
    if (!initial || initial.length === 0) return [emptyRow(0)];
    return initial.map((variant) => ({
      key: makeKey(),
      title: variant.title,
      price: (variant.price / 100).toFixed(2),
      compareAt: variant.compareAtPrice ? (variant.compareAtPrice / 100).toFixed(2) : "",
      cost: variant.cost ? (variant.cost / 100).toFixed(2) : "",
      sku: variant.sku ?? "",
      inventory: String(variant.inventoryQty)
    }));
  });

  const payload = useMemo(
    () =>
      JSON.stringify(
        rows.map((row) => ({
          title: row.title,
          price: row.price,
          compareAt: row.compareAt,
          cost: row.cost,
          sku: row.sku,
          inventory: row.inventory
        }))
      ),
    [rows]
  );

  const update = (key: string, patch: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  return (
    <div>
      <input type="hidden" name="variants" value={payload} />
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={row.key} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Variant {index + 1}
              </span>
              <button
                type="button"
                className="rounded p-1 text-slate-400 hover:bg-white hover:text-red-600 disabled:opacity-30"
                disabled={rows.length === 1}
                onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
                title="Remove variant"
              >
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
              <div className="lg:col-span-2">
                <label className="label">Title</label>
                <input
                  className="input"
                  value={row.title}
                  onChange={(event) => update(row.key, { title: event.target.value })}
                  placeholder="S / M / L"
                />
              </div>
              <div>
                <label className="label">Price *</label>
                <input
                  className="input"
                  value={row.price}
                  onChange={(event) => update(row.key, { price: event.target.value })}
                  inputMode="decimal"
                  placeholder="28.00"
                  required={index === 0}
                />
              </div>
              <div>
                <label className="label">Compare at</label>
                <input
                  className="input"
                  value={row.compareAt}
                  onChange={(event) => update(row.key, { compareAt: event.target.value })}
                  inputMode="decimal"
                  placeholder="34.00"
                />
              </div>
              <div>
                <label className="label">Cost</label>
                <input
                  className="input"
                  value={row.cost}
                  onChange={(event) => update(row.key, { cost: event.target.value })}
                  inputMode="decimal"
                  placeholder="9.00"
                />
              </div>
              <div>
                <label className="label">SKU</label>
                <input
                  className="input"
                  value={row.sku}
                  onChange={(event) => update(row.key, { sku: event.target.value })}
                  placeholder="SKU-001"
                />
              </div>
              <div>
                <label className="label">Stock</label>
                <input
                  className="input"
                  value={row.inventory}
                  onChange={(event) => update(row.key, { inventory: event.target.value })}
                  inputMode="numeric"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-outline btn-sm mt-3"
        onClick={() => setRows((current) => [...current, emptyRow(current.length)])}
      >
        <Icon name="plus" className="h-3.5 w-3.5" />
        Add variant
      </button>
      <p className="hint">
        Each variant becomes its own SKU with independent pricing and inventory. Values are shown
        in the store currency.
      </p>
    </div>
  );
}
