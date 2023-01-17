import { createPublicKey, KeyObject, sign as signCb, verify } from "node:crypto"
import SSICert from "./SSICert.js"
import { promisify } from "node:util"

const sign = promisify(signCb)

const HASH_ALGORITHM = "sha256"

export async function createCert(
  ownerPublicKey: SSICert["publicKey"],
  credentialText: SSICert["credentialText"],
  ownerPrivateKey: KeyObject,
) {
  const cert = new SSICert(null, ownerPublicKey, credentialText, null, null)
  await signOwner(cert, ownerPrivateKey)
  return cert
}

export function equals(a: SSICert, b: SSICert): boolean {
  return (
    isSelfSigned(a) === isSelfSigned(b) &&
    //@ts-ignore
    a.publicKey.equals(b.publicKey) &&
    a.credentialText === b.credentialText &&
    (a.ownerSignature == null ? b.ownerSignature == null : a.ownerSignature.equals(b.ownerSignature!)) &&
    (a.parentSignature == null ? b.parentSignature == null : a.parentSignature.equals(b.parentSignature!)) &&
    (a.parent == null ? b.parent == null : equals(a.parent, b.parent!))
  )
}

export function exportCert(cert: SSICert): string {
  return JSON.stringify([
    { parent: cert.parent ? exportCert(cert.parent) : null },
    { publicKey: cert.publicKey.export({ format: "pem", type: "pkcs1" }) },
    { credentialText: cert.credentialText },
    { ownerSignature: cert.ownerSignature?.toString("base64") ?? null },
    { parentSignature: cert.parentSignature?.toString("base64") ?? null },
  ])
}

export function importCert(serializedCertificate: string): SSICert {
  try {
    const [
      { parent: parentSerialized },
      { publicKey: publicKeySerialized },
      { credentialText },
      { ownerSignature: ownerSignatureSerialized },
      { parentSignature: parentSignatureSerialized },
    ] = JSON.parse(serializedCertificate) as SSICertJSON
    if (publicKeySerialized == null || credentialText == null) {
      throw new Error("Missing required fields")
    }
    const parent = parentSerialized == null ? null : importCert(parentSerialized)
    const publicKey = createPublicKey(publicKeySerialized)
    const ownerSignature = ownerSignatureSerialized == null ? null : Buffer.from(ownerSignatureSerialized, "base64")
    const parentSignature = parentSignatureSerialized == null ? null : Buffer.from(parentSignatureSerialized, "base64")
    return new SSICert(parent, publicKey, credentialText, ownerSignature, parentSignature)
  } catch (e) {
    throw new Error(`Cannot import certificate: ${e}`)
  }
}

export function isSelfSigned(cert: SSICert): boolean {
  return cert.parent == null
}

export async function signOwner(cert: SSICert, ownerPrivateKey: KeyObject): Promise<void> {
  const textToSign = getOwnerSignableText(cert)
  cert.ownerSignature = await sign(HASH_ALGORITHM, Buffer.from(textToSign), ownerPrivateKey)
}

export async function signSubCertificate(
  parentCert: SSICert,
  subCertificate: SSICert,
  privateKey: KeyObject,
): Promise<void> {
  subCertificate.parent = parentCert
  subCertificate.parentSignature = await sign(
    HASH_ALGORITHM,
    Buffer.from(getParentSignableText(subCertificate)),
    privateKey,
  )
}

export function verifyOwner(cert: SSICert): boolean {
  if (cert.ownerSignature == null) {
    throw new Error("Cannot verify owner signature of unsigned certificate")
  }
  const textToVerify = getOwnerSignableText(cert)
  return verify(HASH_ALGORITHM, Buffer.from(textToVerify), cert.publicKey, cert.ownerSignature)
}

export function verifyParent(cert: SSICert): boolean {
  if (cert.parentSignature == null) {
    throw new Error("Cannot verify parent-signature of unsigned certificate")
  }
  const textToVerify = getParentSignableText(cert)
  if (cert.parent == null) {
    throw new Error("Cannot verify parent-signature of certificate without parent")
  }
  return verify(HASH_ALGORITHM, Buffer.from(textToVerify), cert.parent.publicKey, cert.parentSignature)
}

export function verifyChain(cert: SSICert, knownRoots: SSICert[]): boolean {
  for (const root of knownRoots) {
    try {
      if (!verifyOwner(root)) {
        throw new Error("Root certificate has invalid owner signature")
      }
    } catch (e) {
      throw new Error("Root certificate is missing owner signature", { cause: e })
    }
  }
  return internalVerifyChain(cert, knownRoots, [])
}

function internalVerifyChain(cert: SSICert, knownRoots: SSICert[], visitedCerts: SSICert[]): boolean {
  if (visitedCerts.some(visited => visited.ownerSignature!.equals(cert.ownerSignature!))) {
    throw new Error("Certificate chain contains a loop")
  }
  if (verifyOwner(cert)) {
    if (knownRoots.some(root => root.ownerSignature!.equals(cert.ownerSignature!))) {
      return true
    } else if (cert.parent != null) {
      return internalVerifyChain(cert.parent, knownRoots, [...visitedCerts, cert])
    } else {
      return false
    }
  } else {
    throw new Error("Certificate has invalid owner signature")
  }
}

function getOwnerSignableText(cert: SSICert): string {
  return JSON.stringify([
    { ownerPublicKey: cert.publicKey.export({ format: "pem", type: "pkcs1" }) },
    { credentialText: cert.credentialText },
  ])
}

function getParentSignableText(cert: SSICert): string {
  if (cert.ownerSignature == null) {
    throw new Error("Cannot sign parent of unsigned certificate")
  }
  return JSON.stringify([
    { ownerPublicKey: cert.publicKey.export({ format: "pem", type: "pkcs1" }) },
    { credentialText: cert.credentialText },
    { ownerSignature: cert.ownerSignature.toString("base64") },
  ])
}
export type SSICertJSON = [
  { parent: string | null },
  { publicKey: string },
  { credentialText: string },
  { ownerSignature: string | null },
  { parentSignature: string | null },
]
