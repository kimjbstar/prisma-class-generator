---
"prisma-class-generator": patch
---

Removes every remaining `any` in `src/` and turns `@typescript-eslint/no-explicit-any` back
into a hard error (it was temporarily downgraded to a warning when ESLint first landed).

- `DecoratorComponent#params` was typed `any[]`, treated as genuinely unshapeable. It isn't:
  every value actually pushed through it across `convertor.ts` is either a ready-to-interpolate
  code fragment (string/number/boolean) or a plain options object rendered via
  `Object.entries()`. Now typed as an exported `DecoratorParam = string | number | boolean |
  object` union -- `object` rather than `Record<string, unknown>` on purpose, since the latter
  demands an index signature that a concrete interface like `SwaggerDecoratorParams` doesn't
  (and shouldn't) declare.
- `ImportComponent#add(item: any)` -- its one real call site (`FileComponent#registerImport`)
  always passes a `string`, matching the class's own `items: string[]` field. Typed as such.
- `PrismaClassGeneratorConfig` was `Partial<Record<PrismaClassGeneratorOptionsKeys, any>>`.
  Every option is a plain `boolean` except `clientImportPath` (`string | string[]`) -- named
  explicitly as an interface instead of one union covering all of them, so
  `config.dryRun`/`config.useGraphQL`/etc. type as real booleans everywhere they're read,
  no cast needed.

No behavior change -- `npm run build`/`test` output is identical; this is strictly narrowing
existing `any` slots to the types the values already had at runtime.
