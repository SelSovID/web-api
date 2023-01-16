#!/usr/bin/env ts-node-esm
import SSICert from "./SSICert.js"
import { promisify } from "node:util"
import { createPrivateKey, generateKeyPair as generateKeyPairCallback } from "node:crypto"
import { parseArgs } from "node:util"
import { readFileSync, writeFileSync } from "node:fs"
const generateKeyPair = promisify(generateKeyPairCallback)

const {
  values: {
    certificate: certificatePath,
    privateKey: privateKeyPath,
    parentCertificate: parentCertificatePath,
    parentCertificateKey: parentCertificateKeyPath,
    text,
  },
} = parseArgs({
  options: {
    certificate: {
      type: "string",
      short: "c",
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
    text: {
      type: "string",
      short: "t",
      default: "SSI CERTIFICATE",
    },
  },
})

if (!certificatePath) {
  throw new Error("Certificate path not provided")
}

const { publicKey, privateKey } = await generateKeyPair("rsa", {
  modulusLength: 2048,
  publicExponent: 0x10001,
})

const cert = await SSICert.create(publicKey, text!, privateKey)

if (parentCertificatePath) {
  if (!parentCertificateKeyPath) {
    throw new Error("A parent certificate was provided but no parent certificate key was provided")
  }
  const parentCert = SSICert.import(readFileSync(parentCertificatePath, "utf8"))
  const parentCertKey = createPrivateKey(readFileSync(parentCertificateKeyPath, "utf8"))
  await parentCert.signSubCertificate(cert, parentCertKey)
  console.error("Parent certificate found and used to sign the new certificate")
} else {
  console.error("No parent certificate given. Generating self-signed certificate")
}

writeFileSync(certificatePath, cert.export())

if (privateKeyPath) {
  writeFileSync(privateKeyPath, privateKey.export({ format: "pem", type: "pkcs1" }))
} else {
  console.error("Private key not saved, use --privateKey=path to save it to a file")
}
