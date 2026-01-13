import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'rounded-2xl p-6',
                    {
                        'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm':
                            variant === 'default',
                        'bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 shadow-xl':
                            variant === 'glass',
                    },
                    className
                )}
                {...props}
            />
        )
    }
)

Card.displayName = 'Card'

export const CardHeader = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 pb-4', className)}
        {...props}
    />
))

CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<
    HTMLHeadingElement,
    HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            'text-xl font-semibold leading-none tracking-tight text-zinc-900 dark:text-zinc-100',
            className
        )}
        {...props}
    />
))

CardTitle.displayName = 'CardTitle'

export const CardContent = forwardRef<
    HTMLDivElement,
    HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
))

CardContent.displayName = 'CardContent'
