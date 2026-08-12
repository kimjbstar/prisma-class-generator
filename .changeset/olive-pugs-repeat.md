---
'prisma-class-generator': patch
---

Adopt TypeScript `strict` mode across the generator's own source and specs. This is an internal
type-safety change with no difference in generated output (the golden fixture snapshots are
byte-identical), but it did tighten a few types that were previously lying about what they can
hold at runtime: `getPrimitiveMapTypeFromDMMF()` now declares the `undefined` it already returned
for non-scalar fields, `ImportComponent#getReplacePath()` declares its `null`, `prettierOptions`
declares the `null` prettier itself returns when a project has no config file, and
`handleGenerateError()` accepts `unknown` instead of assuming a `catch` block always yields an
`Error`.
