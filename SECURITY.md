# Security Policy

## Supported Versions

Only the latest published version on npm receives security fixes. This project
does not maintain long-term-support branches for older major/minor versions.

| Version | Supported          |
| ------- | ------------------- |
| latest  | :white_check_mark:  |
| < latest| :x:                  |

## Reporting a Vulnerability

Please **do not open a public GitHub issue** for security vulnerabilities.

Instead, report it privately using one of these channels:

- [GitHub Security Advisories](https://github.com/kimjbstar/prisma-class-generator/security/advisories/new)
  (preferred — lets us coordinate a fix and disclosure privately)
- Email: kimjbstar@gmail.com

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce (a minimal `schema.prisma` + generator config is ideal,
  since this tool's attack surface is mostly "untrusted schema/config in,
  generated code out")
- Any relevant version information (this package's version, Prisma version,
  Node.js version)

You should expect an initial response within a few days. This is a
single-maintainer project, so timelines aren't guaranteed, but security
reports are prioritized over feature work.

## Scope

`prisma-class-generator` runs at code-generation time (inside `prisma
generate`), not at runtime in a deployed application. Relevant vulnerability
classes include:

- Code generation that could lead to unsafe/executable output from a crafted
  `schema.prisma` or generator config
- Path traversal or unintended file writes outside the configured output
  directory
- Supply-chain issues in this package's own dependencies

Bugs in *generated* application code that don't stem from a generation-time
vulnerability (e.g. "the generated class doesn't validate X the way I
expected") are regular bugs — please file those as normal GitHub issues.
