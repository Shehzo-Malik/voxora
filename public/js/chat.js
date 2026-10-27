/* chats */
function newChat(){if(busy&&controller)controller.abort("user");cur={id:Date.now()+"",title:"New chat",ts:Date.now(),msgs:[]};clearView();$("welcome").style.display="";renderHist()}
function clearView(){[...chat.children].forEach(c=>{if(c.id!=="welcome")c.remove()})}
function openChat(id){const c=chats.find(x=>x.id===id);if(!c)return;if(busy&&controller)controller.abort("user");cur=c;clearView();$("welcome").style.display="none";c.msgs.forEach(m=>{if(m.role==="user")addUserBubble(m.text,m.names,m.thumbs);else{const u=addAiBubble();u.body.innerHTML=renderMarkdown(m.text);(m.imgs||[]).forEach(i=>u.body.appendChild(imgEl(i)))}});scrollDown(true);renderHist();closeSideMobile()}
function renderHist(){$("hist").innerHTML=chats.slice().sort((a,b)=>b.ts-a.ts).map(c=>'<div class="hi'+(cur&&cur.id===c.id?" on":"")+'" onclick="openChat(\''+c.id+'\')"><i class="fa-regular fa-message"></i><span>'+esc(c.title)+'</span><button aria-label="Delete chat" onclick="event.stopPropagation();delChat(\''+c.id+'\')"><i class="fa-solid fa-trash-can"></i></button></div>').join("")}
function delChat(id){chats=chats.filter(c=>c.id!==id);save();if(cur&&cur.id===id)newChat();else renderHist()}

/* input + files */
ta.addEventListener("input",function(){this.style.height="auto";this.style.height=this.scrollHeight+"px"});
ta.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(!busy)sendMessage()}});
ta.addEventListener("paste",e=>{const f=[...(e.clipboardData&&e.clipboardData.files||[])];if(f.length){e.preventDefault();addFiles(f)}});
$("fi").addEventListener("change",e=>{addFiles([...e.target.files]);e.target.value=""});
function toggleImg(){imgMode=!imgMode;$("imb").classList.toggle("on",imgMode);toast(imgMode?"Image mode on: describe the image you want":"Image mode off")}
const TXT=/\.(txt|md|csv|json|log|py|js|ts|html|css|yml|yaml|sh|tf|xml)$/i;
function readFile(f){return new Promise((res,rej)=>{const txt=/^text\/|json|xml/.test(f.type)||TXT.test(f.name),okb=txt||/^(image|audio|video)\//.test(f.type)||f.type==="application/pdf";
if(!okb)return rej(new Error(f.name+" is not supported. Use images, PDF or text files."));if(f.size>15e6)return rej(new Error(f.name+" is too large (max 15 MB)."));
const r=new FileReader();r.onerror=()=>rej(new Error("Could not read "+f.name));
if(txt){r.onload=()=>res({name:f.name,part:{text:"[Attached file: "+f.name+"]\n"+String(r.result).slice(0,400000)}});r.readAsText(f)}
else{r.onload=()=>{const u=r.result;res({name:f.name,thumb:f.type.startsWith("image/")?u:null,part:{inline_data:{mime_type:f.type,data:u.split(",")[1]}}})};r.readAsDataURL(f)}})}
async function addFiles(fs){for(const f of fs){try{files.push(await readFile(f))}catch(e){toast(e.message)}}renderPending()}
function renderPending(){$("pf").innerHTML=files.map((f,i)=>'<span class="fc"><i class="fa-solid fa-paperclip"></i>'+esc(f.name)+' <button aria-label="Remove file" onclick="files.splice('+i+',1);renderPending()">&times;</button></span>').join("")}
function onSendClick(){if(busy){controller&&controller.abort("user")}else sendMessage()}
function quickAsk(t){ta.value=t;sendMessage()}
function setBusy(s){busy=s;$("send-icon").className=s?"fa-solid fa-stop":"fa-solid fa-arrow-up"}
chat.addEventListener("scroll",()=>{stuck=chat.scrollHeight-chat.scrollTop-chat.clientHeight<140});
function scrollDown(f){if(f||stuck)chat.scrollTop=chat.scrollHeight}

