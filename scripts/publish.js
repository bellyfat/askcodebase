const { execSync } = require('child_process');
const fs = require('fs');

const execCommand = (command) => {
    execSync(command, { stdio: 'inherit', stderr: 'inherit' })
}

execCommand('git add -A');
execCommand(`git commit -m "chore: prepare for publish"`);

execCommand('npm version minor');

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const version = packageJson.version;

execCommand('git add -A');

execCommand(`git commit -m "bump version to v${version}"`);

execCommand('git push');
