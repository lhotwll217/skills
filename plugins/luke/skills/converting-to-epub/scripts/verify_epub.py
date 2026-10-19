"""Deterministic EPUB checks: package, spine, XML, local links, duplicate IDs, navigation
destinations and leaked TeX. Prints JSON; exits 1 on errors. Does not certify reading quality."""
import hashlib
import json
import posixpath
import re
import sys
import zipfile
from pathlib import Path
from urllib.parse import unquote, urlsplit
from xml.etree import ElementTree as ET

TEX_COMMAND = re.compile(r"\\[A-Za-z]{2,}|\$ [^$\n]{1,80} \$")
DOLLAR_PAIR = re.compile(r"\$[^$\n]{1,80}\$")
ENTITY = re.compile(r"&(?:[a-z]+|#\d+);")
WORD = re.compile(r"\w{3,}")


def local(tag):
    return tag.rsplit("}", 1)[-1]


def text(element):
    return re.sub(r"\s+", " ", " ".join(element.itertext())).strip() if element is not None else None


def prose_nodes(root):
    """Text nodes outside MathML."""
    def walk(element, in_math):
        in_math = in_math or local(element.tag) == "math"
        if not in_math and element.text:
            yield element.text
        for child in element:
            yield from walk(child, in_math)
            if not in_math and child.tail:
                yield child.tail
    yield from walk(root, False)


def check(path):
    report = {"file": str(path), "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
              "errors": [], "warnings": [],
              "scope": "structure only; source fidelity and rendering need separate checks"}
    errors, warnings = report["errors"], report["warnings"]
    with zipfile.ZipFile(path) as archive:
        names = set(archive.namelist())
        if archive.read("mimetype") != b"application/epub+zip":
            errors.append("Wrong mimetype")
        container = ET.fromstring(archive.read("META-INF/container.xml"))
        opf_path = next(e.attrib["full-path"] for e in container.iter() if local(e.tag) == "rootfile")
        opf = ET.fromstring(archive.read(opf_path))
        base = posixpath.dirname(opf_path)
        manifest = {e.attrib["id"]: posixpath.normpath(posixpath.join(base, unquote(e.attrib["href"])))
                    for e in opf.iter() if local(e.tag) == "item"}
        spine = [e.attrib["idref"] for e in opf.iter() if local(e.tag) == "itemref"]
        errors += [f"Missing spine item: {i}" for i in spine if i not in manifest]
        errors += [f"Missing manifest file: {n}" for n in manifest.values() if n not in names]

        documents = {}
        for name in sorted(names):
            if name.endswith((".xhtml", ".html", ".htm", ".ncx", ".opf")):
                try:
                    documents[name] = ET.fromstring(archive.read(name))
                except ET.ParseError as error:
                    errors.append(f"Invalid XML {name}: {error}")

        ids = {}
        for name, doc in documents.items():
            ids[name] = {}
            for element in doc.iter():
                if "id" in element.attrib:
                    if element.attrib["id"] in ids[name] and not name.endswith((".opf", ".ncx")):
                        errors.append(f"Duplicate id {name}#{element.attrib['id']}")
                    ids[name][element.attrib["id"]] = element

        def resolve(source, href):
            link = urlsplit(href)
            target = posixpath.normpath(posixpath.join(posixpath.dirname(source), unquote(link.path))) \
                if link.path else source
            return link, target

        for name, doc in documents.items():
            for element in doc.iter():
                for attribute in ("href", "src"):
                    value = element.attrib.get(attribute)
                    if not value:
                        continue
                    link, target = resolve(name, value)
                    if link.scheme or link.netloc:
                        continue
                    if target not in names:
                        errors.append(f"Broken file link {name}: {value}")
                    elif link.fragment and target in ids and unquote(link.fragment) not in ids[target]:
                        errors.append(f"Broken anchor {name}: {value}")

        # Navigation: every entry should land on a heading that matches its label, and no two
        # entries should share a destination. Fragment existence alone misses reused targets.
        entries = []
        for name, doc in documents.items():
            if name.endswith(".ncx"):
                for point in (e for e in doc.iter() if local(e.tag) == "navPoint"):
                    label = next((text(e) for e in point if local(e.tag) == "navLabel"), "")
                    content = next((e for e in point if local(e.tag) == "content"), None)
                    if content is not None:
                        entries.append((name, label, content.attrib.get("src", "")))
            for nav in (e for e in doc.iter() if local(e.tag) == "nav"):
                if nav.attrib.get("{http://www.idpf.org/2007/ops}type") == "toc":
                    entries += [(name, text(a), a.attrib.get("href", ""))
                                for a in nav.iter() if local(a.tag) == "a"]
        seen = {}
        mismatches = []
        for source, label, href in entries:
            link, target = resolve(source, href)
            key = (source.endswith(".ncx"), target, unquote(link.fragment))
            if key in seen and seen[key].casefold() != label.casefold():
                errors.append(f"Navigation entries {seen[key]!r} and {label!r} share destination {href}")
            seen.setdefault(key, label)
            if target in documents:
                node = ids[target].get(unquote(link.fragment)) if link.fragment else \
                    next((e for e in documents[target].iter() if local(e.tag) == "body"), documents[target])
                actual = (text(node) or "")[:400]
                words = set(WORD.findall(label.casefold()))
                if words and len(words & set(WORD.findall(actual.casefold()))) < len(words) / 2:
                    mismatches.append({"label": label, "href": href, "destination_text": actual[:120]})
        if mismatches:
            warnings.append({"navigation_label_mismatches": mismatches})
        report["navigation_entries"] = len(entries)

        math_count = 0
        for name, doc in documents.items():
            if not name.endswith((".xhtml", ".html", ".htm")):
                continue
            math_count += sum(1 for e in doc.iter() if local(e.tag) == "math")
            for chunk in prose_nodes(doc):
                if TEX_COMMAND.search(chunk):
                    errors.append(f"Leaked TeX command {name}: {chunk.strip()[:120]}")
                elif DOLLAR_PAIR.search(chunk):
                    warnings.append(f"Possible TeX delimiters {name}: {chunk.strip()[:120]}")
                if ENTITY.search(chunk):
                    warnings.append(f"Literal entity escape {name}: {chunk.strip()[:120]}")
        report["mathml_expressions"] = math_count
        report["images"] = len([n for n in names if n.lower().endswith((".png", ".jpg", ".jpeg", ".svg", ".gif"))])
        report["passed"] = not errors
    return report


reports = [check(Path(f)) for f in sys.argv[1:]]
print(json.dumps(reports, indent=2, ensure_ascii=False))
sys.exit(1 if any(r["errors"] for r in reports) else 0)
