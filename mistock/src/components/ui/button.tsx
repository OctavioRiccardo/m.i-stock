'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(28,36,36,0.14)] hover:bg-primary-hover active:bg-primary-active',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-[#D2EAE8] font-semibold',
        outline:
          'border border-border bg-card text-foreground shadow-[0_1px_2px_rgba(28,36,36,0.04)] hover:bg-muted/70 hover:border-[#D6D1C4]',
        ghost:
          'text-foreground-secondary hover:bg-muted/80 hover:text-foreground',
        destructive:
          'bg-destructive text-destructive-foreground shadow-[0_1px_2px_rgba(28,36,36,0.12)] hover:bg-red-700 active:bg-red-800',
        link:
          'text-primary underline-offset-4 hover:underline p-0 min-h-0 h-auto',
      },
      size: {
        default: 'min-h-9 px-4 py-2',
        sm: 'min-h-8 rounded-md px-3 py-1.5 text-xs',
        lg: 'min-h-11 rounded-lg px-6 py-2.5 text-sm font-semibold',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
