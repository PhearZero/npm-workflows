import { execSync } from 'node:child_process'
import { EOL } from 'node:os'
import { dirname, extname, normalize, relative, sep } from 'node:path'
import { cwd } from 'node:process'
import { readFileSync } from 'node:fs'

import memize from 'memize'
import type { SemanticConfigType } from 'semantic-release/lib/get-config.js'

import type { CommitWithFilePaths, ContextWithCommits, ContextWithVersion } from './utils.types.js'

const memoizedIsPathWithin = memize((path: string, childPath: string): boolean => {
    const normalizedPath = normalize(path)
    const normalizedChildPath = normalize(childPath)

    const childSegmentPath =
        extname(normalizedChildPath) !== '' ? dirname(normalizedChildPath).split(sep) : normalizedChildPath.split(sep)

    return normalizedPath.split(sep).every((pathSegment, index) => {
        return pathSegment === childSegmentPath[index]
    })
})

const memoizedGit = memize((args: string): string => {
    return execSync(`git ${args}`).toString().trim()
})

export function modifyContextReleaseVersion<TContextType extends ContextWithVersion>(
    context: TContextType,
): TContextType {
    return {
        ...context,
        nextRelease: {
            ...context.nextRelease,
            // @ts-expect-error
            version: context.options.tagFormat.replace('${version}', context.nextRelease.version),
        },
    }
}

interface PnpmWorkspace {
    name: string
    version: string
    path: string
}

export const memoizedGetWorkspaceManifest = memize(() => {
    try {
        const workspaces: PnpmWorkspace[] = JSON.parse(execSync('pnpm list -r --depth -1 --json').toString())
        const workingDirectory = cwd()
        const rootDir = execSync('git rev-parse --show-toplevel').toString().trim()

        const currentWorkspace = workspaces.find((workspace) => {
            return workspace.path === workingDirectory
        })

        if (!currentWorkspace) {
            return null
        }

        const pkgJson = JSON.parse(readFileSync(`${workingDirectory}/package.json`, 'utf-8'))
        const allDeps = {
            ...pkgJson.dependencies,
            ...pkgJson.devDependencies,
            ...pkgJson.peerDependencies
        }

        const currentWorkspaceDependencies = workspaces.filter((workspace) => {
            return workspace.name in allDeps
        })

        return {
            location: relative(rootDir, currentWorkspace.path),
            dependantWorkspaces: currentWorkspaceDependencies.map((currentWorkspaceDependency) => {
                return { location: relative(rootDir, currentWorkspaceDependency.path) }
            }),
        }
    } catch {
        return null
    }
})

export function modifyContextCommits<TContextType extends ContextWithCommits>(
    context: TContextType,
    semanticConfig: SemanticConfigType,
): TContextType {
    if (!context.commits) {
        return context
    }

    const currentWorkspace = memoizedGetWorkspaceManifest()

    const commitsWithFilePaths = context.commits.map((commit) => {
        return {
            ...commit,
            filePaths: memoizedGit(`diff-tree --root --no-commit-id --name-only -r ${commit.hash}`).split(EOL),
        }
    })

    const affectedCommits: CommitWithFilePaths[] = []

    if (currentWorkspace) {
        affectedCommits.push(
            ...commitsWithFilePaths.filter((commitWithFilePaths) => {
                return commitWithFilePaths.filePaths.some((commitFilePath) => {
                    return (
                        memoizedIsPathWithin(currentWorkspace.location, commitFilePath) ||
                        currentWorkspace.dependantWorkspaces.some((dependantWorkspace) =>
                            memoizedIsPathWithin(dependantWorkspace.location, commitFilePath),
                        )
                    )
                })
            }),
        )
    }

    if (semanticConfig.options.processCommits) {
        affectedCommits.push(
            ...semanticConfig.options.processCommits(
                commitsWithFilePaths.filter((commitWithFilePaths) => {
                    return !affectedCommits.some((affectedCommit) => {
                        return commitWithFilePaths.hash === affectedCommit.hash
                    })
                }),
            ),
        )
    }

    return {
        ...context,
        commits: affectedCommits,
    }
}