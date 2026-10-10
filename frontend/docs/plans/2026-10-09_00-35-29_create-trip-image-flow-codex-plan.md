# Create-trip Image Upload and AI Response UI — Codex Implementation Plan

> **For agentic workers:** Follow `frontend/AGENTS.md`. The user explicitly assigned this frontend implementation to Codex. Execute unblocked Frontend tasks in this worktree; Backend owns its API implementation and final request/response/SSE contracts. Do not integrate, push, or deploy without a separate request.

> **Execution status (2026-10-09):** Cloudinary unsigned upload service, image validation/lifecycle, response-driven DNA UI, and requested registration/create-trip UI adjustments are implemented in `codex/create-trip-sse-ui`. A final review pass found no code blocker. The 12 original API cases and 4 lifecycle/reset cases passed; temporary scripts were removed, and the expected-red lifecycle case was logged in `frontend/fallure.md`. TypeScript passed for 234 files after the account/DNA fixes, and a strict isolated check passed for the final session helper; a final full rerun was blocked because the isolated worktree has no dependencies installed and dependency reuse is denied by the environment. ESLint passed on all 19 changed source files, with only environment-related React autodetect and pages-path warnings. `git diff --check` passes. Trip creation with uploaded images/extended fields remains blocked by the missing Backend request/SSE contract. Production build could not complete because the sandbox could not reach Google Fonts; rendered Playwright review was not verified.

**Goal:** Let users attach up to three supported inspiration images, upload them directly from the browser to the configured unsigned Cloudinary preset, inspect and adjust API-returned trip DNA through reusable UI, and submit the confirmed trip inputs to the Backend streaming flow when its contract is available.

**Architecture:** Keep attachment state and client validation in the existing create-trip controller. Put Cloudinary configuration and the third-party upload service in focused config/service/schema files; retain Cloudinary `public_id` only for local UI state and send public URLs to VISTRA APIs. Render DNA through a reusable data-driven panel with no fixed demo metrics. Call the Backend using `NEXT_PUBLIC_API_URL` plus endpoint constants, the shared client, domain service, and runtime schema; do not guess trip-create fields or SSE event names.

**Tech Stack:** Existing Next.js 16 / React 19 / TypeScript app, browser `File`, `FormData`, object URLs and `fetch`, existing VISTRA component patterns, shared API client and Playwright MCP. No new dependencies.

**Spec:** User decisions in this conversation; prior workflow in `frontend/docs/plans/2026-10-08_23-18-54_create-trip-image-upload-sse-implementation-plan.md`; API layering in `frontend/docs/guides/api-integration-login-walkthrough.md`; visual direction in `frontend/docs/guides/vistra-ui-ux-design-system.md` and `frontend/docs/guides/source_faithful_visual_style_guide.md`.

## Global Constraints

- Treat all Cloudinary values mentioned in chat as examples only. Store no values from chat in code, docs, screenshots, logs, or test fixtures.
- Read only `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` in browser code; never expose an API key or API secret. The folder is configured in the Cloudinary preset, not assumed from a chat value.
- Accept only JPEG/JPG (`image/jpeg`) and PNG (`image/png`). Reject a file larger than `5 * 1024 * 1024` bytes before making any network request; exactly 5 MiB is allowed.
- The current draft may contain at most three attachments total, counting queued, uploading, uploaded, and failed items. If a new selection would exceed the limit, reject that selection before uploading any of its files; preserve existing attachments.
- A successful Cloudinary response contributes one local attachment `{ publicId, secureUrl }`. Only `secureUrl` values may be sent to VISTRA APIs; never send `File`, object URLs, base64, or Cloudinary metadata.
- Every successful image upload triggers DNA analysis with the current list of successfully uploaded image URLs. Ignore stale analysis responses. Removing an uploaded image removes its URL and reanalyzes the remaining URLs; removing the last image clears the DNA result locally without sending an invalid empty-image analysis request. Cloudinary cleanup is deferred for MVP.
- DNA displayed in the product comes from Backend responses. Do not seed the panel with the current five demo values or claim that client-side code analyzed an image. The existing `/api/v1/dna/analyze` response exposes `derived_dna.metrics`; the current Backend implementation returns an empty list until its vision/model work is ready, so the UI shows an honest empty state.
- Submit trip creation only from the explicit **Tạo chuyến đi** action. Include all current form inputs and image URLs when the Backend request contract is available. Do not call the existing narrower trip-create request while silently omitting visible inputs.
- After a valid stream completion response, navigate to `/planner?trip_id=<id>`. Do not invent endpoint names, request properties, event names, or a terminal payload.
- Existing style tokens, component patterns, accessibility, responsive behavior, and unrelated user changes must be preserved. Do not push or deploy. The user authorized local merge into `BinhNT` if review finds no errors; commit and merge only the reviewed feature changes.
- For Playwright MCP evidence, create a new timestamped `frontend/docs/evidence/playwright/<timestamp>/` folder with `run-info.md`; use explicit screenshot names and `scale: "css"`. Do not use terminal commands to perform browser/UI tests or capture evidence.
- If temporary API test scripts are needed, put them only under `frontend/.api-test-tmp/<task-id>/`; delete them after every case passes. If any case fails, append its command, case, expected/actual, and error to `frontend/fallure.md`, keep the reproducer, and report the blocker.

