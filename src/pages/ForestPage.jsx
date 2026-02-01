import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppContext } from '../App.jsx';
import { buyItem, updateForestTree } from '../api.js';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 520;

function ForestPage() {
  const { state, treeTypes, refetchData } = useContext(AppContext);
  const [selectedTreeType, setSelectedTreeType] = useState(null);
  const [statusText, setStatusText] = useState('Ready.');
  const [infoText, setInfoText] = useState('');
  const [trees, setTrees] = useState([]);
  const [isShopExpanded, setIsShopExpanded] = useState(false);

  const canvasRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const dragRef = useRef({
    id: null,
    offsetX: 0,
    offsetY: 0,
    moved: false
  });
  const sizeRef = useRef({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, dpr: 1 });
  const imageCacheRef = useRef(new Map());
  const treesRef = useRef([]);
  const rafRef = useRef(null);

  const forest = state?.forest || [];
  const saplings = Object.values(treeTypes);

  const stats = {
    total: forest.length,
    growing: forest.filter((t) => t.status === 'growing' && new Date(t.matureDate) > new Date()).length,
    matured: forest.filter((t) => t.status === 'matured' || new Date(t.matureDate) <= new Date()).length,
    withered: forest.filter((t) => t.status === 'withered').length
  };

  const treeVariants = ['aurora', 'ember', 'verdant'];
  const saplingVariantMap = useMemo(() => {
    const map = {};
    saplings.forEach((tree, index) => {
      map[tree.id] = treeVariants[index % treeVariants.length];
    });
    return map;
  }, [saplings]);

  const getTreeFolder = (treeType) => {
    if (treeType && treeType.toLowerCase().includes('cactus')) return 'cactus';
    return saplingVariantMap[treeType] || treeVariants[0];
  };

  const getStage = (tree) => {
    if (tree.status === 'withered') return 'withered';
    const now = Date.now();
    const planted = new Date(tree.purchaseDate).getTime();
    const growthHours = treeTypes[tree.treeType]?.growth_hours || 24;
    const hoursSince = Math.max(0, (now - planted) / (1000 * 60 * 60));
    if (hoursSince >= growthHours || tree.status === 'matured') return 'mature';
    if (hoursSince >= growthHours * 0.5) return 'young';
    return 'seedling';
  };

  const getTreeSprite = (tree) => {
    const folder = getTreeFolder(tree.treeType);
    const stage = getStage(tree);
    return `/img/trees/${folder}/${stage}.svg`;
  };

  const getTreeSize = (stage) => {
    if (stage === 'seedling') return 34;
    if (stage === 'young') return 46;
    if (stage === 'mature') return 64;
    return 56;
  };

  const fallbackPosition = (tree) => {
    const base = String(tree.id || '');
    let hash = 0;
    for (let i = 0; i < base.length; i += 1) {
      hash = (hash * 31 + base.charCodeAt(i)) % 1000;
    }
    const normX = 0.15 + (hash % 70) / 100;
    const normY = 0.18 + ((hash * 7) % 60) / 100;
    return { x: normX, y: normY };
  };

  const getTreePosition = (tree) => {
    if (typeof tree.x === 'number' && typeof tree.y === 'number') {
      return { x: tree.x, y: tree.y };
    }
    return fallbackPosition(tree);
  };

  const setCanvasSize = () => {
    const canvas = canvasRef.current;
    const wrap = canvasWrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    // Fallback to canvas dimensions if wrapper hasn't been sized yet
    const width = rect.width || canvas.clientWidth || CANVAS_WIDTH;
    const height = rect.height || canvas.clientHeight || (width * 10 / 16); // 16:10 aspect ratio

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    sizeRef.current = { width, height, dpr };

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const loadImage = (src) => {
    const cache = imageCacheRef.current;
    if (cache.has(src)) return cache.get(src);
    const img = new Image();
    img.src = src;
    cache.set(src, img);
    return img;
  };

  const drawBackground = (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);

    const grd = ctx.createLinearGradient(0, 0, 0, height);
    grd.addColorStop(0, 'rgba(40, 110, 60, 0.35)');
    grd.addColorStop(1, 'rgba(10, 20, 12, 0.15)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x <= width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    const v = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, Math.max(width, height) / 1.2);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  };

  const drawTrees = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = sizeRef.current;
    drawBackground(ctx, width, height);

    treesRef.current.forEach((tree) => {
      const stage = getStage(tree);
      const sprite = getTreeSprite(tree);
      const img = loadImage(sprite);
      const size = getTreeSize(stage);
      const position = getTreePosition(tree);
      const x = position.x * width;
      const y = position.y * height;

      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(x, y + size * 0.55, size * 0.5, size * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (img.complete) {
        ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
      } else {
        img.onload = () => drawTrees();
      }

      if (dragRef.current.id === tree.id) {
        ctx.save();
        ctx.strokeStyle = 'rgba(120, 220, 255, 0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    });
  };

  const scheduleDraw = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(drawTrees);
  };

  const canvasPointFromEvent = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = event.clientX ?? event.touches?.[0]?.clientX;
    const clientY = event.clientY ?? event.touches?.[0]?.clientY;
    return {
      x: (clientX - rect.left),
      y: (clientY - rect.top)
    };
  };

  const hitTestTree = (x, y) => {
    const { width, height } = sizeRef.current;
    for (let i = treesRef.current.length - 1; i >= 0; i -= 1) {
      const tree = treesRef.current[i];
      const stage = getStage(tree);
      const size = getTreeSize(stage);
      const pos = getTreePosition(tree);
      const dx = x - pos.x * width;
      const dy = y - pos.y * height;
      if (dx * dx + dy * dy <= (size * 0.6) ** 2) return tree;
    }
    return null;
  };

  const formatAge = (purchaseDate) => {
    if (!purchaseDate) return 'Unknown';
    const diff = Math.max(0, Date.now() - new Date(purchaseDate).getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleBuyTree = async (treeId, position) => {
    try {
      const result = await buyItem(treeId, position);
      if (result.success) {
        await refetchData();
        setStatusText('Planted!');
      } else {
        setStatusText(result.message || 'Purchase failed.');
      }
    } catch (error) {
      setStatusText(error.message || 'Purchase failed.');
    }
  };

  const onPointerDown = (event) => {
    event.preventDefault();
    const point = canvasPointFromEvent(event);
    const hit = hitTestTree(point.x, point.y);
    if (hit) {
      dragRef.current.id = hit.id;
      const pos = getTreePosition(hit);
      dragRef.current.offsetX = point.x - pos.x * sizeRef.current.width;
      dragRef.current.offsetY = point.y - pos.y * sizeRef.current.height;
      dragRef.current.moved = false;
      setStatusText('Dragging tree…');
      return;
    }

    if (!selectedTreeType) {
      setStatusText('Select a sapling to plant.');
      return;
    }

    const normX = point.x / sizeRef.current.width;
    const normY = point.y / sizeRef.current.height;
    handleBuyTree(selectedTreeType, { x: normX, y: normY });
  };

  const onPointerMove = (event) => {
    if (!dragRef.current.id) return;
    event.preventDefault();
    const point = canvasPointFromEvent(event);
    const { width, height } = sizeRef.current;
    const newX = (point.x - dragRef.current.offsetX) / width;
    const newY = (point.y - dragRef.current.offsetY) / height;

    setTrees((prev) => prev.map((tree) => (
      tree.id === dragRef.current.id
        ? { ...tree, x: Math.max(0.05, Math.min(0.95, newX)), y: Math.max(0.08, Math.min(0.92, newY)) }
        : tree
    )));
    dragRef.current.moved = true;
    scheduleDraw();
  };

  const onPointerUp = async (event) => {
    if (!dragRef.current.id) return;
    event.preventDefault();

    const treeId = dragRef.current.id;
    dragRef.current.id = null;

    const tree = treesRef.current.find((item) => item.id === treeId);
    if (tree && dragRef.current.moved) {
      await updateForestTree(treeId, tree.x ?? 0.5, tree.y ?? 0.6);
      setStatusText('Dropped.');
    } else if (tree) {
      const planted = new Date(tree.purchaseDate).toLocaleString();
      const age = formatAge(tree.purchaseDate);
      setInfoText(`Planted ${planted} • Age ${age}`);
      setStatusText('Tree details updated.');
    }
    dragRef.current.moved = false;
    scheduleDraw();
  };

  const handleClearSelection = () => {
    setSelectedTreeType(null);
    setInfoText('');
    setStatusText('Selection cleared.');
  };

  useEffect(() => {
    setTrees(forest);
  }, [forest]);

  useEffect(() => {
    treesRef.current = trees;
    scheduleDraw();
  }, [trees]);

  useEffect(() => {
    // Wait for layout to be calculated before sizing canvas
    const initCanvas = () => {
      requestAnimationFrame(() => {
        setCanvasSize();
        scheduleDraw();
      });
    };

    initCanvas();

    const handleResize = () => {
      setCanvasSize();
      scheduleDraw();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  }, [selectedTreeType, trees]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const selectedTree = saplings.find((tree) => tree.id === selectedTreeType);

  return (
    <section className="space-y-4">
      {/* Forest Canvas - Full Width */}
      <div className="rounded-[18px] border border-white/10 bg-gradient-to-br from-emerald-900/20 via-transparent to-emerald-800/10 p-2">
        <div ref={canvasWrapRef} className="w-full" style={{ aspectRatio: '16/10' }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full rounded-[18px] border border-white/10 bg-[radial-gradient(1200px_600px_at_50%_20%,rgba(120,200,120,.14),rgba(0,0,0,0)),linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.01))]"
            aria-label="Forest planter canvas"
          />
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-white/10 rounded-[14px] bg-white/5 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-2 rounded-full bg-white/10 border border-white/15 text-xs sm:text-sm">🌱 Tap to plant</div>
          <div className="px-3 py-2 rounded-full bg-white/10 border border-white/15 text-xs sm:text-sm">🫳 Drag to move</div>
          <div className="px-3 py-2 rounded-full bg-white/10 border border-white/15 text-xs sm:text-sm">Trees: {stats.total}</div>
          {selectedTree && (
            <div className="px-3 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs sm:text-sm text-emerald-300">
              ✓ {selectedTree.name}
            </div>
          )}
          {infoText && (
            <div className="px-3 py-2 rounded-full bg-white/10 border border-white/15 text-xs sm:text-sm">{infoText}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{statusText}</span>
          <button
            type="button"
            onClick={handleClearSelection}
            className="px-3 py-2 rounded-[12px] border border-white/15 bg-white/10 text-sm font-semibold hover:bg-white/15 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Collapsible Sapling Shop */}
      <div className="border border-white/10 rounded-[14px] bg-white/5 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsShopExpanded(!isShopExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🌿</span>
            <span className="text-lg font-bold text-white">Sapling Shop</span>
            <span className="text-sm text-gray-400">({saplings.length} available)</span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isShopExpanded ? 'rotate-180' : ''}`}
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
                  className={`text-left p-3 rounded-[12px] border ${selected ? 'border-emerald-400/70 bg-emerald-500/15' : 'border-white/10 bg-white/5 hover:bg-white/10'} transition-colors`}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <img
                      src={`/img/trees/${getTreeFolder(tree.id)}/seedling.svg`}
                      alt={tree.name}
                      className="w-12 h-12 object-contain"
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
