import { type HTMLAttributes, forwardRef, useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';

/**
 * Copia el texto de cada encabezado como `data-label` en las celdas de su columna.
 * En pantallas chicas (ver `.table-stack` en app.css) cada fila se muestra como una tarjeta
 * y ese label indica a qué columna corresponde cada valor.
 */
function labelCells(table: HTMLTableElement) {
  const heads = Array.from(table.querySelectorAll(':scope > thead > tr > th')).map((th) => th.textContent?.trim() ?? '');
  table.querySelectorAll(':scope > tbody > tr').forEach((tr) => {
    let col = 0;
    Array.from(tr.children).forEach((cell) => {
      if (!(cell instanceof HTMLTableCellElement) || cell.tagName !== 'TD') return;
      // La primera columna hace de título de la tarjeta; las filas con colSpan (detalle, vacío) no se etiquetan.
      // La columna de acciones no lleva etiqueta: sus botones usan todo el ancho de la tarjeta.
      const label = heads[col];
      if (cell.colSpan === 1 && col > 0 && label && !/^acciones?$/i.test(label) && cell.dataset.label !== label) {
        cell.dataset.label = label;
      }
      col += cell.colSpan || 1;
    });
  });
}

export const Table = forwardRef<
  HTMLTableElement,
  HTMLAttributes<HTMLTableElement> & { stack?: boolean }
>(({ className, stack = true, ...props }, ref) => {
  const innerRef = useRef<HTMLTableElement | null>(null);

  const setRefs = useCallback(
    (node: HTMLTableElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref]
  );

  useEffect(() => {
    const table = innerRef.current;
    if (!stack || !table) return;
    labelCells(table);
    // Las filas pueden aparecer sin que Table se vuelva a renderizar (por ejemplo al expandir una fila).
    const observer = new MutationObserver(() => labelCells(table));
    observer.observe(table, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [stack]);

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-neutral-200 shadow-soft custom-scrollbar">
      <table
        ref={setRefs}
        className={clsx('w-full border-collapse', stack && 'table-stack', className)}
        {...props}
      />
    </div>
  );
});

Table.displayName = 'Table';

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  return (
    <thead
      ref={ref}
      className={clsx('bg-neutral-50 border-b border-neutral-200', className)}
      {...props}
    />
  );
});

TableHeader.displayName = 'TableHeader';

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  return (
    <tbody
      ref={ref}
      className={clsx('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  );
});

TableBody.displayName = 'TableBody';

export const TableRow = forwardRef<
  HTMLTableRowElement,
  HTMLAttributes<HTMLTableRowElement> & { hover?: boolean }
>(({ className, hover = true, ...props }, ref) => {
  return (
    <tr
      ref={ref}
      className={clsx(
        'border-b border-neutral-100 transition-colors',
        hover && 'hover:bg-neutral-50/50',
        className
      )}
      {...props}
    />
  );
});

TableRow.displayName = 'TableRow';

export const TableHead = forwardRef<
  HTMLTableCellElement,
  HTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  return (
    <th
      ref={ref}
      className={clsx(
        'px-4 py-3.5 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider',
        className
      )}
      {...props}
    />
  );
});

TableHead.displayName = 'TableHead';

export const TableCell = forwardRef<
  HTMLTableCellElement,
  HTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  return (
    <td
      ref={ref}
      className={clsx('px-4 py-4 text-sm text-neutral-900', className)}
      {...props}
    />
  );
});

TableCell.displayName = 'TableCell';

export function TableEmpty({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="text-neutral-400 text-sm">{children}</div>
        </div>
      </td>
    </tr>
  );
}
