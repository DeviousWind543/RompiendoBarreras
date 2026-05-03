// CREAR POST
async function createPost() {
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const file = document.getElementById("image").files[0];

  let image_url = "";

  if (file) {
    const fileName = Date.now() + "-" + file.name;

    const { error } = await supabaseClient.storage
      .from("images")
      .upload(fileName, file);

    if (error) {
      alert("Error subiendo imagen: " + error.message);
      return;
    }

    const { data } = supabaseClient.storage
      .from("images")
      .getPublicUrl(fileName);

    image_url = data.publicUrl;
  }

  const { error } = await supabaseClient
    .from("posts")
    .insert([{ title, content, image_url }]);

  if (error) {
    alert("Error al guardar: " + error.message);
  } else {
    alert("Publicado correctamente");
    location.reload();
  }
}

// CARGAR POSTS
async function loadPosts() {
  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const feed = document.getElementById("feed");
  if (!feed) return;

  feed.innerHTML = "";

  data.forEach(post => {
    const div = document.createElement("div");
    div.className = "post";

    div.innerHTML = `
      <h3>${post.title}</h3>
      <small>${new Date(post.created_at).toLocaleString()}</small>
      ${post.image_url ? `<img src="${post.image_url}">` : ""}
      <p>${post.content}</p>
    `;

    feed.appendChild(div);
  });
}

// INICIAR
loadPosts();