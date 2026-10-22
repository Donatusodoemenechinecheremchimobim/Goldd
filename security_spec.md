# Golden Mind Psychiatry PLLC — Firestore Security Specification

## 1. Authentication & Roles
- **Patients**: Authenticated users (`request.auth != null`) who access their own records where `patientId == request.auth.uid` (or `/users/{userId}` where `userId == request.auth.uid`).
- **Providers / Admins**: Verified provider accounts where either:
  - `request.auth.token.email == 'chibundusadiq@gmail.com' && request.auth.token.email_verified == true`
  - Or a document exists at `/databases/$(database)/documents/admins/$(request.auth.uid)`

## 2. Collection Access Matrix
- `/users/{userId}`:
  - `read`: Owner (`request.auth.uid == userId`) or `isAdmin()`.
  - `create`, `update`: Owner (`request.auth.uid == userId`) or `isAdmin()`, with schema validation (`uid`, `email`, `fullName`, `role`, `onboardingCompleted`, `createdAt`, `updatedAt`).
  - `delete`: `isAdmin()`.
- `/admins/{adminId}`:
  - `read`: Authenticated user checking their own admin status (`request.auth.uid == adminId`) or `isAdmin()`.
  - `create`, `update`: Authenticated user activating provider mode for their own UID or `isAdmin()`.
  - `delete`: `isAdmin()`.
- `/appointments/{appointmentId}`:
  - `create`: Authenticated user creating for themselves (`patientId == request.auth.uid`), `isAdmin()`, or public guest booking (`patientId == 'guest'`) with strict field & string-length validation.
  - `read`: Owner (`resource.data.patientId == request.auth.uid`), authenticated user claiming a guest booking matching their email (`resource.data.patientId == 'guest' && resource.data.patientEmail == request.auth.token.email`), or `isAdmin()`.
  - `update`: Owner (`resource.data.patientId == request.auth.uid`), authenticated user linking their guest booking (`resource.data.patientId == 'guest' && request.resource.data.patientId == request.auth.uid`), or `isAdmin()`.
  - `delete`: `isAdmin()`.
- `/intakes/{intakeId}`:
  - `read`, `create`, `update`: Owner (`patientId == request.auth.uid`) or `isAdmin()`.
  - `delete`: `isAdmin()`.
- `/assessments/{assessmentId}`:
  - `read`, `create`, `update`: Owner (`patientId == request.auth.uid`) or `isAdmin()`.
  - `delete`: `isAdmin()`.
- `/medications/{medicationId}`:
  - `read`, `create`, `update`: Owner (`patientId == request.auth.uid`) or `isAdmin()`.
  - `delete`: `isAdmin()`.
- `/messages/{messageId}`:
  - `read`, `create`, `update`: Owner (`patientId == request.auth.uid`) or `isAdmin()`.
  - `delete`: `isAdmin()`.
- `/invoices/{invoiceId}`:
  - `read`, `create`, `update`: Owner (`patientId == request.auth.uid`) or `isAdmin()`.
  - `delete`: `isAdmin()`.
