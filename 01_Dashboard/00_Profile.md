---
archive_cutoff: 2026-05-01
archive_xp: 0
archive_gold: 0
archive_focus_mins: 0
archive_routine_mins: 0
archive_rest_mins: 0
archive_procrastination_spent: 0
archive_quests_count: 0
bonus_gold: 0
bonus_xp: 0
gold_spent: 0
inventory:
  potion: 0
  walk: 0
  tea: 0
  youtube: 0
  games: 0
  social: 0
  dayoff: 0
potions_history: {}
---
# Личный Кабинет
```dataviewjs
(async () => {
    const container = this.container;
    container.empty();

    if (!window.customJS || !customJS.RPG_Engine) {
        container.createEl('div', { text: "⚠️ Движок загружается...", attr: { style: "color: #e74c3c;" } });
        return;
    }

    try {
        const engine = customJS.RPG_Engine;
        const profilePage = dv.page("01_Dashboard/00_Profile.md");
        
        const ctx = await engine.getSharedContext(dv, profilePage);

        const styleEl = container.createEl('style');
        styleEl.innerHTML = `
          .rpg-hud { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin-bottom: 15px; }
          .hp-bar-wrapper { background: rgba(0,0,0,0.3); border-radius: 6px; height: 10px; overflow: hidden; margin: 8px 0 15px 0; border: 1px solid rgba(255,255,255,0.05); }
          .hp-bar { height: 100%; transition: width 0.4s ease; }
          .xp-bar-wrapper { background: rgba(0,0,0,0.3); border-radius: 6px; height: 16px; overflow: hidden; margin-top: 6px; border: 1px solid rgba(255,255,255,0.05); }
          .xp-bar { background: linear-gradient(90deg, #2ecc71, #27ae60); height: 100%; transition: width 0.4s ease; }
          .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 15px; }
          .stat-box { background: rgba(0,0,0,0.15); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.03); font-size: 0.85em; }
          .stat-val { font-size: 1.3em; font-weight: bold; color: var(--text-accent); margin-top: 5px; }
          .debuff-warning { background: rgba(231, 76, 60, 0.2); border: 1px solid #e74c3c; color: #e74c3c; padding: 10px; border-radius: 8px; margin-bottom: 15px; text-align: center; font-weight: bold; }
        `;

        let isTraumatized = ctx.currentHp <= 0; 
        const hpLabel = isTraumatized ? "Энергия (⚠️ ТРАВМА: Получаемое золото x0.5)" : "Энергия Персонажа (HP)";
        const safeHpColor = isTraumatized ? '#c0392b' : (ctx.currentHp > 50 ? '#2ecc71' : (ctx.currentHp > 20 ? '#e67e22' : '#e74c3c'));

        const div = container.createEl('div');
        let html = '<div class="rpg-wrapper">';
        if (isTraumatized) {
            html += '<div class="debuff-warning">Критическое ранение! Весь заработок золота снижен на 50%. Выпейте зелье.</div>';
        }
        html += '<div class="rpg-hud">' +
                  '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                    '<h2 style="margin:0; color: var(--text-title); font-size: 1.5em;">🧙‍♂️ ' + ctx.title + '</h2>' +
                    '<span style="background: var(--text-accent); color: var(--background-primary); padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 0.85em;">УРОВЕНЬ ' + ctx.currentLevel + '</span>' +
                  '</div>' +
                  '<div style="margin-top: 15px;">' +
                    '<div style="display: flex; justify-content: space-between; font-size: 0.85em; color: ' + (isTraumatized ? '#e74c3c' : 'inherit') + ';">' +
                      '<span>' + hpLabel + '</span>' +
                      '<b>' + ctx.currentHp + ' / 100</b>' +
                    '</div>' +
                    '<div class="hp-bar-wrapper"><div class="hp-bar" style="width: ' + ctx.currentHp + '%; background: ' + safeHpColor + ';"></div></div>' +
                  '</div>' +
                  '<div class="stats-row">' +
                    '<div class="stat-box"><div>💰 Кошелек</div><div class="stat-val" style="color: #f1c40f;">' + ctx.currentGold + ' GP</div></div>' +
                    '<div class="stat-box"><div>Выполнено задач</div><div class="stat-val" style="color: #2ecc71;">' + ctx.counters.totalTasks + '</div></div>' +
                    '<div class="stat-box"><div>Карточки знаний</div><div class="stat-val" style="color: #3498db;">' + ctx.zettelCount + '</div></div>' +
                  '</div>' +
                  '<div style="margin-top: 20px;">' +
                    '<div style="display: flex; justify-content: space-between; font-size: 0.8em; color: var(--text-muted);">' +
                      '<span>Опыт текущего ранга (XP)</span>' +
                      '<span>' + ctx.xpInCurrentLevel + ' / 1000 XP (' + ctx.progressPercent + '%)</span>' +
                    '</div>' +
                    '<div class="xp-bar-wrapper"><div class="xp-bar" style="width: ' + ctx.progressPercent + '%;"></div></div>' +
                  '</div>' +
                '</div>' +
              '</div>';
        div.innerHTML = html;
    } catch (e) {
        container.createEl('div', { text: "⚠️ Ошибка HUD: " + e.message, attr: { style: "color: #e74c3c;" } });
    }
})();
```
# Аналитика затраченного времени 
```dataviewjs
(async () => {
    const container = this.container;
    container.empty();

    if (!window.customJS || !customJS.RPG_Engine) return;

    try {
        const engine = customJS.RPG_Engine;
        const profilePage = dv.page("01_Dashboard/00_Profile.md");
        const ctx = await engine.getSharedContext(dv, profilePage);

        const { timeStats, todayStats, globalTimeStats, monthTagMap, globalTagMap } = ctx;

        const formatHours = (m) => m >= 60 ? `${Math.floor(m / 60)}ч ${m % 60}м` : `${m}м`;
        const getPct = (m, total) => total > 0 ? Math.floor((m / total) * 100) : 0;

        const dashboard = container.createEl('div');
        dashboard.style.cssText = "display: flex; flex-direction: column; gap: 20px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 20px; border-radius: 10px; margin-top: 15px; box-shadow: none !important;";

        const todayTotal = todayStats.focus + todayStats.routine + todayStats.rest + todayStats.procrastinate;
        const todaySec = dashboard.createEl('div');
        todaySec.createEl('div', { text: "⚡ Энергия за сегодня" }).style.cssText = "font-size: 0.85em; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold; margin-bottom: 8px;";
        
        const todayGrid = todaySec.createEl('div');
        todayGrid.style.cssText = "display: flex; gap: 10px; flex-wrap: wrap;";
        
        const createStatBox = (parent, label, val, color) => {
            const box = parent.createEl('div');
            box.style.cssText = `background: rgba(0,0,0,0.2); border: 1px solid ${color}44; padding: 10px 15px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; min-width: 100px; flex-grow: 1; box-shadow: none !important;`;
            box.createEl('span', { text: label, attr: { style: "font-size: 0.75em; color: var(--text-muted); margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px;" }});
            box.createEl('span', { text: formatHours(val), attr: { style: `font-size: 1.2em; font-weight: bold; color: ${color};` }});
        };

        if (todayTotal > 0) {
            if (todayStats.focus > 0) createStatBox(todayGrid, "Фокус", todayStats.focus, "#e74c3c");
            if (todayStats.routine > 0) createStatBox(todayGrid, "Рутина", todayStats.routine, "#e67e22");
            if (todayStats.rest > 0) createStatBox(todayGrid, "Отдых", todayStats.rest, "#2ecc71");
            if (todayStats.procrastinate > 0) createStatBox(todayGrid, "Слив", todayStats.procrastinate, "#95a5a6");
        } else {
            todayGrid.createEl('div', { text: "Журнал активности за сегодня пуст.", attr: { style: "font-size: 0.9em; color: var(--text-muted); font-style: italic;" }});
        }
        
        dashboard.createEl('hr', { attr: { style: "border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 0;" }});

        const renderBalanceBar = (parent, title, statsObj) => {
            const sec = parent.createEl('div');
            sec.createEl('div', { text: title }).style.cssText = "font-size: 0.85em; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold; margin-bottom: 8px;";
            
            const m = [
                { label: "🔴 Фокус", mins: statsObj.totalMinutes || 0, color: "#e74c3c" },
                { label: "🪵 Рутина", mins: statsObj.totalRoutineMinutes || 0, color: "#e67e22" },
                { label: "⚪ Отдых", mins: statsObj.totalRestMinutes || 0, color: "#2ecc71" },
                { label: "⚠️ Слив", mins: statsObj.totalProcrastinateMinutes || 0, color: "#95a5a6" }
            ];
            const total = m.reduce((acc, curr) => acc + curr.mins, 0);

            const mainBar = sec.createEl('div');
            mainBar.style.cssText = "display: flex; width: 100%; height: 12px; background: rgba(0,0,0,0.3); border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 12px;";
            
            m.forEach(item => {
                const pct = getPct(item.mins, total);
                if (pct > 0) {
                    const segment = mainBar.createEl('div');
                    segment.style.cssText = `width: ${pct}%; height: 100%; background: ${item.color}; transition: width 0.3s;`;
                    segment.title = `${item.label}: ${pct}%`;
                }
            });

            const grid = sec.createEl('div');
            grid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px;";
            
            m.forEach(item => {
                const pct = getPct(item.mins, total);
                const row = grid.createEl('div');
                row.style.cssText = "display: flex; align-items: center; justify-content: space-between; font-size: 0.9em; background: rgba(0,0,0,0.2); padding: 10px 12px; border-radius: 6px; border-left: 4px solid " + item.color + ";";
                
                const labelSpan = row.createEl('span', { text: item.label.split(' (')[0] });
                labelSpan.style.cssText = "font-weight: 500; color: var(--text-normal); margin-right: auto; padding-right: 10px;";
                
                const numSpan = row.createEl('span');
                numSpan.innerHTML = `<span style="color: var(--text-muted); font-weight: bold; margin-right: 8px;">${formatHours(item.mins)}</span><span style="color: ${item.color}; font-weight: bold; min-width: 35px; display: inline-block; text-align: right;">${pct}%</span>`;
            });
        };

        renderBalanceBar(dashboard, "📊 Баланс распределения (Текущий Месяц)", timeStats);
        renderBalanceBar(dashboard, "🌍 Глобальный баланс (Всё Время)", globalTimeStats);

        const tagSection = container.createEl('div');
        tagSection.style.cssText = "display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 20px;";

        const renderTagBlock = (parent, title, tagMap, color) => {
            const block = parent.createEl('div');
            block.style.cssText = "background: rgba(0,0,0,0.1); padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.04);";
            block.createEl('h5', { text: title }).style.cssText = `margin: 0 0 15px 0; color: ${color}; text-transform: uppercase; font-size: 0.85em; letter-spacing: 0.5px;`;

            const totalMins = Object.values(tagMap).reduce((a, b) => a + b, 0);

            if (totalMins === 0 || Object.keys(tagMap).length === 0) {
                block.createEl('p', { text: "Журнал пуст.", attr: { style: "font-style: italic; color: var(--text-muted); font-size: 0.85em;" } });
                return;
            }

            let sorted = Object.entries(tagMap).filter(([_, mins]) => mins > 0).sort((a,b) => b[1] - a[1]);
            
            const TOP_LIMIT = 7;
            let topTags = sorted.slice(0, TOP_LIMIT);
            let hiddenTags = sorted.slice(TOP_LIMIT);

            const renderItem = (targetParent, tag, mins, isHidden = false) => {
                const tPct = Math.floor((mins / totalMins) * 100);
                const item = targetParent.createEl('div');
                item.style.cssText = `margin-bottom: 10px; font-size: 0.85em; ${isHidden ? 'opacity: 0.65;' : ''}`;
                item.innerHTML = `<div style="display:flex; justify-content:space-between; margin-bottom: 4px;"><span style="font-family:monospace; color:var(--text-normal);">${tag}</span><b>${formatHours(mins)} <span style="color: var(--text-muted);">(${tPct}%)</span></b></div>`;
                const bg = item.createEl('div');
                bg.style.cssText = "width:100%; background:rgba(0,0,0,0.3); height:4px; border-radius:2px;";
                const fill = bg.createEl('div');
                fill.style.cssText = "width:" + tPct + "%; background:" + color + "; height:100%; border-radius:2px;";
            };

            topTags.forEach(([tag, mins]) => renderItem(block, tag, mins, false));

            if (hiddenTags.length > 0) {
                const details = block.createEl('details', { attr: { style: 'margin-top: 15px; outline: none;' } });
                const summary = details.createEl('summary', { text: `▼ Показать остальные под-навыки (${hiddenTags.length})` });
                summary.style.cssText = "font-size: 0.8em; color: var(--text-muted); font-weight: bold; cursor: pointer; transition: color 0.2s; list-style: none;";
                
                const wrapper = details.createEl('div', { attr: { style: 'padding-top: 10px; margin-top: 5px; border-top: 1px dashed rgba(255,255,255,0.05);' } });
                hiddenTags.forEach(([tag, mins]) => renderItem(wrapper, tag, mins, true));
            }
        };

        renderTagBlock(tagSection, "🎯 Фокус по тегам (Месяц)", monthTagMap, "#3498db");
        renderTagBlock(tagSection, "🌐 Опыт по тегам (Всё время)", globalTagMap, "#9b59b6");

    } catch(e) {
        container.createEl('p', {text: "Ошибка аналитики: " + e.message, attr: {style: "color:red;"}});
    }
})();
```
# Карта игровой активности
```dataviewjs
(async () => {
    const container = this.container;
    container.empty();

    if (!window.customJS || !customJS.RPG_Engine) {
        container.createEl('div', { text: "⚠️ Движок загружается...", attr: { style: "color: #e74c3c;" } });
        return;
    }

    try {
        const engine = customJS.RPG_Engine;
        const profilePage = dv.page("01_Dashboard/00_Profile.md");
        const ctx = await engine.getSharedContext(dv, profilePage);

        // --- 1. СБОР ДАННЫХ ---
        const allJournals = dv.pages('"05_Journal"');
        const fMap = {};
        for (let p of allJournals) {
            fMap[p.file.name] = parseInt(p.focus_mins) || 0;
        }

        const today = window.moment();
        const todayStr = today.format("YYYY-MM-DD");

        // --- 2. СТРИКИ ---
        let currentStreak = 0;
        let maxStreak = 0;
        let tempStreak = 0;

        const sortedDates = Object.keys(fMap).sort();
        let prevDate = null;

        for (let date of sortedDates) {
            if (fMap[date] > 0) {
                if (!prevDate) tempStreak = 1;
                else {
                    const diff = window.moment(date).diff(window.moment(prevDate), 'days');
                    if (diff === 1) tempStreak++;
                    else tempStreak = 1;
                }
                if (tempStreak > maxStreak) maxStreak = tempStreak;
                prevDate = date;
            } else {
                tempStreak = 0;
            }
        }

        let streakCheckDate = window.moment();
        if (!fMap[todayStr] || fMap[todayStr] === 0) {
            streakCheckDate.subtract(1, 'days');
        }
        while (true) {
            let checkStr = streakCheckDate.format("YYYY-MM-DD");
            if (fMap[checkStr] && fMap[checkStr] > 0) {
                currentStreak++;
                streakCheckDate.subtract(1, 'days');
            } else break;
        }

        const totalHours = Math.floor((ctx.globalTimeStats?.totalMinutes || 0) / 60);

        // --- 3. СТИЛИ ИНТЕРФЕЙСА ---
        const styleEl = container.createEl('style');
        styleEl.innerHTML = `
            .hm-wrapper { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 20px; border-radius: 12px; margin-top: 15px; }
            .hm-hud { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
            .hm-stat-card { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); padding: 12px 18px; border-radius: 8px; flex: 1; min-width: 120px; }
            .hm-stat-title { font-size: 0.75em; color: var(--text-muted); text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 4px; }
            .hm-stat-val { font-size: 1.6em; font-weight: 900; font-family: monospace; }
            
            .hm-section-title { font-size: 1.1em; color: var(--text-normal); font-weight: bold; margin-bottom: 10px; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 5px; display: flex; align-items: center; justify-content: space-between; }
            
            /* Стили для Календаря Месяца (Полноразмерный) */
            .month-panel { background: rgba(0,0,0,0.15); padding: 15px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.04); margin-bottom: 20px; }
            .month-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
            .month-day-lbl { text-align: center; font-size: 0.7em; color: var(--text-muted); font-weight: bold; padding-bottom: 4px; text-transform: uppercase; }
            .month-cell { aspect-ratio: 1.5; display: flex; align-items: center; justify-content: center; border-radius: 6px; cursor: pointer; transition: 0.2s; font-size: 1em; font-weight: bold; color: rgba(255,255,255,0.8); }
            .month-cell:hover:not(.mc-empty):not(.hm-future) { transform: translateY(-2px) scale(1.05); box-shadow: 0 4px 12px rgba(0, 255, 102, 0.3); color: #fff; z-index: 5; border: 1px solid #fff !important; }
            .mc-empty { background: transparent; border: none; pointer-events: none; }
            
            /* Стили для Годового Скролла */
            .year-panel { padding-top: 10px; }
            .hm-scroll-box { overflow-x: auto; padding-bottom: 10px; width: 100%; display: flex; flex-direction: column; gap: 5px; transform: translateZ(0); }
            .hm-scroll-box::-webkit-scrollbar { height: 6px; }
            .hm-scroll-box::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
            .hm-months-row { display: flex; position: relative; height: 16px; margin-left: 25px; margin-bottom: 2px; }
            .hm-month-label { position: absolute; font-size: 0.7em; color: var(--text-muted); font-weight: bold; }
            .hm-grid-container { display: flex; gap: 6px; }
            .hm-days-column { display: grid; gap: 4px; padding-right: 6px; text-align: right; user-select: none; }
            .hm-day-label { font-size: 0.65em; color: var(--text-muted); line-height: 1; display: flex; align-items: center; justify-content: flex-end; }
            .hm-cells-grid { display: grid; grid-auto-flow: column; gap: 4px; }
            .hm-cell { width: 13px; height: 13px; border-radius: 3px; cursor: pointer; transition: transform 0.15s; }
            .hm-cell:hover:not(.hm-future):not(.mc-empty) { transform: scale(1.3); z-index: 10; border: 1px solid #fff; box-shadow: 0 0 10px rgba(0,255,102,0.5); }
            
            /* Общая палитра "Изумрудная Бездна" */
            .hm-future { background: rgba(255,255,255,0.01); border: 1px dashed rgba(255,255,255,0.03); color: rgba(255,255,255,0.1); pointer-events: none; }
            .hm-lvl-0 { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); }
            .hm-lvl-1 { background: #004d22; border: 1px solid #00662d; color: #fff; }
            .hm-lvl-2 { background: #008838; border: 1px solid #00a343; color: #fff; }
            .hm-lvl-3 { background: #00c24e; border: 1px solid #00e65d; color: #fff; }
            .hm-lvl-4 { background: #00ff66; border: 1px solid #ffffff; box-shadow: 0 0 8px rgba(0, 255, 102, 0.5); color: #000; }
            .hm-today { border: 1px solid var(--text-accent) !important; color: var(--text-accent); }
        `;

        // ОПТИМИЗАЦИЯ 1: Теневой DOM (Detached Element). 
        // Мы не добавляем wrapper на страницу сразу, чтобы избежать 400 Reflow-перерисовок.
        const wrapper = document.createElement('div');
        wrapper.className = 'hm-wrapper';

        // --- 4. РЕНДЕР HUD ---
        const hudPanel = wrapper.createEl('div', { cls: 'hm-hud' });
        const statCard = (title, val, color) => {
            const card = hudPanel.createEl('div', { cls: 'hm-stat-card', attr: { style: `border-left: 4px solid ${color};` } });
            card.createEl('div', { cls: 'hm-stat-title', text: title });
            card.createEl('div', { cls: 'hm-stat-val', text: val, attr: { style: `color: ${color};` } });
        };

        statCard("Всего в фокусе", `${totalHours} ч.`, "#3498db");
        statCard("Текущий стрик", `${currentStreak} дн.`, "#f39c12");
        statCard("Рекордный стрик", `${maxStreak} дн.`, "#9b59b6");

        // --- ФУНКЦИЯ ОПРЕДЕЛЕНИЯ ЦВЕТА ---
        const getLvlClass = (mins, isFuture) => {
            if (isFuture) return 'hm-future';
            if (mins === 0) return 'hm-lvl-0';
            if (mins <= 120) return 'hm-lvl-1';       
            if (mins <= 240) return 'hm-lvl-2';  
            if (mins <= 420) return 'hm-lvl-3';  
            return 'hm-lvl-4';                   
        };

        const attachTooltipAndClick = (el, dateStr, displayDate, mins, isFuture) => {
            if (!isFuture) {
                let hrs = Math.floor(mins / 60);
                let m = mins % 60;
                let timeText = hrs > 0 ? `${hrs}ч ${m}м` : (mins > 0 ? `${m} мин` : 'Отдых / Нет данных');
                el.title = `${displayDate} | ${timeText}`;

                el.addEventListener('click', () => {
                    const path = `05_Journal/${dateStr}.md`;
                    const file = app.vault.getAbstractFileByPath(path);
                    if (file) app.workspace.getLeaf(false).openFile(file);
                    else new Notice(`Дневник за ${displayDate} еще не создан.`);
                });
            }
        };

        // --- 5. РЕНДЕР МЕСЯЦА (Широкая сетка) ---
        const monthPanel = wrapper.createEl('div', { cls: 'month-panel' });
        monthPanel.createEl('div', { cls: 'hm-section-title', text: `📅 Месяц (${today.format("MMMM YYYY")})` });
        
        const mGrid = monthPanel.createEl('div', { cls: 'month-grid' });
        ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].forEach(d => mGrid.createEl('div', { cls: 'month-day-lbl', text: d }));

        const startOfMonth = window.moment().startOf('month');
        const daysInMonth = startOfMonth.daysInMonth();
        const startWeekday = startOfMonth.isoWeekday(); // 1-7

        for(let i = 1; i < startWeekday; i++) {
            mGrid.createEl('div', { cls: 'month-cell mc-empty' });
        }

        // ОПТИМИЗАЦИЯ 2: Мутируем одну дату, вместо создания новых
        let curMonthDay = window.moment(startOfMonth);
        for(let i = 0; i < daysInMonth; i++) {
            const dateStr = curMonthDay.format("YYYY-MM-DD");
            const mins = fMap[dateStr] || 0;
            const isFuture = curMonthDay.isAfter(today, 'day');
            
            let lvlClass = getLvlClass(mins, isFuture);
            let extraClass = curMonthDay.isSame(today, 'day') ? ' hm-today' : '';
            
            const cell = mGrid.createEl('div', { cls: `month-cell ${lvlClass}${extraClass}`, text: (i + 1).toString() });
            attachTooltipAndClick(cell, dateStr, curMonthDay.format("DD.MM.YYYY"), mins, isFuture);
            
            curMonthDay.add(1, 'days');
        }

        // --- 6. РЕНДЕР ГОДА (Горизонтальный скролл) ---
        const yearPanel = wrapper.createEl('div', { cls: 'year-panel' });
        yearPanel.createEl('div', { cls: 'hm-section-title', text: `🔥 Годовая Летопись (${today.format("YYYY")})` });
        
        const scrollBox = yearPanel.createEl('div', { cls: 'hm-scroll-box' });
        
        const startOfYear = window.moment().startOf('year');
        const endOfYear = window.moment().endOf('year');
        const totalDaysYear = endOfYear.diff(startOfYear, 'days') + 1;
        const yearStartWeekday = startOfYear.isoWeekday();

        const monthsRow = scrollBox.createEl('div', { cls: 'hm-months-row' });
        let currentMonth = -1;
        
        let curLabelDay = window.moment(startOfYear);
        for (let i = 0; i < totalDaysYear; i++) {
            if (curLabelDay.month() !== currentMonth) {
                currentMonth = curLabelDay.month();
                const colIndex = Math.floor((i + yearStartWeekday - 1) / 7);
                const leftPos = colIndex * 17; // 13px cell + 4px gap
                monthsRow.createEl('span', { cls: 'hm-month-label', text: curLabelDay.format("MMM"), attr: { style: `left: ${leftPos}px;` } });
            }
            curLabelDay.add(1, 'days');
        }

        const gridContainer = scrollBox.createEl('div', { cls: 'hm-grid-container' });
        
        const daysCol = gridContainer.createEl('div', { cls: 'hm-days-column', attr: { style: `grid-template-rows: repeat(7, 13px);` } });
        ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].forEach(d => {
            daysCol.createEl('div', { cls: 'hm-day-label', text: d, attr: { style: `height: 13px;` } });
        });

        const yGrid = gridContainer.createEl('div', { cls: 'hm-cells-grid', attr: { style: `grid-template-rows: repeat(7, 13px);` } });
        
        for (let i = 1; i < yearStartWeekday; i++) {
            yGrid.createEl('div', { cls: 'hm-cell mc-empty' });
        }

        let todayIndex = -1;
        let curYearDay = window.moment(startOfYear);

        for (let i = 0; i < totalDaysYear; i++) {
            let dateStr = curYearDay.format("YYYY-MM-DD");
            let mins = fMap[dateStr] || 0;
            let isFuture = curYearDay.isAfter(today, 'day');
            
            if (curYearDay.isSame(today, 'day')) todayIndex = i;

            let lvlClass = getLvlClass(mins, isFuture);
            let extraClass = curYearDay.isSame(today, 'day') ? ' hm-today' : '';
            
            let cell = yGrid.createEl('div', { cls: `hm-cell ${lvlClass}${extraClass}` });
            attachTooltipAndClick(cell, dateStr, curYearDay.format("DD.MM.YYYY"), mins, isFuture);
            
            curYearDay.add(1, 'days');
        }

        // ВАЖНО: Только сейчас, когда все 400+ DOM-элементов созданы в черновике,
        // мы ОДНИМ действием вставляем их на страницу. 
        container.appendChild(wrapper);

        // Авто-скролл к сегодняшнему дню
        setTimeout(() => {
            if (todayIndex !== -1) {
                const colIndex = Math.floor((todayIndex + yearStartWeekday - 1) / 7);
                scrollBox.scrollLeft = Math.max(0, (colIndex * 17) - 200);
            }
        }, 150);

    } catch (e) {
        container.createEl('div', { text: "⚠️ Ошибка рендера матрицы: " + e.message, attr: { style: "color: #e74c3c;" } });
    }
})();
```
# Доска Долгов
```dataviewjs
(async () => {
    const container = this.container;
    container.empty();

    if (!window.customJS || !customJS.RPG_Engine) return;

    try {
        const engine = customJS.RPG_Engine;
        const profilePage = dv.page("01_Dashboard/00_Profile.md");
        const ctx = await engine.getSharedContext(dv, profilePage);
        
        const todayStr = window.moment().format("YYYY-MM-DD");

        const debtsDiv = container.createEl('div');
        debtsDiv.style.cssText = "background: rgba(231, 76, 60, 0.05); border: 1px solid rgba(231, 76, 60, 0.2); padding: 20px; border-radius: 10px; margin-top: 15px;";
        
        const header = debtsDiv.createEl('div');
        header.style.cssText = "display: flex; align-items: center; gap: 10px; margin-bottom: 15px;";
        header.innerHTML = '<span style="font-size: 1.5em;">📜</span> <h3 style="margin: 0; color: #e74c3c;">Доска Долгов</h3>';

        let hasTasks = false;
        const ul = debtsDiv.createEl('div', { attr: { style: "display: flex; flex-direction: column; gap: 10px;" }});

        let sortedLogs = [...ctx.logsArray].sort((a, b) => a.file.name.localeCompare(b.file.name));        
        for (let log of sortedLogs) {
            let fileDate = log.file.name;
            if (fileDate >= todayStr || fileDate < ctx.archiveCutoff) continue; 

            const tasksArray = log.file.tasks ? (log.file.tasks.values || Array.from(log.file.tasks)) : [];
            let uncompleted = tasksArray.filter(t => !t.completed && t.status !== '-' && t.status !== 'x' && t.status !== 'X');
            
            if (uncompleted.length > 0) {
                hasTasks = true;
                const dayCard = ul.createEl('div');
                dayCard.style.cssText = "background: rgba(0,0,0,0.2); border-left: 3px solid #e74c3c; padding: 10px 15px; border-radius: 6px;";
                
                const linkWrap = dayCard.createEl('div', { attr: { style: "margin-bottom: 8px;" }});
                const link = document.createElement('a');
                link.href = log.file.path;
                link.innerText = "⚠️ ПРОСРОЧЕНО (" + fileDate + ")";
                link.className = 'internal-link';
                link.setAttribute('data-href', log.file.path);
                link.style.cssText = "font-weight: bold; color: #e74c3c; text-decoration: none; font-size: 0.9em;";
                linkWrap.appendChild(link);
                
                const taskList = dayCard.createEl('div', { attr: { style: "display: flex; flex-direction: column; gap: 4px; padding-left: 10px;" }});
                
                uncompleted.forEach(t => {
                    let textStr = t.text.replace(/\[difficulty::.*?\]/g, '').replace(/\[actual_time::.*?\]/g, '').trim(); 
                    taskList.createEl('div', { text: "• " + textStr, attr: { style: "color: var(--text-normal); font-size: 0.9em;" }});
                });
            }
        }

        if (!hasTasks) {
            ul.remove();
            debtsDiv.createEl('div', { text: "🎉 У вас нет просроченных квестов! Гильдия вами гордится.", attr: { style: "color: #2ecc71; font-weight: bold; font-size: 1.1em;" }});
        }
    } catch(e) {
        container.createEl('p', {text: "Ошибка Доски Долгов: " + e.message, attr: {style: "color: #e74c3c;"}});
    }
})();
```
# Прогресс структуры хронологии
```dataviewjs
const container = this.container;
container.empty();

const files = app.vault.getMarkdownFiles();
const totalNotes = files.length;
const resolvedLinks = app.metadataCache.resolvedLinks;

let withOutlinks = 0;
let withInlinks = 0;
let emptyNotes = 0;
const inlinkCounts = {};

(async () => {
    let chunksProcessed = 0;
    for (const file of files) {
        chunksProcessed++;
        if (chunksProcessed % 200 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        if (file.stat && file.stat.size <= 4) emptyNotes++;
        
        const outlinks = resolvedLinks[file.path] || {};
        if (Object.keys(outlinks).length > 0) {
            withOutlinks++;
        }
        for (const dest in outlinks) {
            inlinkCounts[dest] = (inlinkCounts[dest] || 0) + outlinks[dest];
        }
    }

    for (const file of files) {
        if (inlinkCounts[file.path] > 0) {
            withInlinks++;
        }
    }

    const connectivity = totalNotes > 0 ? ((withOutlinks / totalNotes) * 100).toFixed(1) : "0.0";

    let statsHTML = `<div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; font-size: 0.9em; line-height: 1.6;">
      <ul style="list-style-type: none; padding-left: 0; margin: 0;">
        <li>• <b>Всего заметок:</b> ${totalNotes}</li>
        <li>• <b>Заметки с исходящими ссылками:</b> ${withOutlinks}</li>
        <li>• <b>Заметки с входящими ссылками:</b> ${withInlinks}</li>
        <li>• <b>Пустые заметки (нет содержимого):</b> ${emptyNotes}</li>
        <li>• <b>Процент связанности (имеют хотя бы одну ссылку):</b> <span style="color: var(--text-accent); font-weight: bold;">${connectivity}%</span></li>
      </ul>
    </div>`;

    const statsDiv = container.createEl('div');
    statsDiv.innerHTML = statsHTML;
})();
```
