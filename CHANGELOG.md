# Changelog

All notable changes to Bagula will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Core testing framework (`@bagula/core`)
- CLI tool (`@bagula/cli`)
- GitHub Actions plugin
- Comprehensive documentation
- Example projects
- Apache 2.0 license

## [0.1.0] - 2026-02-10

### Added
- **Core Framework**
  - Test runner with baseline comparison
  - Multi-provider support (OpenAI, Anthropic)
  - Cost and latency monitoring
  - Token usage tracking
  - Confidence calibration
  - Budget gates and violations
  - Multi-agent testing support

- **CLI Tool**
  - `bagula init` - Initialize configuration
  - `bagula run` - Run test suites
  - `bagula baseline` - Manage baselines
  - `bagula report` - Generate reports
  - `bagula ci` - CI mode with strict checks
  - Watch mode for development

- **Features**
  - Baseline tracking and comparison
  - Output similarity detection
  - Tool usage validation
  - Performance regression detection
  - Budget violation alerts
  - Multiple report formats (JSON, HTML, Markdown)

- **Documentation**
  - README with quick start
  - Contributing guidelines
  - Enterprise strategy document
  - Quick start guide
  - Example projects

### Infrastructure
- Monorepo setup with npm workspaces
- TypeScript configuration
- GitHub Actions CI/CD
- ESLint and Prettier configuration

---

## Future Roadmap

### v0.2.0 (Q1 2026)
- Dashboard UI (web interface)
- Framework integrations (LangChain, CrewAI)
- GitLab CI plugin
- Improved baseline comparison algorithms
- Context analysis and "lost in the middle" detection

### v0.3.0 (Q2 2026)
- Bagula Cloud beta launch
- Remote baseline storage
- Team collaboration features
- Advanced analytics
- Anomaly detection

### v1.0.0 (Q3 2026)
- Production-ready release
- Autonomous root cause analysis
- Auto-remediation suggestions
- Enterprise features
- Full documentation

---

[Unreleased]: https://github.com/bagula-ai/bagula/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/bagula-ai/bagula/releases/tag/v0.1.0
