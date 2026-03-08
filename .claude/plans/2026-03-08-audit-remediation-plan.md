# Audit Remediation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 16 new models to the catalog (Qwen3.5, Unsloth, LFM2.5), fix documentation (purge OpenClaw, unify Five Pillars, document Operative agents, expand eval/tool/engine/channel docs), and expand engine-model matrix tests to all 12 engines.

**Architecture:** Three independent workstreams — model catalog, docs, tests — each with its own commit(s). No cross-dependencies between workstreams so they can be parallelized.

**Tech Stack:** Python (ModelSpec dataclass, pytest parametrize), Markdown docs, TOML configs.

---

## Task 1: Add Qwen3.5 models to catalog

**Files:**
- Modify: `src/openjarvis/intelligence/model_catalog.py:132` (after Trinity Mini entry)
- Test: `tests/intelligence/test_model_catalog.py` (if exists, else verify via import)

**Step 1: Add 4 Qwen3.5 ModelSpec entries**

Insert after the Trinity Mini entry (line 132), before the TeichAI section:

```python
    # -----------------------------------------------------------------------
    # Local models — Qwen3.5 (MoE, Gated DeltaNet + sparse MoE)
    # -----------------------------------------------------------------------
    ModelSpec(
        model_id="qwen3.5:4b",
        name="Qwen3.5 4B",
        parameter_count_b=4.0,
        active_parameter_count_b=0.5,
        context_length=262144,
        min_vram_gb=3.0,
        supported_engines=("ollama", "vllm", "sglang", "llamacpp"),
        provider="alibaba",
        metadata={
            "architecture": "moe",
            "hf_repo": "Qwen/Qwen3.5-4B",
        },
    ),
    ModelSpec(
        model_id="qwen3.5:35b-a3b",
        name="Qwen3.5 35B A3B",
        parameter_count_b=35.0,
        active_parameter_count_b=3.0,
        context_length=262144,
        min_vram_gb=8.0,
        supported_engines=("ollama", "vllm", "sglang"),
        provider="alibaba",
        metadata={
            "architecture": "moe",
            "hf_repo": "Qwen/Qwen3.5-35B-A3B",
        },
    ),
    ModelSpec(
        model_id="qwen3.5:122b-a10b",
        name="Qwen3.5 122B A10B",
        parameter_count_b=122.0,
        active_parameter_count_b=10.0,
        context_length=262144,
        min_vram_gb=20.0,
        supported_engines=("vllm", "sglang"),
        provider="alibaba",
        metadata={
            "architecture": "moe",
            "hf_repo": "Qwen/Qwen3.5-122B-A10B",
        },
    ),
    ModelSpec(
        model_id="qwen3.5:397b-a17b",
        name="Qwen3.5 397B A17B",
        parameter_count_b=397.0,
        active_parameter_count_b=17.0,
        context_length=262144,
        min_vram_gb=50.0,
        supported_engines=("vllm", "sglang"),
        provider="alibaba",
        metadata={
            "architecture": "moe",
            "hf_repo": "Qwen/Qwen3.5-397B-A17B",
        },
    ),
```

**Step 2: Verify import and registration**

Run: `uv run python -c "from openjarvis.intelligence.model_catalog import BUILTIN_MODELS; print(len(BUILTIN_MODELS))"`
Expected: `30` (was 26, +4 Qwen3.5)

**Step 3: Run lint**

Run: `uv run ruff check src/openjarvis/intelligence/model_catalog.py`
Expected: clean

**Step 4: Commit**

```bash
git add src/openjarvis/intelligence/model_catalog.py
git commit -m "feat(catalog): add Qwen3.5 family — 4B, 35B-A3B, 122B-A10B, 397B-A17B"
```

---

## Task 2: Add Unsloth GGUF models to catalog

**Files:**
- Modify: `src/openjarvis/intelligence/model_catalog.py` (after Qwen3.5 section from Task 1)

**Step 1: Add 8 Unsloth ModelSpec entries**

Insert after Qwen3.5 entries, before the TeichAI section:

