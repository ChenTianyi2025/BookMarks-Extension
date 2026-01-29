// 加载保存的书签
document.addEventListener('DOMContentLoaded', function() {
    loadBookmarks();
    loadGroupFilters();
    
    // 搜索框输入事件
    document.getElementById('search-input').addEventListener('input', function() {
        loadBookmarks(this.value.toLowerCase());
    });
    
    // 显示全部按钮点击事件
    document.getElementById('show-all-groups').addEventListener('click', function() {
        clearGroupFilters();
        loadBookmarks();
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

    // 导出按钮点击事件
    document.getElementById('export-btn').addEventListener('click', function() {
        exportBookmarks();
    });

    // 导入按钮点击事件
    document.getElementById('import-btn').addEventListener('click', function() {
        document.getElementById('import-file').click();
    });

    // 文件选择事件
    document.getElementById('import-file').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            importBookmarks(file);
        }
        e.target.value = '';
    });

    // 监听刷新请求
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === "refreshBookmarks") {
            loadBookmarks(document.getElementById('search-input').value.toLowerCase());
            loadGroupFilters();
        }
    });

    // 监听存储变化，自动刷新书签
    chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (namespace === 'sync' && changes.bookmarks) {
            setTimeout(() => {
                loadBookmarks(document.getElementById('search-input').value.toLowerCase());
                loadGroupFilters();
            }, 100);
        }
    });
});

// 加载书签
function loadBookmarks(searchTerm = '') {
    const container = document.getElementById('bookmarks-container');
    container.innerHTML = '';
    
    
    // 获取当前选中的分组
    const activeButtons = document.querySelectorAll('.filter-btn.active');
    const selectedGroups = Array.from(activeButtons).map(btn => btn.dataset.group);
    
    chrome.storage.sync.get({bookmarks: []}, function(data) {
        const bookmarks = data.bookmarks;
        
        // 使用工具函数过滤书签
        let filteredBookmarks = filterBookmarks(bookmarks, searchTerm);
        
        // 应用分组筛选
        filteredBookmarks = filterByGroups(filteredBookmarks);
        
        filteredBookmarks.forEach(bookmark => {
            const bookmarkElement = createBookmarkElement(bookmark, selectedGroups);
            container.appendChild(bookmarkElement);
        });
    });
}

function loadGroupFilters() {
    chrome.storage.sync.get({bookmarks: []}, function(data) {
        const bookmarks = data.bookmarks;
        const allGroups = getAllGroups(bookmarks);
        
        const container = document.getElementById('group-filters');
        container.innerHTML = '';
        
        allGroups.forEach(group => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = group;
            button.dataset.group = group;
            
            button.addEventListener('click', function() {
                toggleGroupFilter(this);
                loadBookmarks(document.getElementById('search-input').value.toLowerCase());
            });
            
            container.appendChild(button);
        });
    });
}

function toggleGroupFilter(button) {
    button.classList.toggle('active');
}

function clearGroupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(button => button.classList.remove('active'));
}

function filterByGroups(bookmarks) {
    const activeButtons = document.querySelectorAll('.filter-btn.active');
    
    if (activeButtons.length === 0) {
        return bookmarks;
    }
    
    const selectedGroups = Array.from(activeButtons).map(btn => btn.dataset.group);
    
    return bookmarks.filter(bookmark => {
        if (!bookmark.groups || bookmark.groups.length === 0) {
            return false;
        }
        return bookmark.groups.some(group => selectedGroups.includes(group));
    });
}

function exportBookmarks() {
    chrome.storage.sync.get({bookmarks: []}, function(data) {
        const bookmarks = data.bookmarks;
        
        if (bookmarks.length === 0) {
            showMessage('没有书签可以导出', 'warning');
            return;
        }
        
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            bookmarks: bookmarks
        };
        
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        
        const now = new Date();
        const dateString = now.toISOString().split('T')[0];
        const fileName = `bookmarks_${dateString}.json`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showMessage(`成功导出 ${bookmarks.length} 个书签`, 'success');
    });
}

function importBookmarks(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!validateImportData(data)) {
                showMessage('导入失败：数据格式不正确', 'error');
                return;
            }
            
            const confirmImport = confirm(
                `找到 ${data.bookmarks.length} 个书签。\n\n` +
                `是否确定导入这些书签？`
            );
            
            if (!confirmImport) {
                showMessage('已取消导入', 'info');
                return;
            }
            
            const importMode = confirm(
                `请选择导入模式：\n\n` +
                `点击"确定"：合并模式（保留现有书签，导入新书签）\n` +
                `点击"取消"：替换模式（完全替换现有书签）`
            );
            
            chrome.storage.sync.get({bookmarks: []}, function(result) {
                let finalBookmarks;
                let message;
                
                if (importMode) {
                    finalBookmarks = mergeBookmarks(result.bookmarks, data.bookmarks);
                    message = `成功导入 ${data.bookmarks.length} 个书签（合并模式）`;
                } else {
                    finalBookmarks = data.bookmarks;
                    message = `成功导入 ${data.bookmarks.length} 个书签（替换模式）`;
                }
                
                chrome.storage.sync.set({bookmarks: finalBookmarks}, function() {
                    setTimeout(() => {
                        loadBookmarks();
                        loadGroupFilters();
                        showMessage(message, 'success');
                    }, 100);
                });
            });
        } catch (error) {
            showMessage('导入失败：无法解析JSON文件', 'error');
            console.error('Import error:', error);
        }
    };
    
    reader.onerror = function() {
        showMessage('导入失败：读取文件出错', 'error');
    };
    
    reader.readAsText(file);
}

function validateImportData(data) {
    if (!data || typeof data !== 'object') {
        return false;
    }
    
    if (!Array.isArray(data.bookmarks)) {
        return false;
    }
    
    for (const bookmark of data.bookmarks) {
        if (!bookmark.title || !bookmark.url) {
            return false;
        }
        
        if (!validateUrl(bookmark.url)) {
            return false;
        }
    }
    
    return true;
}

function mergeBookmarks(existingBookmarks, importedBookmarks) {
    const urlMap = new Map();
    
    existingBookmarks.forEach(bookmark => {
        if (!bookmark.groups) {
            bookmark.groups = [];
        }
        urlMap.set(bookmark.url, bookmark);
    });
    
    importedBookmarks.forEach(bookmark => {
        if (!bookmark.groups) {
            bookmark.groups = [];
        }
        urlMap.set(bookmark.url, bookmark);
    });
    
    return Array.from(urlMap.values());
}