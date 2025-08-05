import fs from 'node:fs/promises'
import * as path from 'path'

export class Cache {
  dir: string

  constructor(dir: string) {
    this.dir = path.resolve(dir)
    fs.mkdir(this.dir, { recursive: true })
  }

  public async set(key: string, value: string): Promise<string> {
    const key_path: string = path.join(this.dir, key)
    await fs.writeFile(key_path, value)
    return Promise.resolve(key_path)
  }

  public async get(key: string): Promise<string | null> {
    const key_path: string = path.join(this.dir, key)

    try {
      const value: string = (await fs.readFile(key_path)).toString('utf-8')
      return Promise.resolve(value)
    } catch {
      return null
    }
  }

  public async remove(key: string) {
    const key_path: string = path.join(this.dir, key)

    try {
      await fs.rm(key_path)
    } catch (error) {
      console.debug(error)
      return
    }
  }
}
