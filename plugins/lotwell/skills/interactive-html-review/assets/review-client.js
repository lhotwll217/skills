(() => {
  const config = window.__INTERACTIVE_HTML_REVIEW__;
  const reviewModel = config.model;
  // Host decides where Comments go: the local server's review.json, or a claude.ai artifact's own comment threads.
  const HOST = config.host === "artifact" ? "artifact" : "local";
  // Touch devices get an explicit mode switch; pointer devices keep the hold gestures.
  const COARSE = matchMedia("(pointer: coarse)").matches;
  const PAGE_ID = "document";
  const ELEMENT_STATUS = new Set(["resolved", "relocated", "ambiguous", "missing", "unsupported-boundary"]);
  const DURABLE_ATTRIBUTES = ["data-review-id", "data-testid", "data-test", "data-cy", "data-qa"];
  const SEMANTIC_ATTRIBUTES = ["name", "role", "aria-label", "alt", "title"];
  let state;
  let pendingSelection = null;
  let pendingElementTarget = null;
  let editingCommentId = null;
  let discardArmed = false;
  let cropState = null;
  let captureStream = null;
  let pickerActive = false;
  let pickerDeepest = null;
  let pickerTarget = null;
  let pickerDepth = 0;
  let activeElementCommentId = null;
  const resolvedElements = new Map();

  const overlay = document.createElement("div");
  overlay.id = "__hr_overlay";
  overlay.innerHTML = `
  <span class="hr-save" id="hr-save" role="status">Loading…</span>
  <aside class="hr-panel" id="hr-panel" hidden>
    <div class="hr-label">Comments · <span id="hr-count-2">0</span></div>
    <div id="hr-comments"></div>
  </aside>
  <div class="hr-element-layer" id="hr-element-layer"></div>
  <div class="hr-picker-help" id="hr-picker-help" role="status" hidden>Click an element · ↑ parent · ↓ back · Esc to stop</div>
  <div class="hr-picker-box" id="hr-picker-box" hidden><span id="hr-picker-label"></span></div>
  <div class="hr-composer" id="hr-composer" role="dialog" aria-modal="false" aria-labelledby="hr-composer-title">
    <div class="hr-label" id="hr-composer-title">Comment on selection</div>
    <blockquote id="hr-quote"></blockquote>
    <textarea id="hr-text" aria-label="Comment" placeholder="What should the agent understand or change?"></textarea>
    <div class="hr-actions">
      <button class="hr-btn" id="hr-cancel" type="button">Cancel</button>
      <button class="hr-btn hr-primary" id="hr-save-comment" type="button">Add Comment</button>
    </div>
  </div>
  <div class="hr-note" id="hr-note" hidden></div>
  <div class="hr-area-layer" id="hr-area-layer" hidden></div>
  <button class="hr-sel-chip" id="hr-sel-chip" type="button" hidden>Comment</button>
  <div class="hr-touchbar" id="hr-touchbar">
    <div class="hr-actbar" id="hr-actbar" hidden></div>
    <div class="hr-modes" id="hr-modes" role="radiogroup" aria-label="Comment on">
      <button type="button" role="radio" data-mode="text" aria-checked="true" aria-label="Text" title="Text: select text to comment"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 3.5h10M8 3.5v9"/></svg></button>
      <button type="button" role="radio" data-mode="element" aria-checked="false" aria-label="Element" title="Element: hold ⇧ and click an element"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="2.5" y="2.5" width="11" height="11"/><path d="M9 9l4.5 4.5"/></svg><kbd class="hr-key">⇧</kbd></button>
      <button type="button" role="radio" data-mode="area" aria-checked="false" aria-label="Area" title="Area: hold ⌘ and drag a box"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2.5 5.5v-3h3M10.5 2.5h3v3M13.5 10.5v3h-3M5.5 13.5h-3v-3"/></svg><kbd class="hr-key">⌘</kbd></button>
    </div>
    <button class="hr-count" id="hr-toggle" type="button" aria-label="Comments" title="Comments"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z"/></svg><span id="hr-count">0</span></button>
  </div>`;
  document.body.append(overlay);
  if (COARSE) overlay.classList.add("hr-coarse");

  const $ = (selector) => overlay.querySelector(selector);
  const composer = $("#hr-composer");

  function inOverlay(node) {
    return overlay.contains(node?.nodeType === Node.TEXT_NODE ? node.parentNode : node);
  }

  function contentLength(node) {
    if (!node || inOverlay(node)) return 0;
    if (node.nodeType === Node.TEXT_NODE) return node.textContent.length;
    let length = 0;
    for (const child of node.childNodes ?? []) length += contentLength(child);
    return length;
  }

  function contentWalker() {
    return document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => (inOverlay(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
  }

  function contentText() {
    const walker = contentWalker();
    let text = "";
    while (walker.nextNode()) text += walker.currentNode.textContent;
    return text;
  }

  function boundaryOffset(container, offset) {
    let consumed = container.nodeType === Node.TEXT_NODE
      ? Math.min(offset, container.textContent.length)
      : Array.from(container.childNodes).slice(0, offset).reduce((sum, child) => sum + contentLength(child), 0);
    let current = container;
    while (current && current !== document.body) {
      let sibling = current.previousSibling;
      while (sibling) {
        consumed += contentLength(sibling);
        sibling = sibling.previousSibling;
      }
      current = current.parentNode;
    }
    return consumed;
  }

  function rangeFromOffsets(startOffset, endOffset) {
    const walker = contentWalker();
    let consumed = 0;
    let start = null;
    let end = null;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const next = consumed + node.textContent.length;
      if (!start && startOffset >= consumed && startOffset <= next) start = [node, startOffset - consumed];
      if (endOffset >= consumed && endOffset <= next) { end = [node, endOffset - consumed]; break; }
      consumed = next;
    }
    if (!start || !end) return null;
    const range = document.createRange();
    range.setStart(...start);
    range.setEnd(...end);
    return range;
  }

  async function sha256(value) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function note(message) {
    const banner = $("#hr-note");
    banner.textContent = message;
    banner.hidden = false;
    clearTimeout(note.timer);
    note.timer = setTimeout(() => { banner.hidden = true; }, 2600);
  }

  function normalizeText(value, limit = 240) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, limit);
  }

  function elementText(element, limit = 240) {
    return normalizeText(element instanceof HTMLElement ? element.innerText : element.textContent, limit);
  }

  function guidLike(value) {
    const compact = String(value).replace(/[-_]/g, "");
    return /^[a-f\d]{16,}$/i.test(compact) || /^\d{6,}$/.test(compact);
  }

  function stableAttributes(element) {
    const attributes = {};
    for (const name of [...DURABLE_ATTRIBUTES, "id", ...SEMANTIC_ATTRIBUTES]) {
      const value = element.getAttribute?.(name);
      if (!value || (name === "id" && guidLike(value))) continue;
      attributes[name] = value.slice(0, 240);
    }
    return attributes;
  }

  function parentAcrossShadow(element) {
    if (element.parentElement) return element.parentElement;
    const root = element.getRootNode?.();
    return root instanceof ShadowRoot ? root.host : null;
  }

  function landmark(element) {
    if (!(element instanceof Element) || inOverlay(element)) return null;
    return {
      tag: element.localName,
      attributes: stableAttributes(element),
      text: elementText(element, 120),
    };
  }

  function fingerprintFor(element) {
    return {
      tag: element.localName,
      attributes: stableAttributes(element),
      text: elementText(element),
      parent: landmark(parentAcrossShadow(element)),
      previous: landmark(element.previousElementSibling),
      next: landmark(element.nextElementSibling),
    };
  }

  function sameAttributes(expected, actualElement) {
    return Object.entries(expected ?? {}).every(([name, value]) => actualElement.getAttribute(name) === value);
  }

  function sameLandmark(expected, actual) {
    if (!expected || !actual) return expected === actual;
    return expected.tag === actual.tag
      && expected.text === actual.text
      && JSON.stringify(expected.attributes ?? {}) === JSON.stringify(actual.attributes ?? {});
  }

  function matchesFingerprint(element, fingerprint) {
    if (!(element instanceof Element) || element.localName !== fingerprint.tag) return false;
    if (!sameAttributes(fingerprint.attributes, element)) return false;
    if (fingerprint.text && elementText(element) !== fingerprint.text) return false;
    const selfSignals = Object.keys(fingerprint.attributes ?? {}).length + (fingerprint.text ? 1 : 0);
    if (selfSignals > 0) return true;
    const contextMatches = [
      sameLandmark(fingerprint.parent, landmark(parentAcrossShadow(element))),
      sameLandmark(fingerprint.previous, landmark(element.previousElementSibling)),
      sameLandmark(fingerprint.next, landmark(element.nextElementSibling)),
    ].filter(Boolean).length;
    return contextMatches >= 2;
  }

  function cssString(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\n\r\f]/g, " ");
  }

  function rootMatches(root, selector, element) {
    try {
      const matches = Array.from(root.querySelectorAll(selector));
      return matches.includes(element) ? matches.length : 0;
    } catch {
      return 0;
    }
  }

  function structuralSelector(element, root) {
    const parts = [];
    let current = element;
    while (current instanceof Element && current.getRootNode() === root) {
      let part = current.localName;
      const siblings = Array.from(current.parentNode?.children ?? []).filter((sibling) => sibling.localName === current.localName);
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      parts.unshift(part);
      current = current.parentElement;
    }
    return parts.join(" > ");
  }

  function selectorsFor(element, root) {
    const selectors = [];
    const seen = new Set();
    const add = (value, kind, positional = false) => {
      if (!value || seen.has(value)) return;
      const count = rootMatches(root, value, element);
      if (!count) return;
      seen.add(value);
      selectors.push({ value, kind, positional, count });
    };
    const tag = element.localName;
    for (const name of DURABLE_ATTRIBUTES) {
      const value = element.getAttribute(name);
      if (value) add(`${tag}[${name}="${cssString(value)}"]`, "durable-attribute");
    }
    const id = element.getAttribute("id");
    if (id && !guidLike(id)) add(`#${CSS.escape(id)}`, "id");
    for (const name of SEMANTIC_ATTRIBUTES) {
      const value = element.getAttribute(name);
      if (value) add(`${tag}[${name}="${cssString(value)}"]`, "semantic-attribute");
    }
    const stableClasses = Array.from(element.classList ?? [])
      .filter((name) => name.length <= 64 && !guidLike(name))
      .slice(0, 3);
    if (stableClasses.length) add(`${tag}${stableClasses.map((name) => `.${CSS.escape(name)}`).join("")}`, "class");
    add(tag, "tag");
    add(structuralSelector(element, root), "structural", true);
    return selectors;
  }

  function elementSegment(element, root) {
    return {
      kind: "element",
      selectors: selectorsFor(element, root),
      fingerprint: fingerprintFor(element),
    };
  }

  function routeForElement(element) {
    const root = element.getRootNode();
    if (root instanceof ShadowRoot) {
      return [...routeForElement(root.host), { kind: "shadow-root" }, elementSegment(element, root)];
    }
    return [elementSegment(element, document)];
  }

  function elementLabel(element) {
    const id = element.getAttribute("id");
    const classes = Array.from(element.classList ?? []).slice(0, 2);
    const identity = `${element.localName}${id && !guidLike(id) ? `#${id}` : ""}${classes.map((name) => `.${name}`).join("")}`;
    const text = elementText(element, 72);
    return `<${identity}>${text ? ` “${text}”` : ""}`;
  }

  function elementAnchor(element) {
    const rect = element.getBoundingClientRect();
    return {
      version: 1,
      label: elementLabel(element),
      route: routeForElement(element),
      rect: {
        x: Math.round(rect.x + scrollX),
        y: Math.round(rect.y + scrollY),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
      },
    };
  }

  function resolveElementSegment(root, segment) {
    const candidates = new Map();
    for (const selector of segment.selectors ?? []) {
      try {
        for (const element of root.querySelectorAll(selector.value)) {
          if (!candidates.has(element)) candidates.set(element, []);
          candidates.get(element).push(selector);
        }
      } catch {
        // Persisted selectors are evidence. Invalid evidence simply cannot resolve.
      }
    }
    if (candidates.size === 0) return { status: "missing", reason: "No stored selector matches this document." };
    const verified = Array.from(candidates).filter(([element]) => matchesFingerprint(element, segment.fingerprint));
    if (verified.length === 0) return { status: "missing", reason: "Selectors matched, but the element fingerprint did not." };
    if (verified.length > 1) return { status: "ambiguous", reason: "More than one element matches the stored selectors and fingerprint." };
    const [element, selectors] = verified[0];
    return { status: "resolved", element, usedPrimarySelector: selectors.some((selector) => selector === segment.selectors[0]) };
  }

  function resolveElementComment(comment) {
    let root = document;
    let element = null;
    let usedPrimarySelectors = true;
    for (const step of comment.element.route) {
      if (step.kind === "shadow-root") {
        if (!element?.shadowRoot) {
          return { status: "unsupported-boundary", reason: "The stored open Shadow DOM boundary is no longer accessible." };
        }
        root = element.shadowRoot;
        continue;
      }
      const result = resolveElementSegment(root, step);
      if (!result.element) return result;
      element = result.element;
      usedPrimarySelectors &&= result.usedPrimarySelector;
    }
    return {
      status: comment.needsElementRelocation || !usedPrimarySelectors ? "relocated" : "resolved",
      element,
      reason: comment.needsElementRelocation || !usedPrimarySelectors ? "Verified using the stored compound anchor." : undefined,
    };
  }

  function resolveAllElements() {
    resolvedElements.clear();
    let changed = false;
    for (const comment of state.comments) {
      if (!comment.element) continue;
      const result = resolveElementComment(comment);
      if (result.element) resolvedElements.set(comment.id, result.element);
      if (comment.elementStatus !== result.status || comment.elementReason !== result.reason || comment.needsElementRelocation) changed = true;
      comment.elementStatus = result.status;
      if (result.reason) comment.elementReason = result.reason;
      else delete comment.elementReason;
      delete comment.needsElementRelocation;
    }
    return changed;
  }

  function placeComposer() {
    discardArmed = false;
    composer.classList.add("visible");
    const quote = $("#hr-quote");
    quote.replaceChildren();
    if (pendingSelection.screenshot) {
      const image = document.createElement("img");
      image.src = `/${pendingSelection.screenshot}`;
      image.alt = "Selected region";
      quote.append(image);
    } else if (pendingSelection.element) {
      quote.textContent = pendingSelection.element.label;
    } else {
      quote.textContent = pendingSelection.selectedText;
    }
    $("#hr-text").focus();
  }

  function closeComposer() {
    composer.classList.remove("visible");
    CSS.highlights?.delete("hr-selection");
    discardArmed = false;
    pendingSelection = null;
    pendingElementTarget = null;
    editingCommentId = null;
    activeElementCommentId = null;
    $("#hr-text").value = "";
    $("#hr-composer-title").textContent = "Comment on selection";
    $("#hr-save-comment").textContent = "Add Comment";
    renderElementMarkers();
    if (!COARSE && touchMode === "element") startElementPicker();
  }

  function commentRange(comment) {
    if (comment.stale || comment.element || comment.screenshot || !comment.selectedText) return null;
    return rangeFromOffsets(comment.startOffset, comment.endOffset);
  }

  function renderTextHighlights() {
    if (!CSS.highlights) return;
    const ranges = state.comments.map(commentRange).filter(Boolean);
    if (ranges.length) CSS.highlights.set("hr-comments", new Highlight(...ranges));
    else CSS.highlights.delete("hr-comments");
  }

  function renderElementMarkers() {
    const layer = $("#hr-element-layer");
    layer.replaceChildren();
    state?.comments.forEach((comment, index) => {
      const element = resolvedElements.get(comment.id);
      if (!element?.isConnected) return;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 && rect.height <= 0) return;
      const marker = document.createElement("div");
      const atEdge = rect.top < 14 || rect.left < 14;
      marker.className = `hr-element-mark${comment.id === activeElementCommentId ? " active" : ""}${atEdge ? " edge" : ""}`;
      marker.dataset.commentId = comment.id;
      Object.assign(marker.style, {
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      });
      const badge = document.createElement("span");
      badge.textContent = String(index + 1);
      marker.append(badge);
      layer.append(marker);
    });
  }

  function actionButton(action, commentId) {
    const button = document.createElement("button");
    button.className = "hr-link-button";
    button.type = "button";
    button.textContent = action;
    button.dataset.action = action.toLowerCase();
    button.dataset.id = commentId;
    return button;
  }

  function statusLabel(comment) {
    if (comment.stale) return "Stale text anchor";
    if (!comment.element) return comment.screenshot ? "Screenshot" : "Comment";
    return {
      resolved: "Element",
      relocated: "Relocated element",
      ambiguous: "Ambiguous element",
      missing: "Missing element",
      "unsupported-boundary": "Unsupported boundary",
    }[comment.elementStatus] ?? "Element";
  }

  function renderComments() {
    const list = $("#hr-comments");
    list.replaceChildren();
    state.comments.forEach((comment, index) => {
      const unresolvedElement = comment.element && !["resolved", "relocated"].includes(comment.elementStatus);
      const card = document.createElement("article");
      card.className = `hr-comment${comment.stale || unresolvedElement ? " stale" : ""}`;
      card.dataset.commentId = comment.id;
      card.tabIndex = 0;
      const label = document.createElement("div");
      label.className = "hr-label";
      const ordinal = document.createElement("span");
      ordinal.className = "hr-num";
      ordinal.textContent = String(index + 1);
      label.append(ordinal, document.createTextNode(statusLabel(comment)));
      const quote = document.createElement("div");
      quote.className = "hr-quote";
      if (comment.screenshot) {
        const image = document.createElement("img");
        image.className = "hr-shot";
        image.src = `/${comment.screenshot}`;
        image.alt = "Screenshot reference";
        quote.append(image);
      } else if (comment.element) {
        quote.textContent = comment.element.label;
      } else {
        quote.textContent = comment.selectedText;
      }
      const body = document.createElement("div");
      body.textContent = comment.comment;
      const actions = document.createElement("div");
      actions.className = "hr-comment-actions";
      actions.append(actionButton("Edit", comment.id), actionButton("Delete", comment.id));
      card.append(label, quote, body);
      if (comment.elementReason && unresolvedElement) {
        const reason = document.createElement("div");
        reason.className = "hr-anchor-reason";
        reason.textContent = comment.elementReason;
        card.append(reason);
      }
      card.append(actions);
      list.append(card);
    });
    if (state.comments.length === 0) {
      const empty = document.createElement("div");
      empty.className = "hr-empty";
      empty.textContent = "No Comments yet. Highlight text, hold ⇧ to select an element, or ⌘-drag a screenshot.";
      list.append(empty);
    }
    $("#hr-count").textContent = String(state.comments.length);
    $("#hr-count-2").textContent = String(state.comments.length);
    renderTextHighlights();
    renderElementMarkers();
  }

  async function save() {
    $("#hr-save").textContent = "Saving…";
    const response = await fetch("/review.json", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
    });
    $("#hr-save").textContent = response.ok ? "Saved" : "Save failed";
    if (!response.ok) { note("Save failed"); throw new Error(`Autosave failed: ${response.status}`); }
    state = await response.json();
    renderComments();
  }

  async function relocate(comment) {
    if (!comment.selectedText) { delete comment.needsRelocation; return comment; }
    const text = contentText();
    const exact = text.slice(comment.startOffset, comment.endOffset);
    const context = text.slice(comment.startOffset - comment.prefix.length, comment.endOffset + comment.suffix.length);
    delete comment.needsRelocation;
    if (exact === comment.selectedText && (await sha256(context)) === comment.contentHash) return comment;
    const needle = `${comment.prefix}${comment.selectedText}${comment.suffix}`;
    const matches = [];
    let from = 0;
    while (from <= text.length) {
      const index = text.indexOf(needle, from);
      if (index < 0) break;
      matches.push(index + comment.prefix.length);
      from = index + 1;
    }
    if (matches.length === 1) {
      comment.startOffset = matches[0];
      comment.endOffset = matches[0] + comment.selectedText.length;
      return comment;
    }
    comment.stale = true;
    comment.staleReason = "Could not reliably locate this anchor in the current HTML.";
    return comment;
  }

  function openExistingComment(comment, fallbackTarget) {
    if (!comment) return;
    const range = commentRange(comment);
    const element = comment.element ? resolvedElements.get(comment.id) : null;
    const nearby = element ?? range?.startContainer?.parentElement ?? fallbackTarget;
    if (!nearby) return;
    if (element || range) nearby.scrollIntoView({ behavior: "instant", block: "start" });
    pendingSelection = { ...comment };
    pendingElementTarget = element;
    editingCommentId = comment.id;
    activeElementCommentId = element ? comment.id : null;
    $("#hr-text").value = comment.comment;
    $("#hr-composer-title").textContent = "Edit Comment";
    $("#hr-save-comment").textContent = "Save Comment";
    if (range && CSS.highlights) CSS.highlights.set("hr-selection", new Highlight(range));
    renderElementMarkers();
    placeComposer();
  }

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest?.("a[href]");
    if (anchor && !inOverlay(anchor) && !pickerActive) {
      event.preventDefault();
      note(`Link intercepted during review: ${anchor.getAttribute("href")}`);
    }
  }, true);

  async function captureSelection() {
    const selection = getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) return;
    const range = selection.getRangeAt(0).cloneRange();
    if (inOverlay(range.startContainer) || inOverlay(range.endContainer)) return;
    const startOffset = boundaryOffset(range.startContainer, range.startOffset);
    const endOffset = boundaryOffset(range.endContainer, range.endOffset);
    if (endOffset <= startOffset) return;
    const fullText = contentText();
    const selectedText = fullText.slice(startOffset, endOffset);
    if (!selectedText.trim()) return;
    const prefix = fullText.slice(Math.max(0, startOffset - 80), startOffset);
    const suffix = fullText.slice(endOffset, Math.min(fullText.length, endOffset + 80));
    pendingSelection = {
      pageId: PAGE_ID,
      section: reviewModel.title,
      startOffset,
      endOffset,
      selectedText,
      prefix,
      suffix,
      contentHash: await sha256(`${prefix}${selectedText}${suffix}`),
    };
    pendingElementTarget = null;
    if (editingCommentId) $("#hr-text").value = "";
    editingCommentId = null;
    $("#hr-composer-title").textContent = "Comment on selection";
    $("#hr-save-comment").textContent = "Add Comment";
    if (CSS.highlights) CSS.highlights.set("hr-selection", new Highlight(range));
    present({ range });
  }

  function hitTest(root, x, y) {
    const elements = typeof root.elementsFromPoint === "function"
      ? root.elementsFromPoint(x, y)
      : [root.elementFromPoint?.(x, y)].filter(Boolean);
    let element = elements.find((candidate) => !inOverlay(candidate)) ?? null;
    while (element?.shadowRoot) {
      const nested = hitTest(element.shadowRoot, x, y);
      if (!nested || nested === element) break;
      element = nested;
    }
    return element;
  }

  function ancestorAtDepth(element, depth) {
    let current = element;
    for (let index = 0; index < depth; index += 1) {
      const parent = parentAcrossShadow(current);
      if (!parent || parent === document.documentElement) break;
      current = parent;
    }
    return current;
  }

  function showPickerTarget(element) {
    pickerTarget = element;
    const box = $("#hr-picker-box");
    if (!element?.isConnected) { box.hidden = true; return; }
    const rect = element.getBoundingClientRect();
    Object.assign(box.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
    const label = $("#hr-picker-label");
    label.textContent = elementLabel(element);
    box.hidden = false;
    // The outline may extend past the viewport; the label must not. Prefer above
    // the box, fall back inside it, then below, and clamp to the viewport.
    const labelRect = label.getBoundingClientRect();
    let top = rect.top - labelRect.height - 4;
    if (top < 8) top = rect.height >= labelRect.height + 12 ? rect.top + 4 : rect.bottom + 4;
    top = Math.min(Math.max(8, top), Math.max(8, innerHeight - labelRect.height - 8));
    const left = Math.min(Math.max(8, rect.left - 2), Math.max(8, innerWidth - labelRect.width - 8));
    label.style.top = `${top}px`;
    label.style.left = `${left}px`;
  }

  function setPickerFromPoint(x, y, resetDepth = true) {
    const deepest = hitTest(document, x, y);
    if (resetDepth || deepest !== pickerDeepest) pickerDepth = 0;
    pickerDeepest = deepest;
    showPickerTarget(deepest ? ancestorAtDepth(deepest, pickerDepth) : null);
  }

  function stopElementPicker() {
    pickerActive = false;
    pickerDeepest = null;
    pickerTarget = null;
    pickerDepth = 0;
    document.documentElement.classList.remove("__hr_picking");
    $("#hr-picker-box").hidden = true;
    $("#hr-picker-help").hidden = true;
    heldMode(null);
  }

  function startElementPicker() {
    if (pickerActive || composer.classList.contains("visible") || cropState) return;
    pickerActive = true;
    document.documentElement.classList.add("__hr_picking");
    $("#hr-picker-help").hidden = false;
    heldMode("element");
  }

  function captureElement(element) {
    if (!element) return;
    const anchor = elementAnchor(element);
    pendingSelection = {
      pageId: PAGE_ID,
      section: reviewModel.title,
      startOffset: 0,
      endOffset: 0,
      selectedText: "",
      prefix: "",
      suffix: "",
      contentHash: "",
      element: anchor,
      elementStatus: "resolved",
    };
    pendingElementTarget = element;
    if (editingCommentId) $("#hr-text").value = "";
    editingCommentId = null;
    $("#hr-composer-title").textContent = "Comment on element";
    $("#hr-save-comment").textContent = "Add Comment";
    stopElementPicker();
    present({ element });
  }

  document.addEventListener("pointermove", (event) => {
    if (!pickerActive || inOverlay(event.target)) return;
    if (!event.shiftKey && touchMode !== "element") { stopElementPicker(); return; }
    // Keep the stepped ancestor depth across pointer jitter; it resets only
    // when the hit-tested deepest element actually changes.
    setPickerFromPoint(event.clientX, event.clientY, false);
  }, true);

  // While picking, the pointer is a probe: keep the page's own mousedown/up
  // handlers from firing. Canceling pointerdown does not suppress the click
  // event, so click-to-confirm below still works.
  for (const type of ["pointerdown", "mousedown", "mouseup", "pointerup"]) {
    document.addEventListener(type, (event) => {
      if (!pickerActive || inOverlay(event.target)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  }

  document.addEventListener("click", (event) => {
    if (!pickerActive || inOverlay(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!event.shiftKey && touchMode !== "element") { stopElementPicker(); return; }
    setPickerFromPoint(event.clientX, event.clientY, false);
    captureElement(pickerTarget);
  }, true);

  // Pointer events fire more consistently than mouseup across drag styles,
  // and the zero-delay defer lets the browser finalize the selection first.
  document.addEventListener("pointerup", (event) => {
    if (COARSE || pickerActive || cropState || event.metaKey || inOverlay(event.target)) return;
    setTimeout(() => { captureSelection().catch((error) => note(`Selection failed: ${error.message}`)); }, 0);
  });
  document.addEventListener("dblclick", (event) => {
    if (COARSE || pickerActive || event.metaKey || inOverlay(event.target)) return;
    setTimeout(() => { captureSelection().catch((error) => note(`Selection failed: ${error.message}`)); }, 0);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Meta" && !event.repeat && !pickerActive) heldMode("area");
    if (event.key === "Shift" && !event.repeat && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const active = document.activeElement;
      const editable = active && (active.isContentEditable || /^(input|textarea|select)$/i.test(active.tagName ?? ""));
      if (!editable) startElementPicker();
      return;
    }
    if (pickerActive) {
      if (["Meta", "Control", "Alt"].includes(event.key)) {
        stopElementPicker();
        return;
      }
      if (["ArrowUp", "ArrowDown"].includes(event.key) && pickerDeepest) {
        event.preventDefault();
        if (event.key === "ArrowUp") pickerDepth += 1;
        else pickerDepth = Math.max(0, pickerDepth - 1);
        showPickerTarget(ancestorAtDepth(pickerDeepest, pickerDepth));
        return;
      }
    }
    if (event.key === "Escape" && composer.classList.contains("visible")) {
      if ($("#hr-text").value.trim() && !discardArmed) {
        discardArmed = true;
        note("Press Esc again to discard this Comment");
        return;
      }
      closeComposer();
    }
  }, true);
  document.addEventListener("keyup", (event) => {
    if (event.key === "Meta") heldMode(null);
    if (event.key === "Shift" && pickerActive && touchMode !== "element") stopElementPicker();
  }, true);
  addEventListener("blur", () => {
    heldMode(null);
    if (pickerActive && touchMode !== "element") stopElementPicker();
  });

  // --- ⌘+drag region screenshots ---
  function cropRect(event) {
    const x = Math.min(cropState.startX, event.clientX);
    const y = Math.min(cropState.startY, event.clientY);
    return { x, y, w: Math.abs(event.clientX - cropState.startX), h: Math.abs(event.clientY - cropState.startY) };
  }

  document.addEventListener("pointerdown", (event) => {
    if (pickerActive || !event.metaKey || event.button !== 0 || inOverlay(event.target)) return;
    event.preventDefault();
    getSelection()?.removeAllRanges();
    const box = document.createElement("div");
    box.className = "hr-crop";
    overlay.append(box);
    cropState = { startX: event.clientX, startY: event.clientY, box };
  }, true);

  document.addEventListener("pointermove", (event) => {
    if (!cropState) return;
    const rect = cropRect(event);
    Object.assign(cropState.box.style, { left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.w}px`, height: `${rect.h}px` });
  }, true);

  document.addEventListener("pointerup", (event) => {
    if (!cropState) return;
    const rect = cropRect(event);
    cropState.box.remove();
    cropState = null;
    if (rect.w < 8 || rect.h < 8) return;
    captureRegion(rect).catch((error) => note(`Screenshot failed: ${error.message}`));
  }, true);

  async function ensureCaptureStream() {
    if (captureStream?.getVideoTracks().some((track) => track.readyState === "live")) return captureStream;
    if (!navigator.mediaDevices?.getDisplayMedia) throw new Error("Screen capture is unavailable in this browser");
    captureStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
      preferCurrentTab: true,
      selfBrowserSurface: "include",
    });
    return captureStream;
  }

  async function streamRegion(rect) {
    const stream = await ensureCaptureStream();
    const video = document.createElement("video");
    video.muted = true;
    video.srcObject = stream;
    await video.play();
    overlay.style.visibility = "hidden";
    await new Promise((settle) => setTimeout(settle, 150));
    try {
      const scaleX = video.videoWidth / innerWidth;
      const scaleY = video.videoHeight / innerHeight;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(rect.w * scaleX));
      canvas.height = Math.max(1, Math.round(rect.h * scaleY));
      canvas.getContext("2d").drawImage(
        video,
        rect.x * scaleX, rect.y * scaleY, rect.w * scaleX, rect.h * scaleY,
        0, 0, canvas.width, canvas.height,
      );
      return await new Promise((settle) => canvas.toBlob(settle, "image/png"));
    } finally {
      overlay.style.visibility = "";
      video.pause();
      video.srcObject = null;
    }
  }

  // Where screen capture is unavailable (phones, sandboxed artifact frames), redraw the region from the DOM.
  function loadRenderer() {
    if (window.html2canvas) return Promise.resolve();
    return new Promise((settle, fail) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.onload = settle;
      script.onerror = () => fail(new Error("Could not load the page renderer"));
      document.head.append(script);
    });
  }

  async function renderRegion(rect) {
    await loadRenderer();
    const canvas = await window.html2canvas(document.documentElement, {
      x: rect.x + scrollX,
      y: rect.y + scrollY,
      width: rect.w,
      height: rect.h,
      windowWidth: document.documentElement.clientWidth,
      windowHeight: innerHeight,
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      scale: Math.min(2, devicePixelRatio || 1),
      logging: false,
      ignoreElements: (node) => node === overlay,
    });
    return new Promise((settle) => canvas.toBlob(settle, "image/png"));
  }

  async function captureRegion(rect) {
    const useStream = HOST === "local" && navigator.mediaDevices?.getDisplayMedia && !COARSE;
    const blob = useStream ? await streamRegion(rect) : await renderRegion(rect);
    if (!blob) throw new Error("Could not encode the region");
    if (HOST === "artifact") { await stageArtifactArea(rect, blob); return; }
    {
      const response = await fetch("/shots", { method: "POST", headers: { "content-type": "image/png" }, body: blob });
      if (!response.ok) throw new Error(`Upload failed (${response.status})`);
      const { path } = await response.json();
      pendingSelection = {
        pageId: PAGE_ID,
        section: reviewModel.title,
        startOffset: 0,
        endOffset: 0,
        selectedText: "",
        prefix: "",
        suffix: "",
        contentHash: "",
        screenshot: path,
        rect: { x: Math.round(rect.x + scrollX), y: Math.round(rect.y + scrollY), w: Math.round(rect.w), h: Math.round(rect.h) },
      };
      pendingElementTarget = null;
      if (editingCommentId) $("#hr-text").value = "";
      editingCommentId = null;
      $("#hr-composer-title").textContent = "Comment on screenshot";
      $("#hr-save-comment").textContent = "Add Comment";
      placeComposer();
    }
  }

  // --- Host routing: one call per captured target ---
  function present(target) {
    if (HOST === "artifact") {
      sendToArtifact(target).catch((error) => note(`Comment failed: ${error.code ?? error.message}`));
      return;
    }
    placeComposer();
  }

  // --- Action bar: what is picked and what can be done with it ---
  function showActions(label, buttons) {
    const bar = $("#hr-actbar");
    if (!label && !buttons.length) { bar.hidden = true; bar.replaceChildren(); return; }
    const nodes = [];
    if (label) {
      const what = document.createElement("span");
      what.className = "hr-what";
      what.textContent = label;
      nodes.push(what);
    }
    for (const [text, onClick, primary, ariaLabel] of buttons) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = text;
      if (primary) button.className = "hr-primary";
      if (ariaLabel) button.setAttribute("aria-label", ariaLabel);
      button.addEventListener("click", onClick);
      nodes.push(button);
    }
    bar.replaceChildren(...nodes);
    bar.hidden = false;
  }

  // --- claude.ai artifact host: the shell's composer and threads, screenshots in the asset store ---
  let artifactComments = null;
  let artifactAssets = null;
  let anchors = null;
  let threadList = [];
  let stagedArea = null;
  const knownAnchors = new Map();

  function trimBytes(value, limit) {
    const encoder = new TextEncoder();
    let text = String(value);
    while (encoder.encode(text).length > limit) text = text.slice(0, -1);
    return text;
  }

  function nearestHeading(element) {
    let current = element;
    while (current && current !== document.body) {
      let sibling = current;
      while (sibling) {
        const heading = sibling.matches?.("h1, h2, h3, h4, h5, h6") ? sibling : sibling.querySelector?.("h1, h2, h3, h4, h5, h6");
        if (heading && !inOverlay(heading) && sibling !== element) return elementText(heading, 80);
        sibling = sibling.previousElementSibling;
      }
      current = current.parentElement;
    }
    return "";
  }

  function whereText(element) {
    const heading = nearestHeading(element);
    return `${heading ? `Near “${heading}”. ` : ""}Path: ${structuralSelector(element, element.getRootNode())}`;
  }

  function coveredText(rect) {
    const seen = new Set();
    for (const element of document.body.querySelectorAll("*")) {
      if (inOverlay(element) || element.children.length) continue;
      const box = element.getBoundingClientRect();
      if (box.right < rect.x || box.left > rect.x + rect.w || box.bottom < rect.y || box.top > rect.y + rect.h) continue;
      const text = elementText(element, 120);
      if (text) seen.add(text);
    }
    return Array.from(seen).join(" | ");
  }

  async function composeAt(element, point, target, { label, detail, area = false }) {
    if (!artifactComments) { note("Commenting is unavailable in this view"); return; }
    let result;
    if (anchors) {
      const [anchor, at] = anchors.domAnchor(element, point);
      knownAnchors.set(anchor, element);
      result = await anchors.compose(anchor, at, { label: trimBytes(label, 120), detail: trimBytes(detail, 500), area });
    } else {
      result = await artifactComments.openComposer(target);
    }
    if (result && result.opened === false) note("Finish or close the open comment first");
    else resetTouch();
  }

  async function sendToArtifact(target) {
    if (target.range) {
      const quote = normalizeText(target.range.toString(), 400);
      let host = target.range.commonAncestorContainer;
      if (host.nodeType !== Node.ELEMENT_NODE) host = host.parentElement;
      const box = target.range.getBoundingClientRect();
      await composeAt(host, { clientX: box.left + 2, clientY: box.top + 2 }, { range: target.range }, {
        label: `“${quote.slice(0, 100)}”`,
        detail: `Selected text: “${quote}”. ${whereText(host)}`,
      });
    } else if (target.element) {
      await composeAt(target.element, undefined, { element: target.element }, {
        label: elementLabel(target.element),
        detail: whereText(target.element),
      });
    }
    closeComposer();
  }

  async function stageArtifactArea(rect, blob) {
    const centerX = rect.x + rect.w / 2;
    const centerY = rect.y + rect.h / 2;
    const element = hitTest(document, centerX, centerY) ?? document.body;
    const staged = { rect, element, point: { clientX: centerX, clientY: centerY }, asset: null, covers: coveredText(rect) };
    stagedArea = staged;
    showActions("Saving…", [["✕", resetTouch, false, "Cancel"]]);
    try {
      if (artifactAssets) staged.asset = (await artifactAssets.upload(blob)).id;
    } catch {
      staged.asset = null;
    }
    if (stagedArea !== staged) return;
    showActions(staged.asset ? "Area captured" : "Area marked, no image", [
      ["Comment", () => {
        composeAt(staged.element, staged.point, { element: staged.element }, {
          label: `Area${nearestHeading(staged.element) ? ` near “${nearestHeading(staged.element)}”` : ""}`,
          detail: `${staged.asset ? `Screenshot asset ${staged.asset}. ` : ""}Covers: ${staged.covers}`,
          area: true,
        }).catch((error) => note(`Comment failed: ${error.code ?? error.message}`));
      }, true],
      ["✕", resetTouch, false, "Cancel"],
    ]);
  }

  function locateAnchor(anchor) {
    const known = knownAnchors.get(anchor);
    if (known?.isConnected) return known;
    try { return document.querySelector(anchor); } catch { return null; }
  }

  function placePins() {
    if (!anchors) return;
    const placed = {};
    for (const thread of threadList) {
      const element = locateAnchor(thread.anchor);
      if (!element) continue;
      const box = element.getBoundingClientRect();
      placed[thread.id] = { x: box.right + scrollX - 6, y: box.top + scrollY + 6 };
    }
    anchors.placed(placed);
  }

  async function initializeArtifact() {
    state = { comments: [] };
    $("#hr-toggle").hidden = true;
    $("#hr-save").hidden = true;
    if (!window.claude?.use) { overlay.hidden = true; return; }
    window.claude.use("assets").then((assets) => { artifactAssets = assets; });
    artifactComments = await window.claude.use("comments");
    if (!artifactComments) { overlay.hidden = true; return; }
    if (!artifactComments.customAnchors) return;
    // Owning anchoring keeps the shell's click-to-comment from capturing taps on this overlay.
    artifactComments.customAnchors({
      mode: () => {},
      threads: (list) => { threadList = list ?? []; placePins(); },
      reveal: (id) => {
        const thread = threadList.find((item) => item.id === id);
        const element = thread && locateAnchor(thread.anchor);
        element?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      },
      composing: (open) => { if (!open && stagedArea) resetTouch(); },
    }).then((controller) => { anchors = controller; placePins(); }, () => { anchors = null; });
  }

  // --- Mode switch, Text by default. Touch uses it alone; desktop also keeps the ⇧ and ⌘ holds. ---
  let touchMode = "text";

  // Light the mode a held shortcut stands for, without changing the chosen mode.
  function heldMode(mode) {
    for (const button of overlay.querySelectorAll("[data-mode]")) button.classList.toggle("hr-held", button.dataset.mode === mode);
  }
  let touchPicking = false;
  let touchCrop = null;

  function resetTouch() {
    stagedArea = null;
    touchPicking = false;
    $("#hr-picker-box").hidden = true;
    $("#hr-sel-chip").hidden = true;
    showActions("", []);
  }

  function setTouchMode(mode) {
    touchMode = mode;
    for (const button of overlay.querySelectorAll("[data-mode]")) button.setAttribute("aria-checked", String(button.dataset.mode === mode));
    resetTouch();
    $("#hr-area-layer").hidden = mode !== "area";
    if (!COARSE) {
      if (mode === "element") startElementPicker();
      else if (pickerActive) stopElementPicker();
    }
  }

  function showTouchPick(element) {
    touchPicking = true;
    showPickerTarget(element);
    showActions(elementText(element, 60) || element.localName, [
      ["↑", () => { pickerDepth += 1; showPickerTarget(ancestorAtDepth(pickerDeepest, pickerDepth)); }, false, "Parent element"],
      ["↓", () => { pickerDepth = Math.max(0, pickerDepth - 1); showPickerTarget(ancestorAtDepth(pickerDeepest, pickerDepth)); }, false, "Smaller element"],
      ["Comment", () => { const element = pickerTarget; resetTouch(); captureElement(element); }, true],
      ["✕", resetTouch, false, "Cancel"],
    ]);
  }

  for (const button of overlay.querySelectorAll("[data-mode]")) button.addEventListener("click", () => setTouchMode(button.dataset.mode));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && touchMode !== "text" && !composer.classList.contains("visible")) setTouchMode("text");
  });

  if (COARSE) {

    let selectionTimer = null;
    document.addEventListener("selectionchange", () => {
      clearTimeout(selectionTimer);
      selectionTimer = setTimeout(() => {
        const chip = $("#hr-sel-chip");
        const selection = getSelection();
        if (touchMode !== "text" || !selection?.rangeCount || selection.isCollapsed || inOverlay(selection.anchorNode)) { chip.hidden = true; return; }
        const box = selection.getRangeAt(0).getBoundingClientRect();
        chip.hidden = false;
        chip.style.left = `${Math.min(Math.max(8, box.left), innerWidth - chip.offsetWidth - 8)}px`;
        chip.style.top = `${Math.min(box.bottom + 10, innerHeight - chip.offsetHeight - 80)}px`;
      }, 150);
    });
    $("#hr-sel-chip").addEventListener("pointerdown", (event) => event.preventDefault());
    $("#hr-sel-chip").addEventListener("click", () => {
      $("#hr-sel-chip").hidden = true;
      captureSelection().catch((error) => note(`Selection failed: ${error.message}`));
    });

    document.addEventListener("click", (event) => {
      if (touchMode !== "element" || inOverlay(event.target)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      pickerDeepest = hitTest(document, event.clientX, event.clientY);
      pickerDepth = 0;
      if (pickerDeepest) showTouchPick(pickerDeepest);
    }, true);

  }

  const areaLayer = $("#hr-area-layer");
  areaLayer.addEventListener("pointerdown", (event) => {
    areaLayer.setPointerCapture(event.pointerId);
    const box = document.createElement("div");
    box.className = "hr-crop";
    overlay.append(box);
    showActions("", []);
    touchCrop = { startX: event.clientX, startY: event.clientY, box };
  });
  areaLayer.addEventListener("pointermove", (event) => {
    if (!touchCrop) return;
    const x = Math.min(touchCrop.startX, event.clientX);
    const y = Math.min(touchCrop.startY, event.clientY);
    Object.assign(touchCrop.box.style, { left: `${x}px`, top: `${y}px`, width: `${Math.abs(event.clientX - touchCrop.startX)}px`, height: `${Math.abs(event.clientY - touchCrop.startY)}px` });
  });
  areaLayer.addEventListener("pointerup", (event) => {
    if (!touchCrop) return;
    const rect = {
      x: Math.min(touchCrop.startX, event.clientX),
      y: Math.min(touchCrop.startY, event.clientY),
      w: Math.abs(event.clientX - touchCrop.startX),
      h: Math.abs(event.clientY - touchCrop.startY),
    };
    touchCrop.box.remove();
    touchCrop = null;
    if (rect.w < 12 || rect.h < 12) return;
    captureRegion(rect).catch((error) => note(`Screenshot failed: ${error.message}`));
  });

  $("#hr-toggle").addEventListener("click", () => {
    const panel = $("#hr-panel");
    panel.hidden = !panel.hidden;
  });
  $("#hr-cancel").addEventListener("click", closeComposer);
  $("#hr-text").addEventListener("input", () => { discardArmed = false; });
  $("#hr-save-comment").addEventListener("click", async () => {
    const content = $("#hr-text").value.trim();
    if (!pendingSelection || !content) return;
    if (editingCommentId) {
      const existing = state.comments.find((comment) => comment.id === editingCommentId);
      if (existing) existing.comment = content;
    } else {
      const comment = { id: crypto.randomUUID(), ...pendingSelection, comment: content };
      state.comments.push(comment);
      if (comment.element && pendingElementTarget) resolvedElements.set(comment.id, pendingElementTarget);
    }
    closeComposer();
    await save();
  });

  $("#hr-comments").addEventListener("click", async (event) => {
    const action = event.target.closest("button[data-action]");
    if (action) {
      event.stopPropagation();
      const comment = state.comments.find((item) => item.id === action.dataset.id);
      if (action.dataset.action === "edit" && comment) openExistingComment(comment, action.closest(".hr-comment"));
      if (action.dataset.action === "delete") {
        state.comments = state.comments.filter((item) => item.id !== action.dataset.id);
        resolvedElements.delete(action.dataset.id);
        await save();
      }
      return;
    }
    const card = event.target.closest(".hr-comment[data-comment-id]");
    if (card) openExistingComment(state.comments.find((comment) => comment.id === card.dataset.commentId), card);
  });

  let markerFrame = null;
  function scheduleMarkerRefresh() {
    if (markerFrame) return;
    markerFrame = requestAnimationFrame(() => {
      markerFrame = null;
      renderElementMarkers();
      if ((pickerActive || touchPicking) && pickerTarget) showPickerTarget(pickerTarget);
      if (HOST === "artifact") placePins();
    });
  }
  addEventListener("scroll", scheduleMarkerRefresh, true);
  addEventListener("resize", scheduleMarkerRefresh);

  async function initialize() {
    if (HOST === "artifact") return initializeArtifact();
    const response = await fetch("/review.json");
    state = await response.json();
    let changed = false;
    for (const comment of state.comments) {
      if (comment.needsRelocation) {
        await relocate(comment);
        changed = true;
      }
    }
    changed = resolveAllElements() || changed;
    if (changed) await save();
    else renderComments();
    $("#hr-save").textContent = "Saved";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
