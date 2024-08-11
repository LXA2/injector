console.log("preload")

const {contextBridge,ipcRenderer} = require("electron")

ipcRenderer.on('simulate-click-id', (event, elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.click();
    }
});

ipcRenderer.on('simulate-click-class', (event, elementId,index) => {
    const element = document.getElementsByClassName(elementId)[index];
    if (element) {
        element.click();
    }
});


contextBridge.exposeInMainWorld("injector",{
    version:process.versions.electron,
    InElectron:true,
    //onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_event, value) => callback(value)),
    //onUpdateError: (callback) => ipcRenderer.on('update-err', (_event, value) => callback(value)),
    createWindow:(windowConfig,id,url) => {
        ipcRenderer.send("create-window",id,windowConfig,url);
    },
    createWindow2:(url) => {//unfocusable window
        ipcRenderer.send("create-window2",url);
    },
    closeWindow:(id)=>{
        ipcRenderer.send('close-window', id);
    },
    minimizeWindow:(id)=>{
        ipcRenderer.send('minimize-window', id);
    },
    /*changeWindowPosition:(id,x,y)=>{
        ipcRenderer.send('set_window_position', id,x,y);
    },
    changeWindowPosition:(id,width,height)=>{
        ipcRenderer.send('set_window_size', id,width,height);
    }*/
})

