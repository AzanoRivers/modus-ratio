import { Toaster as SonnerToaster } from 'sonner'
import './Toaster.css'

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-right"
      richColors
      closeButton
      visibleToasts={3}
      gap={8}
    />
  )
}
