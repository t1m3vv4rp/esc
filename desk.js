/* ==================================================================
   책상 수색 파트 — 3층 운영자석
   핫스팟(핸드폰/텀블러/맥북) → 충전선 → 1234 → 맥 데스크탑
   메시지(노스텔지아 스레드) / 크롬(복구→사이트) / 슬랙 / 이스터에그
   ================================================================== */
const load = (k)=>{ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };
const save = (k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };

const playerFull = load("storylab_player")?.full || "이용자";
const playerName = load("storylab_player")?.short || "이용";

/* ---------- 독백 ---------- */
const mono = document.getElementById("mono");
const monoTxt = mono.querySelector(".mtxt");
let monoQueue = [], monoCb = null;
function say(lines, cb){
  monoQueue = Array.isArray(lines)? [...lines] : [lines];
  monoCb = cb||null;
  nextMono();
}
function nextMono(){
  const t = monoQueue.shift();
  if(t===undefined){
    mono.style.display="none";
    const cb=monoCb; monoCb=null; if(cb) cb();
    return;
  }
  monoTxt.textContent = t;
  mono.style.display="block";
}
mono.addEventListener("click", nextMono);

/* ---------- 책상 핫스팟 ---------- */
const seen = { phone:false, tumbler:false, mac:false };

document.getElementById("hsPhone").addEventListener("click", function(){
  this.classList.add("seen"); seen.phone=true;
  const n = (load("storylab_chatlog")||[]).length;
  say([
    "내 핸드폰이다.",
    n>0 ? "유진님과의 대화가 그대로 남아있다. …다시 읽어봐도 이상한 건 그대로다." : "별다른 건 없다.",
  ]);
});

document.getElementById("hsTumbler").addEventListener("click", function(){
  this.classList.add("seen"); seen.tumbler=true;
  say([
    "유진님의 텀블러다. 뚜껑이 반쯤 열려 있다.",
    "…물이 담겨 있는데, 바닥이 보이지 않을 만큼 검다.",
    "커피는 아니다. 냄새도 나지 않는다.",
  ]);
});

document.getElementById("hsMac").addEventListener("click", function(){
  this.classList.add("seen"); seen.mac=true;
  startMacBoot();
});

/* ---------- 충전선 → 부팅 ---------- */
const chargeBtn = document.getElementById("chargeBtn");
let booting=false;
function startMacBoot(){
  if(booting) return; booting=true;
  say(["유진님의 맥북이다. 전원이 켜지지 않는다.", "충전이 필요할 것 같다."], async ()=>{
    let done=false;
    const proceed = ()=>{
      if(done) return; done=true;
      chargeBtn.style.display="none";
      openMac();
    };
    // 실제 배터리 감지 (지원: 크롬/엣지)
    if(navigator.getBattery){
      try{
        const b = await navigator.getBattery();
        if(b.charging){ proceed(); return; }
        b.addEventListener("chargingchange", ()=>{ if(b.charging) proceed(); });
        say(["(실제로 이 맥북에 충전선을 연결하면 계속됩니다.)"]);
        // 안전망: 25초 후 버튼 폴백
        setTimeout(()=>{ if(!done) chargeBtn.style.display="block"; }, 25000);
      }catch(e){ chargeBtn.style.display="block"; }
    } else {
      chargeBtn.style.display="block";
    }
    chargeBtn.onclick = proceed;
  });
}

/* ---------- 맥북 열기 / 잠금 ---------- */
const macLayer = document.getElementById("macLayer");
const lockScreen = document.getElementById("lockScreen");
const macDesktop = document.getElementById("macDesktop");
let pw = "";
function openMac(){
  document.getElementById("deskLayer").classList.remove("on");
  macLayer.classList.add("on");
  booting=false;
}
addEventListener("keydown", e=>{
  if(!macLayer.classList.contains("on") || macDesktop.style.display==="flex") return;
  if(/^[0-9]$/.test(e.key) && pw.length<4){
    pw += e.key;
    updateDots();
    if(pw.length===4){
      setTimeout(()=>{
        if(pw==="1234") unlock();
        else {
          lockScreen.classList.add("shake");
          setTimeout(()=>{ lockScreen.classList.remove("shake"); pw=""; updateDots(); }, 420);
        }
      }, 120);
    }
  } else if(e.key==="Backspace"){ pw=pw.slice(0,-1); updateDots(); }
});
function updateDots(){
  document.querySelectorAll("#pwDots .cell").forEach((c,i)=> c.classList.toggle("fill", i<pw.length));
}
function unlock(){
  nvlog("mac_unlock", {});
  lockScreen.style.display="none";
  macDesktop.style.display="flex";
  save("storylab_progress",{stage:"desk_mac", t:Date.now()});
}

