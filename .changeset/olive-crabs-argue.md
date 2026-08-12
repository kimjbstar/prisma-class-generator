---
'prisma-class-generator': patch
---

Fix `useNonNullableAssertions` producing TypeScript that doesn't compile. A field with a literal
`@default(...)` was emitted as `views!: number = 0`, which is TS1263 — "Declarations with
initializers cannot also have definite assignment assertions". Any model with at least one
defaulted field made the whole generated file fail to build, and `useUndefinedDefault` hit the
same thing. The assertion is now omitted whenever the field has an initializer, which is what
definite assignment already means.
