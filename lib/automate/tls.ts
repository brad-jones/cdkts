import * as x509 from "@peculiar/x509";

/**
 * Result of self-signed certificate generation.
 */
export interface SelfSignedCert {
  /** PEM-encoded certificate */
  cert: string;
  /** PEM-encoded private key */
  key: string;
}

/**
 * Generates a self-signed TLS certificate for localhost.
 *
 * Uses ECDSA P-256 for key generation and includes both `localhost`
 * and `127.0.0.1` as Subject Alternative Names. The certificate
 * is valid for 24 hours.
 *
 * @returns PEM-encoded certificate and private key
 */
export async function generateSelfSignedCert(): Promise<SelfSignedCert> {
  const alg: EcKeyGenParams = { name: "ECDSA", namedCurve: "P-256" };
  const signingAlgorithm: EcdsaParams = { name: "ECDSA", hash: "SHA-256" };

  const keys = await crypto.subtle.generateKey(alg, true, ["sign", "verify"]);

  const cert = await x509.X509CertificateGenerator.createSelfSigned({
    serialNumber: "01",
    name: "CN=localhost",
    notBefore: new Date(),
    notAfter: new Date(Date.now() + 24 * 60 * 60 * 1000),
    keys,
    signingAlgorithm,
    extensions: [
      new x509.SubjectAlternativeNameExtension([
        { type: "dns", value: "localhost" },
        { type: "ip", value: "127.0.0.1" },
      ]),
      new x509.BasicConstraintsExtension(false),
      new x509.KeyUsagesExtension(
        x509.KeyUsageFlags.digitalSignature | x509.KeyUsageFlags.keyEncipherment,
        true,
      ),
      new x509.ExtendedKeyUsageExtension(["1.3.6.1.5.5.7.3.1"]), // serverAuth
    ],
  });

  const exportedKey = await crypto.subtle.exportKey("pkcs8", keys.privateKey);
  const keyPem = [
    "-----BEGIN PRIVATE KEY-----",
    ...splitLines(arrayBufferToBase64(exportedKey), 64),
    "-----END PRIVATE KEY-----",
  ].join("\n");

  return {
    cert: cert.toString("pem"),
    key: keyPem,
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function splitLines(str: string, lineLength: number): string[] {
  const lines: string[] = [];
  for (let i = 0; i < str.length; i += lineLength) {
    lines.push(str.substring(i, i + lineLength));
  }
  return lines;
}
