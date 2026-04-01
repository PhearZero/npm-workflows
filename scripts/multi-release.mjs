import multiSemanticRelease from 'multi-semantic-release';
import fs from 'fs';
import path from 'path';

async function run() {
  const flags = {
    dryRun: process.argv.includes('--dry-run'),
    ignorePrivatePackages: true,
    cwd: process.cwd(),
  };

  try {
    // Manually find package.json files
    const allPaths = [];
    if (fs.existsSync('packages')) {
      const pkgs = fs.readdirSync('packages');
      for (const pkg of pkgs) {
        const pkgPath = path.join('packages', pkg, 'package.json');
        if (fs.existsSync(pkgPath)) {
          allPaths.push(path.resolve(pkgPath));
        }
      }
    }
    if (fs.existsSync('build/package.json')) {
      allPaths.push(path.resolve('build/package.json'));
    }

    // Filter out private packages
    const paths = allPaths.filter(p => {
      try {
        const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
        return !pkg.private;
      } catch (e) {
        return false;
      }
    });
    
    console.log('Detected packages for release:', paths);
    
    if (paths.length === 0) {
      console.log('No public packages found for release.');
      return;
    }
    
    const results = await multiSemanticRelease(paths, flags);
    
    const released = results && Array.isArray(results) && results.some(result => result && result.nextRelease);
    
    if (released && process.env.GITHUB_OUTPUT && !flags.dryRun) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `released=true\n`);
      console.log('Detected a release, setting GITHUB_OUTPUT released=true');
    }
  } catch (error) {
    console.error('[multi-release-wrapper]:', error);
    process.exit(1);
  }
}

run();
