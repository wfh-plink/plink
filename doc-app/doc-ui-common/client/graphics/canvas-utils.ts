/// <reference path="bezier-js.d.ts" />
import {applyToPoint, Matrix, transform, translate} from 'transformation-matrix';
import {Bezier} from 'bezier-js/dist/bezier';
import glur from 'glur';

// import {getMinAndMax} from '@wfh/plink/wfh/dist-es5/utils/algorithms';

/**
 * Create a offscreen canvas to cache/prerender stuff, performance is affected by size of canvas,
 * try to create a canvas in as smaller size as possible
 * https://www.html5rocks.com/en/tutorials/canvas/performance/#toc-pre-render
 * @param origCtx 
 */
export function createCanvas(origCtx: CanvasRenderingContext2D): HTMLCanvasElement;
export function createCanvas(width: number, height: number): HTMLCanvasElement;
export function createCanvas(width: number | CanvasRenderingContext2D, height?: number): HTMLCanvasElement {
  const c = window.document.createElement('canvas');
  if (typeof width === 'number' && height != null) {
    c.width = width;
    c.height = height;
  } else {
    const origCtx = width as CanvasRenderingContext2D;
    c.width = origCtx.canvas.width;
    c.height = origCtx.canvas.height;
  }
  return c;
}

export function gradientFadeOut(width: number, height: number,
  drawFn: (ctx: CanvasRenderingContext2D) => void, grad?: CanvasGradient) {
  const gradCv = createCanvas(width, height);
  const gctx = gradCv.getContext('2d');
  if (!gctx) {
    throw new Error('Can not create Canvas 2D');
  }
  if (grad == null) {
    grad = gctx.createLinearGradient(0, 0, 0, gradCv.height);
  }
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, width, height);
  gctx.globalCompositeOperation = 'source-in';
  drawFn(gctx);
  // gctx.drawImage(target, 0,0);
  return gradCv;
}

export function blur(ctx: CanvasRenderingContext2D, x = 0, y = 0, width = ctx.canvas.width, height = ctx.canvas.height) {
  const imgData = ctx.getImageData(x, y, width, height);
  const {data} = imgData;
  glur(// data.data as any,
    new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    imgData.width, imgData.height, 55);
  ctx.putImageData(imgData, x, y);
}

const round = Math.round;

export type Point = {x: number; y: number};
/**
 * A paper.js segement like structure (http://paperjs.org/reference/segment/)
 * Each segment consists of an anchor point (segment.point) and optionaly an incoming and an outgoing handle (segment.handleIn and segment.handleOut), describing the tangents of the two Curve objects that are connected by this segment.
 */
export class Segment {
  static from(pointX: number, pointY: number, handleInX: number, handleInY: number, handleOutX: number, handleOutY: number) {
    return new Segment({x: pointX, y: pointY}, {x: handleInX, y: handleInY}, {x: handleOutX, y: handleOutY});
  }
  /** Relative to this.point */
  handleIn?: {x: number; y: number};
  /** Relative to this.point */
  handleOut?: {x: number; y: number};

  constructor(public point: Point, handleIn?: Point | null, handleOut?: Point ) {
    // this.point = {...point};
    if (handleIn) {
      this.handleIn = {x: handleIn.x - point.x, y: handleIn.y - point.y};
    }
    if (handleOut) {
      this.handleOut = {x: handleOut.x - point.x, y: handleOut.y - point.y};
    }
  }

  round(method = Math.round) {
    const newSeg = new Segment({x: Math.round(this.point.x), y: method(this.point.y)});
    if (this.handleIn) {
      newSeg.handleIn = {
        x: method(this.handleIn.x),
        y: method(this.handleIn.y)
      };
    }
    if (this.handleOut) {
      newSeg.handleOut = {
        x: method(this.handleOut.x),
        y: method(this.handleOut.y)
      };
    }
    return newSeg;
  }

