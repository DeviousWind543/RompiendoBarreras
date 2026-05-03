// Función de login (usada en login.html)
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById("loginError");
  const submitBtn = document.querySelector('.btn-login');

  if (!email || !password) {
    if (errorDiv) {
      errorDiv.style.display = "flex";
      errorDiv.querySelector('span').textContent = "Por favor, completa todos los campos";
    }
    return;
  }

  // Mostrar loading en el botón
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';
  submitBtn.disabled = true;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  // Restaurar botón
  submitBtn.innerHTML = originalText;
  submitBtn.disabled = false;

  if (error) {
    if (errorDiv) {
      errorDiv.style.display = "flex";
      errorDiv.querySelector('span').textContent = error.message;
    }
    // Mostrar notificación elegante
    if (typeof showToast === 'function') {
      showToast(error.message, 'error', 4000);
    }
  } else {
    // Mostrar notificación de éxito
    if (typeof showToast === 'function') {
      showToast('✅ ¡Bienvenido! Redirigiendo al panel...', 'success', 2000);
    }
    setTimeout(() => {
      window.location.href = "admin.html";
    }, 500);
  }
}

// Verificar si hay sesión activa con manejo de renovación
async function checkAuth() {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  
  if (error || !session) {
    const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession();
    if (refreshError || !refreshData.session) {
      window.location.href = "login.html";
      return null;
    }
    return refreshData.session;
  }
  return session;
}

// Escuchar cambios en la autenticación
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' && window.location.pathname.includes('admin.html')) {
    if (typeof showToast === 'function') {
      showToast('Sesión cerrada correctamente', 'info', 3000);
    }
    setTimeout(() => {
      window.location.href = "login.html";
    }, 500);
  }
});

// Cerrar sesión
async function logout() {
  if (typeof customConfirm === 'function') {
    const confirmed = await customConfirm({
      title: 'Cerrar sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      type: 'warning',
      confirmText: 'Sí, cerrar',
      cancelText: 'Cancelar'
    });
    
    if (!confirmed) return;
  }
  
  await supabaseClient.auth.signOut();
  if (typeof showToast === 'function') {
    showToast('🔓 Sesión cerrada correctamente', 'success', 2000);
  }
  setTimeout(() => {
    window.location.href = "index.html";
  }, 500);
}

// Función adicional para redirigir desde login si ya hay sesión
async function redirectIfLoggedIn() {
  const { data: { session: currentSession } } = await supabaseClient.auth.getSession();
  if (currentSession && window.location.pathname.includes('login.html')) {
    window.location.href = "admin.html";
  }
}