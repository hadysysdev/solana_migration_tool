import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium',
    'ring-offset-background transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'relative overflow-hidden',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-primary-500 text-primary-foreground',
          'hover:bg-primary-600 active:bg-primary-700',
          'shadow-lg hover:shadow-xl',
          'before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary-400 before:to-primary-600 before:opacity-0 before:transition-opacity before:duration-300',
          'hover:before:opacity-20',
        ],
        destructive: [
          'bg-danger-500 text-white',
          'hover:bg-danger-600 active:bg-danger-700',
          'shadow-lg hover:shadow-xl',
        ],
        outline: [
          'border border-border bg-transparent text-foreground',
          'hover:bg-surface hover:text-foreground',
          'shadow-sm hover:shadow-md',
        ],
        secondary: [
          'bg-secondary-500 text-secondary-foreground',
          'hover:bg-secondary-600 active:bg-secondary-700',
          'shadow-lg hover:shadow-xl',
        ],
        ghost: [
          'text-foreground hover:bg-surface hover:text-foreground',
          'transition-all duration-200',
        ],
        link: [
          'text-primary-400 underline-offset-4',
          'hover:underline hover:text-primary-300',
          'transition-colors duration-200',
        ],
        gradient: [
          'bg-gradient-to-r from-primary-500 to-secondary-500 text-white',
          'hover:from-primary-400 hover:to-secondary-400',
          'shadow-lg hover:shadow-xl',
          'relative overflow-hidden',
          'before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:to-white/5 before:opacity-0 before:transition-opacity before:duration-300',
          'hover:before:opacity-100',
        ],
        glass: [
          'glass text-foreground border-border/50',
          'hover:bg-surface/80 hover:border-border',
          'backdrop-blur-sm',
        ],
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8 text-base',
        xl: 'h-12 rounded-lg px-10 text-lg',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
      loading: {
        true: 'cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      loading: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    
    // When using asChild, we need to pass props to the child and let it handle rendering
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, loading, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };