/* ==================================================================
   책상 수색 파트 — 3층 운영자석
   핫스팟(핸드폰/텀블러/맥북) → 충전선 → 1234 → 맥 데스크탑
   메시지(노스텔지아 스레드) / 크롬(복구→사이트) / 슬랙 / 이스터에그
   ================================================================== */
const load = (k)=>{ try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };
const save = (k,v)=>{ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };

const playerFull = load("storylab_player")?.full || "이용자";
const playerName = load("storylab_player")?.short || "이용";
const macVisit = Number(load("storylab_mac_visit")) || 1;   // 1=첫 조사, 2=미니게임2 이후 재조사, 3=미니게임3 이후(별도 오버레이)

/* ---------- 오늘의 운세 (맥 데스크탑에서도 계속 볼 수 있음) ---------- */
const F_MAIN  = "오늘은 예기치못한 손님을 맞이하게 됩니다. 공간을 운영하는 사람이라면 운영 준비에 힘 쓰세요.";
const F_YUJIN = "오늘은 꿈에 그리던 목표를 이루는 날 입니다. 궁금해하던 얼굴을 확인할 수 있습니다. 가급적 많은 동료들과 함께하세요. 이미 경험해본 것을 경험할 수 있습니다.";
const F_AGAIN = "오늘은 대박이 터질 날입니다. 이왕이면 로또 당첨되는 게 좋겠네요. 좋은 하루 되세요!";
const F_INTRO = "오하아사, 세계여신타로, 990원 사주해석, 지피티 음양오행, 타로만으로는 채워지지 않는 부분이 있다.<br>그런 당신에게 추천하는 '오늘의 운세'.<br>먼미래와 과거는 보지 못하지만, 소름끼치도록 정확한 오늘의 운세를 볼 수 있다... 당신의 이름 세 글자 만으로도.";
const F_LATER = [
  "누군가 자신의 운세를 궁금해할 하루입니다. 자신의 이름을 검색해봤는데 신기한 결과가 나올 수도 있습니다.",
  "오늘은 어고집밥에 가서 기깔한 한 끼를 할 운명입니다.",
  "너무 기찮다.;; 운세 쓰는 것도 힘드네요",
  "잘 아시겠지만 이 게임은 모두 허구입니다. 처음부터 끝까지 맞는 글자가 단 한 개도 없어요.",
];
function renderFortune3(){
  const box = document.getElementById("fortuneBody3");
  const own = (playerFull==="김유진") ? F_YUJIN : F_MAIN;
  box.innerHTML = `
    <div class="fcard"><div class="ftxt" style="font-size:12px; color:#B98A4E">${F_INTRO}</div></div>
    <div class="fcard"><div class="fcap">${playerName}님의 오늘</div><div class="ftxt">${own}</div></div>
    <div class="fcard">
      <div class="fcap">다른 이름 검색</div>
      <div class="fsearch"><input id="fName3" placeholder="이름"><button id="fGo3">보기</button></div>
      <div id="fResult3" style="margin-top:10px;"></div>
    </div>`;
  document.getElementById("fGo3").addEventListener("click", ()=>{
    const name = document.getElementById("fName3").value.replace(/\s+/g,"");
    if(!name) return;
    let txt;
    if(name===playerFull){ txt = F_AGAIN; }              // 본인 이름 재검색 → 대박 고정
    else if(name==="김유진"){ txt = F_YUJIN; }
    else { txt = F_LATER[Math.floor(Math.random()*F_LATER.length)]; }
    document.getElementById("fResult3").innerHTML = `<div class="fcard"><div class="fcap">${name.slice(-2)}님의 오늘</div><div class="ftxt">${txt}</div></div>`;
  });
}

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
let msgUnlockedV2 = false;
let chromeExitReady = false;   // 2차 방문: 크롬 나가면 10줄 독백+슬랙 배지 준비
let mg3Ready = false;          // 2차 방문: 슬랙 클릭 시 미니게임3 진입 가능 여부
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
    "검은 액체. 액체가 있다는 감각도 없을 정도로 검다.",
  ]);
});