/* rendering */
function renderMarkdown(text){const blocks=[];let t=text.replace(/```(\w*)\n?([\s\S]*?)(```|$)/g,function(m,lang,code){blocks.push('<div class="code-block"><div class="code-head"><span>'+esc(lang||"code")+'</span><button class="copy-btn" type="button">Copy</button></div><pre><code>'+esc(code.replace(/\n$/,""))+"</code></pre></div>");return "\u0000"+(blocks.length-1)+"\u0000"});
t=esc(t).replace(/`([^`\n]+)`/g,'<code class="inline-code">$1</code>').replace(/\*\*([^*\n]+)\*\*/g,"<strong>$1</strong>").replace(/^#{1,3}\s+(.+)$/gm,'<strong style="display:block;margin-top:6px">$1</strong>').replace(/^\s*[-*]\s+(.+)$/gm,'<span style="display:block;padding-left:16px">&bull; $1</span>').replace(/\n/g,"<br>").replace(/<\/span><br>/g,"</span>").replace(/<\/strong><br>/g,"</strong>");
return t.replace(/\u0000(\d+)\u0000(<br>)?/g,(m,i)=>blocks[i])}
chat.addEventListener("click",function(e){const b=e.target.closest(".copy-btn");if(!b)return;navigator.clipboard.writeText(b.closest(".code-block").querySelector("pre").textContent).then(()=>{b.textContent="Copied!";setTimeout(()=>b.textContent="Copy",1500)})});
function addUserBubble(text,names,thumbs){const w=document.createElement("div");w.className="m u";w.innerHTML='<div class="bub msg-body" dir="auto"></div>';const b=w.firstChild;(thumbs||[]).forEach(s=>{const i=document.createElement("img");i.className="th";i.src=s;b.appendChild(i)});(names||[]).forEach(n=>{const s=document.createElement("span");s.className="fc";s.innerHTML='<i class="fa-solid fa-paperclip"></i>'+esc(n);b.appendChild(s)});if(text){const d=document.createElement("div");d.textContent=text;b.appendChild(d)}chat.appendChild(w);scrollDown(true)}
function addAiBubble(){const w=document.createElement("div");w.className="m";w.innerHTML='<div class="av"></div><div class="bub"><div class="msg-body" dir="auto"><span class="dots"><span></span><span></span><span></span></span></div><div class="meta"></div></div>';chat.appendChild(w);scrollDown(true);return{body:w.querySelector(".msg-body"),meta:w.querySelector(".meta")}}
function imgEl(i){const d=document.createElement("div");if(i.url){const u=esc(i.url);d.innerHTML='<img class="gen" alt="Generated image" src="'+u+'"><a class="dl" href="'+u+'" target="_blank" rel="noopener" onclick="dlImg(this.href,event)"><i class="fa-solid fa-download"></i> Download</a>';return d}
const src="data:"+i.mime+";base64,"+i.data;d.innerHTML='<img class="gen" alt="Generated image" src="'+src+'"><a class="dl" download="voxora-image.png" href="'+src+'"><i class="fa-solid fa-download"></i> Download</a>';return d}

/* build request contents */
function buildContents(){let ms=cur.msgs.slice(-MAX_HISTORY);while(ms.length&&ms[0].role!=="user")ms.shift();
return ms.map(m=>({role:m.role,parts:(m.parts||[]).concat([{text:m.text||(m.imgs?"[image generated]":"(empty)")}])}))}
function sysText(){return SYSTEM+(extraCtx?"\n\n"+extraCtx:"")+(mem.length?"\n\nSaved memories about this user (use them when relevant):\n- "+mem.join("\n- "):"")}

