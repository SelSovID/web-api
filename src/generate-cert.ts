#!/usr/bin/env ts-node-esm
import { promisify } from "node:util"
import { createPrivateKey, generateKeyPair as generateKeyPairCallback } from "node:crypto"
import { parseArgs } from "node:util"
import { readFileSync, writeFileSync } from "node:fs"
import { createCert, exportCert, importCert, signSubCertificate } from "./SSICertService.js"
const generateKeyPair = promisify(generateKeyPairCallback)

const {
  values: {
    certificate: certificatePath,
    privateKey: privateKeyPath,
    parentCertificate: parentCertificatePath,
    parentCertificateKey: parentCertificateKeyPath,
    text,
    base64,
    help,
  },
} = parseArgs({
  options: {
    certificate: {
      type: "string",
      short: "c",
    },
    text: {
      type: "string",
      short: "t",
    },
    privateKey: {
      type: "string",
      short: "k",
    },
    parentCertificate: {
      type: "string",
      short: "p",
    },
    parentCertificateKey: {
      type: "string",
      short: "K",
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
Usage: generate-cert [options]

This command can generate a new SSI certificate and optionally sign it with a
parent certificate.

If you provide a parent certificate, the new certificate will be signed with it.
If you don't provide a parent certificate, a self-signed certificate will be
generated.

You have to provide both parentCertificate and parentCertificateKey if you want
to sign the new certificate with a parent certificate.

Options:

  --certificate, -c           The path to the certificate file to be generated

  --text, -t                  The text to be written on the certificate

  --privateKey, -k            The path to the private key file to be generated,
                              this is optional, if you don't provide it the
                              private key will not be saved

  --parentCertificate, -p     The path to the parent certificate file to be used
                              to sign the new certificate. If not provided, a
                              self-signed certificate will be generated.

  --parentCertificateKey, -K  The path to the parent certificate private key
                              file to be used to sign the new certificate. If
                              not provided, a self-signed certificate will be
                              generated

  --base64, -b                Encode the certificate in base64. If you omit this
                              the certificate will be protobuf encoded.

  --help, -h                  Show this help text
`

if (help) {
  console.log(helpText)
  process.exit(0)
}

if (!certificatePath) {
  throw new Error("Certificate path not provided. Use --help to see usage")
}

const { publicKey, privateKey } = await generateKeyPair("rsa", {
  modulusLength: 2048,
  publicExponent: 0x10001,
})

const cert = await createCert(publicKey, text ?? "SSI CERTIFICATE", privateKey)

if (parentCertificatePath) {
  if (!parentCertificateKeyPath) {
    throw new Error(
      "A parent certificate was provided but no parent certificate key was provided. Use --help to see usage",
    )
  }
  const parentCert = importCert(readFileSync(parentCertificatePath))
  const parentCertKey = createPrivateKey(readFileSync(parentCertificateKeyPath, "utf8"))
  await signSubCertificate(parentCert, cert, parentCertKey)
  console.error("Parent certificate found and used to sign the new certificate")
} else {
  console.error("No parent certificate given. Generating self-signed certificate")
}

if (base64) {
  writeFileSync(certificatePath, Buffer.from(exportCert(cert)).toString("base64"))
} else {
  writeFileSync(certificatePath, exportCert(cert))
}
if (privateKeyPath) {
  writeFileSync(privateKeyPath, privateKey.export({ format: "pem", type: "pkcs1" }))
} else {
  console.error("Private key not saved, use --privateKey=path to save it to a file")
}
