# Evaluation Framework

The `openjarvis-evals` package provides a structured harness for measuring model quality
across research benchmarks. It is a separate package from the main `openjarvis` library,
installed from the `evals/` directory, and exposes a CLI (`openjarvis-eval`) plus a
Python API for programmatic use.

The framework is organized around four ABCs — `InferenceBackend`, `DatasetProvider`,
`Scorer`, and the concrete `EvalRunner` — wired together by `RunConfig`. A TOML-based
suite configuration system expands a models-by-benchmarks matrix into individual
`RunConfig` objects so an entire comparison table can be launched from a single file.

!!! note "Installation"
    The evaluation framework is a separate package. Install it from the repository root:

    ```bash
    cd evals/
    uv pip install -e ".[dev]"
    # or
    pip install -e ".[dev]"
    ```

    The package requires Python 3.10+, `openjarvis>=1.0.0`, and `datasets>=2.14`.

---

## Core Types (`evals.core.types`)

These dataclasses are the shared vocabulary for every component in the framework.

### EvalRecord

A single evaluation sample loaded from a dataset.

```python
from evals.core.types import EvalRecord
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `record_id` | `str` | — | Unique identifier for this sample |
| `problem` | `str` | — | The prompt or question presented to the model |
| `reference` | `str` | — | Ground-truth answer used for scoring |
| `category` | `str` | — | Task category: `"chat"`, `"reasoning"`, `"rag"`, or `"agentic"` |
| `subject` | `str` | `""` | Subject area or sub-topic within the benchmark |
| `metadata` | `Dict[str, Any]` | `{}` | Benchmark-specific extra fields (options, difficulty, file paths, etc.) |

```python
record = EvalRecord(
    record_id="supergpqa-0",
    problem="What is the capital of France?\nOptions:\nA. Berlin\nB. Paris\nC. Madrid",
    reference="B",
    category="reasoning",
    subject="geography",
    metadata={"difficulty": "easy", "options": ["Berlin", "Paris", "Madrid"]},
)
```

---

### EvalResult

The result of running inference on a single `EvalRecord`.

```python
from evals.core.types import EvalResult
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `record_id` | `str` | — | Matches the source `EvalRecord.record_id` |
| `model_answer` | `str` | — | Raw text output from the model |
| `is_correct` | `Optional[bool]` | `None` | Scoring verdict; `None` if scoring could not be determined |
| `score` | `Optional[float]` | `None` | Numeric score (typically `1.0` / `0.0`); may be `None` if `is_correct` is `None` |
| `latency_seconds` | `float` | `0.0` | Wall-clock generation time |
| `prompt_tokens` | `int` | `0` | Input token count from usage metadata |
| `completion_tokens` | `int` | `0` | Output token count from usage metadata |
| `cost_usd` | `float` | `0.0` | Estimated inference cost in USD |
| `error` | `Optional[str]` | `None` | Exception message if inference or scoring failed |
| `scoring_metadata` | `Dict[str, Any]` | `{}` | Scorer-specific details (extracted letter, judge output, match type, etc.) |

!!! tip "Distinguishing errors from wrong answers"
    A non-`None` `error` field means inference itself failed. When `error` is `None` but
    `is_correct` is `None`, scoring was attempted but the scorer could not determine a
    verdict (for example, the judge returned an unparseable response).

---

### RunConfig

Configuration for a single evaluation run (one model on one benchmark).

