import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { cn } from '@/lib/utils';

export interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  value: Option;
  onChange: (value: Option) => void;
  options: Option[];
  label?: string;
  error?: boolean;
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  label,
  error,
  className,
}: SelectProps) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative mt-1">
        {label && (
          <Listbox.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </Listbox.Label>
        )}
        <Listbox.Button
          className={cn(
            'relative w-full cursor-default rounded-md border border-gray-200 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 sm:text-sm dark:border-gray-800 dark:bg-gray-950',
            error && 'border-red-500 focus:ring-red-400',
            className
          )}
        >
          <span className="block truncate">{value.label}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm dark:bg-gray-900">
            {options.map((option) => (
              <Listbox.Option
                key={option.value}
                className={({ active }) =>
                  cn(
                    'relative cursor-default select-none py-2 pl-10 pr-4',
                    active
                      ? 'bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100'
                      : 'text-gray-900 dark:text-gray-100'
                  )
                }
                value={option}
              >
                {({ selected }) => (
                  <>
                    <span
                      className={cn(
                        'block truncate',
                        selected ? 'font-medium' : 'font-normal'
                      )}
                    >
                      {option.label}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-600 dark:text-purple-400">
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
} 