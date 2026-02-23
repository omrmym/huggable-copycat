import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as BDT (Bangladeshi Taka) currency
 * @param amount - The amount to format
 * @param showSymbol - Whether to show the ৳ symbol (default: true)
 * @returns Formatted currency string
 */
export function formatBDT(amount: number | null | undefined, showSymbol = true): string {
  const value = Number(amount) || 0;
  const formatted = value.toLocaleString('en-BD');
  return showSymbol ? `৳${formatted}` : formatted;
}

/**
 * Format a number as BDT currency for PDF (using "BDT" text instead of ৳ symbol)
 * jsPDF doesn't support Unicode characters like ৳ natively
 * @param amount - The amount to format
 * @returns Formatted currency string with "BDT" prefix
 */
export function formatBDTForPDF(amount: number | null | undefined): string {
  const value = Number(amount) || 0;
  return `BDT ${value.toLocaleString('en-BD')}`;
}
