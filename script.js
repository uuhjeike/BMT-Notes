/* =========================================================
   BMT NOTES — script.js
   ========================================================= */

const SUBJECTS = [
  { name: "বাংলা-১", tab: "gold", icon: "📖" },
  { name: "ইংরেজি-১", tab: "teal", icon: "✍️" },
  { name: "কম্পিউটার অফিস অ্যাপ্লিকেশন-১", tab: "rust", icon: "💻" },
  { name: "ব্যবসায় গণিত ও পরিসংখ্যান", tab: "gold", icon: "🧮" },
  { name: "হিসাববিজ্ঞান নীতি ও প্রয়োগ-১", tab: "teal", icon: "💰" },
  { name: "অর্থনীতি ও বাণিজ্যিক ভূগোল", tab: "rust", icon: "🌍" },
  { name: "ব্যবসায় সংগঠন ও ব্যবস্থাপনা-১", tab: "gold", icon: "🏢" },
  { name: "মার্কেটিং নীতি ও প্রয়োগ-১", tab: "teal", icon: "📣" },
  { name: "ডিজিটাল টেকনোলজি ইন বিজনেস-১", tab: "rust", icon: "🖥️" },
  { name: "হিউম্যান রিসোর্স ম্যানেজমেন্ট-১", tab: "gold", icon: "👥" },
];

SUBJECTS.forEach((s, i) => {
  s.file = `https://raw.githubusercontent.com/uuhjeike/BMT-Notes/main/${encodeURIComponent(s.name)}.txt`;
  s.domId = `count-${i}`;
});

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

// Normal link to direct/raw/embed format converter helper
function smartUrlConverter(url) {
  let cleanUrl = url.trim();
  // Google Drive conversion
  if (cleanUrl.includes("drive.google.com")) {
    let match = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }
  // GitHub blob to raw conversion
  if (cleanUrl.includes("github.com") && cleanUrl.includes("/blob/")) {
    return cleanUrl.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
  }
  return cleanUrl;
}

