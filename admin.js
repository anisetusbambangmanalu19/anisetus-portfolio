const authStatus = document.getElementById("auth-status");
const githubLoginBtn = document.getElementById("github-login-btn");
const logoutBtn = document.getElementById("logout-btn");

const projectForm = document.getElementById("project-form");
const projectFormStatus = document.getElementById("project-form-status");
const adminProjectList = document.getElementById("admin-project-list");
const refreshProjectsBtn = document.getElementById("refresh-projects-btn");
const resetFormBtn = document.getElementById("reset-form-btn");

const settingsForm = document.getElementById("settings-form");
const settingsStatus = document.getElementById("settings-form-status");
const loadSettingsBtn = document.getElementById("load-settings-btn");

const adminLastUpdated = document.getElementById("admin-last-updated");
const ADMIN_EMAILS = ["anisetus@gmail.com", "anisetusm@gmail.com"];
let currentSession = null;

const client = hasConfig()
  ? window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey)
  : null;

function hasConfig() {
  return Boolean(window.SUPABASE_CONFIG?.url && window.SUPABASE_CONFIG?.anonKey);
}

function nowLabel() {
  return new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setProjectStatus(message, isError = false) {
  projectFormStatus.textContent = message;
  projectFormStatus.style.color = isError ? "#ff9b9b" : "";
}

function setSettingsStatus(message, isError = false) {
  settingsStatus.textContent = message;
  settingsStatus.style.color = isError ? "#ff9b9b" : "";
}

function getSessionEmail(session) {
  return (session?.user?.email || "").trim().toLowerCase();
}

function isAdminSession(session) {
  return ADMIN_EMAILS.includes(getSessionEmail(session));
}

function setAdminControlsEnabled(enabled) {
  const projectFields = projectForm.querySelectorAll("input, textarea, button");
  projectFields.forEach((field) => {
    if (field.id !== "project-id") {
      field.disabled = !enabled;
    }
  });

  const settingsFields = settingsForm.querySelectorAll("input, textarea, button");
  settingsFields.forEach((field) => {
    field.disabled = !enabled;
  });

  refreshProjectsBtn.disabled = !enabled;
  loadSettingsBtn.disabled = !enabled;
}

function setAuthStatus(session) {
  currentSession = session;

  if (!session) {
    authStatus.textContent = "Belum login";
    logoutBtn.disabled = true;
    setAdminControlsEnabled(false);
    return;
  }

  const email = session.user.email;
  if (!isAdminSession(session)) {
    authStatus.textContent = `Login sebagai ${email}, tetapi akun ini tidak punya akses admin.`;
    logoutBtn.disabled = false;
    setAdminControlsEnabled(false);
    return;
  }

  authStatus.textContent = `Login sebagai ${email}`;
  logoutBtn.disabled = false;
  setAdminControlsEnabled(true);
}

function clearAuthHashFromUrl() {
  const hash = window.location.hash || "";
  if (!hash) {
    return;
  }

  if (hash.includes("access_token") || hash.includes("refresh_token") || hash.includes("provider_token")) {
    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }
}

function resetProjectForm() {
  projectForm.reset();
  document.getElementById("project-id").value = "";
  document.getElementById("project-order").value = 0;
  document.getElementById("project-published").checked = true;
}

function fillSettingsForm(settings) {
  document.getElementById("settings-hero-eyebrow").value = settings?.hero_eyebrow || "";
  document.getElementById("settings-hero-name").value = settings?.hero_name || "";
  document.getElementById("settings-hero-bio").value = settings?.hero_bio || "";
  document.getElementById("settings-focus-title").value = settings?.focus_title || "";
  document.getElementById("settings-focus-description").value = settings?.focus_description || "";
  document.getElementById("settings-about-text").value = settings?.about_text || "";
  document.getElementById("settings-profile-image").value = "";
}

function ensureConfigured() {
  if (client) {
    return true;
  }

  authStatus.textContent = "Supabase belum dikonfigurasi. Isi file supabase-config.js";
  setProjectStatus("Isi supabase-config.js dulu agar admin bisa dipakai.", true);
  setSettingsStatus("Isi supabase-config.js dulu agar admin bisa dipakai.", true);
  return false;
}

function ensureAdminAccess() {
  if (isAdminSession(currentSession)) {
    return true;
  }

  setProjectStatus("Akses ditolak. Hanya akun admin yang diizinkan mengelola proyek.", true);
  setSettingsStatus("Akses ditolak. Hanya akun admin yang diizinkan mengelola konten.", true);
  return false;
}

async function uploadImage(file, folder = "covers") {
  const extension = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await client.storage
    .from("project-images")
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = client.storage.from("project-images").getPublicUrl(path);
  return data.publicUrl;
}

async function loadSiteSettings() {
  if (!ensureConfigured() || !ensureAdminAccess()) {
    return;
  }

  try {
    setSettingsStatus("Memuat pengaturan profil...");

    const { data, error } = await client
      .from("site_settings")
      .select("id, hero_eyebrow, hero_name, hero_bio, focus_title, focus_description, about_text, profile_image_url")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    fillSettingsForm(data || {});
    setSettingsStatus("Pengaturan profil berhasil dimuat.");
  } catch (error) {
    setSettingsStatus(`Gagal memuat pengaturan: ${error.message}`, true);
  }
}

async function saveSiteSettings(event) {
  event.preventDefault();

  if (!ensureConfigured() || !ensureAdminAccess()) {
    return;
  }

  try {
    setSettingsStatus("Menyimpan pengaturan profil...");

    const profileFile = document.getElementById("settings-profile-image").files[0];
    const existingSettings = await client
      .from("site_settings")
      .select("profile_image_url")
      .eq("id", 1)
      .maybeSingle();

    const payload = {
      id: 1,
      hero_eyebrow: document.getElementById("settings-hero-eyebrow").value.trim(),
      hero_name: document.getElementById("settings-hero-name").value.trim(),
      hero_bio: document.getElementById("settings-hero-bio").value.trim(),
      focus_title: document.getElementById("settings-focus-title").value.trim(),
      focus_description: document.getElementById("settings-focus-description").value.trim(),
      about_text: document.getElementById("settings-about-text").value.trim()
    };

    if (profileFile) {
      setSettingsStatus("Menyimpan teks profil... upload foto berjalan setelahnya.");
    }

    if (existingSettings.data?.profile_image_url && !profileFile) {
      payload.profile_image_url = existingSettings.data.profile_image_url;
    }

    const { error } = await client.from("site_settings").upsert(payload, { onConflict: "id" });

    if (error) {
      throw error;
    }

    if (profileFile) {
      try {
        const uploadedUrl = await uploadImage(profileFile, "profile");
        const { error: imageUpdateError } = await client
          .from("site_settings")
          .update({ profile_image_url: uploadedUrl })
          .eq("id", 1);

        if (imageUpdateError) {
          throw imageUpdateError;
        }
      } catch (imageError) {
        setSettingsStatus(`Teks tersimpan, tapi upload foto gagal: ${imageError.message}`, true);
        document.getElementById("settings-profile-image").value = "";
        return;
      }

      document.getElementById("settings-profile-image").value = "";
    }

    setSettingsStatus("Pengaturan profil berhasil disimpan.");
  } catch (error) {
    setSettingsStatus(`Gagal menyimpan pengaturan: ${error.message}`, true);
  }
}

async function createOrUpdateProject(event) {
  event.preventDefault();

  if (!ensureConfigured() || !ensureAdminAccess()) {
    return;
  }

  try {
    setProjectStatus("Menyimpan proyek...");

    const projectId = document.getElementById("project-id").value;
    const title = document.getElementById("project-title").value.trim();
    const summary = document.getElementById("project-summary").value.trim();
    const techStack = document.getElementById("project-tech").value.trim();
    const repoUrl = document.getElementById("project-repo").value.trim();
    const demoUrl = document.getElementById("project-demo").value.trim();
    const sortOrder = Number(document.getElementById("project-order").value || 0);
    const isPublished = document.getElementById("project-published").checked;
    const coverFile = document.getElementById("project-cover").files[0];
    const galleryFiles = Array.from(document.getElementById("project-gallery").files || []);

    let coverUrl = null;
    if (coverFile) {
      coverUrl = await uploadImage(coverFile, "covers");
    }

    const payload = {
      title,
      summary,
      tech_stack: techStack,
      repo_url: repoUrl || null,
      demo_url: demoUrl || null,
      is_published: isPublished,
      sort_order: sortOrder
    };

    if (coverUrl) {
      payload.cover_image_url = coverUrl;
    }

    let targetProjectId = projectId;

    if (projectId) {
      const { error } = await client.from("projects").update(payload).eq("id", projectId);
      if (error) {
        throw error;
      }
    } else {
      const { data, error } = await client
        .from("projects")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      targetProjectId = data.id;
    }

    if (galleryFiles.length && targetProjectId) {
      const rows = [];
      for (let index = 0; index < galleryFiles.length; index += 1) {
        const url = await uploadImage(galleryFiles[index], "gallery");
        rows.push({
          project_id: targetProjectId,
          image_url: url,
          caption: "",
          sort_order: index
        });
      }

      const { error: galleryError } = await client.from("project_images").insert(rows);
      if (galleryError) {
        throw galleryError;
      }
    }

    setProjectStatus("Proyek berhasil disimpan.");
    resetProjectForm();
    await renderAdminProjects();
  } catch (error) {
    setProjectStatus(`Gagal menyimpan proyek: ${error.message}`, true);
  }
}

async function deleteProject(projectId) {
  if (!ensureConfigured() || !ensureAdminAccess()) {
    return;
  }

  const confirmed = window.confirm("Hapus proyek ini? Tindakan ini tidak bisa dibatalkan.");
  if (!confirmed) {
    return;
  }

  try {
    const { error } = await client.from("projects").delete().eq("id", projectId);
    if (error) {
      throw error;
    }

    setProjectStatus("Proyek berhasil dihapus.");
    await renderAdminProjects();
  } catch (error) {
    setProjectStatus(`Gagal menghapus proyek: ${error.message}`, true);
  }
}

async function deleteProjectImage(imageId) {
  if (!ensureConfigured() || !ensureAdminAccess()) {
    return;
  }

  const confirmed = window.confirm("Hapus gambar ini dari galeri proyek?");
  if (!confirmed) {
    return;
  }

  try {
    const { error } = await client.from("project_images").delete().eq("id", imageId);
    if (error) {
      throw error;
    }

    setProjectStatus("Gambar galeri berhasil dihapus.");
    await renderAdminProjects();
  } catch (error) {
    setProjectStatus(`Gagal menghapus gambar: ${error.message}`, true);
  }
}

function fillProjectForm(project) {
  document.getElementById("project-id").value = project.id;
  document.getElementById("project-title").value = project.title || "";
  document.getElementById("project-summary").value = project.summary || "";
  document.getElementById("project-tech").value = project.tech_stack || "";
  document.getElementById("project-repo").value = project.repo_url || "";
  document.getElementById("project-demo").value = project.demo_url || "";
  document.getElementById("project-order").value = project.sort_order || 0;
  document.getElementById("project-published").checked = Boolean(project.is_published);

  setProjectStatus("Mode edit aktif. Kamu bisa ubah deskripsi, link, cover, atau tambah foto galeri.");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderProjectGallery(images) {
  if (!images?.length) {
    return '<p class="mono">Belum ada foto galeri.</p>';
  }

  const sorted = [...images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return `
    <div class="admin-gallery-grid">
      ${sorted
        .map(
          (image) => `
            <div class="admin-gallery-item">
              <img src="${escapeHtml(image.image_url)}" alt="Project gallery" class="admin-gallery-thumb" loading="lazy" />
              <button class="btn btn-ghost admin-gallery-delete" data-action="delete-image" data-image-id="${image.id}">Hapus Gambar</button>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

async function renderAdminProjects() {
  if (!ensureConfigured()) {
    adminProjectList.innerHTML = "";
    return;
  }

  if (!isAdminSession(currentSession)) {
    adminProjectList.innerHTML = '<p class="mono">Login dengan akun admin untuk melihat dan mengelola daftar proyek.</p>';
    return;
  }

  adminProjectList.innerHTML = '<p class="mono">Memuat daftar proyek...</p>';

  try {
    const { data, error } = await client
      .from("projects")
      .select(
        "id, title, summary, tech_stack, repo_url, demo_url, cover_image_url, is_published, sort_order, updated_at, project_images(id, image_url, sort_order)"
      )
      .order("sort_order", { ascending: true })
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    if (!data?.length) {
      adminProjectList.innerHTML = '<p class="mono">Belum ada proyek. Tambahkan proyek pertama kamu.</p>';
      return;
    }

    adminProjectList.innerHTML = "";

    data.forEach((project) => {
      const card = document.createElement("article");
      card.className = "admin-project-card";

      const galleryCount = project.project_images?.length || 0;
      const publishedLabel = project.is_published ? "Published" : "Draft";
      const repoLink = project.repo_url
        ? `<a class="project-action" href="${escapeHtml(project.repo_url)}" target="_blank" rel="noreferrer noopener">GitHub</a>`
        : "";
      const demoLink = project.demo_url
        ? `<a class="project-action" href="${escapeHtml(project.demo_url)}" target="_blank" rel="noreferrer noopener">Demo</a>`
        : "";

      const coverHtml = project.cover_image_url
        ? `<img src="${escapeHtml(project.cover_image_url)}" alt="Cover ${escapeHtml(project.title)}" class="admin-project-cover" loading="lazy" />`
        : '<div class="admin-project-cover admin-project-cover-placeholder">No Cover</div>';

      const galleryHtml = renderProjectGallery(project.project_images || []);

      card.innerHTML = `
        <div class="admin-project-top">
          ${coverHtml}
          <div>
            <p class="mono">${publishedLabel} • Order ${project.sort_order}</p>
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.summary || "")}</p>
            <p class="mono">${galleryCount} foto galeri</p>
            <div class="project-actions">${repoLink}${demoLink}</div>
          </div>
        </div>
        ${galleryHtml}
        <div class="admin-project-actions">
          <button class="btn btn-ghost" data-action="edit" data-id="${project.id}">Edit</button>
          <button class="btn btn-ghost" data-action="delete" data-id="${project.id}">Hapus</button>
        </div>
      `;

      card.querySelector('[data-action="edit"]').addEventListener("click", () => fillProjectForm(project));
      card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteProject(project.id));

      card.querySelectorAll('[data-action="delete-image"]').forEach((button) => {
        button.addEventListener("click", () => deleteProjectImage(button.dataset.imageId));
      });

      adminProjectList.appendChild(card);
    });
  } catch (error) {
    adminProjectList.innerHTML = `<p class="mono">Gagal memuat proyek: ${escapeHtml(error.message)}</p>`;
  }
}

async function signIn() {
  if (!ensureConfigured()) {
    return;
  }

  const redirectTo = new URL("admin.html", window.location.href).toString();
  const { error } = await client.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo
    }
  });

  if (error) {
    authStatus.textContent = `Login gagal: ${error.message}`;
  }
}

