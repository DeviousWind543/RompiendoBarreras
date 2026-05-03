// Función de login (usada en login.html)
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById("loginError");

  errorDiv.style.display = "none";
  
  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    errorDiv.textContent = error.message;
    errorDiv.style.display = "block";
  } else {
    window.location.href = "admin.html";
  }
}

// Verificar si hay sesión activa con manejo de renovación
async function checkAuth() {
  // Obtener la sesión actual
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  
  if (error || !session) {
    // Intentar refrescar la sesión por si el token expiró
    const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession();
    if (refreshError || !refreshData.session) {
      // No hay sesión válida, redirigir al login
      window.location.href = "login.html";
      return null;
    }
    return refreshData.session;
  }
  return session;
}

// Escuchar cambios en la autenticación (útil para mantener sesión en pestañas múltiples)
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' && window.location.pathname.includes('admin.html')) {
    window.location.href = "login.html";
  }
  // Si el token se refresca automáticamente, no hacer nada
});

// Cerrar sesión
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

// Función adicional para redirigir desde login si ya hay sesión (opcional, pero útil)
async function redirectIfLoggedIn() {
  const session = await checkAuth(); // checkAuth redirige si no hay sesión, pero aquí queremos lo contrario
  const { data: { session: currentSession } } = await supabaseClient.auth.getSession();
  if (currentSession && window.location.pathname.includes('login.html')) {
    window.location.href = "admin.html";
  }
}