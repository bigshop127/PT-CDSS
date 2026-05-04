"""
doc2folders.py — Convert a document's heading hierarchy into a folder/file tree.

Supported heading styles:
  - Markdown:  # Title, ## Title, ...  (level = # count)
  - Chinese:   一、Title               (level 1)
  - Numbered:  1.1 Title, 1.2.3 Title (level = dot_count + 1)

Rules:
  - Each heading → a folder
  - Direct content under a heading (paragraphs before any sub-heading) → a .md file
    with the same name as the folder
  - Headings with only sub-headings (no direct content) → folder only, no .md

Usage:
  python doc2folders.py <input.md> [output_dir] [--dry-run]
"""

import argparse
import re
import sys
from pathlib import Path

_MD_HEADING = re.compile(r'^(#{1,6})\s+(.+)')
_ZH_HEADING = re.compile(r'^[一二三四五六七八九十百千]+[、。．](.+)')
_NUM_HEADING = re.compile(r'^(\d{1,3}(?:\.\d{1,3}){0,5})\s+\S')

_FORBIDDEN = re.compile(r'[\\/:*?"<>|]')


def safe_name(s: str) -> str:
    return _FORBIDDEN.sub('_', s).strip()


def detect_heading(line: str):
    """Return (level, title) or None."""
    m = _MD_HEADING.match(line)
    if m:
        return len(m.group(1)), m.group(2).strip()

    m = _ZH_HEADING.match(line)
    if m:
        # Include the Chinese numeral prefix in the folder name
        title = line.strip()
        return 1, title

    m = _NUM_HEADING.match(line)
    if m:
        dots = m.group(1).count('.')
        title = line.strip()
        return dots + 1, title

    return None


def parse_document(lines: list[str]):
    """
    Returns list of (folder_path: Path, content_lines: list[str]).
    folder_path is relative, e.g. Path("一、專案概覽/1.1 定位")
    """
    stack: list[tuple[int, str]] = []  # (level, safe_folder_name)
    sections: list[tuple[Path, list[str]]] = []

    current_content: list[str] = []

    def flush():
        if not stack:
            return
        path = Path(*[name for _, name in stack])
        sections.append((path, list(current_content)))
        current_content.clear()

    for line in lines:
        result = detect_heading(line)
        if result:
            flush()
            level, title = result
            folder = safe_name(title)
            # Pop stack entries at same or deeper level
            while stack and stack[-1][0] >= level:
                stack.pop()
            stack.append((level, folder))
        else:
            current_content.append(line)

    flush()
    return sections


def run(input_path: Path, output_dir: Path, dry_run: bool = False):
    text = input_path.read_text(encoding='utf-8')
    lines = text.splitlines()

    sections = parse_document(lines)

    for folder_path, content_lines in sections:
        full_dir = output_dir / folder_path
        # Strip trailing blank lines from content
        while content_lines and not content_lines[-1].strip():
            content_lines.pop()
        # Strip leading blank lines
        while content_lines and not content_lines[0].strip():
            content_lines.pop(0)

        has_content = bool(content_lines)
        md_file = full_dir / f"{folder_path.name}.md"

        if dry_run:
            print(f"DIR  {full_dir}")
            if has_content:
                print(f"FILE {md_file}  ({len(content_lines)} lines)")
        else:
            full_dir.mkdir(parents=True, exist_ok=True)
            if has_content:
                md_file.write_text('\n'.join(content_lines) + '\n', encoding='utf-8')

    if not dry_run:
        print(f"Done. {len(sections)} sections written to {output_dir}")
    else:
        print(f"Dry run complete. {len(sections)} sections found.")


def main():
    parser = argparse.ArgumentParser(description='Convert document headings to folder tree.')
    parser.add_argument('input', help='Input Markdown file')
    parser.add_argument('output', nargs='?', default='.', help='Output root directory (default: current dir)')
    parser.add_argument('--dry-run', action='store_true', help='Preview without writing files')
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: {input_path} not found", file=sys.stderr)
        sys.exit(1)

    output_dir = Path(args.output)
    run(input_path, output_dir, dry_run=args.dry_run)


if __name__ == '__main__':
    main()
