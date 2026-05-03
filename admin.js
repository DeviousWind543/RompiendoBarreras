let currentImageFile = null;
let isEditing = false;
let imageToDelete = false;

// Inicialización
async function initAdmin() {
  await checkAuth();
  await loadAdminPosts();
  
  const imageInput = document.getElementById("image");
  if (imageInput) {
    imageInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (file) {
        currentImageFile = file;
        imageToDelete = false;
        const reader = new FileReader();
        reader.onload = e => {
          const preview = document.getElementById("imagePreview");
          if (preview) {
            preview.innerHTML = `
              <img src="${e.target.result}" style="width:100px; border-radius:8px;">
              <button type="button" class="btn-remove-img" onclick="removeCurrentImage()" style="margin-top:8px;">
                <i class="fas fa-trash-alt"></i> Eliminar imagen
              </button>
            `;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn) cancelBtn.style.display = "inline-flex";
}

function removeCurrentImage() {
  customConfirm({
    title: 'Eliminar imagen',
    message: '¿Estás seguro de que quieres eliminar esta imagen? La publicación se guardará sin imagen.',
    type: 'warning',
    confirmText: 'Sí, eliminar',
    cancelText: 'Cancelar'
  }).then(confirmed => {
    if (confirmed) {
      imageToDelete = true;
      currentImageFile = null;
      const preview = document.getElementById("imagePreview");
      if (preview) {
        preview.innerHTML = `
          <div style="padding: 10px; background: rgba(220,38,38,0.1); border-radius: 12px; color: #dc2626; font-size: 0.8rem;">
            <i class="fas fa-trash-alt"></i> Imagen eliminada. Se guardará sin imagen.
          </div>
        `;
      }
      const imageInput = document.getElementById("image");
      if (imageInput) imageInput.value = "";
      showToast('Imagen eliminada correctamente', 'warning');
    }
  });
}

// GUARDAR O ACTUALIZAR POST
async function savePost() {
  const id = document.getElementById("editId").value;
  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  const formMessage = document.getElementById("formMessage");
  
  if (!title || !content) {
    showToast('Completa todos los campos obligatorios', 'error');
    return;
  }

  showLoading('Guardando publicación...');

  try {
    let image_url = "";
    
    if (isEditing && imageToDelete) {
      image_url = "";
    } 
    else if (!currentImageFile && !imageToDelete) {
      const currentImg = document.getElementById("imagePreview").querySelector('img');
      if (currentImg && currentImg.src && !currentImg.src.includes('blob:')) {
        image_url = currentImg.src;
      }
    }

    if (currentImageFile) {
      const fileName = `${Date.now()}_${currentImageFile.name}`;
      const { error: uploadError } = await supabaseClient.storage
        .from("images")
        .upload(fileName, currentImageFile);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabaseClient.storage.from("images").getPublicUrl(fileName);
      image_url = data.publicUrl;
    }

    const postData = { title, content, image_url };

    let error;
    if (isEditing && id) {
      const { error: updateError } = await supabaseClient
        .from("posts")
        .update(postData)
        .eq("id", id);
      error = updateError;
    } else {
      const { error: insertError } = await supabaseClient
        .from("posts")
        .insert([postData]);
      error = insertError;
    }

    if (error) throw error;
    
    hideLoading();
    showToast(isEditing ? '¡Publicación actualizada!' : '¡Publicación creada!', 'success');
    
    resetForm();
    await loadAdminPosts();
    
    if (typeof loadFeedPosts === 'function') {
      await loadFeedPosts();
    }
  } catch (err) {
    hideLoading();
    showToast('Error: ' + err.message, 'error');
    console.error(err);
  }
}

// CARGAR LISTA PARA ADMIN
async function loadAdminPosts() {
  const container = document.getElementById("adminPostsList");
  const loading = document.getElementById("adminLoading");
  
  if (loading) loading.style.display = "block";
  
  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (loading) loading.style.display = "none";

  if (error) {
    if (container) container.innerHTML = `<div class="error-message">Error al cargar posts</div>`;
    return;
  }

  if (!container) return;
  
  if (data.length === 0) {
    container.innerHTML = `<div class="info-message">No hay publicaciones aún. ¡Crea la primera!</div>`;
    return;
  }

  container.innerHTML = data.map(post => `
    <div class="admin-post-item">
      <div class="admin-post-info">
        <div class="admin-post-title">${escapeHtml(post.title)}</div>
        <div style="font-size:12px; color:gray; margin-top:4px;">📅 ${new Date(post.created_at).toLocaleDateString('es-ES')}</div>
        ${post.image_url ? '<div style="font-size:11px; color:#c6a43f; margin-top:4px;"><i class="fas fa-image"></i> Con imagen</div>' : '<div style="font-size:11px; color:#888;"><i class="fas fa-file-alt"></i> Sin imagen</div>'}
      </div>
      <div class="admin-post-actions">
        <button class="btn-edit" onclick="editPost('${post.id}')"><i class="fas fa-pen"></i> Editar</button>
        <button class="btn-delete" onclick="deletePost('${post.id}')"><i class="fas fa-trash"></i> Eliminar</button>
      </div>
    </div>
  `).join('');
}

// EDITAR POST
async function editPost(id) {
  showLoading('Cargando publicación...');
  
  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();
  
  hideLoading();
  
  if (error || !data) {
    showToast('Error al cargar el post', 'error');
    return;
  }
  
  if (data) {
    currentImageFile = null;
    imageToDelete = false;
    isEditing = true;
    
    document.getElementById("editId").value = data.id;
    document.getElementById("title").value = data.title;
    document.getElementById("content").value = data.content;
    document.getElementById("formTitle").innerHTML = '<i class="fas fa-edit"></i> Editando Publicación';
    document.getElementById("saveBtn").innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
    
    const previewContainer = document.getElementById("imagePreview");
    if (data.image_url) {
      previewContainer.innerHTML = `
        <div style="position: relative; display: inline-block;">
          <img src="${data.image_url}" style="width:120px; border-radius:12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <button type="button" class="btn-remove-img" onclick="removeCurrentImage()" style="margin-top:8px; display: flex; align-items: center; gap: 6px;">
            <i class="fas fa-trash-alt"></i> Eliminar imagen
          </button>
        </div>
      `;
    } else {
      previewContainer.innerHTML = '<div style="color:#888; font-size:0.8rem;"><i class="fas fa-image"></i> Sin imagen</div>';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Publicación cargada para editar', 'info');
  }
}

// ELIMINAR POST
async function deletePost(id) {
  customConfirm({
    title: 'Eliminar publicación',
    message: '¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.',
    type: 'danger',
    confirmText: 'Sí, eliminar',
    cancelText: 'Cancelar'
  }).then(async (confirmed) => {
    if (confirmed) {
      showLoading('Eliminando publicación...');
      
      const { error } = await supabaseClient
        .from("posts")
        .delete()
        .eq("id", id);
      
      hideLoading();
      
      if (error) {
        showToast('Error al eliminar: ' + error.message, 'error');
      } else {
        showToast('Publicación eliminada correctamente', 'success');
        await loadAdminPosts();
        
        if (typeof loadFeedPosts === 'function') {
          await loadFeedPosts();
        }
      }
    }
  });
}

// RESETEAR FORMULARIO
function resetForm() {
  isEditing = false;
  currentImageFile = null;
  imageToDelete = false;
  
  document.getElementById("editId").value = "";
  document.getElementById("title").value = "";
  document.getElementById("content").value = "";
  document.getElementById("image").value = "";
  document.getElementById("imagePreview").innerHTML = "";
  document.getElementById("formTitle").innerHTML = '<i class="fas fa-pen-fancy"></i> Crear nueva publicación';
  document.getElementById("saveBtn").innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Publicar';
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

initAdmin();