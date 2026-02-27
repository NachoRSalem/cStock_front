import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import clsx from 'clsx';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const alertStyles = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-900',
    icon: <Info className="h-5 w-5 text-blue-500" />,
  },
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-900',
    icon: <XCircle className="h-5 w-5 text-red-500" />,
  },
};

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const styles = alertStyles[variant];

  return (
    <div
      className={clsx(
        'flex gap-3 p-4 rounded-xl border',
        styles.container,
        className
      )}
    >
      <div className="flex-shrink-0">{styles.icon}</div>
      <div className="flex-1">
        {title && <p className="font-semibold text-sm mb-1">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
