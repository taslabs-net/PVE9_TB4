export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    // Require commit body (description) for documentation changes
    'body-empty': [1, 'never'], // Warning instead of error for flexibility
    'body-min-length': [1, 'always', 10], // Minimum 10 characters
    'body-leading-blank': [2, 'always'], // Blank line between subject and body
    // Keep subject line reasonable
    'subject-max-length': [2, 'always', 72],
    // Custom scope for documentation sections
    'scope-enum': [
      1,
      'always',
      [
        'prerequisites',
        'tb4-hardware',
        'tb4-network',
        'tb4-integration',
        'sdn-openfabric',
        'mesh-testing',
        'ceph-installation',
        'ceph-network',
        'ceph-storage',
        'performance',
        'troubleshooting',
        'config',
        'navigation',
        'content',
        'formatting',
        'ci',
        'deps',
        'release',
        '*',
      ],
    ],
  },
};
