import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium leading-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
  {
    variants: {
      variant: {
        default:
          'border border-primary/20 bg-secondary text-secondary-foreground',
        secondary:
          'border border-border bg-muted text-foreground-secondary',
        destructive:
          'border border-red-200 bg-red-50 text-red-700',
        outline:
          'border border-border bg-card/70 text-foreground-secondary',
        success:
          'border border-emerald-200 bg-emerald-50 text-emerald-800',
        warning:
          'border border-amber-200 bg-amber-50 text-amber-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
