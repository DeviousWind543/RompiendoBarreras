// Cargar posts en el feed público
async function loadFeedPosts() {
  const feedContainer = document.getElementById("feed");
  const loading = document.getElementById("loading");
  const postCountSpan = document.getElementById("postCount");
  
  if (!feedContainer) return;
  
  if (loading) loading.style.display = "flex";
  
  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (loading) loading.style.display = "none";
  
  if (error) {
    feedContainer.innerHTML = `<div class="error-message">❌ Error al cargar publicaciones</div>`;
    console.error(error);
    return;
  }
  
  // Actualizar contador de posts en el hero
  if (postCountSpan && data) {
    postCountSpan.textContent = data.length;
  }
  
  if (data.length === 0) {
    feedContainer.innerHTML = `<div class="info-message">📢 No hay campañas aún. Vuelve pronto.</div>`;
    return;
  }
  
  feedContainer.innerHTML = "";
  
  for (const post of data) {
    const card = document.createElement("article");
    card.className = "post-card";
    
    // ===== FUNCIÓN PARA FORMATEAR TEXTO RESPETANDO PÁRRAFOS =====
    function formatText(text) {
      if (!text) return "";
      // Escapar HTML primero
      let escaped = escapeHtml(text);
      // Convertir dobles saltos de línea a párrafos
      const paragraphs = escaped.split(/\n\s*\n/);
      if (paragraphs.length > 1) {
        return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
      } else {
        // Un solo párrafo, convertir saltos simples a <br>
        return `<p>${escaped.replace(/\n/g, '<br>')}</p>`;
      }
    }
    
    // Formatear el contenido completo
    const formattedContent = formatText(post.content);
    
    // Formatear fecha con icono premium
    const formattedDate = new Date(post.created_at).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Calcular altura aproximada del texto (sin etiquetas HTML)
    const plainText = post.content || "";
    const textHeight = plainText.length * 0.45;
    const imageHeight = 300;
    const needsBottomText = textHeight > imageHeight && post.image_url;
    
    if (post.image_url) {
      if (needsBottomText) {
        // Dividir el texto en dos partes respetando párrafos
        const paragraphs = plainText.split(/\n\s*\n/);
        const totalChars = plainText.length;
        let splitPoint = Math.floor(totalChars * 0.55);
        
        // Encontrar un punto de corte natural (entre párrafos)
        let cutIndex = 0;
        let charCount = 0;
        for (let i = 0; i < paragraphs.length; i++) {
          const pLength = paragraphs[i].length;
          if (charCount + pLength >= splitPoint) {
            cutIndex = i;
            break;
          }
          charCount += pLength + 2;
        }
        
        // Dividir párrafos
        const firstParagraphs = paragraphs.slice(0, cutIndex + 1);
        const secondParagraphs = paragraphs.slice(cutIndex + 1);
        
        const firstText = firstParagraphs.length > 0 
          ? firstParagraphs.map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('')
          : "";
        
        const secondText = secondParagraphs.length > 0
          ? secondParagraphs.map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('')
          : "";
        
        card.innerHTML = `
          <div class="post-grid-container">
            <div class="post-content">
              <h3 class="post-title">${escapeHtml(post.title)}</h3>
              <span class="post-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</span>
              <div class="post-text">${firstText}</div>
            </div>
            <div class="post-image-wrapper">
              <img src="${post.image_url}" alt="${escapeHtml(post.title)}" class="post-image" loading="lazy">
            </div>
            <div class="post-text-bottom">
              <div class="post-text">${secondText}</div>
            </div>
          </div>
        `;
        
        const bottomDiv = card.querySelector('.post-text-bottom');
        if (bottomDiv && secondText) bottomDiv.style.display = 'block';
      } else {
        // Texto normal - todo a la izquierda
        card.innerHTML = `
          <div class="post-grid-container">
            <div class="post-content">
              <h3 class="post-title">${escapeHtml(post.title)}</h3>
              <span class="post-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</span>
              <div class="post-text">${formattedContent}</div>
            </div>
            <div class="post-image-wrapper">
              <img src="${post.image_url}" alt="${escapeHtml(post.title)}" class="post-image" loading="lazy">
            </div>
          </div>
        `;
      }
    } else {
      // Sin imagen
      card.innerHTML = `
        <div class="post-content" style="width: 100%;">
          <h3 class="post-title">${escapeHtml(post.title)}</h3>
          <span class="post-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</span>
          <div class="post-text">${formattedContent}</div>
        </div>
      `;
    }
    
    feedContainer.appendChild(card);
  }
}

// Función para escapar HTML y evitar XSS
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Inicializar
loadFeedPosts();