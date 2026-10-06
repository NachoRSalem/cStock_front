/**
 * Utilidades de formateo estandarizado de números, moneda e entradas de texto numérico.
 */

/**
 * Formatea un monto numérico a moneda en pesos argentinos (ej. $ 1.000,00)
 */
export function formatCurrency(value: number | string | null | undefined, includeDecimals = true): string {
  if (value === null || value === undefined || value === "") return "$ 0,00";
  const num = typeof value === "number" ? value : parseFloat(value);
  if (isNaN(num)) return "$ 0,00";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(num);
}

/**
 * Formatea un número genérico con formato regional es-AR (ej. 1.250,50)
 */
export function formatNumber(value: number | string | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || value === "") return "0";
  const num = typeof value === "number" ? value : parseFloat(value);
  if (isNaN(num)) return "0";

  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Sanitiza la entrada de texto numérico en los inputs para evitar que se antecedan ceros
 * no deseados (ej. convierte "010" en "10", manteniendo "0", "0.5" o "").
 */
export function sanitizeNumberInput(val: string): string {
  if (!val) return "";
  
  // Si empieza con ceros seguidos de dígitos (no un punto decimal), remueve los ceros a la izquierda.
  // Ej: "010" -> "10", "00" -> "0", "05.2" -> "5.2", "0.5" -> "0.5"
  let sanitized = val.replace(/^0+(?=\d)/, "");
  return sanitized;
}
