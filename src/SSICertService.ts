import { createPublicKey, KeyObject, sign as signCb, verify } from "node:crypto"
import SSICert from "./SSICert.js"
import { promisify } from "node:util"
import proto from "protobufjs"

const sign = promisify(signCb)

const HASH_ALGORITHM = "sha256"

const SSIBufRoot = await proto.load("./SSICert.proto")
const SSICertBuf = SSIBufRoot.lookupType("SSICert")

export async function createCert(
  ownerPublicKey: SSICert["publicKey"],
  credentialText: SSICert["credentialText"],
  ownerPrivateKey: KeyObject,
) {
  const dataToSignForOwner = getOwnerSignableData(ownerPublicKey, credentialText)
  const ownerSignature = await sign(HASH_ALGORITHM, dataToSignForOwner, ownerPrivateKey)
  return new SSICert(null, ownerPublicKey, credentialText, ownerSignature, null)
}

function bufEqual(buf1: Uint8Array, buf2: Uint8Array) {
  if (buf1.byteLength != buf2.byteLength) return false
  var dv1 = new Int8Array(buf1)
  var dv2 = new Int8Array(buf2)
  for (var i = 0; i != buf1.byteLength; i++) {
    if (dv1[i] != dv2[i]) return false
  }
  return true
}

export function equals(a: SSICert, b: SSICert): boolean {
  return (
    isSelfSigned(a) === isSelfSigned(b) &&
    //@ts-ignore
    a.publicKey.equals(b.publicKey) &&
    a.credentialText === b.credentialText &&
    bufEqual(a.ownerSignature, b.ownerSignature) &&
    (a.parentSignature == null ? b.parentSignature == null : bufEqual(a.parentSignature, b.parentSignature!)) &&
    (a.parent == null ? b.parent == null : equals(a.parent, b.parent!))
  )
}

type CertEncoded = {
  parent?: CertEncoded
  publicKey: string
  credentialText: string
  ownerSignature: Uint8Array
  parentSignature?: Uint8Array
}

function createProtoMessage(cert: SSICert): proto.Message {
  const message = SSICertBuf.create({
    parent: cert.parent ? createProtoMessage(cert.parent) : null,
    publicKey: cert.publicKey.export({ format: "pem", type: "pkcs1" }),
    credentialText: cert.credentialText,
    ownerSignature: cert.ownerSignature,
    parentSignature: cert.parentSignature,
  })
  return message
}

export function exportCert(cert: SSICert): Uint8Array {
  const message = createProtoMessage(cert)

  const data = SSICertBuf.encode(message).finish()
  return data
}

export type SSICertDTO = {
  parent?: SSICertDTO | null
  publicKey: string
  credentialText: string
  ownerSignature: string
  parentSignature?: string | null
}

export function convertToObject(cert: SSICert): SSICertDTO {
  return {
    parent: cert.parent ? convertToObject(cert.parent) : null,
    publicKey: cert.publicKey.export({ format: "pem", type: "pkcs1" }) as string,
    credentialText: cert.credentialText,
    ownerSignature: Buffer.from(cert.ownerSignature).toString("base64"),
    parentSignature: cert.parentSignature ? Buffer.from(cert.parentSignature).toString("base64") : null,
  }
}

export function importCert(serializedCertificate: Uint8Array): SSICert {
  const message = SSICertBuf.toObject(SSICertBuf.decode(serializedCertificate)) as CertEncoded
  return constructClassFromEncoded(message)
}

function constructClassFromEncoded(encoded: CertEncoded): SSICert {
  const parent = encoded.parent ? constructClassFromEncoded(encoded.parent) : null
  const publicKey = createPublicKey(encoded.publicKey)
  const ownerSignature = encoded.ownerSignature
  const parentSignature = encoded.parentSignature == null ? null : Buffer.from(encoded.parentSignature)
  return new SSICert(parent, publicKey, encoded.credentialText, ownerSignature, parentSignature)
}

export function isSelfSigned(cert: SSICert): boolean {
  return cert.parent == null
}

export async function signSubCertificate(
  parentCert: SSICert,
  subCertificate: SSICert,
  privateKey: KeyObject,
): Promise<void> {
  subCertificate.parent = parentCert
  subCertificate.parentSignature = await sign(
    HASH_ALGORITHM,
    getParentSignableData(subCertificate.publicKey, subCertificate.credentialText, subCertificate.ownerSignature),
    privateKey,
  )
}

export function verifyOwner(cert: SSICert): boolean {
  if (cert.ownerSignature == null) {
    throw new Error("Cannot verify owner signature of unsigned certificate")
  }
  const dataToVerify = getOwnerSignableData(cert.publicKey, cert.credentialText)
  return verify(HASH_ALGORITHM, dataToVerify, cert.publicKey, cert.ownerSignature)
}

export function verifyParent(cert: SSICert): boolean {
  if (cert.parentSignature == null) {
    throw new Error("Cannot verify parent-signature of unsigned certificate")
  }
  const dataToVerify = getParentSignableData(cert.publicKey, cert.credentialText, cert.ownerSignature)
  if (cert.parent == null) {
    throw new Error("Cannot verify parent-signature of certificate without parent")
  }
  return verify(HASH_ALGORITHM, dataToVerify, cert.parent.publicKey, cert.parentSignature)
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
  if (visitedCerts.some(visited => bufEqual(visited.ownerSignature, cert.ownerSignature))) {
    throw new Error("Certificate chain contains a loop")
  }
  if (verifyOwner(cert)) {
    if (knownRoots.some(root => bufEqual(root.ownerSignature, cert.ownerSignature))) {
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

function getOwnerSignableData(ownerPublicKey: KeyObject, credentialText: string): Uint8Array {
  return Buffer.from(`${ownerPublicKey.export({ format: "pem", type: "pkcs1" })}${credentialText}`)
}

function getParentSignableData(
  ownerPublicKey: KeyObject,
  credentialText: string,
  ownerSignature: Uint8Array,
): Uint8Array {
  const ownerSignatureString = Buffer.from(ownerSignature).toString("base64")
  return Buffer.from(
    `${ownerPublicKey.export({
      format: "pem",
      type: "pkcs1",
    })}${credentialText}${ownerSignatureString}`,
  )
}
export type SSICertJSON = {
  parent?: SSICertJSON
  publicKey: string
  credentialText: string
  ownerSignature?: string
  parentSignature?: string
}
