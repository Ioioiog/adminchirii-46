
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

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

// Add a new utility function to create safe effects
export function createSafeEffect<T extends any[]>(
  effect: (isMounted: () => boolean, ...args: T) => void | (() => void),
  deps: React.DependencyList
): void {
  let mounted = true;
  const isMounted = () => mounted;
  
  const cleanup = effect(isMounted);
  
  return () => {
    mounted = false;
    if (typeof cleanup === 'function') {
      cleanup();
    }
  };
}
