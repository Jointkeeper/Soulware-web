import { Fragment, useEffect, useState } from 'react';
import { Transition } from '@headlessui/react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

const icons = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

const styles = {
  success: 'bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100',
  error: 'bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100',
  warning: 'bg-yellow-50 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100',
  info: 'bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100',
};

export function Toast({
  open,
  setOpen,
  type = 'info',
  title,
  message,
  duration = 5000,
  onClose,
  className,
}: ToastProps) {
  const Icon = icons[type];
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration === Infinity) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <Transition
      show={isVisible}
      as={Fragment}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className={cn("pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5", className)}>
        <div className={cn('p-4', styles[type])}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium">{title}</p>
              {message && <p className="mt-1 text-sm">{message}</p>}
            </div>
            <div className="ml-4 flex flex-shrink-0">
              <button
                type="button"
                className="inline-flex rounded-md text-current hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                onClick={() => setOpen(false)}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
} 