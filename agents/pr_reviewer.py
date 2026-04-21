"""PR Reviewer Agent — reads a PR, audits it, posts a review comment.

Usage:
    python3 agents/pr_reviewer.py <pr_number>
    python3 agents/pr_reviewer.py 42
"""
import asyncio
import sys

from claude_agent_sdk import ClaudeAgentOptions, query


async def review_pr(pr_number: str) -> None:
    prompt = f"""
    Review PR #{pr_number} in the SNAPR68/snap-R repository.

    1. Use `gh pr view {pr_number} --json title,body,files,baseRefName,headRefName` to get PR metadata.
    2. Use `gh pr diff {pr_number}` to read the full diff.
    3. Read the changed files for context (use Read tool).
    4. Run a 6-aspect review:
       - Correctness (logic errors, edge cases)
       - Security (injection, auth, secrets)
       - Performance (N+1, unbounded loops, bundle size)
       - Maintainability (naming, duplication, dead code)
       - Test coverage (happy path + edge cases + error paths)
       - API contracts (breaking changes to response shapes)
    5. Follow the SnapR CLAUDE.md patterns — especially error handling
       (`catch (error: unknown)`), Zod validation on API routes, rate limiting,
       and the Supabase client selection rules.
    6. Post the review as a PR comment via `gh pr comment {pr_number} --body "..."`.

    Format each finding:
      [severity] 🔴 Critical | 🟡 Warning | 🔵 Suggestion
      <path>:<line>
      Problem: <one sentence>
      Why it matters: <one sentence>
      Fix: ```<lang>\\n<code>\\n```

    End with a verdict: Ship it / Ship after fixing Criticals / Don't ship.
    If the PR looks clean, post a brief approval summary instead.
    """

    async for message in query(
        prompt=prompt,
        options=ClaudeAgentOptions(
            allowed_tools=["Bash", "Read", "Glob", "Grep"],
            permission_mode="acceptEdits",
        ),
    ):
        if hasattr(message, "result"):
            print(message.result)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 agents/pr_reviewer.py <pr_number>", file=sys.stderr)
        sys.exit(1)
    asyncio.run(review_pr(sys.argv[1]))
