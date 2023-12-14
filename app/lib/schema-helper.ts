import type { RefinementCtx } from 'zod'
import { z } from 'zod'

export const getPasswordString = (requiredError: string) => {
  return z.string({ required_error: requiredError }).min(8, {
    message: 'Password must be a minimum of 8 characters',
  })
}

export const emailString = z
  .string({ required_error: 'Email is required' })
  .email({ message: 'Email must be a valid email' })

export const usernameString = z
  .string({ required_error: 'Username is required' })
  .min(2, { message: 'Username must be at least 2 characters' })
  .max(64, { message: 'Username must be less than 64 characters' })
  .trim()

export const nameString = z
  .string()
  .min(2, { message: 'Name must be at least 2 characters' })
  .max(64, { message: 'Name must be less than 64 characters' })
  .trim()
  .optional()
  .or(z.literal(''))
export const passwordsEqualityRefinement = (
  { password, passwordConfirm }: { password: string; passwordConfirm: string },
  ctx: RefinementCtx,
) => {
  if (password !== passwordConfirm) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Password & Confirm password must match',
      path: ['password'],
    })
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Password & Confirm password must match',
      path: ['passwordConfirm'],
    })
  }
  return true
}