async function signOut() {
  if (!ensureConfigured()) {
    return;
  }

  const { error } = await client.auth.signOut();
  if (error) {
    authStatus.textContent = `Gagal logout: ${error.message}`;
    return;
  }

  setAuthStatus(null);
  authStatus.textContent = "Berhasil logout.";
}

async function bootstrap() {
  adminLastUpdated.textContent = `Updated ${nowLabel()}`;
  setAdminControlsEnabled(false);
  clearAuthHashFromUrl();

  if (!hasConfig()) {
    authStatus.textContent = "Isi supabase-config.js terlebih dahulu.";
    setProjectStatus("Supabase belum aktif. Jalankan setup lalu isi URL + anon key.", true);
    setSettingsStatus("Supabase belum aktif. Jalankan setup lalu isi URL + anon key.", true);
    return;
  }

  const { data } = await client.auth.getSession();
  setAuthStatus(data.session);

  if (isAdminSession(data.session)) {
    await Promise.all([loadSiteSettings(), renderAdminProjects()]);
  }

  client.auth.onAuthStateChange(async (_event, session) => {
    setAuthStatus(session);

    if (isAdminSession(session)) {
      await Promise.all([loadSiteSettings(), renderAdminProjects()]);
      return;
    }

    adminProjectList.innerHTML = '<p class="mono">Login dengan akun admin untuk melihat dan mengelola daftar proyek.</p>';
  });
}

githubLoginBtn.addEventListener("click", signIn);
logoutBtn.addEventListener("click", signOut);
projectForm.addEventListener("submit", createOrUpdateProject);
refreshProjectsBtn.addEventListener("click", renderAdminProjects);
resetFormBtn.addEventListener("click", () => {
  resetProjectForm();
  setProjectStatus("Form proyek direset.");
});
settingsForm.addEventListener("submit", saveSiteSettings);
loadSettingsBtn.addEventListener("click", loadSiteSettings);

bootstrap();
