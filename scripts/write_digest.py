#!/usr/bin/env python3
"""Write a daily digest JSON into data/ and update data/index.json.

Usage:
  python3 scripts/write_digest.py path/to/digest.json
  cat digest.json | python3 scripts/write_digest.py -
  python3 scripts/write_digest.py   # reads stdin

Schema (required fields):
  {
    "date": "YYYY-MM-DD",
    "title": "AI 日报",
    "focus": "今日焦点一句话",
    "items": [
      {
        "rank": 1,
        "title": "...",
        "summary": "...",
        "links": [{"label": "...", "url": "https://..."}]
      }
    ]
  }
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def die(msg: str, code: int = 1) -> None:
    print(f"error: {msg}", file=sys.stderr)
    raise SystemExit(code)


def load_input(source: str | None) -> dict:
    if source in (None, "-", ""):
        raw = sys.stdin.read()
        if not raw.strip():
            die("empty stdin; pass a JSON file path or pipe JSON")
        return json.loads(raw)
    path = Path(source)
    if not path.is_file():
        die(f"file not found: {path}")
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def validate(doc: dict) -> None:
    if not isinstance(doc, dict):
        die("root must be an object")
    date = doc.get("date")
    if not isinstance(date, str) or not DATE_RE.match(date):
        die('field "date" must be YYYY-MM-DD')
    if not isinstance(doc.get("title"), str) or not doc["title"].strip():
        die('field "title" must be a non-empty string')
    if not isinstance(doc.get("focus"), str) or not doc["focus"].strip():
        die('field "focus" must be a non-empty string')
    items = doc.get("items")
    if not isinstance(items, list) or not items:
        die('field "items" must be a non-empty array')
    for i, item in enumerate(items):
        if not isinstance(item, dict):
            die(f"items[{i}] must be an object")
        for key in ("rank", "title", "summary"):
            if key not in item:
                die(f'items[{i}] missing "{key}"')
        if not isinstance(item["rank"], int):
            die(f'items[{i}].rank must be an integer')
        if not isinstance(item["title"], str) or not item["title"].strip():
            die(f'items[{i}].title must be a non-empty string')
        if not isinstance(item["summary"], str) or not item["summary"].strip():
            die(f'items[{i}].summary must be a non-empty string')
        links = item.get("links", [])
        if not isinstance(links, list):
            die(f'items[{i}].links must be an array')
        for j, link in enumerate(links):
            if not isinstance(link, dict):
                die(f"items[{i}].links[{j}] must be an object")
            if not isinstance(link.get("label"), str) or not link["label"].strip():
                die(f'items[{i}].links[{j}].label must be a non-empty string')
            url = link.get("url")
            if not isinstance(url, str) or not url.startswith(("http://", "https://")):
                die(f'items[{i}].links[{j}].url must be an http(s) URL')


def update_index(date: str) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    index_path = DATA / "index.json"
    if index_path.is_file():
        with index_path.open(encoding="utf-8") as f:
            index = json.load(f)
    else:
        index = {"dates": []}
    dates = [d for d in index.get("dates", []) if d != date]
    dates.insert(0, date)
    dates.sort(reverse=True)
    index["dates"] = dates
    with index_path.open("w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main(argv: list[str]) -> None:
    source = argv[1] if len(argv) > 1 else None
    doc = load_input(source)
    validate(doc)
    DATA.mkdir(parents=True, exist_ok=True)
    out = DATA / f"{doc['date']}.json"
    with out.open("w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
        f.write("\n")
    update_index(doc["date"])
    print(f"wrote {out}")
    print(f"updated {DATA / 'index.json'}")


if __name__ == "__main__":
    main(sys.argv)
