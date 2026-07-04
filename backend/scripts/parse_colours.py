"""One-time parser for the Birla Opus colour library.

Reads every ``.skm`` file (a ZIP whose ``document.xml`` carries the material's
name + RGB) from the provided "Birla Opus Colors Library" folder and emits a
committed data file ``app/data/birla_colours.json`` so runtime seeding never
depends on the raw ``.skm`` folder being deployed.

Each ``.skm`` filename is ``<CODE> <Name>.skm`` (e.g. ``BB 5000 Into the light``)
and ``document.xml`` contains::

    <mat:material name="BB 5000 Into the light" colorRed="192"
                  colorGreen="196" colorBlue="219" ... />

Run:  python scripts/parse_colours.py
      python scripts/parse_colours.py "/path/to/Birla Opus Colors Library 05 May 2024"
"""

from __future__ import annotations

import json
import re
import sys
import zipfile
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree as ET

# Repo layout: this file is backend/scripts/parse_colours.py
BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent
DEFAULT_LIBRARY = REPO_ROOT / "Birla Opus Colors Library 05 May 2024"
OUTPUT = BACKEND_DIR / "app" / "data" / "birla_colours.json"

# 2-letter code prefix -> semantic colour family (matches the storefront filters).
FAMILY_BY_PREFIX = {
    "WW": "Whites",
    "NN": "Neutrals",
    "YY": "Yellows",
    "YR": "Oranges",
    "RR": "Reds",
    "PP": "Purples",
    "BB": "Blues",
    "BG": "Blue-Greens",
    "GG": "Greens",
    "YG": "Yellow-Greens",
}

# Display order for families (whites/light first, then the spectrum, neutrals last).
FAMILY_ORDER = [
    "Whites", "Yellows", "Yellow-Greens", "Greens", "Blue-Greens",
    "Blues", "Purples", "Reds", "Oranges", "Neutrals",
]

# "BB 5000 Into the light" -> code "BB 5000", name "Into the light"
CODE_RE = re.compile(r"^([A-Z]{2}\s*\d+)\s+(.*)$")


def _material_rgb(skm_path: Path) -> tuple[str, int, int, int] | None:
    """Return (name, r, g, b) from a .skm's document.xml, or None if unreadable."""
    try:
        with zipfile.ZipFile(skm_path) as zf:
            xml = zf.read("document.xml")
    except (zipfile.BadZipFile, KeyError, OSError):
        return None
    try:
        root = ET.fromstring(xml)
    except ET.ParseError:
        return None
    # <mat:material> — namespace-agnostic search for the material element.
    for el in root.iter():
        if el.tag.endswith("material") and "colorRed" in el.attrib:
            try:
                return (
                    el.attrib.get("name", ""),
                    int(el.attrib["colorRed"]),
                    int(el.attrib["colorGreen"]),
                    int(el.attrib["colorBlue"]),
                )
            except (KeyError, ValueError):
                return None
    return None


def parse_library(library: Path) -> list[dict]:
    colours: list[dict] = []
    skipped: list[str] = []
    for skm in sorted(library.glob("*.skm")):
        stem = skm.stem  # filename without .skm
        m = CODE_RE.match(stem)
        rgb = _material_rgb(skm)
        if not m or rgb is None:
            skipped.append(stem)
            continue
        code = re.sub(r"\s+", " ", m.group(1)).strip()
        name = m.group(2).strip() or code
        prefix = code[:2]
        family = FAMILY_BY_PREFIX.get(prefix, "Neutrals")
        _mat_name, r, g, b = rgb
        colours.append({
            "code": code,
            "name": name,
            "hex": f"#{r:02X}{g:02X}{b:02X}",
            "family": family,
            "prefix": prefix,
        })

    # Deterministic order: family, then numeric part of the code, then code.
    def sort_key(c: dict):
        fam_idx = FAMILY_ORDER.index(c["family"]) if c["family"] in FAMILY_ORDER else 99
        num = int(re.sub(r"\D", "", c["code"]) or 0)
        return (fam_idx, c["prefix"], num, c["code"])

    colours.sort(key=sort_key)
    for i, c in enumerate(colours):
        c["sort_order"] = i
        c.pop("prefix", None)

    if skipped:
        print(f"WARNING: skipped {len(skipped)} unparseable files, e.g. {skipped[:3]}")
    return colours


def main() -> None:
    library = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_LIBRARY
    if not library.is_dir():
        raise SystemExit(f"Colour library folder not found: {library}")

    colours = parse_library(library)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(colours, ensure_ascii=False, indent=1), encoding="utf-8")

    by_family = Counter(c["family"] for c in colours)
    print(f"Parsed {len(colours)} colours -> {OUTPUT.relative_to(BACKEND_DIR)}")
    for fam in FAMILY_ORDER:
        # Show one sample hex per family so the prefix->family mapping is easy to eyeball.
        sample = next((c for c in colours if c["family"] == fam), None)
        print(f"  {fam:14s} {by_family.get(fam, 0):4d}  e.g. {sample['code'] if sample else '-':9s} "
              f"{sample['hex'] if sample else ''} {sample['name'] if sample else ''}")


if __name__ == "__main__":
    main()
