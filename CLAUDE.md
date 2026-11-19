@AGENTS.md
@docs/STATE.md

## Workflow skills (Claude Code)
This build runs on the `hackathon` and `foundation` skills. Run `/foundation handoff` before you
stop, `/benchmark` before a milestone closes, and `/hackathon submit` then `/hackathon preflight`
before the deadline. To read exactly what they do, the instructions are in
`~/.claude/skills/hackathon/SKILL.md` and `~/.claude/skills/foundation/SKILL.md`.

## Effort: tell the user when to switch
Before each task, name the effort it needs in one line. If that differs from the current
level, add the command, e.g. "This needs low; `/effort low`." Never switch it yourself.
- **low:** handoff, STATE rewrites, renames, formatting, copy tweaks, re-running a known command
- **medium:** routine features against a clear spec, tests, wiring, the README, the submission form
- **high:** architecture, the signature component, the UI pass, the thesis and its claims, anything that moves money or touches security
- **xhigh or max:** a bug that survived two attempts, a contract invariant, a migration that can't be undone
