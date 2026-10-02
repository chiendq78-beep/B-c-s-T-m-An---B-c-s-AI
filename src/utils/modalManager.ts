type CloseHandler = () => void;

// Global modal stack to track all active cards, drawers, popups, and sub-views
const activeModalStack: { id: string; close: CloseHandler }[] = [];

export const registerModal = (id: string, close: CloseHandler): (() => void) => {
  const index = activeModalStack.findIndex(item => item.id === id);
  if (index !== -1) {
    activeModalStack.splice(index, 1);
  }
  activeModalStack.push({ id, close });
  document.body.setAttribute('data-has-modal', 'true');
  window.dispatchEvent(new CustomEvent('modal-stack-change', { detail: { count: activeModalStack.length } }));

  return () => {
    unregisterModal(id);
  };
};

export const unregisterModal = (id: string): void => {
  const index = activeModalStack.findIndex(item => item.id === id);
  if (index !== -1) {
    activeModalStack.splice(index, 1);
  }
  if (activeModalStack.length === 0) {
    document.body.removeAttribute('data-has-modal');
  }
  window.dispatchEvent(new CustomEvent('modal-stack-change', { detail: { count: activeModalStack.length } }));
};

export const popTopModal = (): boolean => {
  if (activeModalStack.length > 0) {
    const top = activeModalStack.pop();
    if (activeModalStack.length === 0) {
      document.body.removeAttribute('data-has-modal');
    }
    window.dispatchEvent(new CustomEvent('modal-stack-change', { detail: { count: activeModalStack.length } }));
    if (top && typeof top.close === 'function') {
      try {
        top.close();
      } catch (err) {
        console.error('Error closing modal:', err);
      }
      return true;
    }
  }
  return false;
};

export const hasAnyOpenModal = (): boolean => {
  if (activeModalStack.length > 0) return true;
  // Also check if any modal overlay is present in the DOM
  return !!document.querySelector('[data-modal="true"], [role="dialog"], .fixed.inset-0.z-50, .fixed.inset-0.z-\\[60\\]');
};
