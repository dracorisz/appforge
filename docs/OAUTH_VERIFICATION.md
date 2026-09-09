# AppForge OAuth verification boundaries

This document records the production OAuth/data-access boundary used for AppForge verification and future publishing work.

## Current production Google OAuth

Current Google OAuth is used only for AppForge authentication through Supabase Auth.

Minimum requested identity scopes:

- `openid`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

These scopes establish the signed-in Google identity and provide the basic email/profile information required to associate the session with the correct AppForge account and display the signed-in identity.

AppForge does not need Gmail, Drive, Calendar, private YouTube data or YouTube channel-management OAuth scopes for the current authentication flow.

Production site: `https://www.sstoken.space/`

Current OAuth verification demo: `https://www.youtube.com/watch?v=tWnZNkPxlOo`

Google Cloud project: `wild-dragons`

## YouTube Data API ingestion

Scrapper Pro currently reads public YouTube channel/video metadata with a server-side YouTube Data API v3 key (`YOUTUBE_API_KEY`). This is intentionally separate from user OAuth.

The public-data ingestion path must not add `youtube.readonly`, `youtube.upload`, `youtube.force-ssl` or full YouTube account scopes merely because the YouTube Data API is enabled. OAuth scopes should be requested only when a production user-facing feature actually requires delegated access to that user's YouTube account.

## Future YouTube publishing

The planned Marketing Publisher (#34) is a separate delegated-user workflow. When upload functionality is implemented, request the narrowest scope supported by the exact API methods used. For a video-upload-only flow, prefer `https://www.googleapis.com/auth/youtube.upload` over broad YouTube account access.

Before adding a new YouTube OAuth scope:

1. implement the feature behind an explicit user action;
2. identify the exact YouTube API methods used;
3. verify a narrower scope cannot support those methods;
4. update Privacy/Terms documentation if data handling changes;
5. record storage/retention/revocation behavior for delegated tokens;
6. update the Google OAuth verification justification;
7. record a verification video showing the consent screen and the actual scope-dependent workflow.

Do not request future scopes preemptively.

## GitHub OAuth

GitHub sign-in is also delegated through Supabase Auth and must keep the GitHub client secret in provider/server configuration. AppForge profile visibility remains authoritative; provider profile metadata is not automatically public.

## Verification checklist

- Production branding uses **AppForge**.
- Home page is `https://www.sstoken.space/`.
- Privacy and Terms routes are publicly accessible.
- `sstoken.space` is the production domain.
- Requested Google scopes match implemented production behavior.
- Scope justification explains each scope, the feature using it and why less access is insufficient.
- Demo video shows the actual OAuth flow and scope-dependent behavior.
- Server/API secrets are never stored in `VITE_*` variables or committed to the repository.
