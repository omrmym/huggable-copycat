import { differenceInDays, differenceInCalendarMonths, addMonths, addDays } from 'date-fns';

export interface ProratedPriceResult {
  remainingDays: number;
  totalCycleDays: number;
  newPlanDailyRate: number;
  currentPlanDailyRate: number;
  newPlanCost: number;
  currentPlanCredit: number;
  proratedAmount: number;
  isValid: boolean;
}

/**
 * Calculate the prorated price for a plan change based on remaining days until expiration.
 * Formula: (newPlanDailyRate × remainingDays) - (currentPlanDailyRate × remainingDays)
 * 
 * @param expiresAt - The user's current expiration date
 * @param newPlanPrice - The price of the new plan
 * @param currentPlanPrice - The price of the current/running plan
 * @param billingCycle - Either 'monthly' (1 calendar month) or '30_days' (30 days)
 * @returns ProratedPriceResult with calculated values
 */
export function calculateProratedPrice(
  expiresAt: string | null,
  newPlanPrice: number,
  currentPlanPrice: number = 0,
  billingCycle: string = 'monthly'
): ProratedPriceResult {
  const now = new Date();
  const totalCycleDays = 30; // Both cycles use 30 days for calculation
  
  // If no expiration date or already expired, return full price
  if (!expiresAt) {
    return {
      remainingDays: 0,
      totalCycleDays,
      newPlanDailyRate: newPlanPrice / totalCycleDays,
      currentPlanDailyRate: currentPlanPrice / totalCycleDays,
      newPlanCost: newPlanPrice,
      currentPlanCredit: 0,
      proratedAmount: newPlanPrice,
      isValid: false,
    };
  }
  
  const expirationDate = new Date(expiresAt);
  
  // If already expired, return full price (not valid for proration)
  if (expirationDate <= now) {
    return {
      remainingDays: 0,
      totalCycleDays,
      newPlanDailyRate: newPlanPrice / totalCycleDays,
      currentPlanDailyRate: currentPlanPrice / totalCycleDays,
      newPlanCost: newPlanPrice,
      currentPlanCredit: 0,
      proratedAmount: newPlanPrice,
      isValid: false,
    };
  }
  
  // Calculate remaining days (rounded up to include the current day)
  const remainingDays = Math.max(0, differenceInDays(expirationDate, now));
  
  // Calculate daily rates for both plans
  const newPlanDailyRate = newPlanPrice / totalCycleDays;
  const currentPlanDailyRate = currentPlanPrice / totalCycleDays;
  
  // Calculate costs
  const newPlanCost = newPlanDailyRate * remainingDays;
  const currentPlanCredit = currentPlanDailyRate * remainingDays;
  
  // Prorated amount = new plan cost - current plan credit
  const proratedAmount = Math.max(0, Math.round(newPlanCost - currentPlanCredit));
  
  return {
    remainingDays,
    totalCycleDays,
    newPlanDailyRate,
    currentPlanDailyRate,
    newPlanCost,
    currentPlanCredit,
    proratedAmount,
    isValid: remainingDays > 0,
  };
}

/**
 * Format the prorated price breakdown for display
 */
export function formatProratedBreakdown(result: ProratedPriceResult, newPlanPrice: number, currentPlanPrice: number): string {
  if (!result.isValid) {
    return `Full price: ৳${newPlanPrice.toLocaleString()}`;
  }
  
  return `(৳${newPlanPrice.toLocaleString()} ÷ ${result.totalCycleDays} × ${result.remainingDays}) - (৳${currentPlanPrice.toLocaleString()} ÷ ${result.totalCycleDays} × ${result.remainingDays}) = ৳${result.proratedAmount.toLocaleString()}`;
}
