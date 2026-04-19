// ==UserScript==
// @name         recommendation-blocker
// @namespace    http://tampermonkey.net/
// @version      1.4.1
// @description  屏蔽常用网站导航栏、搜索框、首页、侧边栏推荐
// @author       You
// @match        *://*.bilibili.com/*
// @match        *://*.zhihu.com/*
// @match        *://*.doubao.com/*
// @icon         https://cdn.simpleicons.org/adblock
// @run-at       document-end
// @require      https://cdn.jsdelivr.net/npm/jquery@3.4.1/dist/jquery.min.js
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';
    /* global $ */

    const enableBilibili = GM_getValue('enableBilibili', true);
    const enableZhihu = GM_getValue('enableZhihu', true);
    const enableDoubao = GM_getValue('enableDoubao', true);
    
    addToggleMenu('B站屏蔽', 'enableBilibili', enableBilibili);
    addToggleMenu('知乎屏蔽', 'enableZhihu', enableZhihu);
    addToggleMenu('豆包屏蔽', 'enableDoubao', enableDoubao);

    let simplifyCurrentSite = null;
    if (location.hostname.includes('bilibili.com') && enableBilibili) simplifyCurrentSite = simplifyBilibili;
    if (location.hostname.includes('zhihu.com') && enableZhihu) simplifyCurrentSite = simplifyZhihu;
    if (location.hostname.includes('doubao.com') && enableDoubao) simplifyCurrentSite = simplifyDoubao;
    if (!simplifyCurrentSite) return;

    simplifyCurrentSite();

    let observerTimer = null;
    const observer = new MutationObserver(() => {
        clearTimeout(observerTimer);
        observerTimer = setTimeout(() => {
            simplifyCurrentSite();
            observerTimer = null;
        }, 150);
    });
    if (document.body) observer.observe(document.body, {childList: true, subtree: true});



    //===============================函数区===============================

    function getStatusText(isOn) {
        return isOn ? "🟢 开启" : "🔴 关闭";
    }


    function addToggleMenu(name, key, currentValue) {
        const text = name + " | " + getStatusText(currentValue);
        GM_registerMenuCommand(text, function () {
            GM_setValue(key, !currentValue);
            location.reload();
        });
    }


    function ensureStyle(id, cssText) {
        if (document.getElementById(id)) return;
        const style = document.createElement('style');
        style.id = id;
        style.textContent = cssText;
        document.head.appendChild(style);
    }


    function simplifyBilibili(){
        // 导航栏
        $(".left-entry__title").attr('href', 'https://search.bilibili.com/');
        $(".left-entry").css('visibility', 'hidden');
        $(".right-entry").css('visibility', 'hidden');
        $(".entry-title").css('visibility', 'visible');
        $(".mini-header__logo").css('visibility', 'visible');
        $(".header-entry-mini").css('visibility', 'visible');

        // 搜索框
        $(".nav-search-input").attr('placeholder', '');
        $(".trending").hide();

        // 首页
        $(".feed2").hide();

        // 视频页
        $(".bpx-player-ending-related").hide();
        $(".recommend-list-v1").hide();
        $(".pop-live-small-mode").hide();
        $(".video-pod__body").css('max-height', '450px');
    }


    function simplifyZhihu(){
        // 导航栏
        $(".css-lgijre > a").attr('href', 'https://www.zhihu.com/search');
        $(".css-72pd91").css('visibility', 'hidden');
        $(".css-1vbrp2j").css('visibility', 'hidden');

        // 搜索框
        ensureStyle('rb-zhihu-placeholder-style', '.Input::placeholder{color:transparent}');
        $(".SearchBar-label:first").hide();
        $('[id*="AutoComplete1-topSearch"]').hide();

        // 首页
        $(".Topstory-container").remove();

        // 搜索页
        $(".css-knqde").remove();
        $(".SearchMain").width('960px');

        // 问题页
        $(".Question-sideColumn").remove();
        $(".Question-mainColumn").width('960px');

        // 专栏页
        $(".Post-Row-Content-right").remove();
        $(".Post-Row-Content-left").width('960px');
        $(".Post-Sub").remove();
    }


    function simplifyDoubao(){
        // 首页
        $("#experiment-guidance-suggestions").remove();
    }

})();
