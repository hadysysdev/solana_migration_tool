import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  [
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
    'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-border bg-surface text-foreground',
          'hover:bg-surface-2',
        ],
        primary: [
          'border-primary-500/20 bg-primary-500/10 text-primary-400',
          'hover:bg-primary-500/20',
        ],
        secondary: [
          'border-secondary-500/20 bg-secondary-500/10 text-secondary-400',
          'hover:bg-secondary-500/20',
        ],
        success: [
          'border-success-500/20 bg-success-500/10 text-success-400',
          'hover:bg-success-500/20',
        ],
        warning: [
          'border-warning-500/20 bg-warning-500/10 text-warning-400',
          'hover:bg-warning-500/20',
        ],
        danger: [
          'border-danger-500/20 bg-danger-500/10 text-danger-400',
          'hover:bg-danger-500/20',
        ],
        outline: [
          'border-border text-foreground',
          'hover:bg-surface',
        ],
        ghost: [
          'border-transparent text-foreground-muted',
          'hover:bg-surface hover:text-foreground',
        ],
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        default: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

function Badge({ className, variant, size, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };