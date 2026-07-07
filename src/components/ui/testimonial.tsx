'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TestimonialData = {
  id?: React.Key;
  avatar?: string;
  name?: string;
  role?: string;
  quote?: string;
  accent?: string;
  render?: (ctx: { active: boolean; index: number }) => React.ReactNode;
};

export type TestimonialCarouselProps = {
  items: TestimonialData[];
  variant?: 'card' | 'minimal';
  loop?: boolean;
  autoplay?: boolean;
  autoplayMs?: number;
  showArrows?: boolean;
  showDots?: boolean;
  allowKeyboard?: boolean;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  className?: string;
  contentClassName?: string;
  cardClassName?: string;
  avatarClassName?: string;
  nameClassName?: string;
  roleClassName?: string;
  quoteClassName?: string;
  ariaLabel?: string;
};

export function TestimonialCarousel({
  items,
  variant = 'card',
  loop = true,
  autoplay = false,
  autoplayMs = 5000,
  showArrows = true,
  showDots = true,
  allowKeyboard = true,
  initialIndex = 0,
  onIndexChange,
  className,
  contentClassName,
  cardClassName,
  avatarClassName,
  nameClassName,
  roleClassName,
  quoteClassName,
  ariaLabel = 'Testimonials',
}: TestimonialCarouselProps) {
  const count = items.length;
  const [index, setIndex] = React.useState(
    Math.min(Math.max(initialIndex, 0), Math.max(count - 1, 0))
  );
  const active = ((i: number) => ((i % count) + count) % count)(index);

  const go = React.useCallback(
    (delta: number) => {
      setIndex((i) => {
        const next = i + delta;
        if (!loop) {
          const clamped = Math.min(Math.max(next, 0), count - 1);
          onIndexChange?.(clamped);
          return clamped;
        }
        const wrapped = ((next % count) + count) % count;
        onIndexChange?.(wrapped);
        return wrapped;
      });
    },
    [count, loop, onIndexChange]
  );

  React.useEffect(() => {
    if (!autoplay || count <= 1) return;
    const id = setInterval(() => go(1), autoplayMs);
    return () => clearInterval(id);
  }, [autoplay, autoplayMs, count, go]);

  React.useEffect(() => {
    if (!allowKeyboard) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [allowKeyboard, go]);

  return (
    <section
      aria-roledescription='carousel'
      aria-label={ariaLabel}
      className={cn(
        'relative w-full overflow-hidden rounded-2xl bg-white/60 p-6 shadow-sm ring-1 ring-zinc-200 backdrop-blur dark:bg-zinc-900/40 dark:ring-zinc-800',
        className
      )}
    >
      {showArrows && count > 1 && (
        <>
          <button
            type='button'
            onClick={() => go(-1)}
            aria-label='Previous testimonial'
            className='absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 text-zinc-500 ring-1 ring-zinc-200 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800'
          >
            <ChevronLeft className='h-5 w-5' />
          </button>
          <button
            type='button'
            onClick={() => go(1)}
            aria-label='Next testimonial'
            className='absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 text-zinc-500 ring-1 ring-zinc-200 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800'
          >
            <ChevronRight className='h-5 w-5' />
          </button>
        </>
      )}

      <div className={cn('relative mx-auto max-w-3xl', contentClassName)}>
        <AnimatePresence mode='wait' initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className='grid place-items-center'
            role='group'
            aria-roledescription='slide'
            aria-label={`${active + 1} of ${count}`}
          >
            {typeof items[active]?.render === 'function' ? (
              items[active].render!({ active: true, index: active })
            ) : (
              <DefaultCard
                item={items[active]}
                variant={variant}
                className={cardClassName}
                avatarClassName={avatarClassName}
                nameClassName={nameClassName}
                roleClassName={roleClassName}
                quoteClassName={quoteClassName}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {showDots && count > 1 && (
        <div
          role='tablist'
          aria-label='Testimonial slides'
          className='mt-8 flex justify-center gap-2'
        >
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type='button'
              role='tab'
              aria-selected={i === active}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => {
                const delta = i - active;
                go(delta);
              }}
              className={cn(
                'h-2 w-2 rounded-full transition-all duration-300',
                i === active
                  ? 'w-6 bg-zinc-800 dark:bg-zinc-200'
                  : 'bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-600'
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function DefaultCard({
  item,
  variant,
  className,
  avatarClassName,
  nameClassName,
  roleClassName,
  quoteClassName,
}: {
  item: TestimonialData;
  variant: 'card' | 'minimal';
  className?: string;
  avatarClassName?: string;
  nameClassName?: string;
  roleClassName?: string;
  quoteClassName?: string;
}) {
  const { avatar, name, role, quote, accent } = item;

  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'flex flex-col items-center text-center px-4 md:px-12',
          className
        )}
      >
        <p
          className={cn(
            'mb-8 text-xl font-medium leading-relaxed text-zinc-700 dark:text-zinc-300 md:text-2xl',
            quoteClassName
          )}
        >
          "{quote}"
        </p>
        <div className='flex items-center gap-4'>
          {avatar && (
            <img
              src={avatar}
              alt={name || 'Avatar'}
              className={cn(
                'h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-zinc-900',
                avatarClassName
              )}
            />
          )}
          <div className='text-left'>
            <div
              className={cn(
                'font-semibold text-zinc-900 dark:text-white',
                nameClassName
              )}
              style={accent ? { color: accent } : undefined}
            >
              {name}
            </div>
            {role && (
              <div
                className={cn('text-sm text-zinc-500', roleClassName)}
              >
                {role}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // default 'card' variant
  return (
    <div
      className={cn(
        'relative flex w-full max-w-2xl flex-col gap-6 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-zinc-200/50 dark:bg-zinc-900 dark:ring-zinc-800/50 sm:p-10',
        className
      )}
    >
      <div className='flex items-center gap-4'>
        {avatar && (
          <img
            src={avatar}
            alt={name || 'Avatar'}
            className={cn(
              'h-14 w-14 rounded-full object-cover ring-4 ring-zinc-50 dark:ring-zinc-900',
              avatarClassName
            )}
          />
        )}
        <div>
          <div
            className={cn(
              'text-lg font-semibold text-zinc-900 dark:text-white',
              nameClassName
            )}
            style={accent ? { color: accent } : undefined}
          >
            {name}
          </div>
          {role && (
            <div
              className={cn(
                'text-sm text-zinc-500 dark:text-zinc-400',
                roleClassName
              )}
            >
              {role}
            </div>
          )}
        </div>
      </div>
      <p
        className={cn(
          'text-lg leading-relaxed text-zinc-700 dark:text-zinc-300',
          quoteClassName
        )}
      >
        "{quote}"
      </p>
    </div>
  );
}
