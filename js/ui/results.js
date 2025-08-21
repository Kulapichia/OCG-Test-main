function updateStats() {
	// 使用UI健康度优化的节流更新
	if (typeof uiHealthOptimizer !== 'undefined') {
		uiHealthOptimizer.throttleStatsUpdate(() => updateStatsImmediate());
	} else {
		updateStatsImmediate();
	}
}

function updateStatsImmediate() {
	const validKeys = allKeysData.filter(k => k.status === 'valid');
	const invalidKeys = allKeysData.filter(k => k.status === 'invalid');
	const rateLimitedKeys = allKeysData.filter(k => k.status === 'rate-limited');
	const paidKeys = allKeysData.filter(k => k.status === 'paid');
	const testingKeys = allKeysData.filter(k => k.status === 'testing');
	const retryingKeys = allKeysData.filter(k => k.status === 'retrying');
	const pendingKeys = allKeysData.filter(k => k.status === 'pending');

	document.getElementById('totalCount').textContent = allKeysData.length;
	document.getElementById('validCount').textContent = validKeys.length;
	if (document.getElementById('paidCount')) {
		document.getElementById('paidCount').textContent = paidKeys.length;
	}
	document.getElementById('invalidCount').textContent = invalidKeys.length;
	document.getElementById('rateLimitedCount').textContent = rateLimitedKeys.length;
	document.getElementById('testingCount').textContent = testingKeys.length + pendingKeys.length;
	document.getElementById('retryingCount').textContent = retryingKeys.length;
}

function updateKeyLists() {
	// 使用UI健康度优化的节流更新
	if (typeof uiHealthOptimizer !== 'undefined') {
		uiHealthOptimizer.throttleListUpdate('all', () => updateKeyListsImmediate());
	} else {
		updateKeyListsImmediate();
	}
}

function updateKeyListsImmediate() {
	const validKeys = allKeysData.filter(k => k.status === 'valid');
	const invalidKeys = allKeysData.filter(k => k.status === 'invalid');
	const rateLimitedKeys = allKeysData.filter(k => k.status === 'rate-limited');
	const paidKeys = allKeysData.filter(k => k.status === 'paid');
	
	// 对大列表使用虚拟化
	if (typeof uiHealthOptimizer !== 'undefined' && allKeysData.length > 500) {
		uiHealthOptimizer.createVirtualList('allKeys', allKeysData, createKeyItemElement);
	} else {
		updateKeyList('allKeys', allKeysData);
	}
	
	// 其他列表正常更新（通常较小）
	updateKeyList('validKeys', validKeys);
	updateKeyList('invalidKeys', invalidKeys);
	updateKeyList('rateLimitedKeys', rateLimitedKeys);
	if (document.getElementById('paidKeys')) {
		updateKeyList('paidKeys', paidKeys);
	}
}

/**
 * 创建密钥项元素（用于虚拟列表）
 */
function createKeyItemElement(keyData) {
	const div = document.createElement('div');
	div.className = 'key-item';
	
	const statusClass = keyData.status === 'valid' ? 'status-valid' :
		keyData.status === 'paid' ? 'status-paid' :
		keyData.status === 'invalid' ? 'status-invalid' :
		keyData.status === 'rate-limited' ? 'status-rate-limited' :
		keyData.status === 'retrying' ? 'status-retrying' : 'status-testing';
	
	const retryText = keyData.retryCount > 0 ? ` (重试: ${keyData.retryCount})` : '';
	const errorText = keyData.error ? ` - ${keyData.error}` : '';
	
	div.innerHTML = `
		<div class="key-preview">${keyData.key}</div>
		<div class="key-status ${statusClass}">${keyData.status}${retryText}</div>
		${errorText ? `<div class="key-error">${errorText}</div>` : ''}
	`;
	
	return div;
}

