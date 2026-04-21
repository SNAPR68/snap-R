"""Nightly Report Agent — scans the day's activity and writes a markdown report.

Run manually or from cron:
    python3 agents/nightly_report.py
"""
import asyncio
from datetime import datetime

from claude_agent_sdk import ClaudeAgentOptions, query


async def generate_report() -> None:
    today = datetime.now().strftime("%Y-%m-%d")
    report_path = f"reports/daily-{today}.md"

    prompt = f"""
    Generate today's SnapR daily report.

    1. Commits shipped today:
       `git log --since=midnight --pretty=format:'%h %an %s' --no-merges`
       Summarize by theme (feature / fix / chore / refactor).

    2. Open PRs:
       `gh pr list --state open --json number,title,author,isDraft,reviewDecision,updatedAt`
       For each, note: draft status, review decision, last activity.

    3. New Sentry errors since 00:00 (today):
       - If the Sentry MCP is available, query unresolved issues with activity today.
       - If not, note "Sentry MCP unavailable — skipping" and move on.

    4. TODO/FIXME/HACK scan:
       Grep `TODO|FIXME|HACK` across `app/`, `lib/`, `components/`, `apps/processor/src/`,
       `remotion/`. Count by type, list top 10 FIXMEs.

    5. Write the report to `{report_path}`:
       ```
       # SnapR Daily — {today}

       ## Shipped today
       ...
       ## Open PRs
       ...
       ## New errors (Sentry)
       ...
       ## Debt scan
       ...
       ```

    6. Post a 3-line summary to Slack #engineering via the Slack MCP if available.
       If Slack MCP is not available, note it and print the summary to stdout.

    Keep the report terse. No fluff. The goal is a glanceable end-of-day snapshot.
    """

    async for message in query(
        prompt=prompt,
        options=ClaudeAgentOptions(
            allowed_tools=["Bash", "Read", "Write", "Glob", "Grep"],
            permission_mode="acceptEdits",
        ),
    ):
        if hasattr(message, "result"):
            print(message.result)


if __name__ == "__main__":
    asyncio.run(generate_report())
