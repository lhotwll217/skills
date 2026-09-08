import assert from "node:assert/strict";
import test from "node:test";

import { generateReviewHtml, htmlModel, minimalComment, reconcileState } from "./review.mjs";

function elementAnchor() {
  return {
    version: 1,
    label: "<button#save> “Save”",
    rect: { x: 20, y: 30, w: 100, h: 40 },
    route: [{
      kind: "element",
      selectors: [
        { value: "#save", kind: "id", positional: false, count: 1 },
        { value: "html > body > button", kind: "structural", positional: true, count: 1 },
      ],
      fingerprint: {
        tag: "button",
        attributes: { id: "save" },
        text: "Save",
        parent: { tag: "body", attributes: {}, text: "Save" },
        previous: null,
        next: null,
      },
    }],
  };
}

function elementComment(overrides = {}) {
  return {
    id: "comment-1",
    pageId: "document",
    section: "Fixture",
    startOffset: 0,
    endOffset: 0,
    selectedText: "",
    prefix: "",
    suffix: "",
    contentHash: "",
    comment: "Make this more prominent.",
    element: elementAnchor(),
    elementStatus: "resolved",
    ...overrides,
  };
}

test("element comments accept zero text offsets and preserve the compound anchor", () => {
  const clean = minimalComment(elementComment());
  assert.equal(clean.element.label, "<button#save> “Save”");
  assert.equal(clean.element.route[0].selectors[0].value, "#save");
  assert.deepEqual(clean.element.route[0].fingerprint.attributes, { id: "save" });
  assert.equal(clean.elementStatus, "resolved");
});

test("zero-length comments still require a screenshot or element reference", () => {
  const comment = elementComment();
  delete comment.element;
  assert.throws(() => minimalComment(comment), /ascending order/);
});

test("source changes request element re-resolution without rewriting the captured anchor", () => {
  const previousModel = htmlModel("/tmp/fixture.html", "<title>Fixture</title><button id=save>Save</button>");
  const currentModel = htmlModel("/tmp/fixture.html", "<title>Fixture</title><main><button id=save>Save</button></main>");
  const originalAnchor = elementAnchor();
  const state = reconcileState({
    review: { ...previousModel, createdAt: "2026-09-03T00:00:00.000Z" },
    comments: [elementComment({ element: originalAnchor })],
  }, currentModel, "2026-09-03T01:00:00.000Z");
  assert.equal(state.comments[0].needsElementRelocation, true);
  assert.deepEqual(state.comments[0].element, originalAnchor);
  assert.equal(state.review.sourceHash, currentModel.sourceHash);
});

test("the injected overlay presents Shift as a hold gesture rather than a toggle", async () => {
  const model = htmlModel("/tmp/fixture.html", "<title>Fixture</title><body>Hi</body>");
  const html = await generateReviewHtml({ model, documentHtml: "<html><body>Hi</body></html>", reviewPath: "/tmp/review.json" });
  assert.match(html, /Hold <kbd>⇧<\/kbd> to select/);
  assert.match(html, /event\.key === "Shift"/);
  assert.match(html, /addEventListener\("keyup"/);
  assert.doesNotMatch(html, /Shift\+E|⇧E|aria-pressed/);
});

test("element routes fail closed when their boundary sequence is malformed", () => {
  const comment = elementComment();
  comment.element.route.push(elementAnchor().route[0]);
  assert.throws(() => minimalComment(comment), /explicit boundary|alternate/);
});
