import { IdentitySeed } from "./entities";

export abstract class AbstractSeedStore {
  abstract create(seed: string): Promise<boolean>
  abstract set(id: number, seed: string): Promise<boolean>
  abstract get(): Promise<IdentitySeed>
  abstract delete(): Promise<boolean>
  abstract exist(): Promise<boolean>
}
