/* ISOPURE Influencer Database — data layer
   Reads Valeria's Google Sheet, which is laid out as one tab per city
   (and sometimes per gender). Columns vary across tabs, so we use
   header-keyword matching + gender-inference-from-archetype as fallbacks. */

window.ARCHETYPES = {
  F: [
    { key: "health-expert",     name: "The Health Expert",          who: "Nutricionista, ginecóloga, experta en piel u hormonas. Calmada, creíble, science-backed.", role: ["Confianza", "Educación", "Permiso para consumir proteína / colágeno"] },
    { key: "it-girl",           name: "The It Girl",                 who: "Fashion & culture girl. Invitada a Fashion Week, cenas de marca, eventos wellness. Lifestyle curado, effortless cool.", role: ["Aspiración", "Validación de tendencia", "Hace que la proteína sea lifestyle-approved"] },
    { key: "mindful-trainer",   name: "The Mindful Trainer",         who: "Instructora de Yoga, Pilates, Barre, Sound Healing. Soft strength, grounded, trusted.", role: ["Uso diario real", "Ritual & consistencia", "Confianza de comunidad"] },
    { key: "adventure-girl",    name: "The Adventure Girl",          who: "Surfer, hiker, traveler. Activa, funcional, outdoors-driven. Stylish without trying.", role: ["Versatilidad", "Performance en el mundo real", "Lifestyle más allá del gym"] },
    { key: "high-end-wellness", name: "The High-End Wellness Woman", who: "45+, high-income. Invierte en longevidad, anti-aging, prevención.", role: ["Posicionamiento premium", "Narrativa de longevidad", "Eleva el valor percibido"] },
    { key: "cooker",            name: "The Cooker",                  who: "Cocina casi a diario. Prioriza comidas limpias y simples. No es chef, pero muy intencional con la comida.", role: ["\"What I eat matters\"", "Salud por consistencia", "Balance sobre restricción"] },
  ],
  M: [
    { key: "health-expert",   name: "The Health Expert",    who: "Nutriólogo licenciado, médico deportivo, especialista en hormonas o longevidad con credenciales reconocidas y comunicación conservadora.", role: ["Establece confianza y legitimidad científica", "Educa sin sensacionalismo", "Da permiso para usar proteína, colágeno y suplementos con confianza"] },
    { key: "it-boy",          name: "The It Boy",           who: "Figura masculina de moda y cultura con acceso a fashion weeks, cenas de marca y eventos de la industria. Taste-maker, no amplificador.", role: ["Señala aspiración y relevancia", "Valida el lifestyle culturalmente, no médicamente", "Hace que la nutrición funcional se sienta socialmente aprobada y moderna"] },
    { key: "mindful-trainer", name: "The Mindful Trainer",  who: "Coach de movilidad, yoga, breathwork o functional training enfocado en sostenibilidad, disciplina y performance a largo plazo.", role: ["Demuestra uso real y consistente", "Ancla el producto en ritual y hábito", "Construye confianza a través de práctica diaria, no claims"] },
    { key: "adventure-girl",  name: "The Adventure Guy",    who: "Surfer, trail runner, climber o viajero outdoor cuya identidad se construye alrededor del movimiento funcional y la resistencia.", role: ["Prueba performance fuera del gym", "Posiciona el producto como versátil y práctico", "Conecta la nutrición con utilidad de lifestyle, no estética"] },
    { key: "cooker",          name: "The Cooker",           who: "Hombre que cocina casi a diario, valora comida limpia y simple, y ve la nutrición como una decisión diaria más que un performance.", role: ["Refuerza consistencia y disciplina", "Comunica \"lo que como importa\" sin extremismo", "Encuadra la proteína como parte de una vida balanceada e intencional"] },
  ],
};

// Sample data shown only when nothing loads from the sheet.
window.SAMPLE_INFLUENCERS = [
  { name: "María Fernanda Castillo", username: "marifercastillo", followers: 248000, gender: "F", archetype: "it-girl", city: "Ciudad de México" },
  { name: "Andrea Quintero", username: "andiquintero", followers: 89500, gender: "F", archetype: "mindful-trainer", city: "Monterrey" },
  { name: "Diego Solís", username: "diegosolisfit", followers: 184000, gender: "M", archetype: "mindful-trainer", city: "Monterrey" },
  { name: "Dr. Emiliano Vargas", username: "dremilianovargas", followers: 267000, gender: "M", archetype: "health-expert", city: "Ciudad de México" },
];

window.SHEET_ID = "1U7R_zpod9qxrBWEra49_SUY5uPYhVUgJxHNxzpLfugI";

// ---------- helpers ----------
window.normKey = function(s) {
  return (s || "").toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
};

