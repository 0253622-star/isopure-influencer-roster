// ISOPURE Influencer Database — main React app
const { useState, useEffect, useMemo, useCallback } = React;

const ISOPURE_LOGO = "https://tukuz.com/wp-content/uploads/2020/02/isopure-logo-vector.png";
const CITIES = ["Monterrey", "Guadalajara", "Ciudad de México"];

function formatFollowers(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "") + "K";
  return n.toString();
}

function initials(name) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function archetypeLabel(gender, key) {
  const list = window.ARCHETYPES[gender] || [];
  return (list.find(a => a.key === key) || {}).name || key;
}

// ---------- COMPONENTS ----------

function Header({ totalCount, womenCount, menCount, lastUpdated, onRefresh, refreshing, onDiagnose }) {
  return (
    <header className="top">
      <div className="top-inner">
        <div className="brand">
          <img src={ISOPURE_LOGO} alt="ISOPURE" onError={(e) => { e.target.style.display = 'none'; }} />
          <div className="brand-divider" />
          <div className="brand-meta">
            <span className="top-label">Influencer Database</span>
            <span className="top-title">Valeria Martínez · Influencer Management</span>
          </div>
        </div>
        <div className="top-right">
          <div className="top-stat">
            <span className="n">{totalCount}</span>
            <span className="l">Perfiles</span>
          </div>
          <div className="top-stat">
            <span className="n" style={{ color: "var(--women-deep)" }}>{womenCount}</span>
            <span className="l">Mujeres</span>
          </div>
          <div className="top-stat">
            <span className="n" style={{ color: "var(--men)" }}>{menCount}</span>
            <span className="l">Hombres</span>
          </div>
          <button className="btn-secondary" onClick={onDiagnose} title="Ver diagnóstico de la conexión con Google Sheets">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            Diagnóstico
          </button>
          <button className={`refresh ${refreshing ? "spinning" : ""}`} onClick={onRefresh} title="Sincronizar con Google Sheets">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            {refreshing ? "Sincronizando…" : "Actualizar"}
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="crumbs">
        <span>ISOPURE</span>
        <span className="dot" />
        <span>Mercado MX</span>
        <span className="dot" />
        <span>Presentación de talento</span>
      </div>
      <h1>
        Influencer roster para <span className="accent-women">ISOPURE</span> México
      </h1>
      <p>
        Base de talento segmentada por arquetipo de comunicación. Cada perfil está categorizado según su rol
        estratégico para construir confianza, aspiración y consistencia en la marca.
      </p>
      <div className="preview-note">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <span>
          Si los links a Instagram no abren desde esta vista previa, usa el botón <b>↗</b> arriba a la derecha
          para abrir la página en una pestaña nueva — ahí funcionan normal. También puedes usar el botón de
          copiar (📋) en cada tarjeta.
        </span>
      </div>
    </section>
  );
}

function GenderToggle({ selected, onChange, counts }) {
  const items = [
    { key: "all", label: "Todos", n: counts.all, dotColor: "var(--ink)" },
    { key: "F", label: "Mujeres", n: counts.F, dotColor: "var(--women)" },
    { key: "M", label: "Hombres", n: counts.M, dotColor: "var(--men)" },
  ];
  return (
    <div className="gender-toggle">
      {items.map(it => (
        <button
          key={it.key}
          className="gender-pill"
          data-key={it.key}
          data-active={selected === it.key}
          onClick={() => onChange(it.key)}
        >
          <span className="dot" style={{ background: selected === it.key ? "rgba(255,255,255,0.6)" : it.dotColor }} />
          <span>{it.label}</span>
          <span className="count">{it.n}</span>
        </button>
      ))}
    </div>
  );
}

