/**
 * semantic-release configuration with custom changelog format
 * Style: version + date on header, "Fixed"/"Added" sections, readable sentences
 */
module.exports = {
  branches: ['main', { name: 'dev', prerelease: 'beta' }],
  plugins: [
    '@semantic-release/commit-analyzer',
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { section: 'Added', type: 'feat' },
            { section: 'Added', type: 'feature' },
            { section: 'Fixed', type: 'fix' },
            { section: 'Performance Improvements', type: 'perf' },
            { section: 'Reverts', type: 'revert' },
            { hidden: true, section: 'Documentation', type: 'docs' },
            { hidden: true, section: 'Styles', type: 'style' },
            { hidden: true, section: 'Miscellaneous Chores', type: 'chore' },
            { hidden: true, section: 'Code Refactoring', type: 'refactor' },
            { hidden: true, section: 'Tests', type: 'test' },
            { hidden: true, section: 'Build System', type: 'build' },
            { hidden: true, section: 'Continuous Integration', type: 'ci' },
          ],
        },
        writerOpts: {
          commitPartial: [
            '  - {{#if scope}}**{{scope}}:** {{/if}}{{#if subject}}{{subject}}{{else}}{{header}}{{/if}}',
            '{{~#if shortHash}}{{#if @root.linkReferences}} ([{{shortHash}}]({{@root.host}}/{{@root.owner}}/{{@root.repository}}/commit/{{shortHash}})){{/if}}{{/if}}',
            '{{~#if references}}',
            '{{~#each references}} {{#if @root.linkReferences}}[#{{this.issue}}]({{@root.host}}/{{@root.owner}}/{{@root.repository}}/issues/{{this.issue}}){{else}}#{{this.issue}}{{/if}}{{/each}}',
            '{{/if}}',
            '',
          ].join('\n'),
          headerPartial: '## **v{{version}}** · {{date}}\n\n',
        },
      },
    ],
    '@semantic-release/changelog',
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    [
      '@semantic-release/github',
      {
        failComment: false,
        // Désactive les commentaires automatiques sur les PRs et issues associées.
        // Par défaut, le plugin remonte tout l'historique et commente toutes les PRs
        // mergées depuis le début du repo — particulièrement destructeur après
        // une suppression/recréation de tag ou un premier run sur un repo existant.
        successComment: false,
      },
    ],
  ],
};
