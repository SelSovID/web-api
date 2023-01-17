import "dotenv/config"
import type { EntityManager } from "@mikro-orm/core"
import crypto, { createPrivateKey, KeyObject } from "node:crypto"
import { Seeder } from "@mikro-orm/seeder"
import User from "../model/User.js"
import { faker } from "@faker-js/faker"
import VCRequest from "../model/VCRequest.js"
import SSICert from "../SSICert.js"
import { promisify } from "node:util"
import { readFileSync } from "node:fs"
import got from "got"
import logger from "../log.js"
import { createCert, importCert, signSubCertificate } from "../SSICertService.js"

let rootCert: SSICert
let rootPk: KeyObject

const SSI_ROOT_CERT_PATH = process.env.SSI_ROOT_CERT_PATH
const SSI_ROOT_CERT_URL = process.env.SSI_ROOT_CERT_URL
const SSI_ROOT_PRIVATE_KEY_PATH = process.env.SSI_ROOT_PRIVATE_KEY_PATH

if (SSI_ROOT_CERT_PATH) {
  logger.info({ path: SSI_ROOT_CERT_PATH }, "Using SSI_ROOT_CERT_PATH")
  rootCert = importCert(readFileSync(SSI_ROOT_CERT_PATH, "utf8"))
} else if (SSI_ROOT_CERT_URL) {
  logger.info({ url: SSI_ROOT_CERT_URL }, "Using SSI_ROOT_CERT_URL")
  rootCert = importCert(await got(SSI_ROOT_CERT_URL).text())
} else {
  throw new Error("SSI_ROOT_CERT_PATH or SSI_ROOT_CERT_URL must be provided")
}

if (SSI_ROOT_PRIVATE_KEY_PATH) {
  rootPk = createPrivateKey(readFileSync(SSI_ROOT_PRIVATE_KEY_PATH, "utf8"))
} else {
  throw new Error("SSI_ROOT_PRIVATE_KEY_PATH must be provided")
}

logger.info("Got root cert")

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    if (process.env.TEST_PASSWORD != null) {
      const testUser = em.create(User, await createUser(await createSSICert(), process.env.TEST_PASSWORD))
      const reqs = await make(createVCRequest.bind(null, testUser), 10)
      em.persist(reqs)
    }

    for (let i = 0; i < 10; i++) {
      const user = em.create(User, await createUser(await createSSICert()))
      const reqs = await make(createVCRequest.bind(null, user), 10)
      em.persist(reqs)
    }
  }
}

const make = <T>(factory: () => Promise<T> | T, amount: number = 1): Promise<T[]> =>
  Promise.all(new Array(amount).fill(null).map(factory))

async function createUser(
  [cert, privateKey]: [SSICert, KeyObject],
  password = faker.internet.password(),
): Promise<User> {
  return User.create(faker.name.fullName(), password, cert, privateKey)
}

async function createVCRequest(user: User): Promise<VCRequest> {
  return new VCRequest(
    (await createSSICert())[0],
    user,
    (await make(createSSICert, 3)).map(([cert]) => cert),
  )
}

/**
 * Creates a self-signed certificate
 * @param request what request to attach the cert to
 * @returns a new SSICert
 */
async function createSSICert(): Promise<[SSICert, KeyObject]> {
  const { publicKey, privateKey } = await promisify(crypto.generateKeyPair)("rsa", {
    modulusLength: 2048,
    publicExponent: 0x10001,
  })
  const cert = await createCert(publicKey, `${faker.lorem.words(2)}\n\n${faker.lorem.paragraph()}`, privateKey)
  await signSubCertificate(rootCert, cert, rootPk)
  return [cert, privateKey]
}
