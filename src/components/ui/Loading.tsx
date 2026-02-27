import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={clsx('animate-spin text-primary-500', sizeClasses[size])} />
      {text && <p className="text-sm text-neutral-500">{text}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" text="Cargando..." />
    </div>
  );
}

export function TableLoader({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-12">
        <LoadingSpinner text="Cargando datos..." />
      </td>
    </tr>
  );
}
