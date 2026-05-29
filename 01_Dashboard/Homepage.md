---
banner_y: 0.5
banner: https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&w=1400&q=80
---
## 🏰 Цитадель Управления
```dataviewjs
(async () => {
    const container = this.container;
    container.empty();

    if (!window.customJS || !customJS.RPG_Engine) {
        container.createEl('div', { text: "🔮 Пробуждение древних скриптов..." });
        return;
    }

    try {
        const engine = customJS.RPG_Engine;
        const profilePage = dv.page("01_Dashboard/00_Profile.md");
        const profileFile = app.vault.getAbstractFileByPath(profilePage.file.path);
        
        // Получаем контекст из нового движка
        const ctx = await engine.getSharedContext(dv, profilePage);

        const isTraumatized = ctx.currentHp <= 0;
        const isBankrupt = ctx.currentGold < 0; 

        const hpColor = isTraumatized ? '#ff4757' : (ctx.currentHp > 50 ? '#2ed573' : '#ffa502');
        
        const hofPage = dv.page("01_Dashboard/01_Hall_of_Fame.md");
        const unlockedCount = hofPage && Array.isArray(hofPage.unlocked_badges) ? hofPage.unlocked_badges.length : 0;
        const todayStr = window.moment().format("YYYY-MM-DD");

        const main = container.createEl('div');
        main.style.cssText = "max-width: 600px; margin: 0 auto; width: 100%; box-sizing: border-box; font-family: var(--font-interface); padding-bottom: 40px;";

        const styleEl = main.createEl('style');
        styleEl.innerHTML = `
            .rpg-vertical-hub { display: flex; flex-direction: column; gap: 20px; width: 100%; box-sizing: border-box; }
            .panel-hero { background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 15px; box-shadow: none !important; }
            .hero-row { display: flex; align-items: center; justify-content: space-between; width: 100%; }
            .hero-profile { display: flex; align-items: center; gap: 15px; }
            .hero-avatar { width: 65px; height: 65px; border-radius: 50%; background: var(--background-secondary); border: 2px solid var(--text-accent); display: flex; align-items: center; justify-content: center; font-size: 2.2em; }
            .hero-info h2 { margin: 0; font-size: 1.5em; color: var(--text-title); }
            .hero-title-tag { font-size: 0.85em; color: var(--text-accent); text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }
            .gold-badge { padding: 6px 14px; border-radius: 8px; font-weight: bold; font-size: 1.15em; }
            .bars-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%; }
            .hud-bar { display: flex; flex-direction: column; gap: 4px; }
            .hud-label { display: flex; justify-content: space-between; font-size: 0.8em; font-weight: bold; text-transform: uppercase; color: var(--text-muted); }
            .hud-bg { background: rgba(0,0,0,0.3); height: 10px; border-radius: 5px; overflow: hidden; border: 1px solid rgba(255,255,255,0.03); }
            .hud-fill { height: 100%; transition: width 0.4s ease; }
            .heal-trigger-btn { background: rgba(46, 204, 113, 0.08); border: 1px dashed rgba(46, 204, 113, 0.3); color: #2ecc71; padding: 10px; border-radius: 8px; font-weight: bold; font-size: 0.9em; cursor: pointer; transition: 0.15s; text-align: center; width: 100%; box-sizing: border-box; box-shadow: none !important; }
            .heal-trigger-btn:hover:not(:disabled) { background: #2ecc71; color: black; border-style: solid; }
            .heal-trigger-btn:disabled { opacity: 0.25; cursor: not-allowed; }
            .nav-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; width: 100%; }
            .nav-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 12px 4px; display: flex; flex-direction: column; align-items: center; gap: 4px; text-decoration: none !important; transition: 0.2s; text-align: center; box-shadow: none !important; }
            .nav-card:hover { border-color: var(--text-accent); background: rgba(var(--text-accent-rgb), 0.03); transform: translateY(-2px); }
            .nav-icon { font-size: 1.6em; }
            .nav-text { font-weight: bold; color: var(--text-normal); font-size: 0.85em; }
            .nav-stat { font-size: 0.65em; color: var(--text-muted); font-weight: bold; text-transform: uppercase; }
            .block-panel { background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.04); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 12px; width: 100%; box-sizing: border-box; box-shadow: none !important; }
            .panel-header { font-size: 0.8em; font-weight: bold; color: var(--text-accent); text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px; margin: 0; }
            .matrix-calendar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; width: 100%; }
            .matrix-header { font-size: 0.7em; font-weight: bold; color: var(--text-muted); text-align: center; padding-bottom: 2px; text-transform: uppercase; }
            .matrix-cell { aspect-ratio: 1.5; display: flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid rgba(255,255,255,0.02); color: var(--text-normal); font-size: 0.85em; cursor: pointer; transition: 0.15s; font-weight: bold; background: rgba(0,0,0,0.1); }
            .matrix-cell:hover { border-color: var(--text-accent); background: rgba(var(--text-accent-rgb), 0.08); transform: scale(1.04); }
            .matrix-cell.today { border-color: var(--text-accent); color: var(--text-accent); background: rgba(var(--text-accent-rgb), 0.04); }
            .matrix-cell.active-day { background: rgba(46, 204, 113, 0.15); color: #2ecc71; border-color: rgba(46, 204, 113, 0.2); }
            .matrix-cell.active-day:hover { background: rgba(46, 204, 113, 0.25); }
            .matrix-cell.blank { opacity: 0; pointer-events: none; }
            .loot-wrapper { display: flex; flex-direction: column; gap: 8px; }
            .loot-card { display: flex; flex-direction: column; gap: 4px; padding: 10px 14px; background: rgba(0,0,0,0.15); border-radius: 8px; border: 1px solid rgba(255,255,255,0.02); }
            .loot-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 15px; width: 100%; }
            .loot-anchor { color: var(--text-normal) !important; text-decoration: none !important; font-weight: bold; font-size: 0.9em; line-height: 1.3; word-break: break-word; overflow-wrap: break-word; flex-grow: 1; }
            .loot-anchor:hover { color: var(--text-accent) !important; }
            .loot-date { font-size: 0.75em; color: var(--text-muted); font-weight: bold; white-space: nowrap; margin-top: 2px; }
            .quest-row { font-size: 0.9em; padding: 5px 0; color: var(--text-normal); display: flex; gap: 10px; align-items: flex-start; line-height: 1.4; }
            .launch-action-btn { background: var(--interactive-accent); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: bold; font-size: 0.95em; cursor: pointer; width: 100%; transition: 0.2s; box-shadow: none !important; text-transform: uppercase; letter-spacing: 0.5px; }
            .launch-action-btn:hover { background: var(--interactive-accent-hover); transform: translateY(-1px); }
        `;

        const root = main.createEl('div', { cls: 'rpg-vertical-hub' });

        const heroPanel = root.createEl('div', { cls: 'panel-hero' });
        const heroRow = heroPanel.createEl('div', { cls: 'hero-row' });
        
        let displayTitle = ctx.title;
        let avatarIcon = "🧙‍♂️";
        let badgeStyle = "background: rgba(241, 196, 15, 0.06); color: #f1c40f; border: 1px solid rgba(241, 196, 15, 0.15);";
        
        if (isBankrupt) {
            displayTitle = "💸 Должник (" + ctx.title + ")";
            avatarIcon = "📉";
            badgeStyle = "background: rgba(231, 76, 60, 0.1); color: #e74c3c; border: 1px solid rgba(231, 76, 60, 0.3);";
        }

        const profileSec = heroRow.createEl('div', { cls: 'hero-profile' });
        profileSec.createEl('div', { cls: 'hero-avatar', text: avatarIcon });
        const info = profileSec.createEl('div', { cls: 'hero-info' });
        info.createEl('div', { cls: 'hero-title-tag', text: displayTitle });
        info.createEl('h2', { text: "Хранитель Системы" });
        
        heroRow.createEl('div', { cls: 'gold-badge', text: `💰 ${ctx.currentGold} GP`, attr: { style: badgeStyle } });

        const barsGrid = heroPanel.createEl('div', { cls: 'bars-grid' });
        
        const hpGroup = barsGrid.createEl('div', { cls: 'hud-bar' });
        const hpLabels = hpGroup.createEl('div', { cls: 'hud-label' });
        hpLabels.createEl('span', { text: "Энергия" });
        hpLabels.createEl('span', { text: `${ctx.currentHp}/100` });
        const hpBg = hpGroup.createEl('div', { cls: 'hud-bg' });
        hpBg.createEl('div', { cls: 'hud-fill', attr: { style: `width: ${ctx.currentHp}%; background: ${hpColor};` } });

        const xpGroup = barsGrid.createEl('div', { cls: 'hud-bar' });
        const xpLabels = xpGroup.createEl('div', { cls: 'hud-label' });
        xpLabels.createEl('span', { text: `Уровень ${ctx.currentLevel}` });
        xpLabels.createEl('span', { text: `${ctx.progressPercent}%` });
        const xpBg = xpGroup.createEl('div', { cls: 'hud-bg' });
        xpBg.createEl('div', { cls: 'hud-fill', attr: { style: `width: ${ctx.progressPercent}%; background: #3498db;` } });

        const profileCache = app.metadataCache.getFileCache(profileFile);
        const potionsCount = profileCache?.frontmatter?.inventory?.potion || 0;
        
        const healBtn = heroPanel.createEl('button', { cls: 'heal-trigger-btn' });
        if (ctx.currentHp >= 100) {
            healBtn.innerText = `🟢 Здоровье полностью восстановлено`;
            healBtn.disabled = true;
        } else if (potionsCount <= 0) {
            healBtn.innerText = `🧪 Нет зелий лечения`;
            healBtn.disabled = true;
        } else {
            healBtn.innerText = `🧪 Использовать зелье лечения (В наличии: ${potionsCount} шт)`;
        }
        
        healBtn.addEventListener('click', async () => {
            healBtn.disabled = true;
            healBtn.innerText = "⏳ Применение...";
            try {
                await app.fileManager.processFrontMatter(profileFile, (f) => {
                    if (f.inventory && f.inventory.potion > 0) {
                        f.inventory.potion = Math.max(0, f.inventory.potion - 1);
                        if (!f.potions_history) f.potions_history = {};
                        f.potions_history[todayStr] = (parseInt(f.potions_history[todayStr]) || 0) + 1;
                    }
                });
                new Notice("✅ Здоровье успешно восстановлено!");
            } catch(err) {
                new Notice("Ошибка применения: " + err.message);
                healBtn.disabled = false;
            }
        });

        const navRow = root.createEl('div', { cls: 'nav-row' });
        const links = [
            { path: "01_Dashboard/00_Profile.md", icon: "👤", title: "Кабинет", stat: "Аналитика" },
            { path: "01_Dashboard/01_Hall_of_Fame.md", icon: "🏆", title: "Зал Славы", stat: `${unlockedCount} Наград` },
            { path: "01_Dashboard/02_Shop.md", icon: "🛒", title: "Лавка", stat: "Магазин" },
            { path: "01_Dashboard/03_Backpack.md", icon: "🎒", title: "Рюкзак", stat: "Предметы" }
        ];
        links.forEach(l => {
            const card = navRow.createEl('a', { cls: 'nav-card', attr: { href: l.path } });
            card.createEl('div', { cls: 'nav-icon', text: l.icon });
            card.createEl('div', { cls: 'nav-text', text: l.title });
            card.createEl('div', { cls: 'nav-stat', text: l.stat });
            card.addEventListener('click', (e) => {
                e.preventDefault();
                app.workspace.getLeaf(false).openFile(app.vault.getAbstractFileByPath(l.path));
            });
        });

        const calPanel = root.createEl('div', { cls: 'block-panel' });
        calPanel.createEl('h4', { cls: 'panel-header', text: "📅 Свиток Хронологии (" + window.moment().format("MMMM YYYY") + ")" });
        
        const matrix = calPanel.createEl('div', { cls: 'matrix-calendar' });
        const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
        dayNames.forEach(d => matrix.createEl('div', { cls: 'matrix-header', text: d }));

        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const totalDays = new Date(y, m + 1, 0).getDate();
        let firstDay = new Date(y, m, 1).getDay();
        firstDay = firstDay === 0 ? 6 : firstDay - 1;

        for (let i = 0; i < firstDay; i++) {
            matrix.createEl('div', { cls: 'matrix-cell blank' });
        }

        for (let day = 1; day <= totalDays; day++) {
            const loopMoment = window.moment(new Date(y, m, day));
            const loopDateStr = loopMoment.format("YYYY-MM-DD");
            const isToday = (loopDateStr === todayStr);
            const focusTime = ctx.focusMap ? ctx.focusMap[loopDateStr] : 0;
            const hasActivity = focusTime > 0;

            let cellClass = 'matrix-cell';
            if (isToday) cellClass += ' today';
            if (hasActivity) cellClass += ' active-day';

            const cell = matrix.createEl('div', { cls: cellClass, text: String(day) });
            if (hasActivity) cell.title = `Фокус: ${focusTime} мин.`;

            cell.addEventListener('click', async () => {
                const targetPath = `05_Journal/${loopDateStr}.md`;
                let file = app.vault.getAbstractFileByPath(targetPath);
                
                if (file) {
                    app.workspace.getLeaf(false).openFile(file);
                } else {
                    new Notice(`⏳ Создание свитка квестов для даты ${loopDateStr}...`);
                    try {
                        const TEMPLATE_PATH = "00_System/Daily Note Template.md"; 
                        const templateFile = app.vault.getAbstractFileByPath(TEMPLATE_PATH);
                        
                        if (!templateFile) {
                            new Notice(`⚠️ Шаблон не найден по пути: ${TEMPLATE_PATH}`);
                            return;
                        }
                        
                        let templateContent = await app.vault.read(templateFile);
                        templateContent = templateContent.replace(/<%\s*tp\.date\.now\("YYYY-MM-DD"\)\s*%>/g, loopDateStr);
                        
                        const newFile = await app.vault.create(targetPath, templateContent);
                        app.workspace.getLeaf(false).openFile(newFile);
                    } catch(err) {
                        new Notice("Ошибка генерации файла: " + err.message);
                    }
                }
            });
        }

        const lootPanel = root.createEl('div', { cls: 'block-panel' });
        lootPanel.createEl('h4', { cls: 'panel-header', text: "🧠 Кузница Знаний (Последние концепты)" });
        
        const lootWrapper = lootPanel.createEl('div', { cls: 'loot-wrapper' });
        const zettels = dv.pages('"04_Zettelkasten"').where(p => p.file.folder.includes('02_Concepts')).sort(p => p.file.ctime, "desc").slice(0, 4);
        
        if (zettels.length > 0) {
            zettels.forEach(z => {
                let row = lootWrapper.createEl('div', { cls: 'loot-card' });
                let headerDiv = row.createEl('div', { cls: 'loot-header' });
                
                let anchor = headerDiv.createEl('a', { cls: 'loot-anchor', text: "📄 " + z.file.name, attr: { href: z.file.path } });
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    app.workspace.getLeaf(false).openFile(app.vault.getAbstractFileByPath(z.file.path));
                });
                
                headerDiv.createEl('span', { cls: 'loot-date', text: window.moment(z.file.ctime.toString()).format("DD.MM") });
            });
        } else {
            lootPanel.createEl('div', { text: "Трофеев не найдено.", attr: { style: "font-size:0.85em; color:var(--text-muted); font-style:italic;" } });
        }

        const qPanel = root.createEl('div', { cls: 'block-panel' });
        qPanel.createEl('h4', { cls: 'panel-header', text: "⚔️ Текущие Квесты на сегодня" });
        
        const todayPage = dv.page(`05_Journal/${todayStr}.md`);
        let hasQuests = false;
        
        if (todayPage && todayPage.file.tasks) {
            const todayTasks = todayPage.file.tasks.values || Array.from(todayPage.file.tasks);
            const activeTasks = todayTasks.filter(t => !t.completed && t.status !== '-');
            
            if (activeTasks.length > 0) {
                hasQuests = true;
                activeTasks.forEach(t => {
                    let cleanText = t.text.replace(/\[difficulty::.*?\]/g, '').replace(/\[actual_time::.*?\]/g, '').trim();
                    let item = qPanel.createEl('div', { cls: 'quest-row' });
                    item.createEl('span', { text: "🔸", attr: { style: "color: var(--text-accent);" } });
                    item.createEl('span', { text: cleanText });
                });
            }
        }
        if (!hasQuests) {
            qPanel.createEl('div', { text: "Все задачи выполнены или ежедневный журнал еще не запущен.", attr: { style: "font-size:0.85em; color:var(--text-muted); font-style:italic; text-align:center; padding: 10px 0;" } });
        }

        const footer = root.createEl('div');
        const mainLaunchBtn = footer.createEl('button', { cls: 'launch-action-btn', text: "📜 Открыть пульт управления временем" });
        mainLaunchBtn.addEventListener('click', () => {
            const path = `05_Journal/${todayStr}.md`;
            const file = app.vault.getAbstractFileByPath(path);
            if (file) app.workspace.getLeaf(false).openFile(file);
            else new Notice("⚠️ Дневник на сегодня еще не создан!");
        });

    } catch (e) {
        container.createEl('div', { text: "⚠️ Критическая ошибка хаба: " + e.message, attr: { style: "color: #ff4757; background: rgba(255,71,87,0.1); padding: 15px; border-radius: 10px; text-align: center;" } });
    }
})();
```
