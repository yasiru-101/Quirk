# 3. Self-service registration, email verification, and login 2FA

- Status: Accepted
- Date: 2026-06-23

## Context

The system previously created users only through an administrator. A SaaS product
needs self-service registration, and a security-conscious one needs to confirm that
a registrant controls the email address and to offer a second authentication factor.

## Decision

Add three identity flows, all built on a single one-time-code primitive.

**One-time codes (`OtpCode`)**
- Six numeric digits generated with a cryptographically secure RNG.
- Stored only as a bcrypt hash; the plaintext exists only in the delivered email.
- Single-use, expire after 10 minutes, and are rejected after 5 failed attempts.
- Issuing a new code invalidates any earlier unconsumed code for the same purpose.

**Registration + email verification**
- `POST /auth/register` creates an account with `emailVerified = false` and emails an
  `EMAIL_VERIFY` code. No session is issued yet.
- `POST /auth/verify-email` consumes the code, sets `emailVerified = true`, and issues
  the session.
- Login is blocked for unverified accounts (a fresh code is sent).
- `emailVerified` defaults to `true` at the column level so administrator-created and
  pre-existing accounts remain trusted; only registration sets it `false`.

**Login 2FA (opt-in)**
- When `twoFactorEnabled` is set, a correct password does not issue a session. Instead
  the server emails a `LOGIN_2FA` code and returns a short-lived, signed *pending
  token* that encodes the user id and a `2fa_pending` purpose.
- `POST /auth/verify-2fa` requires both the pending token and the code, binding the
  second factor to the same login attempt so a code alone cannot authenticate.
- 2FA is enabled via `enable` (sends a code) then `confirm` (verifies it), and disabled
  with the current password.

**Abuse resistance**
- Registration, verification, resend, and 2FA endpoints are IP rate-limited in addition
  to the per-code attempt cap.
- Resend responds identically whether or not the account exists, to avoid email
  enumeration.

## Consequences

- Administrator onboarding (temporary password + forced reset) and self-service
  registration coexist.
- Email delivery uses the existing provider abstraction (Azure ACS, Ethereal in dev).
- Both factors depend on email delivery; an authenticator-app TOTP factor could be
  layered on later using the same `OtpCode` verification shape.