window.parseCSV = function(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i+1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ',') { row.push(field); field = ""; }
      else if (c === '\r') { /* skip */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
      else { field += c; }
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c && c.trim()));
};

// Match archetype text → key. Order matters: longer/more-specific tokens first.
window.matchArchetype = function(text) {
  const n = window.normKey(text);
  if (!n) return null;
  if (n.includes("highend") || n.includes("highend") || n.includes("wellnesswoman") || n.includes("longevity") || (n.includes("wellness") && (n.includes("woman") || n.includes("45")))) return "high-end-wellness";
  if (n.includes("itgirl")) return "it-girl";
  if (n.includes("itboy") || n.includes("itguy")) return "it-boy";
  if (n.includes("adventuregirl") || n.includes("adventurewoman")) return "adventure-girl";
  if (n.includes("adventureboy") || n.includes("adventureguy") || n.includes("adventureman")) return "adventure-guy";
  if (n.includes("adventure") || n.includes("surfer") || n.includes("trail") || n.includes("outdoor") || n.includes("hiker") || n.includes("explorer")) return "adventure-girl"; // we'll re-gender later
  if (n.includes("mindful") || n.includes("trainer") || n.includes("yoga") || n.includes("pilates") || n.includes("barre") || n.includes("instructor")) return "mindful-trainer";
  if (n.includes("healthexpert") || n.includes("health") || n.includes("nutriol") || n.includes("nutricion") || n.includes("medic") || n.includes("doctor")) return "health-expert";
  if (n.includes("cook") || n.includes("kitchen") || n.includes("chef") || n.includes("cocin") || n.includes("coffee") /* typo in sheet */) return "cooker";
  if (n.includes("wellness") || n.includes("highend")) return "high-end-wellness";
  return null;
};

// Resolve gender from explicit value OR from archetype+context.
window.matchGender = function(text) {
  const n = window.normKey(text);
  if (!n) return null;
  if (n === "f" || n.startsWith("muje") || n.startsWith("woman") || n.startsWith("female") || n.startsWith("girl")) return "F";
  if (n === "m" || n.startsWith("hom") || n.startsWith("man") || n.startsWith("male") || n.startsWith("boy") || n.startsWith("guy")) return "M";
  return null;
};

window.inferGenderFromArchetype = function(archetypeRaw, archetypeKey) {
  const n = window.normKey(archetypeRaw);
  if (n.includes("girl") || n.includes("woman") || n.includes("mujer")) return "F";
  if (n.includes("boy") || n.includes("guy") || n.includes("hombre") || n.includes("man") && !n.includes("woman")) return "M";
  if (archetypeKey === "it-girl" || archetypeKey === "adventure-girl" || archetypeKey === "high-end-wellness") return "F";
  if (archetypeKey === "it-boy" || archetypeKey === "adventure-guy") return "M";
  return null;
};

// Reduce variant keys to canonical archetype + gender pair.
window.normalizeArchetype = function(archetypeKey, gender) {
  if (!archetypeKey) return null;
  if (archetypeKey === "adventure-guy") return { key: "adventure-girl", g: "M" };
  if (archetypeKey === "it-girl") return { key: "it-girl", g: "F" };
  if (archetypeKey === "it-boy") return { key: "it-boy", g: "M" };
  if (archetypeKey === "high-end-wellness") return { key: "high-end-wellness", g: "F" };
  return { key: archetypeKey, g: gender };
};

// Parse "37.000", "1,200,000", "1.2M", "37k", "37000" → integer
window.parseFollowers = function(raw) {
  if (raw == null) return 0;
  let s = raw.toString().trim().toLowerCase().replace(/\s/g, "");
  if (!s) return 0;
  // Suffix shortcuts
  if (/[km]$/.test(s)) {
    const mult = s.endsWith("m") ? 1_000_000 : 1_000;
    const n = parseFloat(s.replace(/[km]$/, "").replace(/,/g, ""));
    return isNaN(n) ? 0 : Math.round(n * mult);
  }
  // Spanish/European thousand separators: "37.000", "1.234.567"
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    return parseInt(s.replace(/\./g, ""), 10) || 0;
  }
  // US thousand separators: "37,000", "1,234,567"
  if (/^\d{1,3}(,\d{3})+$/.test(s)) {
    return parseInt(s.replace(/,/g, ""), 10) || 0;
  }
  // Decimal w/ comma "37,5" (rare for followers) → treat as thousands fallback if >0
  s = s.replace(/,/g, ".");
  const num = parseFloat(s);
  return isNaN(num) ? 0 : Math.round(num);
};

