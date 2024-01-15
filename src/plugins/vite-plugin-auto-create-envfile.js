import * as fs from 'fs'
import * as _path from 'path'

const LINE =
  /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm

let newEnvFileContent = null

export const autoCreateEnv = () => {
  /**
   * 判断文件是否存在,从 vite 源码复制而来
   * @param {String} dir 根路径
   * @param {Array[String]} formats 文件名数组
   * @param {Boolean} pathOnly 是否只返回路径名
   */
  function lookupFile(dir, formats, pathOnly = false) {
    for (const format of formats) {
      const fullPath = _path.join(dir, format)
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        return pathOnly ? fullPath : fs.readFileSync(fullPath, 'utf-8')
      }
    }
    const parentDir = _path.dirname(dir)
    if (parentDir !== dir) {
      return lookupFile(parentDir, formats, pathOnly)
    }
  }

  /**
   * 解析字符串取得键值对,复制自 https://github.com/motdotla/dotenv/blob/master/lib/main.js
   * @param {String} src 字符串
   */
  function parse(src) {
    const obj = {}
    // Convert buffer to string
    let lines = src.toString()
    // Convert line breaks to same format
    lines = lines.replace(/\r\n?/gm, '\n')
    let match
    while ((match = LINE.exec(lines)) != null) {
      const key = match[1]
      // Default undefined or null to empty string
      let value = match[2] || ''
      // Remove whitespace
      value = value.trim()
      // Check if double quoted
      const maybeQuote = value[0]
      // Remove surrounding quotes
      value = value.replace(/^(['"`])([\s\S]*)\1$/gm, '$2')
      // Expand newlines if double quoted
      if (maybeQuote === '"') {
        value = value.replace(/\\n/g, '\n')
        value = value.replace(/\\r/g, '\r')
      }
      // Add to object
      obj[key] = value
    }
    return obj
  }

  return {
    name: 'auto-create-envfile',
    version: '0.0.2',
    config(config, { mode, command }) {
      const envDir = process.cwd()
      const envFiles = [
        /** mode local file */ `.env.${mode}.local`,
        /** mode file */ `.env.${mode}`,
      ]
      for (const file of envFiles) {
        const path = lookupFile(envDir, [file], true)
        if (path) {
          newEnvFileContent = 'globalThis.ENV_CONFIG_VARIABLE = { '
          const parsed = parse(fs.readFileSync(path))
          for (const [key, value] of Object.entries(parsed)) {
            newEnvFileContent = newEnvFileContent + `'${key}': '${value}', `
          }
          newEnvFileContent = newEnvFileContent + '}'
        }
      }
    },
    buildStart() {
      if (newEnvFileContent) {
        const fileOutPath = './public/_config/env.js'
        fs.writeFileSync(fileOutPath, newEnvFileContent, 'utf8')
      }
    },
  }
}
