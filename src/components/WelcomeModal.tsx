import { Modal, ModalFooter } from "./ui/Modal";
import { Button } from "./ui/Button";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bienvenido a Gestión Stock"
      description="Credenciales de prueba para explorar la aplicación"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-neutral-700">
          Utiliza las siguientes credenciales para probar los distintos tipos de usuario:
        </p>
        <ul className="text-sm text-neutral-700">
          <li>
            <strong>Administrador:</strong> usuario: <code>admin</code>, contraseña: <code>admin123</code>
          </li>
          <li>
            <strong>Usuario estándar:</strong> usuario: <code>user</code>, contraseña: <code>user123</code>
          </li>
        </ul>
      </div>
      <ModalFooter>
        <Button onClick={onClose} variant="primary">
          Comenzar
        </Button>
      </ModalFooter>
    </Modal>
  );
}