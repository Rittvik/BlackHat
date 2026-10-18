import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const WORKSPACE_ROOT = process.cwd();

// Cross-platform recursive file search (pure JS - works on Windows, macOS, and Linux)
async function searchInDirectory(dir, query, maxResults = 30) {
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (['node_modules', '.git', 'dist', '.DS_Store', '.idea'].includes(entry.name)) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subResults = await searchInDirectory(fullPath, query, maxResults - results.length);
      results.push(...subResults);
      if (results.length >= maxResults) break;
    } else {
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(query.toLowerCase())) {
            const relPath = path.relative(WORKSPACE_ROOT, fullPath);
            results.push(`${relPath}:${i + 1}: ${lines[i].trim()}`);
            if (results.length >= maxResults) break;
          }
        }
      } catch {
        // Skip binary or unreadable files
      }
    }
  }
  return results;
}

export async function executeTool(name, args) {
  try {
    switch (name) {
      case 'read_file': {
        const filePath = path.resolve(WORKSPACE_ROOT, args.path);
        const content = await fs.readFile(filePath, 'utf-8');
        return { success: true, content, path: args.path };
      }

      case 'write_file': {
        const filePath = path.resolve(WORKSPACE_ROOT, args.path);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, args.content, 'utf-8');
        return { success: true, message: `Successfully wrote ${args.path}`, path: args.path };
      }

      case 'edit_file': {
        const filePath = path.resolve(WORKSPACE_ROOT, args.path);
        const content = await fs.readFile(filePath, 'utf-8');
        if (!content.includes(args.target)) {
          return { success: false, error: `Target text not found in ${args.path}` };
        }
        const updated = content.replace(args.target, args.replacement);
        await fs.writeFile(filePath, updated, 'utf-8');
        return { success: true, message: `Successfully updated ${args.path}`, path: args.path };
      }

      case 'list_dir': {
        const dirPath = path.resolve(WORKSPACE_ROOT, args.path || '.');
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const items = entries.map(e => ({
          name: e.name,
          isDirectory: e.isDirectory(),
          path: path.relative(WORKSPACE_ROOT, path.join(dirPath, e.name))
        }));
        return { success: true, items };
      }

      case 'run_command': {
        const isWindows = process.platform === 'win32';
        const shell = isWindows ? (process.env.COMSPEC || 'powershell.exe') : (process.env.SHELL || '/bin/zsh');
        try {
          const { stdout, stderr } = await execAsync(args.command, {
            cwd: WORKSPACE_ROOT,
            shell,
            timeout: 25000
          });
          return { success: true, stdout, stderr, command: args.command };
        } catch (execErr) {
          return {
            success: false,
            stdout: execErr.stdout || '',
            stderr: execErr.stderr || execErr.message,
            command: args.command
          };
        }
      }

      case 'search_files': {
        const query = args.query;
        const matches = await searchInDirectory(WORKSPACE_ROOT, query, 30);
        return { success: true, matches: matches.join('\n') };
      }

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export const TOOL_DEFINITIONS = [
  {
    name: 'read_file',
    description: 'Read the contents of a file in the workspace.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path to file' }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Create or overwrite a file in the workspace.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path to file' },
        content: { type: 'string', description: 'File contents' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'edit_file',
    description: 'Replace a specific block of text in an existing file.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path to file' },
        target: { type: 'string', description: 'Exact string to be replaced' },
        replacement: { type: 'string', description: 'Replacement string' }
      },
      required: ['path', 'target', 'replacement']
    }
  },
  {
    name: 'list_dir',
    description: 'List contents of a directory in the workspace.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative directory path (defaults to root)' }
      }
    }
  },
  {
    name: 'run_command',
    description: 'Execute a shell command in the workspace (PowerShell on Windows, Zsh/Bash on macOS/Linux).',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command line to run' }
      },
      required: ['command']
    }
  },
  {
    name: 'search_files',
    description: 'Search for text across the workspace.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search pattern' }
      },
      required: ['query']
    }
  }
];
