// ==UserScript==
// @name         recommendation-blocker
// @namespace    http://tampermonkey.net/
// @version      1.4.4
// @description  屏蔽常用网站导航栏、搜索框、首页、侧边栏推荐
// @author       You
// @match        *://*.bilibili.com/*
// @match        *://*.zhihu.com/*
// @match        *://*.doubao.com/*
// @icon         https://cdn.simpleicons.org/adblock
// @run-at       document-start
// @noframes
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    // ============================================================
    // #region 初始化
    // ============================================================

    const enableBilibili = GM_getValue('enableBilibili', true);
    const enableZhihu = GM_getValue('enableZhihu', true);
    const enableDoubao = GM_getValue('enableDoubao', true);

    GM_registerMenuCommand('设置', openSettingsPanel);

    let simplifyCurrentSite = null;

    if (location.hostname.includes('bilibili.com') && enableBilibili) {
        simplifyCurrentSite = simplifyBilibili;
    } else if (location.hostname.includes('zhihu.com') && enableZhihu) {
        simplifyCurrentSite = simplifyZhihu;
    } else if (location.hostname.includes('doubao.com') && enableDoubao) {
        simplifyCurrentSite = simplifyDoubao;
    }

    if (!simplifyCurrentSite) return;

    simplifyCurrentSite();
    startObserver();
    
    // #endregion



    // ============================================================
    // #region 动态监听
    // ============================================================

    function startObserver() {
        let observerTimer = null;

        const observer = new MutationObserver(() => {
            clearTimeout(observerTimer);
            observerTimer = setTimeout(simplifyCurrentSite, 150);
        });

        function tryObserve() {
            if (!document.body) {
                requestAnimationFrame(tryObserve);
                return;
            }

            observer.observe(document.body, { childList: true, subtree: true });
        }

        tryObserve();
    }

    // #endregion



    // ============================================================
    // #region 通用函数
    // ============================================================

    function ensureStyle(id, cssText) {
        let style = document.getElementById(id);

        if (!style) {
            style = document.createElement('style');
            style.id = id;
            (document.head || document.documentElement).appendChild(style);
        }

        style.textContent = cssText;
    }


    function getStatusText(isOn) {
        return isOn ? '开启' : '关闭';
    }

    // #endregion



    // ============================================================
    // #region 设置面板
    // ============================================================

    function injectSettingsStyles() {
        ensureStyle('rb-settings-style', `
            #rb-settings-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.45);
                z-index: 2147483647;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            #rb-settings-panel {
                width: 360px;
                max-width: calc(100vw - 32px);
                background: #ffffff;
                color: #222;
                border-radius: 14px;
                box-shadow: 0 12px 36px rgba(0, 0, 0, 0.18);
                padding: 20px 18px 16px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }

            #rb-settings-title {
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 14px;
            }

            .rb-setting-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid #eee;
            }

            .rb-setting-row:last-of-type {
                border-bottom: none;
            }

            .rb-setting-label {
                font-size: 15px;
            }

            .rb-setting-status {
                margin-right: 10px;
                font-size: 13px;
                color: #666;
            }

            .rb-switch {
                position: relative;
                width: 48px;
                height: 28px;
                flex: 0 0 auto;
            }

            .rb-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .rb-slider {
                position: absolute;
                inset: 0;
                cursor: pointer;
                background: #ccc;
                border-radius: 999px;
                transition: 0.2s;
            }

            .rb-slider::before {
                content: "";
                position: absolute;
                width: 22px;
                height: 22px;
                left: 3px;
                top: 3px;
                background: white;
                border-radius: 50%;
                transition: 0.2s;
                box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
            }

            .rb-switch input:checked + .rb-slider {
                background: #4caf50;
            }

            .rb-switch input:checked + .rb-slider::before {
                transform: translateX(20px);
            }

            #rb-settings-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 18px;
            }

            .rb-btn {
                border: none;
                border-radius: 10px;
                padding: 9px 14px;
                cursor: pointer;
                font-size: 14px;
            }

            .rb-btn-cancel {
                background: #f1f1f1;
                color: #333;
            }

            .rb-btn-save {
                background: #1677ff;
                color: white;
            }

            #rb-settings-tip {
                margin-top: 10px;
                font-size: 12px;
                color: #777;
            }
        `);
    }


    function buildSettingsHTML() {
        const overlay = document.createElement('div');
        overlay.id = 'rb-settings-overlay';
        overlay.innerHTML = `
            <div id="rb-settings-panel">
                <div id="rb-settings-title">recommendation-blocker 设置</div>

                <div class="rb-setting-row">
                    <div class="rb-setting-label">B站屏蔽</div>
                    <div style="display:flex; align-items:center;">
                        <span class="rb-setting-status" id="rb-status-bilibili">${getStatusText(GM_getValue('enableBilibili', true))}</span>
                        <label class="rb-switch">
                            <input type="checkbox" id="rb-toggle-bilibili" ${GM_getValue('enableBilibili', true) ? 'checked' : ''}>
                            <span class="rb-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="rb-setting-row">
                    <div class="rb-setting-label">知乎屏蔽</div>
                    <div style="display:flex; align-items:center;">
                        <span class="rb-setting-status" id="rb-status-zhihu">${getStatusText(GM_getValue('enableZhihu', true))}</span>
                        <label class="rb-switch">
                            <input type="checkbox" id="rb-toggle-zhihu" ${GM_getValue('enableZhihu', true) ? 'checked' : ''}>
                            <span class="rb-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="rb-setting-row">
                    <div class="rb-setting-label">豆包屏蔽</div>
                    <div style="display:flex; align-items:center;">
                        <span class="rb-setting-status" id="rb-status-doubao">${getStatusText(GM_getValue('enableDoubao', true))}</span>
                        <label class="rb-switch">
                            <input type="checkbox" id="rb-toggle-doubao" ${GM_getValue('enableDoubao', true) ? 'checked' : ''}>
                            <span class="rb-slider"></span>
                        </label>
                    </div>
                </div>

                <div id="rb-settings-actions">
                    <button class="rb-btn rb-btn-cancel" id="rb-settings-cancel">取消</button>
                    <button class="rb-btn rb-btn-save" id="rb-settings-save">保存并刷新</button>
                </div>

                <div id="rb-settings-tip">修改后会刷新当前页面。</div>
            </div>
        `;

        document.body.appendChild(overlay);
        return overlay;
    }


    function bindSettingsEvents(overlay) {
        const sites = [
            { id: 'Bilibili', checkbox: 'rb-toggle-bilibili', status: 'rb-status-bilibili' },
            { id: 'Zhihu', checkbox: 'rb-toggle-zhihu', status: 'rb-status-zhihu' },
            { id: 'Doubao', checkbox: 'rb-toggle-doubao', status: 'rb-status-doubao' },
        ];

        sites.forEach(({ checkbox, status }) => {
            const cb = document.getElementById(checkbox);
            const st = document.getElementById(status);

            cb.addEventListener('change', () => {
                st.textContent = getStatusText(cb.checked);
            });
        });

        document.getElementById('rb-settings-cancel').addEventListener('click', () => {
            overlay.remove();
        });

        document.getElementById('rb-settings-save').addEventListener('click', () => {
            sites.forEach(({ id, checkbox }) => {
                const cb = document.getElementById(checkbox);
                GM_setValue('enable' + id, cb.checked);
            });
            location.reload();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }


    function openSettingsPanel() {
        if (document.getElementById('rb-settings-overlay')) return;
        injectSettingsStyles();
        const overlay = buildSettingsHTML();
        bindSettingsEvents(overlay);
    }

    // #endregion



    // ============================================================
    // #region 站点屏蔽
    // ============================================================

    function simplifyBilibili() {
        ensureStyle('rb-bilibili-style', `
            /* 导航栏 */
            .left-entry { visibility: hidden !important; }
            .right-entry { visibility: hidden !important; }
            .entry-title { visibility: visible !important; }
            .mini-header__logo { visibility: visible !important; }
            .header-entry-mini { visibility: visible !important; }

            /* 搜索框 */
            .nav-search-input::placeholder { color: transparent !important; }
            .trending { display: none !important; }

            /* 首页 */
            .feed2 { display: none !important; }

            /* 视频页 */
            .bpx-player-ending-related { display: none !important; }
            .recommend-list-v1 { display: none !important; }
            .pop-live-small-mode { display: none !important; }
            .video-pod__body { max-height: 450px !important; }
        `);

        document.querySelector('.left-entry__title')?.setAttribute('href', 'https://search.bilibili.com/');
    }


    function simplifyZhihu() {
        ensureStyle('rb-zhihu-style', `
            /* 导航栏 */
            .css-72pd91 { visibility: hidden !important; }
            .css-1vbrp2j { visibility: hidden !important; }

            /* 搜索框 */
            .Input::placeholder { color: transparent !important; }
            .SearchBar-label:first-of-type { display: none !important; }
            [id*="AutoComplete1-topSearch"] { display: none !important; }

            /* 首页 */
            .Topstory-container { display: none !important; }

            /* 搜索页 */
            .css-knqde { display: none !important; }
            .SearchMain { width: 960px !important; }

            /* 问题页 */
            .Question-sideColumn { display: none !important; }
            .Question-mainColumn { width: 960px !important; }

            /* 专栏页 */
            .Post-Row-Content-right { display: none !important; }
            .Post-Row-Content-left { width: 960px !important; }
            .Post-Sub { display: none !important; }
        `);

         document.querySelector('.css-lgijre > a')?.setAttribute('href', 'https://www.zhihu.com/search');
    }


    function simplifyDoubao() {
        ensureStyle('rb-doubao-style', `
            /* 首页 */
            #experiment-guidance-suggestions { display: none !important; }
        `);
    }

    // #endregion

})();