```python
    # -----------------------------------------------------------------------
    # Local models — Unsloth GGUF Quantizations
    # -----------------------------------------------------------------------
    ModelSpec(
        model_id="unsloth/Qwen3.5-35B-A3B-GGUF",
        name="Qwen3.5 35B A3B (Unsloth GGUF)",
        parameter_count_b=35.0,
        active_parameter_count_b=3.0,
        context_length=262144,
        min_vram_gb=6.0,
        quantization=Quantization.GGUF,
        supported_engines=("ollama", "llamacpp"),
        provider="unsloth",
        metadata={
            "architecture": "moe",
            "hf_repo": "unsloth/Qwen3.5-35B-A3B-GGUF",
            "base_model": "Qwen/Qwen3.5-35B-A3B",
        },
    ),
    ModelSpec(
        model_id="unsloth/Qwen3.5-122B-A10B-GGUF",
        name="Qwen3.5 122B A10B (Unsloth GGUF)",
        parameter_count_b=122.0,
        active_parameter_count_b=10.0,
        context_length=262144,
        min_vram_gb=16.0,
        quantization=Quantization.GGUF,
        supported_engines=("ollama", "llamacpp"),
        provider="unsloth",
        metadata={
            "architecture": "moe",
            "hf_repo": "unsloth/Qwen3.5-122B-A10B-GGUF",
            "base_model": "Qwen/Qwen3.5-122B-A10B",
        },
    ),
    ModelSpec(
        model_id="unsloth/Qwen3.5-397B-A17B-GGUF",
        name="Qwen3.5 397B A17B (Unsloth GGUF)",
        parameter_count_b=397.0,
        active_parameter_count_b=17.0,
        context_length=262144,
        min_vram_gb=40.0,
        quantization=Quantization.GGUF,
        supported_engines=("ollama", "llamacpp"),
        provider="unsloth",
        metadata={
            "architecture": "moe",
            "hf_repo": "unsloth/Qwen3.5-397B-A17B-GGUF",
            "base_model": "Qwen/Qwen3.5-397B-A17B",
        },
    ),
    ModelSpec(
        model_id="unsloth/GLM-5-GGUF",
        name="GLM-5 (Unsloth GGUF)",
        parameter_count_b=100.0,
        context_length=131072,
        min_vram_gb=12.0,
        quantization=Quantization.GGUF,
        supported_engines=("ollama", "llamacpp"),
        provider="unsloth",
        metadata={
            "architecture": "dense",
            "hf_repo": "unsloth/GLM-5-GGUF",
            "base_model": "THUDM/GLM-5",
        },
    ),
    ModelSpec(
        model_id="unsloth/GLM-4.7-Flash-GGUF",
        name="GLM 4.7 Flash (Unsloth GGUF)",
        parameter_count_b=30.0,
        active_parameter_count_b=3.0,
        context_length=131072,
        min_vram_gb=6.0,
        quantization=Quantization.GGUF,
        supported_engines=("ollama", "llamacpp"),
        provider="unsloth",
        metadata={
            "architecture": "moe",
            "hf_repo": "unsloth/GLM-4.7-Flash-GGUF",
            "base_model": "THUDM/GLM-4.7-Flash-Chat",
        },
    ),
    ModelSpec(
        model_id="unsloth/Qwen3-Coder-Next-GGUF",
        name="Qwen3 Coder Next (Unsloth GGUF)",
        parameter_count_b=80.0,
        context_length=131072,
        min_vram_gb=12.0,
        quantization=Quantization.GGUF,
        supported_engines=("ollama", "llamacpp"),
        provider="unsloth",
        metadata={
            "architecture": "moe",
            "hf_repo": "unsloth/Qwen3-Coder-Next-GGUF",
            "base_model": "Qwen/Qwen3-Coder-Next",
        },
    ),
    ModelSpec(
        model_id="unsloth/MiniMax-M2.5-GGUF",
        name="MiniMax M2.5 (Unsloth GGUF)",
        parameter_count_b=229.0,
        context_length=131072,
        min_vram_gb=30.0,
        quantization=Quantization.GGUF,
        supported_engines=("ollama", "llamacpp"),
        provider="unsloth",
        metadata={
            "architecture": "moe",
            "hf_repo": "unsloth/MiniMax-M2.5-GGUF",
            "base_model": "MiniMax/MiniMax-M2.5",
        },
    ),
    ModelSpec(
        model_id="unsloth/Kimi-K2.5-GGUF",
        name="Kimi K2.5 (Unsloth GGUF)",
        parameter_count_b=1000.0,
        active_parameter_count_b=32.0,
        context_length=131072,
        min_vram_gb=40.0,
        quantization=Quantization.GGUF,
        supported_engines=("ollama", "llamacpp"),
        provider="unsloth",
        metadata={
            "architecture": "moe",
            "hf_repo": "unsloth/Kimi-K2.5-GGUF",
            "base_model": "moonshotai/Kimi-K2.5",
        },
    ),
```

