import "./stylesheets/main.css";

// Everything below is just a demo. You can delete all of it.

import { ipcRenderer } from "electron";
import jetpack from "fs-jetpack";
import { greet } from "./hello_world/hello_world";
import env from "env";

var $ = require('jquery')

document.querySelector("#app").style.display = "block";
ipcRenderer.send("tx-max-ram")

/* We can communicate with main process through messages.
ipcRenderer.on("app-path", (event, appDirPath) => {
  // Holy crap! This is browser window with HTML and stuff, but I can read
  // files from disk like it's node.js! Welcome to Electron world :)
  const appDir = jetpack.cwd(appDirPath);
  const manifest = appDir.read("package.json", "json");
  document.querySelector("#author").innerHTML = manifest.author;
});
ipcRenderer.send("need-app-path");*/

document.getElementById("launch").addEventListener("click", function() {
  ipcRenderer.send("launch-client", { xmx: $("#ram").val() })
});

ipcRenderer.on("mc-console", (event, log) => {
  console.log(log)
});

ipcRenderer.on("rx-max-ram", (event, amount) => {
  $("#ram").attr("max", amount)
});

$('input[type=range]').on('input', function () {
  $(this).trigger('change');
  console.log("changed")
  $("#ram-amount").text($(this).val())
});