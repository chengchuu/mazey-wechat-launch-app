import LAUNCH_APP from '../lib/index.esm';

const path = require('node:path');
const ts = require('typescript');

test('Is LAUNCH_APP function?', () => {
  expect(typeof LAUNCH_APP === 'function').toBe(true);
});

test('Published declarations compile for a package consumer', () => {
  const projectRoot = path.resolve(__dirname, '..');
  const consumerPath = path.join(
    projectRoot,
    '.package-types-test',
    'consumer.ts'
  );
  const consumerSource = `
    import LAUNCH_APP from '../lib/index';

    const app = LAUNCH_APP({
      onMenuShareTimelineOptions: {
        title: 'Title',
        link: 'https://example.com',
        imgUrl: 'https://example.com/image.png',
        success: () => undefined,
        cancel: () => undefined,
      },
    });

    app.start({});
  `;
  const compilerOptions = {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    noEmit: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
  };
  const compilerHost = ts.createCompilerHost(compilerOptions);
  const getSourceFile = compilerHost.getSourceFile.bind(compilerHost);

  compilerHost.fileExists = (fileName) =>
    fileName === consumerPath || ts.sys.fileExists(fileName);
  compilerHost.readFile = (fileName) =>
    fileName === consumerPath ? consumerSource : ts.sys.readFile(fileName);
  compilerHost.getSourceFile = (fileName, languageVersion, onError) =>
    fileName === consumerPath
      ? ts.createSourceFile(fileName, consumerSource, languageVersion)
      : getSourceFile(fileName, languageVersion, onError);

  const program = ts.createProgram(
    [consumerPath],
    compilerOptions,
    compilerHost
  );
  const diagnostics = ts.getPreEmitDiagnostics(program);
  const message = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => projectRoot,
    getNewLine: () => '\n',
  });

  expect(message).toBe('');
});