function ArchetypeTabs({ gender, selected, onSelect, countsByArchetype }) {
  // Determine which archetype lists to show based on gender selection
  const tabs = useMemo(() => {
    if (gender === "F") return window.ARCHETYPES.F.map(a => ({ ...a, gender: "F" }));
    if (gender === "M") return window.ARCHETYPES.M.map(a => ({ ...a, gender: "M" }));
    // "all" — merge by key but keep distinct gendered tabs
    const merged = [];
    window.ARCHETYPES.F.forEach(a => merged.push({ ...a, gender: "F", key: "F:" + a.key }));
    window.ARCHETYPES.M.forEach(a => merged.push({ ...a, gender: "M", key: "M:" + a.key }));
    return merged;
  }, [gender]);

  return (
    <div className="tabs-bar">
      <div className="tabs">
        <button
          className="tab"
          data-active={selected === "all"}
          onClick={() => onSelect("all")}
        >
          Todos los arquetipos
          <span className="tab-count">{countsByArchetype.__total || 0}</span>
        </button>
        {tabs.map(t => {
          const countKey = t.key; // matches countsByArchetype keying logic in App
          const count = countsByArchetype[countKey] || 0;
          return (
            <button
              key={t.key}
              className="tab"
              data-active={selected === t.key}
              data-gender={t.gender}
              onClick={() => onSelect(t.key)}
            >
              {t.name}
              <span className="tab-count">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ArchetypeIntro({ gender, archetypeKey }) {
  if (archetypeKey === "all") return null;
  // Parse key — may be "F:health-expert" form when "all" gender
  let g = gender, k = archetypeKey;
  if (archetypeKey.includes(":")) {
    [g, k] = archetypeKey.split(":");
  }
  const arche = (window.ARCHETYPES[g] || []).find(a => a.key === k);
  if (!arche) return null;
  return (
    <section className="arche-intro">
      <div className="arche-badge" data-gender={g}>
        {arche.name.replace(/^The /i, "").split(" ").map(w => w[0]).join("").slice(0, 2)}
      </div>
      <div className="arche-text">
        <div className="who">{g === "F" ? "Arquetipo · Mujeres" : "Arquetipo · Hombres"}</div>
        <h2>{arche.name}</h2>
        <p>{arche.who}</p>
        <div className="role-line">
          {arche.role.map((r, i) => <span key={i}>{r}</span>)}
        </div>
      </div>
    </section>
  );
}

function CityFilter({ selected, onChange, counts }) {
  const cities = ["Ciudad de México", "Monterrey", "Guadalajara"];
  return (
    <div className="city-filter">
      <div className="city-filter-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        Ciudad
      </div>
      <div className="city-pills">
        <button
          className="city-pill"
          data-active={selected === "all"}
          onClick={() => onChange("all")}
        >
          Todas
          <span className="city-count">{counts.all || 0}</span>
        </button>
        {cities.map(c => {
          const n = counts[c] || 0;
          return (
            <button
              key={c}
              className="city-pill"
              data-active={selected === c}
              data-empty={n === 0}
              onClick={() => onChange(c)}
            >
              {c}
              <span className="city-count">{n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Toolbar({ search, onSearch, visibleCount, totalCount }) {
  return (
    <div className="toolbar">
      <div className="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por nombre o @usuario…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="toolbar-meta">
        Mostrando <b>{visibleCount}</b> de <b>{totalCount}</b>
      </div>
    </div>
  );
}

// localStorage helpers for influencer photos
const PHOTO_STORE_KEY = "isopure_influencer_photos_v1";
function getStoredPhotos() {
  try { return JSON.parse(localStorage.getItem(PHOTO_STORE_KEY) || "{}"); }
  catch (_) { return {}; }
}
function setStoredPhoto(username, dataUrl) {
  const store = getStoredPhotos();
  if (dataUrl) store[username] = dataUrl;
  else delete store[username];
  try {
    localStorage.setItem(PHOTO_STORE_KEY, JSON.stringify(store));
    return true;
  } catch (e) {
    // QuotaExceededError — likely too many big images
    alert("No hay espacio para guardar más fotos en el navegador. Reduce el tamaño de las imágenes o borra alguna.");
    return false;
  }
}

// Resize an image File to a max dimension, return JPEG data URL.
async function fileToCompressedDataUrl(file, maxDim = 480, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("No es una imagen válida"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function InfluencerCard({ inf, storedPhoto, onPhotoChange }) {
  const archeName = archetypeLabel(inf.gender, inf.archetype);
  const url = inf.url || `https://instagram.com/${inf.username}`;
  const [dragOver, setDragOver] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef(null);

  // Photo source: sheet URL takes priority, then stored upload
  const photoSrc = (inf.photo && inf.photo.startsWith("http")) ? inf.photo : storedPhoto;

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      if (setStoredPhoto(inf.username, dataUrl)) {
        onPhotoChange(inf.username, dataUrl);
      }
    } catch (e) {
      alert("Error al cargar la imagen: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const [copied, setCopied] = React.useState(false);
  const copyLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }).catch(() => {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  // Try to break out of the preview iframe to open Instagram.
  // We post a message to the host preview asking for a new tab — if that
  // doesn't fly, we synthesize a real anchor click which most browsers will
  // honor as a user-initiated popup.
  const openInstagram = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Method 1: window.open with noopener (best chance from sandbox)
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (w) return;
    // Method 2: synthesized anchor click (sometimes succeeds when window.open fails)
    const a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
    document.body.appendChild(a); a.click(); a.remove();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const removePhoto = (e) => {
    e.stopPropagation();
    if (confirm("¿Quitar la foto de " + inf.name + "?")) {
      setStoredPhoto(inf.username, null);
      onPhotoChange(inf.username, null);
    }
  };

  const openFilePicker = (e) => {
    e.stopPropagation();
    fileInputRef.current && fileInputRef.current.click();
  };

  return (
    <div className="card">
      <div
        className={`card-photo ${dragOver ? "drag-over" : ""} ${photoSrc ? "has-photo" : ""}`}
        data-gender={inf.gender}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={openFilePicker}
        title={photoSrc ? "Click para cambiar foto" : "Arrastra o click para añadir foto"}
      >
        {photoSrc ? (
          <img src={photoSrc} alt={inf.name} className="card-photo-img" />
        ) : (
          <span className="initials">{initials(inf.name)}</span>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
          onClick={(e) => e.stopPropagation()}
        />
        {uploading && <div className="upload-overlay"><div className="spinner-sm" /></div>}
        {dragOver && <div className="drop-overlay">Soltar para añadir foto</div>}
        {!photoSrc && !uploading && !dragOver && (
          <div className="photo-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <span>Arrastra una foto</span>
          </div>
        )}
        {photoSrc && storedPhoto && (
          <button className="photo-remove" onClick={removePhoto} title="Quitar foto">×</button>
        )}
        <span className="card-badge">{archeName}</span>
        <span className="card-followers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {formatFollowers(inf.followers)}
        </span>
      </div>
      <div className="card-body">
        <div className="card-name">{inf.name}</div>
        <a className="card-handle" href={url} target="_blank" rel="noopener noreferrer"
           onClick={(e) => e.stopPropagation()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
          @{inf.username}
        </a>
        <div className="card-meta">
          {inf.city && <span className="card-tag city">{inf.city}</span>}
          <span className="card-tag">{formatFollowers(inf.followers)} seguidores</span>
        </div>
        <div className="card-actions">
          <a className="card-cta" href={url} target="_blank" rel="noopener noreferrer"
             onClick={openInstagram}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            Ver en Instagram
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
              <path d="M7 17 17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </a>
          <button className={`card-copy ${copied ? "copied" : ""}`} onClick={copyLink} title="Copiar enlace">
            {copied ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ city, archetype, gender }) {
  return (
    <div className="state">
      <h3>Sin perfiles en esta vista</h3>
      <p>
        No hay influencers que coincidan con los filtros actuales
        {city !== "all" && <> en <b>{city}</b></>}
        {archetype !== "all" && <> para este arquetipo</>}.
      </p>
      <p>Prueba ajustar los filtros o agrega un perfil nuevo al Google Sheet y vuelve a sincronizar.</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="state">
      <div className="spinner" />
      <p>Sincronizando con Google Sheets…</p>
    </div>
  );
}

function SheetErrorBanner({ error, onRetry }) {
  return (
    <div className="state">
      <h3>No pude leer el Google Sheet</h3>
      <p>{error}</p>
      <p style={{ marginTop: 16 }}>
        <b>Para que se conecte en vivo:</b> abre tu sheet → <i>Compartir</i> → cambia el acceso a
        “Cualquier persona con el enlace · Lector”. Después da clic en <b>Actualizar</b>.
      </p>
      <p style={{ color: "var(--ink-3)", marginTop: 16 }}>
        Mientras tanto se muestran <b>datos de ejemplo</b> para que veas la estructura visual.
      </p>
    </div>
  );
}

function DiagnosticPanel({ diag, onClose }) {
  if (!diag) return null;
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${diag.sheetId}/edit`;
  const tabsRead = diag.tabsRead || [];
  return (
    <div className="diag-overlay" onClick={onClose}>
      <div className="diag" onClick={(e) => e.stopPropagation()}>
        <div className="diag-head">
          <h2>Diagnóstico de Google Sheets</h2>
          <button className="diag-close" onClick={onClose}>×</button>
        </div>
        <div className="diag-body">

          <div className="diag-stats">
            <div className="stat"><span className="n">{(diag.tabs || []).length}</span><span className="l">Pestañas</span></div>
            <div className="stat"><span className="n" style={{color: diag.totalKept > 0 ? "var(--men)" : "var(--ink-3)"}}>{diag.totalKept || 0}</span><span className="l">Perfiles cargados</span></div>
            <div className="stat"><span className="n" style={{color: "var(--ink-2)"}}>{tabsRead.reduce((s,t) => s + ((t.skipped||[]).length), 0)}</span><span className="l">Filas saltadas</span></div>
          </div>

          {diag.error && (
            <div className="diag-help">
              <b>Error:</b> {diag.error}
              <div style={{marginTop: 8}}>
                Si quieres que descubra <b>todas</b> las pestañas del workbook, ve a tu sheet → <b>Archivo → Compartir → Publicar en la web → Publicar</b> (esto es además del “Compartir con cualquier persona con el enlace”). Sin publicar, solo se lee la pestaña principal.
              </div>
            </div>
          )}

          <h3>Workbook</h3>
          <div className="diag-row">ID: {diag.sheetId} · <a href={sheetUrl} target="_blank" rel="noreferrer" style={{color: "var(--ink)"}}>abrir sheet</a></div>
          <div className="diag-row">Descubrimiento de pestañas: <b>{diag.discoveryMethod}</b></div>

          <h3>Pestañas detectadas ({(diag.tabs || []).length})</h3>
          {(diag.tabs || []).length === 0 ? (
            <div className="diag-row bad">Ninguna — el sheet no es accesible o está vacío.</div>
          ) : (
            (diag.tabs || []).map((t, i) => (
              <div key={i} className="diag-row">
                <b>{t.name || "(sin nombre)"}</b> · gid {t.gid}
              </div>
            ))
          )}

          <h3>Lectura por pestaña</h3>
          {tabsRead.length === 0 && <div className="diag-row bad">No se leyó ninguna pestaña.</div>}
          {tabsRead.map((t, i) => (
            <div key={i} style={{
              border: "1px solid var(--line)", borderRadius: 10, padding: 12,
              marginBottom: 10, background: "var(--bg)"
            }}>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8}}>
                <b style={{fontSize: 13}}>{t.name}</b>
                <span style={{fontSize: 12, color: "var(--ink-3)"}}>
                  {t.error
                    ? <span style={{color: "var(--women-deep)"}}>{t.error}</span>
                    : <>{t.rowsKept || 0} válidas / {t.rowsTotal || 0} totales</>}
                </span>
              </div>
              {!t.error && (
                <>
                  <div style={{fontSize: 11, color: "var(--ink-3)", marginBottom: 4}}>
                    Pista de ciudad: <b style={{color: "var(--ink)"}}>{t.cityHint}</b> ·
                    Pista de género: <b style={{color: "var(--ink)"}}>{t.genderHint}</b> ·
                    Encabezados en fila <b style={{color: "var(--ink)"}}>{t.headerRow}</b>
                  </div>
                  <div style={{fontSize: 11, color: "var(--ink-3)", marginTop: 6}}>Mapeo de columnas:</div>
                  {Object.entries(t.columnMap || {}).map(([k, v]) => (
                    <div key={k} className={`diag-row ${v === "NO ENCONTRADA" ? "bad" : "good"}`} style={{fontSize: 11, padding: "4px 8px"}}>
                      {k}: {v}
                    </div>
                  ))}
                  {(t.skipped || []).length > 0 && (
                    <details style={{marginTop: 8}}>
                      <summary style={{fontSize: 11, color: "var(--ink-3)", cursor: "pointer"}}>
                        {t.skipped.length} fila(s) saltada(s) — ver
                      </summary>
                      <div style={{marginTop: 6}}>
                        {t.skipped.slice(0, 15).map((s, j) => (
                          <div key={j} className="diag-row bad" style={{fontSize: 11, padding: "4px 8px"}}>
                            Fila {s.row}{s.name ? ` · ${s.name}` : ""} — {s.reason}
                          </div>
                        ))}
                        {t.skipped.length > 15 && <div className="diag-row" style={{fontSize: 11}}>… y {t.skipped.length - 15} más</div>}
                      </div>
                    </details>
                  )}
                </>
              )}
            </div>
          ))}

          <h3>Respuesta cruda (primera pestaña, primeros 4 KB)</h3>
          <div className="diag-raw">{diag.rawText || "(sin respuesta)"}</div>

          <div className="diag-help">
            <b>Cómo nombrar tus pestañas para que se detecten solas:</b><br />
            • Ciudad en el nombre: <i>"CDMX Mujeres"</i>, <i>"MTY Hombres"</i>, <i>"Guadalajara Mujeres"</i><br />
            • Género en el nombre: incluye <i>Mujeres</i> o <i>Hombres</i> (opcional si el arquetipo ya indica género, ej. "The It Girl" se asume mujer)<br />
            <br />
            <b>Valores aceptados:</b><br />
            • <b>Tipo de influencer</b>: The Health Expert, The It Girl / It Boy, The Mindful Trainer, The Adventure Girl / Guy, The High-End Wellness Woman, The Cooker<br />
            • <b>Followers</b>: acepta "37.000", "37,000", "37k", "1.2M" o "37000"
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="foot">
      <div>
        <h4>Estructura del Google Sheet</h4>
        <p>Para que la página lea tu base correctamente, usa estas columnas (los encabezados pueden variar):</p>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, marginTop: 10, color: "var(--ink)" }}>
          Nombre · Username · URL · Followers · Género · Arquetipo · Ciudad
        </p>
        <p style={{ marginTop: 10 }}>
          Valores de <b>Género</b>: <code>F</code> / <code>Mujer</code> · <code>M</code> / <code>Hombre</code>.<br />
          Valores de <b>Arquetipo</b>: usa el nombre exacto (ej. “The It Girl”, “The Mindful Trainer”).
        </p>
      </div>
      <div>
        <h4>Cómo actualizar</h4>
        <p>1. Agrega o edita filas en tu Google Sheet.</p>
        <p>2. Asegúrate que el sheet esté compartido con “Cualquiera con el enlace · Lector”.</p>
        <p>3. Da clic en <b>Actualizar</b> en el header (o recarga la página) para sincronizar.</p>
        <p style={{ marginTop: 14, color: "var(--ink-3)" }}>Diseño y curaduría · Valeria Martínez · 2026</p>
      </div>
    </footer>
  );
}

// ---------- MAIN APP ----------

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetError, setSheetError] = useState(null);
  const [usingSample, setUsingSample] = useState(false);

  const [gender, setGender] = useState("F"); // F | M | all
  const [showDiag, setShowDiag] = useState(false);
  const [diag, setDiag] = useState(null);
  const [photoMap, setPhotoMap] = useState(() => getStoredPhotos());

  const onPhotoChange = useCallback((username, dataUrl) => {
    setPhotoMap(prev => {
      const next = { ...prev };
      if (dataUrl) next[username] = dataUrl;
      else delete next[username];
      return next;
    });
  }, []);
  const [archetype, setArchetype] = useState("all");
  const [city, setCity] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("followers-desc");

  const loadData = useCallback(async () => {
    setLoading(true);
    setSheetError(null);
    try {
      const rows = await window.fetchSheet();
      setDiag(window.LAST_DIAG);
      if (rows.length === 0) {
        setData(window.SAMPLE_INFLUENCERS);
        setUsingSample(true);
        setSheetError("El sheet se conectó pero ninguna fila se reconoció. Abre el Diagnóstico para ver detalles.");
      } else {
        setData(rows);
        setUsingSample(false);
      }
    } catch (err) {
      setDiag(window.LAST_DIAG || { error: err.message, sheetId: window.SHEET_ID });
      setData(window.SAMPLE_INFLUENCERS);
      setUsingSample(true);
      setSheetError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Reset archetype when gender changes
  useEffect(() => { setArchetype("all"); }, [gender]);

  const countsByGender = useMemo(() => ({
    all: data.length,
    F: data.filter(d => d.gender === "F").length,
    M: data.filter(d => d.gender === "M").length,
  }), [data]);

  const countsByArchetype = useMemo(() => {
    const c = { __total: 0 };
    data.forEach(d => {
      if (gender !== "all" && d.gender !== gender) return;
      c.__total++;
      const key = gender === "all" ? `${d.gender}:${d.archetype}` : d.archetype;
      c[key] = (c[key] || 0) + 1;
    });
    return c;
  }, [data, gender]);

  const countsByCity = useMemo(() => {
    const c = { all: 0 };
    data.forEach(d => {
      // Reflect current gender + archetype scope so counts match what user'd see
      if (gender !== "all" && d.gender !== gender) return;
      if (archetype !== "all") {
        if (archetype.includes(":")) {
          const [g, k] = archetype.split(":");
          if (d.gender !== g || d.archetype !== k) return;
        } else if (d.archetype !== archetype) return;
      }
      c.all++;
      if (d.city) c[d.city] = (c[d.city] || 0) + 1;
    });
    return c;
  }, [data, gender, archetype]);

  const visible = useMemo(() => {
    let rows = data.slice();
    if (gender !== "all") rows = rows.filter(d => d.gender === gender);
    if (archetype !== "all") {
      if (archetype.includes(":")) {
        const [g, k] = archetype.split(":");
        rows = rows.filter(d => d.gender === g && d.archetype === k);
      } else {
        rows = rows.filter(d => d.archetype === archetype);
      }
    }
    if (city !== "all") rows = rows.filter(d => (d.city || "").trim() === city);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(d =>
        (d.name || "").toLowerCase().includes(q) ||
        (d.username || "").toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => {
      if (sortBy === "followers-desc") return (b.followers || 0) - (a.followers || 0);
      if (sortBy === "followers-asc") return (a.followers || 0) - (b.followers || 0);
      if (sortBy === "name-asc") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "name-desc") return (b.name || "").localeCompare(a.name || "");
      return 0;
    });
    return rows;
  }, [data, gender, archetype, city, search, sortBy]);

  return (
    <>
      <Header
        totalCount={countsByGender.all}
        womenCount={countsByGender.F}
        menCount={countsByGender.M}
        onRefresh={loadData}
        refreshing={loading}
        onDiagnose={() => setShowDiag(true)}
      />
      {showDiag && <DiagnosticPanel diag={diag} onClose={() => setShowDiag(false)} />}
      <Hero />
      <GenderToggle selected={gender} onChange={setGender} counts={countsByGender} />
      <ArchetypeTabs
        gender={gender}
        selected={archetype}
        onSelect={setArchetype}
        countsByArchetype={countsByArchetype}
      />
      <CityFilter selected={city} onChange={setCity} counts={countsByCity} />
      <Toolbar
        search={search} onSearch={setSearch}
        visibleCount={visible.length}
        totalCount={countsByArchetype.__total || 0}
      />
      {usingSample && sheetError && (
        <div className="state" style={{paddingTop: 40, paddingBottom: 20}}>
          <h3>No pude leer tu Google Sheet</h3>
          <p>{sheetError}</p>
          <p style={{marginTop: 16}}>
            <button className="btn-secondary" style={{display: "inline-flex", marginRight: 8}} onClick={() => setShowDiag(true)}>
              Ver diagnóstico
            </button>
            <button className="refresh" style={{display: "inline-flex"}} onClick={loadData}>Reintentar</button>
          </p>
          <p style={{color: "var(--ink-3)", marginTop: 14, fontSize: 13}}>
            Mientras tanto se muestran datos de ejemplo.
          </p>
        </div>
      )}
      <ArchetypeIntro gender={gender} archetypeKey={archetype} />
      {loading && data.length === 0 ? (
        <LoadingState />
      ) : visible.length === 0 ? (
        <EmptyState city={city} archetype={archetype} gender={gender} />
      ) : (
        <main className="grid">
          {visible.map((inf, i) => (
            <InfluencerCard
              key={`${inf.username}-${i}`}
              inf={inf}
              storedPhoto={photoMap[inf.username]}
              onPhotoChange={onPhotoChange}
            />
          ))}
        </main>
      )}
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