```python
from evals.core.types import RunConfig
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `benchmark` | `str` | — | Benchmark name: `"supergpqa"`, `"gaia"`, `"frames"`, or `"wildchat"` |
| `backend` | `str` | — | Backend identifier: `"jarvis-direct"` or `"jarvis-agent"` |
| `model` | `str` | — | Model identifier passed to the backend (e.g., `"qwen3:8b"`, `"gpt-4o"`) |
| `max_samples` | `Optional[int]` | `None` | Limit the dataset to this many records; `None` uses the full dataset |
| `max_workers` | `int` | `4` | Number of parallel threads for inference |
| `temperature` | `float` | `0.0` | Sampling temperature |
| `max_tokens` | `int` | `2048` | Maximum output tokens per sample |
| `judge_model` | `str` | `"gpt-4o"` | Model identifier used by the LLM judge scorer |
| `engine_key` | `Optional[str]` | `None` | Override the OpenJarvis engine (`"ollama"`, `"vllm"`, `"cloud"`, etc.) |
| `agent_name` | `Optional[str]` | `None` | Agent name for `jarvis-agent` backend; defaults to `"orchestrator"` |
| `tools` | `List[str]` | `[]` | Tool names enabled for the agent (e.g., `["calculator", "file_read"]`) |
| `output_path` | `Optional[str]` | `None` | JSONL output file path; auto-generated from benchmark and model name if `None` |
| `seed` | `int` | `42` | Random seed for dataset shuffling |
| `dataset_split` | `Optional[str]` | `None` | Override the dataset split (e.g., `"validation"`, `"test"`) |

```python
config = RunConfig(
    benchmark="supergpqa",
    backend="jarvis-direct",
    model="qwen3:8b",
    max_samples=100,
    max_workers=8,
    engine_key="ollama",
    output_path="results/supergpqa_qwen3-8b.jsonl",
)
```

---

### RunSummary

Aggregate statistics produced by `EvalRunner.run()` at the end of a completed run.

```python
from evals.core.types import RunSummary
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `benchmark` | `str` | — | Benchmark name |
| `category` | `str` | — | Task category (inferred from records; falls back to `benchmark` name) |
| `backend` | `str` | — | Backend used |
| `model` | `str` | — | Model identifier |
| `total_samples` | `int` | — | Total records processed (including errors) |
| `scored_samples` | `int` | — | Records where `is_correct` is not `None` |
| `correct` | `int` | — | Records where `is_correct` is `True` |
| `accuracy` | `float` | — | `correct / scored_samples`; rounded to 4 decimal places |
| `errors` | `int` | — | Records where inference or scoring raised an exception |
| `mean_latency_seconds` | `float` | — | Mean wall-clock latency across all successful inferences |
| `total_cost_usd` | `float` | — | Sum of `cost_usd` across all records |
| `per_subject` | `Dict[str, Dict[str, float]]` | `{}` | Per-subject breakdown: `{subject: {accuracy, total, scored, correct}}` |
| `started_at` | `float` | `0.0` | Unix timestamp at run start |
| `ended_at` | `float` | `0.0` | Unix timestamp at run end |

The runner also writes a `.summary.json` file alongside the JSONL output, containing
the serialized `RunSummary`.

---

## Suite Config Types (`evals.core.types`)

These dataclasses map directly to sections in a TOML eval suite config file.
They are populated by `load_eval_config()` and consumed by `expand_suite()`.

### MetaConfig

```python
@dataclass
class MetaConfig:
    name: str = ""
    description: str = ""
```

Maps to the `[meta]` TOML section. Both fields are optional and used only for
display output in the CLI.

---

### DefaultsConfig

```python
@dataclass
class DefaultsConfig:
    temperature: float = 0.0
    max_tokens: int = 2048
```

Maps to `[defaults]`. These values are the lowest-priority settings in the merge
precedence: `benchmark-level > model-level > [defaults] > built-in defaults`.

---

### JudgeConfig

```python
@dataclass
class JudgeConfig:
    model: str = "gpt-4o"
    provider: Optional[str] = None
    temperature: float = 0.0
    max_tokens: int = 1024
```

Maps to `[judge]`. The judge model is used by LLM-as-judge scorers (GAIA, FRAMES,
WildChat, SuperGPQA). The `provider` field is reserved for future routing; currently
the judge backend is always constructed with `engine_key="cloud"`.

---

### ExecutionConfig

```python
@dataclass
class ExecutionConfig:
    max_workers: int = 4
    output_dir: str = "results/"
    seed: int = 42
```

Maps to `[run]`. `output_dir` is the base directory for all JSONL output files;
individual filenames are auto-generated as `{benchmark}_{model-slug}.jsonl`.

---

### ModelConfig

```python
@dataclass
class ModelConfig:
    name: str = ""
    engine: Optional[str] = None
    provider: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
```

