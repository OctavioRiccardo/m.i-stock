import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border border-[#E8E6DF] bg-white px-3 py-2 text-sm text-[#1C2424] shadow-sm transition-all duration-150',
            'placeholder:text-[#657373]/60',
            'focus-visible:border-[#2A7A78] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A7A78]/20',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50',
            error && 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
