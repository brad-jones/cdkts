# AGENTS.md

**IMPORTANT:** By default I use the [`fish`](https://fishshell.com/) shell
instead of a POSIX complaint shell like [`bash`](https://www.gnu.org/software/bash/),
when running commands & shell scripts, always start your own instance of `/usr/sbin/bash`.

## SKILLS

- Use `.agents/skills/git-commit/SKILL.md` when making git commits.

## TASKS

This project uses [`task`](https://taskfile.dev/) - A fast, cross-platform build
tool inspired by Make, designed for modern workflows.

- `task lint`: Lints our code to ensure it remains of a high quality.
- `task fmt`: Formats our code to ensure it looks consistent. _(can automatically correct some lint issues)_
- `task test`: Executes our test suites. Use this to ensure changes that you make are correct.
