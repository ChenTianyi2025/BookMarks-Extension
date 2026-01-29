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
        width: 500,
        height: 700
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
function createBookmarkElement(bookmark, selectedGroups = []) {
    const div = document.createElement('div');
    div.className = 'bookmark';
    
    let groupsHtml = '';
    if (bookmark.groups && bookmark.groups.length > 0) {
        groupsHtml = `<div class="groups">${bookmark.groups.map(g => {
            const isSelected = selectedGroups.length === 0 || selectedGroups.includes(g);
            const opacityClass = isSelected ? 'group-tag-visible' : 'group-tag-transparent';
            return `<span class="group-tag ${opacityClass}">${g}</span>`;
        }).join('')}</div>`;
    }
    
    div.innerHTML = `
        <div class="title">${bookmark.title}</div>
        <div class="url">${bookmark.url}</div>
        <div class="desc">${bookmark.desc}</div>
        ${groupsHtml}
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

// 获取所有分组
function getAllGroups(bookmarks) {
    const groups = new Set();
    
    bookmarks.forEach(bookmark => {
        if (bookmark.groups && Array.isArray(bookmark.groups)) {
            bookmark.groups.forEach(group => groups.add(group));
        }
    });
    
    return Array.from(groups).sort();
}