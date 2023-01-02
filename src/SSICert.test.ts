import test from "ava"
import SSICert from "./model/SSICert.js"
import crypto from "node:crypto"

const { publicKey: pu1, privateKey: pr1 } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicExponent: 0x10001,
})

const { publicKey: pu2, privateKey: pr2 } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicExponent: 0x10001,
})

test("isSelfSigned", async t => {
  const cert = await SSICert.create(pu1, "this is a test certificate", pr1)
  t.true(cert.isSelfSigned())
})

test("selfSignedVerifyOwner", async t => {
  const cert = await SSICert.create(pu1, "this is a test certificate", pr1)
  t.true(cert.verifyOwner())
})

test("rootCertVerifyChain", async t => {
  const cert = await SSICert.create(pu1, "this is a test certificate", pr1)
  t.true(cert.verifyChain([cert]))
})

test("twoCertChain", async t => {
  const parent = await SSICert.create(pu1, "this is a test parent certificate", pr1)
  const sub = await SSICert.create(pu2, "this is a test sub certificate", pr2)

  await parent.signSubCertificate(sub, pr1)
  t.true(sub.verifyChain([parent]))
})

test("exportImport", async t => {
  const cert = await SSICert.create(pu1, "this is a test certificate", pr1)
  const exported = cert.export()
  const imported = SSICert.import(exported)

  t.true(cert.equals(imported))
})
