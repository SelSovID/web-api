import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core"
import crypto, { KeyObject } from "node:crypto"
import { promisify } from "node:util"
import VCRequest from "./VCRequest.js"
import { PublicKeyObject } from "../util/KeyObjectDB.js"

const sign = promisify(crypto.sign)

@Entity()
export default class SSICert {
  static HASH_ALGORITHM = "sha256"

  @PrimaryKey()
  _id!: number

  @ManyToOne()
  parent: SSICert | null

  @ManyToOne()
  forRequest!: VCRequest

  @Property({ type: PublicKeyObject })
  publicKey: KeyObject

  @Property()
  credentialText: string

  @Property({ type: "bytea" })
  ownerSignature: Buffer | null

  @Property({ type: "bytea" })
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
    ownerPublicKey: SSICert["publicKey"],
    credentialText: SSICert["credentialText"],
    ownerPrivateKey: KeyObject,
  ) {
    const cert = new SSICert(null, ownerPublicKey, credentialText, null, null)
    await cert.signOwner(ownerPrivateKey)
    return cert
  }

  isSelfSigned(): boolean {
    return this.parent == null
  }

  export(): string {
    return JSON.stringify([
      { parent: this.parent?.export() ?? null },
      { publicKey: this.publicKey.export({ format: "pem", type: "pkcs1" }) },
      { credentialText: this.credentialText },
      { ownerSignature: this.ownerSignature?.toString("base64") ?? null },
      { parentSignature: this.parentSignature?.toString("base64") ?? null },
    ])
  }

  static import(serializedCertificate: string): SSICert {
    try {
      const [
        { parent: parentSerialized },
        { publicKey: publicKeySerialized },
        { credentialText },
        { ownerSignature: ownerSignatureSerialized },
        { parentSignature: parentSignatureSerialized },
      ] = JSON.parse(serializedCertificate)
      if (publicKeySerialized == null || credentialText == null) {
        throw new Error("Missing required fields")
      }
      const parent = parentSerialized == null ? null : SSICert.import(parentSerialized)
      const publicKey = crypto.createPublicKey(publicKeySerialized)
      const ownerSignature = ownerSignatureSerialized == null ? null : Buffer.from(ownerSignatureSerialized, "base64")
      const parentSignature =
        parentSignatureSerialized == null ? null : Buffer.from(parentSignatureSerialized, "base64")
      return new SSICert(parent, publicKey, credentialText, ownerSignature, parentSignature)
    } catch (e) {
      throw new Error(`Cannot import certificate: ${e}`)
    }
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

  equals(other: SSICert): boolean {
    return (
      this.isSelfSigned() === other.isSelfSigned() &&
      //@ts-ignore
      this.publicKey.equals(other.publicKey) &&
      this.credentialText === other.credentialText &&
      (this.ownerSignature == null
        ? other.ownerSignature == null
        : this.ownerSignature.equals(other.ownerSignature!)) &&
      (this.parentSignature == null
        ? other.parentSignature == null
        : this.parentSignature.equals(other.parentSignature!)) &&
      (this.parent == null ? other.parent == null : this.parent.equals(other.parent!))
    )
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
      { ownerPublicKey: this.publicKey.export({ format: "pem", type: "pkcs1" }) },
      { credentialText: this.credentialText },
    ])
  }

  private getParentSignableText(): string {
    if (this.ownerSignature == null) {
      throw new Error("Cannot sign parent of unsigned certificate")
    }
    return JSON.stringify([
      { parent: this.parent?.export() ?? null },
      { owner: this.publicKey.export({ format: "pem", type: "pkcs1" }) },
      { credentialText: this.credentialText },
      { ownerSignature: this.ownerSignature.toString("base64") },
    ])
  }
}
