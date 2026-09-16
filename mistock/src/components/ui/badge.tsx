import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#2A7A78] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border border-[#2A7A78]/25 bg-[#E2F1F0] text-[#2A7A78]',
        secondary:
          'border border-gray-200 bg-gray-100 text-gray-800',
        destructive:
          'border border-red-200 bg-red-50 text-red-700',
        outline:
          'border border-[#E8E6DF] text-[#1C2424]',
        success:
          'border border-emerald-200 bg-emerald-50 text-emerald-700',
        warning:
          'border border-amber-200 bg-amber-50 text-amber-700',
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
