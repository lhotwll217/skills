const reviewModel = window.__INTERACTIVE_DIFF_REVIEW__.model;
const reviewPath = window.__INTERACTIVE_DIFF_REVIEW__.reviewPath;
let state;
let pendingSelection = null;
let editingCommentId = null;

const $ = (selector) => document.querySelector(selector);
const composer = $("#composer");

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function internalFileAnchor(file) {
  return file.anchor;
}

function internalLineAnchor(file, side, line) {
  return `${file.anchor}-${side}-${line}`;
}

function statsNode(file) {
  const stats = element("span", "stats");
  const additions = element("span", "positive", `+${file.additions}`);
  const deletions = element("span", "negative", `−${file.deletions}`);
  stats.append(additions, deletions);
  return stats;
}

function lineComments(file, side, line) {
  if (line === null || !state) return [];
  return state.comments.filter(
    (comment) => !comment.stale && comment.file === file.path && comment.side === side &&
      comment.startLine <= line && comment.endLine >= line,
  );
}

function renderNavigation() {
  const total = reviewModel.files.length;
  $("#file-select").replaceChildren(...reviewModel.files.map((file, fileIndex) => {
    const option = element("option", "", `${fileIndex + 1}/${total} · ${file.path} · +${file.additions} −${file.deletions}`);
    option.value = internalFileAnchor(file);
    return option;
  }));
}

function jumpToFile(anchor) {
  const section = document.getElementById(anchor);
  if (!section) return;
  section.scrollIntoView({ behavior: "instant", block: "start" });
  section.querySelector(".file-head").focus({ preventScroll: true });
  $("#file-select").value = anchor;
}

function stepFile(offset) {
  const select = $("#file-select");
  const index = Math.min(Math.max(select.selectedIndex + offset, 0), select.options.length - 1);
  jumpToFile(select.options[index].value);
}

function currentFileAnchor() {
  const headerBottom = $("#topbar").getBoundingClientRect().bottom;
  let current = reviewModel.files[0];
  for (const file of reviewModel.files) {
    if (document.getElementById(internalFileAnchor(file)).getBoundingClientRect().top > headerBottom + 1) break;
    current = file;
  }
  return internalFileAnchor(current);
}

function lineCells(file, fileIndex, side, row) {
  const line = side === "old" ? row.oldLine : row.newLine;
  const kind = side === "old" ? row.oldKind : row.newKind;
  const comments = lineComments(file, side, line);
  const count = comments.filter((comment) => comment.startLine === line).length;
  const number = element("div", `num ${side} ${kind}`, line ?? "");
  const code = element("div", `code ${side} ${kind}${comments.length ? " annotated" : ""}`, side === "old" ? row.oldText : row.newText);
  if (line !== null) code.id = internalLineAnchor(file, side, line);
  code.dataset.file = file.path;
  code.dataset.fileIndex = String(fileIndex);
  code.dataset.side = side;
  code.dataset.line = line === null ? "" : String(line);
  code.dataset.kind = kind;
  if (count) {
    const badge = element("button", "badge", String(count));
    badge.type = "button";
    badge.setAttribute("aria-label", `${count} comment${count === 1 ? "" : "s"} on ${side === "old" ? "base" : "candidate"} line ${line}`);
    code.append(badge);
  }
  return [number, code];
}

function hunkLabel(row) {
  return `@@ ${row.oldLine === null ? "" : `−${row.oldLine} `}${row.newLine === null ? "" : `+${row.newLine} `}@@`;
}

function renderFileDiff(file, fileIndex) {
  const diff = element("div", "diff");
  const digits = String(Math.max(...file.rows.flatMap((row) => [row.oldLine ?? 0, row.newLine ?? 0]), 1)).length;
  diff.style.setProperty("--gutter", `calc(${digits}ch + 16px)`);
  const sides = element("div", "side-labels");
  sides.append(element("span", "", "Base"), element("span", "", "Candidate"));
  diff.append(sides);
  let previous = { oldLine: null, newLine: null };
  for (const row of file.rows) {
    const breaksOld = row.oldLine !== null && previous.oldLine !== null && row.oldLine !== previous.oldLine + 1;
    const breaksNew = row.newLine !== null && previous.newLine !== null && row.newLine !== previous.newLine + 1;
    if (row === file.rows[0] || breaksOld || breaksNew) diff.append(element("div", "hunk", hunkLabel(row)));
    const rowNode = element("div", `row ${row.oldKind === "context" ? "context" : "change"}`);
    rowNode.append(...lineCells(file, fileIndex, "old", row), ...lineCells(file, fileIndex, "new", row));
    diff.append(rowNode);
    previous = { oldLine: row.oldLine ?? previous.oldLine, newLine: row.newLine ?? previous.newLine };
  }
  return diff;
}

