// Variables globales
let currentImageFile = null;
let isEditing = false;

// Inicializar: verificar autenticación y cargar lista
async function initAdmin() {
  await checkAuth();   // redirige si no hay sesión
  await loadAdminPosts();
  setupImagePreview();
}

// Previsualizar imagen seleccionada
function setupImagePreview() {
  const fileInput = document.getElementById("image");
  const previewDiv = document.getElementById("imagePreview");
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      currentImageFile = file;
      const reader = new FileReader();
      reader.onload = (event) => {
        previewDiv.innerHTML = `<img src="${event.target.result}" alt="preview">`;
      };
      reader.readAsDataURL(file);
    } else {
      previewDiv.innerHTML = "";
      currentImageFile = null;
    }
  });
}

// Guardar (crear o actualizar)
async function savePost() {
  const id = document.getElementById("editId").value;
  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  const file = currentImageFile;
  
  if (!title || !content) {
    showMessage("Por favor completa título y contenido", "error");
    return;
  }
  
  const saveBtn = document.getElementById("saveBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Guardando...";
  
  try {
    let image_url = "";
    
    // Subir nueva imagen si se seleccionó
    if (file) {
      // Sanitizar nombre del archivo para evitar error 400
      const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const fileName = `${Date.now()}_${cleanName}`;
      const { error: uploadError } = await supabaseClient.storage
        .from("images")
        .upload(fileName, file);
      
      if (uploadError) throw new Error("Error al subir imagen: " + uploadError.message);
      
      const { data: publicUrlData } = supabaseClient.storage
        .from("images")
        .getPublicUrl(fileName);
      
      image_url = publicUrlData.publicUrl;
    }
    
    let result;
    if (id && isEditing) {
      // Actualizar: si no hay nueva imagen, mantener la anterior
      if (!file) {
        const { data: oldPost } = await supabaseClient
          .from("posts")
          .select("image_url")
          .eq("id", id)
          .single();
        image_url = oldPost?.image_url || "";
      }
      result = await supabaseClient
        .from("posts")
        .update({ title, content, image_url, updated_at: new Date() })
        .eq("id", id);
    } else {
      // Crear nuevo
      result = await supabaseClient
        .from("posts")
        .insert([{ title, content, image_url }]);
    }
    
    if (result.error) throw result.error;
    
    showMessage(id ? "Publicación actualizada" : "Publicación creada", "success");
    resetForm();
    await loadAdminPosts();
  } catch (err) {
    showMessage(err.message, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Publicar";
  }
}

// Cargar posts en el listado del admin
async function loadAdminPosts() {
  const container = document.getElementById("adminPostsList");
  const loading = document.getElementById("adminLoading");
  loading.style.display = "block";
  
  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });
  
  loading.style.display = "none";
  
  if (error) {
    container.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    return;
  }
  
  if (data.length === 0) {
    container.innerHTML = `<div class="info-message">No hay publicaciones. ¡Crea la primera!</div>`;
    return;
  }
  
  container.innerHTML = "";
  data.forEach(post => {
    const div = document.createElement("div");
    div.className = "admin-post-item";
    div.innerHTML = `
      <div class="admin-post-info">
        <div class="admin-post-title">${escapeHtml(post.title)}</div>
        <small>${new Date(post.created_at).toLocaleDateString()}</small>
      </div>
      <div class="admin-post-actions">
        <button class="btn-edit" data-id="${post.id}">✏️ Editar</button>
        <button class="btn-delete" data-id="${post.id}">🗑️ Eliminar</button>
      </div>
    `;
    container.appendChild(div);
  });
  
  // Asignar eventos a botones
  document.querySelectorAll(".btn-edit").forEach(btn => {
    btn.addEventListener("click", () => editPost(btn.dataset.id));
  });
  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", () => deletePost(btn.dataset.id));
  });
}

// Editar post
async function editPost(id) {
  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    showMessage("No se pudo cargar el post", "error");
    return;
  }
  
  document.getElementById("editId").value = data.id;
  document.getElementById("title").value = data.title;
  document.getElementById("content").value = data.content;
  document.getElementById("formTitle").innerText = "Editar publicación";
  document.getElementById("saveBtn").textContent = "Actualizar";
  document.getElementById("cancelBtn").style.display = "inline-block";
  isEditing = true;
  
  // Limpiar preview de imagen y currentImageFile
  document.getElementById("imagePreview").innerHTML = "";
  currentImageFile = null;
  if (data.image_url) {
    const previewDiv = document.getElementById("imagePreview");
    previewDiv.innerHTML = `<img src="${data.image_url}" style="max-width:100%; border-radius:12px;"><p style="font-size:0.8rem;">Imagen actual (puedes reemplazar seleccionando otra)</p>`;
  }
  
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Eliminar post (CORREGIDO: ahora sí elimina la imagen del storage)
async function deletePost(id) {
  if (!confirm("¿Eliminar esta publicación permanentemente?")) return;
  
  // Obtener la imagen asociada al post
  const { data: post, error: fetchError } = await supabaseClient
    .from("posts")
    .select("image_url")
    .eq("id", id)
    .single();
  
  if (fetchError) {
    showMessage("Error al obtener la publicación: " + fetchError.message, "error");
    return;
  }
  
  // Eliminar el registro de la base de datos
  const { error: deleteError } = await supabaseClient
    .from("posts")
    .delete()
    .eq("id", id);
  
  if (deleteError) {
    showMessage("Error al eliminar: " + deleteError.message, "error");
    return;
  }
  
  // Si tenía imagen, intentar borrarla del storage (extraer nombre del archivo)
  if (post?.image_url) {
    try {
      // Extraer el nombre del archivo de la URL pública
      const urlParts = post.image_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      if (fileName) {
        const { error: storageError } = await supabaseClient.storage
          .from("images")
          .remove([fileName]);
        if (storageError) console.warn("No se pudo eliminar la imagen del storage:", storageError.message);
      }
    } catch (err) {
      console.warn("Error al eliminar imagen del storage:", err);
    }
  }
  
  showMessage("Publicación eliminada", "success");
  await loadAdminPosts();
  if (document.getElementById("editId").value === id) resetForm();
}

// Resetear formulario
function resetForm() {
  document.getElementById("editId").value = "";
  document.getElementById("title").value = "";
  document.getElementById("content").value = "";
  document.getElementById("image").value = "";
  document.getElementById("imagePreview").innerHTML = "";
  document.getElementById("formTitle").innerText = "Crear nueva publicación";
  document.getElementById("saveBtn").textContent = "Publicar";
  document.getElementById("cancelBtn").style.display = "none";
  currentImageFile = null;
  isEditing = false;
}

// Mostrar mensajes temporales
function showMessage(msg, type) {
  const msgDiv = document.getElementById("formMessage");
  msgDiv.textContent = msg;
  msgDiv.className = type === "error" ? "error-message" : "success-message";
  msgDiv.style.display = "block";
  setTimeout(() => {
    msgDiv.style.display = "none";
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Ejecutar al cargar admin.html
initAdmin();