Maps to each `[[models]]` entry. `name` is required. `temperature` and `max_tokens`
override `[defaults]` for every benchmark this model runs against, unless a
benchmark-level override also exists.

---

### BenchmarkConfig

```python
@dataclass
class BenchmarkConfig:
    name: str = ""
    backend: str = "jarvis-direct"
    max_samples: Optional[int] = None
    split: Optional[str] = None
    agent: Optional[str] = None
    tools: List[str] = field(default_factory=list)
    judge_model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
```

Maps to each `[[benchmarks]]` entry. `name` is required. `backend` must be one of
`"jarvis-direct"` or `"jarvis-agent"`. `judge_model` overrides `[judge].model` for
this benchmark only.

---

### EvalSuiteConfig

The top-level config object returned by `load_eval_config()`.

```python
@dataclass
class EvalSuiteConfig:
    meta: MetaConfig
    defaults: DefaultsConfig
    judge: JudgeConfig
    run: ExecutionConfig
    models: List[ModelConfig]
    benchmarks: List[BenchmarkConfig]
```

`expand_suite(suite)` iterates over `models x benchmarks` to produce one `RunConfig`
per pair, applying the merge precedence rules documented in `DefaultsConfig`.

---

## Config Module (`evals.core.config`)

```python
from evals.core.config import load_eval_config, expand_suite, EvalConfigError
```

### EvalConfigError

```python
class EvalConfigError(Exception): ...
```

Raised by `load_eval_config()` for structural validation failures: missing required
fields, invalid backend names, or empty `[[models]]` / `[[benchmarks]]` lists.

---

### load_eval_config

```python
def load_eval_config(path: str | Path) -> EvalSuiteConfig
```

Load and validate an eval suite configuration from a TOML file.

Uses the standard library `tomllib` on Python 3.11+ and the `tomli` backport on
Python 3.10.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | `str \| Path` | Path to the TOML config file |

**Returns:** `EvalSuiteConfig`

**Raises:**

- `EvalConfigError` — structural validation failures (missing `name`, invalid backend, no models/benchmarks defined)
- `FileNotFoundError` — if the config file does not exist

```python
from evals.core.config import load_eval_config

suite = load_eval_config("evals/configs/full-suite.toml")
print(f"{len(suite.models)} models, {len(suite.benchmarks)} benchmarks")
```

---

### expand_suite

```python
def expand_suite(suite: EvalSuiteConfig) -> List[RunConfig]
```

Expand an `EvalSuiteConfig` into a flat list of `RunConfig` objects, one per
model-benchmark pair, with all override layers merged.

**Merge precedence (highest wins):**

1. Benchmark-level (`BenchmarkConfig.temperature`, `.max_tokens`, `.judge_model`)
2. Model-level (`ModelConfig.temperature`, `.max_tokens`)
3. Suite defaults (`DefaultsConfig`)
4. Built-in dataclass defaults

Output paths are auto-generated as `{output_dir}/{benchmark}_{model-slug}.jsonl`,
where `model-slug` replaces `/` and `:` with `-`.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `suite` | `EvalSuiteConfig` | Parsed suite configuration |

**Returns:** `List[RunConfig]` — one entry per model-benchmark combination.

```python
from evals.core.config import load_eval_config, expand_suite

suite = load_eval_config("evals/configs/full-suite.toml")
run_configs = expand_suite(suite)  # e.g., 3 models x 4 benchmarks = 12 RunConfigs
for rc in run_configs:
    print(f"{rc.benchmark} / {rc.model} -> {rc.output_path}")
```

---

## Abstract Base Classes

### InferenceBackend (`evals.core.backend`)

```python
from evals.core.backend import InferenceBackend
```

Base class for all inference backends. A backend wraps an engine or agent and
provides a uniform text-in / text-out interface for the runner.

```python
class InferenceBackend(ABC):
    backend_id: str
```

**Class attribute:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `backend_id` | `str` | Registry identifier (e.g., `"jarvis-direct"`, `"jarvis-agent"`) |

**Abstract methods:**

#### generate

