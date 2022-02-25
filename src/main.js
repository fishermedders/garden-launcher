// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from "path";
import url from "url";
import { app, Menu, ipcMain, shell } from "electron";
import appMenuTemplate from "./menu/app_menu_template";
import editMenuTemplate from "./menu/edit_menu_template";
import devMenuTemplate from "./menu/dev_menu_template";
import createWindow from "./helpers/window";

const { Client, Authenticator } = require('minecraft-launcher-core');
const launcher = new Client();
const msmc = require("msmc");
const fetch = require("node-fetch");

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from "env";

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== "production") {
  const userDataPath = app.getPath("userData");
  app.setPath("userData", `${userDataPath} (${env.name})`);
}

const setApplicationMenu = () => {
  const menus = [appMenuTemplate, editMenuTemplate];
  if (env.name !== "production") {
    menus.push(devMenuTemplate);
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

// We can communicate with our window (the renderer process) via messages.
const initIpc = () => {
  ipcMain.on("need-app-path", (event, arg) => {
    event.reply("app-path", app.getAppPath());
  });
  ipcMain.on("open-external-link", (event, href) => {
    shell.openExternal(href);
  });
  ipcMain.on("launch-client", (event, href) => {
    msmc.setFetch(fetch)
msmc.fastLaunch("raw",
    (update) => {
        //A hook for catching loading bar events and errors, standard with MSMC
        console.log("CallBack!!!!!")
        event.reply("mc-console", update)
    }).then(result => {
        //Let's check if we logged in?
        if (msmc.errorCheck(result)){
          event.reply("mc-console", result.reason)
            return;
        }
        //If the login works
        let opts = {
            clientPackage: null,
            // Pulled from the Minecraft Launcher core docs , this function is the star of the show
            authorization: msmc.getMCLC().getAuth(result),
            root: process.env.APPDATA + "\\.gardenclient" || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences/.gardenclient' : process.env.HOME + "/.local/share/.gardenclient"),
            version: {
                number: "1.18.1",
                type: "release"
            },
            memory: {
                max: "6G",
                min: "4G"
            }
        }
        event.reply("mc-console","Starting!")
        launcher.launch(opts);

        launcher.on('debug', (e) => event.reply("mc-console",e));
        launcher.on('data', (e) => event.reply("mc-console",e));
    }).catch(reason => {
        //If the login fails
        event.reply("mc-console","We failed to log someone in because : " + reason);
    })
  });
};

app.on("ready", () => {
  setApplicationMenu();
  initIpc();

  const mainWindow = createWindow("main", {
    width: 1000,
    height: 600,
    webPreferences: {
      // Two properties below are here for demo purposes, and are
      // security hazard. Make sure you know what you're doing
      // in your production app.
      nodeIntegration: true,
      contextIsolation: false,
      // Spectron needs access to remote module
      enableRemoteModule: env.name === "test"
    }
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "app.html"),
      protocol: "file:",
      slashes: true
    })
  );

  if (env.name === "development") {
    mainWindow.openDevTools();
  }
});

app.on("window-all-closed", () => {
  app.quit();
});