**Step 2: Add Quantization import**

The file currently imports `ModelSpec` but not `Quantization`. Add to line 8:

```python
from openjarvis.core.types import ModelSpec, Quantization
```

**Step 3: Verify**

Run: `uv run python -c "from openjarvis.intelligence.model_catalog import BUILTIN_MODELS; print(len(BUILTIN_MODELS))"`
Expected: `38` (30 + 8 Unsloth)

**Step 4: Lint and commit**

```bash
uv run ruff check src/openjarvis/intelligence/model_catalog.py
git add src/openjarvis/intelligence/model_catalog.py
git commit -m "feat(catalog): add 8 Unsloth GGUF models — Qwen3.5, GLM-5, GLM-4.7, Coder-Next, MiniMax, Kimi"
```

---

## Task 3: Add LFM2.5 models to catalog

**Files:**
- Modify: `src/openjarvis/intelligence/model_catalog.py` (after Unsloth section from Task 2)

**Step 1: Add 4 LFM2.5 ModelSpec entries**

Insert after Unsloth entries, before the TeichAI section:

```python
    # -----------------------------------------------------------------------
    # Local models — LiquidAI LFM2.5 (Hybrid SSM+Transformer)
    # -----------------------------------------------------------------------
    ModelSpec(
        model_id="LiquidAI/LFM2.5-1.2B-Instruct-GGUF",
        name="LFM2.5 1.2B Instruct (GGUF)",
        parameter_count_b=1.2,
        context_length=32768,
        min_vram_gb=1.0,
        quantization=Quantization.GGUF,
        supported_engines=("llamacpp", "ollama"),
        provider="liquidai",
        metadata={
            "architecture": "hybrid_ssm_transformer",
            "hf_repo": "LiquidAI/LFM2.5-1.2B-Instruct-GGUF",
            "layers": "10 LIV convolution + 6 GQA",
            "languages": 8,
        },
    ),
    ModelSpec(
        model_id="LiquidAI/LFM2.5-1.2B-Instruct-MLX",
        name="LFM2.5 1.2B Instruct (MLX)",
        parameter_count_b=1.2,
        context_length=32768,
        min_vram_gb=1.0,
        supported_engines=("mlx",),
        provider="liquidai",
        metadata={
            "architecture": "hybrid_ssm_transformer",
            "hf_repo": "LiquidAI/LFM2.5-1.2B-Instruct-MLX",
            "layers": "10 LIV convolution + 6 GQA",
            "languages": 8,
        },
    ),
    ModelSpec(
        model_id="LiquidAI/LFM2.5-1.2B-Thinking-GGUF",
        name="LFM2.5 1.2B Thinking (GGUF)",
        parameter_count_b=1.2,
        context_length=32768,
        min_vram_gb=1.0,
        quantization=Quantization.GGUF,
        supported_engines=("llamacpp", "ollama"),
        provider="liquidai",
        metadata={
            "architecture": "hybrid_ssm_transformer",
            "hf_repo": "LiquidAI/LFM2.5-1.2B-Thinking-GGUF",
            "layers": "10 LIV convolution + 6 GQA",
            "variant": "reasoning-optimized",
            "languages": 8,
        },
    ),
    ModelSpec(
        model_id="LiquidAI/LFM2.5-1.2B-Thinking-MLX",
        name="LFM2.5 1.2B Thinking (MLX)",
        parameter_count_b=1.2,
        context_length=32768,
        min_vram_gb=1.0,
        supported_engines=("mlx",),
        provider="liquidai",
        metadata={
            "architecture": "hybrid_ssm_transformer",
            "hf_repo": "LiquidAI/LFM2.5-1.2B-Thinking-MLX",
            "layers": "10 LIV convolution + 6 GQA",
            "variant": "reasoning-optimized",
            "languages": 8,
        },
    ),
```

