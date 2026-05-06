# Security Specification for Dev AI

## Data Invariants
1. A user can only access their own icon generation history.
2. A user can only access their own regex history.
3. Every history item must have a `user_id` that matches the authenticated user.
4. Timestamps must be validated against the server time.

## Dirty Dozen Payloads (Rejection Tests)
1. Creating icon history for another user.
2. Reading icon history of another user.
3. Updating the `user_id` of an existing history item.
4. Injecting massive strings (> 1MB) as `source_image_path`.
5. Creating regex history with a spoofed `user_id`.
6. Reading regex history without authentication.
7. Deleting another user's regex history item.
8. Updating a history item with missing required fields.
9. Manipulating `created_at` or `timestamp` to be in the future.
10. Listing all generations across all users.
11. Bypassing size limits on text fields.
12. Attempting to update immutable fields (user_id, created_at).
