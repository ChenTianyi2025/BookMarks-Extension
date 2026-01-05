// 加载保存的书签
document.addEventListener('DOMContentLoaded', function() {
    loadBookmarks();
    
    // 搜索框输入事件
    document.getElementById('search-input').addEventListener('input', function() {
        loadBookmarks(this.value.toLowerCase());
    });
    
    // 添加按钮点击事件
    document.getElementById('add-btn').addEventListener('click', function() {
        // 先获取当前活动标签页的URL，然后打开添加书签的独立弹窗
        getCurrentPageUrl(function(response) {
            const currentUrl = response.url || '';
            openFormPopup('add', currentUrl);
        });
    });

    // 删除按钮点击事件
    document.getElementById('delete-btn').addEventListener('click', function() {
        openFormPopup('delete');
    });
});

// 加载书签
function loadBookmarks(searchTerm = '') {
    const container = document.getElementById('bookmarks-container');
    container.innerHTML = '';
    
    chrome.storage.sync.get({bookmarks: []}, function(data) {
        const bookmarks = data.bookmarks;
        
        // 使用工具函数过滤书签
        const filteredBookmarks = filterBookmarks(bookmarks, searchTerm);
        
        filteredBookmarks.forEach(bookmark => {
            const bookmarkElement = createBookmarkElement(bookmark);
            container.appendChild(bookmarkElement);
        });
    });
}
