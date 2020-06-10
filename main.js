// Handle setupevents as quickly as possible
const setupEvents = require('./installers/setupEvents')
if (setupEvents.handleSquirrelEvent()) {
   // Squirrel event handled and app will exit in 1000ms, so don't do anything else
   return;
}

const electron = require("electron");
const app = electron.app;
const path = require("path");
const url = require("url");
const Menu = electron.Menu;
const Tray = electron.Tray;
const iconPath = path.join(__dirname, "assets", "logo.png");

const storage = require("electron-json-storage");
const shell = electron.shell;

let window, systemTray;

app.setLoginItemSettings({
    openAtLogin: true,
    path: electron.app.getPath("exe")
})

// Creates the window
function createWindow() {
    window = new electron.BrowserWindow({
        icon: iconPath,
        width: 1920,
        height: 1080,
        backgroundColor: "#1f1f1f",
        autoHideMenuBar: true,
        fullscreen: true,
        webPreferences: {
            nodeIntegration: true
        }
    });
    window.loadURL(url.format({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file",
        slashes: true
    }));

    //window.webContents.openDevTools();

    window.on("closed", () => {
        window = null;
    });
}

// When the app starts, create the window and set an empty menu
app.on("ready", function() {
    createWindow();

    const menuTemplate = [];
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    const trayTemplate = [
        {
            label: "Fenster öffnen",
            click() {
                window.show();
            }
        },
        {
            label: "Fenster schließen",
            click() {
                window.hide();
            }
        },
        {
            label: "Neu laden",
            click() {
                window.reload();
            }
        },
        {
            label: "Konfigurieren",
            click() {
                shell.openExternal(storage.getDataPath() + "/userData.json");
            }
        },
        {
            label: "Beenden",
            click() {
                app.quit();
            }
        }
    ];
    const systemTrayMenu = Menu.buildFromTemplate(trayTemplate);
    systemTray = new Tray(iconPath);
    systemTray.setContextMenu(systemTrayMenu);
    systemTray.setToolTip("DK Dashboard");
    systemTray.on("click", function() {
        systemTrayMenu.popup();
    })

});

// For MacOS
app.on("activate", () => {
    if (window === null) {
        createWindow();
    }
});