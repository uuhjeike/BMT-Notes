/* =========================================================
   BMT NOTES — script.js
   ========================================================= */

const SUBJECTS = [
  { name: "বাংলা-১", tab: "gold", icon: "📖", file: "বাংলা-১.txt" },
  { name: "ইংরেজি-১", tab: "teal", icon: "✍️️", file: "ইংরেজি-১.txt" },
  { name: "কম্পিউটার অফিস অ্যাপ্লিকেশন-১", tab: "rust", icon: "💻", file: "কম্পিউটার অফিস অ্যাপ্লিকেশন-১.txt" },
  { name: "ব্যবসায় গণিত ও পরিসংখ্যান", tab: "gold", icon: "🧮", file: "ব্যবসায় গণিত ও পরিসংখ্যান.txt" },
  { name: "হিসাববিজ্ঞান নীতি ও প্রয়োগ-১", tab: "teal", icon: "💰", file: "হিসাববিজ্ঞান নীতি ও প্রয়োগ-১.txt" },
  { name: "অর্থনীতি ও বাণিজ্যিক ভূগোল", tab: "rust", icon: "🌍", file: "অর্থনীতি ও বাণিজ্যিক ভূগোল.txt" },
  { name: "ব্যবসায় সংগঠন ও ব্যবস্থাপনা-১", tab: "gold", icon: "🏢", file: "ব্যবসায় সংগঠন ও ব্যবস্থাপনা-১.txt" },
  { name: "মার্কেটিং নীতি ও প্রয়োগ-১", tab: "teal", icon: "📣", file: "মার্কেটিং নীতি ও প্রয়োগ-১.txt" },
  { name: "ডিজিটাল টেকনোলজি ইন বিজনেস-১", tab: "rust", icon: "🖥️", file: "ডিজিটাল টেকনোলজি ইন বিজনেস-১.txt" },
  { name: "হিউম্যান রিসোর্স ম্যানেজমেন্ট-১", tab: "gold", icon: "👥", file: "হিউম্যান রিসোর্স ম্যানেজমেন্ট-১.txt" }
];

SUBJECTS.forEach((s, i) => {
  s.url = `https://raw.githubusercontent.com/uuhjeike/BMT-Notes/main/${encodeURIComponent(s.file)}`;
  s.domId = `count-${i}`;
});

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function smartUrlConverter(url) {
  let cleanUrl = url.trim();
  if (cleanUrl.includes("drive.google.com")) {
    let match = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }
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

function mediaThumbHtml(kind, src, index){
  if(kind === "img") return `<div class="media-thumb" data-kind="img" data-src="${escapeHtml(src)}"><img src="${escapeHtml(src)}" loading="eager" alt="ছবি ${index+1}"></div>`;
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
      const res = await fetch(subject.url, {cache:"no-store"});
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
    panelEmpty.textContent = "দুঃখিত, এই ফাইলের লিংকটি পাওয়া যায়নি। গিটহাবে ফাইলটি সঠিক নামে আছে কিনা চেক করুন।";
  }
}

function closePanel(){ 
  panelOverlay.classList.remove("open"); 
  document.body.style.overflow = ""; 
  panelPosts.innerHTML = "";
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
