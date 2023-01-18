#!/usr/bin/env ts-node-esm
import { readFileSync } from "node:fs"
import { parseArgs } from "node:util"
import SSICert from "./SSICert.js"
import { convertToObject, importCert } from "./SSICertService.js"

const {
  values: { certificate: certificatePath, base64 },
} = parseArgs({
  options: {
    certificate: {
      type: "string",
      short: "c",
    },
    base64: {
      type: "boolean",
      short: "b",
    },
  },
})

if (certificatePath) {
  let cert
  if (base64) {
    cert = cert = importCert(Buffer.from(readFileSync(certificatePath, "utf8"), "base64"))
  } else {
    cert = importCert(readFileSync(certificatePath))
  }
  logCert(cert)
} else {
  throw new Error("Certificate path not provided")
}

function logCert(cert: SSICert) {
  const obj = convertToObject(cert)
  console.log(`credential text:\n${obj.credentialText}`)
  console.log(`public key:\n${obj.publicKey}`)
  console.log(`owner signature:\n${obj.ownerSignature}`)
  if (cert.parent) {
    console.log(`parent signature:\n${obj.parentSignature}`)
    console.log("NEXT PARENT\n\n")
    logCert(cert.parent)
  }
}
