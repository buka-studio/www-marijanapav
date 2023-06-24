const { transformTokens } = require('token-transformer');
const fs = require('fs/promises');
const path = require('path');

const transformerOptions = {
  expandTypography: true,
  expandShadow: true,
  expandComposition: true,
  expandBorder: true,
  preserveRawValue: false,
  throwErrorWhenNotResolved: true,
  resolveReferences: true,
};

const themes = [
  'global',
  'theme-light',
  'theme-dark',
  'theme-red-light',
  'theme-blue-light',
  'theme-green-light',
  'theme-blue-dark',
  'theme-red-dark',
  'theme-green-dark',
];

(async () => {
  const tokensJSON = JSON.parse(
    await fs.readFile(path.join(__dirname, 'tokens.json')).then((t) => t.toString()),
  );

  await fs.mkdir(path.join(__dirname, 'out'), { recursive: true });

  const tasks = themes.map(async (t) => {
    const [include, exclude] = t === 'global' ? [['global'], []] : [['global', t], ['global']];

    const transformed = transformTokens(tokensJSON, include, exclude, transformerOptions);

    await fs.writeFile(
      path.join(__dirname, 'out', `${t}.json`),
      JSON.stringify(transformed, undefined, 2),
    );
  });

  await Promise.all(tasks);
})();
