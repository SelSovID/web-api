#!/usr/bin/env ts-node-esm
import { readFileSync } from "node:fs"
import { parseArgs } from "node:util"
import SSICert from "./SSICert.js"
import { convertToObject, importCert } from "./SSICertService.js"

const {
  values: { certificate: certificatePath, base64, help },
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
    help: {
      type: "boolean",
      short: "h",
    },
  },
})

const helpText = `
Usage: view-cert [options]

This command can view the contents of a SSI certificate.

Options:
  -c, --certificate  Path to the certificate file
  -b, --base64       If the certificate is base64 encoded. 
                     If you omit this flag, the certificate is assumed to be in protobuf format.
  -h, --help         Show this help text
`

if (help) {
  console.log(helpText)
  process.exit(0)
}

if (certificatePath) {
  let cert
  if (base64) {
    cert = cert = importCert(Buffer.from(readFileSync(certificatePath, "utf8"), "base64"))
  } else {
    cert = importCert(readFileSync(certificatePath))
  }
  logCert(cert)
} else {
  throw new Error("Certificate path not provided, use --help to see usage")
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
