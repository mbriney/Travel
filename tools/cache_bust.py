#!/usr/bin/env python3
"""
Inject a build-version query string into every same-repo JS import and into
index.html's <script src="..."> tag. Run at deploy time only (the workflow
calls this); local source files stay unchanged.

What gets a version appended:
  - <script ... src="assets/js/...">                                 (in index.html)
  - import ... from "./foo.js"                                       (static)
  - import "./foo.js"                                                (static, no bindings)
  - export ... from "./foo.js"                                       (re-export)
  - import("./foo.js")                                               (dynamic)

CDN imports (https://, //, data:) are skipped — they have their own versioning.

Usage:
  python tools/cache_bust.py            # uses UTC timestamp as version
  python tools/cache_bust.py 2026-05-11 # explicit version
"""
import os
import re
import sys
import time

VERSION = sys.argv[1] if len(sys.argv) > 1 else time.strftime("%Y%m%d-%H%M%S")


def _append_v(url: str) -> str:
    sep = "&" if "?" in url else "?"
    return f"{url}{sep}v={VERSION}"


# Matches static imports/exports: `from "./foo.js"` or `from './foo.js'`
RE_FROM = re.compile(r"""(\bfrom\s+["'])(\.{1,2}/[^"']+\.js)(["'])""")
# Bare imports without bindings: `import "./foo.js"`
RE_BARE = re.compile(r"""(\bimport\s+["'])(\.{1,2}/[^"']+\.js)(["'])""")
# Dynamic imports: `import("./foo.js")` (string literal only, not template).
RE_DYNAMIC = re.compile(r"""(\bimport\(\s*["'])(\.{1,2}/[^"']+\.js)(["'])""")


def rewrite_js(text: str) -> str:
    def sub(m):
        return f"{m.group(1)}{_append_v(m.group(2))}{m.group(3)}"
    text = RE_FROM.sub(sub, text)
    text = RE_BARE.sub(sub, text)
    text = RE_DYNAMIC.sub(sub, text)
    return text


# Matches <script ... src="assets/js/...">  (any same-repo path under assets/)
RE_SCRIPT_SRC = re.compile(
    r"""(<script\b[^>]*\bsrc\s*=\s*["'])(?!https?://|//|data:)([^"']+)(["'])"""
)


def rewrite_html(text: str) -> str:
    def sub(m):
        return f"{m.group(1)}{_append_v(m.group(2))}{m.group(3)}"
    return RE_SCRIPT_SRC.sub(sub, text)


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    changed = 0

    # JS files under assets/js/
    js_dir = os.path.join(root, "assets", "js")
    for dirpath, _, files in os.walk(js_dir):
        for name in files:
            if not name.endswith(".js"):
                continue
            path = os.path.join(dirpath, name)
            with open(path, encoding="utf-8") as fp:
                original = fp.read()
            updated = rewrite_js(original)
            if updated != original:
                with open(path, "w", encoding="utf-8") as fp:
                    fp.write(updated)
                changed += 1
                print(f"  bumped imports in assets/js/{name}")

    # index.html
    html_path = os.path.join(root, "index.html")
    if os.path.exists(html_path):
        with open(html_path, encoding="utf-8") as fp:
            original = fp.read()
        updated = rewrite_html(original)
        if updated != original:
            with open(html_path, "w", encoding="utf-8") as fp:
                fp.write(updated)
            changed += 1
            print("  bumped script src in index.html")

    print(f"cache_bust.py: version={VERSION}, files changed={changed}")


if __name__ == "__main__":
    main()
