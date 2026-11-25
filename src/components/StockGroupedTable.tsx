import { Fragment, useState } from "react";
import clsx from "clsx";
import { Calendar, ChevronDown, ChevronRight, Refrigerator, Snowflake, Thermometer } from "lucide-react";

import type { Stock } from "../api/stock";
import { etiquetaUnidad } from "../utils/units";
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui";

// ─── helpers ──────────────────────────────────────────────────────────────────

function tipoIcon(tipo: string) {
  switch (tipo) {
    case "heladera": return <Refrigerator className="h-4 w-4" />;
    case "freezer":  return <Snowflake className="h-4 w-4" />;
    default:         return <Thermometer className="h-4 w-4" />;
  }
}

function tipoBadgeVariant(tipo: string): "default" | "draft" | "pending" | "approved" {
  if (tipo === "heladera") return "pending";
  if (tipo === "freezer") return "draft";
  return "approved";
}

function stockColor(cantidad: number) {
  if (cantidad <= 0) return "text-red-600";
  if (cantidad < 10) return "text-orange-500";
  if (cantidad < 20) return "text-yellow-600";
  return "text-emerald-600";
}

function vencimientoEstado(dias: number | null) {
  if (dias === null) return null;
  if (dias <= 0) return "vencido";
  if (dias <= 7) return "critico";
  if (dias <= 30) return "proximo";
  return "vigente";
}

function vencimientoBadgeVariant(estado: string | null): "default" | "draft" | "pending" | "approved" | "danger" {
  if (estado === "vencido") return "danger";
  if (estado === "critico") return "draft";
  if (estado === "proximo") return "pending";
  return "approved";
}