```python
@abstractmethod
def generate(
    self,
    prompt: str,
    *,
    model: str,
    system: str = "",
    temperature: float = 0.0,
    max_tokens: int = 2048,
) -> str
```

Generate a response and return the text content only.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | `str` | — | User message or formatted problem text |
| `model` | `str` | — | Model identifier |
| `system` | `str` | `""` | Optional system prompt |
| `temperature` | `float` | `0.0` | Sampling temperature |
| `max_tokens` | `int` | `2048` | Maximum output tokens |

**Returns:** `str` — model text output.

---

#### generate_full

```python
@abstractmethod
def generate_full(
    self,
    prompt: str,
    *,
    model: str,
    system: str = "",
    temperature: float = 0.0,
    max_tokens: int = 2048,
) -> Dict[str, Any]
```

Generate a response and return full details including usage and cost metadata.

**Returns:** `dict` with keys:

| Key | Type | Description |
|-----|------|-------------|
| `content` | `str` | Model text output |
| `usage` | `dict` | Token usage (`prompt_tokens`, `completion_tokens`) |
| `model` | `str` | Model identifier used |
| `latency_seconds` | `float` | Wall-clock generation time |
| `cost_usd` | `float` | Estimated inference cost |

---

#### close

```python
def close(self) -> None
```

Release resources held by the backend (connections, engine handles, etc.).
The default implementation is a no-op; subclasses override as needed.

---

### DatasetProvider (`evals.core.dataset`)

```python
from evals.core.dataset import DatasetProvider
```

Base class for all evaluation dataset providers. Datasets are loaded lazily via
`load()` and then consumed record-by-record through `iter_records()`.

```python
class DatasetProvider(ABC):
    dataset_id: str
    dataset_name: str
```

**Class attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `dataset_id` | `str` | Short identifier matching the CLI benchmark name |
| `dataset_name` | `str` | Human-readable display name |

**Abstract methods:**

#### load

```python
@abstractmethod
def load(
    self,
    *,
    max_samples: Optional[int] = None,
    split: Optional[str] = None,
    seed: Optional[int] = None,
) -> None
```

Load the dataset, optionally downloading from HuggingFace Hub. Must be called
before `iter_records()`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `max_samples` | `Optional[int]` | `None` | Truncate to this many records after shuffling |
| `split` | `Optional[str]` | `None` | Dataset split override (e.g., `"test"`, `"validation"`) |
| `seed` | `Optional[int]` | `None` | Shuffle seed; `None` preserves original order |

---

#### iter_records

```python
@abstractmethod
def iter_records(self) -> Iterable[EvalRecord]
```

Iterate over the loaded `EvalRecord` objects. Raises if called before `load()`.

---

#### size

```python
@abstractmethod
def size(self) -> int
```

Return the count of loaded records.

---

### Scorer (`evals.core.scorer`)

```python
from evals.core.scorer import Scorer, LLMJudgeScorer
```

Base class for all scorers. A scorer compares a model's answer to the reference
in an `EvalRecord` and returns a correctness verdict with optional metadata.

```python
class Scorer(ABC):
    scorer_id: str
```

**Class attribute:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `scorer_id` | `str` | Short identifier matching the benchmark name |

**Abstract method:**

#### score

```python
@abstractmethod
def score(
    self,
    record: EvalRecord,
    model_answer: str,
) -> Tuple[Optional[bool], Dict[str, Any]]
```

Score a model answer against the reference.

| Parameter | Type | Description |
|-----------|------|-------------|
| `record` | `EvalRecord` | The source sample including `reference` and `metadata` |
| `model_answer` | `str` | Raw text output from the model |

**Returns:** `(is_correct, metadata)` tuple where:

- `is_correct` is `True`, `False`, or `None` (if scoring could not be determined)
- `metadata` is a `dict` of scorer-specific details stored in `EvalResult.scoring_metadata`

---

### LLMJudgeScorer

```python
class LLMJudgeScorer(Scorer):
    def __init__(self, judge_backend: InferenceBackend, judge_model: str) -> None
```

Convenience base class for scorers that call an LLM to evaluate answers.
Exposes `_ask_judge()` to subclasses.

