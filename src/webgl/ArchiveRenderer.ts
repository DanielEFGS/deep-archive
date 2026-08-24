import * as THREE from "three";
import type { RenderDiagnostics, RenderQuality } from "../types/catalog";

type Options = {
  canvas: HTMLCanvasElement;
  atlasUrl: string;
  atlasColumns: number;
  atlasRows: number;
  atlasWidth: number;
  atlasHeight: number;
  itemCount: number;
  onReady: () => void;
  onError?: (error: unknown) => void;
  onQualityChange?: (quality: RenderQuality) => void;
};

const TILE_SUBDIVISIONS = 3;
const VERTICES_PER_TILE = TILE_SUBDIVISIONS * TILE_SUBDIVISIONS * 6;

const vertexShader = /* glsl */ `
  attribute vec2 aCenter;
  attribute vec2 aUvMin;
  attribute vec2 aUvMax;
  attribute float aVisibility;
  attribute float aIndex;

  varying vec2 vUv;
  varying vec2 vUvMin;
  varying vec2 vUvMax;
  varying float vStrength;
  varying float vVisibility;
  varying float vIndex;
  varying float vRipple;

  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform vec2 uCellSize;
  uniform vec2 uRippleOrigin;
  uniform float uRadius;
  uniform float uMotion;
  uniform float uRipplePhase;
  uniform float uRippleAmount;
  uniform float uFocusIndex;
  uniform float uHoverIndex;
  uniform float uPreviousHoverIndex;
  uniform float uHoverAmount;
  uniform vec2 uVelocity;
  uniform float uSpeed;

  void main() {
    float currentHoveredTile = 1.0 - smoothstep(0.2, 0.8, abs(aIndex - uHoverIndex));
    float previousHoveredTile = 1.0 - smoothstep(0.2, 0.8, abs(aIndex - uPreviousHoverIndex));
    float hoveredTile = currentHoveredTile * uHoverAmount + previousHoveredTile * (1.0 - uHoverAmount);

    // Archive aperture: every record remains a rigid rectangular plate. The
    // focused tile grows uniformly while only its nearest neighbours yield.
    vec2 centerDeltaPx = (aCenter - uMouse) * 0.5 * uResolution;
    float centerDistance = length(centerDeltaPx);
    float cellDiagonal = max(1.0, length(uCellSize));
    float neighbourField = 1.0 - smoothstep(cellDiagonal * 0.62, cellDiagonal * 2.05, centerDistance);
    neighbourField *= (1.0 - hoveredTile) * uMotion;
    vec2 neighbourDirection = centerDistance > 0.0001 ? centerDeltaPx / centerDistance : vec2(0.0);
    vec2 pushPx = neighbourDirection * neighbourField * cellDiagonal * 0.17;
    pushPx += uVelocity * neighbourField * uSpeed * 1.5;

    float tileScale = 1.0 + hoveredTile * uMotion * 0.29;
    vec2 localPosition = aCenter + (position.xy - aCenter) * tileScale;

    vec2 rippleDeltaPx = (position.xy - uRippleOrigin) * 0.5 * uResolution;
    float rippleDistance = length(rippleDeltaPx);
    float rippleMax = length(uResolution) * 0.62;
    float rippleCenter = uRipplePhase * rippleMax;
    float rippleBand = exp(-pow((rippleDistance - rippleCenter) / 62.0, 2.0));
    float ripple = rippleBand * uRippleAmount;
    vec2 rippleDirection = rippleDistance > 0.0001 ? rippleDeltaPx / rippleDistance : vec2(0.0);
    pushPx += rippleDirection * ripple * 7.0;

    vec2 pushNdc = pushPx * 2.0 / uResolution;
    vec2 finalPosition = localPosition + pushNdc;

    vUv = uv;
    vUvMin = aUvMin;
    vUvMax = aUvMax;
    vStrength = max(hoveredTile, neighbourField * 0.18);
    vVisibility = aVisibility;
    vIndex = aIndex;
    vRipple = ripple;
    gl_Position = vec4(finalPosition, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  varying vec2 vUvMin;
  varying vec2 vUvMax;
  varying float vStrength;
  varying float vVisibility;
  varying float vIndex;
  varying float vRipple;

  uniform sampler2D uAtlas;
  uniform vec2 uAtlasSize;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform float uRadius;
  uniform float uMotion;
  uniform float uFocusIndex;
  uniform float uHoverIndex;
  uniform float uPreviousHoverIndex;
  uniform float uHoverAmount;
  uniform vec2 uVelocity;
  uniform float uSpeed;
  uniform float uRevealProgress;

  vec2 safeUv(vec2 value) {
    vec2 pad = 0.75 / uAtlasSize;
    return clamp(value, vUvMin + pad, vUvMax - pad);
  }

  void main() {
    float currentHoveredTile = 1.0 - smoothstep(0.2, 0.8, abs(vIndex - uHoverIndex));
    float previousHoveredTile = 1.0 - smoothstep(0.2, 0.8, abs(vIndex - uPreviousHoverIndex));
    float hoveredTile = currentHoveredTile * uHoverAmount + previousHoveredTile * (1.0 - uHoverAmount);
    // Aperture stays optically clean: layout and focus replace chromatic warp.
    vec2 channelOffset = vec2(0.0);

    vec2 tileCenterUv = (vUvMin + vUvMax) * 0.5;
    float textureZoom = 1.0 + hoveredTile * 0.06;
    vec2 sampleUv = tileCenterUv + (vUv - tileCenterUv) / textureZoom;

    vec3 base;
    base.r = texture2D(uAtlas, safeUv(sampleUv + channelOffset)).r;
    base.g = texture2D(uAtlas, safeUv(sampleUv)).g;
    base.b = texture2D(uAtlas, safeUv(sampleUv - channelOffset)).b;

    float luminance = dot(base, vec3(0.2126, 0.7152, 0.0722));
    vec3 monochrome = vec3(luminance) * 0.69;
    float reveal = smoothstep(0.05, 0.92, hoveredTile);
    vec3 color = mix(monochrome, base, reveal);

    vec2 tileUv = (vUv - vUvMin) / max(vUvMax - vUvMin, vec2(0.00001));
    float edge = min(min(tileUv.x, 1.0 - tileUv.x), min(tileUv.y, 1.0 - tileUv.y));
    float seam = smoothstep(0.0, 0.011, edge);
    color *= mix(0.28, 1.0, seam);

    float focus = 1.0 - smoothstep(0.2, 0.8, abs(vIndex - uFocusIndex));
    color *= 0.78 + vStrength * 0.31 + focus * 0.08 + vRipple * 0.12;
    color = mix(color * 0.14, color, vVisibility);

    // Each atlas record is exposed on its actual rendered tile. Using the
    // instance index keeps the transition registered to responsive geometry.
    float revealOrder = fract(sin((vIndex + 1.0) * 12.9898) * 43758.5453);
    float tileReveal = smoothstep(
      revealOrder * 0.72,
      revealOrder * 0.72 + 0.24,
      uRevealProgress
    );
    color *= mix(0.07, 1.0, tileReveal);

    gl_FragColor = vec4(color, 1.0);
  }
`;

