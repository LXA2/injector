const { app, BrowserWindow, ipcMain, session,dialog,webContents, } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
// const axios = require('axios');
// const { spawn } = require('child_process');
let requestQueue = []; // 用来存储点击事件的title和num
var download_path = "";
var current_url = "";


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




// 假设这是从浏览器控制台获取到的复杂 Cookie 字符串
const cookieString = "_xmLog=h5&35dcfc18-3ac6-4551-b6ad-fcbe4bee5e80&2.4.20; wfp=ACNiY2U0ODJjMzdiNmEwMjIyTD95YiEj9HJ4bXdlYl93d3c; 1&remember_me=y; xm-page-viewid=ximalaya-web; DATE=1723278332650; crystal=U2FsdGVkX19Zvr0Cpdk3WG2qebcZhqjaFXSLygrtHtntio6Kj/Lnp2AoRgBEfu0HdC4gsgSgiwGrM3hihg5BLcqjSggUXXh/ySaH33SoTy5O/VRjpXxhyPVreVK0G9pUqeUiy7mvZcDyhaglnMLo3Mx3wzUFFQ1TtI/YG/xu9kKYPDfAUW7Z7vjwmBBfIkfFkSnYV1Iq4UZN2/2YY2jBXj3trbq5xjyBp9oS+k7R0GWk8q1bhpydWVElGp1ZmS3G; HMACCOUNT=BB8D874B3414BB4A; impl=www.ximalaya.com.login; Hm_lvt_4a7d8ec50cfd6af753c4f8aee3425070=1723367616,1723368037,1723371496,1723453543; Hm_lpvt_4a7d8ec50cfd6af753c4f8aee3425070=1723530061; cmci9xde=U2FsdGVkX1/GC9tttpIp1Hj9EVQajvgfqRx3GnmFdm16H/JhCZiEtQjdxXPCTNwX6DrpbOg73wH/TEI7IjY6Fw==; pmck9xge=U2FsdGVkX1/OQN3TuifT23/TLEKU32VYX2sksSg1bUc=; assva6=U2FsdGVkX1+Wdx6AojCGh9d9sF5uxSJI+TpTAUWf7Xc=; assva5=U2FsdGVkX1+ruGJsWZiTidsNhVBAg/gU05yoSujRWsytv09hoE70bs8Rm5+Gq/6JH10+r6Mk5PXb4/uHeJ5PZw==; vmce9xdq=U2FsdGVkX19folyPpuw26VsyK8oWDi1lQw1qV8noFXJ8zoVctDc77Jam/b4fL8wtWTx83bLL3vjG++N0KJPnJCKcqzZSePLVUfsNL7uHbatunBic1sfbKTYOtMTyLLLjasefd0V2PUdRPq1q+Y6ZFalr7hL5G4BTsaiqlMu/Xa8=; web_login=1723531927840";

// 将Cookie字符串解析为对象列表
function parseComplexCookieString(cookieString) {
    return cookieString.split('; ').map(cookiePart => {
        const [name, value] = cookiePart.split('=');
        console.log({ name, value });
        return { name, value };
    });
}

// 在主进程中设置多个Cookie
async function setCookies(cookies) {
    try {
        const cookiePromises = cookies.map(cookie => {
            return session.defaultSession.cookies.set({
                url: 'https://www.ximalaya.com',  // 适当替换成正确的域名
                name: cookie.name,
                value: cookie.value,
                path: '/',  // 如果有特定路径，应该替换为正确的路径
                expirationDate: Math.floor(Date.now() / 1000) + 36000000  // 设置一个默认过期时间，或根据需要调整
            });
        });

        await Promise.all(cookiePromises);
        console.log('All cookies set successfully');
    } catch (error) {
        console.error('Failed to set cookies:', error);
    }
}




