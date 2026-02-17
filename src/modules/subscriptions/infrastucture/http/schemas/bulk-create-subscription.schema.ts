import { z } from 'zod';

/**
 * Schema for validating CSV row data for bulk subscription creation
 */
export const csvRowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !Number.isNaN(num) && num > 0;
      },
      { message: 'Price must be a positive number' }
    ),
  currency: z
    .string()
    .optional()
    .transform((val) => (val ? val.toUpperCase() : 'BRL'))
    .pipe(z.enum(['BRL', 'USD'])),
  billingCycle: z
    .string()
    .min(1, 'Billing cycle is required')
    .transform((val) => val.toUpperCase())
    .refine((val) => ['WEEKLY', 'MONTHLY', 'YEARLY'].includes(val), {
      message: 'Billing cycle must be one of: WEEKLY, MONTHLY, YEARLY',
    }),
  startDate: z
    .string()
    .min(1, 'Start date is required')
    .refine(
      (val) => {
        const date = new Date(val);
        return !Number.isNaN(date.getTime());
      },
      { message: 'Start date must be a valid date' }
    )
    .transform((val) => new Date(val)),
  trialEndsAt: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !Number.isNaN(date.getTime());
      },
      { message: 'Trial end date must be a valid date' }
    )
    .transform((val) => (val ? new Date(val) : undefined)),
});

/**
 * Schema for validating bulk create subscription input (after CSV parsing)
 */
export const bulkCreateSubscriptionInputSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().positive(),
  currency: z.enum(['BRL', 'USD']).default('BRL'),
  billingCycle: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
  startDate: z.date(),
  trialEndsAt: z.date().optional(),
});

/**
 * Type for validated CSV row
 */
export type CSVRow = z.infer<typeof csvRowSchema>;

/**
 * Type for bulk create subscription input
 */
export type BulkCreateSubscriptionInput = z.infer<typeof bulkCreateSubscriptionInputSchema>;
