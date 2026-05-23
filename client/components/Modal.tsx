import type { ComponentChildren } from 'preact';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children?: ComponentChildren;
}

export function Modal({ open, onClose, children }: ModalProps) {
  return (
    <div class={`modal${open ? ' is-active' : ''}`}>
      <div class="modal-background" onClick={onClose} />
      <div class="modal-content">{children}</div>
      <button class="modal-close" type="button" aria-label="Close" onClick={onClose} />
    </div>
  );
}
