const { app, BrowserWindow, ipcMain, session,webContents, } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
// const axios = require('axios');
// const { spawn } = require('child_process');
let requestQueue = []; // 用来存储点击事件的title和num


let windows = {};

function createWindow(options, id) {
    options.autoHideMenuBar=true;
    const win = new BrowserWindow(options);
    windows[id] = win;
    win.on('closed', () => {
        delete windows[id];
    });
    return win;
}

function loadContent(options, urlOrPath, id) {
    if (options == 1) {//local file
        windows[id].loadFile(urlOrPath);
    } else if (options == 2) {//load from url
        console.log(`load ${urlOrPath}to${id}`);
        windows[id].loadURL(urlOrPath);
    } else {
        return false
    }
    return true;
}



app.on('ready', () => {
    ipcMain.on('create-window', (event, id, options,url) => {
        if (!windows[id]) {
            createWindow(options, id);
            windows[id].loadURL(url);
        }
    });

    ipcMain.on('create-window2', (event,url) => {
        if (!windows[url]) {
            const options = {
                width: 500,
                height: 1200,
                fullscreen: false,
                title: "loading",
                frame: true,
                alwaysOnTop: false,
                resizable: true,
                webPreferences: {
                    preload: path.resolve(__dirname, './preload2.js')
                }
            }
            createWindow(options, url);
            console.log(typeof(url)," : ",url);
            windows[url].loadURL(url);
            //windows[id].setIgnoreMouseEvents(true);
            setTimeout(function(){one(windows[url]);},5000);
            
        }
    });

    ipcMain.on('close-window', (event, id) => {
        if (windows[id]) {
            windows[id].close();
        }
    });

    ipcMain.on('minimize-window', (event, id) => {
      if (windows[id]) {
          windows[id].minimize();
      }
    });

    ipcMain.on('set_window_position', (event, id, x, y) => {
      if (windows[id]) {
          windows[id].setPosition(x, y);
      }
    });

    ipcMain.on('set_window_size', (event, id, width, height) => {
      if (windows[id]) {
          windows[id].setPosition(width, height);
      }
    });


    createWindow({
        width: 700,
        height: 370,
        fullscreen: false,
        title: "loading",
        frame: true,
        alwaysOnTop: false,
        resizable: false,
        //backgroundColor: '#00000000',
        webPreferences: {
            preload: path.resolve(__dirname, './preload.js')
        }
    }, 0);
    loadContent(1, "./startPage.html", 0);

    const ses = session.defaultSession;

    ses.webRequest.onBeforeRequest((details, callback) =>{
    //ses.webRequest.onCompleted((details) => {
      if (details.resourceType === 'media') {//if (details.resourceType === 'media') {
        console.log('Media request completed:', details);
        
        // 提取文件扩展名
        const { title, num } = requestQueue.shift(); // 从队列中获取title和num
        const url = new URL(details.url);
        const pathname = url.pathname;
        const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
        const queryIndex = filename.indexOf('?');
        const cleanFilename = queryIndex === -1 ? filename : filename.substring(0, queryIndex);
        const extension = cleanFilename.substring(cleanFilename.lastIndexOf('.') + 1);
        const saveFilename = `${num}_${title}.${extension}`;

        const savePath = path.join("D:\\Download\\aaa",saveFilename);
        
        // 根据 URL 协议选择 HTTP 或 HTTPS 模块
        const client = url.protocol === 'https:' ? https : http;
        
        // 发起请求来获取响应体
        client.get(details.url, (res) => {
          const fileStream = fs.createWriteStream(savePath);
          res.pipe(fileStream);
          
          fileStream.on('finish', () => {
            fileStream.close();
            console.log(`Saved media file as ${savePath}`);
          });
        }).on('error', (err) => {
          console.error('Error fetching media file:', err);
        });
      }else{
        // 继续请求
        callback({});
      }
    });
});


app.on('window-all-closed', () => {
    app.quit();
});




async function one(win){
    const pages_btn = Number(await get_num(win, 'page-link N_t'));
    const pages = Number(await get_text(win, 'page-link N_t',(pages_btn-2)));
    for (let index = 2; index <= pages; index++) {
        while (true) {
            console.log("page index:",index);
            win.webContents.send("simulate-input-class", "control-input N_t", 0,index);
            await new Promise(resolve => setTimeout(resolve, 30));
            win.webContents.send("simulate-click-class", "btn N_t", 0);
            await new Promise(resolve => setTimeout(resolve, 500));
            const current_page =  Number(await get_text(win,"page-item active N_t",0));
            console.log("current_page:",current_page,",index:",index);
            if (current_page==index) {
                break;
            }
        }
        const items = Number(await get_num(win, 'icon-wrapper _nO'));
        for (let index2 = 0; index2 < items; index2++) {
            const title = await get_text(win,"title _nO",index2);
            const num = await get_text(win,"num _nO",index2);
            console.log(num,":",title);
            // 将title和num加入队列
            requestQueue.push({ title, num });
            win.webContents.send("simulate-click-class","icon-wrapper _nO",index2);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

    }
    //setTimeout(function(){win.webContents.send('simulate-click-class', 'icon-wrapper _nO',2);},2000)
}


function get_num(win,className) {
    return new Promise((resolve) => {
        ipcMain.once('get-num-reply', (event, num) => {
            resolve(num);
        });
        win.webContents.send('get-num', className);
    });
}

function get_text(win,className, index) {
    return new Promise((resolve) => {
        ipcMain.once('get-text-reply', (event, text) => {
            resolve(text);
        });
        win.webContents.send('get-text', { className, index });
    });
}














/*
const request = require('request');

// ---- 下载类 ---- //
function StreamDownload() {
    // 声明下载过程回调函数
    this.downloadCallback = null;
}

// 下载进度
StreamDownload.prototype.showProgress = function (received, total) {
    const percentage = (received * 100) / total;
    // 用回调显示到界面上
    this.downloadCallback('progress', percentage);
};

// 下载过程
StreamDownload.prototype.downloadFile = function (patchUrl, baseDir, callback, fileName) {
    this.downloadCallback = callback; // 注册回调函数

    const downloadFile = fileName; // 下载文件名称，也可以从外部传进来

    let receivedBytes = 0;
    let totalBytes = 0;

    const req = request({
        method: 'GET',
        uri: patchUrl
    });

    const out = fs.createWriteStream(path.join(baseDir, downloadFile));
    req.pipe(out);

    req.on('response', (data) => {
        // 更新总文件字节大小
        totalBytes = parseInt(data.headers['content-length'], 10);
    });

    req.on('data', (chunk) => {
        // 更新下载的文件块字节大小
        receivedBytes += chunk.length;
        this.showProgress(receivedBytes, totalBytes);
    });

    req.on('end', () => {
        console.log('下载已完成，等待处理');
        this.downloadCallback('finished', 100); // 将完成百分比设为 100
    });
}
*/