document.getElementById("hsMac").addEventListener("click", function(){
  this.classList.add("seen"); seen.mac=true;
  if(macVisit>=2){ openMacDirect(); }
  else if(macUnlockedThisVisit){
    document.getElementById("deskLayer").classList.remove("on");
    macLayer.classList.add("on");
  }
  else{ startMacBoot(); }
});

/* 맥북 덮기(임시) — 책상으로 돌아가서 포스트잇 등을 다시 확인 가능 */
document.getElementById("macCloseBtn").addEventListener("click", ()=>{
  macLayer.classList.remove("on");
  document.getElementById("deskLayer").classList.add("on");
});

/* ---------- 충전선 → 부팅 ---------- */
const chargeBtn = document.getElementById("chargeBtn");
const macDead = document.getElementById("macDead");
let booting=false;
function startMacBoot(){
  if(booting) return; booting=true;
  openMac();   // 검은 화면 + 배터리 부족 아이콘 먼저 표시
  (async ()=>{
    let done=false;
    const proceed = ()=>{
      if(done) return; done=true;
      chargeBtn.style.display="none";
      macDead.classList.remove("on");
      lockScreen.classList.add("on");
      booting=false;
    };
    // 실제 배터리 감지 (지원: 크롬/엣지)
    if(navigator.getBattery){
      try{
        const b = await navigator.getBattery();
        if(b.charging){ proceed(); return; }
        b.addEventListener("chargingchange", ()=>{ if(b.charging) proceed(); });
        // 안전망: 25초 후 버튼 폴백
        setTimeout(()=>{ if(!done) chargeBtn.style.display="block"; }, 25000);
      }catch(e){ chargeBtn.style.display="block"; }
    } else {
      chargeBtn.style.display="block";
    }
    chargeBtn.onclick = proceed;
  })();
}

/* ---------- 맥북 열기 / 잠금 ---------- */
const macLayer = document.getElementById("macLayer");
const lockScreen = document.getElementById("lockScreen");
const macDesktop = document.getElementById("macDesktop");
let pw = "";
let macUnlockedThisVisit = false;
function openMac(){
  document.getElementById("deskLayer").classList.remove("on");
  macLayer.classList.add("on");
  macDead.classList.add("on");
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
  macUnlockedThisVisit = true;
  save("storylab_progress",{stage:"desk_mac", t:Date.now()});
}

