// 工具函数集合

// URL参数解析
function getUrlParams() {
    return new URLSearchParams(window.location.search);
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

// 打开表单弹窗
function openFormPopup(formType, currentUrl = '') {
    let url = chrome.runtime.getURL(`popup_form.html?form=${formType}`);
    if (currentUrl) {
        url += `&currentUrl=${encodeURIComponent(currentUrl)}`;
    }
    
    chrome.windows.create({
        url: url,
        type: 'popup',
        width: 400,
        height: 800
    });
}

// 验证URL格式
function validateUrl(url) {
    if (!url) return false;
    
    // 添加http://前缀如果不存在
    const fullUrl = !url.startsWith('http://') && !url.startsWith('https://') 
        ? 'http://' + url 
        : url;
    
    // 简单的URL验证
    try {
        new URL(fullUrl);
        return true;
    } catch (e) {
        return false;
    }
}

// 显示提示消息
function showMessage(message, type = 'info') {
    alert(message);
}

// 创建书签元素
function createBookmarkElement(bookmark) {
    const div = document.createElement('div');
    div.className = 'bookmark';
    div.innerHTML = `
        <div class="title">${bookmark.title}</div>
        <div class="url">${bookmark.url}</div>
        <div class="desc">${bookmark.desc}</div>
    `;
    
    // 双击跳转
    div.addEventListener('dblclick', function() {
        chrome.tabs.create({url: bookmark.url});
    });
    
    return div;
}

// 过滤书签
function filterBookmarks(bookmarks, searchTerm) {
    if (!searchTerm) return bookmarks;
    
    return bookmarks.filter(bookmark => 
        bookmark.title.toLowerCase().includes(searchTerm) || 
        bookmark.url.toLowerCase().includes(searchTerm) || 
        (bookmark.desc && bookmark.desc.toLowerCase().includes(searchTerm))
    );
}
