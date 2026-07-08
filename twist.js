/* ==================================================================
   관점전환 — 김유진의 맥북에서 열어본 슬랙
   상단엔 플레이어의 이름. 대화는 그대로인데, 이번엔 유진의 시점.
   ================================================================== */
const load = (k)=>{ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };
const save = (k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };

const playerFull = load("storylab_player")?.full || "이용자";
const playerName = load("storylab_player")?.short || "이용";
const PROFILE_MAP = { "이주은":"assets/profiles/jueun.png", "박가연":"assets/profiles/gayeon.png", "임새람":"assets/profiles/saeram.png", "김유진":"assets/profiles/yujin.png" };
const YUJIN_IMG = "assets/profiles/yujin.png";
const chatHistory = load("storylab_chatlog") || [];

const GHOSTS = ["보고있어.","보여?","계속 찾고있어","따라가도 돼?","옆에 앉아서 보고있어?","이쪽을 보고 있어","그만 이제 그만 보고싶어"];
/* 글리치: 일부 글자를 깨뜨려 온전히 못 읽게 */
function glitchText(t){
  const junk="▓▒░#%&?ㅢㅲㅬ";
  return [...t].map(c=> (c!==" " && Math.random()<0.34) ? junk[Math.floor(Math.random()*junk.length)] : c).join("");
}

/* 시계 */
function tickMac(){
  const d=new Date(); const days=["일","월","화","수","목","금","토"];
  document.getElementById("macClock").textContent =
    `${d.getMonth()+1}월 ${d.getDate()}일 (${days[d.getDay()]}) ${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}`;
}
setInterval(tickMac,1000); tickMac();

/* 헤더/사이드바 = 플레이어 이름 (반전 핵심) */
document.getElementById("dmName").textContent = playerFull;
document.getElementById("headName").textContent = playerFull;
const hav = document.getElementById("headAv");
if(PROFILE_MAP[playerFull]) hav.style.background=`url(${PROFILE_MAP[playerFull]}) center/cover`;
else { hav.style.background="#7f77dd"; }

/* 독백 */
const mono=document.getElementById("mono"), monoTxt=mono.querySelector(".mtxt");
let monoQ=[], monoCb=null;
function say(lines, cb){ monoQ=Array.isArray(lines)?[...lines]:[lines]; monoCb=cb||null; nextMono(); }
function nextMono(){
  const t=monoQ.shift();
  if(t===undefined){ mono.style.display="none"; const cb=monoCb; monoCb=null; if(cb)cb(); return; }
  monoTxt.textContent=t; mono.style.display="block";
}
mono.addEventListener("click", nextMono);

/* 로그 렌더 (유진 시점) */
const log=document.getElementById("log");
let lastWho=null, blankIdx=0;
function addGroupLine(m){
  const isYujin = m.who==="yujin";
  const name = isYujin ? "김유진 (스스라 인턴)" : playerFull;
  let group;
  if(lastWho!==m.who || m.imgFail){
    group=document.createElement("div"); group.className="msg-group";
    const av=document.createElement("div"); av.className="avatar";
    if(isYujin) av.style.backgroundImage=`url(${YUJIN_IMG})`;
    else if(PROFILE_MAP[playerFull]) av.style.backgroundImage=`url(${PROFILE_MAP[playerFull]})`;
    else { av.style.background="#7f77dd"; av.textContent=playerName; }
    const body=document.createElement("div"); body.className="mbody"; body.style.minWidth=0; body.style.flex=1;
    body.innerHTML=`<div><span class="mname">${name}</span><span class="mtime">${m.time||""}</span></div>`;
    group.appendChild(av); group.appendChild(body);
    log.appendChild(group);
  } else group=log.lastElementChild;
  lastWho = m.imgFail? null : m.who;
  const body=group.querySelector(".mbody");
  const line=document.createElement("div");

  if(m.blank){
    // 공개된 빈 메시지 — 존재의 대사 (글리치로 온전히 읽을 수 없음)
    line.className="mline revealed";
    const ghost = GHOSTS[blankIdx] || "";
    blankIdx++;
    line.innerHTML = `<span class="glitch-partial">${glitchText(ghost)}</span><span class="edited">(편집됨)</span><span class="resend">재발송 하시겠습니까?</span>`;
  } else if(m.imgFail){
    // 이제는 로딩되는 사진 (공사중 스토리랩)
    line.className="mline";
    line.innerHTML=`<div class="img-loaded"><img src="assets/textures/photo3_open_window.jpg"></div>`;
  } else {
    line.className="mline";
    line.textContent=m.text;
  }
  body.appendChild(line);
}

async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function run(){
  save("storylab_progress",{stage:"twist", t:Date.now()});
  nvlog("twist_start", {});

  // 진입 독백
  await new Promise(res=> say([
    "슬랙이… 이번엔 열린다.",
  ], res));

  // 로그 렌더
  chatHistory.forEach(addGroupLine);
  log.scrollTop = 0;

  // 천천히 자동 스크롤하며 읽는 느낌
  await sleep(600);
  const target=log.scrollHeight;
  const step=()=>new Promise(r=>{
    const iv=setInterval(()=>{
      log.scrollTop += 6;
      if(log.scrollTop+log.clientHeight >= log.scrollHeight-4){ clearInterval(iv); r(); }
    },16);
  });
  await step();

  await sleep(900);
  await new Promise(res=> say([
    "…상단에 내 이름이 있다.",
    "이건 유진님의 화면이다. 유진님이 보던, 나와의 대화.",
    "그날 안 보였던 사진이… 지금은 보인다.",
    "빈 칸이었던 메시지들도.",
  ], res));

  // 실시간 수신: "보고있어?"
  await sleep(1400);
  const typing=document.getElementById("typing");
  typing.textContent = `${playerFull}이(가) 작성 중…`;
  await sleep(2600);
  typing.textContent="";
  const m={who:"player", text:"보고있어?", time:(d=>`${d.getHours()<12?"오전":"오후"} ${((d.getHours()+11)%12)+1}:${String(d.getMinutes()).padStart(2,"0")}`)(new Date())};
  lastWho=null;
  addGroupLine(m);
  // 방금 온 메시지를 존재 스타일로 물들이기
  const lastLine=log.querySelector(".msg-group:last-child .mline:last-child");
  lastLine.classList.add("revealed");
  log.scrollTop=log.scrollHeight;

  await sleep(1600);
  await new Promise(res=> say([
    "지금, 방금 왔다.",
    "…내가 보고 있는데.",
  ], res));

  document.getElementById("closeLid").style.display="block";
}
document.getElementById("closeLid").addEventListener("click", ()=>{
  save("storylab_progress",{stage:"scene3d", t:Date.now()});
  nvlog("scene3d_start", {});
  const f=document.getElementById("fade");
  f.style.opacity=1;
  setTimeout(()=>{ location.href="scene3d.html"; }, 1500);
});

run();
