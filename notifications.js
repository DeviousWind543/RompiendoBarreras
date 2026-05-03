// ===== SISTEMA DE NOTIFICACIONES ELEGANTE =====

// Crear el contenedor de toasts si no existe
function createToastContainer() {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

// Mostrar notificación tipo toast (elegante)
function showToast(message, type = 'success', duration = 4000) {
  const container = createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  
  // Iconos según el tipo
  const icons = {
    success: '<i class="fas fa-check-circle"></i>',
    error: '<i class="fas fa-exclamation-circle"></i>',
    warning: '<i class="fas fa-exclamation-triangle"></i>',
    info: '<i class="fas fa-info-circle"></i>'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <p>${message}</p>
    </div>
    <button class="toast-close"><i class="fas fa-times"></i></button>
    <div class="toast-progress"></div>
  `;
  
  container.appendChild(toast);
  
  // Animación de entrada
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Cerrar manualmente
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => closeToast(toast));
  
  // Auto cerrar después de duración
  const timeout = setTimeout(() => closeToast(toast), duration);
  
  // Pausar al pasar el mouse
  toast.addEventListener('mouseenter', () => clearTimeout(timeout));
  toast.addEventListener('mouseleave', () => {
    setTimeout(() => closeToast(toast), duration);
  });
  
  return toast;
}

function closeToast(toast) {
  toast.classList.remove('show');
  setTimeout(() => toast.remove(), 300);
}

// ===== MODAL DE CONFIRMACIÓN ELEGANTE =====

function showConfirm(options) {
  return new Promise((resolve) => {
    // Crear overlay si no existe
    let modal = document.querySelector('.confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'confirm-modal';
      document.body.appendChild(modal);
    }
    
    // Configurar modal
    modal.innerHTML = `
      <div class="confirm-modal-overlay"></div>
      <div class="confirm-modal-container">
        <div class="confirm-modal-header">
          <div class="confirm-icon ${options.type || 'warning'}">
            <i class="fas ${options.icon || 'fa-question-circle'}"></i>
          </div>
          <h3>${options.title || 'Confirmar'}</h3>
        </div>
        <div class="confirm-modal-body">
          <p>${options.message || '¿Estás seguro de realizar esta acción?'}</p>
        </div>
        <div class="confirm-modal-footer">
          <button class="confirm-btn-cancel">${options.cancelText || 'Cancelar'}</button>
          <button class="confirm-btn-confirm">${options.confirmText || 'Aceptar'}</button>
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
    
    // Agregar animación
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Eventos
    const confirmBtn = modal.querySelector('.confirm-btn-confirm');
    const cancelBtn = modal.querySelector('.confirm-btn-cancel');
    const overlay = modal.querySelector('.confirm-modal-overlay');
    
    const close = () => {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
      resolve(false);
    };
    
    const accept = () => {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
      resolve(true);
    };
    
    confirmBtn.onclick = accept;
    cancelBtn.onclick = close;
    overlay.onclick = close;
  });
}

// Reemplazar confirm nativo
window.customConfirm = showConfirm;

// ===== MODAL DE ALERTA ELEGANTE =====

function showAlert(options) {
  return new Promise((resolve) => {
    let modal = document.querySelector('.alert-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'alert-modal';
      document.body.appendChild(modal);
    }
    
    const iconMap = {
      success: { icon: 'fa-check-circle', color: '#10b981' },
      error: { icon: 'fa-times-circle', color: '#dc2626' },
      warning: { icon: 'fa-exclamation-triangle', color: '#f59e0b' },
      info: { icon: 'fa-info-circle', color: '#3b82f6' }
    };
    
    const iconData = iconMap[options.type || 'info'];
    
    modal.innerHTML = `
      <div class="alert-modal-overlay"></div>
      <div class="alert-modal-container">
        <div class="alert-modal-icon" style="color: ${iconData.color}">
          <i class="fas ${iconData.icon}"></i>
        </div>
        <h3 class="alert-modal-title">${options.title || 'Aviso'}</h3>
        <p class="alert-modal-message">${options.message || ''}</p>
        <button class="alert-modal-btn">${options.buttonText || 'Entendido'}</button>
      </div>
    `;
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
    
    const btn = modal.querySelector('.alert-modal-btn');
    const overlay = modal.querySelector('.alert-modal-overlay');
    
    const close = () => {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
      resolve(true);
    };
    
    btn.onclick = close;
    overlay.onclick = close;
  });
}

// Reemplazar alert nativo
window.customAlert = showAlert;

// Función para cargar (muestra loading)
let loadingOverlay = null;

function showLoading(message = 'Cargando...') {
  let overlay = document.querySelector('.loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    document.body.appendChild(overlay);
  }
  
  overlay.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner-custom">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <p>${message}</p>
    </div>
  `;
  
  overlay.style.display = 'flex';
  setTimeout(() => overlay.classList.add('show'), 10);
  return overlay;
}

function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) {
    overlay.classList.remove('show');
    setTimeout(() => overlay.style.display = 'none', 300);
  }
}