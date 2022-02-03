import fs from 'fs-extra'
import type { Manifest } from 'webextension-polyfill'
import type PkgType from '../package.json'
import { isDev, port, r } from '../scripts/utils'

type ManifestV3 = Manifest.WebExtensionManifest & {
  host_permissions?: string[]
}

const getSharedManifest = async () => {
  const pkg = (await fs.readJSON(r('package.json'))) as typeof PkgType
  const manifest: Partial<ManifestV3> = {
    name: pkg.displayName || pkg.name,
    version: pkg.version,
    description: pkg.description,
    options_ui: {
      page: './dist/options/index.html',
      open_in_tab: true,
    },
    icons: {
      16: './assets/icon-512.png',
      48: './assets/icon-512.png',
      128: './assets/icon-512.png',
    },
    content_scripts: [
      {
        matches: ['http://*/*', 'https://*/*'],
        js: ['./dist/contentScripts/index.global.js'],
      },
    ],
  }

  return manifest;
}

export async function getManifest() {
  const manifest = await getSharedManifest();
  const browserAction = {
    default_icon: './assets/icon-512.png',
    default_popup: './dist/popup/index.html',
  }
  const permissions = {
    type: ['tabs', 'storage', 'activeTab'],
    host: ['http://*/', 'https://*/']
  };

  if (isDev) {
    return {
      ...manifest,
      manifest_version: 2,
      browser_action: browserAction,
      background: {
        page: './dist/background/index.html',
        persistent: false,
      },
      permissions: [
        ...permissions.type,
        ...permissions.host,
        'webNavigation'
      ],
      options_ui: {
        ...manifest.options_ui,
        chrome_style: false,
      },
      content_security_policy: `script-src \'self\' http://localhost:${port}; object-src \'self\'`
    }

  } else {
    return {
      ...manifest,
      manifest_version: 3,
      action: browserAction,
      background: {
        service_worker: './dist/background/index.global.js'
      },
      permissions: permissions.type,
      host_permissions: permissions.host
    }
  }
}