```python
def _ask_judge(
    self,
    prompt: str,
    *,
    system: str = "",
    temperature: float = 0.0,
    max_tokens: int = 1024,
) -> str
```

Send a prompt to the judge LLM and return the response text. Delegates to
`judge_backend.generate()`.

---

## EvalRunner (`evals.core.runner`)

```python
from evals.core.runner import EvalRunner
```

The `EvalRunner` wires together a `RunConfig`, `DatasetProvider`, `InferenceBackend`,
and `Scorer` and executes the benchmark. Inference is parallelized using a
`ThreadPoolExecutor`. Results are written to JSONL incrementally so progress is
not lost if the run is interrupted.

### Constructor

```python
class EvalRunner:
    def __init__(
        self,
        config: RunConfig,
        dataset: DatasetProvider,
        backend: InferenceBackend,
        scorer: Scorer,
    ) -> None
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | `RunConfig` | Run parameters (model, workers, output path, etc.) |
| `dataset` | `DatasetProvider` | Dataset to evaluate against |
| `backend` | `InferenceBackend` | Inference backend for generation |
| `scorer` | `Scorer` | Scorer for comparing model answers to references |

### run

```python
def run(self) -> RunSummary
```

Execute the full evaluation and return aggregate statistics.

The method:

1. Calls `dataset.load()` with the `RunConfig` sampling parameters
2. Submits all records to a `ThreadPoolExecutor` with `config.max_workers` threads
3. For each record, calls `backend.generate_full()` then `scorer.score()`
4. Writes each `EvalResult` to a JSONL file as it completes
5. Writes a `.summary.json` alongside the JSONL at the end

**Returns:** `RunSummary`

```python title="programmatic_eval.py"
from evals.core.types import RunConfig
from evals.core.runner import EvalRunner
from evals.datasets.supergpqa import SuperGPQADataset
from evals.backends.jarvis_direct import JarvisDirectBackend
from evals.scorers.supergpqa_mcq import SuperGPQAScorer

config = RunConfig(
    benchmark="supergpqa",
    backend="jarvis-direct",
    model="qwen3:8b",
    max_samples=50,
    engine_key="ollama",
)

dataset = SuperGPQADataset()
backend = JarvisDirectBackend(engine_key="ollama")
judge_backend = JarvisDirectBackend(engine_key="cloud")
scorer = SuperGPQAScorer(judge_backend=judge_backend, judge_model="gpt-4o")

runner = EvalRunner(config, dataset, backend, scorer)
summary = runner.run()

print(f"Accuracy: {summary.accuracy:.4f} ({summary.correct}/{summary.scored_samples})")
print(f"Mean latency: {summary.mean_latency_seconds:.2f}s")
print(f"Total cost: ${summary.total_cost_usd:.4f}")

backend.close()
judge_backend.close()
```

---

## Backends

### JarvisDirectBackend (`evals.backends.jarvis_direct`)

```python
from evals.backends.jarvis_direct import JarvisDirectBackend
```

Engine-level inference via `SystemBuilder`. Routes directly to the configured
`InferenceEngine` without an agent loop, making it the fastest backend and
appropriate for benchmarks that do not require tool use.

```python
class JarvisDirectBackend(InferenceBackend):
    backend_id = "jarvis-direct"

    def __init__(self, engine_key: Optional[str] = None) -> None
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `engine_key` | `Optional[str]` | `None` | OpenJarvis engine identifier. `None` uses the auto-discovered engine from `~/.openjarvis/config.toml` |

Telemetry and traces are disabled for eval runs. The backend calls
`SystemBuilder().engine(engine_key).telemetry(False).traces(False).build()`.

**Compatible benchmarks:** `supergpqa`, `frames`, `wildchat` (any benchmark that
does not require multi-step tool calling).

=== "Local model"

    ```python
    backend = JarvisDirectBackend(engine_key="ollama")
    text = backend.generate("What is 2+2?", model="qwen3:8b")
    ```

=== "Cloud model"

    ```python
    backend = JarvisDirectBackend(engine_key="cloud")
    text = backend.generate("What is 2+2?", model="gpt-4o")
    ```

---

