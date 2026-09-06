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
    import LAUNCH_APP, {
      LaunchAppOptions, UpdateTimelineShareDataOptions,
      UpdateAppMessageShareDataOptions, MenuShareAppMessageOptions,
    } from '../lib/index';

    const timeline: UpdateTimelineShareDataOptions = {
      title: 'Title', link: 'https://example.com', imgUrl: '',
    };
    const message: UpdateAppMessageShareDataOptions = {
      ...timeline, desc: 'Description',
    };
    const legacy: MenuShareAppMessageOptions = {
      ...message, type: 'music', dataUrl: 'audio',
      success: () => undefined, cancel: () => undefined,
    };
    const options: LaunchAppOptions = {
      updateTimelineShareDataOptions: timeline,
      updateAppMessageShareDataOptions: message,
      onMenuShareAppMessageOptions: legacy,
    };
    const modernApp = LAUNCH_APP(options);
    modernApp.LAUNCH_APP_SHARE_TIMELINE(timeline);
    modernApp.LAUNCH_APP_SHARE_APP_MESSAGE(message);
    modernApp.LAUNCH_APP_SHARE_APP_MESSAGE(legacy);
    // @ts-expect-error New configuration excludes legacy media fields.
    const invalid: UpdateAppMessageShareDataOptions = { ...message, type: 'music' };
    // @ts-expect-error Optional callbacks must be omitted rather than undefined.
    const invalidCallback: UpdateTimelineShareDataOptions = { ...timeline, success: undefined };

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
    exactOptionalPropertyTypes: true,
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
