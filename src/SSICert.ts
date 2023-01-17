import { KeyObject } from "node:crypto"

export default class SSICert {
  parent: SSICert | null
  publicKey: KeyObject
  credentialText: string
  ownerSignature: Uint8Array
  parentSignature: Uint8Array | null

  constructor(
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
}
