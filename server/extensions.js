import fs from 'fs/promises';
import { createWriteStream, existsSync } from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { pipeline } from 'stream/promises';

const execAsync = promisify(exec);
const EXTENSIONS_DIR = path.join(os.homedir(), '.blackhat', 'extensions');
const MANIFEST_PATH = path.join(EXTENSIONS_DIR, 'extensions.json');

export class ExtensionService {
  constructor() {
    this.installedCache = new Map();
  }

  async init() {
    await fs.mkdir(EXTENSIONS_DIR, { recursive: true });
    await this.loadManifest();
  }

  async loadManifest() {
    try {
      if (existsSync(MANIFEST_PATH)) {
        const raw = await fs.readFile(MANIFEST_PATH, 'utf-8');
        const list = JSON.parse(raw);
        this.installedCache.clear();
        for (const item of list) {
          this.installedCache.set(item.id, item);
        }
      }
    } catch (err) {
      console.warn('[ExtensionService] Could not load manifest:', err.message);
    }
  }

  async saveManifest() {
    const list = Array.from(this.installedCache.values());
    await fs.writeFile(MANIFEST_PATH, JSON.stringify(list, null, 2), 'utf-8');
  }

  async getInstalledExtensions() {
    await this.loadManifest();
    return Array.from(this.installedCache.values());
  }

  /**
   * Install extension from Open VSX Registry
   * @param {string} extensionId - e.g. "bradlc.vscode-tailwindcss" or "dracula-theme.theme-dracula"
   */
  async installExtension(extensionId) {
    await this.init();

    const parts = extensionId.split('.');
    if (parts.length !== 2) {
      throw new Error(`Invalid extension identifier '${extensionId}'. Expected format 'publisher.name'.`);
    }
    const [namespace, name] = parts;

    console.log(`[ExtensionService] Querying Open VSX for ${namespace}.${name}...`);
    const metaRes = await fetch(`https://open-vsx.org/api/${namespace}/${name}`, {
      headers: { 'User-Agent': 'BlackHat-IDE/1.0.0' }
    });

    if (!metaRes.ok) {
      throw new Error(`Extension ${extensionId} not found on Open VSX (HTTP ${metaRes.status})`);
    }

    const meta = await metaRes.json();
    const version = meta.version;
    const downloadUrl = meta.files?.download || `https://open-vsx.org/api/${namespace}/${name}/${version}/file/${namespace}.${name}-${version}.vsix`;

    const targetDirName = `${namespace}.${name}-${version}`;
    const targetDir = path.join(EXTENSIONS_DIR, targetDirName);
    const tempVsixPath = path.join(EXTENSIONS_DIR, `${targetDirName}.vsix`);

    console.log(`[ExtensionService] Downloading VSIX from ${downloadUrl}...`);
    const vsixRes = await fetch(downloadUrl);
    if (!vsixRes.ok) {
      throw new Error(`Failed to download VSIX package: HTTP ${vsixRes.status}`);
    }

    // Write temp vsix
    const fileStream = createWriteStream(tempVsixPath);
    await pipeline(vsixRes.body, fileStream);

    console.log(`[ExtensionService] Extracting ${extensionId} to ${targetDir}...`);
    await fs.mkdir(targetDir, { recursive: true });

    // Extract VSIX using system tools (VSIX is a zip container with an 'extension/' directory)
    const isWindows = process.platform === 'win32';
    if (isWindows) {
      await execAsync(`powershell.exe -Command "Expand-Archive -Path '${tempVsixPath}' -DestinationPath '${targetDir}' -Force"`);
    } else {
      await execAsync(`unzip -q -o "${tempVsixPath}" -d "${targetDir}"`);
    }

    // Clean up temporary archive
    try {
      await fs.unlink(tempVsixPath);
    } catch {}

    // Find and parse extension package.json (usually under targetDir/extension/package.json)
    let packageJsonPath = path.join(targetDir, 'extension', 'package.json');
    if (!existsSync(packageJsonPath)) {
      packageJsonPath = path.join(targetDir, 'package.json');
    }

    if (!existsSync(packageJsonPath)) {
      throw new Error(`Invalid extension structure: package.json missing in ${targetDir}`);
    }

    const pkgRaw = await fs.readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(pkgRaw);
    const contributes = pkg.contributes || {};

    const installedRecord = {
      id: extensionId,
      name: pkg.name || name,
      displayName: pkg.displayName || meta.displayName || name,
      publisher: namespace,
      version: version,
      description: pkg.description || meta.description || '',
      icon: meta.files?.icon || '',
      installedTimestamp: Date.now(),
      enabled: true,
      location: targetDir,
      contributes: {
        themes: contributes.themes || [],
        snippets: contributes.snippets || [],
        commands: contributes.commands || [],
        languages: contributes.languages || [],
        grammars: contributes.grammars || []
      }
    };

    this.installedCache.set(extensionId, installedRecord);
    await this.saveManifest();
    console.log(`[ExtensionService] Successfully installed ${extensionId} v${version}`);
    return installedRecord;
  }

  async uninstallExtension(extensionId) {
    await this.init();
    const existing = this.installedCache.get(extensionId);
    if (existing && existing.location) {
      try {
        await fs.rm(existing.location, { recursive: true, force: true });
      } catch (err) {
        console.warn(`[ExtensionService] Could not remove directory ${existing.location}:`, err.message);
      }
    }
    this.installedCache.delete(extensionId);
    await this.saveManifest();
    return { success: true };
  }

  async getContributedTheme(extensionId, themePath) {
    const ext = this.installedCache.get(extensionId);
    if (!ext || !ext.location) throw new Error(`Extension ${extensionId} not found`);

    let fullPath = path.join(ext.location, 'extension', themePath);
    if (!existsSync(fullPath)) {
      fullPath = path.join(ext.location, themePath);
    }

    if (!existsSync(fullPath)) {
      throw new Error(`Theme file not found at ${fullPath}`);
    }

    const raw = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(raw);
  }
}

export const extensionService = new ExtensionService();
