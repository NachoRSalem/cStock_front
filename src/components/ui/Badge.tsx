import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        draft: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
        pending: 'bg-orange-100 text-orange-700 border border-orange-200',
        approved: 'bg-blue-100 text-blue-700 border border-blue-200',
        received: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        cancelled: 'bg-red-100 text-red-700 border border-red-200',
        success: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        warning:  'bg-yellow-100 text-yellow-700 border border-yellow-200',
        info: 'bg-blue-100 text-blue-700 border border-blue-200',
        default: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={clsx(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full',
            variant === 'draft' && 'bg-neutral-500',
            variant === 'pending' && 'bg-orange-500',
            variant === 'approved' && 'bg-blue-500',
            variant === 'received' && 'bg-emerald-500',
            variant === 'cancelled' && 'bg-red-500',
            variant === 'success' && 'bg-emerald-500',
            variant === 'warning' && 'bg-yellow-500',
            variant === 'info' && 'bg-blue-500',
            variant === 'default' && 'bg-neutral-500'
          )}
        />
      )}
      {children}
    </span>
  );
}