  transform(matrix: Matrix) {
    const newSeg = this.clone();
    // console.log('transform', matrix, newSeg.point);
    newSeg.point = applyToPoint(matrix, newSeg.point);
    // console.log('transform', this.point, newSeg.point);
    const matrix1 = transform(
      translate(-newSeg.point.x, -newSeg.point.y),
      matrix
    );
    if (newSeg.handleIn) {
      newSeg.handleIn = applyToPoint(transform(
        matrix1,
        translate(newSeg.handleIn.x, newSeg.handleIn.y)
      ), this.point);
    }
    if (newSeg.handleOut) {
      newSeg.handleOut = applyToPoint(transform(
        matrix1,
        translate(newSeg.handleOut.x, newSeg.handleOut.y)
      ), this.point);
    }
    return newSeg;
  }

  absHandleInPoint() {
    return this.handleIn ?
      {x: this.handleIn.x + this.point.x, y: this.handleIn.y + this.point.y}
      : null;
  }

  absHandleOutPoint() {
    return this.handleOut ?
      {x: this.handleOut.x + this.point.x, y: this.handleOut.y + this.point.y}
      : null;
  }

  clone() {
    const newSeg = new Segment({x: this.point.x, y: this.point.y});
    if (this.handleIn) {
      newSeg.handleIn = {...this.handleIn};
    }
    if (this.handleOut) {
      newSeg.handleOut = {...this.handleOut};
    }
    return newSeg;
  }
}

export const CIRCLE_BEZIER_CONST = 0.551915024494;

export const quarterCircleCurve = [Segment.from(0, 1, -CIRCLE_BEZIER_CONST, 1, CIRCLE_BEZIER_CONST, 1),
  Segment.from(1, 0, 1, CIRCLE_BEZIER_CONST, 1, -CIRCLE_BEZIER_CONST)];

/**
 * 
 * @param startT 0 ~ 1, t value of a qaurter circle bezier curve
 * @param endT 0 ~ 1
 */
export function createBezierArch(startT: number, endT: number): [Segment, Segment] {
  const bez = new Bezier(quarterCircleCurve[0].point, quarterCircleCurve[0].absHandleOutPoint()!, quarterCircleCurve[1].absHandleInPoint()!, quarterCircleCurve[1].point);
  const points = bez.split(startT, endT).points;
  return [new Segment(points[0], null, points[1]), new Segment(points[3], points[2])];
}

export function *transSegments(segs: Iterable<Segment>, matrix: Matrix) {
  for (const seg of segs) {
    yield seg.transform(matrix);
  }
}

export function *createSegments(vertices: Iterable<[x: number, y: number]>): Iterable<Segment> {
  for (const p of vertices) {
    yield new Segment({x: p[0], y: p[1]});
  }
}

export function reverseSegments(segs: Iterable<Segment>) {
  return Array.from(segs).reverse().map(seg => {
    const newSeg = seg.clone();
    const handleIn = newSeg.handleIn;
    newSeg.handleIn = newSeg.handleOut;
    newSeg.handleOut = handleIn;
    return newSeg;
  });
}

export function drawSegmentPath(segs: Iterable<Segment>, ctx: CanvasRenderingContext2D , opts?: {
  closed?: boolean;
  round?: boolean | ((x: number) => number);
  debug?: boolean;
}): Segment[] {
  let i = 0;
  let origPoint: Segment['point'];

  let segements = Array.isArray(segs) ? segs as Segment[] : Array.from(segs);

  if (opts && opts.round) {
    const round = typeof opts.round === 'function' ? opts.round : Math.round;
    segements = segements.map(seg => seg.round(round));
  }

  for (const seg of segements) {
    const p = seg.point;
    if (i === 0) {
      origPoint = p;
      ctx.moveTo(p.x, p.y);
      if (opts && opts.debug)
          // eslint-disable-next-line no-console
          console.log('moveTo', p);
    } else {
      const c1 = segements[i - 1].absHandleOutPoint();
      const c2 = seg.absHandleInPoint();

      if (c1 && c2) {
        if (opts && opts.debug)
          // eslint-disable-next-line no-console
          console.log('bezierCurveTo', c1, c2, p);
        ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p.x, p.y);
      } else {
        if (opts && opts.debug)
          // eslint-disable-next-line no-console
          console.log('lineTo', p);
        ctx.lineTo(p.x, p.y);
      }
    }
    i++;
  }
  if (opts != null && opts.closed) {
    const lastSeg = segements[segements.length - 1];
    if (segements[0].handleIn && lastSeg.handleOut) {
      const c1 = lastSeg.absHandleOutPoint()!;
      const c2 = segements[0].absHandleInPoint()!;
      ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, segements[0].point.x, segements[0].point.y);
    } else {
      ctx.lineTo(origPoint!.x, origPoint!.y);
    }
  }
  return segements;
}

