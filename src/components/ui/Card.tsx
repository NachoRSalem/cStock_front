import { type HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'bg-white rounded-2xl border border-neutral-200 shadow-soft',
          hover && 'transition-shadow hover:shadow-soft-lg',
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={clsx('px-6 py-5 border-b border-neutral-100', className)}
      {...props}
    />
  );
});

CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={clsx('text-lg font-semibold text-neutral-900', className)}
      {...props}
    />
  );
});

CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={clsx('text-sm text-neutral-500 mt-1', className)}
      {...props}
    />
  );
});

CardDescription.displayName = 'CardDescription';

export const CardBody = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={clsx('px-6 py-5', className)}
      {...props}
    />
  );
});

CardBody.displayName = 'CardBody';

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={clsx('px-6 py-4 border-t border-neutral-100 bg-neutral-50/50', className)}
      {...props}
    />
  );
});

CardFooter.displayName = 'CardFooter';