### JarvisAgentBackend (`evals.backends.jarvis_agent`)

```python
from evals.backends.jarvis_agent import JarvisAgentBackend
```

Agent-level inference via `JarvisSystem.ask()`. Wraps the full OpenJarvis agent
harness, enabling multi-turn tool-calling loops for agentic benchmarks.

```python
class JarvisAgentBackend(InferenceBackend):
    backend_id = "jarvis-agent"

    def __init__(
        self,
        engine_key: Optional[str] = None,
        agent_name: str = "orchestrator",
        tools: Optional[List[str]] = None,
    ) -> None
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `engine_key` | `Optional[str]` | `None` | OpenJarvis engine identifier |
| `agent_name` | `str` | `"orchestrator"` | Agent to use (`"orchestrator"`, `"react"`, etc.) |
| `tools` | `Optional[List[str]]` | `None` | Tool names to enable (e.g., `["calculator", "file_read"]`) |

The `generate_full()` return dict includes two additional keys beyond the standard
`InferenceBackend` contract:

| Key | Type | Description |
|-----|------|-------------|
| `turns` | `int` | Number of agent turns completed |
| `tool_results` | `list` | Tool call results from the agent loop |

**Compatible benchmarks:** `gaia` (requires file reading and multi-step reasoning).

```python
backend = JarvisAgentBackend(
    engine_key="ollama",
    agent_name="orchestrator",
    tools=["file_read", "calculator"],
)
result = backend.generate_full(
    "How many pages is the attached PDF?",
    model="qwen3:8b",
)
print(result["content"])
print(f"Completed in {result['turns']} turn(s)")
backend.close()
```

---

## Dataset Providers

### SuperGPQADataset (`evals.datasets.supergpqa`)

```python
from evals.datasets.supergpqa import SuperGPQADataset
```

Loads the SuperGPQA multiple-choice benchmark from HuggingFace (`m-a-p/SuperGPQA`).
Records have `category="reasoning"` and `subject` set to the discipline subfield.

```python
class SuperGPQADataset(DatasetProvider):
    dataset_id = "supergpqa"
    dataset_name = "SuperGPQA"
```

- **Default split:** `"train"`
- **HuggingFace path:** `m-a-p/SuperGPQA`
- Each problem is formatted with lettered options (A, B, C, ...) and the instruction
  "Respond with the correct letter only."
- `record.reference` is the correct answer letter (e.g., `"B"`).

---

### GAIADataset (`evals.datasets.gaia`)

```python
from evals.datasets.gaia import GAIADataset
```

Loads the GAIA agentic benchmark from HuggingFace (`gaia-benchmark/GAIA`).
Records have `category="agentic"` and `subject` set to `level_1`, `level_2`, or
`level_3`.

```python
class GAIADataset(DatasetProvider):
    dataset_id = "gaia"
    dataset_name = "GAIA"

    def __init__(self, cache_dir: Optional[str] = None) -> None
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cache_dir` | `Optional[str]` | `~/.cache/gaia_benchmark` | Local directory for HuggingFace snapshot download |

- **Default split:** `"validation"`
- **Default subset:** `"2023_all"`
- Downloads the full dataset snapshot including associated files (PDFs, images, CSVs)
  referenced in questions. File paths are embedded in the problem prompt.

!!! warning "Dataset access"
    GAIA requires accepting the HuggingFace dataset terms of service and being logged
    in with `huggingface-cli login` before the snapshot download can proceed.

---

### FRAMESDataset (`evals.datasets.frames`)

```python
from evals.datasets.frames import FRAMESDataset
```

Loads the FRAMES multi-hop factual retrieval benchmark from HuggingFace
(`google/frames-benchmark`). Records have `category="rag"` and `subject` set to
the reasoning type(s) (e.g., `"multi-hop, temporal"`).

```python
class FRAMESDataset(DatasetProvider):
    dataset_id = "frames"
    dataset_name = "FRAMES"
