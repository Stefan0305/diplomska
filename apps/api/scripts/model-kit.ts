/** Tiny low-poly modelling kit for the generated built-in models (boxes, cylinders, spheres). */
import { Document, type Material, type Node } from '@gltf-transform/core';

export interface Geometry {
  positions: number[];
  normals: number[];
  indices: number[];
}

export type Vec3 = [number, number, number];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];

/** Axis-aligned box centred on the origin; faces wound counter-clockwise seen from outside. */
export function box(width: number, height: number, depth: number): Geometry {
  const half: Vec3 = [width / 2, height / 2, depth / 2];
  const X: Vec3 = [1, 0, 0];
  const Y: Vec3 = [0, 1, 0];
  const Z: Vec3 = [0, 0, 1];
  // [normal, u, v] with u × v = normal, so (-u,-v) (+u,-v) (+u,+v) (-u,+v) is CCW.
  const faces: [Vec3, Vec3, Vec3][] = [
    [X, Y, Z],
    [mul(X, -1), Z, Y],
    [Y, Z, X],
    [mul(Y, -1), X, Z],
    [Z, X, Y],
    [mul(Z, -1), Y, X],
  ];
  const g: Geometry = { positions: [], normals: [], indices: [] };
  const extent = (axis: Vec3) => axis[0] * half[0] + axis[1] * half[1] + axis[2] * half[2];
  for (const [n, u, v] of faces) {
    const base = g.positions.length / 3;
    const centre = mul(n, Math.abs(extent(n)));
    const hu = Math.abs(extent(u));
    const hv = Math.abs(extent(v));
    for (const [su, sv] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const) {
      g.positions.push(...add(add(centre, mul(u, su * hu)), mul(v, sv * hv)));
      g.normals.push(...n);
    }
    g.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return g;
}

/** Vertical cylinder or cone (topRadius 0) centred on the origin. */
export function cylinder(
  topRadius: number,
  bottomRadius: number,
  height: number,
  segments = 24,
): Geometry {
  const g: Geometry = { positions: [], normals: [], indices: [] };
  const h = height / 2;
  // Side: two vertices per segment edge, normals tilted for cones.
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    const n: Vec3 = [c * height, bottomRadius - topRadius, s * height];
    const len = Math.hypot(...n);
    const normal = mul(n, 1 / len);
    g.positions.push(bottomRadius * c, -h, bottomRadius * s, topRadius * c, h, topRadius * s);
    g.normals.push(...normal, ...normal);
  }
  for (let i = 0; i < segments; i++) {
    const [b0, t0, b1, t1] = [i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 3];
    g.indices.push(b0, t0, t1, b0, t1, b1);
  }
  // Caps as triangle fans.
  const cap = (radius: number, y: number, up: boolean) => {
    if (radius <= 0) return;
    const centre = g.positions.length / 3;
    g.positions.push(0, y, 0);
    g.normals.push(0, up ? 1 : -1, 0);
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      g.positions.push(radius * Math.cos(a), y, radius * Math.sin(a));
      g.normals.push(0, up ? 1 : -1, 0);
    }
    for (let i = 0; i < segments; i++) {
      const [p0, p1] = [centre + 1 + i, centre + 2 + i];
      if (up) g.indices.push(centre, p1, p0);
      else g.indices.push(centre, p0, p1);
    }
  };
  cap(topRadius, h, true);
  cap(bottomRadius, -h, false);
  return g;
}

/** UV sphere centred on the origin. */
export function sphere(radius: number, widthSegments = 16, heightSegments = 10): Geometry {
  const g: Geometry = { positions: [], normals: [], indices: [] };
  for (let y = 0; y <= heightSegments; y++) {
    const v = (y / heightSegments) * Math.PI;
    for (let x = 0; x <= widthSegments; x++) {
      const u = (x / widthSegments) * Math.PI * 2;
      const n: Vec3 = [Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u)];
      g.positions.push(...mul(n, radius));
      g.normals.push(...n);
    }
  }
  const row = widthSegments + 1;
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const [a, b, c, d] = [y * row + x, y * row + x + 1, (y + 1) * row + x, (y + 1) * row + x + 1];
      if (y > 0) g.indices.push(a, b, c);
      if (y < heightSegments - 1) g.indices.push(b, d, c);
    }
  }
  return g;
}

export class ModelBuilder {
  readonly doc = new Document();
  private readonly buffer = this.doc.createBuffer();
  readonly root: Node;

  constructor(name: string) {
    this.root = this.doc.createNode(name);
    this.doc.getRoot().setDefaultScene(this.doc.createScene(name).addChild(this.root));
  }

  material(name: string, rgb: Vec3, roughness = 0.8): Material {
    return this.doc
      .createMaterial(name)
      .setBaseColorFactor([...rgb, 1])
      .setRoughnessFactor(roughness)
      .setMetallicFactor(0);
  }

  /** Add a mesh node; `scale` stretches the part (e.g. a sphere into a flattened bush). */
  part(
    name: string,
    geometry: Geometry,
    material: Material,
    translation: Vec3,
    scale: Vec3 = [1, 1, 1],
  ): this {
    const accessor = (
      type: 'VEC3' | 'SCALAR',
      array: Float32Array<ArrayBuffer> | Uint16Array<ArrayBuffer>,
    ) => this.doc.createAccessor().setType(type).setArray(array).setBuffer(this.buffer);
    const primitive = this.doc
      .createPrimitive()
      .setAttribute('POSITION', accessor('VEC3', new Float32Array(geometry.positions)))
      .setAttribute('NORMAL', accessor('VEC3', new Float32Array(geometry.normals)))
      .setIndices(accessor('SCALAR', new Uint16Array(geometry.indices)))
      .setMaterial(material);
    const mesh = this.doc.createMesh(name).addPrimitive(primitive);
    this.root.addChild(
      this.doc.createNode(name).setMesh(mesh).setTranslation(translation).setScale(scale),
    );
    return this;
  }
}
