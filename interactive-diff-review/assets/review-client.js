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

function commentCount(file, side, line) {
  if (line === null || !state) return 0;
  return state.comments.filter(
    (comment) => !comment.stale && comment.file === file.path && comment.side === side &&
      comment.startLine <= line && comment.endLine >= line,
  ).length;
}

function renderNavigation() {
  const navigation = $("#file-nav");
  navigation.replaceChildren();
  reviewModel.files.forEach((file, fileIndex) => {
    const link = element("a", "file-link", file.path);
    link.href = `#${internalFileAnchor(file)}`;
    link.append(" ", statsNode(file));
    navigation.append(link);
  });
}

function renderSide(file, fileIndex, side) {
  const section = element("section", "side");
  section.append(element("div", "side-title", `${side === "old" ? "OLD" : "NEW"} · ${side === "old" ? reviewModel.base : reviewModel.candidate}`));
  for (const row of file.rows) {
    const line = side === "old" ? row.oldLine : row.newLine;
    const text = side === "old" ? row.oldText : row.newText;
    const kind = side === "old" ? row.oldKind : row.newKind;
    const count = commentCount(file, side, line);
    const lineNode = element("div", `line ${kind}${count ? " annotated" : ""}`);
    if (line !== null) lineNode.id = internalLineAnchor(file, side, line);
    lineNode.append(element("div", "line-no", line ?? ""));
    const code = element("div", "code", text);
    code.dataset.file = file.path;
    code.dataset.fileIndex = String(fileIndex);
    code.dataset.side = side;
    code.dataset.line = line === null ? "" : String(line);
    code.dataset.kind = kind;
    if (count) code.append(element("span", "badge", String(count)));
    lineNode.append(code);
    section.append(lineNode);
  }
  return section;
}

function renderDiff() {
  const files = $("#files");
  files.replaceChildren();
  reviewModel.files.forEach((file, fileIndex) => {
    const section = element("section", "file-review");
    section.id = internalFileAnchor(file);
    const header = element("div", "file-head");
    header.append(element("span", "", file.path), statsNode(file));
    const diff = element("div", "diff");
    diff.append(renderSide(file, fileIndex, "old"), renderSide(file, fileIndex, "new"));
    section.append(header, diff);
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
  for (const comment of state.comments) {
    const card = element("article", `comment${comment.stale ? " stale" : ""}`);
    card.dataset.commentId = comment.id;
    card.tabIndex = 0;
    const label = element("div", "label");
    label.textContent = `${comment.file}:${comment.startLine}${comment.stale ? " · stale anchor" : ""}`;
    const actions = element("div", "comment-actions");
    actions.append(actionButton("Edit", comment.id), actionButton("Delete", comment.id));
    card.append(
      label,
      element("div", "quote", comment.selectedText),
      element("div", "", comment.comment),
      actions,
    );
    comments.append(card);
  }
  if (state.comments.length === 0) comments.append(element("div", "empty", "No comments yet."));
  $("#comment-count").textContent = String(state.comments.length);
}

function render() {
  renderNavigation();
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
  const nearby = target?.querySelector(".code") ?? fallbackTarget;
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
  if (CSS.highlights) CSS.highlights.set("review-selection", new Highlight(range));
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
$("#save-comment").addEventListener("click", async () => {
  const content = $("#comment-text").value.trim();
  if (!pendingSelection || !content) return;
  if (editingCommentId) {
    const existing = state.comments.find((comment) => comment.id === editingCommentId);
    if (existing) existing.comment = content;
  } else {
    state.comments.push({ id: crypto.randomUUID(), ...pendingSelection, comment: content });
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

fetch("/review.json").then((response) => response.json()).then((loaded) => {
  state = loaded;
  render();
  $("#save-status").textContent = "Saved";
});
