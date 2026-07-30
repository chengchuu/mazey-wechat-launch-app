const { parseGitHubRepository, toJavaScriptGlobalName } = require('mazey');

function packageDetails(pkg) {
  if (typeof pkg.name !== 'string' || !pkg.name.trim()) {
    throw new Error('package.json must define a package name');
  }

  const bundleBaseName = pkg.name.split('/').filter(Boolean).at(-1);
  return {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    license: pkg.license,
    bundleBaseName,
    iifeGlobal: toJavaScriptGlobalName(bundleBaseName),
    installCommand: `npm install ${pkg.name}`,
  };
}

function repositoryDetails(repository) {
  const rawUrl = typeof repository === 'string' ? repository : repository?.url;
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error('package.json must define a GitHub repository URL');
  }
  try {
    return parseGitHubRepository(rawUrl);
  } catch {
    throw new Error(`Cannot derive GitHub repository identity from ${rawUrl}`);
  }
}

module.exports = { packageDetails, repositoryDetails };