/* 맥 시계 */
function tickMac(){
  const d=new Date();
  const days=["일","월","화","수","목","금","토"];
  document.getElementById("macClock").textContent =
    `${d.getMonth()+1}월 ${d.getDate()}일 (${days[d.getDay()]}) ${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}`;
}
setInterval(tickMac,1000); tickMac();

/* ---------- 창 열고닫기 ---------- */
document.querySelectorAll("[data-open]").forEach(d=>{
  d.addEventListener("click", ()=>{
    const id={msg:"msgWin", chrome:"chromeWin", slack:"slackWin"}[d.dataset.open];
    document.getElementById(id).classList.add("on");
    bringFront(id);
    if(d.dataset.open==="msg") visited.msg=true;
    checkAllVisited();
  });
});
document.querySelectorAll("[data-close]").forEach(x=>{
  x.addEventListener("click", ()=> document.getElementById(x.dataset.close).classList.remove("on"));
});
let zTop=30;
function bringFront(id){ document.getElementById(id).style.zIndex = ++zTop; }
["msgWin","chromeWin","slackWin","txtWin"].forEach(id=>{
  document.getElementById(id).addEventListener("mousedown", ()=>bringFront(id));
});

/* ---------- 이스터에그 폴더 ---------- */
const FOLDER_CHAIN = ["업무","진행중","2026","최종","진짜최종","이게진짜최종","수정","수정2","제발"];
let folderDepth = 0;
document.getElementById("deskIcons").addEventListener("click", e=>{
  const d = e.target.closest(".dicon"); if(!d) return;
  folderDepth++;
  if(folderDepth < FOLDER_CHAIN.length){
    d.innerHTML = `<div class="folder">📁</div>${FOLDER_CHAIN[folderDepth]}`;
  } else {
    d.innerHTML = `<div class="folder">📄</div>메모.txt`;
    d.onclick = null;
    document.getElementById("txtWin").classList.add("on");
    bringFront("txtWin");
  }
});

/* ==================================================================
   메시지 앱 — 노스텔지아 비스타 스레드
   ================================================================== */
const visited = { msg:false, lookup:false };
const NV_NUMBER = "+82 2-5574-3192";

const THREAD = [
  { sep:"2026년 2월 5일" },
  { in:true, text:"[키이스케이프 예약 확정]\n김유진님 안녕하세요! 신청하신 예약이 확정되었습니다!\n지점: 키이스케이프 스테이션\n이용일자: 2026-02-10\n테마명: 노스텔지아 비스타\n방문인원: 2\n예약번호: 26210\n\n* 사전 안내를 위해 이용시간 10분 전까지 꼭! 방문해 주세요. (5분 이상 지각시, 입장이 불가한 점 양해 부탁드립니다!)\n* 예약 취소는 이용시간 24시간 전까지만 가능합니다." },
  { sep:"2026년 4월 28일" },
  { out:true, text:"노스텔지아 비스타 서비스가 실제로 운영되고 있는 거 같은데, 맞죠?" },
  { out:true, text:"저 그게 좀 급하게 필요해요." },
  { out:true, text:"ㄱ나절해요." },
  { out:true, text:"간절해요" },
  { sep:"2026년 5월 2일" },
  { in:true, link:true, text:"받은 플라스틱 카드를 들고 아래 사이트에 접속해보세요.\n" },
  { out:true, text:"답변 주셔서 정말 감사합니다. 그런데 제가 안전히 나오려면 이용하려면 어떻게 해야하죠?" },
  { out:true, text:"..." },
  { sep:"2026년 5월 20일" },
  { out:true, text:"왜 답변이 없으세요...?" },
  { out:true, text:"저 정말 필요해요" },
  { sep:"2026년 6월 16일" },
  { out:true, text:"서비스 없어졌나요? 전화 주세요" },
  { out:true, text:"저 정말 꿈 속에 그곳이 계속 나와요" },
  { out:true, text:"한 번만 도와주세요" },
  { sep:"2026년 6월 30일" },
  { out:true, text:"아. 사이트" },
  { out:true, text:"사이트로 신청했어요.." },
  { sep:"2026년 7월 2일" },
  { out:true, text:"아... 알겠다." },
  { out:true, text:"지인들과 동행하면 되나요?" },
  { in:true, text:"더욱이 좋습니다 :)" },
];