function parsePosts(raw){
  const rawLines = raw.split("\n");
  const blocks = []; let current = [];
  for(const line of rawLines){
    if(line.trim() === "-"){ blocks.push(current); current = []; }
    else current.push(line);
  }
  blocks.push(current);

  const posts = [];
  for(const block of blocks){
    const lines = block.map(l=>l.trim()).filter(l=>l.length && !l.startsWith("#"));
    if(!lines.length) continue;
    const post = { date:"", text:[], images:[], videos:[], audios:[], links:[] };
    for(const line of lines){
      const m = line.match(/^(DATE|IMG|VID|AUD|DRIVE|LINK)\s*:\s*(.+)$/i);
      if(!m){ post.text.push(line); continue; }
      const tag = m[1].toUpperCase(); const val = smartUrlConverter(m[2].trim());
      if(tag === "DATE") post.date = val;
      else if(tag === "IMG") post.images.push(val);
      else if(tag === "VID") post.videos.push(val);
      else if(tag === "AUD") post.audios.push(val);
      else {
        const lm = val.match(/^(\S+)\s*\((.+)\)\s*$/);
        post.links.push({ url: lm?smartUrlConverter(lm[1]):val, label: lm?lm[2]:(tag==="DRIVE"?"ড্রাইভ ফাইল":"লিংক"), kind: tag.toLowerCase() });
      }
    }
    post.text = post.text.join("\n");
    if(post.text || post.images.length || post.videos.length || post.audios.length || post.links.length) posts.push(post);
  }
  return posts;
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
function bnToEnDigits(s){ return s.replace(/[০-৯]/g, d => BN_DIGITS.indexOf(d)); }
const BN_MONTHS = {"জানুয়ারি":0,"ফেব্রুয়ারি":1,"মার্চ":2,"এপ্রিল":3,"মে":4,"জুন":5,"জুলাই":6,"আগস্ট":7,"সেপ্টেম্বর":8,"অক্টোবর":9,"নভেম্বর":10,"ডিসেম্বর":11};

function parseFlexibleDate(d){
  if(!d) return null;
  const s = bnToEnDigits(d.trim());
  const iso = Date.parse(s);
  if(!isNaN(iso)) return iso;
  const m = s.match(/(\d{1,2})\s+([^\d\s]+)\s+(\d{4})/);
  if(m){
    const day = +m[1], year = +m[3];
    const monthName = Object.keys(BN_MONTHS).find(k => d.includes(k));
    const month = monthName ? BN_MONTHS[monthName] : null;
    if(month != null) return new Date(year, month, day).getTime();
  }
  return null;
}

function sortPostsLatestFirst(posts){
  return posts
    .map((post,i) => ({ post, i, ts: parseFlexibleDate(post.date) }))
    .sort((a,b) => {
      if(a.ts != null && b.ts != null) return b.ts - s => b.ts - a.ts; // latest first
      return b.ts - a.ts;
    })
    .map(x => x.post);
}

function mediaThumbHtml(kind, src, index){
  if(kind === "img") return `<div class="media-thumb" data-kind="img" data-src="${escapeHtml(src)}"><img src="${escapeHtml(src)}" loading="eager" fetchpriority="high" alt="ছবি ${index+1}"></div>`;
  return `<div class="media-thumb" data-kind="vid" data-src="${escapeHtml(src)}"><video src="${escapeHtml(src)}" muted playsinline preload="metadata"></video><div class="media-play">▶</div></div>`;
}

function renderPost(post){
  const media = [...post.images.map(src=>({kind:"img",src})), ...post.videos.map(src=>({kind:"vid",src}))];
  const mediaHtml = media.length ? `<div class="post-media ${media.length===1?'single':''}">${media.map((m,i)=>mediaThumbHtml(m.kind,m.src,i)).join("")}</div>` : "";
  const audioHtml = post.audios.map(src=>`<div class="post-audio" data-src="${escapeHtml(src)}"><span class="post-audio-icon">▶</span><span class="post-audio-label">অডিও শুনতে ক্লিক করো</span></div>`).join("");
  const linksHtml = post.links.length ? `<div class="post-links">${post.links.map(l=>`<a class="post-link" href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${l.kind==="drive"?"📁":"🔗"} ${escapeHtml(l.label)}</a>`).join("")}</div>` : "";
  return `<article class="post">
    ${post.date ? `<p class="post-date">${escapeHtml(post.date)}</p>` : ""}
    ${post.text ? `<p class="post-text">${escapeHtml(post.text)}</p>` : ""}
    ${mediaHtml}${audioHtml}${linksHtml}
  </article>`;
}

const shelf = document.getElementById("shelf");
const postCache = {};

SUBJECTS.forEach(s => {
  const card = document.createElement("div");
  card.className = "tile";
  card.style.setProperty("--tab", `var(--${s.tab})`);
  card.innerHTML = `
    <div class="tile-icon">${s.icon}</div>
    <div class="tile-name">${s.name}</div>
    <div class="tile-meta"><span>খুলতে ক্লিক করো</span><span class="tile-count" id="${s.domId}"></span></div>
  `;
  card.addEventListener("click", () => openPanel(s));
  shelf.appendChild(card);
});

const panelOverlay = document.getElementById("panelOverlay");
const panelTitle = document.getElementById("panelTitle");
const panelKicker = document.getElementById("panelKicker");
const panelPosts = document.getElementById("panelPosts");
const panelEmpty = document.getElementById("panelEmpty");
const panelBody = document.getElementById("panelBody");

async function openPanel(subject){
  panelKicker.textContent = "বিষয়";
  panelTitle.textContent = subject.name;
  panelPosts.innerHTML = "লোড হচ্ছে…";
  panelEmpty.hidden = true;
  panelOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
  panelBody.scrollTop = 0;

  try{
    let posts = postCache[subject.name];
    if(!posts){
      const res = await fetch(subject.file, {cache:"no-store"});
      if(!res.ok) throw new Error("not found");
      posts = parsePosts(await res.text());
      postCache[subject.name] = posts;
      const countEl = document.getElementById(subject.domId);
      if(countEl) countEl.textContent = posts.length ? `${posts.length} পোস্ট` : "";
    }
    if(!posts.length){ panelPosts.innerHTML = ""; panelEmpty.hidden = false; return; }
    panelPosts.innerHTML = posts.map(renderPost).join("");
    bindMediaHandlers(panelPosts);
  }catch(err){
    panelPosts.innerHTML = "";
    panelEmpty.hidden = false;
    panelEmpty.textContent = "ফাইলটি লোড করতে সমস্যা হচ্ছে।";
  }
}

function closePanel(){ 
  panelOverlay.classList.remove("open"); 
  document.body.style.overflow = ""; 
  panelPosts.innerHTML = ""; // Clear old content to keep memory free and website fast
}

document.getElementById("panelClose").addEventListener("click", closePanel);
panelOverlay.addEventListener("click", e => { if(e.target === panelOverlay) closePanel(); });

const lightbox = document.getElementById("lightbox");
const lightboxStage = document.getElementById("lightboxStage");

function openLightbox(kind, src){
  if(kind === "img") lightboxStage.innerHTML = `<img src="${escapeHtml(src)}" alt=""><a class="lightbox-original" href="${escapeHtml(src)}" target="_blank" rel="noopener">মূল ছবি নতুন ট্যাবে দেখো</a>`;
  else if(kind === "vid") lightboxStage.innerHTML = `<video src="${escapeHtml(src)}" controls autoplay playsinline></video>`;
  else if(kind === "aud") lightboxStage.innerHTML = `<audio src="${escapeHtml(src)}" controls autoplay></audio>`;
  lightbox.classList.add("open");
}

function closeLightbox(){ lightbox.classList.remove("open"); lightboxStage.innerHTML = ""; }
document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
lightbox.addEventListener("click", e => { if(e.target === lightbox) closeLightbox(); });

document.addEventListener("keydown", e => {
  if(e.key !== "Escape") return;
  if(lightbox.classList.contains("open")) closeLightbox();
  else if(panelOverlay.classList.contains("open")) closePanel();
});

function bindMediaHandlers(scope){
  scope.querySelectorAll(".media-thumb").forEach(el => el.addEventListener("click", () => openLightbox(el.dataset.kind, el.dataset.src)));
  scope.querySelectorAll(".post-audio").forEach(el => el.addEventListener("click", () => openLightbox("aud", el.dataset.src)));
}
