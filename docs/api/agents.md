# Agents Module

The agents module implements the agentic logic pillar. All agents implement
the `BaseAgent` ABC with a `run()` method. Agents handle queries by
coordinating tool calls, memory retrieval, and inference engine interactions.
The module also includes the OpenClaw infrastructure for interoperating with
external agent frameworks via HTTP or subprocess transport.

## Abstract Base Classes and Context

### BaseAgent

::: openjarvis.agents._stubs.BaseAgent
    options:
      show_source: true
      members_order: source

### ToolUsingAgent

::: openjarvis.agents._stubs.ToolUsingAgent
    options:
      show_source: true
      members_order: source

### AgentContext

::: openjarvis.agents._stubs.AgentContext
    options:
      show_source: true
      members_order: source

### AgentResult

::: openjarvis.agents._stubs.AgentResult
    options:
      show_source: true
      members_order: source

---

## Agent Implementations

### SimpleAgent

::: openjarvis.agents.simple.SimpleAgent
    options:
      show_source: true
      members_order: source

### OrchestratorAgent

::: openjarvis.agents.orchestrator.OrchestratorAgent
    options:
      show_source: true
      members_order: source

### NativeReActAgent

::: openjarvis.agents.native_react.NativeReActAgent
    options:
      show_source: true
      members_order: source

### NativeOpenHandsAgent

::: openjarvis.agents.native_openhands.NativeOpenHandsAgent
    options:
      show_source: true
      members_order: source

### RLMAgent

::: openjarvis.agents.rlm.RLMAgent
    options:
      show_source: true
      members_order: source

### OpenHandsAgent

::: openjarvis.agents.openhands.OpenHandsAgent
    options:
      show_source: true
      members_order: source



!!! note "OpenClaw Infrastructure"
    The OpenClaw protocol, transport, and plugin modules (`openclaw_protocol.py`,
    `openclaw_transport.py`, `openclaw_plugin.py`, `openclaw.py`) are part of the
    OpenClaw agent infrastructure and require the `openjarvis[openclaw]` extra.
    See the [architecture documentation](../architecture/agents.md#openclaw-infrastructure)
    for protocol and transport details.
