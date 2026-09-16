/** Synthetic model generator: `groups` × (`fields` scalars + `fields` nested
 * scalars + a 2-field array row) => groups * (2*fields + 2) leaves. */
export function modelSource(name: string, groups: number, fields: number) {
  const scal = (p: string, n: number) =>
    Array.from({ length: n }, (_, j) =>
      `${p}${j}: ${['string', 'number', 'boolean', 'string'][j % 4]};`,
    ).join(' ');
  const body = Array.from({ length: groups }, (_, i) =>
    `  g${i}: { ${scal('f', fields)} nested: { ${scal('n', fields)} }; rows: { sku: string; qty: number }[] };`,
  ).join('\n');
  return `interface ${name} {\n${body}\n}\n`;
}

export function leafPaths(groups: number, fields: number) {
  const out: string[] = [];
  for (let i = 0; i < groups; i++) {
    for (let j = 0; j < fields; j++) out.push(`g${i}.f${j}`);
    for (let j = 0; j < fields; j++) out.push(`g${i}.nested.n${j}`);
    out.push(`g${i}.rows[].sku`, `g${i}.rows[].qty`);
  }
  return out;
}

export const leafType = (path: string) => {
  if (path.endsWith('.qty')) return 'number';
  if (path.endsWith('.sku')) return 'string';
  const j = Number(path.slice(-1));
  return ['string', 'number', 'boolean', 'string'][j % 4];
};
