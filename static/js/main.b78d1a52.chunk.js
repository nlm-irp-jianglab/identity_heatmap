(window.webpackJsonp=window.webpackJsonp||[]).push([[0],{105:function(e,t,a){e.exports=a(124)},123:function(e,t,a){},124:function(e,t,a){"use strict";a.r(t);var l=a(0),n=a.n(l),r=a(9),c=a.n(r),o=a(17),m=(a(113),a(28)),s=a.n(m),i=a(1),d=a(29),u=a.n(d);var p=()=>{const[e,t]=Object(l.useState)([]),[a,r]=Object(l.useState)([]),[c,m]=Object(l.useState)({}),[d,p]=Object(l.useState)(!0),[b,g]=Object(l.useState)(0),[h,f]=Object(l.useState)(100),[E,v]=Object(l.useState)("#08306b"),[N,w]=Object(l.useState)("#ffffff"),[y,x]=Object(l.useState)(12),[C,S]=Object(l.useState)(12),[O,j]=Object(l.useState)("Arial"),[A,k]=Object(l.useState)(360),[D,_]=Object(l.useState)(360),R={top:50,right:80,bottom:120,left:120},B=Object(l.useCallback)(()=>i.e().domain([b,h]).range([E,N]),[b,h,E,N]),z=Object(l.useCallback)(()=>{if(i.f("#heatmap").selectAll("*").remove(),i.f("#legend-svg").selectAll("*").remove(),!e.length||a.length<2)return;const t=e[0].slice(1),l={};t.forEach((e,t)=>{l[e]=t+1});const n=B(),r=i.f("#heatmap").append("svg").attr("width",A+R.left+R.right).attr("height",D+R.top+R.bottom).append("g").attr("transform","translate(".concat(R.left,", ").concat(R.top,")")),o=a.map(e=>c[e]||e),m=i.d().range([0,A]).domain(o).padding(.05),s=i.d().range([0,D]).domain(o).padding(.05),u=[];for(let i=0;i<a.length;i++)for(let t=0;t<a.length;t++){const n=a[i],r=a[t],o=l[n],m=l[r];if(o&&m){const a=parseFloat(e[o][m])||0;u.push({rowOriginal:n,colOriginal:r,rowDisplay:c[n]||n,colDisplay:c[r]||r,value:a,i:i,j:t})}}const p=u.filter(e=>d?e.i<=e.j:e.i>=e.j);r.selectAll(".cell").data(p).enter().append("rect").attr("x",e=>m(e.colDisplay)).attr("y",e=>s(e.rowDisplay)).attr("width",m.bandwidth()).attr("height",s.bandwidth()).style("fill",e=>n(e.value)).style("stroke","#fff"),r.selectAll(".cell-text").data(p).enter().append("text").attr("x",e=>m(e.colDisplay)+m.bandwidth()/2).attr("y",e=>s(e.rowDisplay)+s.bandwidth()/2).attr("text-anchor","middle").attr("alignment-baseline","middle").attr("font-size",y).attr("font-family",O).attr("fill",e=>(e=>{const t=i.b(e);return t?.299*t.r+.587*t.g+.114*t.b>150?"black":"white":"black"})(n(e.value))).text(e=>e.value.toFixed(1)),r.selectAll(".x-label").data(o).enter().append("text").attr("x",e=>m(e)+m.bandwidth()/2).attr("y",D+40).attr("transform",e=>"rotate(45, ".concat(m(e)+m.bandwidth()/2,", ").concat(D+40,")")).attr("text-anchor","middle").attr("font-size",C).attr("font-family",O).text(e=>e),r.selectAll(".y-label").data(o).enter().append("text").attr("x",-10).attr("y",e=>s(e)+s.bandwidth()/2).attr("text-anchor","end").attr("font-size",C).attr("font-family",O).text(e=>e);const g=i.f("#legend-svg").attr("width",80).attr("height",250),f=i.e().domain([b,h]).range([200,0]),E=i.a(f).ticks(5);g.append("g").attr("transform","translate(50,20)").call(E),g.selectAll("rect").data(i.c(b,h,(h-b)/100)).enter().append("rect").attr("x",30).attr("y",e=>f(e)+20).attr("width",20).attr("height",2).style("fill",e=>n(e))},[e,a,c,d,b,h,y,C,O,A,D,R,B]);Object(l.useEffect)(()=>{z()},[z]);const F=Object(l.useRef)(null),G=e=>{e.preventDefault()};return n.a.createElement("div",{className:"container mt-4"},n.a.createElement("h2",{className:"mb-3"},"Pairwise Identity Heatmap (Single Order for Rows & Columns)"),n.a.createElement("div",{className:"row"},n.a.createElement("div",{className:"col-md-4"},n.a.createElement("div",{className:"row mb-2"},n.a.createElement("div",{className:"col"},n.a.createElement("label",{className:"form-label"},"Heatmap Width"),n.a.createElement("input",{type:"number",className:"form-control",value:A,onChange:e=>k(Number(e.target.value))})),n.a.createElement("div",{className:"col"},n.a.createElement("label",{className:"form-label"},"Heatmap Height"),n.a.createElement("input",{type:"number",className:"form-control",value:D,onChange:e=>_(Number(e.target.value))}))),n.a.createElement("hr",null),n.a.createElement("div",{className:"row mb-2"},n.a.createElement("div",{className:"col"},n.a.createElement("label",{className:"form-label"},"Domain Start"),n.a.createElement("input",{type:"number",className:"form-control",value:b,onChange:e=>g(Number(e.target.value))})),n.a.createElement("div",{className:"col"},n.a.createElement("label",{className:"form-label"},"Domain End"),n.a.createElement("input",{type:"number",className:"form-control",value:h,onChange:e=>f(Number(e.target.value))}))),n.a.createElement("hr",null),n.a.createElement("div",{className:"row mb-2"},n.a.createElement("div",{className:"col d-flex align-items-center"},n.a.createElement("label",{className:"form-label me-2"},"Color Start"),n.a.createElement("input",{type:"color",className:"form-control form-control-color",value:E,onChange:e=>v(e.target.value)})),n.a.createElement("div",{className:"col d-flex align-items-center"},n.a.createElement("label",{className:"form-label me-2"},"Color End"),n.a.createElement("input",{type:"color",className:"form-control form-control-color",value:N,onChange:e=>w(e.target.value)}))),n.a.createElement("hr",null),n.a.createElement("div",{className:"row mb-3"},n.a.createElement("div",{className:"col"},n.a.createElement("label",{className:"form-label"},"Font Size"),n.a.createElement("input",{type:"number",className:"form-control",value:y,onChange:e=>x(Number(e.target.value))})),n.a.createElement("div",{className:"col"},n.a.createElement("label",{className:"form-label"},"Label Size"),n.a.createElement("input",{type:"number",className:"form-control",value:C,onChange:e=>S(Number(e.target.value))})),n.a.createElement("div",{className:"col"},n.a.createElement("label",{className:"form-label"},"Font Family"),n.a.createElement("select",{className:"form-select",value:O,onChange:e=>j(e.target.value)},n.a.createElement("option",{value:"Arial"},"Arial"),n.a.createElement("option",{value:"Verdana"},"Verdana"),n.a.createElement("option",{value:"Times New Roman"},"Times New Roman"),n.a.createElement("option",{value:"Courier New"},"Courier New")))),n.a.createElement("hr",null),n.a.createElement("div",{className:"row mb-3"},n.a.createElement("div",{className:"col d-flex"},n.a.createElement("button",{className:"btn btn-secondary me-2",onClick:()=>p(!d)},"Toggle Upper/Lower"),n.a.createElement("button",{className:"btn btn-primary",onClick:()=>{const e=document.querySelector("#heatmap svg"),t=document.getElementById("legend-container"),a=document.getElementById("legend-svg");if(!e||!a||!t)return;const l=e.getBoundingClientRect(),n=t.getBoundingClientRect(),r=n.left-l.left,c=n.top-l.top,o=Math.max(l.width,r+n.width),m=Math.max(l.height,c+n.height),s=document.createElementNS("http://www.w3.org/2000/svg","svg");s.setAttribute("xmlns","http://www.w3.org/2000/svg"),s.setAttribute("width",Math.ceil(o)),s.setAttribute("height",Math.ceil(m));const i=e.cloneNode(!0),d=a.cloneNode(!0);s.appendChild(i),d.setAttribute("x",r),d.setAttribute("y",c),s.appendChild(d);const u=(new XMLSerializer).serializeToString(s),p=new Blob([u],{type:"image/svg+xml;charset=utf-8"}),b=URL.createObjectURL(p),g=document.createElement("a");g.href=b,g.download="heatmap_with_legend.svg",document.body.appendChild(g),g.click(),document.body.removeChild(g)}},"Download SVG"))),n.a.createElement("hr",null),a.length>0&&n.a.createElement(n.a.Fragment,null,n.a.createElement("h5",null,"Reorder (Rows & Columns)"),n.a.createElement(()=>n.a.createElement("ul",{className:"list-group",style:{marginBottom:"1em"}},a.map((e,t)=>{const l=c[e]||e;return n.a.createElement("li",{key:e,className:"list-group-item",draggable:!0,onDragStart:()=>(e=>{F.current=e})(t),onDragOver:G,onDrop:e=>((e,t)=>{e.preventDefault();const l=F.current;if(null===l||l===t)return;const n=((e,t,a)=>{const l=[...e],[n]=l.splice(t,1);return l.splice(a,0,n),l})(a,l,t);r(n),F.current=null})(e,t),style:{cursor:"move"}},l)})),null)),n.a.createElement("hr",null),a.length>0&&n.a.createElement("div",null,n.a.createElement("h5",null,"Rename Sequences"),a.map(e=>n.a.createElement("div",{key:e,className:"mb-1 d-flex align-items-center"},n.a.createElement("label",{className:"me-1"},e," \u2192"),n.a.createElement("input",{type:"text",className:"form-control",style:{maxWidth:"300px"},value:c[e]||e,onChange:t=>((e,t)=>{m(a=>Object(o.a)(Object(o.a)({},a),{},{[e]:t}))})(e,t.target.value)}))))),n.a.createElement("div",{className:"col-md-8",style:{top:"10px",right:"10px",background:"white",padding:"5px",borderRadius:"5px",border:"1px solid #ccc"}},n.a.createElement("div",{className:"mb-3"},n.a.createElement(s.a,{onFileLoaded:e=>{const a=e.filter(e=>e.some(e=>""!==e));if(t(a),a.length>1){const e=a[0].slice(1);r(e)}}})),n.a.createElement("div",{id:"heatmap"}))),a.length>1&&n.a.createElement(u.a,null,n.a.createElement("div",{id:"legend-container",style:{position:"absolute",top:"10px",right:"10px",background:"white",padding:"5px",borderRadius:"5px",border:"1px solid #ccc"}},n.a.createElement("h5",null,"Legend"),n.a.createElement("svg",{id:"legend-svg"}))))};var b=function(){return n.a.createElement(p,{matrixData:(e="\n    ,ABV59991.1,GCA_900167205.1_00702,GCA_005121165.3_00523,GCA_900167205.1_00778\n    ABV59991.1,100.0,14.0,17.8,15.1\n    GCA_900167205.1_00702,14.0,100.0,39.5,10.7\n    GCA_005121165.3_00523,17.8,39.5,100.0,9.6\n    GCA_900167205.1_00778,15.1,10.7,9.6,100.0\n  ",e.trim().split("\n").map(e=>e.split(",").map(e=>e.trim())))});var e};a(123);c.a.render(n.a.createElement(n.a.StrictMode,null,n.a.createElement(b,null)),document.getElementById("root"))}},[[105,1,2]]]);
//# sourceMappingURL=main.b78d1a52.chunk.js.map