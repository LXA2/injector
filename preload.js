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

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('select-path').addEventListener('click', () => {
        ipcRenderer.invoke('open-path-dialog').then((path) => {
            if (path) {
                document.getElementById('selected-path').value = path;
                if (document.getElementById("url").value!=""){
                    document.getElementById("btn1").removeAttribute("disabled");
                    document.getElementById("btn1").style.cursor="default";
                }else{
                    document.getElementById("btn1").setAttribute("disabled",true);
                    document.getElementById("btn1").style.cursor="not-allowed";
                }
            }
        });
    });
    document.getElementById('url').addEventListener('input', () => {
        if(this.value!=""&&document.getElementById("selected-path").value!=""){
            document.getElementById("btn1").removeAttribute("disabled");
            document.getElementById("btn1").style.cursor="default";
        }
        else{
            document.getElementById("btn1").setAttribute("disabled",true);
            document.getElementById("btn1").style.cursor="not-allowed";
        }
    });
    document.getElementById('btn2').addEventListener('click', () => {
        ipcRenderer.send('clear_data');
    });
})