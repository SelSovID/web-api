#!/usr/bin/env ts-node-esm
import { readFileSync } from "node:fs"
import { parseArgs } from "node:util"
import { convertToObject, importCert } from "./SSICertService.js"

const {
  values: { certificate: certificatePath },
} = parseArgs({
  options: {
    certificate: {
      type: "string",
      short: "c",
    },
  },
})

if (certificatePath) {
  const cert = importCert(readFileSync(certificatePath))
  console.log("cert", cert)
  const obj = convertToObject(cert)
  console.log("obj", obj)
  console.log("json", JSON.stringify(obj, null, 2))
} else {
  throw new Error("Certificate path not provided")
}
