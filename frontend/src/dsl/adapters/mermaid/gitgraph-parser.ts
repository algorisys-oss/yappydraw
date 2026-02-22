/**
 * Mermaid Git Graph Parser
 * Parses `gitGraph` syntax into DSL IR using individual circle/text elements.
 *
 * Supported:
 *   gitGraph
 *       commit
 *       commit id: "abc"
 *       commit tag: "v1.0"
 *       commit type: HIGHLIGHT
 *       branch develop
 *       checkout develop
 *       commit
 *       checkout main
 *       merge develop
 *       cherry-pick id: "abc"
 */

import type { DSLDiagram, DSLNode, DSLEdge, ParseError } from '../../types';
import type { AdapterResult } from '../adapter-interface';
import { stripQuotes } from './mermaid-utils';

const BRANCH_COLORS = [
    '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];

interface CommitInfo {
    id: string;
    branch: string;
    tag?: string;
    type?: string;
    isMerge?: boolean;
    mergeFrom?: string;
}

export function parseMermaidGitGraph(input: string): AdapterResult {
    const errors: ParseError[] = [];
    const warnings: ParseError[] = [];
    const lines = input.split('\n');

    let headerParsed = false;
    let currentBranch = 'main';
    const branches = new Map<string, { color: string; commits: string[]; parentBranch: string }>();
    branches.set('main', { color: BRANCH_COLORS[0], commits: [], parentBranch: '' });

    const commits: CommitInfo[] = [];
    let autoId = 0;

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const line = lines[i].trim();

        if (!line || line.startsWith('%%')) continue;

        if (!headerParsed && /^gitGraph/i.test(line)) {
            headerParsed = true;
            // Check for options like LR
            continue;
        }

        // commit [id: "x"] [tag: "v1.0"] [type: NORMAL|REVERSE|HIGHLIGHT]
        if (/^commit\b/i.test(line)) {
            const commitId = extractParam(line, 'id') || `c${++autoId}`;
            const tag = extractParam(line, 'tag');
            const type = extractParam(line, 'type');

            const commit: CommitInfo = { id: commitId, branch: currentBranch, tag, type };
            commits.push(commit);

            const branchInfo = branches.get(currentBranch);
            if (branchInfo) branchInfo.commits.push(commitId);
            continue;
        }

        // branch <name>
        if (/^branch\s+/i.test(line)) {
            const branchName = line.replace(/^branch\s+/i, '').trim();
            if (!branches.has(branchName)) {
                branches.set(branchName, {
                    color: BRANCH_COLORS[branches.size % BRANCH_COLORS.length],
                    commits: [],
                    parentBranch: currentBranch,
                });
            }
            currentBranch = branchName;
            continue;
        }

        // checkout <name>
        if (/^checkout\s+/i.test(line)) {
            const branchName = line.replace(/^checkout\s+/i, '').trim();
            if (!branches.has(branchName)) {
                warnings.push({ line: lineNum, message: `Unknown branch: "${branchName}"` });
            }
            currentBranch = branchName;
            continue;
        }

        // merge <name> [id: "x"] [tag: "v2.0"]
        if (/^merge\s+/i.test(line)) {
            const rest = line.replace(/^merge\s+/i, '');
            const sourceBranch = rest.split(/\s/)[0].trim();
            const mergeId = extractParam(line, 'id') || `m${++autoId}`;
            const tag = extractParam(line, 'tag');

            const commit: CommitInfo = {
                id: mergeId,
                branch: currentBranch,
                tag,
                isMerge: true,
                mergeFrom: sourceBranch,
            };
            commits.push(commit);

            const branchInfo = branches.get(currentBranch);
            if (branchInfo) branchInfo.commits.push(mergeId);
            continue;
        }

        // cherry-pick id: "x"
        if (/^cherry-pick\s+/i.test(line)) {
            const pickedId = extractParam(line, 'id');
            if (pickedId) {
                const cpId = `cp-${pickedId}`;
                commits.push({ id: cpId, branch: currentBranch });
                const branchInfo = branches.get(currentBranch);
                if (branchInfo) branchInfo.commits.push(cpId);
            }
            continue;
        }

        if (headerParsed && line.length > 0) {
            warnings.push({ line: lineNum, message: `Unrecognized gitGraph syntax: "${line}"` });
        }
    }

    if (commits.length === 0) {
        errors.push({ line: 0, message: 'No commits found in gitGraph.' });
        return { success: false, errors, warnings };
    }

    // Layout: branches as horizontal tracks, commits along x-axis
    const branchTrack = new Map<string, number>();
    let trackIdx = 0;
    for (const [name] of branches) {
        branchTrack.set(name, trackIdx++);
    }

    const hSpacing = 70;
    const vSpacing = 60;
    const commitRadius = 20;
    const nodes: DSLNode[] = [];
    const edges: DSLEdge[] = [];

    // Add branch label nodes
    for (const [name, info] of branches) {
        const track = branchTrack.get(name) || 0;
        nodes.push({
            id: `branch-label-${name}`,
            shape: 'text',
            label: name,
            x: -80,
            y: track * vSpacing + commitRadius / 2 - 8,
            width: 70,
            height: 20,
            style: {
                fontSize: 12,
                fontWeight: true,
                textColor: info.color,
            },
        });
    }

    // Add commit nodes
    for (let ci = 0; ci < commits.length; ci++) {
        const commit = commits[ci];
        const track = branchTrack.get(commit.branch) || 0;
        const branchInfo = branches.get(commit.branch);
        const color = branchInfo?.color || '#6b7280';

        const x = ci * hSpacing;
        const y = track * vSpacing;

        let bgColor = color;
        if (commit.type === 'REVERSE') bgColor = '#ef4444';
        if (commit.type === 'HIGHLIGHT') bgColor = '#f59e0b';

        nodes.push({
            id: commit.id,
            shape: 'circle',
            label: '',
            x,
            y,
            width: commitRadius,
            height: commitRadius,
            style: {
                strokeColor: color,
                backgroundColor: bgColor,
                fillStyle: 'solid',
                strokeWidth: 2,
                roughness: 0,
                renderStyle: 'architectural',
            },
        });

        // Tag label above commit
        if (commit.tag) {
            nodes.push({
                id: `tag-${commit.id}`,
                shape: 'capsule',
                label: commit.tag,
                x: x - 10,
                y: y - 30,
                width: 60,
                height: 22,
                style: {
                    strokeColor: '#f59e0b',
                    backgroundColor: '#fffbeb',
                    fillStyle: 'solid',
                    fontSize: 10,
                    strokeWidth: 1,
                    roughness: 0,
                    renderStyle: 'architectural',
                },
            });
        }
    }

    // Add edges: sequential commits on same branch
    for (const [, info] of branches) {
        for (let j = 1; j < info.commits.length; j++) {
            edges.push({
                from: info.commits[j - 1],
                to: info.commits[j],
                type: 'line',
                style: { strokeColor: info.color, strokeWidth: 2 },
            });
        }
    }

    // Add merge edges
    for (const commit of commits) {
        if (commit.isMerge && commit.mergeFrom) {
            const sourceInfo = branches.get(commit.mergeFrom);
            if (sourceInfo && sourceInfo.commits.length > 0) {
                const lastSourceCommit = sourceInfo.commits[sourceInfo.commits.length - 1];
                edges.push({
                    from: lastSourceCommit,
                    to: commit.id,
                    type: 'arrow',
                    endArrowhead: 'arrow',
                    style: {
                        strokeColor: sourceInfo.color,
                        strokeWidth: 2,
                        strokeStyle: 'dashed',
                    },
                });
            }
        }
    }

    // Add branch-off edges (first commit of child branch links to parent's latest commit at that point)
    for (const [, info] of branches) {
        if (info.parentBranch && info.commits.length > 0) {
            const parentInfo = branches.get(info.parentBranch);
            if (parentInfo && parentInfo.commits.length > 0) {
                // Find the parent commit that was latest when branch was created
                const firstChildCommit = info.commits[0];
                const childIdx = commits.findIndex(c => c.id === firstChildCommit);
                // Find last parent commit before this index
                let parentCommitId = '';
                for (let k = childIdx - 1; k >= 0; k--) {
                    if (commits[k].branch === info.parentBranch) {
                        parentCommitId = commits[k].id;
                        break;
                    }
                }
                if (parentCommitId) {
                    edges.push({
                        from: parentCommitId,
                        to: firstChildCommit,
                        type: 'arrow',
                        endArrowhead: 'arrow',
                        style: {
                            strokeColor: info.color,
                            strokeWidth: 2,
                            strokeStyle: 'dashed',
                        },
                    });
                }
            }
        }
    }

    const diagram: DSLDiagram = {
        version: 1,
        meta: { title: 'Git Graph', sourceFormat: 'mermaid' },
        layout: { strategy: 'manual' },
        nodes,
        edges,
    };

    return { success: true, diagram, errors: [], warnings };
}

function extractParam(line: string, param: string): string | undefined {
    const re = new RegExp(`${param}\\s*:\\s*"([^"]*)"`, 'i');
    const match = line.match(re);
    if (match) return stripQuotes(match[1]);
    // Also try without quotes for type: NORMAL
    const re2 = new RegExp(`${param}\\s*:\\s*(\\S+)`, 'i');
    const match2 = line.match(re2);
    if (match2) return match2[1];
    return undefined;
}
