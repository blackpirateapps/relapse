import React, { useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AppContext } from '../App.jsx';
import { buyItem, updateForestTree } from '../api.js';

// --- Constants ---
const FIXED_TIMESTEP = 1000 / 50; // 50 Hz for logic
const MAX_FRAME_TIME = 250; // Max time per frame to prevent spiral of death
const TREE_VARIANTS = ['aurora', 'ember', 'verdant'];

// --- Asset Loader ---
const assetCache = new Map();
const loadImage = (src) => {
  if (assetCache.has(src)) return assetCache.get(src);
  const img = new Image();
  img.src = src;
  const promise = new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
  assetCache.set(src, { img, promise });
  return assetCache.get(src);
};

// --- Particle System ---
class Particle {
  constructor(x, y, type = 'sparkle') {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = -Math.random() * 3 - 1;
    this.life = 1.0;
    this.decay = 0.02 + Math.random() * 0.02;
    this.size = 3 + Math.random() * 4;
    this.type = type;
    if (type === 'firefly') {
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.decay = 0.002;
      this.size = 2 + Math.random() * 2;
      this.pulse = Math.random() * Math.PI * 2;
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
    if (this.type === 'firefly') {
      this.pulse += 0.1;
      this.vx += (Math.random() - 0.5) * 0.1;
      this.vy += (Math.random() - 0.5) * 0.1;
      this.vx *= 0.98;
      this.vy *= 0.98;
    } else {
      this.vy += 0.05; // gravity
    }
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    const alpha = this.type === 'firefly' ? Math.max(0, this.life * (0.5 + 0.5 * Math.sin(this.pulse))) : this.life;
    ctx.globalAlpha = alpha;
    if (this.type === 'sparkle') {
      ctx.fillStyle = '#a7f3d0';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 8;
    } else if (this.type === 'firefly') {
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 10;
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --- Helper Functions ---
const getTreeFolder = (treeType, saplingVariantMap) => {
  if (treeType && treeType.toLowerCase().includes('cactus')) return 'cactus';
  return saplingVariantMap[treeType] || TREE_VARIANTS[0];
};

const getStage = (tree, treeTypes) => {
  if (tree.status === 'withered') return 'withered';
  const now = Date.now();
  const planted = new Date(tree.purchaseDate).getTime();
  const growthHours = treeTypes[tree.treeType]?.growth_hours || 24;
  const hoursSince = Math.max(0, (now - planted) / (1000 * 60 * 60));
  if (hoursSince >= growthHours || tree.status === 'matured') return 'mature';
  if (hoursSince >= growthHours * 0.5) return 'young';
  return 'seedling';
};

const getTreeSprite = (tree, treeTypes, saplingVariantMap) => {
  const folder = getTreeFolder(tree.treeType, saplingVariantMap);
  const stage = getStage(tree, treeTypes);
  return `/img/trees/${folder}/${stage}.svg`;
};

const getTreeSize = (stage) => {
  const sizes = { seedling: 44, young: 58, mature: 80, withered: 68 };
  return sizes[stage] || 56;
};

const fallbackPosition = (tree) => {
  const base = String(tree.id || '');
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 31 + base.charCodeAt(i)) % 1000;
  }
  const normX = 0.12 + (hash % 76) / 100;
  const normY = 0.20 + ((hash * 7) % 55) / 100;
  return { x: normX, y: normY };
};

const getTreePosition = (tree) => {
  if (typeof tree.x === 'number' && typeof tree.y === 'number') {
    return { x: tree.x, y: tree.y };
  }
  return fallbackPosition(tree);
};

const formatAge = (purchaseDate) => {
  if (!purchaseDate) return 'Unknown';
  const diff = Math.max(0, Date.now() - new Date(purchaseDate).getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
};

// --- Main Component ---
function ForestPage() {
  const { state, treeTypes, refetchData } = useContext(AppContext);
  const [selectedTreeType, setSelectedTreeType] = useState(null);
  const [statusText, setStatusText] = useState('Click the forest to plant.');
  const [infoText, setInfoText] = useState('');
  const [trees, setTrees] = useState([]);
  const [isShopExpanded, setIsShopExpanded] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  const canvasRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const gameStateRef = useRef({
    trees: [],
    particles: [],
    drag: { id: null, offsetX: 0, offsetY: 0, moved: false },
    size: { width: 900, height: 560, dpr: 1 },
    time: 0,
    lastTime: 0,
    accumulator: 0,
    animationFrameId: null,
  });
  const inputRef = useRef({ pointer: null, selectedTreeType: null });

  const forest = state?.forest || [];
  const saplings = Object.values(treeTypes);

  const stats = useMemo(() => ({
    total: forest.length,
    growing: forest.filter((t) => t.status === 'growing' && new Date(t.matureDate) > new Date()).length,
    matured: forest.filter((t) => t.status === 'matured' || new Date(t.matureDate) <= new Date()).length,
    withered: forest.filter((t) => t.status === 'withered').length,
  }), [forest]);

  const saplingVariantMap = useMemo(() => {
    const map = {};
    saplings.forEach((tree, index) => {
      map[tree.id] = TREE_VARIANTS[index % TREE_VARIANTS.length];
    });
    return map;
  }, [saplings]);

  // Sync input ref with state
  useEffect(() => {
    inputRef.current.selectedTreeType = selectedTreeType;
  }, [selectedTreeType]);

  // Sync trees to game state ref
  useEffect(() => {
    gameStateRef.current.trees = trees.map(t => ({
      ...t,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.5 + Math.random() * 0.5,
    }));
  }, [trees]);

  // Sync forest data
  useEffect(() => {
    setTrees(forest);
  }, [forest]);

  // --- Asset Preloading ---
  useEffect(() => {
    const allSprites = [];
    TREE_VARIANTS.forEach(v => {
      ['seedling', 'young', 'mature', 'withered'].forEach(s => {
        allSprites.push(`/img/trees/${v}/${s}.svg`);
      });
    });
    ['seedling', 'young', 'mature', 'withered'].forEach(s => {
      allSprites.push(`/img/trees/cactus/${s}.svg`);
    });

    Promise.all(allSprites.map(src => loadImage(src).promise))
      .then(() => setAssetsLoaded(true))
      .catch(() => setAssetsLoaded(true)); // Proceed even if some fail
  }, []);

  // --- Canvas Setup ---
  const setCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = canvasWrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const width = rect.width || 900;
    const height = rect.height || (width * 10 / 16);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    gameStateRef.current.size = { width, height, dpr };
  }, []);

  // --- Rendering ---
  const drawBackground = useCallback((ctx, width, height, time) => {
    // Mystical gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#0a0f1a'); // deep night
    skyGrad.addColorStop(0.5, '#0d1f2d'); // dark teal
    skyGrad.addColorStop(1, '#1a2e1a'); // forest floor
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Ground plane with gradient
    const groundY = height * 0.75;
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
    groundGrad.addColorStop(0, 'rgba(34, 60, 34, 0.6)');
    groundGrad.addColorStop(1, 'rgba(15, 25, 15, 0.9)');
    ctx.fillStyle = groundGrad;
    ctx.beginPath();
    ctx.moveTo(0, groundY + Math.sin(time * 0.5) * 2);
    for (let x = 0; x <= width; x += 50) {
      ctx.lineTo(x, groundY + Math.sin((x * 0.02) + time * 0.5) * 4);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Ambient glow in center
    const glowGrad = ctx.createRadialGradient(width * 0.5, height * 0.6, 0, width * 0.5, height * 0.6, width * 0.6);
    glowGrad.addColorStop(0, 'rgba(52, 211, 153, 0.08)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, width, height);

    // Vignette
    const vignetteGrad = ctx.createRadialGradient(width * 0.5, height * 0.5, height * 0.3, width * 0.5, height * 0.5, Math.max(width, height));
    vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignetteGrad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, width, height);
  }, []);

  const drawTree = useCallback((ctx, tree, width, height, time, isSelected) => {
    const stage = getStage(tree, treeTypes);
    const sprite = getTreeSprite(tree, treeTypes, saplingVariantMap);
    const asset = loadImage(sprite);
    const size = getTreeSize(stage);
    const pos = getTreePosition(tree);
    const x = pos.x * width;
    const y = pos.y * height;

    // Animate sway
    const sway = Math.sin(time * (tree.swaySpeed || 0.5) + (tree.sway || 0)) * 2;

    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.45, size * 0.4, size * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Apply sway rotation
    ctx.rotate((sway * Math.PI) / 180);

    // Draw sprite
    if (asset.img.complete && asset.img.naturalWidth) {
      ctx.drawImage(asset.img, -size / 2, -size, size, size);
    }

    // Selection glow
    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, -size * 0.4, size * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }, [treeTypes, saplingVariantMap]);

  const render = useCallback((gameState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height, dpr } = gameState.size;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Draw background
    drawBackground(ctx, width, height, gameState.time);

    // Draw particles (behind trees)
    gameState.particles.filter(p => p.type === 'firefly').forEach(p => p.draw(ctx));

    // Sort trees by Y for depth
    const sortedTrees = [...gameState.trees].sort((a, b) => getTreePosition(a).y - getTreePosition(b).y);
    sortedTrees.forEach(tree => {
      const isSelected = gameState.drag.id === tree.id;
      drawTree(ctx, tree, width, height, gameState.time, isSelected);
    });

    // Draw particles (in front)
    gameState.particles.filter(p => p.type !== 'firefly').forEach(p => p.draw(ctx));

    ctx.restore();
  }, [drawBackground, drawTree]);

  // --- Game Loop ---
  useEffect(() => {
    if (!assetsLoaded) return;
    setCanvasSize();

    const gs = gameStateRef.current;
    gs.lastTime = performance.now();

    // Spawn initial fireflies
    const { width, height } = gs.size;
    for (let i = 0; i < 12; i++) {
      gs.particles.push(new Particle(Math.random() * width, Math.random() * height * 0.7, 'firefly'));
    }

    const gameLoop = (currentTime) => {
      if (!canvasRef.current) return;

      let deltaTime = currentTime - gs.lastTime;
      gs.lastTime = currentTime;
      if (deltaTime > MAX_FRAME_TIME) deltaTime = MAX_FRAME_TIME;

      gs.accumulator += deltaTime;

      // Fixed timestep update
      while (gs.accumulator >= FIXED_TIMESTEP) {
        gs.time += FIXED_TIMESTEP / 1000;
        // Update particles
        gs.particles = gs.particles.filter(p => p.update());
        // Replenish fireflies
        const { width: w, height: h } = gs.size;
        while (gs.particles.filter(p => p.type === 'firefly').length < 10) {
          gs.particles.push(new Particle(Math.random() * w, Math.random() * h * 0.7, 'firefly'));
        }
        gs.accumulator -= FIXED_TIMESTEP;
      }

      render(gs);

      gs.animationFrameId = requestAnimationFrame(gameLoop);
    };

    gs.animationFrameId = requestAnimationFrame(gameLoop);

    const handleResize = () => {
      setCanvasSize();
    };
    window.addEventListener('resize', handleResize);

    // Pause when page is hidden (mobile battery optimization)
    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(gs.animationFrameId);
        gs.animationFrameId = null;
      } else if (!gs.animationFrameId) {
        gs.lastTime = performance.now();
        gs.accumulator = 0;
        gs.animationFrameId = requestAnimationFrame(gameLoop);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelAnimationFrame(gs.animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [assetsLoaded, setCanvasSize, render]);

  // --- Input Handling ---
  const hitTestTree = useCallback((x, y) => {
    const gs = gameStateRef.current;
    const { width, height } = gs.size;
    for (let i = gs.trees.length - 1; i >= 0; i--) {
      const tree = gs.trees[i];
      const stage = getStage(tree, treeTypes);
      const size = getTreeSize(stage);
      const pos = getTreePosition(tree);
      const dx = x - pos.x * width;
      const dy = y - (pos.y * height - size * 0.4);
      if (dx * dx + dy * dy <= (size * 0.5) ** 2) return tree;
    }
    return null;
  }, [treeTypes]);

  const getPointerPos = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const handleBuyTree = useCallback(async (treeId, position) => {
    try {
      const result = await buyItem(treeId, position);
      if (result.success) {
        // Spawn sparkle particles
        const gs = gameStateRef.current;
        const { width, height } = gs.size;
        for (let i = 0; i < 12; i++) {
          gs.particles.push(new Particle(position.x * width, position.y * height, 'sparkle'));
        }
        await refetchData();
        setStatusText('🌱 Planted!');
      } else {
        setStatusText(result.message || 'Purchase failed.');
      }
    } catch (error) {
      setStatusText(error.message || 'Purchase failed.');
    }
  }, [refetchData]);

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    const point = getPointerPos(e);
    const gs = gameStateRef.current;
    const hit = hitTestTree(point.x, point.y);

    if (hit) {
      const pos = getTreePosition(hit);
      gs.drag = {
        id: hit.id,
        offsetX: point.x - pos.x * gs.size.width,
        offsetY: point.y - pos.y * gs.size.height,
        moved: false,
      };
      setStatusText('🌲 Dragging tree...');
      return;
    }

    if (!inputRef.current.selectedTreeType) {
      setStatusText('Select a sapling from the shop first.');
      return;
    }

    const normX = point.x / gs.size.width;
    const normY = point.y / gs.size.height;
    handleBuyTree(inputRef.current.selectedTreeType, { x: normX, y: normY });
  }, [getPointerPos, hitTestTree, handleBuyTree]);

  const onPointerMove = useCallback((e) => {
    const gs = gameStateRef.current;
    if (!gs.drag.id) return;
    e.preventDefault();
    const point = getPointerPos(e);
    const { width, height } = gs.size;
    const newX = Math.max(0.05, Math.min(0.95, (point.x - gs.drag.offsetX) / width));
    const newY = Math.max(0.20, Math.min(0.90, (point.y - gs.drag.offsetY) / height));

    setTrees(prev => prev.map(tree =>
      tree.id === gs.drag.id ? { ...tree, x: newX, y: newY } : tree
    ));
    gs.drag.moved = true;
  }, [getPointerPos]);

  const onPointerUp = useCallback(async (e) => {
    const gs = gameStateRef.current;
    if (!gs.drag.id) return;
    e?.preventDefault();

    const treeId = gs.drag.id;
    const tree = gs.trees.find(t => t.id === treeId);

    if (tree && gs.drag.moved) {
      await updateForestTree(treeId, tree.x ?? 0.5, tree.y ?? 0.6);
      setStatusText('✓ Tree moved.');
    } else if (tree) {
      const age = formatAge(tree.purchaseDate);
      setInfoText(`Age: ${age}`);
      setStatusText('Tree selected.');
    }
    gs.drag = { id: null, offsetX: 0, offsetY: 0, moved: false };
  }, []);

  // Attach event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { passive: false });
    window.addEventListener('pointercancel', onPointerUp, { passive: false });

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [onPointerDown, onPointerMove, onPointerUp]);