type NavigatorHints = Navigator & { deviceMemory?: number };

export class ArchiveRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly atlasColumns: number;
  private readonly atlasRows: number;
  private readonly itemCount: number;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.Camera();
  private readonly material: THREE.ShaderMaterial;
  private mesh: THREE.Mesh | null = null;
  private visibilityAttribute: THREE.BufferAttribute | null = null;
  private frameId: number | null = null;
  private resizeObserver: ResizeObserver;
  private displayColumns = 25;
  private displayRows = 20;
  private fieldTop = 92;
  private fieldBottom = 48;
  private fieldViewportHeight = 0;
  private currentMouse = new THREE.Vector2(-4, -4);
  private targetMouse = new THREE.Vector2(-4, -4);
  private previousPointer = new THREE.Vector2(-4, -4);
  private velocityTarget = new THREE.Vector2();
  private velocityCurrent = new THREE.Vector2();
  private drawingBufferSize = new THREE.Vector2();
  private lastPointerAt = 0;
  private pointerActive = false;
  private disposed = false;
  private reducedMotion = false;
  private rippleStartedAt: number | null = null;
  private revealStartedAt: number | null = null;
  private quality: RenderQuality = { label: "HIGH", pixelRatio: 1 };
  private frameSamples: number[] = [];
  private lastFrameAt = 0;
  private qualityAdjusted = false;
  private readonly onQualityChange?: (quality: RenderQuality) => void;
  private diagnosticFrames = 0;
  private diagnosticStartedAt = performance.now();
  private visibleIndices: Set<number> | null = null;
  private hoveredIndex: number | null = null;
  private hoverAmount = 0;
  private hoverAmountTarget = 0;

  constructor(options: Options) {
    this.canvas = options.canvas;
    this.atlasColumns = options.atlasColumns;
    this.atlasRows = options.atlasRows;
    this.itemCount = options.itemCount;
    this.onQualityChange = options.onQualityChange;
    this.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x06080d, 1);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uAtlas: { value: null },
        uAtlasSize: {
          value: new THREE.Vector2(options.atlasWidth, options.atlasHeight),
        },
        uMouse: { value: this.currentMouse.clone() },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uCellSize: { value: new THREE.Vector2(1, 1) },
        uRadius: { value: 220 },
        uMotion: { value: this.reducedMotion ? 0 : 1 },
        uRippleOrigin: { value: new THREE.Vector2(-4, -4) },
        uRipplePhase: { value: 1 },
        uRippleAmount: { value: 0 },
        uFocusIndex: { value: -10 },
        uHoverIndex: { value: -10 },
        uPreviousHoverIndex: { value: -10 },
        uHoverAmount: { value: 0 },
        uVelocity: { value: this.velocityCurrent.clone() },
        uSpeed: { value: 0 },
        uRevealProgress: { value: this.reducedMotion ? 1 : 0 },
      },
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
    });

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas);
    this.resize();

    new THREE.TextureLoader().load(
      options.atlasUrl,
      (texture) => {
        if (this.disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        this.material.uniforms.uAtlas.value = texture;
        if (this.reducedMotion) {
          this.material.uniforms.uRevealProgress.value = 1;
          this.renderOnce();
        } else {
          this.revealStartedAt = performance.now();
          this.material.uniforms.uRevealProgress.value = 0;
          this.invalidate();
        }
        options.onReady();
      },
      undefined,
      (error) => {
        console.error("Atlas load failed", error);
        options.onError?.(error);
      },
    );
  }

  setPointer(clientX: number, clientY: number) {
    const point = this.clientToNdc(clientX, clientY);
    if (!point) return;
    const hoveredIndex = this.getIndexAtPointer(clientX, clientY);

    if (hoveredIndex == null) {
      if (this.hoveredIndex != null) {
        this.material.uniforms.uPreviousHoverIndex.value = this.hoveredIndex;
        this.material.uniforms.uHoverIndex.value = -10;
        this.hoveredIndex = null;
        this.hoverAmount = 0;
        this.hoverAmountTarget = 1;
        this.material.uniforms.uHoverAmount.value = 0;
      }
      this.targetMouse.set(-4, -4);
      this.pointerActive = false;
      this.velocityTarget.set(0, 0);
      this.previousPointer.set(-4, -4);
      this.lastPointerAt = 0;
      this.invalidate();
      return;
    }

    const now = performance.now();
    const delta = Math.max(8, Math.min(80, now - this.lastPointerAt));
    if (this.lastPointerAt && this.previousPointer.x > -2) {
      this.velocityTarget
        .copy(point)
        .sub(this.previousPointer)
        .multiplyScalar(16 / delta);
      if (this.velocityTarget.lengthSq() > 0.09)
        this.velocityTarget.setLength(0.3);
    } else this.velocityTarget.set(0, 0);
    this.previousPointer.copy(point);
    this.lastPointerAt = now;
    if (hoveredIndex !== this.hoveredIndex) {
      this.material.uniforms.uPreviousHoverIndex.value =
        this.hoveredIndex ?? -10;
      this.hoveredIndex = hoveredIndex;
      this.hoverAmount = 0;
      this.hoverAmountTarget = 1;
      this.material.uniforms.uHoverIndex.value = hoveredIndex ?? -10;
      this.material.uniforms.uHoverAmount.value = 0;
    }
    const snappedCenter =
      hoveredIndex == null ? null : this.getCellCenterNdc(hoveredIndex);
    if (snappedCenter) this.targetMouse.copy(snappedCenter);
    else this.targetMouse.copy(point);
    this.pointerActive = true;
    this.material.uniforms.uFocusIndex.value = -10;
    this.invalidate();
  }

  clearPointer() {
    this.targetMouse.set(-4, -4);
    this.pointerActive = false;
    this.velocityTarget.set(0, 0);
    this.previousPointer.set(-4, -4);
    this.lastPointerAt = 0;
    this.material.uniforms.uPreviousHoverIndex.value = this.hoveredIndex ?? -10;
    this.hoveredIndex = null;
    this.hoverAmount = 0;
    this.hoverAmountTarget = 1;
    this.material.uniforms.uHoverIndex.value = -10;
    this.material.uniforms.uHoverAmount.value = 0;
    this.invalidate();
  }

  setFocusIndex(index: number | null) {
    this.material.uniforms.uFocusIndex.value = index ?? -10;
    this.material.uniforms.uPreviousHoverIndex.value = this.hoveredIndex ?? -10;
    this.hoveredIndex = index;
    this.material.uniforms.uHoverIndex.value = index ?? -10;
    this.hoverAmount = 0;
    this.hoverAmountTarget = 1;
    this.material.uniforms.uHoverAmount.value = 0;
    if (index == null) {
      this.targetMouse.set(-4, -4);
      this.invalidate();
      return;
    }

    const center = this.getCellCenterNdc(index);
    if (!center) return;
    this.targetMouse.copy(center);
    this.pointerActive = false;
    this.invalidate();
  }

  setVisibleIndices(indices: Set<number> | null) {
    this.visibleIndices = indices == null ? null : new Set(indices);
    if (!this.visibilityAttribute) return;
    const values = this.visibilityAttribute.array as Float32Array;
    const verticesPerTile = VERTICES_PER_TILE;

    for (let index = 0; index < this.itemCount; index++) {
      const visible = indices == null || indices.has(index) ? 1 : 0;
      const offset = index * verticesPerTile;
      for (let vertex = 0; vertex < verticesPerTile; vertex++)
        values[offset + vertex] = visible;
    }
    this.visibilityAttribute.needsUpdate = true;
    this.renderOnce();
  }

  triggerRipple(clientX: number, clientY: number) {
    if (this.reducedMotion) return;
    const point = this.clientToNdc(clientX, clientY);
    if (!point) return;
    this.material.uniforms.uRippleOrigin.value.copy(point);
    this.material.uniforms.uRipplePhase.value = 0;
    this.material.uniforms.uRippleAmount.value = 1;
    this.rippleStartedAt = performance.now();
    this.invalidate();
  }

  getIndexAtPointer(clientX: number, clientY: number): number | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const fieldHeight = rect.height - this.fieldTop - this.fieldBottom;
    if (
      x < 0 ||
      y < this.fieldTop ||
      x >= rect.width ||
      y >= rect.height - this.fieldBottom ||
      fieldHeight <= 0
    )
      return null;

    const column = Math.floor((x / rect.width) * this.displayColumns);
    const row = Math.floor(
      ((y - this.fieldTop) / fieldHeight) * this.displayRows,
    );
    const index = row * this.displayColumns + column;
    if (index < 0 || index >= this.itemCount) return null;
    return this.isVisible(index) ? index : null;
  }

  getAdjacentIndex(index: number, columnDelta: number, rowDelta: number) {
    const startColumn = index % this.displayColumns;
    const startRow = Math.floor(index / this.displayColumns);
    let column = startColumn;
    let row = startRow;

    for (
      let step = 0;
      step < Math.max(this.displayColumns, this.displayRows);
      step++
    ) {
      column += columnDelta;
      row += rowDelta;
      if (
        column < 0 ||
        column >= this.displayColumns ||
        row < 0 ||
        row >= this.displayRows
      )
        break;
      const candidate = row * this.displayColumns + column;
      if (candidate < this.itemCount && this.isVisible(candidate))
        return candidate;
    }
    return index;
  }

  getBoundaryIndex(last = false) {
    if (last) {
      for (let index = this.itemCount - 1; index >= 0; index--)
        if (this.isVisible(index)) return index;
      return 0;
    }
    for (let index = 0; index < this.itemCount; index++)
      if (this.isVisible(index)) return index;
    return 0;
  }

  dispose() {
    this.disposed = true;
    if (this.frameId != null) cancelAnimationFrame(this.frameId);
    this.resizeObserver.disconnect();
    this.mesh?.geometry.dispose();
    const texture = this.material.uniforms.uAtlas.value as THREE.Texture | null;
    texture?.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }

  getDiagnostics(): RenderDiagnostics {
    const now = performance.now();
    const elapsed = Math.max(1, now - this.diagnosticStartedAt);
    const fps = (this.diagnosticFrames * 1000) / elapsed;
    const size = this.renderer.getDrawingBufferSize(this.drawingBufferSize);
    if (elapsed > 1000) {
      this.diagnosticFrames = 0;
      this.diagnosticStartedAt = now;
    }
    return {
      fps: this.frameId == null ? 0 : fps,
      frameTime: fps > 0 ? 1000 / fps : 0,
      pixelRatio: this.renderer.getPixelRatio(),
      width: size.x,
      height: size.y,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      textures: this.renderer.info.memory.textures,
      active: this.frameId != null,
    };
  }

  private isVisible(index: number) {
    return this.visibleIndices == null || this.visibleIndices.has(index);
  }

  private clientToNdc(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((clientY - rect.top) / rect.height) * 2,
    );
  }

  private getCellCenterNdc(index: number) {
    if (index < 0 || index >= this.itemCount) return null;
    const column = index % this.displayColumns;
    const row = Math.floor(index / this.displayColumns);
    const rect = this.canvas.getBoundingClientRect();
    const topNdc = 1 - (this.fieldTop / Math.max(1, rect.height)) * 2;
    const bottomNdc = -1 + (this.fieldBottom / Math.max(1, rect.height)) * 2;
    const fieldHeightNdc = topNdc - bottomNdc;
    return new THREE.Vector2(
      -1 + (column + 0.5) * (2 / this.displayColumns),
      topNdc - (row + 0.5) * (fieldHeightNdc / this.displayRows),
    );
  }

  private chooseGrid(width: number) {
    if (width < 640) return 16;
    if (width < 1024) return this.itemCount > 500 ? 24 : 20;
    return this.itemCount > 500 ? 32 : 25;
  }

  private desiredQuality(width: number): RenderQuality {
    const nav = navigator as NavigatorHints;
    const constrained =
      (nav.deviceMemory != null && nav.deviceMemory <= 4) ||
      navigator.hardwareConcurrency <= 4;
    if (constrained)
      return {
        label: "ECO",
        pixelRatio: Math.min(window.devicePixelRatio || 1, 1),
      };
    if (width < 700)
      return {
        label: "BALANCED",
        pixelRatio: Math.min(window.devicePixelRatio || 1, 1.15),
      };
    return {
      label: "HIGH",
      pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
    };
  }

  private applyQuality(next: RenderQuality) {
    if (
      Math.abs(next.pixelRatio - this.quality.pixelRatio) < 0.01 &&
      next.label === this.quality.label
    )
      return;
    this.quality = next;
    this.renderer.setPixelRatio(next.pixelRatio);
    this.onQualityChange?.(next);
  }

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    this.applyQuality(this.desiredQuality(width));
    this.renderer.setSize(width, height, false);
    this.renderer.getDrawingBufferSize(this.drawingBufferSize);
    this.material.uniforms.uResolution.value.copy(this.drawingBufferSize);
    const cssRadius = width < 700 ? 126 : width < 1100 ? 174 : 226;
    this.material.uniforms.uRadius.value =
      cssRadius * this.renderer.getPixelRatio();

    const nextColumns = this.chooseGrid(width);
    const nextRows = Math.ceil(this.itemCount / nextColumns);
    const nextFieldTop = width < 700 ? 132 : width < 1050 ? 112 : 92;
    const nextFieldBottom = width < 700 ? 58 : 52;
    if (
      nextColumns !== this.displayColumns ||
      nextRows !== this.displayRows ||
      nextFieldTop !== this.fieldTop ||
      nextFieldBottom !== this.fieldBottom ||
      height !== this.fieldViewportHeight ||
      !this.mesh
    ) {
      this.displayColumns = nextColumns;
      this.displayRows = nextRows;
      this.fieldTop = nextFieldTop;
      this.fieldBottom = nextFieldBottom;
      this.fieldViewportHeight = height;
      this.rebuildGeometry();
    }

    const fieldHeightCss = Math.max(
      1,
      height - this.fieldTop - this.fieldBottom,
    );
    this.material.uniforms.uCellSize.value.set(
      this.drawingBufferSize.x / this.displayColumns,
      (fieldHeightCss * this.renderer.getPixelRatio()) / this.displayRows,
    );

    this.renderOnce();
  }

  private rebuildGeometry() {
    this.mesh?.geometry.dispose();
    if (this.mesh) this.scene.remove(this.mesh);

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uvs: number[] = [];
    const centers: number[] = [];
    const uvMins: number[] = [];
    const uvMaxs: number[] = [];
    const visibility: number[] = [];
    const indices: number[] = [];

    const cellWidth = 2 / this.displayColumns;
    const canvasHeight = Math.max(
      1,
      this.canvas.getBoundingClientRect().height,
    );
    const fieldTopNdc = 1 - (this.fieldTop / canvasHeight) * 2;
    const fieldBottomNdc = -1 + (this.fieldBottom / canvasHeight) * 2;
    const cellHeight = (fieldTopNdc - fieldBottomNdc) / this.displayRows;

    const pushVertex = (
      x: number,
      y: number,
      u: number,
      v: number,
      cx: number,
      cy: number,
      uvMinX: number,
      uvMinY: number,
      uvMaxX: number,
      uvMaxY: number,
      index: number,
    ) => {
      positions.push(x, y, 0);
      uvs.push(u, v);
      centers.push(cx, cy);
      uvMins.push(uvMinX, uvMinY);
      uvMaxs.push(uvMaxX, uvMaxY);
      visibility.push(1);
      indices.push(index);
    };

    for (let index = 0; index < this.itemCount; index++) {
      const displayColumn = index % this.displayColumns;
      const displayRow = Math.floor(index / this.displayColumns);

      const left = -1 + displayColumn * cellWidth;
      const right = -1 + (displayColumn + 1) * cellWidth;
      const top = fieldTopNdc - displayRow * cellHeight;
      const bottom = fieldTopNdc - (displayRow + 1) * cellHeight;
      const centerX = (left + right) * 0.5;
      const centerY = (top + bottom) * 0.5;

      const atlasColumn = index % this.atlasColumns;
      const atlasRow = Math.floor(index / this.atlasColumns);
      const u0 = atlasColumn / this.atlasColumns;
      const u1 = (atlasColumn + 1) / this.atlasColumns;
      const v1 = 1 - atlasRow / this.atlasRows;
      const v0 = 1 - (atlasRow + 1) / this.atlasRows;

      for (let segmentY = 0; segmentY < TILE_SUBDIVISIONS; segmentY++) {
        const yStart = segmentY / TILE_SUBDIVISIONS;
        const yEnd = (segmentY + 1) / TILE_SUBDIVISIONS;
        const quadTop = THREE.MathUtils.lerp(top, bottom, yStart);
        const quadBottom = THREE.MathUtils.lerp(top, bottom, yEnd);
        const quadVTop = THREE.MathUtils.lerp(v1, v0, yStart);
        const quadVBottom = THREE.MathUtils.lerp(v1, v0, yEnd);

        for (let segmentX = 0; segmentX < TILE_SUBDIVISIONS; segmentX++) {
          const xStart = segmentX / TILE_SUBDIVISIONS;
          const xEnd = (segmentX + 1) / TILE_SUBDIVISIONS;
          const quadLeft = THREE.MathUtils.lerp(left, right, xStart);
          const quadRight = THREE.MathUtils.lerp(left, right, xEnd);
          const quadULeft = THREE.MathUtils.lerp(u0, u1, xStart);
          const quadURight = THREE.MathUtils.lerp(u0, u1, xEnd);

          pushVertex(
            quadLeft,
            quadTop,
            quadULeft,
            quadVTop,
            centerX,
            centerY,
            u0,
            v0,
            u1,
            v1,
            index,
          );
          pushVertex(
            quadLeft,
            quadBottom,
            quadULeft,
            quadVBottom,
            centerX,
            centerY,
            u0,
            v0,
            u1,
            v1,
            index,
          );
          pushVertex(
            quadRight,
            quadTop,
            quadURight,
            quadVTop,
            centerX,
            centerY,
            u0,
            v0,
            u1,
            v1,
            index,
          );
          pushVertex(
            quadRight,
            quadTop,
            quadURight,
            quadVTop,
            centerX,
            centerY,
            u0,
            v0,
            u1,
            v1,
            index,
          );
          pushVertex(
            quadLeft,
            quadBottom,
            quadULeft,
            quadVBottom,
            centerX,
            centerY,
            u0,
            v0,
            u1,
            v1,
            index,
          );
          pushVertex(
            quadRight,
            quadBottom,
            quadURight,
            quadVBottom,
            centerX,
            centerY,
            u0,
            v0,
            u1,
            v1,
            index,
          );
        }
      }
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute(
      "aCenter",
      new THREE.Float32BufferAttribute(centers, 2),
    );
    geometry.setAttribute(
      "aUvMin",
      new THREE.Float32BufferAttribute(uvMins, 2),
    );
    geometry.setAttribute(
      "aUvMax",
      new THREE.Float32BufferAttribute(uvMaxs, 2),
    );
    this.visibilityAttribute = new THREE.Float32BufferAttribute(visibility, 1);
    geometry.setAttribute("aVisibility", this.visibilityAttribute);
    geometry.setAttribute(
      "aIndex",
      new THREE.Float32BufferAttribute(indices, 1),
    );
    geometry.computeBoundingSphere();

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  private invalidate() {
    if (this.frameId == null) this.frameId = requestAnimationFrame(this.tick);
  }

  private sampleFrame(now: number) {
    if (!this.lastFrameAt) {
      this.lastFrameAt = now;
      return;
    }
    const delta = now - this.lastFrameAt;
    this.lastFrameAt = now;
    if (delta > 4 && delta < 80) this.frameSamples.push(delta);
    if (this.frameSamples.length < 45 || this.qualityAdjusted) return;

    const average =
      this.frameSamples.reduce((sum, value) => sum + value, 0) /
      this.frameSamples.length;
    this.frameSamples = [];
    if (average > 23 && this.quality.pixelRatio > 1) {
      this.qualityAdjusted = true;
      const pixelRatio = Math.max(1, this.quality.pixelRatio - 0.25);
      this.applyQuality({
        label: pixelRatio <= 1.01 ? "ECO" : "BALANCED",
        pixelRatio,
      });
      const rect = this.canvas.getBoundingClientRect();
      this.renderer.setSize(
        Math.max(1, Math.floor(rect.width)),
        Math.max(1, Math.floor(rect.height)),
        false,
      );
    }
  }

  private tick = (now: number) => {
    this.frameId = null;
    if (this.disposed) return;
    this.sampleFrame(now);

    if (this.reducedMotion) this.currentMouse.copy(this.targetMouse);
    else this.currentMouse.lerp(this.targetMouse, 0.125);
    this.velocityCurrent.lerp(
      this.velocityTarget,
      this.reducedMotion ? 1 : 0.16,
    );
    this.velocityTarget.multiplyScalar(0.82);

    this.material.uniforms.uMouse.value.copy(this.currentMouse);
    this.material.uniforms.uVelocity.value.copy(this.velocityCurrent);
    this.material.uniforms.uSpeed.value = Math.min(
      1,
      this.velocityCurrent.length() * 4.5,
    );
    this.hoverAmount +=
      (this.hoverAmountTarget - this.hoverAmount) *
      (this.reducedMotion ? 1 : 0.14);
    this.material.uniforms.uHoverAmount.value = this.hoverAmount;

    let rippleActive = false;
    if (this.rippleStartedAt != null) {
      const phase = Math.min(1, (now - this.rippleStartedAt) / 680);
      this.material.uniforms.uRipplePhase.value = phase;
      this.material.uniforms.uRippleAmount.value = 1 - phase;
      rippleActive = phase < 1;
      if (!rippleActive) this.rippleStartedAt = null;
    }

    let revealActive = false;
    if (this.revealStartedAt != null) {
      const revealProgress = Math.min(1, (now - this.revealStartedAt) / 620);
      this.material.uniforms.uRevealProgress.value = revealProgress;
      revealActive = revealProgress < 1;
      if (!revealActive) this.revealStartedAt = null;
    }

    this.renderer.render(this.scene, this.camera);
    this.diagnosticFrames++;

    const remaining = this.currentMouse.distanceToSquared(this.targetMouse);
    const hoverSettling =
      Math.abs(this.hoverAmountTarget - this.hoverAmount) > 0.002;
    if (
      remaining > 0.000002 ||
      this.velocityCurrent.lengthSq() > 0.000004 ||
      rippleActive ||
      revealActive ||
      hoverSettling
    )
      this.invalidate();
  };

  private renderOnce() {
    if (this.disposed) return;
    this.renderer.render(this.scene, this.camera);
    this.diagnosticFrames++;
  }
}
