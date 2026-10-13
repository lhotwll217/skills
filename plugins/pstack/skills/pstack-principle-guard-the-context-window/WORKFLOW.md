Read [pstack portability and capability checks](../pstack/README.md) before following this workflow. Owner and harness policy governs every step.

# Guard the Context Window

**Why:** Context overflow degrades reasoning quality, creates compression artifacts, and halts progress.

**Pattern:**
- **Size phases and cap scope.** Limit files per phase, set turn budgets, account for mechanism costs.
