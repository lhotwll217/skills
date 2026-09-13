const reviewModel = window.__INTERACTIVE_MARKDOWN_REVIEW__.model;
const documentPage = reviewModel.pages[0];
let state;
let pendingSelection = null;
let editingCommentId = null;

const $ = (selector) => document.querySelector(selector);
const composer = $("#composer");
const documentBody = $(".document-body");

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function textOffset(root, container, offset) {
  const before = document.createRange();
  before.selectNodeContents(root);
  before.setEnd(container, offset);
  return before.toString().length;
}

function rangeFromOffsets(root, startOffset, endOffset) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let consumed = 0;
  let start = null;
  let end = null;
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const next = consumed + node.textContent.length;
    if (!start && startOffset >= consumed && startOffset <= next) start = [node, startOffset - consumed];
    if (endOffset >= consumed && endOffset <= next) {
      end = [node, endOffset - consumed];
      break;
    }
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
  $("#save-comment").textContent = "Add Comment";
}

function actionButton(action, commentId) {
  const button = element("button", "link-button", action);
  button.type = "button";
  button.dataset.action = action.toLowerCase();
  button.dataset.id = commentId;
  return button;
}

function commentRange(comment) {
  if (comment.stale || comment.pageId !== documentPage.id) return null;
  return rangeFromOffsets(documentBody, comment.startOffset, comment.endOffset);
}

function renderHighlights() {
  if (!CSS.highlights) return;
  const ranges = state.comments.map(commentRange).filter(Boolean);
  if (ranges.length) CSS.highlights.set("review-comments", new Highlight(...ranges));
  else CSS.highlights.delete("review-comments");
}

function renderComments() {
  const comments = $("#comments");
  comments.replaceChildren();
  for (const comment of state.comments) {
    const card = element("article", `comment${comment.stale ? " stale" : ""}`);
    card.dataset.commentId = comment.id;
    card.tabIndex = 0;
    const label = element("div", "label", `${comment.section}${comment.stale ? " · stale anchor" : ""}`);
    const actions = element("div", "comment-actions");
    actions.append(actionButton("Edit", comment.id), actionButton("Delete", comment.id));
    card.append(label, element("div", "quote", comment.selectedText), element("div", "", comment.comment), actions);
    comments.append(card);
  }
  if (state.comments.length === 0) comments.append(element("div", "empty", "No Comments yet."));
  $("#comment-count").textContent = String(state.comments.length);
  renderHighlights();
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
  renderComments();
}

function openExistingComment(comment, fallbackTarget) {
  if (!comment) return;
  const range = commentRange(comment);
  const nearby = range?.startContainer?.parentElement ?? fallbackTarget;
  if (!nearby) return;
  nearby.scrollIntoView({ behavior: "instant", block: "center" });
  pendingSelection = { ...comment };
  editingCommentId = comment.id;
  $("#comment-text").value = comment.comment;
  $("#composer-title").textContent = "Edit Comment";
  $("#save-comment").textContent = "Save Comment";
  if (range && CSS.highlights) CSS.highlights.set("review-selection", new Highlight(range));
  requestAnimationFrame(() => placeComposer((range ?? nearby).getBoundingClientRect()));
}

documentBody.addEventListener("mouseup", async () => {
  const selection = getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.toString().trim()) return;
  const range = selection.getRangeAt(0).cloneRange();
  if (!documentBody.contains(range.startContainer) || !documentBody.contains(range.endContainer)) return;
  const startOffset = textOffset(documentBody, range.startContainer, range.startOffset);
  const endOffset = textOffset(documentBody, range.endContainer, range.endOffset);
  if (endOffset <= startOffset) return;
  const fullText = documentBody.textContent;
  const selectedText = fullText.slice(startOffset, endOffset);
  if (!selectedText.trim()) return;
  const prefix = fullText.slice(Math.max(0, startOffset - 80), startOffset);
  const suffix = fullText.slice(endOffset, Math.min(fullText.length, endOffset + 80));
  pendingSelection = {
    pageId: documentPage.id,
    section: documentPage.title,
    startOffset,
    endOffset,
    selectedText,
    prefix,
    suffix,
    contentHash: await sha256(`${prefix}${selectedText}${suffix}`),
  };
  editingCommentId = null;
  $("#composer-title").textContent = "Comment on selection";
  $("#save-comment").textContent = "Add Comment";
  if (CSS.highlights) CSS.highlights.set("review-selection", new Highlight(range));
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
  renderComments();
  $("#save-status").textContent = "Saved";
});
