COPY_LINK_MENU_ITEM_ID = 'CopyLink';

chrome.contextMenus.removeAll();
chrome.contextMenus.create({
  id: COPY_LINK_MENU_ITEM_ID,
  title: "Copy Link as Rich Text",
  contexts: ["browser_action"],
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  switch (info.menuItemId) {
    case COPY_AS_PLAIN_MENU_ITEM_ID:
      emitCopyEvent('copy-plain-text', 'menu');
      copyTabLinkToClipboard(tab, false);
      break;

    case COPY_LINK_MENU_ITEM_ID:
      emitCopyEvent('html-copy-link', 'menu');
      copyTabLinkToClipboard(tab, true);
      break;

    default:
      throw Error('Unknown menu item' + info.menuItemId);
  }
});

// onClicked action gives us the tab without any permissions needed.
chrome.browserAction.onClicked.addListener(function(tab) {
  copyTabLinkToClipboard(tab, true);
});

chrome.commands.onCommand.addListener(function(command) {
  switch (command) {
    case 'copy-link':
      getActiveTab(function(tab) {
        return copyTabLinkToClipboard(tab, true);
      });
      break;

    case 'copy-as-plain':
      getActiveTab(function(tab) {
        return copyTabLinkToClipboard(tab, False);
      })

    default:
      throw new Error('Unknown command: ' + command);
  }
});

function emitPermissionsEvent(permissions, granted) {
  category = granted ? 'permissions-granted' : 'permissions-rejected';
}

function getActiveTab(callback) {
  requestPermissions('tabs', function() {
    chrome.tabs.query({
        lastFocusedWindow: true,
        active: true
      }, function(tab) {
        if (tab && tab.length > 0) {
          callback(tab[0]);
        } else {
          showNotification('Error', 'Unable to get link: No active tab.');
        }
      });
  });
}

function requestPermissions(permission, callback) {
  chrome.permissions.request({
    permissions: [permission]
  }, function(granted) {
    if (granted) {
      emitPermissionsEvent(permission, true);
      callback();
    } else {
      emitPermissionsEvent(permission, false);
      if (permission != "notifications") {
        showNotification('Error', 'Unable to get link: User rejected tabs permissions request.');
      } else {
        console.log('Unable to show the message: Notifications permissions rejected.');
      }
    }
  });
}

function showNotification(title, text) {
  requestPermissions('notifications', function() {
    var opt = {
      type: 'basic',
      title: title,
      message: text,
      iconUrl: 'icon.png'
    };
    chrome.notifications.create("", opt, function() {});
  });
}

function copyTabLinkToClipboard(tab, as_html) {
  var url = tab.url;
  var title = tab.title;
  console.log('Copying to clipboard', url, title);
  if (as_html) {
    copyLinkToClipboard(url, title);
  } else {
    copyLinkAsPlainTextToClipboard(url, title);
  }
}

function copyLinkAsPlainTextToClipboard(url, title) {
  var span = document.createElement('span');
  span.innerText = title + ' ' + url;
  document.body.appendChild(span);
  try {
    span.focus();
    document.execCommand('SelectAll');
    document.execCommand("Copy", false, null);
    showNotification('Link is ready to be pasted', '"' + title + '" was copied to clipboard');
  } finally {
    span.remove();
  }
}

function copyLinkToClipboard(url, title) {
  var link = document.createElement('a');
  link.innerText = title.toUpperCase();
  link.setAttribute('href', url);
  document.body.appendChild(link);
  try {
    link.focus();
    document.execCommand('SelectAll');
    document.execCommand("Copy", false, null);
    showNotification('Link is ready to be pasted', '"' + title + '" was copied to clipboard');
  } finally {
    link.remove();
  }
}