// 监听来自popup和popup_form的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "saveBookmark") {
        saveBookmark(request.data, sendResponse);
        return true; // 保持消息通道开放以进行异步响应
    } else if (request.action === "deleteBookmark") {
        deleteBookmark(request.data, sendResponse);
        return true;
    } else if (request.action === "getBookmarks") {
        getBookmarks(sendResponse);
        return true;
    } else if (request.action === "getCurrentPageUrl") {
        getCurrentPageUrl(sendResponse);
        return true;
    }
});

// 保存书签
function saveBookmark(data, callback) {
    chrome.storage.sync.get({bookmarks: []}, function(result) {
        const bookmarks = result.bookmarks;
        bookmarks.push(data);
        
        chrome.storage.sync.set({bookmarks: bookmarks}, function() {
            callback({success: true});
        });
    });
}

// 删除书签
function deleteBookmark(data, callback) {
    chrome.storage.sync.get({bookmarks: []}, function(result) {
        const bookmarks = result.bookmarks;
        bookmarks.splice(data.index, 1);
        
        chrome.storage.sync.set({bookmarks: bookmarks}, function() {
            callback({success: true});
        });
    });
}

// 获取所有书签
function getBookmarks(callback) {
    chrome.storage.sync.get({bookmarks: []}, function(result) {
        callback({bookmarks: result.bookmarks});
    });
}

// 获取当前页面URL
function getCurrentPageUrl(callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url) {
            callback({url: tabs[0].url});
        } else {
            callback({url: ""});
        }
    });
}