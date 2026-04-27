/**
 * Skill Config Utilities
 * Direct read/write access to skill configuration in BajoClaw's isolated OpenClaw config
 * This bypasses the Gateway RPC for faster and more reliable config updates.
 *
 * All file I/O uses async fs/promises to avoid blocking the main thread.
 */
import { readFile, writeFile, access, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { constants } from 'fs';
import { join } from 'path';
import { getOpenClawConfigDir, getResourcesDir } from './paths';
import { logger } from './logger';
import { cpAsyncSafe } from './plugin-install';
import { withConfigLock } from './config-mutex';

const OPENCLAW_CONFIG_PATH = join(getOpenClawConfigDir(), 'openclaw.json');

interface SkillEntry {
    enabled?: boolean;
    apiKey?: string;
    env?: Record<string, string>;
}

interface OpenClawConfig {
    skills?: {
        entries?: Record<string, SkillEntry>;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

interface PreinstalledSkillSpec {
    slug: string;
    version?: string;
    autoEnable?: boolean;
}

interface PreinstalledManifest {
    skills?: PreinstalledSkillSpec[];
}

interface PreinstalledLockEntry {
    slug: string;
    version?: string;
}

interface PreinstalledLockFile {
    skills?: PreinstalledLockEntry[];
}

interface PreinstalledMarker {
    source: 'clawx-preinstalled';
    slug: string;
    version: string;
    installedAt: string;
}

interface LocalSkillMarker {
    source: 'bajo-local';
    slug: string;
    version: string;
    installedAt: string;
}

async function fileExists(p: string): Promise<boolean> {
    try { await access(p, constants.F_OK); return true; } catch { return false; }
}

/**
 * Read the current OpenClaw config
 */
async function readConfig(): Promise<OpenClawConfig> {
    if (!(await fileExists(OPENCLAW_CONFIG_PATH))) {
        return {};
    }
    try {
        const raw = await readFile(OPENCLAW_CONFIG_PATH, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Failed to read openclaw config:', err);
        return {};
    }
}

/**
 * Write the OpenClaw config
 */
async function writeConfig(config: OpenClawConfig): Promise<void> {
    const json = JSON.stringify(config, null, 2);
    await writeFile(OPENCLAW_CONFIG_PATH, json, 'utf-8');
}

async function setSkillsEnabled(skillKeys: string[], enabled: boolean): Promise<void> {
    if (skillKeys.length === 0) {
        return;
    }
    return withConfigLock(async () => {
        const config = await readConfig();
        if (!config.skills) {
            config.skills = {};
        }
        if (!config.skills.entries) {
            config.skills.entries = {};
        }
        for (const skillKey of skillKeys) {
            const entry = config.skills.entries[skillKey] || {};
            entry.enabled = enabled;
            config.skills.entries[skillKey] = entry;
        }
        await writeConfig(config);
    });
}

/**
 * Get skill config
 */
export async function getSkillConfig(skillKey: string): Promise<SkillEntry | undefined> {
    const config = await readConfig();
    return config.skills?.entries?.[skillKey];
}

/**
 * Update skill config (apiKey and env)
 */
export async function updateSkillConfig(
    skillKey: string,
    updates: { apiKey?: string; env?: Record<string, string> }
): Promise<{ success: boolean; error?: string }> {
    try {
        return await withConfigLock(async () => {
            const config = await readConfig();

            // Ensure skills.entries exists
            if (!config.skills) {
                config.skills = {};
            }
            if (!config.skills.entries) {
                config.skills.entries = {};
            }

            // Get or create skill entry
            const entry = config.skills.entries[skillKey] || {};

            // Update apiKey
            if (updates.apiKey !== undefined) {
                const trimmed = updates.apiKey.trim();
                if (trimmed) {
                    entry.apiKey = trimmed;
                } else {
                    delete entry.apiKey;
                }
            }

            // Update env
            if (updates.env !== undefined) {
                const newEnv: Record<string, string> = {};

                for (const [key, value] of Object.entries(updates.env)) {
                    const trimmedKey = key.trim();
                    if (!trimmedKey) continue;

                    const trimmedVal = value.trim();
                    if (trimmedVal) {
                        newEnv[trimmedKey] = trimmedVal;
                    }
                }

                if (Object.keys(newEnv).length > 0) {
                    entry.env = newEnv;
                } else {
                    delete entry.env;
                }
            }

            // Save entry back
            config.skills.entries[skillKey] = entry;

            await writeConfig(config);
            return { success: true };
        });
    } catch (err) {
        console.error('Failed to update skill config:', err);
        return { success: false, error: String(err) };
    }
}

/**
 * Get all skill configs (for syncing to frontend)
 */
export async function getAllSkillConfigs(): Promise<Record<string, SkillEntry>> {
    const config = await readConfig();
    return config.skills?.entries || {};
}

const LOCAL_SKILLS = [
    { slug: 'stock-research', autoEnable: true, version: '2' },
    { slug: 'financial-report-analysis', autoEnable: true, version: '2' },
    { slug: 'portfolio-risk-review', autoEnable: true, version: '2' },
    { slug: 'fund-etf-analysis', autoEnable: true, version: '2' },
] as const;

const LOCAL_SKILL_MARKER_NAME = '.bajo-local-skill.json';

function resolveLocalSkillSourceDir(slug: string): string | null {
    const candidates = [
        join(getResourcesDir(), 'skills', 'local', slug),
        join(process.cwd(), 'resources', 'skills', 'local', slug),
        join(__dirname, '../../resources/skills/local', slug),
    ];

    return candidates.find((dir) => existsSync(join(dir, 'SKILL.md'))) || null;
}

/**
 * Ensure Bajo local skills are deployed to the isolated OpenClaw skills directory.
 * These skills do not require per-skill API keys; they rely on the user's global model provider.
 * Runs at app startup; all errors are logged and swallowed so they never
 * block the normal startup flow.
 */
export async function ensureBuiltinSkillsInstalled(): Promise<void> {
    const skillsRoot = join(getOpenClawConfigDir(), 'skills');
    await mkdir(skillsRoot, { recursive: true });
    const toEnable: string[] = [];

    for (const spec of LOCAL_SKILLS) {
        const { slug } = spec;
        const targetDir = join(skillsRoot, slug);
        const targetManifest = join(targetDir, 'SKILL.md');
        const markerPath = join(targetDir, LOCAL_SKILL_MARKER_NAME);
        const sourceDir = resolveLocalSkillSourceDir(slug);
        let marker: LocalSkillMarker | null = null;

        if (!sourceDir) {
            logger.warn(`Bajo local skill source not found, skipping: ${slug}`);
            continue;
        }

        if (existsSync(targetManifest)) {
            if (existsSync(markerPath)) {
                marker = await tryReadLocalSkillMarker(markerPath);
                if (marker?.version !== spec.version) {
                    try {
                        await rm(targetDir, { recursive: true, force: true });
                    } catch (error) {
                        logger.warn(`Failed to remove old Bajo local skill ${slug}:`, error);
                        continue;
                    }
                } else {
                    if (spec.autoEnable) {
                        toEnable.push(slug);
                    }
                    continue;
                }
            } else {
                logger.info(`Skipping user-managed local skill: ${slug}`);
                continue;
            }
        }

        try {
            await mkdir(targetDir, { recursive: true });
            await cpAsyncSafe(sourceDir, targetDir);
            const markerPayload: LocalSkillMarker = {
                source: 'bajo-local',
                slug,
                version: spec.version,
                installedAt: new Date().toISOString(),
            };
            await writeFile(markerPath, `${JSON.stringify(markerPayload, null, 2)}\n`, 'utf-8');
            if (spec.autoEnable) {
                toEnable.push(slug);
            }
            logger.info(`Installed Bajo local skill: ${slug} -> ${targetDir}`);
        } catch (error) {
            logger.warn(`Failed to install Bajo local skill ${slug}:`, error);
        }
    }

    if (toEnable.length > 0) {
        try {
            await setSkillsEnabled(Array.from(new Set(toEnable)), true);
        } catch (error) {
            logger.warn('Failed to auto-enable Bajo local skills:', error);
        }
    }
}

async function tryReadLocalSkillMarker(markerPath: string): Promise<LocalSkillMarker | null> {
    try {
        const raw = await readFile(markerPath, 'utf-8');
        const parsed = JSON.parse(raw) as LocalSkillMarker;
        if (parsed?.source !== 'bajo-local' || !parsed?.slug || !parsed?.version) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

const PREINSTALLED_MANIFEST_NAME = 'preinstalled-manifest.json';
const PREINSTALLED_MARKER_NAME = '.clawx-preinstalled.json';

async function readPreinstalledManifest(): Promise<PreinstalledSkillSpec[]> {
    const candidates = [
        join(getResourcesDir(), 'skills', PREINSTALLED_MANIFEST_NAME),
        join(process.cwd(), 'resources', 'skills', PREINSTALLED_MANIFEST_NAME),
    ];

    const manifestPath = candidates.find((p) => existsSync(p));
    if (!manifestPath) {
        return [];
    }

    try {
        const raw = await readFile(manifestPath, 'utf-8');
        const parsed = JSON.parse(raw) as PreinstalledManifest;
        if (!Array.isArray(parsed.skills)) {
            return [];
        }
        return parsed.skills.filter((s): s is PreinstalledSkillSpec => Boolean(s?.slug));
    } catch (error) {
        logger.warn('Failed to read preinstalled-skills manifest:', error);
        return [];
    }
}

function resolvePreinstalledSkillsSourceRoot(): string | null {
    const candidates = [
        join(getResourcesDir(), 'preinstalled-skills'),
        join(process.cwd(), 'build', 'preinstalled-skills'),
        join(__dirname, '../../build/preinstalled-skills'),
    ];

    const root = candidates.find((dir) => existsSync(dir));
    return root || null;
}

async function readPreinstalledLockVersions(sourceRoot: string): Promise<Map<string, string>> {
    const lockPath = join(sourceRoot, '.preinstalled-lock.json');
    if (!existsSync(lockPath)) {
        return new Map();
    }
    try {
        const raw = await readFile(lockPath, 'utf-8');
        const parsed = JSON.parse(raw) as PreinstalledLockFile;
        const versions = new Map<string, string>();
        for (const entry of parsed.skills || []) {
            const slug = entry.slug?.trim();
            const version = entry.version?.trim();
            if (slug && version) {
                versions.set(slug, version);
            }
        }
        return versions;
    } catch (error) {
        logger.warn('Failed to read preinstalled-skills lock file:', error);
        return new Map();
    }
}

async function tryReadMarker(markerPath: string): Promise<PreinstalledMarker | null> {
    if (!existsSync(markerPath)) {
        return null;
    }
    try {
        const raw = await readFile(markerPath, 'utf-8');
        const parsed = JSON.parse(raw) as PreinstalledMarker;
        if (!parsed?.slug || !parsed?.version) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

/**
 * Ensure third-party preinstalled skills (bundled in app resources) are
 * deployed to BajoClaw's isolated OpenClaw skills directory as full directories.
 *
 * Policy:
 * - If skill is missing locally, install it.
 * - If local skill exists without our marker, treat as user-managed and never overwrite.
 * - If marker exists with same version, skip.
 * - If marker exists with a different version, skip by default to avoid overwriting edits.
 */
export async function ensurePreinstalledSkillsInstalled(): Promise<void> {
    const skills = await readPreinstalledManifest();
    if (skills.length === 0) {
        return;
    }

    const sourceRoot = resolvePreinstalledSkillsSourceRoot();
    if (!sourceRoot) {
        logger.warn('Preinstalled skills source root not found; skipping preinstall.');
        return;
    }
    const lockVersions = await readPreinstalledLockVersions(sourceRoot);

    const targetRoot = join(getOpenClawConfigDir(), 'skills');
    await mkdir(targetRoot, { recursive: true });
    const toEnable: string[] = [];

    for (const spec of skills) {
        const sourceDir = join(sourceRoot, spec.slug);
        const sourceManifest = join(sourceDir, 'SKILL.md');
        if (!existsSync(sourceManifest)) {
            logger.warn(`Preinstalled skill source missing SKILL.md, skipping: ${sourceDir}`);
            continue;
        }

        const targetDir = join(targetRoot, spec.slug);
        const targetManifest = join(targetDir, 'SKILL.md');
        const markerPath = join(targetDir, PREINSTALLED_MARKER_NAME);
        const desiredVersion = lockVersions.get(spec.slug)
            || (spec.version || 'unknown').trim()
            || 'unknown';
        const marker = await tryReadMarker(markerPath);

        if (existsSync(targetManifest)) {
            if (!marker) {
                logger.info(`Skipping user-managed skill: ${spec.slug}`);
                continue;
            }
            if (spec.autoEnable) {
                toEnable.push(spec.slug);
            }
            if (marker.version === desiredVersion) {
                continue;
            }
            logger.info(`Skipping preinstalled skill update for ${spec.slug} (local marker version=${marker.version}, desired=${desiredVersion})`);
            continue;
        }

        try {
            await mkdir(targetDir, { recursive: true });
            await cpAsyncSafe(sourceDir, targetDir);
            const markerPayload: PreinstalledMarker = {
                source: 'clawx-preinstalled',
                slug: spec.slug,
                version: desiredVersion,
                installedAt: new Date().toISOString(),
            };
            await writeFile(markerPath, `${JSON.stringify(markerPayload, null, 2)}\n`, 'utf-8');
            if (spec.autoEnable) {
                toEnable.push(spec.slug);
            }
            logger.info(`Installed preinstalled skill: ${spec.slug} -> ${targetDir}`);
        } catch (error) {
            logger.warn(`Failed to install preinstalled skill ${spec.slug}:`, error);
        }
    }

    if (toEnable.length > 0) {
        try {
            await setSkillsEnabled(Array.from(new Set(toEnable)), true);
        } catch (error) {
            logger.warn('Failed to auto-enable preinstalled skills:', error);
        }
    }
}