## Review Focus

- A 5 MiB file uploads, while a 5 MiB + 1 byte file is rejected before Cloudinary or Backend requests.
- Unsupported MIME types and a fourth attachment are rejected without disturbing valid existing attachments.
- Upload failure remains visible and retryable; a failed or pending image is never included in `image_urls`.
- Removing an image revokes its local object URL, invalidates stale DNA, and excludes the removed Cloudinary URL from later requests.
- An older DNA response cannot overwrite a result for a newer URL list.
- Missing Cloudinary environment variables fail clearly without falling back to the frontend origin or a hard-coded account.
- Backend DNA and SSE contracts remain unresolved until Backend supplies their actual schemas; the UI must not present fabricated values or success.

## File Map

- `frontend/src/config/cloudinaryConfig.ts`: read and validate the two public Cloudinary environment variables; expose a safe configuration result.
- `frontend/src/constants/externalEndpoints.ts`: centralize the Cloudinary upload URL builder.
- `frontend/src/types/cloudinaryUpload.ts` and `frontend/src/schemas/cloudinaryUploadSchema.ts`: provider response contract and runtime validation.
- `frontend/src/services/cloudinaryUploadService.ts`: unsigned direct browser upload; no Backend credentials or UI code.
- `frontend/src/components/create-trip/types.ts`: local attachment state and reusable DNA presentation types.
- `frontend/src/components/create-trip/useCreateTripController.ts`: size/type/count validation, upload/retry/remove state, URL ownership, and stale DNA request protection.
- `frontend/src/components/create-trip/TravelDnaPanel.tsx`: reusable, data-driven DNA display/edit component with empty/loading/error/success states.
- `frontend/src/components/create-trip/CreateTripComposer.tsx`: attachment action, supported format copy, per-image upload state and retry/remove controls.
- `frontend/src/components/create-trip/CreateTripScreen.tsx`: render the reusable DNA panel; remove demo DNA values and stale “Chưa gửi API” copy.
- `frontend/docs/guides/cloudinary-image-upload-setup.md`: setup instructions with placeholders only.
- `frontend/.env.example`: public variable names with empty values only, if the file does not already exist.

## Tasks

### Task CT-IMG-01: Add configurable unsigned Cloudinary upload service — Done

**Files:** create the Cloudinary config, endpoint constant, upload type/schema, and upload service listed above; create/update `.env.example`; add the setup guide.

- [x] Define public environment variable names only; no account values from chat.
- [x] Build the Cloudinary endpoint from configured `cloud_name` and `/image/upload`.
- [x] Send `file` and `upload_preset` as `FormData`; rely on the unsigned preset to route to its configured folder.
- [x] Runtime-validate `public_id` and HTTPS `secure_url`; return only the normalized provider result.
- [x] Surface provider/network/config errors as actionable messages without logging files, credentials, or full sensitive response bodies.
- [x] Document how to configure the unsigned preset, target folder, allowed formats, local `.env.local`, and production environment; make clear the preset is public and the 5 MiB limit is also validated by Frontend.
- [x] Verify direct upload service boundary behavior with temporary API tests (8 cases passed); temporary scripts removed after passing.

### Task CT-IMG-02: Validate, upload, and manage attachment lifecycle — Done; rendered UI not verified

**Files:** `useCreateTripController.ts`, `types.ts`, `CreateTripComposer.tsx`.

- [x] Validate exact supported MIME types, per-file size, and three-attachment cap before upload.
- [x] Show pending/uploading/uploaded/failed state for each image; retry failed uploads and allow removal at every state.
- [x] Store local preview URL plus uploaded `publicId`/`secureUrl`; revoke local object URLs on removal and unmount.
- [x] Prevent the current narrower trip request from silently dropping attached images or other entered fields.
- [x] Trigger DNA analysis after each successful upload using the successful URL list and after removing an uploaded image when URLs remain; latest request wins. Use the existing endpoint through the configured Backend URL, shared client, and runtime schema.
- [x] Abort only the removed attachment's pending Cloudinary request; stale responses cannot restore a removed attachment or mark it failed.
- [x] Invalidate active uploads, previews, and DNA work on account change/unmount so late results cannot cross account sessions.

