
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { useEffect } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return format(date, 'PPP')
}

export function formatAmount(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Utility function to create a safe effect hook that prevents state updates after unmount
export function useSafeEffect(
  effect: (isMounted: () => boolean) => void | (() => void),
  deps: React.DependencyList
) {
  useEffect(() => {
    let mounted = true;
    const isMounted = () => mounted;
    
    const cleanup = effect(isMounted);
    
    return () => {
      mounted = false;
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, deps);
}
