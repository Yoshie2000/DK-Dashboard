const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
  .then(createWindowsInstaller)
  .catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })

function getInstallerConfig () {
  console.log('Creating windows installer...')
  const rootPath = path.join(__dirname, '../../');
  const outPath = path.join(rootPath, 'release-builds')

  return Promise.resolve({
    appDirectory: path.join(outPath, 'dk_dashboard-win32-ia32'),
    authors: 'Patrick Leonhardt',
    description: 'Ein Dashboard vom DK und ein paar andere hilfreiche Funktionen',
    noMsi: true,
    outputDirectory: path.join(outPath, 'windows-installer'),
    exe: 'dk_dashboard.exe',
    setupExe: 'DK-Dashboard-Installer.exe',
    setupIcon: path.join(rootPath, 'assets', 'icons', 'win', 'icon.ico')
  })
}