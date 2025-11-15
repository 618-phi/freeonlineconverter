const B=document.getElementById("file-input"),o=document.getElementById("upload-zone"),F=document.getElementById("upload-prompt"),g=document.getElementById("file-info"),m=document.getElementById("progress"),f=document.getElementById("complete"),z=document.getElementById("file-name"),P=document.getElementById("file-size"),T=document.getElementById("remove-file"),v=document.getElementById("mode-convert"),y=document.getElementById("mode-compress"),w=document.getElementById("convert-opts"),x=document.getElementById("compress-opts"),C=document.getElementById("format"),k=document.getElementById("quality"),$=document.getElementById("quality-val"),S=document.getElementById("compress-level"),q=document.getElementById("convert-btn"),U=document.getElementById("compress-btn"),O=document.getElementById("download-btn"),W=document.getElementById("reset-btn"),E=document.getElementById("savings");let d=null,r=null,u="convert";o.addEventListener("click",e=>{!o.classList.contains("has-file")&&e.target!==T&&B.click()});B.addEventListener("change",e=>{const t=e.target.files;t&&t.length>0&&R(t[0])});o.addEventListener("dragover",e=>{e.preventDefault(),o.classList.contains("has-file")||o.classList.add("drag-over")});o.addEventListener("dragleave",()=>{o.classList.remove("drag-over")});o.addEventListener("drop",e=>{if(e.preventDefault(),o.classList.remove("drag-over"),!o.classList.contains("has-file")){const t=e.dataTransfer?.files;t&&t.length>0&&R(t[0])}});function R(e){d=e,z.textContent=e.name,P.textContent=K(e.size);const t=document.getElementById("image-formats"),n=document.getElementById("doc-formats"),s=e.type.startsWith("image/"),i=e.type.includes("pdf")||e.type.includes("document")||e.type.includes("word")||e.type.includes("text")||e.name.endsWith(".doc")||e.name.endsWith(".docx")||e.name.endsWith(".txt")||e.name.endsWith(".md");s?(t.style.display="",n.style.display="none",t.querySelector("option").selected=!0):i?(t.style.display="none",n.style.display="",n.querySelector("option").selected=!0):(t.style.display="",n.style.display=""),o.classList.add("has-file"),F.classList.add("hidden"),g.classList.remove("hidden")}T.addEventListener("click",e=>{e.stopPropagation(),L()});v.addEventListener("click",()=>{u="convert",v.classList.add("active"),y.classList.remove("active"),w.classList.remove("hidden"),x.classList.add("hidden")});y.addEventListener("click",()=>{u="compress",y.classList.add("active"),v.classList.remove("active"),x.classList.remove("hidden"),w.classList.add("hidden")});k.addEventListener("input",e=>{$.textContent=e.target.value+"%"});q.addEventListener("click",async()=>{if(d){g.classList.add("hidden"),m.classList.remove("hidden");try{const e=C.value.toLowerCase(),t=parseInt(k.value)/100;r=await j(d,e,t),m.classList.add("hidden"),f.classList.remove("hidden")}catch(e){alert("Error: "+e),L()}}});U.addEventListener("click",async()=>{if(d){g.classList.add("hidden"),m.classList.remove("hidden");try{const e=parseInt(S.value)/100;r=await j(d,"jpeg",e);const t=d.size,n=r.size,s=Math.round((1-n/t)*100);E.textContent=`File size reduced by ${s}%`,E.classList.remove("hidden"),m.classList.add("hidden"),f.classList.remove("hidden")}catch(e){alert("Error: "+e),L()}}});O.addEventListener("click",()=>{if(!r||!d)return;const e=URL.createObjectURL(r),t=document.createElement("a");t.href=e;const n=u==="convert"?C.value.toLowerCase():"jpg",s=d.name.replace(/\.[^/.]+$/,"");t.download=`${s}_${u}.${n}`,t.click(),URL.revokeObjectURL(e)});W.addEventListener("click",L);function L(){d=null,r=null,B.value="",o.classList.remove("has-file"),f.classList.add("hidden"),m.classList.add("hidden"),g.classList.add("hidden"),F.classList.remove("hidden"),E.classList.add("hidden");const e=document.getElementById("image-formats"),t=document.getElementById("doc-formats");e.style.display="",t.style.display="",u="convert",v.classList.add("active"),y.classList.remove("active"),w.classList.remove("hidden"),x.classList.add("hidden")}async function j(e,t,n){return e.type.startsWith("image/"),e.type.includes("pdf")||e.type.includes("document")||e.type.includes("word")||e.type.includes("text")?G(e,t):new Promise((i,a)=>{const l=new FileReader;l.onload=D=>{const c=new Image;c.onload=()=>{const p=document.createElement("canvas");p.width=c.width,p.height=c.height;const I=p.getContext("2d");if(!I){a(new Error("Could not get canvas context"));return}I.drawImage(c,0,0),p.toBlob(b=>{b?i(b):a(new Error("Failed to convert image"))},`image/${t==="jpg"?"jpeg":t}`,n)},c.onerror=()=>a(new Error("Failed to load image")),c.src=D.target?.result},l.onerror=()=>a(new Error("Failed to read file")),l.readAsDataURL(e)})}async function G(e,t){if(t.toLowerCase()==="txt")return h(e);if(t.toLowerCase()==="pdf")return M(e);if(t.toLowerCase()==="html")return A(e);if(t.toLowerCase()==="markdown")return H(e);throw new Error("Unsupported document conversion")}async function h(e){return new Promise((t,n)=>{const s=new FileReader;s.onload=i=>{const a=i.target?.result,l=new Blob([a],{type:"text/plain"});t(l)},s.onerror=()=>n(new Error("Failed to read file")),s.readAsText(e)})}async function M(e){const n=await(await h(e)).text(),s=`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${n.length} >>
stream
BT /F1 12 Tf 50 750 Td (${n.replace(/\n/g,") Tj T* (")}) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
${350+n.length}
%%EOF`;return new Blob([s],{type:"application/pdf"})}async function A(e){const s=`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Converted Document</title>
</head>
<body>
<pre>${await(await h(e)).text()}</pre>
</body>
</html>`;return new Blob([s],{type:"text/html"})}async function H(e){const s=`# Converted Document

${await(await h(e)).text()}`;return new Blob([s],{type:"text/markdown"})}function K(e){return e<1024?e+" B":e<1024*1024?(e/1024).toFixed(1)+" KB":(e/(1024*1024)).toFixed(1)+" MB"}
