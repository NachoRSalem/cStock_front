import { Modal, ModalFooter } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
}

const variantConfig = {
  danger: {
    icon: <XCircle className="h-6 w-6" />,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    confirmVariant: 'danger' as const,
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6" />,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    confirmVariant: 'primary' as const,
  },
  info: {
    icon: <Info className="h-6 w-6" />,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmVariant: 'primary' as const,
  },
  success: {
    icon: <CheckCircle className="h-6 w-6" />,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    confirmVariant: 'success' as const,
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  loading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" showClose={false}>
      <div className="flex gap-4">
        <div className={clsx('flex-shrink-0 p-3 rounded-full', config.iconBg, config.iconColor)}>
          {config.icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-neutral-700">{message}</p>
        </div>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={config.confirmVariant} onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