**Step 2: Verify**

Run: `uv run python -c "from openjarvis.intelligence.model_catalog import BUILTIN_MODELS; print(len(BUILTIN_MODELS))"`
Expected: `42` (38 + 4 LFM2.5)

**Step 3: Lint and commit**

```bash
uv run ruff check src/openjarvis/intelligence/model_catalog.py
git add src/openjarvis/intelligence/model_catalog.py
git commit -m "feat(catalog): add LFM2.5 family — Instruct + Thinking in GGUF and MLX formats"
```

---

## Task 4: Fold uncommitted cloud.py changes

**Files:**
- Modify: `src/openjarvis/engine/cloud.py` (already has uncommitted changes)

**Step 1: Verify the uncommitted diff is just the 2 pricing/model additions**

Run: `git diff HEAD -- src/openjarvis/engine/cloud.py`
Expected: additions of `gemini-3.1-flash-lite-preview` and `claude-haiku-4-5-20251001` to PRICING, _ANTHROPIC_MODELS, and _GOOGLE_MODELS.

**Step 2: Commit**

```bash
git add src/openjarvis/engine/cloud.py
git commit -m "feat(engine): add Gemini 3.1 Flash Lite and Claude Haiku 4.5 timestamped to cloud engine"
```

---

## Task 5: Purge OpenClawAgent from docs

**Files:**
- Modify: `docs/user-guide/agents.md` — remove OpenClawAgent table row (line 15), full section (lines 262-291), CLI examples (lines 320-321, 548-549)
- Modify: `docs/architecture/overview.md` — remove OpenClaw mention (line 65)
- Modify: `docs/architecture/agents.md` — remove OpenClaw reference (line 65), section (lines 350-383), infrastructure section (lines 538-599)
- Modify: `docs/development/contributing.md` — remove Node.js requirement for OpenClaw (line 16), file references (lines 208-211)
- Modify: `docs/development/changelog.md` — remove OpenClaw changelog section (lines 135-142)

**Step 1: Read each file and remove OpenClaw references**

For each file, search for "OpenClaw" or "openclaw" and remove the containing sections. When removing table rows, ensure the table stays well-formed. When removing sections, ensure headings flow correctly.

**Step 2: Verify mkdocs builds clean**

Run: `uv run mkdocs build --strict 2>&1 | head -20` (if mkdocs is available)
Or: `uv run ruff check docs/` (for any Python in docs)

**Step 3: Commit**

```bash
git add docs/
git commit -m "docs: remove vestigial OpenClawAgent references from all documentation"
```

---

## Task 6: Unify "Five Pillars" terminology

**Files:**
- Modify: `docs/architecture/overview.md`
  - Line 3: change "four core abstractions" to "five core abstractions"
  - Line 7: change "## The Four Pillars + Learning" to "## The Five Pillars"
  - Update the body text to list Learning as the fifth pillar rather than "cross-cutting"

**Step 1: Read docs/architecture/overview.md and make edits**

Change the heading and intro paragraph to match the Five Pillars framing used in `docs/index.md` and `README.md`: Intelligence, Agents, Tools, Engine, Learning.

**Step 2: Commit**

```bash
git add docs/architecture/overview.md
git commit -m "docs: unify Five Pillars terminology in architecture overview"
```

---

## Task 7: Document OperativeAgent and MonitorOperativeAgent

**Files:**
- Modify: `docs/user-guide/agents.md` — add new section after existing agents
- Read: `src/openjarvis/agents/operative.py` and `src/openjarvis/agents/monitor_operative.py` for accurate content

**Step 1: Read both source files fully**

Understand: constructor params, strategies (MonitorOperative has 4 strategy axes), session/state persistence, system prompt behavior.

**Step 2: Add OperativeAgent section to docs/user-guide/agents.md**

