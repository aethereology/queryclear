# Audit retry recovery

Public and owner forms now attach a random UUID attempt ID and retain it during retries of the same entered URL. An immediate in-flight guard prevents duplicate form events before React updates the disabled state. Successful runs clear the ID so an intentional new scan starts a fresh attempt. IDs are held only in component memory: reloads, new tabs and caller IP changes are outside this recovery guarantee.

After URL validation and the existing IP request limit, the API uses a SHA-256 key scoped to caller IP, normalized URL and attempt ID. Redis SET NX creates a 120-second lease. Competing requests get 409 plus Retry-After rather than invoking the model. A successful attempt stores only the existing report token for up to ten minutes, capped by the configured report TTL. Retrying returns its existing summary without another spend reservation or model call. Reports retain their original expiry and bearer-token access semantics.

Atomic Lua compares the lease owner before completing or releasing an attempt. This prevents an old request from changing a newer lease. Known pre-work failures release the lease; ambiguous timeouts retain both the existing spend reservation and short lease. Once that lease expires a retry may start new paid work. This is bounded retry recovery, not a durable job queue or exactly-once execution guarantee. Requests without an attempt ID remain compatible with the previous API.

Retries still count toward the existing per-IP request limit, and all new work retains global budget gates. No automatic retry loop, secret, service subscription, email send or paid scheduled probe was added. Owner history deduplicates recovered report tokens and uses the recorded audit time where available.

CI runs real Redis integration tests using an ephemeral service container, in addition to route/unit tests and browser retries. Production verification should submit one controlled audit and replay the same attempt from the same caller, confirming identical report tokens and a recovered response; no additional model call is needed for the replay.
