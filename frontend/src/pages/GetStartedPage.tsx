import { useState, useMemo } from 'react';
import {
  Sparkles,
  Download,
  Terminal,
  Globe,
  Monitor,
  Apple,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Cpu,
} from 'lucide-react';

const GITHUB_BASE =
  'https://github.com/hazy/OpenJarvis/releases/latest/download';

interface Platform {
  id: string;
  label: string;
  shortLabel: string;
  file: string;
  icon: typeof Apple;
}

const PLATFORMS: Platform[] = [
  {
    id: 'mac-arm',
    label: 'macOS (Apple Silicon)',
    shortLabel: 'macOS (Apple Silicon)',
    file: 'OpenJarvis_aarch64.dmg',
    icon: Apple,
  },
  {
    id: 'mac-intel',
    label: 'macOS (Intel)',
    shortLabel: 'macOS (Intel)',
    file: 'OpenJarvis_x64.dmg',
    icon: Apple,
  },
  {
    id: 'windows',
    label: 'Windows (64-bit)',
    shortLabel: 'Windows (64-bit)',
    file: 'OpenJarvis_x64-setup.msi',
    icon: Monitor,
  },
  {
    id: 'linux-deb',
    label: 'Linux (DEB)',
    shortLabel: 'Linux (DEB)',
    file: 'OpenJarvis_amd64.deb',
    icon: Terminal,
  },
  {
    id: 'linux-rpm',
    label: 'Linux (RPM)',
    shortLabel: 'Linux (RPM)',
    file: 'OpenJarvis_x86_64.rpm',
    icon: Terminal,
  },
];

function detectPlatform(): string {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';

  if (platform.includes('mac') || ua.includes('macintosh')) {
    // Apple Silicon detection via WebGL renderer or default to arm
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
          if (renderer && /apple m/i.test(renderer)) return 'mac-arm';
        }
      }
    } catch {}
    return 'mac-arm';
  }
  if (platform.includes('win') || ua.includes('windows')) return 'windows';
  if (ua.includes('ubuntu') || ua.includes('debian')) return 'linux-deb';
  if (ua.includes('linux')) return 'linux-deb';
  return 'mac-arm';
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative group rounded-lg px-4 py-3 text-sm font-mono overflow-x-auto"
      style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text)' }}
    >
      <pre className="whitespace-pre-wrap break-all">{code}</pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-tertiary)' }}
        title="Copy"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
  defaultOpen = false,
}: {
  icon: typeof Terminal;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-5 py-4 text-left cursor-pointer transition-colors"
        style={{ background: open ? 'var(--color-bg-secondary)' : 'var(--color-surface)' }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = 'var(--color-bg-secondary)';
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = 'var(--color-surface)';
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}
        >
          <Icon size={16} />
        </div>
        <span className="text-sm font-medium flex-1" style={{ color: 'var(--color-text)' }}>
          {title}
        </span>
        <Chevron size={16} style={{ color: 'var(--color-text-tertiary)' }} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-3 flex flex-col gap-3" style={{ background: 'var(--color-surface)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function GetStartedPage() {
  const detectedId = useMemo(() => detectPlatform(), []);
  const primary = PLATFORMS.find((p) => p.id === detectedId) || PLATFORMS[0];
  const others = PLATFORMS.filter((p) => p.id !== primary.id);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}
          >
            <Sparkles size={32} />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            OpenJarvis
          </h1>
          <p
            className="text-sm mb-4 leading-relaxed max-w-md mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Private AI that runs on your hardware. Chat, tools, agents, and
            energy profiling &mdash; no cloud required.
          </p>
          <span
            className="inline-block text-[11px] font-mono px-2.5 py-1 rounded-full"
            style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }}
          >
            v2.8
          </span>
        </div>

        {/* Desktop Download */}
        <div className="mb-10">
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Monitor size={18} style={{ color: 'var(--color-text-secondary)' }} />
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                Desktop App
              </h2>
            </div>
            <p className="text-xs mb-6" style={{ color: 'var(--color-text-tertiary)' }}>
              Native app with system tray, auto-updates, and global shortcuts.
            </p>

            {/* Primary download */}
            <a
              href={`${GITHUB_BASE}/${primary.file}`}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-medium transition-opacity cursor-pointer"
              style={{ background: 'var(--color-accent)', color: 'white' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <Download size={18} />
              Download for {primary.label}
            </a>

            {/* Other platforms */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                Or
              </span>
              {others.map((p) => (
                <a
                  key={p.id}
                  href={`${GITHUB_BASE}/${p.file}`}
                  className="text-[11px] underline underline-offset-2 transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                >
                  {p.shortLabel}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* CLI + Browser sections */}
        <div className="flex flex-col gap-3 mb-10">
          <Section icon={Terminal} title="Command Line (macOS / Linux)" defaultOpen>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Install with pip (Python 3.10+ required):
            </p>
            <CodeBlock code="pip install openjarvis" />
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Or with uv for faster installs:
            </p>
            <CodeBlock code="uv pip install openjarvis" />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Then get started:
            </p>
            <CodeBlock code="jarvis init\njarvis doctor\njarvis chat" />
          </Section>

          <Section icon={Globe} title="Browser App (Self-Hosted)">
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Launch the API server to get the full UI in your browser:
            </p>
            <CodeBlock code="pip install 'openjarvis[server]'\njarvis serve --port 8000" />
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Then open{' '}
              <a
                href="http://localhost:8000"
                className="underline"
                style={{ color: 'var(--color-accent)' }}
              >
                localhost:8000
              </a>
              {' '}in your browser. Chat, dashboard, energy profiling, and cost
              comparison all run locally.
            </p>
          </Section>
        </div>

        {/* System Requirements */}
        <div
          className="rounded-xl px-6 py-5"
          style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={14} style={{ color: 'var(--color-text-tertiary)' }} />
            <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
              System Requirements
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <div>
              <div className="font-medium mb-0.5" style={{ color: 'var(--color-text)' }}>Runtime</div>
              Python 3.10+
            </div>
            <div>
              <div className="font-medium mb-0.5" style={{ color: 'var(--color-text)' }}>Inference Engine</div>
              Ollama, vLLM, llama.cpp, MLX, or LM Studio
            </div>
            <div>
              <div className="font-medium mb-0.5" style={{ color: 'var(--color-text)' }}>Memory</div>
              8 GB+ RAM recommended
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
