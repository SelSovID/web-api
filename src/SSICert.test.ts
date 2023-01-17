import test from "ava"
import crypto from "node:crypto"
import {
  createCert,
  equals,
  exportCert,
  importCert,
  isSelfSigned,
  signSubCertificate,
  verifyChain,
  verifyOwner,
} from "./SSICertService.js"

const { publicKey: pu1, privateKey: pr1 } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicExponent: 0x10001,
})

const { publicKey: pu2, privateKey: pr2 } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicExponent: 0x10001,
})

test("isSelfSigned", async t => {
  const cert = await createCert(pu1, "this is a test certificate", pr1)
  t.true(isSelfSigned(cert))
})

test("selfSignedVerifyOwner", async t => {
  const cert = await createCert(pu1, "this is a test certificate", pr1)
  t.true(verifyOwner(cert))
})

test("rootCertVerifyChain", async t => {
  const cert = await createCert(pu1, "this is a test certificate", pr1)
  t.true(verifyChain(cert, [cert]))
})

test("twoCertChain", async t => {
  const parent = await createCert(pu1, "this is a test parent certificate", pr1)
  const sub = await createCert(pu2, "this is a test sub certificate", pr2)

  await signSubCertificate(parent, sub, pr1)
  t.true(verifyChain(sub, [parent]))
})

test("exportImport", async t => {
  const cert = await createCert(pu1, "this is a test certificate", pr1)
  const exported = exportCert(cert)
  const imported = importCert(exported)

  t.true(equals(cert, imported))
})
