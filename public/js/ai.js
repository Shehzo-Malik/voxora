/* free map data (OpenStreetMap) - works without any paid Google Maps plan */
const LOC_RE=/\b(where is|where's|where are|located|location|address of|kahan|kahaan|kidhar|distance|how far|route|directions?|nearest|nearby|fasla|doori|kitna door|map)\b/i;
const geoCache={};
async function geocode(q){if(geoCache[q])return geoCache[q];const r=await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=en&q="+encodeURIComponent(q),{signal:AbortSignal.timeout(8000)});if(!r.ok)return null;const p=(await r.json())[0];if(!p)return null;return geoCache[q]={name:p.display_name,lat:+p.lat,lon:+p.lon}}
function cleanPlace(t){return t.replace(/[?.!]+$/,"").replace(/\b(where is|where's|where are|what is the location of|location of|address of|tell me about|please|pls|plz|located|location|kahan|kahaan|kidhar|hai|hay|batao|btao|bata|ka|ki|ke)\b/ig," ").replace(/\s+/g," ").trim()}
function km(m){return (m/1000).toFixed(m<10000?1:0)+" km"}
function hav(a,b){const R=6371,r=x=>x*Math.PI/180,dl=r(b.lat-a.lat),dn=r(b.lon-a.lon),h=Math.sin(dl/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))*1000}
async function geoContext(text){
const two=text.match(/\bfrom\s+(.{2,60}?)\s+to\s+(.{2,60}?)[?.!]*$/i)||text.match(/\bbetween\s+(.{2,60}?)\s+and\s+(.{2,60}?)[?.!]*$/i)||text.match(/^(.{2,50}?)\s+se\s+(.{2,50}?)\s+(?:tak|ka fasla|ka distance|kitna)/i);
if(two){const[a,b]=await Promise.all([geocode(two[1].trim()),geocode(two[2].trim())]);if(!a||!b)return"";
let road="";try{const r=await fetch("https://router.project-osrm.org/route/v1/driving/"+a.lon+","+a.lat+";"+b.lon+","+b.lat+"?overview=false",{signal:AbortSignal.timeout(8000)});const j=await r.json();const rt=j.routes&&j.routes[0];if(rt)road="Driving distance by road: "+km(rt.distance)+", approximate driving time: "+Math.round(rt.duration/60)+" minutes. "}catch(e){}
return "MAP DATA (OpenStreetMap, use it, do not guess): From "+a.name+" to "+b.name+". "+road+"Straight-line distance: "+km(hav(a,b))+". Answer in 1-2 short sentences with the distance and travel time only. Give the Google Maps directions link ONLY if the user asks for a link, map or directions: https://www.google.com/maps/dir/?api=1&origin="+a.lat+","+a.lon+"&destination="+b.lat+","+b.lon}
const q=cleanPlace(text);if(q.length<2)return"";const p=await geocode(q);if(!p)return"";
return "MAP DATA (OpenStreetMap, use it, do not guess): the place matched for \""+q+"\" is: "+p.name+". Answer in 1-2 short sentences saying where it is (city, district, province, country). Do NOT print coordinates. Give the Google Maps link ONLY if the user asks for a link, map or directions: https://www.google.com/maps/search/?api=1&query="+p.lat+","+p.lon+" . If this does not look like the place the user means, say so briefly."}

/* free services (no key needed) */
function freeImage(prompt,signal){return new Promise((res,rej)=>{const u="https://image.pollinations.ai/prompt/"+encodeURIComponent(prompt.slice(0,800))+"?width=1024&height=1024&nologo=true&model=flux&seed="+Math.floor(Math.random()*1e9);const im=new Image();const t=setTimeout(()=>{im.onload=im.onerror=null;im.src="";rej(new Error("timeout"))},60000);im.onload=()=>{clearTimeout(t);res(u)};im.onerror=()=>{clearTimeout(t);rej(new Error("failed"))};if(signal)signal.addEventListener("abort",()=>{clearTimeout(t);im.onload=im.onerror=null;im.src="";rej(new Error("aborted"))},{once:true});im.src=u})}
function buildFreeMsgs(){let ms=cur.msgs.slice(-MAX_HISTORY);while(ms.length&&ms[0].role!=="user")ms.shift();
return [{role:"system",content:sysText()}].concat(ms.map(m=>{const ps=m.parts||[];let c=ps.map(p=>p.text||"").filter(Boolean).join("\n\n");if(ps.some(p=>p.inline_data))c+="\n[An attached image/PDF could not be read in free mode]";c=(c+"\n\n"+(m.text||(m.imgs&&m.imgs.length?"[image generated]":""))).trim();return{role:m.role==="model"?"assistant":"user",content:c||"(empty)"}}))}
async function freeChat(signal){const r=await fetch("https://text.pollinations.ai/openai",{method:"POST",signal:signal,headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"openai",messages:buildFreeMsgs(),temperature:.3})});
if(!r.ok)throw new Error("The free backup service is unavailable ("+r.status+")."+(hasG()?" Please try again.":" Voxora is not connected to Gemini: set PROXY_URL in config.js."));const j=await r.json();return(j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content)||""}
async function dlImg(u,ev){ev.preventDefault();try{const b=await(await fetch(u)).blob();const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="voxora-image.png";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}catch(e){window.open(u,"_blank","noopener")}}

/* send flow */
async function sendMessage(){
const text=ta.value.trim();if((!text&&!files.length)||busy)return;
if(!hasG()&&!FREE_CHAT&&!FREE_IMAGES){toast("Voxora is not configured yet. The owner needs to add the API key in the CONFIG block.");return}
if(FORGET_RE.test(text)){mem=[];saveMem();toast("Memory cleared")}else if(MEM_RE.test(text))remember(text);
const wantImg=imgMode||IMG_RE.test(text),att=files;files=[];renderPending();if(imgMode){imgMode=false;$("imb").classList.remove("on")}
const msg={role:"user",text:text,names:att.map(f=>f.name),parts:att.map(f=>f.part),thumbs:att.filter(f=>f.thumb).map(f=>f.thumb)};
$("welcome").style.display="none";addUserBubble(text,msg.names,msg.thumbs);ta.value="";ta.style.height="auto";
cur.msgs.push(msg);if(cur.msgs.length===1){cur.title=(text||msg.names[0]||"New chat").slice(0,40);cur.ts=Date.now();chats.unshift(cur)}renderHist();
const ui=addAiBubble();setBusy(true);controller=new AbortController();const signal=controller.signal;
let timer;const arm=ms=>{clearTimeout(timer);timer=setTimeout(()=>controller.abort("timeout"),ms)};
const t0=performance.now();let tFirst=null,full="",imgs=[],ok=false,raf=null,srcs=[],used=model,grounded=false,tool=wantImg?null:pickTool(text,att);
const paint=fin=>{if(raf&&!fin)return;raf=requestAnimationFrame(()=>{raf=null;ui.body.innerHTML=renderMarkdown(full);imgs.forEach(i=>ui.body.appendChild(imgEl(i)));ui.body.classList.toggle("streaming",!fin);if(fin&&srcs.length){const d=document.createElement("div");d.className="src";d.innerHTML="Sources: "+srcs.slice(0,5).map(x=>'<a target="_blank" rel="noopener" href="'+esc(x.uri)+'">'+esc(x.title)+"</a>").join("");ui.body.appendChild(d)}scrollDown()})};
let geo="",why="";if(!wantImg&&!att.length&&LOC_RE.test(text)){try{geo=await geoContext(text)}catch(e){}if(geo)tool=null;extraCtx=geo}
try{
if(wantImg){arm(150000);let done=false;
if(FREE_IMAGES){for(let a=0;a<2&&!done;a++){try{imgs.push({url:await freeImage(text||"Create an image",signal)});used="free";done=true}catch(e){if(signal.aborted)throw e}}}
if(!done){
if(!hasG())throw new Error("The free image service is busy right now. Please try again in a minute.");
const body=JSON.stringify({contents:[{role:"user",parts:(msg.parts||[]).concat([{text:text||"Create an image"}])}],generationConfig:{responseModalities:["TEXT","IMAGE"]}});
const call=()=>fetch(API_BASE+"/models/"+imgModel+":generateContent",{method:"POST",signal:signal,headers:hdr(),body:body});
const callRot=async()=>{let r;for(let i=0;i<Math.max(1,KEYS.length);i++){r=await call();if(r.status!==429)return r;rotateKey()}return r};
let res=await callRot();
if(res.status===404){const b=await findBest(/^models\/gemini-(\d+(?:\.\d+)?)-flash-image$/,signal)||await findBest(/^models\/gemini-(\d+(?:\.\d+)?)-[a-z0-9.-]*image[a-z0-9.-]*$/,signal);if(b){imgModel=b;localStorage.setItem("vx_img_model",b);res=await callRot()}}
if(!res.ok){const e=await httpError(res);if(res.status===429||res.status===403)e.message+=" Image generation may need a paid API plan.";throw e}
const d=await res.json(),parts=(d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts)||[];
for(const p of parts){const idt=p.inlineData||p.inline_data;if(idt)imgs.push({mime:idt.mimeType||idt.mime_type||"image/png",data:idt.data});else if(p.text&&!p.thought)full+=p.text}
if(!imgs.length&&!full)full=(d.promptFeedback&&d.promptFeedback.blockReason)?"This image request was blocked by the safety filter.":"No image was returned. Please try a different description."}
ok=true;paint(true)}
else{
let useFree=FREE_CHAT&&!hasG(),res=null;if(useFree)why="PROXY_URL is empty in config.js";
if(!useFree){
const call=(m,t)=>{arm(FIRST_BYTE_TIMEOUT);return fetch(API_BASE+"/models/"+m+":streamGenerateContent?alt=sse",{method:"POST",signal:signal,headers:hdr(),body:JSON.stringify(Object.assign({system_instruction:{parts:[{text:sysText()}]},contents:buildContents(),generationConfig:{temperature:.3,maxOutputTokens:2048}},t?{tools:[t]}:{}))})};
const callRot=async(m,t)=>{let r;for(let i=0;i<Math.max(1,KEYS.length);i++){r=await call(m,t);if(r.status!==429)return r;rotateKey()}return r};
const chain=[model].concat(FALLBACKS.filter(m=>m!==model));
try{
outer:for(const m of chain){for(const t of(tool?[tool,null]:[null])){res=await callRot(m,t);if(res.status!==429){used=m;grounded=!!t;break outer}}}
if(res.status===404){const b=await findBest(/^models\/gemini-(\d+(?:\.\d+)?)-flash-lite$/,signal);if(b&&b!==model){setModel(b);res=await callRot(b,tool);used=b;grounded=!!tool}}
}catch(e){if(signal.aborted||!FREE_CHAT)throw e;useFree=true;why=String(e.message||e).slice(0,140)}
if(!useFree&&!res.ok&&FREE_CHAT&&[401,403,429,500,502,503].includes(res.status)){useFree=true;let m="";try{m=((await res.clone().json()).error||{}).message||""}catch(e){}why=res.status+(m?" "+m.slice(0,140):"")}}
if(useFree){used="free";grounded=false;arm(60000);full=await freeChat(signal);tFirst=performance.now();if(!full)throw new Error("No response received. Please try again.");ok=true;paint(true)}
else{
if(!res.ok)throw await httpError(res);
const reader=res.body.getReader(),dec=new TextDecoder();let buf="",blocked="";
while(true){const c=await reader.read();if(c.done)break;arm(IDLE_TIMEOUT);buf+=dec.decode(c.value,{stream:true});let i;
while((i=buf.indexOf("\n"))>=0){const line=buf.slice(0,i).trim();buf=buf.slice(i+1);if(!line.startsWith("data:"))continue;const js=line.slice(5).trim();if(!js||js==="[DONE]")continue;let o;try{o=JSON.parse(js)}catch(e){continue}
if(o.error)throw new Error(o.error.message||"API error");if(o.promptFeedback&&o.promptFeedback.blockReason)blocked=o.promptFeedback.blockReason;const gm=o.candidates&&o.candidates[0]&&o.candidates[0].groundingMetadata;if(gm&&gm.groundingChunks)gm.groundingChunks.forEach(c=>{const x=c.web||c.maps;if(x&&/^https?:/.test(x.uri||"")&&!srcs.some(y=>y.uri===x.uri))srcs.push({uri:x.uri,title:x.title||x.uri})});
const parts=o.candidates&&o.candidates[0]&&o.candidates[0].content&&o.candidates[0].content.parts;
if(parts){for(const p of parts){if(p.text&&!p.thought){if(tFirst===null)tFirst=performance.now();full+=p.text}}paint(false)}}}
if(!full)full=blocked?"This request was blocked by the safety filter ("+blocked+").":"No response received. Please try again.";else ok=true;paint(true)}
}
}catch(error){const reason=signal.aborted?signal.reason:null;
if(reason==="user"){full=full?full+"\n\n_(stopped)_":"_(stopped)_";ok=!!full.replace("_(stopped)_","").trim()}
else if(reason==="timeout"){full=(full?full+"\n\n":"")+"Timeout: no response was received. Please check your internet connection and try again."}
else{ui.body.style.color="#fb7185";full="Error: "+error.message}paint(true)
}finally{clearTimeout(timer);extraCtx="";setBusy(false);controller=null}
if(ok){const clean=full.replace(/\n\n_\(stopped\)_$/,"");cur.msgs.push({role:"model",text:clean,imgs:imgs});save();const tot=((performance.now()-t0)/1000).toFixed(1);ui.meta.textContent=imgs.length?"Created in "+tot+"s"+(used==="free"?" • Voxora Free":""):"⚡ first word "+(tFirst?((tFirst-t0)/1000).toFixed(1):"-")+"s • total "+tot+"s • "+brand(used)+(used==="free"&&why?" • Gemini error: "+why:"")+(grounded?" • verified with "+(tool.googleMaps?"Google Maps":"Google Search"):"")}
else{cur.msgs.pop();if(!cur.msgs.length){chats=chats.filter(c=>c!==cur);renderHist()}}
scrollDown();ta.focus()}
initAuth();
