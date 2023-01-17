import test from "ava"
import { promisify } from "node:util"
import crypto from "node:crypto"
import { createCert, equals } from "../SSICertService.js"
import DBSSI from "./DBSSI.js"

test("DBSSI", async t => {
  const { publicKey, privateKey } = await promisify(crypto.generateKeyPair)("rsa", {
    modulusLength: 2048,
    publicExponent: 0x10001,
  })
  const cert = await createCert(publicKey, "test certificate", privateKey)
  const exported = new DBSSI().convertToDatabaseValue(cert)
  const imported = new DBSSI().convertToJSValue(exported)!
  t.true(equals(cert, imported))
})