function vencimientoTexto(dias: number | null, fechaVencimiento: string | null) {
  if (dias === null || !fechaVencimiento) return null;
  if (dias <= 0) {
    const vencido = Math.abs(dias);
    return `⚠️ Vencido hace ${vencido} día${vencido !== 1 ? "s" : ""}`;
  }
  if (dias <= 7) return `⏰ Vence en ${dias} día${dias !== 1 ? "s" : ""}`;
  if (dias <= 30) return `⏳ ${dias} días`;
  const fecha = new Date(fechaVencimiento);
  return `✓ ${fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
}

/** Evita ruido de coma flotante al sumar cantidades con 3 decimales. */
export function fmtCantidad(n: number): string {
  return String(Number(n.toFixed(3)));
}

function fmtFecha(iso: string, conHora = true) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(conHora ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function VencimientoBadge({ item }: { item: Stock }) {
  if (!item.fecha_vencimiento || item.dias_para_vencer === null) {
    return <span className="text-xs text-neutral-400">—</span>;
  }
  const estado = vencimientoEstado(item.dias_para_vencer);
  return (
    <Badge
      variant={vencimientoBadgeVariant(estado)}
      className={clsx("text-xs", estado === "vencido" && "bg-red-100 text-red-800 border-red-300")}
    >
      {vencimientoTexto(item.dias_para_vencer, item.fecha_vencimiento)}
    </Badge>
  );
}

// ─── agrupación ───────────────────────────────────────────────────────────────

export type GrupoStock = {
  producto: number;
  nombre: string;
  tipoConservacion: string;
  unidad: string;
  total: number;
  lotes: Stock[];
};

/**
 * Une en un solo grupo todos los registros (lotes / compras) de un mismo producto.
 * Los lotes quedan ordenados por vencimiento (FIFO): primero los que vencen antes.
 */
export function agruparPorProducto(rows: Stock[]): GrupoStock[] {
  const mapa = new Map<number, GrupoStock>();
  for (const r of rows) {
    const g = mapa.get(r.producto);
    if (g) {
      g.total += r.cantidad;
      g.lotes.push(r);
    } else {
      mapa.set(r.producto, {
        producto: r.producto,
        nombre: r.producto_nombre,
        tipoConservacion: r.producto_tipo_conservacion,
        unidad: etiquetaUnidad(r.producto_unidad_medida),
        total: r.cantidad,
        lotes: [r],
      });
    }
  }
  const diasOrden = (s: Stock) => s.dias_para_vencer ?? Number.MAX_SAFE_INTEGER;
  return [...mapa.values()]
    .map((g) => ({ ...g, lotes: [...g.lotes].sort((a, b) => diasOrden(a) - diasOrden(b) || a.id - b.id) }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

// ─── tabla ────────────────────────────────────────────────────────────────────

function GrupoRow({ grupo, mostrarSubUbicacion }: { grupo: GrupoStock; mostrarSubUbicacion: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const desplegable = grupo.lotes.length > 1 || grupo.lotes.some((l) => !!l.lote);
  const proximoAVencer = grupo.lotes.find((l) => l.dias_para_vencer !== null) ?? null;
  const ultimaAct = grupo.lotes.reduce(
    (max, l) => (l.ultima_actualizacion > max ? l.ultima_actualizacion : max),
    grupo.lotes[0].ultima_actualizacion
  );
  const columnas = mostrarSubUbicacion ? 6 : 5;

  return (
    <Fragment>
      <TableRow
        className={clsx(desplegable && "cursor-pointer hover:bg-neutral-50")}
        onClick={() => desplegable && setAbierto((p) => !p)}
      >
        <TableCell>
          <div className="flex items-center gap-2">
            {desplegable ? (
              <span className="text-neutral-400">
                {abierto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </span>
            ) : (
              <span className="w-4" />
            )}
            <div>
              <span className="font-medium text-neutral-900">{grupo.nombre}</span>
              {grupo.lotes.length > 1 && (
                <div className="text-xs text-neutral-500 mt-0.5">{grupo.lotes.length} lotes</div>
              )}
            </div>
          </div>
        </TableCell>
        {mostrarSubUbicacion && (
          <TableCell className="text-sm text-neutral-500">
            {[...new Set(grupo.lotes.map((l) => l.sub_ubicacion_nombre))].join(", ")}
          </TableCell>
        )}
        <TableCell className="text-center">
          <Badge variant={tipoBadgeVariant(grupo.tipoConservacion)}>
            <span className="flex items-center gap-1">
              {tipoIcon(grupo.tipoConservacion)}
              {grupo.tipoConservacion.charAt(0).toUpperCase() + grupo.tipoConservacion.slice(1)}
            </span>
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <span className={clsx("font-bold text-lg", stockColor(grupo.total))}>{fmtCantidad(grupo.total)}</span>
          <span className="ml-1 text-xs text-neutral-500">{grupo.unidad}</span>
        </TableCell>
        <TableCell>{proximoAVencer ? <VencimientoBadge item={proximoAVencer} /> : <span className="text-xs text-neutral-400">—</span>}</TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Calendar className="h-3 w-3" />
            {fmtFecha(ultimaAct)}
          </div>
        </TableCell>
      </TableRow>

      {abierto && (
        <TableRow>
          <td colSpan={columnas} className="bg-neutral-50 p-0">
            <div className="px-3 py-3 sm:px-8">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="text-neutral-500 text-xs uppercase">
                    <th className="text-left pb-1 font-medium">Lote</th>
                    {mostrarSubUbicacion && <th className="text-left pb-1 font-medium">Sub-ubicación</th>}
                    <th className="text-left pb-1 font-medium">Ingreso</th>
                    <th className="text-right pb-1 font-medium">Cantidad</th>
                    <th className="text-left pb-1 pl-4 font-medium">Vencimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {grupo.lotes.map((l) => (
                    <tr key={l.id}>
                      <td className="py-1.5 pr-2 font-mono text-xs text-neutral-600 whitespace-nowrap">{l.lote ?? "Sin lote"}</td>
                      {mostrarSubUbicacion && <td className="py-1.5 text-neutral-600">{l.sub_ubicacion_nombre}</td>}
                      <td className="py-1.5 text-neutral-600">{l.fecha_ingreso ? fmtFecha(l.fecha_ingreso, false) : "—"}</td>
                      <td className={clsx("py-1.5 text-right font-semibold", stockColor(l.cantidad))}>
                        {fmtCantidad(l.cantidad)} <span className="text-xs font-normal text-neutral-500">{grupo.unidad}</span>
                      </td>
                      <td className="py-1.5 pl-4"><VencimientoBadge item={l} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </TableRow>
      )}
    </Fragment>
  );
}

/** Una fila por producto con el stock total; el desglose por lote se despliega al hacer clic. */
export function StockGroupedTable({ rows, mostrarSubUbicacion = false }: { rows: Stock[]; mostrarSubUbicacion?: boolean }) {
  const grupos = agruparPorProducto(rows);
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            {mostrarSubUbicacion && <TableHead>Sub-ubicación</TableHead>}
            <TableHead className="text-center">Tipo</TableHead>
            <TableHead className="text-right">Stock total</TableHead>
            <TableHead>Próx. vencimiento</TableHead>
            <TableHead>Última act.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grupos.map((g) => (
            <GrupoRow key={g.producto} grupo={g} mostrarSubUbicacion={mostrarSubUbicacion} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
