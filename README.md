# beeghee-mx-astro

Astro static site for Beeghee Mexico (Spanish).

**Production:** https://mx.beeghee.energy
**Hosting:** Coolify on Anabasis Production (`5.78.205.135`)

## Backends — two distinct, do not conflate

**Lovable Supabase** (forms, chat, voice agent):
- **Project ref:** `nqskllzyphlhmuhzpcdy` — https://supabase.com/dashboard/project/nqskllzyphlhmuhzpcdy
- **Edge functions used:**
  - `klaviyo-subscribe` — newsletter / lead capture (`LeadForm.tsx`)
  - `mx-chatbot` — LLM chat (`ChatWidget.tsx`)
  - `mx-elevenlabs-token` — voice agent signed URL (`ChatWidget.tsx`)
- URL + anon key are hardcoded in `LeadForm.tsx` and `ChatWidget.tsx` (with env-var fallback).
- CORS on the Supabase project is wildcard `*` (Lovable default).

**Sveltia CMS** (content editing at `/admin/`):
- Cloudflare Worker OAuth proxy backs the GitHub-driven editing flow. See `reference_sveltia_cms_init.md` in auto-memory.

## Commands

| Command | Action |
| :- | :- |
| `npm install --legacy-peer-deps` | Install |
| `npm run dev` | Dev server |
| `npm run build` | Static build to `./dist/` |
