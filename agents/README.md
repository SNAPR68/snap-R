# SnapR Autonomous Agents

Python scripts that drive Claude programmatically via the Claude Agent SDK. Run them manually or wire into cron/GitHub Actions for autonomous workflows.

## Setup

```bash
pip3 install claude-agent-sdk
export ANTHROPIC_API_KEY="sk-ant-..."  # or put in ~/.zshenv
chmod +x agents/run.sh
```

## Agents

| Agent | What it does |
|---|---|
| `pr_reviewer.py` | Reads a PR, runs 6-aspect review, posts findings as a PR comment |
| `bug_fixer.py` | Finds root cause of a reported error, writes fix + test, opens a PR |
| `nightly_report.py` | Writes `reports/daily-YYYY-MM-DD.md` summarizing commits, PRs, errors, TODOs; pings Slack |

## Run

```bash
./agents/run.sh pr-review 42
./agents/run.sh bug-fix "TypeError: cannot read 'photos' of undefined"
./agents/run.sh nightly-report
```

## Smoke test

```bash
python3 agents/test_sdk.py
```

## Notes

- Uses `permission_mode="acceptEdits"` — agents can modify files, create branches, push, and open PRs. Review branches before merging.
- Each agent reads CLAUDE.md (root + subdir) for project context.
- `bug_fixer.py` follows the pre-commit hook — it updates `EXECUTION_CHANGELOG.md` when the change is structural.
