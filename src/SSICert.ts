import crypto, { KeyObject } from "node:crypto"
import { promisify } from "node:util"

const sign = promisify(crypto.sign)
export default class SSICert {
  static HASH_ALGORITHM = "sha256"
  parent: SSICert | null

  publicKey: KeyObject

  credentialText: string

  ownerSignature: Buffer | null

  parentSignature: Buffer | null

  private constructor(
    parentCertificate: SSICert["parent"],
    ownerPublicKey: SSICert["publicKey"],
    credentialText: SSICert["credentialText"],
    ownerSignature: SSICert["ownerSignature"],
    parentSignature: SSICert["parentSignature"],
  ) {
    this.parent = parentCertificate
    this.publicKey = ownerPublicKey
    this.credentialText = credentialText
    this.ownerSignature = ownerSignature
    this.parentSignature = parentSignature
  }

  static async create(
    parentCertificate: SSICert["parent"],
    ownerPublicKey: SSICert["publicKey"],
    credentialText: SSICert["credentialText"],
    ownerPrivateKey: KeyObject,
  ) {
    const cert = new SSICert(parentCertificate, ownerPublicKey, credentialText, null, null)
    await cert.signOwner(ownerPrivateKey)
    return cert
  }

  isSelfSigned(): boolean {
    return this.parent == null
  }

  export(): string {
    return JSON.stringify([
      { parent: this.parent?.export() ?? null },
      { owner: this.publicKey.export() },
      { credentialText: this.credentialText },
      { ownerSignature: this.ownerSignature?.toString("base64") ?? null },
      { parentSignature: this.parentSignature?.toString("base64") ?? null },
    ])
  }

  static import(serializedCertificate: string): SSICert {
    const [
      { parent: parentSerialized },
      { owner: ownerSerialized },
      { credentialText },
      { ownerSignature: ownerSignatureSerialized },
      { parentSignature: parentSignatureSerialized },
    ] = JSON.parse(serializedCertificate)
    const parent = parentSerialized == null ? null : SSICert.import(parentSerialized)
    const owner = crypto.createPublicKey(ownerSerialized)
    const ownerSignature = ownerSignatureSerialized == null ? null : Buffer.from(ownerSignatureSerialized, "base64")
    const parentSignature = parentSignatureSerialized == null ? null : Buffer.from(parentSignatureSerialized, "base64")
    return new SSICert(parent, owner, credentialText, ownerSignature, parentSignature)
  }
  private async signOwner(ownerPrivateKey: KeyObject): Promise<void> {
    const textToSign = this.getOwnerSignableText()
    this.ownerSignature = await sign(SSICert.HASH_ALGORITHM, Buffer.from(textToSign), ownerPrivateKey)
  }
  async signSubCertificate(subCertificate: SSICert, privateKey: KeyObject): Promise<void> {
    subCertificate.parent = this
    subCertificate.parentSignature = await sign(
      SSICert.HASH_ALGORITHM,
      Buffer.from(subCertificate.getParentSignableText()),
      privateKey,
    )
  }

  verifyOwner(): boolean {
    if (this.ownerSignature == null) {
      throw new Error("Cannot verify owner signature of unsigned certificate")
    }
    const textToVerify = this.getOwnerSignableText()
    return crypto.verify(SSICert.HASH_ALGORITHM, Buffer.from(textToVerify), this.publicKey, this.ownerSignature)
  }

  verifyParent(): boolean {
    if (this.parentSignature == null) {
      throw new Error("Cannot verify parent-signature of unsigned certificate")
    }
    const textToVerify = this.getParentSignableText()
    if (this.parent == null) {
      throw new Error("Cannot verify parent-signature of certificate without parent")
    }
    return crypto.verify(SSICert.HASH_ALGORITHM, Buffer.from(textToVerify), this.parent.publicKey, this.parentSignature)
  }

  verifyChain(knownRoots: SSICert[]): boolean {
    return this.internalVerifyChain(knownRoots, [])
  }

  private internalVerifyChain(knownRoots: SSICert[], visitedCerts: SSICert[]): boolean {
    if (visitedCerts.some(cert => cert.ownerSignature!.equals(this.ownerSignature!))) {
      throw new Error("Certificate chain contains a loop")
    }
    for (const root of knownRoots) {
      try {
        if (!root.verifyOwner()) {
          throw new Error("Root certificate has invalid owner signature")
        }
      } catch (e) {
        throw new Error("Root certificate is missing owner signature", { cause: e })
      }
    }
    if (this.verifyOwner()) {
      if (knownRoots.some(root => root.ownerSignature!.equals(this.ownerSignature!))) {
        return true
      } else if (this.parent != null) {
        return this.parent.internalVerifyChain(knownRoots, [...visitedCerts, this])
      } else {
        return false
      }
    } else {
      throw new Error("Certificate has invalid owner signature")
    }
  }

  private getOwnerSignableText(): string {
    return JSON.stringify([
      { parent: this.parent?.export() ?? null },
      { ownerPublicKey: this.publicKey.export() },
      { credentialText: this.credentialText },
    ])
  }

  private getParentSignableText(): string {
    if (this.ownerSignature == null) {
      throw new Error("Cannot sign parent of unsigned certificate")
    }
    return JSON.stringify([
      { parent: this.parent?.export() ?? null },
      { owner: this.publicKey.export() },
      { credentialText: this.credentialText },
      { ownerSignature: this.ownerSignature.toString("base64") },
    ])
  }
}
