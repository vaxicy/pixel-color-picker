#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Pack Pixel Color Picker extension into a Chrome Web Store-ready zip.

Outputs both:
- project-internal: <project>/pixel-color-picker-<version>.zip
- default folder:   D:/迅雷下载/vibe coding/pixel-color-picker-<version>.zip

Excludes non-runtime files (.codebuddy/, .git/, scripts/, *.md, etc).
Version is read from manifest.json at runtime.
"""
import os, sys, zipfile, shutil, json, tempfile, re

ROOT = r'd:\迅雷下载\vibe coding\Chrome Extensions\color-picker'
DEFAULT_DIR = r'd:\迅雷下载\vibe coding'

# Read version from manifest.json
with open(os.path.join(ROOT, 'manifest.json'), encoding='utf-8') as f:
    manifest = json.load(f)
version = manifest.get('version', '0.0.0').strip()

PROJ_OUT = os.path.join(ROOT, f'pixel-color-picker-{version}.zip')
DEFAULT_OUT = os.path.join(DEFAULT_DIR, f'pixel-color-picker-{version}.zip')

EXCLUDE_DIRS = {'dist', 'cloudflare-pro', 'scripts', '.codebuddy', '.git', '.agents', 'node_modules', '__pycache__'}
EXCLUDE_FILE_EXTS = {'.md', '.py', '.log', '.bak', '.tmp', '.zip'}
EXCLUDE_FILES = {'.gitignore', '.vscodeignore', 'icon-generator.html', 'generate-icons.py'}
EXCLUDE_PATH_PREFIXES = ('dist/', 'cloudflare-pro/', 'scripts/', '.codebuddy/', '.git/', '.agents/')

def should_skip(rel_path: str, name: str, is_dir: bool) -> bool:
    parts = rel_path.replace('\\', '/').split('/')
    # Exclude by directory ancestors
    if any(p in EXCLUDE_DIRS for p in parts):
        return True
    # Exclude by exact filename at root
    if rel_path in EXCLUDE_FILES:
        return True
    # Exclude by path prefix
    rel_norm = rel_path.replace('\\', '/')
    if any(rel_norm.startswith(p) for p in EXCLUDE_PATH_PREFIXES):
        return True
    return False

def pack():
    if not os.path.isdir(ROOT):
        print('ERROR: project root not found:', ROOT, file=sys.stderr)
        return 1
    # Clean stale output zips with same name
    for p in (PROJ_OUT, DEFAULT_OUT):
        if os.path.exists(p):
            os.remove(p)
    tmp = tempfile.mkdtemp(prefix='cpp_pack_')
    file_count = 0
    try:
        with zipfile.ZipFile(PROJ_OUT, 'w', zipfile.ZIP_DEFLATED, allowZip64=False) as zf:
            for dirpath, dirnames, filenames in os.walk(ROOT):
                # Mutate dirnames in place to prune excluded directories
                dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
                for fname in filenames:
                    if fname == os.path.basename(PROJ_OUT) or fname == os.path.basename(DEFAULT_OUT):
                        continue
                    abs_path = os.path.join(dirpath, fname)
                    rel_path = os.path.relpath(abs_path, ROOT)
                    if should_skip(rel_path, fname, False):
                        continue
                    if os.path.splitext(fname)[1].lower() in EXCLUDE_FILE_EXTS:
                        continue
                    zf.write(abs_path, rel_path.replace('\\', '/'))
                    file_count += 1
        # Copy to default folder
        shutil.copy2(PROJ_OUT, DEFAULT_OUT)
        size_proj = os.path.getsize(PROJ_OUT)
        size_def = os.path.getsize(DEFAULT_OUT)
        mtime_proj = os.path.getmtime(PROJ_OUT)
        mtime_def = os.path.getmtime(DEFAULT_OUT)
        print(f'PROJECT : {PROJ_OUT}\n  size={size_proj} bytes  mtime={mtime_proj}')
        print(f'DEFAULT : {DEFAULT_OUT}\n  size={size_def} bytes  mtime={mtime_def}')
        print(f'VERSION : {version}  FILES: {file_count}')
        return 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

if __name__ == '__main__':
    sys.exit(pack())