```

- **Default split:** `"test"`
- Wikipedia article links referenced in each question are included in the problem prompt.

---

### WildChatDataset (`evals.datasets.wildchat`)

```python
from evals.datasets.wildchat import WildChatDataset
```

Loads the WildChat-1M dataset (`allenai/WildChat-1M`) and filters to English
single-turn conversations for chat quality evaluation. Records have
`category="chat"` and `subject="conversation"`.

```python
class WildChatDataset(DatasetProvider):
    dataset_id = "wildchat"
    dataset_name = "WildChat"
```

- **Default split:** `"train"`
- Filters by `language == "english"` and exactly two turns (one user + one assistant).
- `record.problem` is the user message; `record.reference` is the original assistant
  response used as the quality baseline by the judge scorer.

---

## Scorers

### SuperGPQAScorer (`evals.scorers.supergpqa_mcq`)

```python
from evals.scorers.supergpqa_mcq import SuperGPQAScorer
```

LLM-based letter extraction followed by exact match against the reference letter.
The judge LLM extracts the final answer letter from potentially verbose model
responses, then compares it to `record.reference`.

```python
class SuperGPQAScorer(LLMJudgeScorer):
    scorer_id = "supergpqa"
```

**Scoring metadata keys:**

| Key | Description |
|-----|-------------|
| `reference_letter` | Correct answer letter from the dataset |
| `candidate_letter` | Letter extracted by the judge LLM |
| `valid_letters` | Valid answer letters for this question (e.g., `"ABCD"`) |
| `reason` | Set to `"missing_reference_letter"` or `"no_choice_letter_extracted"` on failure |

---

### GAIAScorer (`evals.scorers.gaia_exact`)

```python
from evals.scorers.gaia_exact import GAIAScorer, exact_match
```

Normalized exact match with an LLM fallback for semantic comparison. Tries exact
match first (no API call); falls back to the judge LLM only when exact match fails.

```python
class GAIAScorer(LLMJudgeScorer):
    scorer_id = "gaia"
```

**Normalization rules for exact match:**

- Numbers: strips `$`, `%`, `,` then compares as `float`
- Lists (comma- or semicolon-separated): splits and compares element-by-element
- Strings: lowercases, strips whitespace and punctuation

**Scoring metadata keys:**

| Key | Description |
|-----|-------------|
| `match_type` | `"exact"` or `"llm_fallback"` |
| `raw_judge_output` | Full LLM judge response (llm_fallback only) |
| `extracted_answer` | Answer extracted by the judge (llm_fallback only) |

The `exact_match` helper function is also exported and can be used independently:

```python
from evals.scorers.gaia_exact import exact_match

assert exact_match("$1,000", "1000") is True
assert exact_match("paris", "Paris") is True
assert exact_match("3, 5", "3,5") is True
```

---

### FRAMESScorer (`evals.scorers.frames_judge`)

```python
from evals.scorers.frames_judge import FRAMESScorer
```

LLM-as-judge scorer for FRAMES multi-hop factual retrieval. Uses a structured
grading rubric that focuses on semantic equivalence, ignoring formatting and
capitalization differences.

```python
class FRAMESScorer(LLMJudgeScorer):
    scorer_id = "frames"
```

**Scoring metadata keys:**

| Key | Description |
|-----|-------------|
| `raw_judge_output` | Full LLM judge response |
| `extracted_answer` | Answer extracted by the judge |

---

### WildChatScorer (`evals.scorers.wildchat_judge`)

```python
from evals.scorers.wildchat_judge import WildChatScorer
```

Dual-comparison LLM-as-judge for chat quality. Runs two comparisons — once with
the model answer as Assistant A and once as Assistant B — to reduce position bias.
The model answer is considered correct if it wins or ties in either comparison.

```python
class WildChatScorer(LLMJudgeScorer):
    scorer_id = "wildchat"
```

The judge uses a five-point verdict scale: `[[A>>B]]`, `[[A>B]]`, `[[A=B]]`,
`[[B>A]]`, `[[B>>A]]`. A tie (`A=B`) is counted as correct.

**Scoring metadata keys:**

| Key | Description |
|-----|-------------|
| `generated_as_a` | `{verdict, response}` from the first comparison pass |
| `generated_as_b` | `{verdict, response}` from the second comparison pass |

---

## CLI Reference

The evaluation framework ships a `openjarvis-eval` CLI built with Click.

### openjarvis-eval run

Run a single benchmark or a full suite from a TOML config.

```bash title="Single run"
openjarvis-eval run \
  --benchmark supergpqa \
  --model qwen3:8b \
  --engine ollama \
  --max-samples 100 \
  --max-workers 8 \
  --output results/supergpqa_qwen3-8b.jsonl
