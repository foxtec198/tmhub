export function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return `${parts[0][0]}${parts.length > 1 ? parts.at(-1)[0] : ""}`.toUpperCase();
}

export function storeProfile(profile) {
  if (profile.nome != null) localStorage.setItem("display_name", profile.nome);
  if (profile.email != null) localStorage.setItem("email", profile.email);
  if (profile.foto_perfil) localStorage.setItem("profile_photo", profile.foto_perfil);
  else localStorage.removeItem("profile_photo");
  if (profile.tema === "dark" || profile.tema === "light") {
    localStorage.setItem("theme", profile.tema);
    document.documentElement.dataset.theme = profile.tema;
  }
  window.dispatchEvent(new CustomEvent("tmhub:profile", { detail: profile }));
}
