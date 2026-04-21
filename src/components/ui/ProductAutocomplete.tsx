import { useEffect, useMemo, useRef, useState } from "react";

import { listProductos, type Producto } from "../../api/products";
import { X } from "lucide-react";

type ProductAutocompleteProps = {
  value: number | null;
  onSelect: (product: Producto | null) => void;
  selectedName?: string;
  placeholder?: string;
  disabled?: boolean;
  excludeIds?: number[];
  onlyFabricable?: boolean;
  className?: string;
  allowClear?: boolean;
};

export function ProductAutocomplete({
  value,
  onSelect,
  selectedName,
  placeholder = "Buscar producto...",
  disabled,
  excludeIds = [],
  onlyFabricable,
  className,
  allowClear = true,
}: ProductAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Producto[]>([]);
  const [display, setDisplay] = useState("");

  const blurTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplay(selectedName ?? "");
  }, [selectedName, value]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await listProductos({
          search: query || undefined,
          limit: 20,
          es_fabricable: onlyFabricable,
        });

        const filtered = data.filter((p) => {
          if (value && p.id === value) return true;
          return !excludeIds.includes(p.id);
        });

        setOptions(filtered);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [open, query, excludeIds, value, onlyFabricable]);

  const hasResults = useMemo(() => options.length > 0, [options]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <input
          value={open ? query : display}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onBlur={() => {
            blurTimerRef.current = window.setTimeout(() => setOpen(false), 120);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent border-neutral-300 hover:border-neutral-400"
        />
        {allowClear && value && !disabled && (
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setDisplay("");
              setQuery("");
              setOpen(false);
            }}
            className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100"
            aria-label="Limpiar selección"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-neutral-200 bg-white shadow-lg max-h-64 overflow-auto">
          {loading && <div className="px-3 py-2 text-sm text-neutral-500">Buscando...</div>}

          {!loading && !hasResults && (
            <div className="px-3 py-2 text-sm text-neutral-500">Sin coincidencias</div>
          )}

          {!loading && hasResults &&
            options.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={() => {
                  if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current);
                }}
                onClick={() => {
                  onSelect(p);
                  setDisplay(p.nombre);
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-primary-50 border-b border-neutral-100 last:border-b-0"
              >
                <div className="font-medium text-neutral-900">{p.nombre}</div>
                <div className="text-xs text-neutral-500">
                  {p.categoria_nombre}
                  {p.sku ? ` • SKU: ${p.sku}` : ""}
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