Add after the last existing agent section. Include:
- Registration key: `operative`
- Purpose: persistent scheduled autonomous agent
- Key features: session loading, state recall, state persistence
- Constructor params: `max_turns`, `temperature`, `session_store`, `memory_backend`, `operator_id`
- Example usage with `jarvis ask --agent operative`

**Step 3: Add MonitorOperativeAgent section**

- Registration key: `monitor_operative`
- Purpose: long-horizon agent with configurable strategies
- 4 strategy axes: `memory_extraction`, `observation_compression`, `retrieval_strategy`, `task_decomposition`
- Valid values for each strategy
- Example usage

**Step 4: Commit**

```bash
git add docs/user-guide/agents.md
git commit -m "docs: add OperativeAgent and MonitorOperativeAgent documentation"
```

---

## Task 8: Expand evaluations documentation

**Files:**
- Modify: `docs/user-guide/evaluations.md`

**Step 1: Read current evaluations.md**

Currently documents only 4 datasets (SuperGPQA, GAIA, FRAMES, WildChat).

**Step 2: Add comprehensive dataset table**

Add a table listing all available datasets. Group by category:

- **Use-Case Benchmarks**: coding_assistant, security_scanner, daily_digest, doc_qa, browser_assistant
- **Academic Benchmarks**: SuperGPQA, GPQA, MMLU-Pro, MATH-500, SimpleQA
- **Agent Benchmarks**: GAIA, SWE-bench, TerminalBench, LifelongAgent, PaperArena
- **Retrieval Benchmarks**: FRAMES
- **Conversation Benchmarks**: WildChat

For each: name, description, sample count, scoring method.

**Step 3: Add section on use-case configs**

Document how to run `use_case_v2_cloud.toml` and `use_case_v2_local.toml`.

**Step 4: Commit**

```bash
git add docs/user-guide/evaluations.md
git commit -m "docs: expand evaluations page with all 40+ datasets and use-case configs"
```

---

## Task 9: Expand tools documentation

**Files:**
- Modify: `docs/user-guide/tools.md`

**Step 1: Read current tools.md and `src/openjarvis/tools/__init__.py`**

Get the full list of registered tools from the `__init__.py` and any tool files.

**Step 2: Add comprehensive tool table grouped by category**

Categories: File I/O, Code Execution, Web, Browser, Git, Knowledge Graph, Memory, Agent Management, Communication, System, Reasoning.

For each tool: name, description, key parameters.

**Step 3: Commit**

```bash
git add docs/user-guide/tools.md
git commit -m "docs: expand tools page with all 45+ available tools"
```

---

## Task 10: Expand engine documentation

**Files:**
- Modify: `docs/architecture/engine.md`

**Step 1: Read current engine.md**

Currently documents Ollama, vLLM, SGLang, llama.cpp, Cloud.

**Step 2: Add missing engines to the backend comparison table**

Add rows for: MLX, LM Studio, Exo, Nexa, Uzu, Apple FM, LiteLLM.

For each: registry key, protocol, GPU requirements, best-for description, default port.

**Step 3: Commit**

```bash
git add docs/architecture/engine.md
git commit -m "docs: add 7 missing engines to backend comparison table"
```

---

## Task 11: Add channel documentation

