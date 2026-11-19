import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          aria-invalid={error ? true : undefined}
          className={cn(
            'flex min-h-9 h-9 w-full rounded-lg border border-input bg-background/80 px-3 py-1.5 text-sm text-foreground transition-[background-color,border-color,box-shadow] duration-150',
            'placeholder:text-foreground-subtle',
            'hover:border-[#CBC5B6]',
            'focus-visible:bg-card focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
            'disabled:cursor-not-allowed disabled:bg-muted/70 disabled:text-muted-foreground disabled:opacity-70',
            error && 'border-destructive bg-red-50/40 focus-visible:border-destructive focus-visible:ring-destructive/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-700 font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
