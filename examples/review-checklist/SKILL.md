---
name: review-checklist
description: Review a focused code change for correctness, clear behavior, and regression coverage.
---

# Review a code change

1. Read the intended behavior and identify which users or callers are affected.
2. Follow the changed code through its inputs, outputs, and failure paths.
3. Check edge cases: missing input, malformed input, and partially completed work.
4. Run relevant tests when available. State what you actually verified.
5. Report actionable findings with a concrete reproduction and file location.
6. If no issues are found, say so and describe any remaining validation gaps.

Keep the review focused. Do not invent failures, change unrelated files, or claim tests passed without running them.
