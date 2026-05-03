async function loadFeedPosts() {
  const feedContainer = document.getElementById("feed");
  const loading = document.getElementById("loading");
  if (!feedContainer) return;
  
  loading.style.display = "block";
  
  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });
  
  loading.style.display = "none";
  
  if (error) {
    feedContainer.innerHTML = `<div class="error-message">Error al cargar publicaciones</div>`;
    console.error(error);
    return;
  }
  
  if (data.length === 0) {
    feedContainer.innerHTML = `<div class="info-message">No hay campañas aún. Vuelve pronto.</div>`;
    return;
  }
  
  feedContainer.innerHTML = "";
  data.forEach(post => {
    const card = document.createElement("article");
    card.className = "post-card";
    card.innerHTML = `
      ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" class="post-image">` : `<div class="post-image" style="background:#e2e8f0; display:flex; align-items:center; justify-content:center;">📸 Sin imagen</div>`}
      <div class="post-content">
        <h3 class="post-title">${escapeHtml(post.title)}</h3>
        <span class="post-date">${new Date(post.created_at).toLocaleDateString('es-ES')}</span>
        <p class="post-text">${escapeHtml(post.content)}</p>
      </div>
    `;
    feedContainer.appendChild(card);
  });
}

// helper para evitar XSS
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
    return c;
  });
}

loadFeedPosts();