function updateKeyList(elementId, keys) {
	const container = document.getElementById(elementId);
	if (!container) return;
	container.innerHTML = '';
	if (keys.length === 0) {
		const emptyState = document.createElement('div');
		emptyState.className = 'empty-state';
		let emptyMessage = '';
		switch (elementId) {
			case 'allKeys':
				emptyMessage = currentLang === 'zh' ? '暂无密钥' : 'No keys';
				break;
			case 'validKeys':
				emptyMessage = currentLang === 'zh' ? '暂无有效密钥' : 'No valid keys';
				break;
			case 'paidKeys':
				emptyMessage = currentLang === 'zh' ? '暂无付费密钥' : 'No paid keys';
				break;
			case 'invalidKeys':
				emptyMessage = currentLang === 'zh' ? '暂无无效密钥' : 'No invalid keys';
				break;
			case 'rateLimitedKeys':
				emptyMessage = currentLang === 'zh' ? '暂无速率限制密钥' : 'No rate limited keys';
				break;
			default:
				emptyMessage = currentLang === 'zh' ? '暂无数据' : 'No data';
		}
		emptyState.innerHTML = '<div class="empty-icon">📭</div><div class="empty-text">' + emptyMessage + '</div>';
		container.appendChild(emptyState);
		return;
	}
	keys.forEach(keyData => {
		const keyItem = document.createElement('div');
		keyItem.className = 'key-item';
		const statusClass = keyData.status === 'valid' ? 'status-valid' :
			keyData.status === 'paid' ? 'status-paid' :
			keyData.status === 'invalid' ? 'status-invalid' :
			keyData.status === 'rate-limited' ? 'status-rate-limited' :
			keyData.status === 'retrying' ? 'status-retrying' : 'status-testing';
		const statusText = translations[currentLang]['status-' + keyData.status] || keyData.status;
		let errorDisplay = '';
		if ((keyData.status === 'invalid' || keyData.status === 'rate-limited') && keyData.error) {
			const localizedError = getLocalizedError(keyData.error);
			const errorColor = keyData.status === 'rate-limited' ? '#856404' : '#dc3545';
			errorDisplay = '<div style="font-size: 11px; color: ' + errorColor + '; margin-top: 2px;">' + localizedError + '</div>';
		}
		let modelDisplay = '';
		if (keyData.model) {
			modelDisplay = '<div style="font-size: 11px; color: #6c757d; margin-top: 2px;">Model: ' + keyData.model + '</div>';
		}
		let retryDisplay = '';
		if (keyData.retryCount && keyData.retryCount > 0) {
			const retryText = currentLang === 'zh' ? '重试' : 'Retry';
			retryDisplay = '<div style="font-size: 11px; color: #f39c12; margin-top: 2px;">' + retryText + ': ' + keyData.retryCount + '</div>';
		}
		keyItem.innerHTML = '<div class="key-text">' + keyData.key + modelDisplay + errorDisplay + retryDisplay + '</div><div class="key-status ' + statusClass + '">' + statusText + '</div>';
		container.appendChild(keyItem);
	});
}

function showTab(tab) {
	document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
	document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
	const tabButton = document.querySelector(`[data-tab="${tab}"]`);
	let tabContentId = tab + 'Tab';
	if (tab === 'rate-limited') tabContentId = 'rateLimitedTab';
	const tabContent = document.getElementById(tabContentId);
	if (tabButton) tabButton.classList.add('active');
	if (tabContent) tabContent.classList.add('active');
}

function updateStartButtonText() {
	const startBtn = document.getElementById('startBtn');
	if (!startBtn) return;
	if (isTestingInProgress) {
		startBtn.textContent = translations[currentLang]['cancel-test'];
		startBtn.setAttribute('data-lang-key', 'cancel-test');
	} else {
		startBtn.textContent = translations[currentLang]['start-test'];
		startBtn.setAttribute('data-lang-key', 'start-test');
	}
}

function updateUIAsync() {
	if (updateTimer) return;
	updateTimer = setTimeout(() => {
		try { updateStats(); } catch (_) {}
		try { updateKeyLists(); } catch (_) {}
		updateTimer = null;
	}, 50);
}

// 清理定时器的函数
function cleanupUITimers() {
	if (updateTimer) {
		clearTimeout(updateTimer);
		updateTimer = null;
	}
}

try {
	if (typeof window !== 'undefined') {
		window.updateStats = updateStats;
		window.updateKeyLists = updateKeyLists;
		window.updateKeyList = updateKeyList;
		window.showTab = showTab;
		window.updateStartButtonText = updateStartButtonText;
		window.updateUIAsync = updateUIAsync;
		window.cleanupUITimers = cleanupUITimers;
	}
} catch (_) {}