  const handleClearSelection = () => {
    setSelectedTreeType(null);
    setInfoText('');
    setStatusText('Selection cleared.');
  };

  const selectedTree = saplings.find((tree) => tree.id === selectedTreeType);

  // --- UI Render ---
  return (
    <section className="space-y-4">
      {/* Forest Canvas */}
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-1 shadow-2xl shadow-emerald-900/20">
        <div ref={canvasWrapRef} className="w-full relative" style={{ aspectRatio: '16/10' }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-xl cursor-crosshair"
            style={{ touchAction: 'none' }}
            aria-label="Mystical Forest"
          />
          {!assetsLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
              <div className="flex items-center gap-3 text-emerald-300">
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm font-medium">Loading forest...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HUD / Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 border border-white/10 rounded-xl bg-gradient-to-r from-white/5 to-transparent backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm font-medium text-emerald-300">
            <span>🌳</span>
            <span>{stats.total} Trees</span>
          </div>
          {selectedTree && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sm font-medium text-sky-300">
              <span>✓</span>
              <span>{selectedTree.name}</span>
            </div>
          )}
          {infoText && (
            <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400">
              {infoText}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{statusText}</span>
          <button
            type="button"
            onClick={handleClearSelection}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Sapling Shop */}
      <div className="border border-white/10 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-emerald-900/10 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsShopExpanded(!isShopExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🌿</span>
            <span className="text-base font-semibold text-white">Sapling Shop</span>
            <span className="text-sm text-gray-500">({saplings.length})</span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isShopExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isShopExpanded && (
          <div className="p-4 pt-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {saplings.map((tree) => {
              const selected = selectedTreeType === tree.id;
              return (
                <button
                  key={tree.id}
                  type="button"
                  onClick={() => {
                    setSelectedTreeType(tree.id);
                    setStatusText(`Selected ${tree.name}. Tap the forest to plant.`);
                    setIsShopExpanded(false);
                  }}
                  className={`group relative text-left p-3 rounded-xl border transition-all duration-200 ${selected
                    ? 'border-emerald-400/60 bg-emerald-500/15 ring-1 ring-emerald-400/30'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <img
                      src={`/img/trees/${getTreeFolder(tree.id, saplingVariantMap)}/seedling.svg`}
                      alt={tree.name}
                      className="w-14 h-14 object-contain transition-transform group-hover:scale-110"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{tree.name}</p>
                      <p className="text-xs text-gray-400">{tree.cost.toLocaleString()} coins</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default ForestPage;
