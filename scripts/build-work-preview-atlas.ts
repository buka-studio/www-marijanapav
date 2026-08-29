import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';
import ts from 'typescript';

import { previewAtlas } from '../src/app/(main)/work/components/ProjectHoverPreview/atlas';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONSTANTS_PATH = path.join(ROOT, 'src/app/(main)/work/constants.tsx');
const ATLAS_IMAGE_PATH = path.join(ROOT, 'public', previewAtlas.src.replace(/^\//, ''));
const WEBP_QUALITY = 90;

type PreviewEntry = {
  slug: string;
  file: string;
};

function getProperty(object: ts.ObjectLiteralExpression, name: string) {
  for (const property of object.properties) {
    if (
      ts.isPropertyAssignment(property) &&
      ts.isIdentifier(property.name) &&
      property.name.text === name
    ) {
      return property.initializer;
    }
  }

  return undefined;
}

function readString(node: ts.Node | undefined) {
  if (!node) {
    return undefined;
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  return undefined;
}

function collectPreviewEntries(source: ts.SourceFile): PreviewEntry[] {
  const imports = new Map<string, string>();

  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    if (!statement.importClause?.name) {
      continue;
    }

    const specifier = statement.moduleSpecifier.text;
    if (!specifier.startsWith('~/public/')) {
      continue;
    }

    imports.set(statement.importClause.name.text, specifier.slice('~/public/'.length));
  }

  let projectObjects: ts.NodeArray<ts.Expression> | undefined;

  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === 'projects' &&
        declaration.initializer &&
        ts.isArrayLiteralExpression(declaration.initializer)
      ) {
        projectObjects = declaration.initializer.elements;
      }
    }
  }

  if (!projectObjects) {
    throw new Error('Could not find `projects` array in constants.tsx.');
  }

  const entries: PreviewEntry[] = [];

  for (const element of projectObjects) {
    if (!ts.isObjectLiteralExpression(element)) {
      continue;
    }

    const type = readString(getProperty(element, 'type')) ?? 'project';
    const hidden = getProperty(element, 'hidden')?.kind === ts.SyntaxKind.TrueKeyword;
    if (type === 'component' || hidden) {
      continue;
    }

    const preview = getProperty(element, 'preview');
    if (!preview || !ts.isIdentifier(preview)) {
      continue;
    }

    const relative = imports.get(preview.text);
    if (!relative) {
      throw new Error(`No ~/public import found for preview \`${preview.text}\`.`);
    }

    entries.push({
      slug: readString(getProperty(element, 'slug')) ?? preview.text,
      file: relative,
    });
  }

  return entries;
}

async function main() {
  const sourceText = await readFile(CONSTANTS_PATH, 'utf8');
  const source = ts.createSourceFile(
    'constants.tsx',
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const entries = collectPreviewEntries(source);

  if (entries.length === 0) {
    throw new Error('No visible static projects found.');
  }

  const { cellWidth, cellHeight, columns } = previewAtlas;
  const rows = Math.ceil(entries.length / columns);
  const atlasWidth = columns * cellWidth;
  const atlasHeight = rows * cellHeight;

  const composites = await Promise.all(
    entries.map(async (entry, index) => {
      const buffer = await sharp(path.join(ROOT, 'public', entry.file))
        .rotate()
        .resize(cellWidth, cellHeight, {
          fit: 'cover',
          position: 'center',
        })
        .toBuffer();

      return {
        input: buffer,
        left: (index % columns) * cellWidth,
        top: Math.floor(index / columns) * cellHeight,
      };
    }),
  );

  await mkdir(path.dirname(ATLAS_IMAGE_PATH), { recursive: true });
  await sharp({
    create: {
      width: atlasWidth,
      height: atlasHeight,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite(composites)
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toFile(ATLAS_IMAGE_PATH);

  const stats = await sharp(ATLAS_IMAGE_PATH).metadata();
  console.log(
    `Wrote ${entries.length} covers (${cellWidth}×${cellHeight}, object-cover/center) into a ${columns}×${rows} atlas.`,
  );
  for (const [index, entry] of entries.entries()) {
    console.log(`  ${String(index).padStart(2, '0')}  ${entry.slug}  ←  ${entry.file}`);
  }
  console.log(`${ATLAS_IMAGE_PATH}  ${stats.width}×${stats.height}  ${stats.format}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
