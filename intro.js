/* ==================================================================
   노스텔지아 비스타 — 도입부
   아이폰 홈 → 오늘의 운세 → macOS 알림 → 슬랙 DM(김유진)
   ================================================================== */

/* ---------- 저장/상태 ---------- */
const SAVE_KEY  = "storylab_progress";
const NAME_KEY  = "storylab_player";
const LOG_KEY   = "storylab_chatlog";
const save  = (k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
const load  = (k)=>{ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };

const WHITELIST = ["임새람","이주은","박가연","김아량","황혜지","박해란","이나연","박다솜","김정민","김유진","김도연","육예은"];
const PROFILE_MAP = { "이주은":"assets/profiles/jueun.png", "박가연":"assets/profiles/gayeon.png", "임새람":"assets/profiles/saeram.png" };
const YUJIN_IMG = "assets/profiles/yujin.png";

let playerFull = load(NAME_KEY)?.full || null;   // 세 글자 전체
let playerName = load(NAME_KEY)?.short || null;  // 뒤 2글자

/* ---------- 인트로 독백 (홈 화면 진입 시) ---------- */
const introMono = document.getElementById("introMono");
const introMonoTxt = introMono.querySelector(".mtxt");
let introMonoQueue = [];
let introMonoCb = null;
function sayIntro(lines, cb){
  introMonoQueue = [...lines];
  introMonoCb = cb || null;
  nextIntroMono();
}
function nextIntroMono(){
  const t = introMonoQueue.shift();
  if(t===undefined){
    introMono.style.display="none";
    const cb = introMonoCb; introMonoCb = null;
    if(cb) cb();
    return;
  }
  introMonoTxt.textContent = t;
  introMono.style.display = "block";
}
introMono.addEventListener("click", nextIntroMono);
let introStarted = false;
function introBegin(){
  if(introStarted) return;
  introStarted = true;
  sayIntro([
    "유진님이 말한 운세 어플이 이거 맞나?",
    "오늘의 운세.",
    "눌러보자.",
  ]);
}

/* ---------- 게이트 ---------- */
const ua = navigator.userAgent;
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (navigator.maxTouchPoints>1 && innerWidth<900);
const isChrome = /Chrome\//.test(ua) && !/Edg\/|OPR\//.test(ua);
if(isMobile || !isChrome){
  document.getElementById("gateLayer").classList.add("on");
} else {
  document.getElementById("phoneLayer").classList.add("on");
  introBegin();
}
document.getElementById("forceEnter").addEventListener("click", ()=>{
  document.getElementById("gateLayer").classList.remove("on");
  document.getElementById("phoneLayer").classList.add("on");
  introBegin();
});

/* ---------- 실시간 시계 ---------- */
function fmtTime(d=new Date()){
  const h=d.getHours(), m=String(d.getMinutes()).padStart(2,"0");
  return `${h}:${m}`;
}
function fmtSlackTime(d=new Date()){
  const h=d.getHours(), m=String(d.getMinutes()).padStart(2,"0");
  return `${h<12?"오전":"오후"} ${((h+11)%12)+1}:${m}`;
}
setInterval(()=>{ document.getElementById("clock").textContent = fmtTime(); }, 1000);
document.getElementById("clock").textContent = fmtTime();

/* ---------- 앱 전환 ---------- */
const screens = { home:"homeScreen", fortune:"fortuneApp", notion:"notionApp" };
function showApp(id){
  document.querySelectorAll(".app-screen").forEach(s=>s.classList.remove("on"));
  document.getElementById(id).classList.add("on");
}
document.querySelectorAll(".app[data-app]").forEach(a=>{
  a.addEventListener("click", ()=>{
    const app = a.dataset.app;
    if(app==="fortune"){ showApp("fortuneApp"); renderFortune(); }
    else if(app==="notion"){ showApp("notionApp"); notionGag(); }
    else if(app==="slack"){ /* 폰 슬랙: 알림 뜬 후에만 의미. 알림 클릭과 동일 처리 */ if(notifStarted) enterSlack(); }
  });
});
document.querySelectorAll("[data-back]").forEach(b=> b.addEventListener("click", ()=> showApp("homeScreen")));

function notionGag(){
  const m=document.getElementById("notionMsg");
  m.style.opacity=0;
  setTimeout(()=>{ m.style.opacity=1; }, 700);
}

/* ---------- 오늘의 운세 ---------- */
const F_INTRO = "오하아사, 세계여신타로, 990원 사주해석, 지피티 음양오행, 타로만으로는 채워지지 않는 부분이 있다.\n그런 당신에게 추천하는 '오늘의 운세'.\n먼미래와 과거는 보지 못하지만, 소름끼치도록 정확한 오늘의 운세를 볼 수 있다... 당신의 이름 세 글자 만으로도.";
const F_MAIN  = "오늘은 예기치못한 손님을 맞이하게 됩니다. 공간을 운영하는 사람이라면 운영 준비에 힘 쓰세요.";
const F_YUJIN = "오늘은 꿈에 그리던 목표를 이루는 날 입니다. 궁금해하던 얼굴을 확인할 수 있습니다. 가급적 많은 동료들과 함께하세요. 이미 경험해본 것을 경험할 수 있습니다.";
const F_REJECT= "솔직해지지 못하거나 거짓말을 하면 즐거운 일을 놓치기 쉽습니다. 오늘만큼은 솔직해져 보세요. 특히 이름 세 글자를 제대로 말하지 못할 만큼 솔직해지지 못한다면 앞으로 나아가지 못할 겁니다. 혹시나 이름 세 글자를 모두 밝히는 것에 겁이 난다면 걱정마세요. 아무런 본 이야기는 모두 허구입니다.";
const F_AGAIN = "오늘은 대박이 터질 날입니다. 이왕이면 로또 당첨되는 게 좋겠네요. 좋은 하루 되세요!";
const F_LATER = [
  "누군가 자신의 운세를 궁금해할 하루입니다. 자신의 이름을 검색해봤는데 신기한 결과가 나왔다고 말할 수도 있습니다.",
  "오늘은 어고집밥에 가서 기깔한 한 끼를 할 운명입니다.",
  "너무 기찮다.;; 운세 쓰는 것도 힘드네요",
  "잘 아시겠지만 이 게임은 모두 허구입니다. 처음부터 끝까지 맞는 글자가 단 한 개도 없어요.",
];
let firstFortuneDone = !!playerName;

function renderFortune(){
  const box = document.getElementById("fortuneBody");
  box.innerHTML = `
    <div class="fortune-card"><div class="txt" style="font-size:12.5px; color:#8A6B47">${F_INTRO.replace(/\n/g,"<br>")}</div></div>
    <div class="fortune-card">
      <div class="cap">본명을 입력해주세요</div>
      <input class="f-input" id="fName" placeholder="" autocomplete="off">
      <button class="f-btn" id="fGo">운세 보기</button>
    </div>
    <div id="fResult"></div>`;
  document.getElementById("fGo").addEventListener("click", submitFortune);
  document.getElementById("fName").addEventListener("keydown", e=>{ if(e.key==="Enter") submitFortune(); });
}
function submitFortune(){
  const raw = document.getElementById("fName").value;
  const name = raw.replace(/\s+/g,"");   // 공백 전부 제거 (정규화)
  const res = document.getElementById("fResult");
  if(!name){ return; }

  if(!playerFull){
    // 최초 이름 등록 (화이트리스트 검사)
    if(WHITELIST.includes(name)){
      playerFull = name;
      playerName = name.slice(-2);
      save(NAME_KEY, {full:playerFull, short:playerName});
      firstFortuneDone = true;
      nvlog("game_start", {name: playerFull});
      const txt = (name==="김유진") ? F_YUJIN : F_MAIN;
      res.innerHTML = `<div class="fortune-card"><div class="cap">${playerName}님의 오늘</div><div class="txt">${txt}</div></div>`;
      // 운세 읽는 중 → 알림 시작
      setTimeout(startNotifications, 4200);
    } else {
      nvlog("name_reject", {input: name});
      res.innerHTML = `<div class="fortune-card"><div class="cap">오늘의 운세</div><div class="txt">${F_REJECT}</div></div>
        <button class="f-btn" id="fRetry" style="background:#c9b18a">운세 다시 확인하기</button>`;
      document.getElementById("fRetry").addEventListener("click", renderFortune);
    }
  } else if(name===playerFull && !notifStarted){
    // 새로고침 등으로 진행이 끊겨 다시 자기 이름을 입력한 경우 → 정상 진행 재개
    firstFortuneDone = true;
    const txt = (name==="김유진") ? F_YUJIN : F_MAIN;
    res.innerHTML = `<div class="fortune-card"><div class="cap">${playerName}님의 오늘</div><div class="txt">${txt}</div></div>`;
    setTimeout(startNotifications, 4200);
  } else {
    // 이후 재검색
    let txt;
    if(name===playerFull){ txt = F_AGAIN; }
    else if(name==="김유진"){ txt = F_YUJIN; }
    else { txt = F_LATER[Math.floor(Math.random()*F_LATER.length)]; }
    res.innerHTML = `<div class="fortune-card"><div class="cap">${name.slice(-2)}님의 오늘</div><div class="txt">${txt}</div></div>`;
  }
}

/* ---------- macOS 알림 ---------- */
const notifWrap = document.getElementById("macNotif");
let notifTimer = null, notifStarted = false;
function pushNotif(title, msg, onClick){
  const el = document.createElement("div");
  el.className="notif";
  el.innerHTML = `
    <div class="ic">S</div>
    <div class="body">
      <div class="top"><span>Slack</span><span>지금</span></div>
      <div class="msg"><b>${title}</b><br>${msg}</div>
    </div>`;
  el.addEventListener("click", ()=>{ onClick && onClick(); });
  notifWrap.appendChild(el);
  while(notifWrap.children.length>4) notifWrap.removeChild(notifWrap.firstChild);
}
const NOTIF_MSGS = [
  "님, 저 딴소리 하나 해도 되나요?",
  "새 메시지 1개",
  "김유진님이 회신을 기다리고 있어요",
  "새 메시지 2개",
];
function startNotifications(){
  if(notifStarted) return;
  notifStarted = true;
  let i=0;
  pushNotif("김유진 (스스라 인턴)", NOTIF_MSGS[0], enterSlack);
  notifTimer = setInterval(()=>{
    i=(i+1)%NOTIF_MSGS.length;
    pushNotif("김유진 (스스라 인턴)", NOTIF_MSGS[i], enterSlack);
  }, 5200);
}

/* ---------- 슬랙 진입 ---------- */
let slackEntered = false;
function enterSlack(){
  if(slackEntered) return;
  slackEntered = true;
  if(notifTimer){ clearInterval(notifTimer); notifTimer=null; }
  notifWrap.innerHTML="";
  const ph = document.getElementById("iphone");
  ph.style.opacity=0; ph.style.transform="scale(0.92) translateY(30px)";
  setTimeout(()=>{
    document.getElementById("phoneLayer").classList.remove("on");
    document.getElementById("slackLayer").classList.add("on");
    requestAnimationFrame(()=> document.getElementById("slackWindow").classList.add("show"));
    // 재방문이 아니면, 창이 뜨는 즉시 첫 메시지가 이미 와있는 상태로 표시
    if(!(chatHistory.length>0 && load(SAVE_KEY)?.stage)){
      addMsg({who:"yujin", text:`${playerName}님, 저 딴소리 하나 해도 되나요?`});
    }
    setTimeout(startChatSequence, 500);
  }, 800);
}

/* ==================================================================
   슬랙 대화 엔진
   ================================================================== */
const chatLog  = document.getElementById("chatLog");
const chatField= document.getElementById("chatField");
const sendBtn  = document.getElementById("sendBtn");
const typingEl = document.getElementById("typing");

const chatHistory = load(LOG_KEY) || [];   // {who, text, time, blank?, edited?, corrupt?}

function persistLog(){ save(LOG_KEY, chatHistory); }

let lastSender = null;
function addMsg({who, text, blank=false, edited=false, corrupt=false, imgFail=false, ghost="", noSave=false}){
  const time = fmtSlackTime();
  const isYujin = who==="yujin";
  const name = isYujin ? "김유진 (스스라 인턴)" : `${playerFull}`;
  const newGroup = lastSender!==who || imgFail;   // 사진 뒤엔 이름 다시
  lastSender = imgFail ? null : who;

  let group;
  if(newGroup){
    group = document.createElement("div");
    group.className="msg-group";
    const av = document.createElement("div");
    av.className="avatar";
    if(isYujin){ av.style.backgroundImage=`url(${YUJIN_IMG})`; }
    else {
      const img = PROFILE_MAP[playerFull];
      if(img) av.style.backgroundImage=`url(${img})`;
      else { av.style.background="#7f77dd"; av.textContent=playerName; }
    }
    const body = document.createElement("div");
    body.className="mbody";
    body.innerHTML = `<div class="mhead"><span class="mname">${name}</span><span class="mtime">${time}</span></div>`;
    group.appendChild(av); group.appendChild(body);
    chatLog.appendChild(group);
  } else {
    group = chatLog.lastElementChild;
  }
  const body = group.querySelector(".mbody");

  const line = document.createElement("div");
  line.className = "mline" + (blank?" blank":"") + (corrupt?" corrupt":"");
  if(blank){
    line.dataset.ghost = ghost;
    line.innerHTML = `<span class="edited">(편집됨)</span>`;
    // 찰나의 노이즈
    requestAnimationFrame(()=>{ line.classList.add("flicker"); });
    setTimeout(()=> line.classList.remove("flicker"), 400);
  } else if(imgFail){
    line.innerHTML = `<div class="img-fail"><div class="spin"></div><span>이미지를 불러오지 못했습니다</span></div>`;
  } else {
    line.textContent = text;
  }
  body.appendChild(line);
  chatLog.scrollTop = chatLog.scrollHeight;

  if(!noSave){
    chatHistory.push({who, text, time, blank, edited, corrupt, imgFail});
    persistLog();
  }
  return line;
}

/* 타이핑 표시 */
function showTyping(on){
  typingEl.textContent = on ? "김유진(스스라 인턴)이 작성 중…" : "";
}

/* 입력 대기 (자유응답) — resolve(보낸 텍스트) / timeout(ms) 후 자동 진행 */
let inputResolve = null;
function waitInput(timeoutMs){
  return new Promise(res=>{
    chatField.disabled=false; sendBtn.disabled=false;
    chatField.placeholder = "김유진(스스라 인턴)에 메시지 보내기";
    chatField.focus();
    inputResolve = res;
    if(timeoutMs){
      setTimeout(()=>{
        if(inputResolve){ const r=inputResolve; inputResolve=null; lockInput(); r(null); }
      }, timeoutMs);
    }
  });
}
function lockInput(){
  chatField.disabled=true; sendBtn.disabled=true; chatField.value="";
}
function trySend(){
  const v = chatField.value.trim();
  if(!v || !inputResolve) return;
  addMsg({who:"player", text:v});
  nvlog("chat", {text: v});
  chatField.value="";
  const r = inputResolve; inputResolve=null;
  lockInput();
  r(v);
}
sendBtn.addEventListener("click", trySend);
chatField.addEventListener("keydown", e=>{ if(e.key==="Enter") trySend(); });

/* 자유입력(잠기지 않는) 모드 — 여러 번 보낼 수 있음, 키워드 트리거 수집 */
let freeMode = false;
let freeBuffer = [];
function openFree(){
  freeMode=true; freeBuffer=[];
  chatField.disabled=false; sendBtn.disabled=false;
}
function closeFree(){
  freeMode=false;
  lockInput();
  return freeBuffer;
}
chatField.addEventListener("keydown", e=>{
  if(e.key==="Enter" && freeMode && !inputResolve){
    const v=chatField.value.trim();
    if(v){ addMsg({who:"player", text:v}); nvlog("chat", {text:v}); freeBuffer.push(v); chatField.value=""; }
  }
});
sendBtn.addEventListener("click", ()=>{
  if(freeMode && !inputResolve){
    const v=chatField.value.trim();
    if(v){ addMsg({who:"player", text:v}); nvlog("chat", {text:v}); freeBuffer.push(v); chatField.value=""; }
  }
});

/* 키워드 트리거 */
const TRIGGERS = [
  { key:"장난",   reply:"장난.. 같을 순 잇죠.",             used:false },
  { key:"농담",   reply:"농담을 이정도 스케일로 치진 못해요", used:false },
  { key:"실제로", reply:"아니 당연히 실제죠.",               used:false },
  { key:"실시간", reply:"실시간…? 슬랙은 원래 실시간이에요.", used:false },
  { key:"신기",   reply:"뭐가 신기한거에요 저는 잠을 못 자는데", used:false },
  { key:"무서",   reply:"무섭나요… 그럼 그만 말할까요?",      used:false },
];
let pendingYeoteun = false;
function checkTriggers(text){
  if(text===null) return [];
  const hits=[];
  TRIGGERS.forEach(t=>{
    if(!t.used && text.includes(t.key)){ t.used=true; hits.push(t.reply); nvlog("trigger", {key:t.key}); }
  });
  return hits;
}
async function replyTriggers(text){
  const hits = checkTriggers(text);
  for(const h of hits){
    await yujinSay(h);
    pendingYeoteun = true;
  }
}

/* 유진 발화 (타이핑 표시 후 출력) — 15자 이상 6초, 미만 3초 */
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
async function yujinSay(text, opts={}){
  const typeMs = text.length >= 15 ? 6000 : 3000;
  showTyping(true);
  await sleep(typeMs);
  showTyping(false);
  let out = text;
  if(pendingYeoteun && !opts.raw){ out = "여튼 " + text; pendingYeoteun=false; }
  addMsg({who:"yujin", text:out, ...opts});
  await sleep(300);
}

/* ---------- 강제 변환 ("네 그럴게요") ---------- */
function corruptLastPlayerMsg(){
  const groups=[...chatLog.querySelectorAll(".msg-group")];
  for(let i=groups.length-1;i>=0;i--){
    const nm=groups[i].querySelector(".mname");
    if(nm && nm.textContent!=="김유진 (스스라 인턴)"){
      const lines=groups[i].querySelectorAll(".mline");
      const last=lines[lines.length-1];
      last.classList.add("corrupting");
      let scrambleN=0;
      const orig=last.textContent;
      nvlog("chat_forced", {original: orig});
      const chars="▓▒░#@%&*!?ㅂㅈㄷㄱㅅ";
      const iv=setInterval(()=>{
        scrambleN++;
        last.textContent=[...orig].map(c=> Math.random()<0.6? chars[Math.floor(Math.random()*chars.length)] : c).join("");
        if(scrambleN>6){
          clearInterval(iv);
          last.textContent="네 그럴게요";
          last.classList.remove("corrupting");
          // 로그에도 반영
          for(let j=chatHistory.length-1;j>=0;j--){
            if(chatHistory[j].who==="player"){ chatHistory[j].text="네 그럴게요"; chatHistory[j].corrupt=true; break; }
          }
          persistLog();
        }
      },70);
      return;
    }
  }
}

/* ==================================================================
   메인 대화 시퀀스
   ================================================================== */
const BLANK_GHOSTS = ["보고있어.","보여?","계속 찾고있어","따라가도 돼?","옆에 앉아서 보고있어?","이쪽을 보고 있어","그만 이제 그만 보고싶어"];

async function startChatSequence(){
  // 재방문(로그 존재) 시: 기존 로그 복원만 하고 열람 모드
  if(chatHistory.length>0 && load(SAVE_KEY)?.stage){
    restoreLog();
    return;
  }

  // 첫 메시지는 enterSlack()에서 이미 표시됨 (창이 뜨는 즉시 도착해있는 상태)
  await sleep(400);

  // 응답 대기 (25초 자동 진행)
  let r = await waitInput(25000);
  await replyTriggers(r);

  await yujinSay("시공 중에 스토리랩 구경갔던 날 기억하세요?");
  await yujinSay("그날 제가 이런 사진을 찍었거든요.");
  showTyping(true); await sleep(900); showTyping(false);
  addMsg({who:"yujin", imgFail:true, text:"(이미지)", noSave:false});

  // 답변 대기
  r = await waitInput(20000);
  await replyTriggers(r);
  await yujinSay("안보여요?");

  await yujinSay("이 사진을 찍고 나서 잠을 못 잤어요.");
  r = await waitInput(18000);
  await replyTriggers(r);
  await yujinSay("이제는 진짜 좀 제대로 자고싶어요. 정신 나갈 것 같아요.");
  await yujinSay("꿈 속에서 계속 말을 걸어요. 말이 들린다고 할까");
  await yujinSay("그러니까 보통 뭐라 하냐면…");

  // 빈 메시지 7개 (찰나 노이즈)
  for(let i=0;i<7;i++){
    showTyping(true); await sleep(520); showTyping(false);
    addMsg({who:"yujin", text:"", blank:true, ghost:BLANK_GHOSTS[i]});
    await sleep(260);
  }

  // 자유응답 구간 (유진 대사 이어지는 동안 계속 보낼 수 있음)
  openFree();
  await yujinSay("안되겟슨");
  await sleep(800);
  await yujinSay("저는 그게 뭐였는지 봐야겠어요");
  await sleep(900);
  await yujinSay("그 곳에 있던 게 대체 뭔지...");
  await sleep(700);
  await yujinSay("그날");
  await sleep(600);
  await yujinSay("그거 나만 봤던 건지");
  await sleep(800);
  await yujinSay("알아야겠어요.");
  const freeSent = closeFree();
  for(const t of freeSent){ await replyTriggers(t); }

  await yujinSay("같이 가봐요, 그래주실거죠");

  // 3회 자유 답변 → 3번째가 강제 변환
  for(let i=0;i<3;i++){
    const ans = await waitInput(30000);
    if(ans===null){
      // 무응답이면 유진이 재촉
      if(i<2){ await yujinSay("...보고 계시죠?"); continue; }
      // 마지막까지 무응답 → 시스템이 대신 전송
      addMsg({who:"player", text:"…"});
    }
    if(i<2){ await replyTriggers(ans); }
  }
  // 마지막 답변 강제 변환
  await sleep(400);
  corruptLastPlayerMsg();
  await sleep(1400);

  showTyping(true); await sleep(10000); showTyping(false);   // 10초 후
  addMsg({who:"yujin", text:"네. 정말 감사해요."});
  await sleep(2200);
  await yujinSay("저 여기서 기다릴게요.");

  await sleep(1800);
  // 암전 → 독백 → 디졸브 → 다음 단계
  endIntro();
}

/* ---------- 재방문 로그 복원 ---------- */
function restoreLog(){
  lastSender=null;
  chatHistory.forEach(m=>{
    const line = addMsg({...m, noSave:true});
  });
  lockInput();
  typingEl.textContent="";
}

/* ---------- 인트로 종료 ---------- */
function endIntro(){
  nvlog("intro_done", {});
  save(SAVE_KEY, {stage:"desk", t:Date.now()});

  const black = document.getElementById("blackout");
  const dis = document.getElementById("dissolve");
  black.style.opacity = 1;
  setTimeout(()=>{
    sayIntro([
      "여기고 뭐고 지금은 운영 30분 전인데....",
      "자리를 비울 순 없다. 일단 3층으로 내려가자.",
    ], ()=>{
      dis.style.backgroundImage="url(assets/mini/bg_desk.jpg)";
      dis.style.opacity=1;
      setTimeout(()=>{
        location.href = "desk.html";
      }, 2400);
    });
  }, 1300);
}
