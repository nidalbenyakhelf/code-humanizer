# Code Humanizer

A Visual Studio Code extension that transforms AI-generated code into more natural, varied, or primitive human-like styles—complete with a live interactive preview panel, quick style switching, and modular per-language profiles.

## Supported Languages

Designed with a modular per-language architecture (`src/languages/`) for easy expansion:
- **Web:** HTML, CSS, JavaScript, TypeScript
- **Core Languages:** C, C++, Python

## Features

- **Live Interactive Preview (`Code Humanizer: Open Live Preview`):** Test code and watch humanized output update in real time as you change options.
- **Humanize Selection (`Code Humanizer: Humanize Selection`):** Apply humanization directly to selected code in the active editor or via right-click context menu.
- **Quick Style & Intensity Switchers:** Switch author style (`clean-standard`, `pragmatic`, `beginner`, `stone-age`) or intensity (`subtle`, `balanced`, `heavy`) without opening settings.
- **Stone Age Mode:** Raw, stripped-down style with primitive short variable names and optional full comment removal.

## License

MIT
