console.log("preload2")

const {contextBridge,ipcRenderer} = require("electron")

ipcRenderer.on('simulate-click-id', (event, elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.click();
    }
});

ipcRenderer.on('simulate-click-class', (event, elementClass,index) => {
    const element = document.getElementsByClassName(elementClass)[index];
    if (element) {
        element.click();
    }
});

ipcRenderer.on('simulate-input-class', (event, elementClass,index,value) => {
    const element = document.getElementsByClassName(elementClass)[index];
    if (element) {
        element.value=value;
        const event = new Event('change', { bubbles: true });
        element.dispatchEvent(event);
    }
});



contextBridge.exposeInMainWorld('electron', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
});

window.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.on('get-num', (event, className) => {
        const elements = document.getElementsByClassName(className);
        //console.log("elements:",elements);
        ipcRenderer.send('get-num-reply', elements.length);
    });

    ipcRenderer.on('get-text', (event, { className, index }) => {
        const elements = document.getElementsByClassName(className);
        const text = elements[index]?.innerText || '';
        //const text = document.getElementsByClassName(className)[index];
        //console.log("elements:",elements);
        //console.log("text:",text);
        ipcRenderer.send('get-text-reply', text);
    });

});



/*
contextBridge.exposeInMainWorld("injector",{
    version:process.versions.electron,
    InElectron:true,
})*/
setInterval(function (){if ((document.getElementsByClassName("xui-modal-mask fade-entered zj_").length)!=0) {document.getElementsByClassName("xui-modal-closeBtn zj_")[0].click()}},10);