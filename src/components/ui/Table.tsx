import { type HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

export const Table = forwardRef<
  HTMLTableElement,
  HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-neutral-200 shadow-soft custom-scrollbar">
      <table
        ref={ref}
        className={clsx('w-full border-collapse', className)}
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
