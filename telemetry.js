/* ==================================================================
   모니터링 전송 모듈
   NV_LOG_URL에 Google Apps Script 웹앱 URL을 넣으면
   플레이어의 답변/진행이 실시간으로 구글 시트에 기록됩니다.
   비워두면 아무것도 전송하지 않으며 게임은 정상 작동합니다.
   ================================================================== */
const NV_LOG_URL = "https://script.google.com/macros/s/AKfycby8jMMkReVd1IPGbMZP6ZEy23GX_bb87onpCQsZJzoKWzNuHlFPMvCG9ftbLZ1ZQYOH/exec";   // ← 여기에 웹앱 URL 붙여넣기 (모니터링_설정법.md 참고)

function nvlog(type, data){
  try{
    if(!NV_LOG_URL) return;
    let player = "";
    try{ player = (JSON.parse(localStorage.getItem("storylab_player")||"null")||{}).full || ""; }catch(e){}
    fetch(NV_LOG_URL, {
      method: "POST",
      mode: "no-cors",                       // 응답을 읽지 않음 (전송만)
      headers: { "Content-Type": "text/plain" },  // preflight 회피
      body: JSON.stringify({
        t: new Date().toISOString(),
        player, type, data: data || {},
        page: location.pathname.split("/").pop(),
      }),
      keepalive: true,
    }).catch(()=>{});
  }catch(e){}
}
