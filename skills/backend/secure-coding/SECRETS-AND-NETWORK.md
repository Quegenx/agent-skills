# Secrets at rest and private networking

## Encrypting a field

For values the application must read back (third-party API keys, OAuth refresh tokens, TOTP secrets), encrypt them before they reach the database. Values it only needs to check (passwords, recovery codes, your own API keys) are hashed instead ([AUTH.md](AUTH.md)).

**Symmetric or asymmetric:** data that only your application writes and reads uses symmetric encryption (one key, fast). Asymmetric keys (RSA, elliptic curves) are for parties that don't share a secret: TLS, signatures, encrypting to someone else's public key.

Use **authenticated encryption** (AES-256-GCM): it detects a modified ciphertext instead of decrypting it into garbage, which plain AES-CBC does not. A fresh random nonce for every encryption; never reuse a nonce with the same key.

```ts
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = 1;                                      // which key encrypted this value, for rotation

export function encryptField(plaintext: string, key: Buffer, aad: string): string {
  const iv = randomBytes(12);                           // 96-bit nonce, new every time
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(aad));                      // binds the ciphertext to its row, e.g. `user:${id}:totp`
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [VERSION, iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(".");
}

export function decryptField(stored: string, keys: Map<number, Buffer>, aad: string): string {
  const [v, iv, tag, data] = stored.split(".");
  const key = keys.get(Number(v));
  if (!key) throw new Error("CRYPTO_UNKNOWN_KEY_VERSION");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");   // throws if tampered
}
```

- **The key lives elsewhere:** a key management service (AWS KMS, Google Cloud KMS, Azure Key Vault, HashiCorp Vault) or at least a secret store injected as an environment variable; never in the repository, the image or the same database as the data. With a KMS, the usual pattern is envelope encryption: a data key encrypts the field, and the KMS encrypts the data key.
- **Version every ciphertext** with its key ID, keep old keys for decryption, encrypt new values with the current key, and re-encrypt old rows in the background; then retire the old key.
- **Associated data** ties a ciphertext to its context, so a value copied from one user's row to another's fails to decrypt.
- **Failures say little:** log "decryption failed" with the key version and row ID, never the key, plaintext or ciphertext details, and return a generic error.
- **Supabase:** Vault stores secrets encrypted in the database for use from SQL; for field encryption in application tables, encrypt in the server code with a key from the environment.

## Keep internal services off the internet

A database, queue, admin panel or metrics dashboard with a public port is scanned around the clock. The default should be: **a public hostname is something a service earns**, only when an outside party must reach it. Usually that's one reverse proxy on 80 and 443.

- **Private mesh networks** (Tailscale or plain WireGuard) connect your machines with encrypted tunnels. Tailscale prefers direct connections and can fall back to a peer relay or DERP relay; relayed traffic remains WireGuard encrypted end to end. The source and old line said traffic always went directly between machines with no server in the data path. Tailscale's coordination server exchanges keys and connection information; it is distinct from the relays. Confirm SSH works over the private network, then remove public port 22. https://tailscale.com/docs/reference/connection-types and https://tailscale.com/docs/reference/derp-servers [milan-jovanovic, security-and-multitenancy/build-your-own-vpn-with-tailscale.md]
- **Docker publishes to every interface by default.** `ports: ["5432:5432"]` binds `0.0.0.0` and bypasses some host firewalls; publish internal services on the private address only (`"100.64.0.3:5432:5432"`), or not at all when only containers on the same network need them.
- **Private is not authenticated.** Inside the network, services still need credentials, least-privilege database roles and patched software; device enrollment and the mesh's access rules become part of the trust boundary.
- **TLS inside an encrypted mesh** is optional for internal hops (WireGuard already encrypts); anything reached over the public internet needs TLS.
- Managed platforms offer the same idea as private networking between services (VPC peering, private service networks); use them before exposing a managed database publicly with only a password in front.