**Files:**
- Modify: `docs/user-guide/channels.md` (create if it doesn't exist, or find existing channel docs page)
- Modify: `mkdocs.yml` — add nav entry if creating new page

**Step 1: List all channel implementations**

Run: `ls src/openjarvis/channels/` and read `__init__.py` to get all registered channels.

**Step 2: Create channel matrix table**

List all 27 channels: name, registry key, required extra dependency, status.

**Step 3: Add to mkdocs nav if needed**

**Step 4: Commit**

```bash
git add docs/ mkdocs.yml
git commit -m "docs: add channel matrix documenting all 27 supported channels"
```

---

## Task 12: Expand engine-model matrix tests to all 12 engines

**Files:**
- Modify: `tests/engine/test_engine_model_matrix.py`

**Step 1: Expand imports**

Add imports for all engine classes:

```python
from openjarvis.engine.ollama import OllamaEngine
from openjarvis.engine.openai_compat_engines import (
    VLLMEngine, SGLangEngine, LlamaCppEngine, MLXEngine,
    LMStudioEngine, ExoEngine, NexaEngine, UzuEngine, AppleFmEngine,
)
```

**Step 2: Expand ENGINES_AND_HOSTS**

```python
# OpenAI-compatible engines (all share /v1/chat/completions mock)
_OPENAI_COMPAT_ENGINES = [
    ("vllm", "http://testhost:8000", VLLMEngine),
    ("sglang", "http://testhost:30000", SGLangEngine),
    ("llamacpp", "http://testhost:8080", LlamaCppEngine),
    ("mlx", "http://testhost:8080", MLXEngine),
    ("lmstudio", "http://testhost:1234", LMStudioEngine),
    ("exo", "http://testhost:52415", ExoEngine),
    ("nexa", "http://testhost:18181", NexaEngine),
    ("uzu", "http://testhost:8080", UzuEngine),
    ("apple_fm", "http://testhost:8079", AppleFmEngine),
]

ENGINES_AND_HOSTS = [
    (key, host) for key, host, _ in _OPENAI_COMPAT_ENGINES
] + [
    ("ollama", "http://testhost:11434"),
]
```

**Step 3: Rewrite `_create_engine` to handle all engines**

```python
_ENGINE_CLASSES = {key: cls for key, _, cls in _OPENAI_COMPAT_ENGINES}
_ENGINE_CLASSES["ollama"] = OllamaEngine

def _create_engine(engine_key: str, host: str):
    cls = _ENGINE_CLASSES.get(engine_key)
    if cls is None:
        raise ValueError(f"Unknown engine: {engine_key}")
    if not EngineRegistry.contains(engine_key):
        EngineRegistry.register_value(engine_key, cls)
    return cls(host=host)
```

**Step 4: Update mock helpers to handle OpenAI-compatible engines generically**

The key insight: all OpenAI-compatible engines use the same `/v1/chat/completions` endpoint. Update the `if engine_key == "vllm"` checks to `if engine_key != "ollama"` (i.e., everything except Ollama uses the OpenAI format).

```python
def _mock_simple_chat(respx_mock, engine_key: str, host: str, model: str):
    if engine_key == "ollama":
        respx_mock.post(f"{host}/api/chat").mock(
            return_value=httpx.Response(200, json={
                "message": {"role": "assistant", "content": "Hello!"},
                "model": model,
                "prompt_eval_count": 10,
                "eval_count": 5,
                "done": True,
            })
        )
    else:  # All OpenAI-compatible engines
        respx_mock.post(f"{host}/v1/chat/completions").mock(
            return_value=httpx.Response(200, json={
                "choices": [
                    {"message": {"content": "Hello!"}, "finish_reason": "stop"},
                ],
                "usage": {
                    "prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15,
                },
                "model": model,
            })
        )
```

Apply same pattern to `_mock_tool_call`, `_mock_error`, and health check mocks.

**Step 5: Add new models to MODELS list**

```python
MODELS = [
    "gpt-oss:120b", "qwen3:8b", "glm-4.7-flash", "trinity-mini",
    "qwen3.5:35b-a3b", "LiquidAI/LFM2.5-1.2B-Instruct-GGUF",
]
```

**Step 6: Run tests**

Run: `uv run pytest tests/engine/test_engine_model_matrix.py -v`
Expected: ~10 engines x 6 models x 3 scenarios + 10 engines x 2 health checks = ~200 tests, all PASS

**Step 7: Lint and commit**

```bash
uv run ruff check tests/engine/test_engine_model_matrix.py
git add tests/engine/test_engine_model_matrix.py
git commit -m "test(engine): expand engine-model matrix to all 10 HTTP engines x 6 models"
```

Note: Cloud and LiteLLM are excluded from this matrix because they use SDK calls rather than HTTP — they have their own dedicated test files (`test_cloud.py`, `test_litellm.py`).

---

## Task 13: Run lint and full test suite

**Step 1: Lint**

Run: `uv run ruff check src/ tests/`
Expected: clean

**Step 2: Run tests**

Run: `uv run pytest -m "not live and not cloud" tests/ -v --tb=short`
Expected: all pass

**Step 3: Fix any issues found, commit fixes**
