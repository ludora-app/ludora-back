/**
 * semantic-release configuration with custom changelog format
 * Style: version + date on header, "Fixed"/"Added" sections, readable sentences
 *
 * Le plugin "fetch-tags" assure que les tags distants sont récupérés avant l'analyse,
 * pour éviter l'erreur "fatal: tag 'vX.Y.Z' already exists" quand un run précédent
 * a déjà créé le tag (re-run, concurrence, ou commit chore après release).
 */
const { execSync } = require('child_process');

/** Plugin minimal : fetch des tags avant analyse pour que semantic-release voie les releases existantes */
function fetchTagsPlugin() {
  return {
    async verifyConditions() {
      execSync('git fetch origin --tags --force', { stdio: 'inherit' });
    },
  };
}

module.exports = {
  branches: ['main', { name: 'dev', prerelease: 'beta' }],
  plugins: [
    fetchTagsPlugin(),
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
    '@semantic-release/github',
  ],
};
