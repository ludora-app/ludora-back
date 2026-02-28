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
            { type: 'feat', section: 'Added' },
            { type: 'feature', section: 'Added' },
            { type: 'fix', section: 'Fixed' },
            { type: 'perf', section: 'Performance Improvements' },
            { type: 'revert', section: 'Reverts' },
            { type: 'docs', section: 'Documentation', hidden: true },
            { type: 'style', section: 'Styles', hidden: true },
            { type: 'chore', section: 'Miscellaneous Chores', hidden: true },
            { type: 'refactor', section: 'Code Refactoring', hidden: true },
            { type: 'test', section: 'Tests', hidden: true },
            { type: 'build', section: 'Build System', hidden: true },
            { type: 'ci', section: 'Continuous Integration', hidden: true },
          ],
        },
        writerOpts: {
          headerPartial: '## **v{{version}}** · {{date}}\n\n',
          commitPartial: [
            '  - {{#if scope}}**{{scope}}:** {{/if}}{{#if subject}}{{subject}}{{else}}{{header}}{{/if}}',
            '{{~#if shortHash}}{{#if @root.linkReferences}} ([{{shortHash}}]({{@root.host}}/{{@root.owner}}/{{@root.repository}}/commit/{{shortHash}})){{/if}}{{/if}}',
            '{{~#if references}}',
            '{{~#each references}} {{#if @root.linkReferences}}[#{{this.issue}}]({{@root.host}}/{{@root.owner}}/{{@root.repository}}/issues/{{this.issue}}){{else}}#{{this.issue}}{{/if}}{{/each}}',
            '{{/if}}',
            '',
          ].join('\n'),
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
    '@semantic-release/github',
  ],
};
