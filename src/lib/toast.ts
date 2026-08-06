import { toast as sonnerToast } from 'sonner'

interface ToastOptions {
  description?: string
}

export const toast = {
  success: (message: string, options?: ToastOptions) => sonnerToast.success(message, options),
  warning: (message: string, options?: ToastOptions) => sonnerToast.warning(message, options),
  info:    (message: string, options?: ToastOptions) => sonnerToast.info(message, options),
  // Errores críticos necesitan más tiempo de lectura que el resto (default de Sonner ~4s).
  error:   (message: string, options?: ToastOptions) => sonnerToast.error(message, { ...options, duration: 6000 }),
}
