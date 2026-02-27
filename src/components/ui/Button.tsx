import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-sm hover:shadow-md',
        secondary:
          'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-300 focus:ring-primary-500 shadow-sm hover:shadow',
        outline:
          'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-300 focus:ring-primary-500 shadow-sm hover:shadow',
        danger:
          'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-sm hover:shadow-md',
        success:
          'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500 shadow-sm hover:shadow-md',
        ghost:
          'hover:bg-neutral-100 text-neutral-700 focus:ring-primary-500',
        link:
          'text-primary-500 hover:text-primary-600 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'text-sm px-3 py-1.5 h-8',
        md: 'text-sm px-4 py-2 h-10',
        lg: 'text-base px-6 py-3 h-12',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
