---
# Экономика и бонусы (пишутся Лавкой и Залом Славы)
gold_spent: 0
bonus_xp: 0
bonus_gold: 0

# Инвентарь
total_potions_consumed: 0
potions_history: {}
inventory:
  potion: 0
  walk: 0
  tea: 0
  youtube: 0
  games: 0
  social: 0
  dayoff: 0
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

    if (!window.customJS || !customJS.RPG_Engine) return;

    try {
        const engine = customJS.RPG_Engine;
        const profilePage = dv.page("01_Dashboard/00_Profile.md");
        const ctx = await engine.getSharedContext(dv, profilePage);

        const styleEl = container.createEl('style');
        styleEl.innerHTML = `
          .activity-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 10px; padding: 10px; }
          .activity-box { aspect-ratio: 1; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 0.8em; color: rgba(255,255,255,0.5); cursor: default; transition: transform 0.2s; font-family: monospace; position: relative; }
          .activity-box:hover { transform: scale(1.15); z-index: 2; box-shadow: 0 0 8px rgba(0,0,0,0.5); }
          .lvl-0 { background: rgba(255,255,255,0.02); }
          .lvl-1 { background: rgba(46, 204, 113, 0.2); border-color: rgba(46, 204, 113, 0.3); color: white; }
          .lvl-2 { background: rgba(46, 204, 113, 0.5); border-color: rgba(46, 204, 113, 0.6); color: white; }
          .lvl-3 { background: rgba(46, 204, 113, 0.8); border-color: rgba(46, 204, 113, 0.9); color: white; font-weight: bold; }
          .lvl-4 { background: #27ae60; border-color: #2ecc71; color: white; font-weight: bold; box-shadow: 0 0 5px #27ae60; }
        `;

        const titleDiv = container.createEl('div', { text: "🗺️ Карта игровой активности (Фокус за 35 дней)" });
        titleDiv.style.cssText = "font-size: 0.85em; color: var(--text-muted); text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 5px;";

        const grid = container.createEl('div', { cls: 'activity-grid' });

        for (let dateStr in ctx.focusMap) {
            let mins = ctx.focusMap[dateStr] || 0;
            let dayNum = window.moment(dateStr).format("D");
            
            let lvl = 0;
            if (mins > 0) lvl = 1;
            if (mins >= 30) lvl = 2;
            if (mins >= 60) lvl = 3;
            if (mins >= 120) lvl = 4;
            
            let box = grid.createEl('div', { cls: "activity-box lvl-" + lvl, text: dayNum });
            box.title = dateStr + ": Фокус " + mins + " мин.";
        }
    } catch(e) {
        console.error(e);
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

		let sortedLogs = ctx.logsArray.sort((a, b) => a.file.name.localeCompare(b.file.name));        
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

for (const file of files) {
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
```