/* 2차 방문(미니게임2 이후) — 배터리/잠금 없이 바로 데스크탑 */
function openMacDirect(){
  document.getElementById("deskLayer").classList.remove("on");
  macLayer.classList.add("on");
  macDead.classList.remove("on");
  lockScreen.style.display="none";
  macDesktop.style.display="flex";
  say([
    "그래도 자리에 너무 안 돌아오시는데. 좀 찔리긴 하지만 메시지를 한 번 볼까? 핸드폰이랑 연동 되어있을 테니까.",
    "그건 둘째치고. 이 사건의 전말이...",
    "너무 궁금하긴 해.",
  ], ()=>{ msgUnlockedV2 = true; });
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
    const kind = d.dataset.open;

    // 메시지: 1차 방문엔 열람 차단
    if(kind==="msg" && macVisit===1){
      say("그래도 사생활을 건들 순 없지... 아직은.");
      return;
    }
    // 슬랙: 2차 방문에서는 특수 처리(독백 후 미니게임3行)
    if(kind==="slack" && macVisit===2){
      if(mg3Ready){
        say([
          "그래. 운영이 우선이지",
          "이 공간을 잘 가꾸고 정리해두는 게 중요하지.",
          "잘 오실 수 있도록? 이용자 분들이.",
        ], ()=>{
          localStorage.setItem("storylab_mac_visit", "3");
          localStorage.setItem("storylab_direct_photo", "1");
          save("storylab_progress", {stage:"photo", t:Date.now()});
          nvlog("mac_visit2_done", {});
          const f=document.getElementById("fade");
          f.style.opacity=1;
          setTimeout(()=>{ location.href="minigames.html"; }, 1100);
        });
      } else {
        document.getElementById("slackWin").classList.add("on");
        bringFront("slackWin");
      }
      return;
    }

    const id={msg:"msgWin", chrome:"chromeWin", slack:"slackWin", fortune:"fortuneWin"}[kind];
    document.getElementById(id).classList.add("on");
    bringFront(id);
    if(kind==="msg") visited.msg=true;
    if(kind==="chrome") visited.chrome=true;
    if(kind==="fortune") renderFortune3();
    checkAllVisited();
  });
});
let msgClosedOnceV2 = false, chromeClosedOnceV2 = false;
document.querySelectorAll("[data-close]").forEach(x=>{
  x.addEventListener("click", ()=>{
    const id = x.dataset.close;
    document.getElementById(id).classList.remove("on");
    if(macVisit===2 && id==="msgWin" && msgUnlockedV2 && !msgClosedOnceV2){
      msgClosedOnceV2 = true;
      say("정보가 더 필요해. 블로그도 살펴보자.");
    }
    if(macVisit===2 && id==="chromeWin" && !chromeClosedOnceV2){
      chromeClosedOnceV2 = true;
      say([
        "그러니까...",
        "시공 중에 그 사진을 찍고 나서",
        "악몽을 꾼다고?",
        "그것도 같은 내용으로?",
        "근데 그때...",
        "시공 중에...",
        "나랑 같이 들어가지 않으셨나?",
        "일기 내용 중에 점점 궁금해진다는 내용도 있는데",
        "지금의 나 또한 그러하다.",
        "무서운데 그만 찾아볼까?",
      ], ()=>{
        mg3Ready = true;
        document.getElementById("slackBadge").style.display="flex";
      });
    }
  });
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

/* 메모.txt 암호(2678) 확인 */
const TXT_PASSWORD = "2678";
function checkTxtPw(){
  const val = document.getElementById("txtPwInput").value.trim();
  const fb = document.getElementById("txtPwFb");
  if(val === TXT_PASSWORD){
    document.getElementById("txtLockView").style.display = "none";
    document.getElementById("txtUnlockedView").style.display = "block";
    document.querySelector("#txtWin .tname").textContent = "메모.txt";
  } else {
    fb.textContent = "암호가 올바르지 않습니다.";
    document.getElementById("txtPwInput").value = "";
  }
}
document.getElementById("txtPwBtn").addEventListener("click", checkTxtPw);
document.getElementById("txtPwInput").addEventListener("keydown", e=>{ if(e.key==="Enter") checkTxtPw(); });

/* 포스트잇 (암호 힌트) 열기/닫기 */
document.getElementById("hsPostit").addEventListener("click", ()=>{
  document.getElementById("postitNote").classList.add("on");
});
document.getElementById("postitClose").addEventListener("click", ()=>{
  document.getElementById("postitNote").classList.remove("on");
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
   크롬 — 검색 기록 → 네이버 검색결과 → (숨겨진) 비공개 블로그
   ================================================================== */
const histDrop = document.getElementById("histDrop");
const nvSearchView = document.getElementById("nvSearch");
const nvBlogView = document.getElementById("nvBlog");

document.getElementById("chromeUrl").addEventListener("click", (e)=>{
  e.stopPropagation();
  histDrop.classList.toggle("on");
});
document.addEventListener("click", ()=> histDrop.classList.remove("on"));

const SEARCH_DATA = {
  q1: { q:"같은 꿈을 반복해서 꾸는 꿈해몽", cards:[
    { src:"꿈풀이 사전", ttl:"반복되는 꿈, 무의식이 보내는 신호일까?",
      snip:"같은 꿈을 계속해서 꾸는 경우, 해결되지 않은 감정이나 강박이 원인일 수 있습니다. 특히 같은 장소가 반복해서 등장한다면…" },
    { src:"blog.naver.com/yjin1025", ttl:"2/5 몸부림을 쳐봐도 이게 다일지도 몰라", blog:true,
      snip:"2026.2.10. · 이웃공개 · SP의 블로그 [일기]" },
  ]},
  q2: { q:"누가 부를 때 따라가면", cards:[
    { src:"커뮤니티", ttl:"낯선 곳에서 이름 부르는 소리, 대답하면 안 되는 이유",
      snip:"오래전부터 전해지는 이야기 중 하나로, 인적 없는 곳에서 자신을 부르는 소리가 들려도 뒤돌아보거나 대답하지 말라는 말이 있다. 따라가면 돌아오지 못한다고…" },
  ]},
  q3: { q:"꿈 괴담", cards:[
    { src:"커뮤니티", ttl:"꿈에서 만난 존재, 현실에서도 나를 알아본다면",
      snip:"꿈 속에서 자꾸 마주치는 무언가가 있는데, 최근엔 눈을 뜨고 있을 때도 그 기척이 느껴진다는 글이 종종 올라온다…" },
  ]},
  q4: { q:"키이스케이프 스테이션", cards:[
    { src:"플레이스 · 방탈출카페", ttl:"키이스케이프 스테이션",
      snip:"★4.8 (리뷰 312) · 테마: 노스텔지아 비스타 외 6종 · 몰입도 높은 세트와 스토리로 인기가 많은 방탈출 카페입니다." },
  ]},
  q5: { q:"예약 팁", cards:[
    { src:"블로그", ttl:"방탈출 카페 예약, 이렇게 하면 놓치지 않아요",
      snip:"인기 테마일수록 예약 오픈 시간에 맞춰 접속하는 게 좋고, 취소표를 노리는 것도 방법입니다…" },
  ]},
};

document.querySelectorAll(".hist-item").forEach(item=>{
  item.addEventListener("click", (e)=>{
    e.stopPropagation();
    const data = SEARCH_DATA[item.dataset.q];
    histDrop.classList.remove("on");
    restoreBar.style.display="none";
    nvSite.classList.remove("on");
    nvBlogView.classList.remove("on");
    nvSearchView.classList.add("on");
    document.getElementById("chromeTabName").textContent = data.q;
    document.getElementById("chromeUrl").textContent = `search.naver.com/search?query=${encodeURIComponent(data.q)}`;
    document.getElementById("nvsQueryBox").textContent = data.q;
    const box = document.getElementById("nvsResults");
    box.innerHTML = "";
    data.cards.forEach(c=>{
      const card = document.createElement("div");
      card.className = "nvs-card";
      card.innerHTML = `<div class="src">${c.src}</div><div class="ttl">${c.ttl}</div><div class="snip">${c.snip}</div>`;
      if(c.blog){
        card.querySelector(".ttl").addEventListener("click", openNvBlog);
      }
      box.appendChild(card);
    });
  });
});

function openNvBlog(){
  nvSearchView.classList.remove("on");
  nvBlogView.classList.add("on");
  document.getElementById("chromeTabName").textContent = "SP : 네이버 블로그";
  document.getElementById("chromeUrl").textContent = "blog.naver.com/yjin1025";
  document.getElementById("nvbPostView").style.display = "block";
  document.getElementById("nvbSecretView").style.display = "none";
  document.getElementById("nvBlogBody").innerHTML = `
    <p>야심한 밤. 심란한 마음을 달래려 먹지도 못할 매운 라면을 끓일까 말까 고민하다, 털어놓을 수 있는 친구에게 디엠을 했습니다. 하고픈 말이 너무 많은데 손가락으로 치다가 할 말을 다 까먹을 것 같아 녹음을 보냈습니다. 우리끼리 종종.... 아주 가끔 합니다. 요즘 너무 붙어 다닌 탓에 입맛의 바이오리듬이 같아졌는지 친구도 라면을 사 왔다고 했습니다. 너무 늦은 시간에 드시면 안 좋습니다. 매운 라면 대신 만만한 라면을 끓여놓고 다 불 때까지 한 입도 못 먹습니다. 다 불고 나서 먹기 시작합니다. 걱정이 있는 게 아니라요 그게 제 라면 취향이라서요. 우리는 어떻게 살아야 할까요.</p>
    <div class="stanza"><div>제말이 그말입니다.</div><div>일년전에 딱 이 시간에</div><div>떨레고 있었겠죠</div></div>
    <p>아하. 일 년 전 나는 어떤 오늘을 상상했을까요? 정말로, 정말 아무것도 기억 나지 않습니다. 최근에 핸드폰을 바꾼지라 작년의 사진은 남아있지 않습니다. 2월 4일에 친구들 단톡방에 무언가 남겼을까요? 그날은 유독 한 마디도 하지 않았습니다. 인스타 스토리 올렸던 기록을 보니, 피크민 AR 기능을 처음 발견하고는 집앞 하천에서 피크민 영상을 찍었습니다. 피크민을 갓 시작해서 하루에 산책을 세 번 나가던 시절이군요. 오케이 거기까진 기억이 납니다. 그런데 제가 찾고자한 이야기는 하나도 하지 않았습니다. 별 기대가 없던 걸까요?</p>
    <p>그렇다면 일 년 전 나는 도대체가 어떤 오늘을 상상했던 걸까요? 일 년 전 나는 어떤 첫날을 기대하고 있었을까요? 꿈의, 젊은, 모두가 잘 어울린다고 한, 뜻이 같은, 미래지향적인, 열정 가득한, 변화를 이끌, 다행인, 새로운 이곳에서 어떤 일 년을 보내길 바랐을까요. 우리는 어떻게 살아야 할까요.</p>
    <div class="head">높은 마음 (Hearts High)</div>
    <p>그냥 살아요. 그냥 해요! 그냥 합시다. 요새 제가 제일 위로를 받는 말입니다. 복잡한 생각이나 괜한 걱정하지 말고 일단 질러보자는 마음이 좋은 게 아닙니다. 아무런 비판 없이 수동적으로 살아도 좋다는 허락처럼 느껴지기 때문입니다. 어쭙잖다. 요새 제가 제일 좋아하는 단어입니다. 아무리 고민하고 능동적으로 살아도 여쭙잖은 건 매한가지이기 때문입니다. 나는 어떻게 살아야 할까요.</p>
    <div class="stanza"><div>인정할 수 없는 모든 게 사실은 세상의 이치라면</div><div>평범함에 짓눌린 일상이 사실은 나의 일생이라면</div></div>
    <p>결국은 내 가치와 위치, 능력에 대해 의심하게 됩니다. '내가 어느 정도의 가치가 있는 일을 하고 있는가?' 이건 생각과 공상에 가까운 질문이라 단을 현실로 끌어내리려면 현실의 가치에 빗대야겠죠, 좋든 싫든. 편의점에서 바코드를 찍거나 주방에서 냉동 핫도그를 뜯어서 전자레인지에 돌릴 때와는 너무 다른 삶을 살고 있는데도 제 삶에 변화는 없습니다. 의심을 지울 수가 없습니다. 나를 의심하거나 나의 일을 의심합니다. 이제는 좀 컸다고 세상을 의심할 줄도 압니다. 그렇지만 잘 헤아릴 수 없는 세상을 배경으로 상상하는 것보다야, 그나마 익숙한 내 안의 문제와 결함을 배경으로 상상하는 게 더 쉽습니다.</p>
    <p>아!!!!!!!!!!!!!!!!!!!! 몰라 내가 왜 이런 고민을 하고 앉았나요 지난 일 년을 후회하지도 않고 좋은 어른도 많이 만나고 좋은 사람도 만나고 좋은 시간도 보냈는데 그런 일 하나도 없었던 것 같고 쓸쓸해지기만 하고 심란해지기만 하잖아 어이가 없네 나는 확실히 압니다. 나는 기대했던만큼 지냈습니다 기꺼이 행하는 사람들 아군 친구 동료 멘토 다소니 배울 점이 더 많은 후배들과 즐거움을 나눌 수 있는 사람들 발화한 것 용기낸 것 치열한 시간들 새로운 생각 두 눈으로 목격한 풍경들 소소한 행복 주워담은 뿌듯함 계절의 변화 다 기대보다도 더 좋았단 말입니다 왜 의심을 하게 만듭니까. 우리는 이미 어떻게 살아야 하는지 잘 아는데</p>
    <div class="stanza"><div>높은 마음으로 살아야죠!</div><div>낮은 몸에 갇혀있대도</div></div>`;
}

/* ---------- 비밀 카테고리 (.-.. .- ..- — 괴담 소설 모음, 전부 비공개) ---------- */
const SECRET_POSTS = [
  { date:"2022. 12. 3.", body:"나는 회사에서 아동 큐레이션을 담당하고 있다. 두 달에 한 번씩 서가 구성을 바꾸는데, 그때마다 책장 청소도 함께 한다. 문제는 가장 윗칸이다. 천장에 거의 붙어 있다시피 한 위치라 사다리를 밟고 올라가야만 겨우 손이 닿는다. 그런데 이상하게도, 청소를 할 때마다 그 윗칸에서 머리카락이 한 움큼씩 나온다. 처음 한두 번은 그러려니 했다. 사람이 오가는 공간이니 어쩌다 날아든 머리카락이겠거니 했다. 그런데 그 칸은 천장 바로 아래라 사람 손이 닿기도 힘들고, 애초에 누가 거기까지 머리를 들이밀 일도 없다. 청소를 도와주던 동료에게 물어봤더니, 자기도 예전부터 이상하다고 생각은 했는데 굳이 말을 꺼내지 않았다고 했다. 그러면서 자기가 왔을 때부터 그랬으니 자기 탓은 아니라고, 농담처럼 웃으며 말했다. 그 웃음이 이상하게 신경 쓰였다. 게다가 매번 양이 적지 않다. 두 달마다 바꾸는데 그때마다 꾸준히, 오히려 조금씩 늘어나는 것 같기도 하다. 누구 머리카락인지도 알 수 없고, 굳이 확인하고 싶지도 않다. 그냥 이번에도 조용히 쓸어 담아 버렸다. 다음 번에는 또 얼마나 나올지, 생각하지 않으려 한다." },
  { date:"2023. 2. 17.", body:"어제 친구들이랑 카드 게임을 하다가 좀 이상한 일이 있었다. 상대가 카드를 뽑기 전에, 무슨 카드일지 갑자기 알겠다는 느낌이 들었다. 장난 삼아 먼저 말했는데 정확히 맞았다. 처음엔 우연이라고 생각했다. 그런데 그날따라 유독, 뽑기 전부터 그림이 머릿속에 먼저 떠올랐다. 그리고 그게 그날 내내, 한 번도 틀리지 않고 계속 맞아떨어졌다. 친구 한 명은 나중엔 아예 카드를 안 보여주고 뽑기만 했는데, 그것도 맞혀버렸다. 다들 처음엔 신기하다며 웃었는데, 어느 순간부터는 다들 말수가 줄었다. 나만 빼고 다들 조금 무서워하는 눈치였다. 나는 그 순간엔 그냥 재미있다고만 생각했다. 그런데 집에 돌아오는 길에 다시 생각해보니 조금 소름이 돋았다. 그렇게 여러 번을, 그것도 연달아 다 맞힌다는 게 정상은 아니지 않나. 예전에는 이런 적이 한 번도 없었는데, 요즘따라 이상하게 뭔가 먼저 알게 되는 순간들이 종종 있다. 기분 탓이라고 넘기기엔, 그 확률이 너무 낮다는 걸 나도 알고 있다. 그냥 우연이라고 믿고 싶은데, 자꾸 그날 친구들 표정이 떠오른다." },
  { date:"2026. 1. 22.", body:"4층에서 있었던 일이다. 동료 직원분이 어느 날 나에게 조심스럽게 이야기를 꺼냈다. 며칠 전 야근을 하다가 가위에 눌렸는데, 눈은 떠지지 않고 몸은 움직이지 않는 상태에서 누군가 자신의 이름을 부르는 소리를 들었다고 했다. 그런데 그 목소리가 이상하게도 내 목소리와 똑같았다는 것이다. 처음엔 웃어넘기려 했다. 사람이 잠결에 잘못 들을 수도 있고, 평소 내 목소리를 자주 들어서 착각했을 수도 있으니까. 그런데 그분은 꽤 확신하는 얼굴이었다. 몇 번이나 되물어봐도, 분명 내 말투였다고 했다. 그 얘기를 듣고 나서부터, 나도 4층에 혼자 있을 때면 이상하게 등 뒤가 서늘한 기분이 든다. 딱히 뭔가 보이거나 들리는 건 아닌데, 누군가 나를 보고 있는 것 같은 느낌이 자꾸 든다. 공사가 끝난 뒤로 그 공간에 들어가는 사람 자체가 줄었는데, 그것과 관련이 있는 건지 나로선 알 수가 없다. 요즘은 4층에 갈 일이 생기면 괜히 다른 사람과 같이 가려고 한다. 그냥 요즘 들어 4층에 가는 일이 점점 꺼려진다는 것만 확실하다." },
  { date:"2026. 6. 18.", body:"요즘 계속 같은 꿈을 꾼다. 어두운 방, 비닐 덮인 가구들. 처음엔 그냥 무서운 꿈이라고 생각했는데, 벌써 다섯 번째다." },
  { date:"2026. 6. 24.", body:"꿈에서 누가 말을 걸었다. 뭐라고 했는지는 기억이 안 나는데, 목소리는 또렷하게 남아있다. 이상하게 낯설지가 않았다." },
  { date:"2026. 6. 29.", body:"자꾸 그 공간이 생각난다. 무섭다고 해야 하는데, 자꾸 보고 싶다는 생각이 든다. 이게 맞는 감정인지 모르겠다. 한 번만 더 가보면 알 수 있을 것 같다." },
  { date:"2026. 7. 2.", body:"오늘 회사에서 동료분이 취미로 타로를 봐준다고 해서 카드를 뽑았다. 그런데 카드를 뽑기도 전에, 그분이 먼저 어떤 카드가 나올지 말해주었다. 그것도 정확하게. 놀라서 어떻게 알았냐고 물었더니, 대답이 이상했다. 자기가 맞춘 게 아니라, 누군가 그렇게 알려줬다는 것이다. 누구냐고 물었더니 웃기만 하고 대답을 피했다. 분위기가 이상해서 나도 더 캐묻지 않았다. 그런데 자리로 돌아와서 계속 그 말이 마음에 걸렸다. 최근 들어 나에게도 비슷한 일들이 있었기 때문이다. 뭔가 알게 되는 순간들, 미리 보이는 느낌들. 우연이라기엔 너무 반복된다. 어쩌면 나도 그분처럼, 누군가 알려줘서 알게 된 건 아니었을까 하는 생각이 뒤늦게 들었다. 그 존재가 나한테만 말을 거는 게 아니라, 다른 사람들한테도 뭔가를 전하고 있는 걸지도 모른다는 생각이 들었다. 그렇게 생각하니 오히려 조금, 덜 외로워지는 기분이었다." },
];
document.getElementById("secretCat").addEventListener("click", ()=>{
  if(macVisit===1){
    say("내가 알기론 이 카테고리 글은 다 비밀글이었던 거 같은데. 들어가도 될까? 지금은 참자.");
    return;
  }
  document.getElementById("nvbPostView").style.display = "none";
  document.getElementById("nvbSecretView").style.display = "block";
  const box = document.getElementById("secretPosts");
  box.innerHTML = SECRET_POSTS.map(p=>`
    <div class="secret-post">
      <div class="sp-meta">${p.date}<span class="priv">비공개</span></div>
      <div class="sp-body">${p.body}</div>
    </div>`).join("");
});
document.querySelectorAll('[data-cat="main"]').forEach(el=>{
  el.addEventListener("click", ()=>{
    document.getElementById("nvbSecretView").style.display = "none";
    document.getElementById("nvbPostView").style.display = "block";
  });
});

/* ==================================================================
   크롬 — 복구 → 노스텔지아 비스타
   ================================================================== */
const restoreBar=document.getElementById("restoreBar");
const nvSite=document.getElementById("nvSite");
function showNvSite(){
  restoreBar.style.display="none";
  nvSearchView.classList.remove("on");
  nvBlogView.classList.remove("on");
  nvSite.classList.add("on");
  document.getElementById("chromeTabName").textContent="Nostalgia Vista";
  document.getElementById("chromeUrl").textContent="nostalgiavista.com/consult";
}
document.getElementById("restoreBtn").addEventListener("click", ()=>{
  showNvSite();
  if(!restoreSaidOnce){
    restoreSaidOnce = true;
    say("유진님이 접속했던 사이트인가?");
  }
});
let restoreSaidOnce = false;
function openNvViaChrome(){
  document.getElementById("chromeWin").classList.add("on");
  bringFront("chromeWin");
  showNvSite();
}

/* 탭 전환 */
let lookupSaidOnce = false;
document.querySelectorAll(".nv-tab").forEach(t=>{
  t.addEventListener("click", ()=>{
    document.querySelectorAll(".nv-tab").forEach(x=>x.classList.remove("on"));
    document.querySelectorAll(".nv-panel").forEach(x=>x.classList.remove("on"));
    t.classList.add("on");
    document.getElementById(t.dataset.tab==="apply"?"nvApply":"nvLookup").classList.add("on");
    if(t.dataset.tab==="lookup" && !lookupSaidOnce){
      lookupSaidOnce = true;
      say([
        "예약번호를 알면 좋을텐데...",
        "지금은 모르겠다.",
        "검색 기록을 뒤져볼까.",
      ]);
    }
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
const EMMA_APP = {
  name:"Emma", age:"27", birth:"1999.04.18", sleep:"3시간",
  dream:"행복했던 언니의 생일파티. 그때 그 시절로 돌아가 언니를 만나고 싶어요.",
  reason:"행복했던 언니의 생일파티. 그때 그 시절로 돌아가 언니를 만나고 싶어요.",
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
  else if(code==="2678"){ app=EMMA_APP; status="처리 완료 — 동행 승인됨"; }
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
function renderOOO(){
  document.getElementById("slHead").textContent = "OOO";
  slLog.innerHTML = "";
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
  document.getElementById("slOOO").classList.add("active");
  document.getElementById("slLoading").classList.remove("active");
}
renderOOO();
/* 로딩 안 되는 DM 클릭 */
document.getElementById("slLoading").addEventListener("click", ()=>{
  document.getElementById("slHead").textContent="…";
  slLog.innerHTML=`<div class="sl-fail">대화를 불러올 수 없습니다.<br>네트워크 상태를 확인하거나 잠시 후 다시 시도하세요.</div>`;
  document.getElementById("slOOO").classList.remove("active");
  document.getElementById("slLoading").classList.add("active");
});
document.getElementById("slOOO").addEventListener("click", renderOOO);

/* ==================================================================
   완료 조건 → 진동 → 맥북 덮기 → 미니게임
   ================================================================== */
let ringShakeTimer = null;
function checkAllVisited(){
  if(macVisit!==1) return;   // 2차 방문은 슬랙 클릭으로 별도 종료
  if(visited.lookup){
    setTimeout(()=>{
      document.getElementById("vibeIcon").classList.add("on");
      startRingShake();
    }, 2500);
  }
}
function startRingShake(){
  if(ringShakeTimer) return;
  ringShakeTimer = setInterval(()=>{
    const cw = document.getElementById("chromeWin");
    // 노스텔지아 비스타 창이 열려있을 때만 흔들림
    if(cw.classList.contains("on") && document.getElementById("nvSite").classList.contains("on")){
      cw.classList.remove("ringing"); void cw.offsetWidth; cw.classList.add("ringing");
    }
  }, 1800);
}
function stopRingShake(){
  if(ringShakeTimer){ clearInterval(ringShakeTimer); ringShakeTimer=null; }
  document.getElementById("chromeWin").classList.remove("ringing");
}
document.getElementById("vibeAct").addEventListener("click", ()=>{
  stopRingShake();
  nvlog("desk_done", {});
  save("storylab_progress",{stage:"minigame", t:Date.now()});
  const f=document.getElementById("fade");
  f.style.opacity=1;
  setTimeout(()=>{ location.href="minigames.html"; }, 1100);
});

/* ---------- 진입 독백 ---------- */
if(macVisit===1){
  say([
    "어라. 누가 맥북을 두고 갔다. 유진님 같은데...",
    "짐이 남겨져 있다.",
    "책상 위에 핸드폰과 맥북, 그리고 텀블러가 놓여 있다.",
  ]);
}

/* 나비 착지 시 날갯짓 느려짐 */
document.addEventListener("animationend", e=>{
  if(e.target.id==="bfly") e.target.classList.add("landed");
});
