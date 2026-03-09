import{r as b,j as e}from"./index-Dbow32nk.js";function w(){return b.useEffect(()=>{const t=document.getElementById("universe");if(!t)return;t.innerHTML="";const u=30,m=window.matchMedia("(prefers-reduced-motion: reduce)").matches,p=navigator.connection?.saveData,a=window.innerWidth<640,o=m||p,h=o?a?90:140:a?220:400,f=window.innerWidth,g=window.innerHeight,s=[];if(!o)for(let n=0;n<h;++n){const l=Math.round(Math.random()*g),i=document.createElement("div"),r=1e3*(Math.random()*u+1);i.setAttribute("class",`star${3-Math.floor(r/1e3/8)}`),i.style.backgroundColor="white",t.appendChild(i);const x=i.animate([{transform:`translate3d(${f}px, ${l}px, 0)`},{transform:`translate3d(-${Math.random()*256}px, ${l}px, 0)`}],{delay:Math.random()*-r,duration:r,iterations:1e3});s.push(x)}const d=document.querySelector(".pulse"),c=!o&&d?d.animate({opacity:[.5,1],transform:["scale(0.5)","scale(1)"]},{direction:"alternate",duration:500,iterations:1/0}):null;return()=>{s.forEach(n=>n.cancel()),c&&c.cancel(),t.innerHTML=""}},[]),e.jsxDEV(e.Fragment,{children:[e.jsxDEV("div",{id:"universe"},void 0,!1,{fileName:"/home/dog/git/relapse/src/components/StarfieldWarpBackground.jsx",lineNumber:67,columnNumber:7},this),e.jsxDEV("div",{className:"pulse"},void 0,!1,{fileName:"/home/dog/git/relapse/src/components/StarfieldWarpBackground.jsx",lineNumber:68,columnNumber:7},this),e.jsxDEV("style",{jsx:!0,children:`
        body {
          background: #ffa17f;
          background: -webkit-linear-gradient(to right, #00223e, #ffa17f);
          background: linear-gradient(to right, #00223e, #ffa17f);
        }
        #universe {
          position: fixed;
          inset: 0;
          z-index: -1;
          overflow: hidden;
          pointer-events: none;
        }
        .pulse {
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
        }

        .star0 {
          height: 1px;
          width: 1px;
          opacity: 1;
          position: absolute;
        }

        .star1 {
          height: 2px;
          width: 2px;
          border-radius: 50%;
          opacity: 1;
          position: absolute;
        }

        .star2 {
          height: 3px;
          width: 3px;
          border-radius: 50%;
          opacity: 1;
          position: absolute;
        }

        .star3 {
          height: 4px;
          width: 4px;
          border-radius: 50%;
          opacity: 1;
          position: absolute;
        }
      `},void 0,!1,{fileName:"/home/dog/git/relapse/src/components/StarfieldWarpBackground.jsx",lineNumber:69,columnNumber:7},this)]},void 0,!0,{fileName:"/home/dog/git/relapse/src/components/StarfieldWarpBackground.jsx",lineNumber:66,columnNumber:5},this)}export{w as default};
