// 获取URL参数确定显示哪个表单
const urlParams = getUrlParams();
const formType = urlParams.get('form');

document.addEventListener('DOMContentLoaded', function() {
    // 根据参数显示相应的表单
    if (formType === 'add') {
        document.getElementById('add-form').style.display = 'block';
        loadExistingGroups();
    } else if (formType === 'delete') {
        document.getElementById('delete-form').style.display = 'block';
        updateDeleteOptions();
    }

    // 保存按钮点击事件
    document.getElementById('save-btn').addEventListener('click', saveBookmark);

    // 取消按钮点击事件
    document.getElementById('cancel-btn').addEventListener('click', function() {
        window.close();
    });

    // 确认删除按钮点击事件
    document.getElementById('confirm-delete-btn').addEventListener('click', deleteBookmark);

    // 取消删除按钮点击事件
    document.getElementById('cancel-delete-btn').addEventListener('click', function() {
        window.close();
    });

    // 使用当前页面地址按钮点击事件
    document.getElementById('use-current-page').addEventListener('click', function() {
        // 优先使用URL参数中的当前页面URL，如果没有则通过消息传递获取
        const currentUrl = urlParams.get('currentUrl');
        if (currentUrl) {
            document.getElementById('new-url').value = decodeURIComponent(currentUrl);
        } else {
            // 如果没有URL参数，则通过消息传递从父窗口获取当前页面URL
            chrome.runtime.sendMessage({action: "getCurrentPageUrl"}, function(response) {
                if (response && response.url) {
                    document.getElementById('new-url').value = response.url;
                }
            });
        }
    });

    // 添加分组按钮点击事件
    document.getElementById('add-group-btn').addEventListener('click', addNewGroup);
});

function loadExistingGroups() {
    chrome.runtime.sendMessage({action: "getBookmarks"}, function(response) {
        if (response && response.bookmarks) {
            const bookmarks = response.bookmarks;
            const allGroups = getAllGroups(bookmarks);
            
            const container = document.getElementById('existing-groups');
            container.innerHTML = '';
            
            allGroups.forEach(group => {
                const label = document.createElement('label');
                label.className = 'group-checkbox';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = group;
                
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(group));
                
                container.appendChild(label);
            });
        }
    });
}

function addNewGroup() {
    const input = document.getElementById('new-group-name');
    const groupName = input.value.trim();
    
    if (!groupName) {
        showMessage('请输入分组名称');
        return;
    }
    
    const container = document.getElementById('existing-groups');
    
    // 检查是否已存在该分组
    const existingCheckboxes = container.querySelectorAll('input[type="checkbox"]');
    for (const checkbox of existingCheckboxes) {
        if (checkbox.value === groupName) {
            showMessage('该分组已存在');
            return;
        }
    }
    
    const label = document.createElement('label');
    label.className = 'group-checkbox';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = groupName;
    checkbox.checked = true;
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(groupName));
    
    container.appendChild(label);
    
    input.value = '';
}

// 保存书签
function saveBookmark() {
    const title = document.getElementById('new-title').value.trim();
    const url = document.getElementById('new-url').value.trim();
    const desc = document.getElementById('new-desc').value.trim();

    if (!title) {
        showMessage('请输入标题');
        return;
    }
    if (!url) {
        showMessage('请输入网址');
        return;
    }

    if (!validateUrl(url)) {
        showMessage('请输入有效的网址');
        return;
    }

    // 获取选中的分组
    const selectedGroups = [];
    const checkboxes = document.querySelectorAll('#existing-groups input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        selectedGroups.push(checkbox.value);
    });

    // 发送消息到背景脚本保存书签
    chrome.runtime.sendMessage({
        action: "saveBookmark",
        data: { title, url, desc, groups: selectedGroups }
    }, function(response) {
        if (response && response.success) {
            showMessage('书签保存成功！');
            // 通知主页面刷新
            chrome.runtime.sendMessage({action: "refreshBookmarks"});
            window.close();
        } else {
            showMessage('保存失败，请重试。');
        }
    });
}

// 删除书签
function deleteBookmark() {
    const select = document.getElementById('bookmark-to-delete');
    const index = select.value;

    if (!index && index !== 0) {
        showMessage('请选择要删除的书签');
        return;
    }

    // 发送消息到背景脚本删除书签
    chrome.runtime.sendMessage({
        action: "deleteBookmark",
        data: { index: parseInt(index) }
    }, function(response) {
        if (response && response.success) {
            showMessage('书签删除成功！');
            // 通知主页面刷新
            chrome.runtime.sendMessage({action: "refreshBookmarks"});
            // 更新选项列表
            updateDeleteOptions();
        } else {
            showMessage('删除失败，请重试。');
        }
    });
}

// 更新删除选项
function updateDeleteOptions() {
    // 请求获取所有书签
    chrome.runtime.sendMessage({action: "getBookmarks"}, function(response) {
        if (response && response.bookmarks) {
            const select = document.getElementById('bookmark-to-delete');
            select.innerHTML = '';
            
            response.bookmarks.forEach((bookmark, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${bookmark.title} (${bookmark.url})`;
                select.appendChild(option);
            });
        }
    });
}
