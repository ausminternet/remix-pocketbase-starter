import clsx from 'clsx'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  labelRight?: ReactNode
  errors?: string[]
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, labelRight, errors, type, ...props }, ref) => {
    return (
      <label className="form-control w-full">
        {label && (
          <div className="label">
            {label && <div className="label-text">{label}</div>}
            {labelRight && <div className="label-text-alt">{labelRight}</div>}
          </div>
        )}
        <input
          className={clsx('input-bordered w-full', {
            'input-error': errors && errors.length > 0,
            input: type !== 'file',
            'file-input file-input-primary normal-case': type === 'file',
          })}
          ref={ref}
          type={type ?? 'text'}
          {...props}
        />
        {errors && errors.length > 0 && (
          <div className="label">
            <div className="label-text text-sm text-error">
              {errors.map((error) => (
                <div key={error}>{error}</div>
              ))}
            </div>
          </div>
        )}
      </label>
    )
  },
)
Input.displayName = 'Input'
