# Artifact review

The review runs inside a claude.ai artifact: the owner comments in claude.ai on a phone or desktop, and the threads live in the artifact, not `review.json`.

1. Build the page:

   ```bash
   node /absolute/path/to/interactive-html-review/scripts/review.mjs \
     --document /absolute/path/to/page.html \
     --artifact /absolute/path/to/build/page.html
   ```

   Done when it prints `Artifact page:` with the built path. The build inlines the overlay and carries only the page title, never local paths. It does not inline the document's relative assets: publish those beside the page, or review a self-contained document.

2. Publish the built file as an artifact with the capabilities `{"comments": {"composer_only": true, "customAnchors": true}, "assets": {}}`. Owning anchoring is what lets taps reach the overlay instead of claude.ai's own comment mode. If the publish refuses `customAnchors`, republish without that key.

3. The owner comments until they say they are done. On a touch screen a mode switch replaces the hold gestures: Text (the default) shows a Comment chip under a selection, Element picks the tapped element with ↑, ↓ and Comment, and Area drags a screenshot box. On desktop the owner selects text, holds ⇧, or ⌘-drags. Each gesture opens claude.ai's own comment composer; an Area capture asks for one more tap on Comment once its screenshot is saved.

4. Read every comment thread with the artifact comments tool, and every screenshot an Area thread names as `Screenshot asset <id>`, fetched by that id. Each thread's anchor detail carries the selected text or element, its nearest heading, and a DOM path.

5. After the document changes, rebuild and republish to the same artifact URL; existing threads stay on the artifact.
