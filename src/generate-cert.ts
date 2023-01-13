#!/usr/bin/env ts-node-esm
import SSICert from "./model/SSICert.js"
import { promisify } from "node:util"
import { generateKeyPair as generateKeyPairCallback } from "node:crypto"
import { stdout } from "node:process"
const generateKeyPair = promisify(generateKeyPairCallback)

const { publicKey, privateKey } = await generateKeyPair("rsa", {
  modulusLength: 2048,
  publicExponent: 0x10001,
})

const cert = await SSICert.create(publicKey, "SSI ROOT", privateKey)

stdout.write(cert.export())