const msgList = document.getElementById("msgList");
const threadScroll = document.getElementById("threadScroll");
msgList.innerHTML = `
  <div class="msg-item active"><div class="mi-name">${NV_NUMBER}</div><div class="mi-prev">더욱이 좋습니다 :)</div></div>
  <div class="msg-item"><div class="mi-name">엄마</div><div class="mi-prev">밥 먹었니</div></div>
  <div class="msg-item"><div class="mi-name">+82 1588-XXXX</div><div class="mi-prev">[Web발신] (광고) …</div></div>`;

function renderThread(){
  threadScroll.innerHTML="";
  THREAD.forEach(m=>{
    if(m.sep){
      const s=document.createElement("div"); s.className="date-sep"; s.textContent=m.sep;
      threadScroll.appendChild(s); return;
    }
    const b=document.createElement("div");
    b.className="bubble "+(m.in?"in":"out");
    if(m.link){
      b.innerHTML = m.text.replace(/\n$/,"<br>") + `<a id="nvLink">nostalgiavista.com/consult</a>`;
    } else {
      b.textContent = m.text;
    }
    threadScroll.appendChild(b);
  });
  threadScroll.scrollTop = threadScroll.scrollHeight;
  const link = document.getElementById("nvLink");
  if(link) link.addEventListener("click", openNvViaChrome);
}
renderThread();

/* 메시지 직접 발신 → 차단 */
const miField=document.getElementById("miField"), miSend=document.getElementById("miSend");
let blocked=false;
function sendMi(){
  if(blocked) return;
  const v=miField.value.trim(); if(!v) return;
  const b=document.createElement("div"); b.className="bubble out"; b.textContent=v;
  nvlog("imessage", {text: v});
  threadScroll.appendChild(b);
  miField.value="";
  threadScroll.scrollTop=threadScroll.scrollHeight;
  blocked=true;
  miField.disabled=true; miSend.disabled=true;
  setTimeout(()=>{
    const r=document.createElement("div"); r.className="bubble in"; r.textContent="너 누구야?";
    threadScroll.appendChild(r);
    threadScroll.scrollTop=threadScroll.scrollHeight;
    setTimeout(()=>{
      const bl=document.createElement("div"); bl.className="blocked"; bl.textContent="메시지가 차단되었습니다.";
      threadScroll.appendChild(bl);
      threadScroll.scrollTop=threadScroll.scrollHeight;
    }, 1600);
  }, 2200);
}
miSend.addEventListener("click", sendMi);
miField.addEventListener("keydown", e=>{ if(e.key==="Enter") sendMi(); });

/* ==================================================================
   크롬 — 복구 → 노스텔지아 비스타
   ================================================================== */
const restoreBar=document.getElementById("restoreBar");
const nvSite=document.getElementById("nvSite");
function showNvSite(){
  restoreBar.style.display="none";
  nvSite.classList.add("on");
  document.getElementById("chromeTabName").textContent="Nostalgia Vista";
  document.getElementById("chromeUrl").textContent="nostalgiavista.com/consult";
}
document.getElementById("restoreBtn").addEventListener("click", showNvSite);
function openNvViaChrome(){
  document.getElementById("chromeWin").classList.add("on");
  bringFront("chromeWin");
  showNvSite();
}

/* 탭 전환 */
document.querySelectorAll(".nv-tab").forEach(t=>{
  t.addEventListener("click", ()=>{
    document.querySelectorAll(".nv-tab").forEach(x=>x.classList.remove("on"));
    document.querySelectorAll(".nv-panel").forEach(x=>x.classList.remove("on"));
    t.classList.add("on");
    document.getElementById(t.dataset.tab==="apply"?"nvApply":"nvLookup").classList.add("on");
  });
});

