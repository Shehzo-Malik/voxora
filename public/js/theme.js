/* theme + mode + parallax */
function setAccent(n){const a=ACCENTS.find(x=>x[0]===n)||ACCENTS[0];root.style.setProperty("--a",a[1]);root.style.setProperty("--b",a[2]);localStorage.setItem("voxora_accent",a[0]);document.querySelectorAll("#tm button").forEach(b=>b.classList.toggle("on",b.dataset.n===a[0]))}
function setMode(m){root.dataset.mode=m;localStorage.setItem("voxora_mode",m);$("mi").className="fa-solid "+(m==="dark"?"fa-moon":"fa-sun")}
function toggleMode(){setMode(root.dataset.mode==="dark"?"light":"dark")}
function toggleThemeMenu(e){e.stopPropagation();$("tm").classList.toggle("open")}
addEventListener("click",()=>$("tm").classList.remove("open"));
$("tm").innerHTML=ACCENTS.map(a=>'<button data-n="'+a[0]+'" onclick="setAccent(\''+a[0]+'\')"><i style="background:linear-gradient(135deg,'+a[1]+','+a[2]+')"></i>'+a[0]+"</button>").join("");
setMode(localStorage.getItem("voxora_mode")||(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"));setAccent(localStorage.getItem("voxora_accent")||"Aurora");
let pr=0;addEventListener("pointermove",e=>{if(pr)return;pr=requestAnimationFrame(()=>{pr=0;root.style.setProperty("--mx",(e.clientX/innerWidth-.5).toFixed(2));root.style.setProperty("--my",(e.clientY/innerHeight-.5).toFixed(2))})});
function toggleSide(){document.body.classList.toggle(innerWidth<=800?"sb":"col")}
function closeSideMobile(){document.body.classList.remove("sb")}

/* model */
function updateModelUI(){$("model-label").textContent=brand(model);const s=$("model-select");if(![...s.options].some(o=>o.value===model)){const o=document.createElement("option");o.value=model;o.textContent=brand(model);s.insertBefore(o,s.firstChild)}s.value=model}
function setModel(n){model=n;localStorage.setItem("shehzal_ai_model",n);updateModelUI()}
async function onModelChange(v){if(v==="auto"){try{const b=await findBest(/^models\/gemini-(\d+(?:\.\d+)?)-flash-lite$/)||await findBest(/^models\/gemini-(\d+(?:\.\d+)?)-flash$/);if(b){setModel(b);return}toast("Could not detect a model.")}catch(e){toast("Model detection failed: "+e.message)}updateModelUI()}else setModel(v)}
updateModelUI();
async function findBest(re,signal){const res=await fetch(API_BASE+"/models?pageSize=200",{signal:signal,headers:hdr()});if(!res.ok)throw await httpError(res);const d=await res.json();
const r=(d.models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes("generateContent")).map(m=>{const x=re.exec(m.name);return x?{n:m.name.replace("models/",""),v:parseFloat(x[1]||0)}:null}).filter(Boolean).sort((a,b)=>b.v-a.v)[0];return r?r.n:null}
async function httpError(res){let msg="";try{const j=await res.json();msg=(j.error&&j.error.message)||""}catch(e){}let f=msg||("HTTP "+res.status);
if(res.status===429)f="Rate limit or free quota reached. Please wait a minute and try again.";else if(res.status===400&&/api key/i.test(msg))f="The API key is invalid. The app owner needs to update it.";else if(res.status===403)f="Access denied (403). Check the API key, its restrictions, or your region. "+msg;else if(res.status===503)f="The server is busy right now (503). Please try again.";
const e=new Error(f);e.status=res.status;return e}

