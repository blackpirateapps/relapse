import{j as e}from"./index-Dbow32nk.js";const r=()=>e.jsxDEV(e.Fragment,{children:[e.jsxDEV("div",{className:"forest-bg"},void 0,!1,{fileName:"/home/dog/git/relapse/src/components/ForestBackground.jsx",lineNumber:6,columnNumber:7},void 0),e.jsxDEV("style",{jsx:!0,global:!0,children:`
        .forest-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          --background-start: #0d1a26;
          --background-mid: #1a3a3a;
          --background-end: #001a1a;
          background-color: var(--background-start);
          background-image: 
              radial-gradient(ellipse at top, transparent, #0d1a26),
              radial-gradient(ellipse at bottom, transparent, #001a1a),
              url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><path d="M50 100 L50 0" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></svg>'),
              url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100"><path d="M40 100 L40 0" stroke="rgba(255,255,255,0.1)" stroke-width="2"/></svg>'),
              url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="100"><path d="M30 100 L30 0" stroke="rgba(255,255,255,0.15)" stroke-width="3"/></svg>'),
              linear-gradient(to bottom, var(--background-start), var(--background-mid), var(--background-end));
          background-repeat: repeat-x, repeat-x, repeat, repeat, repeat, no-repeat;
          background-position: 0 0, 0 0, 0 0, 0 0, 0 0, 0 0;
          background-size: 200% 200%, 100% 100%, 200px 100%, 150px 100%, 100px 100%, 100% 100%;
          animation: moveForest 60s linear infinite;
        }

        @keyframes moveForest {
            from { background-position: 0 0, 0 0, 0% 0, 0% 0, 0% 0, 0 0; }
            to { background-position: 0 0, 0 0, -400px 0, -450px 0, -500px 0, 0 0; }
        }

        @media (max-width: 640px) {
          .forest-bg { animation: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .forest-bg { animation: none; }
        }
      `},void 0,!1,{fileName:"/home/dog/git/relapse/src/components/ForestBackground.jsx",lineNumber:7,columnNumber:7},void 0)]},void 0,!0,{fileName:"/home/dog/git/relapse/src/components/ForestBackground.jsx",lineNumber:5,columnNumber:5},void 0);export{r as default};
