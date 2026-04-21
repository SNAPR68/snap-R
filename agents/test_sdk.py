"""Quick smoke test to confirm the Claude Agent SDK is working end-to-end.

Usage:
    python3 agents/test_sdk.py
"""
import asyncio

from claude_agent_sdk import ClaudeAgentOptions, query


async def test() -> None:
    async for msg in query(
        prompt=(
            "List the top-level files and folders in this project "
            "and tell me in one sentence what this app does."
        ),
        options=ClaudeAgentOptions(allowed_tools=["Bash", "Read", "Glob"]),
    ):
        if hasattr(msg, "result"):
            print(msg.result)


if __name__ == "__main__":
    asyncio.run(test())