window.cleanUsername = function(raw) {
  if (!raw) return "";
  let s = raw.toString().trim();
  const m = s.match(/instagram\.com\/([^\/?#]+)/i);
  if (m) s = m[1];
  return s.replace(/^@/, "").replace(/[\/\?].*$/, "");
};

// Infer city from a tab name.
window.matchCity = function(text) {
  const n = window.normKey(text);
  if (n.includes("cdmx") || n.includes("ciudaddemexico") || n.includes("mexicocity") || n.includes("mexicodf") || n === "mexico" || n.includes("cdm")) return "Ciudad de México";
  if (n.includes("monterrey") || n.includes("mty") || n.includes("nl") && !n.includes("nlgdl")) return "Monterrey";
  if (n.includes("guadalajara") || n.includes("gdl") || n.includes("jalisco")) return "Guadalajara";
  return null;
};

// Gender hint from a tab name (e.g. "MTY Mujeres", "Hombres GDL").
window.matchGenderFromTab = function(text) {
  const n = window.normKey(text);
  if (n.includes("mujer") || n.includes("femenin") || n.includes("women") || n.includes("female")) return "F";
  if (n.includes("hombre") || n.includes("masculin") || n.includes("men") || n.includes("male")) return "M";
  return null;
};

// ---------- tab discovery ----------
// Try a series of strategies to enumerate every tab in the workbook.
window.discoverTabs = async function(sheetId) {
  // Strategy 1 — published-html (works if "Publish to web" is on).
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/pubhtml`, { cache: "no-store" });
    if (res.ok) {
      const html = await res.text();
      // Look for sheet-button id="sheet-button-NNNN" and following text
      const tabs = [];
      const re = /sheet-button-(\d+)[^>]*>\s*<a[^>]*>([^<]+)<\/a>/g;
      let m;
      while ((m = re.exec(html)) !== null) {
        tabs.push({ gid: m[1], name: m[2].trim() });
      }
      if (tabs.length > 0) return { tabs, via: "pubhtml" };
    }
  } catch (_) {}

  // Strategy 2 — gviz HTML view sometimes leaks tab names.
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/htmlview`, { cache: "no-store" });
    if (res.ok) {
      const html = await res.text();
      const tabs = [];
      // Look for "gid": "NNNN", and adjacent "name": "..."
      const re = /\{"name":"([^"]+)"[^}]*"id":(\d+)/g;
      let m;
      while ((m = re.exec(html)) !== null) {
        tabs.push({ gid: m[2], name: m[1] });
      }
      if (tabs.length > 0) return { tabs, via: "htmlview" };
    }
  } catch (_) {}

  // Strategy 3 — fallback to default sheet only.
  return { tabs: [{ gid: "0", name: "" }], via: "default-only" };
};

// Fetch one tab as CSV.
window.fetchTabCSV = async function(sheetId, gid) {
  const urls = [
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const t = await res.text();
      if (t.trim().startsWith("<")) continue;
      return t;
    } catch (_) {}
  }
  return null;
};

