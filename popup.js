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
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentUrl = tabs[0] && tabs[0].url ? tabs[0].url : '';
    chrome.windows.create({
      url: chrome.runtime.getURL(`popup_form.html?form=add&currentUrl=${encodeURIComponent(currentUrl)}`),
      type: 'popup',
      width: 400,
      height: 800
    });
  });
});

    // 删除按钮点击事件
    document.getElementById('delete-btn').addEventListener('click', function() {
        // 打开删除书签的独立弹窗
        chrome.windows.create({
            url: chrome.runtime.getURL('popup_form.html?form=delete'),
            type: 'popup',
            width: 400,
            height: 800
        });
    });
});

// 加载书签
function loadBookmarks(searchTerm = '') {
    const container = document.getElementById('bookmarks-container');
    container.innerHTML = '';
    
    chrome.storage.sync.get({bookmarks: []}, function(data) {
        const bookmarks = data.bookmarks;
        
        bookmarks.forEach(bookmark => {
            // 如果有搜索词，进行过滤
            if (searchTerm && 
                !bookmark.title.toLowerCase().includes(searchTerm) && 
                !bookmark.url.toLowerCase().includes(searchTerm) && 
                !(bookmark.desc && bookmark.desc.toLowerCase().includes(searchTerm))) {
                return;
            }
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
            
            container.appendChild(div);
        });
    });
}
