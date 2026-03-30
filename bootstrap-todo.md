# Bootstrap TODO

Current project TODOs (tracked):

- [x] Gather detailed requirements — Clarify platforms, auth choice, DB preference, video hosting, AI model and constraints, scale and compliance.
- [x] Choose tech stack & architecture — Next.js PWA, Cloudflare Workers, Neon Postgres, Neon Auth, YouTube, model-agnostic AI adapter.
- [ ] Design data model & API spec — Create schemas for users, workouts, sessions, exercises, feedback, progress metrics; design API endpoints.
- [ ] Auth integration — Integrate Neon Auth and secure APIs.
- [ ] Backend scaffold & DB connectors — Cloudflare Workers endpoints, Neon connector, migrations.
- [ ] Frontend scaffold & UI — Next.js mobile-first UI, onboarding, session player, timers, feedback dialogs.
- [ ] Workout generation & personalization AI — Implement planner algorithm and adapter for different models.
- [ ] Exercise player & video integration — YouTube embeds, countdown/timers, completion reporting.
- [ ] Progress tracking & charts — store session data and show progress metrics.
- [ ] Testing, CI/CD & deployment — add tests and Cloudflare deployment pipeline.
- [ ] Documentation & README — developer and user docs.
- [x] Create architecture diagram — produced and added to `technical-overview.md`.
- [x] Write technical-overview.md — added architecture + mermaid diagrams.
- [x] Write bootstrap-todo.md — this file.

Next immediate steps:
- Draft DB schema (SQL) and OpenAPI spec for the API endpoints.
- Scaffold Next.js + Cloudflare Workers repo with Neon Auth stub.
