# Regenerate with: vhs assets/demo.tape (run from the repo root)
# Records `assets/demo.prisma` (a small, purpose-built demo schema — not one of the
# CI-verified prisma/*.prisma fixtures) being turned into TypeScript classes via
# `prisma generate`. Uses the real generator via ts-node, dryRun left at its default
# (true) so the preview-then-flip-to-false UX from src/generator.ts shows up as-is.

Output assets/demo.gif

Require npx

Set Shell "bash"
Set FontSize 15
Set Width 1200
Set Height 900
Set Theme "Dracula"
Set Padding 20
Set TypingSpeed 40ms

Hide
Type "export DATABASE_URL='postgresql://user:pass@localhost:5432/db'"
Enter
Type "clear"
Enter
Show

Type "cat assets/demo.prisma"
Sleep 500ms
Enter
Sleep 3s

Type "npx prisma generate --schema assets/demo.prisma"
Sleep 500ms
Enter
Sleep 8s