app.on('ready',() => {
    ipcMain.on('create-window', (event, id, options,url) => {
        if (!windows[id]) {
            createWindow(options, id);
            windows[id].loadURL(url);
        }
    });

    ipcMain.on('create-window2', (event,url) => {
        if (!windows[url]) {
            const options = {
                width: 720,
                height: 1920,
                fullscreen: false,
                title: "loading",
                frame: true,
                alwaysOnTop: false,
                resizable: true,
                webPreferences: {
                    preload: path.resolve(__dirname, './preload2.js'),
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0',
                }
            }
            // clearCookiesAndLocalStorage();
            // const cookies = parseComplexCookieString(cookieString);
            // setCookies(cookies);
            createWindow(options, url);
            console.log(typeof(url)," : ",url);
            windows[url].loadURL(url);
            //windows[id].setIgnoreMouseEvents(true);
            current_url = url;
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

    ipcMain.handle('open-path-dialog', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile', 'openDirectory']
        });
        
        if (result.canceled) {
            return null;
        } else {
            download_path = result.filePaths[0];
            return result.filePaths[0];
        }
    });

    ipcMain.on('clear_data', (event) => {
        clearCookiesAndLocalStorage();
    });


    createWindow({
        width: 700,
        height: 370,
        fullscreen: false,
        title: "loading",
        frame: true,
        alwaysOnTop: false,
        //resizable: false,
        //backgroundColor: '#00000000',
        webPreferences: {
            preload: path.resolve(__dirname, './preload.js')
        }
    }, 0);
    loadContent(1, "./startPage.html", 0);

    // session.defaultSession.clearStorageData({
    //     storages: ['cookies']
    // }).then(() => {
    //     console.log('All cookies cleared');
    // });

    const ses = session.defaultSession;
    console.log("user agent:",ses.getUserAgent());

    ses.webRequest.onBeforeRequest(async(details, callback) =>{
      /*if (details.resourceType === 'media') {//if (details.resourceType === 'media') {
        console.log('Media request completed:', details);
        
        // 提取文件扩展名
        const { title, num ,duration,timeStamp} = requestQueue.shift(); // 从队列中获取title和num
        const url = new URL(details.url);
        const pathname = url.pathname;
        const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
        const queryIndex = filename.indexOf('?');
        const cleanFilename = queryIndex === -1 ? filename : filename.substring(0, queryIndex);
        const extension = cleanFilename.substring(cleanFilename.lastIndexOf('.') + 1);
        const saveFilename = `${num}_${title}.${extension}`;

        const savePath = path.join("E:\\dqdg",saveFilename);

        
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
      }*/



        if (details.resourceType === 'media') {
            //console.log('Media request intercepted:', details.url);
            // 获取当前请求的duration
            const requestDuration = parseInt(getQueryParameter(details.url, 'duration'), 10);
            const requestTimestamp = generateTimestamp();
            const ttt0 = await get_text(windows[current_url],"xm-player-playtime",0);
            var ttt = ttt0.split(":");
            const duration_page = Number(ttt[ttt.length-2])*60+Number(ttt[ttt.length-1]);
            console.log("duration:",duration_page,":",typeof(duration_page));
            // 检查队列
            while (requestQueue.length > 0) {
                const { title, num, timeStamp} = requestQueue[0]; // 读取第一个内容，不shift
                // 检查时间戳是否有效
                //console.log("requestTimestamp:",requestTimestamp,"timeStamp:",timeStamp);
                const timeDifference = (Number(requestTimestamp) - Number(timeStamp));
                //console.log("timeDifference:",timeDifference);
                if (timeDifference >= 0 && timeDifference <= 1000) {
                    //console.log("time in range");
                    // 检查duration是否匹配
                    if (requestDuration == duration_page) {
                        //console.log("duration correct");
                        // 通过验证，开始下载
                        const { pathname } = new URL(details.url);
                        const filename = path.basename(pathname).split('?')[0];
                        const extension = path.extname(filename);
                        const saveFilename = `${num}_${title}${extension}`;
                        const savePath = path.join(download_path, saveFilename);//("E:\\dqdg", saveFilename);
                        // 下载文件
                        const client = details.url.startsWith('https') ? https : http;
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
                        // 移除已处理的队列项
                        requestQueue.shift();
                        break;
                    } else {
                        console.error("ERROR:  duration incorrect")
                        // 如果duration不匹配，检查时间戳差值并删除不符合项
                        requestQueue.shift();
                        continue;
                    }
                } else {
                    if (timeDifference > 1000) {
                        console.error("ERROR:  time out of range")
                        requestQueue.shift(); // 删除该项
                        continue;
                    } else {
                        break;
                    }
                }
            }
        }
        else{
            // 继续请求
            callback({});
          }
    });
});


app.on('window-all-closed', () => {
    app.quit();
});


function clearCookiesAndLocalStorage() {
    session.defaultSession.clearStorageData(null, (error) => {
      if (error) console.error(error);
      else console.log('Cookies and localStorage have been cleared');
    });
  }


// 生成一个与当前时间相关的时间戳
const generateTimestamp = () => Date.now();

// 定义一个函数来提取 URL 中的查询参数
const getQueryParameter = (url, param) => {
    const urlObj = new URL(url);
    return urlObj.searchParams.get(param);
};




async function one(win){
    const pages_btn = Number(await get_num(win, 'page-link N_t'));
    const pages = Number(await get_text(win, 'page-link N_t',(pages_btn-2)));

    for (let index = 17; index <= pages; index++) {
    //for (let index = 12; index < 17; index++) {

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
            const timeStamp = Date.now();
            //console.log(num,":",title,";",timeStamp);
            // 将title和num加入队列
            requestQueue.push({ title,num,timeStamp});
            //console.log(requestQueue);
            win.webContents.send("simulate-click-class","icon-wrapper _nO",index2);
            await new Promise(resolve => setTimeout(resolve, 1500));
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



