# Conversation and ongoing browser tasks

The browser channel distinguishes conversation, a fresh read, execution, continuation and cancellation. A user can discuss options while the agent awaits a parameter, answer briefly and continue the original request without repeating it. Ordinary reversible steps within the request do not require another consent question.

The frontend and build evaluation use the same `runBrowserConversation` engine. It retains the original goal, chronological user amendments, pending question and bounded execution receipts across messages. Actual browser state remains authoritative; requested values and assistant claims are not execution evidence. A new task discards prior task evidence. Pairing again preserves the goal but invalidates old browser evidence. Unknown execution results retain the pending job and are never retried automatically. Stale observations permit at most two fresh reads; repeated ineffective clicks stop the task.

The session is held in the current page's memory. It does not survive refresh/closing the page and is not a database-backed long-term memory. Pairing tokens are never part of the task state or model requests. Receipts carry requested input already present in the conversation, never raw field values, cookies or storage. Instruction limits fail explicitly; bounded receipt history marks evidence as limited when old receipts are dropped.

## Tested conversational boundaries

- Missing height → unrelated DKR/DKL explanation → short height answer resumes the original goal, even without the old 12-message chat history.
- Width correction without repeating customer, height, colour and opening.
- Asking what is currently visible performs a fresh read without clicking; a manual operator edit overrides stale execution evidence.
- Analysis/calculation answers without touching the browser or discarding the task.
- Cancellation clears the task; a new request starts cleanly.
- “Can you set…” starts ordinary requested work rather than asking whether to start.
- An answer selecting one of two similar customers resumes the pending request.

The Vercel gate calls the actual built turn/planner routes with the real configured model and uses the exact frontend orchestration engine. Browser transitions remain synthetic. The separate Windows Chromium fixture suite checks executor capabilities. Neither gate claims a combined unattended model-to-Windows run.

This increment improves the browser channel. Existing native Paint and desktop file tools remain separate modes; it does not add universal control over arbitrary Windows applications, WindowHub quoting or supplier prices.

Browser interpretation/planning uses its dedicated `NAVIMIND_BROWSER_MODEL` setting, default `gpt-5.4` (low reasoning for UI steps), independently of the lightweight general chat setting. Both real-model gates include this setting in their cache keys. This increases inference cost relative to the old mini planner; model calls stay bounded by the turn and action limits.

Before surfacing a proposed question or manual stop, the planner reviews whether the answer was already supplied or can be obtained from the current page. A final fresh observation is required before accepting completion or a question; a changed revision triggers replanning.

Skipping an already verified input requires `verified_input_revision` from the Windows bridge, matching the exact snapshot revision. The bridge rechecks the captured field value after the initial action readback, without publishing it. A change during capture produces a review result, never STALE_PAGE (which would permit a retry before execution). Ambiguous field descriptions receive no current-view proof. Older bridges remain compatible but cannot enable this deduplication proof; update the existing executor branch for that feature.
