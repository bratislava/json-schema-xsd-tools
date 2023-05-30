import { access, stat } from 'node:fs/promises'

export const fileExists = async (path: string) => {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export const folderExists = async (path: string) => {
  try {
    const stats = await stat(path)
    return stats.isDirectory()
  } catch {
    return false
  }
}
