import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';
import ts from 'typescript';

import { photosAtlas } from '../src/app/(main)/components/PhotosCardWebgl/atlas';

const ROOT = path.resolve(import.meta.dirname, '..');
const PHOTOS_PATH = path.join(ROOT, 'src/app/(main)/components/photos.ts');
const ATLAS_IMAGE_PATH = path.join(ROOT, 'public', photosAtlas.src.replace(/^\//, ''));
const WEBP_QUALITY = 80;

function collectPhotoFiles(source: ts.SourceFile) {
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

  let elements: ts.NodeArray<ts.Expression> | undefined;

  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === 'photos' &&
        declaration.initializer &&
        ts.isArrayLiteralExpression(declaration.initializer)
      ) {
        elements = declaration.initializer.elements;
      }
    }
  }

  if (!elements) {
    throw new Error('Could not find `photos` array in photos.ts.');
  }

  return elements.map((element) => {
    if (!ts.isIdentifier(element)) {
      throw new Error('Expected identifier in `photos` array.');
    }

    const file = imports.get(element.text);
    if (!file) {
      throw new Error(`No ~/public import found for \`${element.text}\`.`);
    }

    return { name: element.text, file };
  });
}

async function main() {
  const sourceText = await readFile(PHOTOS_PATH, 'utf8');
  const source = ts.createSourceFile(
    'photos.ts',
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const entries = collectPhotoFiles(source);

  if (entries.length === 0) {
    throw new Error('No photos found.');
  }

  const { cellWidth, cellHeight, columns } = photosAtlas;
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
    console.log(`  ${String(index).padStart(2, '0')}  ${entry.name}  ←  ${entry.file}`);
  }
  console.log(`${ATLAS_IMAGE_PATH}  ${stats.width}×${stats.height}  ${stats.format}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
