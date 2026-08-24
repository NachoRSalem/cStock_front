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
  categoria?: number;
  categoriaName?: string;  // filtra por nombre de categoría en el cliente
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
  categoria,
  categoriaName,
  className,
  allowClear = true,
}: ProductAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Producto[]>([]);
  const [display, setDisplay] = useState("");

  // Ref del wrapper completo (input + dropdown)
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Serializado ANTES de los useEffect que lo usan como dep.
  // Cada render crea un nuevo [] por defecto (nueva referencia),
  // lo que haría que el useEffect de búsqueda se ejecute en loop.
  // Un string primitivo es estable entre renders si el contenido no cambia.
  const excludeIdsKey = excludeIds.join(",");

  useEffect(() => {
    setDisplay(selectedName ?? "");
  }, [selectedName, value]);

  // Cerrar solo cuando el clic ocurre FUERA del wrapper completo.
  // Esto permite scrollear el dropdown sin que se cierre.
  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  // Buscar productos con debounce al abrir o cambiar el query
  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await listProductos({
          search: query || undefined,
          limit: 20,
          es_fabricable: onlyFabricable,
          categoria: categoria,
        });

        let filtered = data.filter((p) => {
          if (value && p.id === value) return true;
          return !excludeIds.includes(p.id);
        });
        // Filtro cliente por nombre de categoría (sin necesidad de conocer el ID)
        if (categoriaName) {
          filtered = filtered.filter(
            (p) => p.categoria_nombre.toLowerCase() === categoriaName.toLowerCase()
          );
        }

        setOptions(filtered);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [open, query, excludeIdsKey, value, onlyFabricable, categoria, categoriaName]);

  const hasResults = useMemo(() => options.length > 0, [options]);

  return (
    <div ref={wrapperRef} className={`relative ${className ?? ""}`}>
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
