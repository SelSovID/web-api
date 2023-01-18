#!/usr/bin/env ts-node-esm
import { readFileSync } from "node:fs"
import { parseArgs } from "node:util"
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

  console.log("cert", cert)
  const obj = convertToObject(cert)
  console.log("obj", obj)
  console.log("json", JSON.stringify(obj, null, 2))
} else {
  throw new Error("Certificate path not provided")
}
