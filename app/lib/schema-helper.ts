import type { RefinementCtx } from 'zod'
import { z } from 'zod'
import { getSizeForMegaBytes } from './utils'

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
  .regex(/^[a-zA-Z0-9]+$/, {
    message: 'Username must only contain alphanumeric characters',
  })

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

const MAX_FILE_SIZE = getSizeForMegaBytes(5)
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

export const avatarFileString = z
  .any()
  .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    'Only .jpg, .jpeg, .png and .webp files are accepted.',
  )
  .optional()
