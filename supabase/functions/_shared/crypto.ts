import { required } from "./core.ts";
async function key() {
  const raw = Uint8Array.from(
    atob(required("TOKEN_ENCRYPTION_KEY")),
    (c) => c.charCodeAt(0),
  );
  if (raw.length !== 32) throw new Error("Invalid encryption key");
  return await crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}
export async function encrypt(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const result = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      await key(),
      new TextEncoder().encode(value),
    ),
  );
  return `v1:${btoa(String.fromCharCode(...iv))}:${
    btoa(String.fromCharCode(...result))
  }`;
}
export async function decrypt(value: string) {
  const [version, nonce, cipher] = value.split(":");
  if (version !== "v1") throw new Error("Invalid encrypted token");
  const bytes = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: bytes(nonce) },
      await key(),
      bytes(cipher),
    ),
  );
}