function renderDiff() {
  const files = $("#files");
  files.replaceChildren();
  reviewModel.files.forEach((file, fileIndex) => {
    const section = element("section", "file-review");
    section.id = internalFileAnchor(file);
    const header = element("h2", "file-head");
    header.tabIndex = -1;
    const slash = file.path.lastIndexOf("/") + 1;
    const path = element("span", "file-path");
    path.append(element("span", "dir", file.path.slice(0, slash)), element("span", "name", file.path.slice(slash)));
    header.append(path, statsNode(file));
    section.append(header, renderFileDiff(file, fileIndex));
    files.append(section);
  });
}

function actionButton(action, commentId) {
  const button = element("button", "link-button", action);
  button.type = "button";
  button.dataset.action = action.toLowerCase();
  button.dataset.id = commentId;
  return button;
}

function renderComments() {
  const comments = $("#comments");
  comments.replaceChildren();
  const fileOrder = new Map(reviewModel.files.map((file, index) => [file.path, index]));
  const inDiffOrder = [...state.comments].sort((left, right) =>
    (fileOrder.get(left.file) ?? Infinity) - (fileOrder.get(right.file) ?? Infinity) || left.startLine - right.startLine);
  for (const comment of inDiffOrder) {
    const card = element("article", `comment${comment.stale ? " stale" : ""}`);
    card.dataset.commentId = comment.id;
    card.tabIndex = 0;
    const lines = comment.endLine > comment.startLine ? `${comment.startLine}–${comment.endLine}` : comment.startLine;
    const label = element("div", "comment-location", `${comment.file}:${lines}`);
    if (comment.stale) label.append(element("span", "stale-tag", "Stale anchor"));
    const actions = element("div", "comment-actions");
    actions.append(actionButton("Edit", comment.id), actionButton("Delete", comment.id));
    card.append(
      label,
      element("div", "quote", comment.selectedText),
      element("div", "comment-body", comment.comment),
      actions,
    );
    comments.append(card);
  }
  if (state.comments.length === 0) comments.append(element("div", "empty", "No comments yet. Select changed text in the diff to comment; every change autosaves."));
  $("#comment-count").textContent = String(state.comments.length);
}

function render() {
  renderDiff();
  renderComments();
}

async function save() {
  $("#save-status").textContent = "Saving…";
  const response = await fetch("/review.json", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(state),
  });
  $("#save-status").textContent = response.ok ? "Saved" : "Save failed";
  if (!response.ok) throw new Error(`Autosave failed: ${response.status}`);
  state = await response.json();
  render();
}

function codeNode(node) {
  return node?.nodeType === Node.TEXT_NODE ? node.parentElement?.closest(".code") : node?.closest?.(".code");
}

function lineTexts(file, side) {
  return file.rows
    .map((row) => ({ line: side === "old" ? row.oldLine : row.newLine, text: side === "old" ? row.oldText : row.newText }))
    .filter((entry) => entry.line !== null);
}