/* 사전 설문 (성격/기질 평가) */
const survey = { q1:null,q2:null,q3:null,s1:null,s2:null,s3:null,s4:null, done:false };
// 척도 7칸 생성
document.querySelectorAll(".scale-row .cells").forEach(c=>{
  for(let i=1;i<=7;i++){
    const s=document.createElement("i"); s.className="sq"; s.dataset.v=i; c.appendChild(s);
  }
});
// 체크 (문항 내 단일 선택)
document.querySelectorAll("[data-q]").forEach(q=>{
  q.addEventListener("click", e=>{
    const sq = e.target.closest(".sq"); if(!sq) return;
    q.querySelectorAll(".sq").forEach(x=>x.classList.remove("on"));
    sq.classList.add("on");
    survey[q.dataset.q] = sq.dataset.v;
  });
});
const svStart = document.getElementById("svStart");
svStart.addEventListener("click", ()=>{
  if(survey.done) return;
  document.querySelectorAll(".nv-tab").forEach(x=>x.classList.remove("on"));
  document.querySelectorAll(".nv-panel").forEach(x=>x.classList.remove("on"));
  document.getElementById("nvSurvey").classList.add("on");
  document.getElementById("chromeUrl").textContent="nostalgiavista.com/survey";
  document.getElementById("chromeView").scrollTop=0;
});
document.getElementById("svSubmit").addEventListener("click", ()=>{
  const missing = ["q1","q2","q3","s1","s2","s3","s4"].some(k=>survey[k]===null);
  const warn = document.getElementById("svWarn");
  if(missing){ warn.style.display="block"; return; }
  warn.style.display="none";
  survey.done = true;
  // 신청 화면 복귀
  document.querySelectorAll(".nv-panel").forEach(x=>x.classList.remove("on"));
  document.getElementById("nvApply").classList.add("on");
  document.querySelector('.nv-tab[data-tab="apply"]').classList.add("on");
  document.getElementById("chromeUrl").textContent="nostalgiavista.com/consult";
  svStart.textContent="✓ 완료";
  svStart.classList.add("done");
  document.getElementById("chromeView").scrollTop = 1e9;
});

/* 신청 */
const myApps = load("storylab_nv_apps") || {};
document.getElementById("nvSubmit").addEventListener("click", ()=>{
  const f = {
    name: nvName.value.trim(), age: nvAge.value.trim(), birth: nvBirth.value.trim(),
    sleep: nvSleep.value.trim(), dream: nvDream.value.trim(), reason: nvReason.value.trim(),
    smoke: nvSmoke.value, exer: nvExer.value.trim(), other: nvOther.value.trim(),
    survey: {...survey},
  };
  const r=document.getElementById("nvApplyResult");
  if(!f.name){ nvName.focus(); return; }
  if(!survey.done){
    r.classList.add("on");
    r.innerHTML = `<span style="color:#8a1520">사전 설문 조사를 먼저 완료해 주세요.</span>`;
    return;
  }
  let code;
  do { code = String(Math.floor(10000+Math.random()*90000)); } while(code==="26210"||myApps[code]);
  myApps[code]=f; save("storylab_nv_apps", myApps);
  nvlog("nv_apply", {code, ...f});
  r.classList.add("on");
  r.innerHTML = `상담 신청이 접수되었습니다.<br>예약번호: <span class="num">${code}</span><br><span style="color:#5a686b; font-size:11.5px">번호로 신청 내용을 다시 조회할 수 있습니다.</span>`;
});

