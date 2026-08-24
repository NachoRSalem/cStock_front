import { type ReactNode } from 'react';
import clsx from 'clsx';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div
      className={clsx(
        'animate-fade-in',
        className
      )}
    >
      {children}
    </div>
  );
}