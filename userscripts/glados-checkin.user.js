// ==UserScript==
// @name         GLaDOS 自动签到（定时版）
// @namespace    https://glados.cloud/
// @version      0.1.0
// @description  在浏览器打开 GLaDOS 页面时，按设定时间自动签到
// @author       glados-checkin
// @match        https://glados.cloud/*
// @match        https://glados.rocks/*
// @match        https://glados.network/*
// @run-at       document-idle
// @grant        GM_notification
// ==/UserScript==

(function () {
    'use strict';

    const CHECKIN_TIMES = ['09:30', '21:30']; // 按本地时区计算
    const CHECKIN_API = '/api/user/checkin';
    const CHECKIN_TOKEN = 'glados.cloud';

    function notify(title, text) {
        if (typeof GM_notification === 'function') {
            GM_notification({ title, text, timeout: 5000 });
        }
    }

    function nextRunDate() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const times = CHECKIN_TIMES.map((t) => {
            const [h, m] = t.split(':').map(Number);
            return new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, 0);
        }).sort((a, b) => a - b);

        for (const t of times) {
            if (t.getTime() > now.getTime()) {
                return t;
            }
        }
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const [h, m] = CHECKIN_TIMES[0].split(':').map(Number);
        return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), h, m, 0);
    }

    async function doCheckin() {
        try {
            const resp = await fetch(`${location.origin}${CHECKIN_API}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ token: CHECKIN_TOKEN }),
            });
            const data = await resp.json();
            const message = data?.message || '签到完成';
            console.log('[GLaDOS] 签到结果:', data);
            notify('GLaDOS 签到完成', message);
        } catch (error) {
            console.error('[GLaDOS] 签到失败:', error);
            notify('GLaDOS 签到失败', String(error));
        }
    }

    function schedule() {
        const next = nextRunDate();
        const delay = Math.max(0, next.getTime() - Date.now());
        console.log(`[GLaDOS] 下一次签到：${next.toLocaleString()}`);
        setTimeout(async () => {
            await doCheckin();
            schedule();
        }, delay);
    }

    schedule();
})();