function contextPayload(file, side, startLine, endLine) {
  const lines = lineTexts(file, side);
  const startIndex = lines.findIndex((entry) => entry.line === startLine);
  const endIndex = lines.findIndex((entry) => entry.line === endLine);
  if (startIndex < 0 || endIndex < startIndex) return "";
  return lines.slice(Math.max(0, startIndex - 1), Math.min(lines.length, endIndex + 2)).map((entry) => entry.text).join("\n");
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function textOffset(node, container, offset) {
  const before = document.createRange();
  before.selectNodeContents(node);
  before.setEnd(container, offset);
  return before.toString().length;
}

function sideRanges(range, start, end) {
  const cells = [...start.closest(".diff").querySelectorAll(`.code[data-side="${start.dataset.side}"]`)];
  return cells.slice(cells.indexOf(start), cells.indexOf(end) + 1).map((cell) => {
    const cellRange = document.createRange();
    cellRange.selectNodeContents(cell);
    if (cell === start) cellRange.setStart(range.startContainer, range.startOffset);
    if (cell === end) cellRange.setEnd(range.endContainer, range.endOffset);
    return cellRange;
  });
}

function composerPosition(rect, bounds, viewport) {
  const margin = 12;
  const gap = 8;
  const preferredLeft = rect.right + gap;
  const candidateLeft = preferredLeft + bounds.width <= viewport.width - margin
    ? preferredLeft
    : rect.left - bounds.width - gap;
  const preferredTop = rect.bottom + gap;
  const candidateTop = preferredTop + bounds.height <= viewport.height - margin
    ? preferredTop
    : rect.top - bounds.height - gap;
  return {
    left: Math.min(Math.max(margin, candidateLeft), Math.max(margin, viewport.width - bounds.width - margin)),
    top: Math.min(Math.max(margin, candidateTop), Math.max(margin, viewport.height - bounds.height - margin)),
  };
}

function placeComposer(rect) {
  composer.classList.add("visible");
  $("#selected-quote").textContent = pendingSelection.selectedText;
  const bounds = composer.getBoundingClientRect();
  const { left, top } = composerPosition(rect, bounds, { width: innerWidth, height: innerHeight });
  composer.style.left = `${left}px`;
  composer.style.top = `${top}px`;
  $("#comment-text").focus();
}

function closeComposer() {
  composer.classList.remove("visible");
  CSS.highlights?.delete("review-selection");
  pendingSelection = null;
  editingCommentId = null;
  $("#comment-text").value = "";
  $("#composer-title").textContent = "Comment on selection";
  $("#save-comment").textContent = "Add comment";
}

function openExistingComment(comment, fallbackTarget) {
  if (!comment) return;
  const fileIndex = reviewModel.files.findIndex((file) => file.path === comment.file);
  const file = reviewModel.files[fileIndex];
  const target = !comment.stale && file ? document.getElementById(internalLineAnchor(file, comment.side, comment.startLine)) : null;
  const nearby = target ?? fallbackTarget;
  if (!nearby) return;
  const scrollTarget = target ?? (file ? document.getElementById(internalFileAnchor(file)) : null);
  scrollTarget?.scrollIntoView({ behavior: "instant", block: "center" });
  pendingSelection = { ...comment };
  editingCommentId = comment.id;
  $("#comment-text").value = comment.comment;
  $("#composer-title").textContent = "Edit comment";
  $("#save-comment").textContent = "Save comment";
  requestAnimationFrame(() => placeComposer(nearby.getBoundingClientRect()));
}

$("#files").addEventListener("mouseup", async () => {
  if (!state) return;
  const selection = getSelection();
  const selectedText = selection.toString();
  if (!selectedText.trim() || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0).cloneRange();
  const start = codeNode(range.startContainer);
  const end = codeNode(range.endContainer);
  if (
    !start || !end || start.dataset.file !== end.dataset.file || start.dataset.side !== end.dataset.side ||
    !start.dataset.line || !end.dataset.line || start.dataset.kind === "context" || end.dataset.kind === "context"
  ) return;
  const startLine = Number(start.dataset.line);
  const endLine = Number(end.dataset.line);
  if (startLine > endLine) return;
  const fileIndex = Number(start.dataset.fileIndex);
  const file = reviewModel.files[fileIndex];
  const selectedEntries = lineTexts(file, start.dataset.side)
    .filter((entry) => entry.line >= startLine && entry.line <= endLine);
  const prefix = selectedEntries[0].text.slice(0, textOffset(start, range.startContainer, range.startOffset));
  const suffix = selectedEntries.at(-1).text.slice(textOffset(end, range.endContainer, range.endOffset));
  const selectedLines = selectedEntries.map((entry) => entry.text).join("\n");
  if (CSS.highlights) CSS.highlights.set("review-selection", new Highlight(...sideRanges(range, start, end)));
  pendingSelection = {
    file: file.path,
    side: start.dataset.side,
    startLine,
    endLine,
    selectedText: selectedLines.slice(prefix.length, selectedLines.length - suffix.length),
    prefix,
    suffix,
    contentHash: await sha256(contextPayload(file, start.dataset.side, startLine, endLine)),
  };
  editingCommentId = null;
  $("#composer-title").textContent = "Comment on selection";
  $("#save-comment").textContent = "Add comment";
  placeComposer(range.getBoundingClientRect());
});

$("#cancel").addEventListener("click", closeComposer);
composer.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeComposer();
});
$("#save-comment").addEventListener("click", async () => {
  const content = $("#comment-text").value.trim();
  if (!pendingSelection || !content) return;
  if (editingCommentId) {
    const existing = state.comments.find((comment) => comment.id === editingCommentId);
    if (existing) existing.comment = content;
  } else {
    state.comments.push({ id: crypto.randomUUID(), ...pendingSelection, comment: content });
    if (matchMedia("(min-width: 1100px)").matches) setCommentsOpen(true);
  }
  closeComposer();
  await save();
});