```

```bash title="Suite run from TOML"
openjarvis-eval run --config evals/configs/full-suite.toml
```

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--config` | `-c` | `None` | TOML suite config file; enables suite mode |
| `--benchmark` | `-b` | — | Benchmark name (required in single-run mode) |
| `--backend` | | `jarvis-direct` | `jarvis-direct` or `jarvis-agent` |
| `--model` | `-m` | — | Model identifier (required in single-run mode) |
| `--engine` | `-e` | `None` | Engine key override |
| `--agent` | | `orchestrator` | Agent name for `jarvis-agent` backend |
| `--tools` | | `""` | Comma-separated tool names |
| `--max-samples` | `-n` | `None` | Sample limit |
| `--max-workers` | `-w` | `4` | Parallel threads |
| `--judge-model` | | `gpt-4o` | LLM judge model |
| `--output` | `-o` | auto | JSONL output path |
| `--seed` | | `42` | Shuffle seed |
| `--split` | | `None` | Dataset split override |
| `--temperature` | | `0.0` | Sampling temperature |
| `--max-tokens` | | `2048` | Maximum output tokens |
| `--verbose` | `-v` | `False` | Enable debug logging |

### openjarvis-eval run-all

Run all four benchmarks against a single model.

```bash
openjarvis-eval run-all \
  --model qwen3:8b \
  --engine ollama \
  --max-samples 50 \
  --output-dir results/
```

### openjarvis-eval summarize

Recompute summary statistics from an existing JSONL output file.

```bash
openjarvis-eval summarize results/supergpqa_qwen3-8b.jsonl
```

### openjarvis-eval list

List all available benchmarks and backends.

```bash
openjarvis-eval list
```

---

## TOML Suite Config Format

A suite config drives a full `models x benchmarks` comparison matrix with a single
command. All sections except `[[models]]` and `[[benchmarks]]` are optional.

```toml title="evals/configs/full-suite.toml"
[meta]
name = "full-suite-v1"
description = "Evaluate all benchmarks against production models"

[defaults]
temperature = 0.0
max_tokens = 2048

[judge]
model = "gpt-4o"
temperature = 0.0
max_tokens = 1024

[run]
max_workers = 4
output_dir = "results/"
seed = 42

# One [[models]] entry per model to evaluate
[[models]]
name = "qwen3:8b"
engine = "ollama"
temperature = 0.3

[[models]]
name = "gpt-4o"
provider = "openai"

# One [[benchmarks]] entry per benchmark
[[benchmarks]]
name = "supergpqa"
backend = "jarvis-direct"
max_samples = 200

[[benchmarks]]
name = "gaia"
backend = "jarvis-agent"
agent = "orchestrator"
tools = ["file_read", "calculator"]
max_samples = 50
judge_model = "claude-sonnet-4-20250514"  # override judge for this benchmark

[[benchmarks]]
name = "frames"
backend = "jarvis-direct"
max_samples = 100

[[benchmarks]]
name = "wildchat"
backend = "jarvis-direct"
max_samples = 150
temperature = 0.7
```

```bash
openjarvis-eval run --config evals/configs/full-suite.toml
# Suite: full-suite-v1
#   2 model(s) x 4 benchmark(s) = 8 run(s)
```

---

## See Also

- [Benchmarks Module](bench.md) — `openjarvis.bench` performance benchmarks (latency, throughput) for the inference engine, separate from the eval framework
- [Telemetry & Traces](telemetry.md) — `openjarvis.telemetry` and `openjarvis.traces` for production monitoring
- [Python SDK](../user-guide/python-sdk.md) — `Jarvis` class used internally by eval backends
- [Agents](../user-guide/agents.md) — Agent implementations invoked by `JarvisAgentBackend`
