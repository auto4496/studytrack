# Review guide for member B

Review this increment against Issues #1/#2, SRS, F-01/F-03 contracts and actual verification output. This guide is a checklist, not a claim that B has performed review

- [ ] Trace pre-code specs11cdfe5 → red2fc6252 → initial greena13858f and latest source/results
- [ ] Session stored as tokenHash, rotated at login, eight-hour fixed expiry, immediate logout revoke and safe DTOs
- [ ] Origin/CSRF validation for login and authenticated mutations; frontend does not auto-replay a mutation after401
- [ ] Real backend Participant-only goal operations; safe404 cross-owner; Manager cannot inspect private goals through its manager role; B's entry APIs must preserve this policy
- [ ] Goal snapshot/date/target validation, goal+initial version atomicity and database partial unique ACTIVE protection under concurrent requests
- [ ] Applied migrations are immutable and test database is isolated (including loopback aliases)
- [ ] Goal UI loading/empty/error/retry, correct date display, keyboard-labelled fields, desktop/mobile evidence
- [ ] Adopt/extend read-only template adapter without duplicate route mounts; add B manager-create and entry/progress scope and associated tests
- [ ] Read actual test assertions and rerun meaningful subset/fresh setup independently; do not use Codex PASS as substitute for your own review
- [ ] Record a concrete finding/question/check/reason in the PR review, then integrate to sprint staging only when required checks and review are satisfied

Approval, findings, reviewer identity and date must come from actual B review. Do not check boxes on behalf of B
