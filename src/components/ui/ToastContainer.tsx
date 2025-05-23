import React from 'react';
import { useToasts } from '@/context/ToastContext';
import { Toast, ToastProps } from '@/components/ui/Toast'; // Убедимся, что ToastProps экспортируется, если нужно

// Определим, какие пропсы ToastContainer будет принимать от ToastMessage
// в основном это message и type, остальное обработает Toast.tsx

export const ToastContainer = () => {
  const { toasts, removeToast } = useToasts();

  if (!toasts.length) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          // Преобразуем наш ToastType в тип, который ожидает компонент Toast (если они отличаются)
          // В данном случае, ToastProps ожидает type: 'success' | 'error' | 'info' | 'warning'
          // что совпадает с нашим ToastType
          type={toast.type}
          duration={toast.duration} // передаем duration
          onClose={() => removeToast(toast.id)} 
        />
      ))}
    </div>
  );
}; 