/* 조회 */
const YUJIN_APP = {
  name:"김유진", age:"25", birth:"2001.11.02", sleep:"2~3시간",
  dream:"리모델링 중인 도서관. 가구마다 비닐이 덮여 있다. 매일 같은 곳이다.",
  reason:"꿈에 자꾸 나오는 그 장소에 누군가 있었던 것 같은데 얼굴이 기억나지 않습니다. 누구였는지 확인해야 합니다.",
  smoke:"무", exer:"0회",
  temper:"불안 7 · 감정적 5 · 우울 7 · 자립적 4",
};
document.getElementById("nvLookupBtn").addEventListener("click", ()=>{
  const code = nvCode.value.trim();
  nvlog("nv_lookup", {code});
  const r = document.getElementById("nvLookupResult");
  r.classList.add("on");
  let app=null, status="";
  if(code==="26210"){ app=YUJIN_APP; status="처리 완료 — 동행 승인됨"; visited.lookup=true; checkAllVisited(); }
  else if(myApps[code]){ app=myApps[code]; status="접수됨 — 대기 중"; }
  if(!app){ r.innerHTML=`<span style="color:#5a686b">해당 번호의 신청 내역이 없습니다.</span>`; return; }
  const temper = app.temper
    || (app.survey ? `불안측 ${app.survey.s1||"-"} · 감정측 ${app.survey.s2||"-"} · 활력측 ${app.survey.s3||"-"} · 자립측 ${app.survey.s4||"-"}` : "제출됨");
  r.innerHTML = `
    <div class="nv-row"><span class="k">이름</span><span>${app.name}</span></div>
    <div class="nv-row"><span class="k">나이 / 생일</span><span>${app.age} / ${app.birth}</span></div>
    <div class="nv-row"><span class="k">수면시간</span><span>${app.sleep}</span></div>
    <div class="nv-row"><span class="k">꿈의 내용</span><span>${app.dream}</span></div>
    <div class="nv-row"><span class="k">신청 이유</span><span>${app.reason}</span></div>
    <div class="nv-row"><span class="k">흡연 / 운동</span><span>${app.smoke} / ${app.exer}</span></div>
    <div class="nv-row"><span class="k">기질 평가</span><span>${temper}</span></div>
    <div class="nv-row"><span class="k">처리 상태</span><span style="color:#2E5A5E; font-weight:700">${status}</span></div>`;
});

/* ==================================================================
   슬랙(맥북) — OOO 점심 대화 + 로딩 안 되는 DM
   ================================================================== */
const slLog=document.getElementById("slLog");
function todaySlackTime(h,m){
  return `${h<12?"오전":"오후"} ${((h+11)%12)+1}:${String(m).padStart(2,"0")}`;
}
(function renderSlack(){
  const items=[
    {nm:"OOO", tm:todaySlackTime(11,42), lines:[`${playerName}님과 점심 같이 드실래요?`,"오랜만에 어고집밥 갈까요?"]},
    {nm:"김유진 (스스라 인턴)", me:true, tm:todaySlackTime(11,44), lines:["좋아요~","우동 먹고싶기도 해요"]},
    {nm:"OOO", tm:todaySlackTime(11,45), lines:["그럼 이따 12시 반에 로비에서 봬요!"]},
  ];
  items.forEach(g=>{
    const el=document.createElement("div"); el.className="sl-g";
    const av=document.createElement("div"); av.className="av";
    if(g.me){ av.style.background=`url(assets/profiles/yujin.png) center/cover`; av.textContent=""; }
    else av.textContent="👤";
    const body=document.createElement("div");
    body.innerHTML=`<div><span class="nm">${g.nm}</span><span class="tm">${g.tm}</span></div>`+
      g.lines.map(l=>`<div class="ln">${l}</div>`).join("");
    el.appendChild(av); el.appendChild(body);
    slLog.appendChild(el);
  });
})();
/* 로딩 안 되는 DM 클릭 */
document.getElementById("slLoading").addEventListener("click", ()=>{
  document.getElementById("slHead").textContent="…";
  slLog.innerHTML=`<div class="sl-fail">대화를 불러올 수 없습니다.<br>네트워크 상태를 확인하거나 잠시 후 다시 시도하세요.</div>`;
  document.getElementById("slOOO").classList.remove("active");
  document.getElementById("slLoading").classList.add("active");
});
document.getElementById("slOOO").addEventListener("click", ()=>{ location.reload(); });   // 간단 복원

/* ==================================================================
   완료 조건 → 진동 → 맥북 덮기 → 미니게임
   ================================================================== */
function checkAllVisited(){
  if(visited.msg && visited.lookup){
    setTimeout(()=>{ document.getElementById("vibeIcon").classList.add("on"); }, 2500);
  }
}
document.getElementById("vibeAct").addEventListener("click", ()=>{
  nvlog("desk_done", {});
  save("storylab_progress",{stage:"minigame", t:Date.now()});
  const f=document.getElementById("fade");
  f.style.opacity=1;
  setTimeout(()=>{ location.href="minigames.html"; }, 1100);
});

/* ---------- 진입 독백 ---------- */
say([
  "…유진님 자리다.",
  "책상 위에 핸드폰과 맥북, 그리고 텀블러가 놓여 있다.",
]);

/* 나비 착지 시 날갯짓 느려짐 */
document.addEventListener("animationend", e=>{
  if(e.target.id==="bfly") e.target.classList.add("landed");
});