$("#comments").addEventListener("click", async (event) => {
  const action = event.target.closest("button[data-action]");
  if (action) {
    event.stopPropagation();
    const comment = state.comments.find((item) => item.id === action.dataset.id);
    if (action.dataset.action === "edit" && comment) openExistingComment(comment, action.closest(".comment"));
    if (action.dataset.action === "delete") {
      state.comments = state.comments.filter((item) => item.id !== action.dataset.id);
      await save();
    }
    return;
  }
  const card = event.target.closest(".comment[data-comment-id]");
  if (card) openExistingComment(state.comments.find((comment) => comment.id === card.dataset.commentId), card);
});

$("#comments").addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest(".comment[data-comment-id]");
  if (!card) return;
  event.preventDefault();
  openExistingComment(state.comments.find((comment) => comment.id === card.dataset.commentId), card);
});

function setCommentsOpen(open) {
  document.body.dataset.comments = open ? "open" : "closed";
  $("#comments-toggle").setAttribute("aria-expanded", String(open));
}

function showLineComments(code) {
  const line = Number(code.dataset.line);
  const comment = state.comments.find((item) => !item.stale && item.file === code.dataset.file &&
    item.side === code.dataset.side && item.startLine <= line && item.endLine >= line);
  setCommentsOpen(true);
  const card = comment && $(`.comment[data-comment-id="${CSS.escape(comment.id)}"]`);
  card?.scrollIntoView({ block: "nearest" });
  card?.focus();
}

$("#files").addEventListener("mousedown", (event) => {
  $("#files").dataset.selectSide = codeNode(event.target)?.dataset.side ?? "";
});

$("#files").addEventListener("click", (event) => {
  const badge = event.target.closest(".badge");
  if (badge && state) showLineComments(badge.closest(".code"));
});

$("#comments-toggle").addEventListener("click", () => setCommentsOpen(document.body.dataset.comments !== "open"));
$("#comments-close").addEventListener("click", () => {
  setCommentsOpen(false);
  $("#comments-toggle").focus();
});
$("#comments-panel").addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  setCommentsOpen(false);
  $("#comments-toggle").focus();
});
$("#previous-file").addEventListener("click", () => stepFile(-1));
$("#next-file").addEventListener("click", () => stepFile(1));

new ResizeObserver(([entry]) => {
  document.documentElement.style.setProperty("--header-height", `${entry.target.offsetHeight}px`);
}).observe($("#topbar"));

$("#file-select").addEventListener("change", (event) => jumpToFile(event.target.value));

let scrollFrame = 0;
addEventListener("scroll", () => {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    $("#file-select").value = currentFileAnchor();
  });
}, { passive: true });

renderNavigation();
fetch("/review.json")
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then((loaded) => {
    state = loaded;
    render();
    setCommentsOpen(state.comments.length > 0 && matchMedia("(min-width: 1100px)").matches);
    $("#save-status").textContent = "Saved";
  })
  .catch((error) => {
    renderDiff();
    $("#save-status").textContent = "Not connected";
    setCommentsOpen(true);
    $("#comments").replaceChildren(element(
      "div",
      "load-error",
      `Comments are unavailable: could not load review.json (${error.message}). ` +
        "Open the 127.0.0.1 URL the launcher printed while it is still running; " +
        `opening review.html directly cannot load or save comments. JSON: ${reviewPath}`,
    ));
  })
  .finally(() => {
    if (location.hash) jumpToFile(decodeURIComponent(location.hash.slice(1)));
  });
