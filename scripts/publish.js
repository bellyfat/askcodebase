const { execSync } = require('child_process');

const execCommand = (command) => {
    execSync(command, { stdio: 'inherit', stderr: 'inherit' })
}

execCommand('git add -A');
execCommand(`git commit -m "bump: prepare for publish"`);
execCommand('npm version minor');
execCommand('git push');