// Parse one tab's CSV into rows.
window.parseTab = function(csvText, tabName, diag) {
  const rows = window.parseCSV(csvText);
  if (rows.length < 2) return [];

  // Find a "header row" — the row containing the most matching keywords.
  // Some sheets have a banner row above (merged title), so the real headers
  // could be on row 1 OR row 2.
  const headerHints = ["nombre", "name", "user", "instagram", "follow", "url", "tipo", "arqu", "ciudad", "genero", "isotopo"];
  let bestRow = 0, bestScore = 0;
  const maxScan = Math.min(5, rows.length);
  for (let r = 0; r < maxScan; r++) {
    const score = rows[r].reduce((s, c) => s + (headerHints.some(h => window.normKey(c).includes(h)) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; bestRow = r; }
  }
  if (bestScore === 0) return [];

  // Look at the rows ABOVE the header for any banner with a city/gender hint
  // (e.g. "Base de Datos - CDMX")
  let bannerCity = null, bannerGender = null;
  for (let r = 0; r < bestRow; r++) {
    for (const cell of rows[r]) {
      bannerCity = bannerCity || window.matchCity(cell);
      bannerGender = bannerGender || window.matchGenderFromTab(cell);
    }
  }

  const rawHeaders = rows[bestRow];
  const headers = rawHeaders.map(h => window.normKey(h));

  const findCol = (...needles) => {
    for (let i = 0; i < headers.length; i++) {
      if (needles.some(n => headers[i].includes(n))) return i;
    }
    return -1;
  };
  const idx = {
    name: findCol("nombre", "name"),
    username: findCol("usuario", "username", "user", "handle", "instagram", "ig"),
    url: findCol("url", "link", "enlace", "perfil"),
    followers: findCol("follower", "seguidores", "seguidor"),
    gender: findCol("genero", "gender", "sexo"),
    archetype: findCol("arquetipo", "isotopo", "isotop", "segmentacion", "segmento", "archetype", "categoria", "tipo"),
    city: findCol("ciudad", "city", "ubicacion", "location"),
    photo: findCol("foto", "photo", "imagen", "image", "picture", "pic", "avatar"),
  };

  // Tab-level hints — tab name first, banner row as fallback
  const tabCity = window.matchCity(tabName) || bannerCity;
  const tabGender = window.matchGenderFromTab(tabName) || bannerGender;

  const out = [];
  const skipped = [];
  for (let r = bestRow + 1; r < rows.length; r++) {
    const row = rows[r];
    const get = i => (i >= 0 && i < row.length) ? row[i] : "";
    const name = get(idx.name).trim();
    const usernameRaw = get(idx.username).trim() || get(idx.url).trim();
    if (!name && !usernameRaw) { skipped.push({ row: r + 1, reason: "Sin nombre ni @usuario" }); continue; }

    const username = window.cleanUsername(usernameRaw || name);
    const archetypeRaw = get(idx.archetype);
    const archetypeKeyRaw = window.matchArchetype(archetypeRaw);
    if (!archetypeKeyRaw) {
      skipped.push({ row: r + 1, name, reason: `Arquetipo no reconocido: "${archetypeRaw}"` });
      continue;
    }

    // Determine gender: explicit column → archetype → tab name
    let gender = window.matchGender(get(idx.gender))
              || window.inferGenderFromArchetype(archetypeRaw, archetypeKeyRaw)
              || tabGender;
    if (!gender) {
      skipped.push({ row: r + 1, name, reason: "No se pudo inferir género (sin columna, arquetipo neutro, pestaña sin pista)" });
      continue;
    }

    const norm = window.normalizeArchetype(archetypeKeyRaw, gender);
    const archetypeKey = norm.key;
    if (norm.g) gender = norm.g; // adventure-guy → M

    // City: explicit column (normalized) → tab name → blank
    const cityRaw = get(idx.city).trim();
    const cityNormalized = window.matchCity(cityRaw);
    const city = cityNormalized || cityRaw || tabCity || "";

    out.push({
      name: name || "@" + username,
      username,
      url: get(idx.url).trim() || `https://instagram.com/${username}`,
      followers: window.parseFollowers(get(idx.followers)),
      gender,
      archetype: archetypeKey,
      city,
      photo: get(idx.photo).trim(),
      _tab: tabName,
    });
  }

  if (diag) {
    diag.tabsRead.push({
      name: tabName || "(pestaña principal)",
      headerRow: bestRow + 1,
      headers: rawHeaders,
      columnMap: Object.fromEntries(
        Object.entries(idx).map(([k, v]) => [k, v >= 0 ? `col ${v} → "${rawHeaders[v]}"` : "NO ENCONTRADA"])
      ),
      cityHint: tabCity || "—",
      genderHint: tabGender || "—",
      rowsTotal: rows.length - bestRow - 1,
      rowsKept: out.length,
      skipped,
    });
  }

  return out;
};

// ---------- main entry ----------
window.fetchSheet = async function() {
  const diag = {
    sheetId: window.SHEET_ID,
    discoveryMethod: "",
    tabs: [],
    tabsRead: [],
    totalKept: 0,
    error: null,
    rawText: "",
  };

  const { tabs, via } = await window.discoverTabs(window.SHEET_ID);
  diag.discoveryMethod = via;
  diag.tabs = tabs;

  if (!tabs.length) {
    diag.error = "No se encontraron pestañas en el workbook.";
    window.LAST_DIAG = diag;
    throw new Error(diag.error);
  }

  const all = [];
  let firstRaw = "";
  for (const t of tabs) {
    const csv = await window.fetchTabCSV(window.SHEET_ID, t.gid);
    if (!csv) {
      diag.tabsRead.push({ name: t.name || "(sin nombre)", error: "No se pudo leer (¿privada?)" });
      continue;
    }
    if (!firstRaw) firstRaw = csv;
    const rows = window.parseTab(csv, t.name, diag);
    all.push(...rows);
  }
  diag.totalKept = all.length;
  diag.rawText = firstRaw.slice(0, 4000);

  // De-duplicate by username (last wins)
  const seen = new Map();
  for (const r of all) {
    const key = (r.username || "").toLowerCase();
    if (!key) continue;
    seen.set(key, r);
  }
  const final = [...seen.values()];

  if (final.length === 0) {
    diag.error = "Se conectó pero no se pudo extraer ninguna fila válida. Revisa el detalle por pestaña.";
    window.LAST_DIAG = diag;
    throw new Error(diag.error);
  }

  window.LAST_DIAG = diag;
  return final;
};