### Task CT-DNA-01: Replace fixed demo DNA controls with reusable response-driven UI — Implemented, live model output pending Backend

**Files:** create `TravelDnaPanel.tsx`; update `types.ts`, `useCreateTripController.ts`, and `CreateTripScreen.tsx`.

- [x] Define a UI-only metric view model for dynamic metrics and accessible controls; do not present it as the Backend wire schema.
- [x] Render the API-provided metric collection, loading/error/empty states, and trip-local user adjustments.
- [x] Remove fixed five-axis values and claims that the current UI itself performs analysis.
- [x] Preserve changes as trip-local presentation state; never write profile DNA from `/create-trip`.
- [x] Parse the currently documented `analysis_id`, `status`, `derived_dna.metrics`, and `confidence` response. Backend model output remains pending because its current response contains no metrics.
- [x] Reset edited metrics to a clone of the latest API response without making an extra DNA API call.

### Task CT-TRIP-01: Prepare the create-trip stream UI and integration boundary — Blocked by Backend

**Files:** only the existing create-trip controller, screen, types, endpoint and service files if the Backend contract is confirmed.

- [ ] Keep **Tạo chuyến đi** as the sole trigger for trip creation; upload and DNA analysis never create a trip.
- [ ] Prepare UI states for streaming assistant text, completion, retryable error, cancellation, and returned draft trip.
- [ ] Do not call the current JSON endpoint with an incomplete subset of visible fields.
- [ ] Mark request serialization and SSE service **Blocked by Backend** until the actual endpoint, accepted field schema, event format, and terminal `trip_id` are supplied.
- [ ] On the confirmed completion payload, route to `/planner?trip_id=<id>`.

### Task CT-UI-01: Finish the previously requested `/register` and `/create-trip` UI fixes — Done

**Files:** registration screen/controller/shared Toast only if needed; create-trip composer and screen.

- [x] `/register`: remove the persistent password rules panel; on invalid password show the exact notification copy from the user request while keeping validation and submit blocking.
- [x] `/create-trip`: remove “Chưa gửi API” notes; keep allergies as an accessible multi-select with multiple custom values; keep fitness as the shared single-select control.
- [x] Review and preserve the existing uncommitted UI changes in this task worktree.

### Task CT-VERIFY-01: Verify Frontend behavior and report Backend dependencies — Partially verified

**Files:** timestamped Playwright evidence, `run-info.md`, and a concise implementation status report if needed.

- [ ] Verify validation boundaries, count during upload, retry/remove, preview, URL-only payload, stale DNA response handling, no trip call before explicit submit, responsive behavior, and accessibility using Playwright MCP. **Not verified:** no usable local app/browser session was available; no screenshots were captured.
- [x] Temporary API tests: 16 cases passed across two runs (12 upload/DNA/validation + 4 account/session/reset); scripts removed after passing. The expected-red lifecycle case and resolution are recorded in `frontend/fallure.md`.
- [x] TypeScript check: 234 files, 0 diagnostics after account/DNA fixes; strict isolated type-check of the final upload-session helper also passed. A full final rerun was unavailable because the worktree lacks dependencies.
- [x] ESLint: all 19 changed `.ts`/`.tsx` files passed; the borrowed project config emitted only React autodetect and pages-path warnings because the isolated worktree is outside its base path.
- [ ] Production build: attempted, but blocked while `next/font` fetched Google Fonts (`fonts.googleapis.com` unavailable in the restricted environment); build success is **Not verified**.
- [x] `git diff --check` and two independent read-only final reviews passed; no Cloudinary/lifecycle code blocker found. Do not claim DNA model output or SSE end-to-end success until Backend supplies the remaining contract/data.

## Backend Gates

- **DNA model output:** The endpoint and current response shape are available and connected. Backend still needs to return real metrics; until then Frontend presents the API's empty state and does not synthesize DNA values.
- **Trip/SSE:** Backend must publish the create-and-stream endpoint, full accepted inputs (including the supported image/DNA reference fields), event framing, cancellation/error semantics, and terminal response containing `trip_id` plus the draft trip. Until then `/create-trip` blocks submission when visible values would be omitted by the narrower current request.
- **URL/security policy:** Backend owns validation of public Cloudinary URLs, downloaded content type/size, and allowed host. Frontend sends only the URLs it receives from Cloudinary.

## Out of Scope

- Backend implementation, endpoint decisions, model/DNA inference, image URL download, or Backend security policy.
- Cloudinary API key/secret, signed upload endpoints, image transformation/compression, automatic cleanup of removed/orphaned assets, and profile DNA persistence.
- Changes to unrelated routes, designs, or shared API behavior beyond the required create-trip boundary.
- Commit, merge, push, deployment, or inserting the sample values from chat into any file.