export function drawSegmentCtl(segs: Iterable<Segment>, ctx: CanvasRenderingContext2D , opts: {closed?: boolean; round?: boolean; size?: number} = {}) {
  let i = 0;
  let segements = Array.from(segs).map(seg => seg.round());

  if (opts && opts.round)
    segements = segements.map(seg => seg.round());

  if (opts.size == null)
    opts.size = 10;

  for (const seg of segements) {
    const p = seg.point;
    if (i === 0) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, opts.size >> 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
    } else {
      const c1 = segements[i - 1].absHandleOutPoint();
      const c2 = seg.absHandleInPoint();
      if (c1 && c2) {
        ctx.beginPath();
        ctx.arc(c1.x, c1.y, opts.size >> 1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(c2.x, c2.y, opts.size >> 1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.closePath();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, opts.size >> 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
    }
    i++;
  }
  if (opts.closed) {
    const lastSeg = segements[segements.length - 1];
    if (segements[0].handleIn && lastSeg.handleOut) {
      const c1 = lastSeg.absHandleOutPoint()!;
      const c2 = segements[0].absHandleInPoint()!;
      ctx.beginPath();
      ctx.arc(c1.x, c1.y, opts.size >> 1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.closePath();

      ctx.beginPath();
      ctx.arc(c2.x, c2.y, opts.size >> 1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.closePath();
    }
  }
}

export function drawBounds(segs: Iterable<Segment>, ctx: CanvasRenderingContext2D) {
  const rect = boundsOf(segs);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

export function smoothSegments(segments: Segment[], opts: {
  from?: number; to?: number; closed?: boolean; type?: 'asymmetric' | 'continuous';
}): void {
  const asymmetric = opts.type === 'asymmetric';

  const loop = opts.closed && opts.from === undefined && opts.to === undefined;
  const from = opts.from == null ? 0 : opts.from;
  const to = opts.to == null ? segments.length - 1 : opts.to;

  // const min = Math.min;
  const amount = to - from + 1;
  let n = amount - 1;
  // Overlap by up to 4 points on closed paths since a current
  // segment is affected by its 4 neighbors on both sides (?).
  const padding = loop ? Math.min(amount, 4) : 1;
  let paddingLeft = padding;
  let paddingRight = padding;
  const knots: {x: number; y: number}[] = [];

  if (opts.closed == null || !opts.closed) {
    // If the path is open and a range is defined, try using a
    // padding of 1 on either side.
    paddingLeft = Math.min(1, from);
    paddingRight = Math.min(1, segments.length - to - 1);
  }

  // Set up the knots array now, taking the paddings into account.
  n += paddingLeft + paddingRight;
  if (n <= 1)
      return;
  for (let i = 0, j = from - paddingLeft; i <= n; i++, j++) {
      knots[i] = segments[(j < 0 ? j + segments.length : j) % segments.length].point;
  }
  let x = knots[0].x + 2 * knots[1].x;
  let y = knots[0].y + 2 * knots[1].y;
  let  f = 2;
  let  n_1 = n - 1;
  let  rx = [x];
  let  ry = [y];
  let  rf = [f];
  let  px: number[] = [];
  let  py: number[] = [];
  // Solve with the Thomas algorithm
  for (let i = 1; i < n; i++) {
      const internal = i < n_1;
      //  internal--(I)  asymmetric--(R) (R)--continuous
      let a = internal ? 1 : asymmetric ? 1 : 2;
      let b = internal ? 4 : asymmetric ? 2 : 7;
      let u = internal ? 4 : asymmetric ? 3 : 8;
      let v = internal ? 2 : asymmetric ? 0 : 1;
      let m = a / f;
      f = rf[i] = b - m;
      x = rx[i] = u * knots[i].x + v * knots[i + 1].x - m * x;
      y = ry[i] = u * knots[i].y + v * knots[i + 1].y - m * y;
  }

  px[n_1] = rx[n_1] / rf[n_1];
  py[n_1] = ry[n_1] / rf[n_1];
  for (let i = n - 2; i >= 0; i--) {
      px[i] = (rx[i] - px[i + 1]) / rf[i];
      py[i] = (ry[i] - py[i + 1]) / rf[i];
  }
  px[n] = (3 * knots[n].x - px[n_1]) / 2;
  py[n] = (3 * knots[n].y - py[n_1]) / 2;

  // Now update the segments
  for (let i = paddingLeft, max = n - paddingRight, j = from;
          i <= max; i++, j++) {
      const segment = segments[j < 0 ? j + segments.length : j];
      const pt = segment.point;
      const hx = px[i] - pt.x;
      const hy = py[i] - pt.y;
      if (loop || i < max)
          segment.handleOut = {x: hx, y: hy};
      if (loop || i > paddingLeft)
          segment.handleIn = {x: -hx, y: -hy};
  }
}

export function boundsOf(segs: Iterable<Segment>, roundResult = false): {x: number; y: number; w: number; h: number} {
  let lastSeg: Segment | undefined;
  let firstSeg: Segment | undefined;
  const bounds: {x: {min: number; max: number}[]; y: {min: number; max: number}[]} = {x: [], y: []};
  // console.log([...segs].map(seg => seg.point));
  for (const seg of segs) {
    if (firstSeg == null)
      firstSeg = seg;
    if (lastSeg ) {
      if (seg.handleIn && lastSeg.handleOut) {
        const bei = new Bezier(lastSeg.point, lastSeg.absHandleOutPoint()!,
          seg.absHandleInPoint()!, seg.point);
        const box = bei.bbox();
        bounds.x.push(box.x);
        bounds.y.push(box.y);
      } else {
        let coord = {min: 0, max: 0};
        if (lastSeg.point.x < seg.point.x) {
          coord.min = lastSeg.point.x;
          coord.max = seg.point.x;
        } else {
          coord.max = lastSeg.point.x;
          coord.min = seg.point.x;
        }
        bounds.x.push(coord);
        coord = {min: 0, max: 0};
        if (lastSeg.point.y < seg.point.y) {
          coord.min = lastSeg.point.y;
          coord.max = seg.point.y;
        } else {
          coord.max = lastSeg.point.y;
          coord.min = seg.point.y;
        }
        bounds.y.push(coord);
      }
    }
    lastSeg = seg;
  }
  if (firstSeg && firstSeg.handleIn && lastSeg?.handleOut && firstSeg !== lastSeg) {
    const bei = new Bezier(lastSeg.point, lastSeg.absHandleOutPoint()!, firstSeg.absHandleInPoint()!, firstSeg.point);
    const box = bei.bbox();
    // console.log(box);
    bounds.x.push(box.x);
    bounds.y.push(box.y);
  }
  // console.log(bounds);
  const minOfXMins = bounds.x.reduce((prev, curr) => {
    return prev.min < curr.min ? prev : curr;
  }).min;

  const maxOfXMaxs = bounds.x.reduce((prev, curr) => {
    return prev.max > curr.max ? prev : curr;
  }).max;

  const minOfYMins = bounds.y.reduce((prev, curr) => {
    return prev.min < curr.min ? prev : curr;
  }).min;

  const maxOfYMaxs = bounds.y.reduce((prev, curr) => {
    return prev.max > curr.max ? prev : curr;
  }).max;

  return roundResult ? {
    x: round(minOfXMins), y: round(minOfYMins),
    w: round(maxOfXMaxs - minOfXMins),
    h: round(maxOfYMaxs - minOfYMins)
  } : {
    x: minOfXMins, y: minOfYMins,
    w: maxOfXMaxs - minOfXMins,
    h: maxOfYMaxs - minOfYMins
  };
}

export function centerOf(segs: Iterable<Segment>, roundResult = false): {x: number; y: number} {
  const bounds = boundsOf(segs);

  return {x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2};
}
