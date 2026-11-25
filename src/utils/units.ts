export type UnidadMedida = "kg" | "g" | "l" | "ml" | "unidad";

export const UNIDADES: { value: UnidadMedida; label: string }[] = [
  { value: "kg", label: "kg (kilogramos)" },
  { value: "g", label: "g (gramos)" },
  { value: "l", label: "l (litros)" },
  { value: "ml", label: "ml (mililitros)" },
  { value: "unidad", label: "unidad" },
];

const INFO: Record<UnidadMedida, { magnitud: "masa" | "volumen" | "conteo"; factor: number }> = {
  kg: { magnitud: "masa", factor: 1000 },
  g: { magnitud: "masa", factor: 1 },
  l: { magnitud: "volumen", factor: 1000 },
  ml: { magnitud: "volumen", factor: 1 },
  unidad: { magnitud: "conteo", factor: 1 },
};

/** Unidades de la lista cerrada. Productos cargados antes pueden tener otras (pack, caja...). */
export function esUnidadConocida(u: string | null | undefined): u is UnidadMedida {
  return !!u && u in INFO;
}

export function sonCompatibles(a: string, b: string): boolean {
  return esUnidadConocida(a) && esUnidadConocida(b) && INFO[a].magnitud === INFO[b].magnitud;
}

/**
 * Vista previa del precio por unidad principal (el servidor vuelve a calcularlo al guardar).
 * Devuelve null si faltan datos o las unidades no son comparables.
 */
export function precioNormalizado(
  precioEnvase: number,
  cantidadEnvase: number,
  unidadEnvase: string,
  unidadPrincipal: string
): number | null {
  if (!Number.isFinite(precioEnvase) || !Number.isFinite(cantidadEnvase)) return null;
  if (precioEnvase < 0 || cantidadEnvase <= 0) return null;
  if (!esUnidadConocida(unidadEnvase) || !esUnidadConocida(unidadPrincipal)) return null;
  if (!sonCompatibles(unidadEnvase, unidadPrincipal)) return null;
  const cantidadEnPrincipal = (cantidadEnvase * INFO[unidadEnvase].factor) / INFO[unidadPrincipal].factor;
  return Math.round((precioEnvase / cantidadEnPrincipal) * 100) / 100;
}

export function formatoPrecio(valor: number): string {
  return `$${valor.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Texto de la unidad para mostrar junto al producto: "kg", "unidad"... */
export function etiquetaUnidad(unidad: string | null | undefined): string {
  return unidad || "unidad";
}
