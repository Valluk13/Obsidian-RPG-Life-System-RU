---
banner: "[https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&w=1400&q=80](https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&w=1400&q=80)"
banner_y: 0.5
---
# 🏛️ Цитадель Управления
```dataviewjs
(async () => {
    const container = this.container;
    container.empty();

    if (!window.customJS || !customJS.RPG_Engine) {
        container.createEl('div', { text: "🔮 Пробуждение архитектуры V2...", attr: { style: "color: var(--text-muted); font-style: italic; padding: 20px;" } });
        return;
    }

    try {
        const engine = customJS.RPG_Engine;
        const profilePage = dv.page("01_Dashboard/00_Profile.md");
        const ctx = await engine.getSharedContext(dv, profilePage);

        // --- ДИНАМИЧЕСКИЕ ЛИМИТЫ (Вместо хардкода 100 и 1000) ---
        const maxHpConfig = engine.CONFIG.game_balance.maxHp || 100;
        const xpPerLevelConfig = engine.CONFIG.game_balance.xpPerLevel || 1000;

        // --- ВЫЧИСЛЕНИЕ ЛОГИЧЕСКИХ СУТОК (ОТСЕЧКА 4 УТРА) ---
        const getLogicalTargetDate = () => {
            let currentMoment = window.moment();
            if (currentMoment.hour() < 4) currentMoment.subtract(1, 'days');
            return currentMoment.format("YYYY-MM-DD");
        };
        const todayStr = getLogicalTargetDate();
        const displayDateStr = window.moment(todayStr).format("DD.MM.YYYY");
        
        const journalFolderRaw = engine.CONFIG.journalPath || '"05_Journal"';
        const cleanJournalFolder = journalFolderRaw.replace(/"/g, '');
        const todayPath = `${cleanJournalFolder}/${todayStr}.md`;
        const todayLog = dv.page(todayPath);
        const todayFile = app.vault.getAbstractFileByPath(todayPath);

        // --- СБОР АКТИВНЫХ ПРОЕКТОВ ---
        const allProjects = dv.pages('-"05_Journal" and -"99_System" and -"01_Dashboard"')
            .where(p => p.status === "active" && !p.file.name.includes("Template") && !p.file.name.includes("Шаблон"));
        
        let activeProjectsData = [];
        for (let p of allProjects) {
            let totalTasks = 0; let completedTasks = 0;
            if (p.file.tasks) {
                const tasksArray = p.file.tasks.values || Array.from(p.file.tasks);
                totalTasks = tasksArray.length;
                completedTasks = tasksArray.filter(t => t.completed || t.status === 'x' || t.status === 'X').length;
            }
            let pct = totalTasks > 0 ? Math.floor((completedTasks / totalTasks) * 100) : 0;
            
            let daysLeft = null;
            if (p.deadline) {
                const ms = p.deadline.toMillis ? p.deadline.toMillis() : new Date(p.deadline).getTime();
                daysLeft = window.moment(ms).startOf('day').diff(window.moment().startOf('day'), 'days');
            }
            
            activeProjectsData.push({
                name: p.file.name, path: p.file.path, deadline: p.deadline, daysLeft: daysLeft,
                rank: p.rank ? String(p.rank).toUpperCase() : 'C', total: totalTasks, done: completedTasks, pct: pct
            });
        }

        const rankWeights = { 'S': 100, 'A': 80, 'B': 60, 'C': 40, 'D': 20 };
        const getWeight = (r) => rankWeights[r] || 0;

        activeProjectsData.sort((a, b) => {
            let dayA = a.daysLeft === null ? 9999 : a.daysLeft;
            let dayB = b.daysLeft === null ? 9999 : b.daysLeft;
            if (dayA !== dayB) return dayA - dayB;
            return getWeight(b.rank) - getWeight(a.rank); 
        });

        // --- ЛОГИКА ДИНАМИЧЕСКОГО ГЕРОЯ ---
        const hp = ctx.currentHp;
        let avatar = "🧙‍♂️"; let avatarBorder = "#2ecc71"; let pulseClass = ""; let hpGradient = "linear-gradient(90deg, #27ae60, #2ecc71)";

        if (hp < 30) { avatar = "🤕"; avatarBorder = "#e74c3c"; pulseClass = "pulse-red"; hpGradient = "linear-gradient(90deg, #c0392b, #e74c3c)"; } 
        else if (hp < 70) { avatar = "⚔️"; avatarBorder = "#e67e22"; hpGradient = "linear-gradient(90deg, #d35400, #e67e22)"; }

        const xpPercent = ctx.progressPercent || 0;

        // --- ГЛОБАЛЬНЫЕ СТИЛИ (БЕЗ ТЕНЕЙ И БЕЗ ГРАДИЕНТОВ ФОНА) ---
        const styleEl = container.createEl('style');
        styleEl.innerHTML = `
            .markdown-preview-sizer.markdown-preview-section { max-width: 96% !important; margin: 0 auto !important; width: 100% !important; }
            
            .cyber-wrapper {
                background: transparent !important;
                border-radius: 20px;
                padding: 10px 0;
                box-shadow: none !important;
            }

            @keyframes pulse-hp { 0% { border-color: var(--avatar-border); } 50% { border-color: rgba(231, 76, 60, 0.2); } 100% { border-color: var(--avatar-border); } }
            .pulse-red { animation: pulse-hp 1.5s infinite; }

            .dashboard-container { display: grid; grid-template-columns: 330px 1fr; gap: 24px; margin-top: 15px; align-items: start; box-shadow: none !important; }
            @media (max-width: 900px) { .dashboard-container { grid-template-columns: 1fr; } }
            
            .db-panel { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; transform: translateZ(0); box-shadow: none !important; }
            .panel-title { font-size: 0.85em; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 8px; }
            
            /* HERO */
            .hero-block { display: flex; flex-direction: column; align-items: center; margin-bottom: 25px; }
            .hero-avatar { width: 85px; height: 85px; border-radius: 50%; border: 4px solid var(--avatar-border); display: flex; align-items: center; justify-content: center; font-size: 40px; background: rgba(0,0,0,0.3); margin-bottom: 12px; box-shadow: none !important; }
            .hero-name { margin: 0; font-size: 1.25em; font-weight: 900; color: var(--text-normal); text-align: center; line-height: 1.2; }
            .hero-lvl { font-size: 0.75em; background: var(--interactive-accent); color: white; padding: 3px 10px; border-radius: 6px; font-weight: bold; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: none !important; }
            
            .stat-wrapper { margin-bottom: 15px; width: 100%; display: block; }
            .stat-labels { display: flex; justify-content: space-between; font-size: 0.85em; font-weight: 800; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; }
            .volumetric-bar { width: 100%; height: 16px; background: rgba(0,0,0,0.4); border-radius: 8px; overflow: hidden; display: block; box-shadow: none !important; }
            .v-bar-fill { height: 100%; border-radius: 8px; transition: width 0.8s ease-out; display: block; box-shadow: none !important; }
            
            .quick-stats { display: flex; gap: 8px; margin-bottom: 25px; width: 100%; }
            .q-stat { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); padding: 10px 5px; border-radius: 8px; flex: 1; text-align: center; box-shadow: none !important; }
            .q-val { font-size: 1.1em; font-weight: 900; font-family: monospace; }
            .q-lbl { font-size: 0.65em; font-weight: bold; color: var(--text-muted); text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px; }

            /* APP DOCK */
            .app-dock { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 25px; }
            .app-icon { display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; transition: transform 0.2s; box-shadow: none !important; }
            .app-squircle { width: 50px; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; border: 1px inset rgba(255,255,255,0.1); box-shadow: none !important; }
            .app-icon:hover { transform: translateY(-3px); }
            .app-icon:hover .app-squircle { filter: brightness(1.15); box-shadow: none !important; }
            .app-label { font-size: 0.65em; font-weight: bold; color: var(--text-muted); text-align: center; line-height: 1; }
            
            /* RITUALS & SUMMARY */
            .rituals-grid { display: flex; flex-direction: column; gap: 8px; margin-bottom: 25px;}
            .ritual-btn { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); padding: 10px 12px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: background 0.2s; color: var(--text-normal); font-size: 0.85em; font-weight: bold; text-align: left; box-shadow: none !important; }
            .ritual-btn:hover { background: rgba(255,255,255,0.05); border-color: var(--interactive-accent); }
            .ritual-btn.done { background: rgba(46, 204, 113, 0.1); border-color: rgba(46, 204, 113, 0.3); color: #2ecc71; text-decoration: line-through; opacity: 0.7; }
            
            .summary-box { background: rgba(0,0,0,0.15); border-left: 3px solid #3498db; padding: 12px 15px; border-radius: 6px; font-size: 0.85em; box-shadow: none !important; }
            .sum-row { display: flex; justify-content: space-between; margin-bottom: 6px; color: var(--text-muted); font-weight: bold; }
            .sum-row:last-child { margin-bottom: 0; }
            .sum-row span:last-child { color: var(--text-normal); font-family: monospace; font-size: 1.1em; }

            /* AI ADVISOR STACK FEED */
            .ai-advisor-feed { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; box-shadow: none !important; }
            .ai-alert { padding: 14px 18px; border-radius: 10px; font-weight: bold; font-size: 0.9em; line-height: 1.4; display: flex; gap: 15px; align-items: center; box-shadow: none !important; }
            .alert-crit { background: rgba(231, 76, 60, 0.12); border: 1px solid #e74c3c; color: #ff6b6b; border-left: 5px solid #e74c3c; }
            .alert-high { background: rgba(230, 126, 34, 0.12); border: 1px solid #e67e22; color: #ffa502; border-left: 5px solid #e67e22; }
            .alert-warn { background: rgba(52, 152, 219, 0.12); border: 1px solid #3498db; color: #70a1ff; border-left: 5px solid #3498db; }
            .alert-safe { background: rgba(46, 204, 113, 0.12); border: 1px solid #2ecc71; color: #2ed573; border-left: 5px solid #2ecc71; }
            .ai-icon { font-size: 1.6em; }

            .start-day-banner { background: rgba(46, 204, 113, 0.1); border: 1px dashed rgba(46, 204, 113, 0.4); padding: 20px; border-radius: 12px; text-align: center; cursor: pointer; transition: background 0.2s; margin-bottom: 20px; box-shadow: none !important; }
            .start-day-banner:hover { background: rgba(46, 204, 113, 0.15); border-style: solid; }

            /* PROJECTS RADAR */
            .proj-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 16px; box-shadow: none !important; }
            .proj-card { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; min-height: 140px; box-sizing: border-box; cursor: pointer; box-shadow: none !important; }
            .proj-card:hover { border-color: var(--interactive-accent); }
            
            .proj-header { display: flex; justify-content: flex-end; gap: 5px; margin-bottom: 8px; flex-shrink: 0; }
            .p-badge { font-size: 0.65em; padding: 3px 6px; border-radius: 4px; font-weight: bold; text-transform: uppercase; line-height: 1; }
            .b-rank { background: var(--interactive-accent); color: white; }
            .b-dead { background: rgba(231,76,60,0.2); color: #e74c3c; border: 1px solid rgba(231,76,60,0.3); }
            
            .proj-title { font-size: 0.95em; font-weight: 800; margin: 0 0 12px 0; color: var(--text-normal); line-height: 1.35em; height: 2.7em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; flex-grow: 1; }
            
            .p-bar-wrapper { margin-top: auto; flex-shrink: 0; }
            .p-bar-info { display: flex; justify-content: space-between; font-size: 0.7em; color: var(--text-muted); font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
            .p-bar-bg { width: 100%; height: 6px; background: rgba(0,0,0,0.4); border-radius: 3px; overflow: hidden; box-shadow: none !important; }
            .p-bar-fg { height: 100%; background: linear-gradient(90deg, #9b59b6, #8e44ad); box-shadow: none !important; }
            
            /* HEATMAP MATRIX */
            .hm-scroll-box { overflow-x: auto; padding-bottom: 10px; width: 100%; display: flex; flex-direction: column; gap: 5px; contain: content; box-shadow: none !important; }
            .hm-scroll-box::-webkit-scrollbar { height: 6px; }
            .hm-scroll-box::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
            .hm-months-row { display: flex; position: relative; height: 16px; margin-left: 25px; margin-bottom: 2px; }
            .hm-month-label { position: absolute; font-size: 0.7em; color: var(--text-muted); font-weight: bold; }
            .hm-grid-container { display: flex; gap: 6px; contain: content; box-shadow: none !important; }
            .hm-days-column { display: grid; gap: 4px; padding-right: 6px; text-align: right; user-select: none; }
            .hm-day-label { font-size: 0.65em; color: var(--text-muted); line-height: 1; display: flex; align-items: center; justify-content: flex-end; }
            .hm-cells-grid { display: grid; grid-auto-flow: column; gap: 4px; contain: content; transform: translateZ(0); box-shadow: none !important; }
            .hm-cell { width: 13px; height: 13px; border-radius: 3px; cursor: pointer; box-shadow: none !important; }
            .hm-cell:hover:not(.hm-future):not(.mc-empty) { border: 1px solid #fff; }
            .hm-future { background: rgba(255,255,255,0.01); border: 1px dashed rgba(255,255,255,0.03); pointer-events: none; }
            .hm-lvl-0 { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); }
            .hm-lvl-1 { background: #004d22; } .hm-lvl-2 { background: #008838; } .hm-lvl-3 { background: #00c24e; } .hm-lvl-4 { background: #00ff66; }
            .hm-today { border: 1px solid var(--text-accent) !important; }
            .mc-empty { background: transparent; border: none; pointer-events: none; }
        `;

        const setupLinkClick = (el, path, isDay = false) => {
            const handler = (e) => {
                if (e.button === 0 || e.button === 1) {
                    e.preventDefault();
                    e.stopPropagation();
                    const openNewTab = (e.button === 1 || e.ctrlKey || e.metaKey);
                    if (isDay) {
                        app.workspace.openLinkText(path, path, openNewTab);
                    } else {
                        const file = app.vault.getAbstractFileByPath(path);
                        if (file) {
                            let leaf = app.workspace.getLeaf(openNewTab ? 'tab' : false);
                            leaf.openFile(file);
                        }
                    }
                }
            };
            el.addEventListener('click', handler);
            el.addEventListener('auxclick', handler);
            el.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); });
        };

        const wrapper = container.createEl('div', { cls: 'cyber-wrapper' });
        const root = wrapper.createEl('div', { cls: 'dashboard-container' });

        // =========================================================
        // ЛЕВАЯ КОЛОНКА (Профиль персонажа)
        // =========================================================
        const leftCol = root.createEl('div', { cls: 'db-panel' });
        
        // 1. Герой
        const heroBlock = leftCol.createEl('div', { cls: 'hero-block' });
        const ava = heroBlock.createEl('div', { cls: `hero-avatar ${pulseClass}`, text: avatar });
        ava.style.setProperty('--avatar-border', avatarBorder);
        heroBlock.createEl('h3', { cls: 'hero-name', text: ctx.title });
        heroBlock.createEl('div', { cls: 'hero-lvl', text: `Уровень ${ctx.currentLevel}` });

        // 2. Бары ХП и Опыта (СИНХРОНИЗИРОВАНЫ С RPG_CONFIG)
        const hpWrapper = leftCol.createEl('div', { cls: 'stat-wrapper' });
        const hpLables = hpWrapper.createEl('div', { cls: 'stat-labels' });
        hpLables.createEl('span', { text: 'Энергия (HP)' });
        hpLables.createEl('span', { text: `${hp} / ${maxHpConfig}`, attr: { style: `color:${avatarBorder};` } });
        const hpBar = hpWrapper.createEl('div', { cls: 'volumetric-bar' });
        hpBar.createEl('div', { cls: 'v-bar-fill', attr: { style: `width: ${Math.min(100, Math.floor((hp / maxHpConfig) * 100))}%; background: ${hpGradient};` } });

        const xpWrapper = leftCol.createEl('div', { cls: 'stat-wrapper' });
        const xpLables = xpWrapper.createEl('div', { cls: 'stat-labels' });
        xpLables.createEl('span', { text: 'Опыт (XP)' });
        xpLables.createEl('span', { text: `${ctx.xpInCurrentLevel} / ${xpPerLevelConfig}`, attr: { style: `color:#3498db;` } });
        const xpBar = xpWrapper.createEl('div', { cls: 'volumetric-bar' });
        xpBar.createEl('div', { cls: 'v-bar-fill', attr: { style: `width: ${xpPercent}%; background: linear-gradient(90deg, #2980b9, #3498db);` } });

        // 3. Быстрая Статистика
        const qStats = leftCol.createEl('div', { cls: 'quick-stats' });
        const addStat = (val, lbl, color) => {
            const b = qStats.createEl('div', { cls: 'q-stat' });
            b.createEl('div', { cls: 'q-val', text: val, attr: { style: `color:${color};` } });
            b.createEl('div', { cls: 'q-lbl', text: lbl });
        };
        addStat(ctx.currentGold, "Золото", "#f1c40f");
        addStat(ctx.counters.totalTasks, "Квесты", "#2ecc71");
        addStat(ctx.zettelCount, "Знания", "#9b59b6");

        // 4. App Dock
        leftCol.createEl('div', { cls: 'panel-title', text: "Утилиты" });
        const dock = leftCol.createEl('div', { cls: 'app-dock' });
        const apps = [
            { id: "day", name: "День", icon: "⚡", bg: "linear-gradient(135deg, #2ecc71, #27ae60)", path: todayPath },
            { id: "prof", name: "Кабинет", icon: "👤", bg: "linear-gradient(135deg, #3498db, #2980b9)", path: "01_Dashboard/00_Profile.md" },
            { id: "shop", name: "Лавка", icon: "🛒", bg: "linear-gradient(135deg, #f1c40f, #f39c12)", path: "01_Dashboard/02_Shop.md" },
            { id: "bag", name: "Рюкзак", icon: "🎒", bg: "linear-gradient(135deg, #9b59b6, #8e44ad)", path: "01_Dashboard/03_Backpack.md" },
            { id: "hof", name: "Трофеи", icon: "🏆", bg: "linear-gradient(135deg, #e74c3c, #c0392b)", path: "01_Dashboard/01_Hall_of_Fame.md" },
            { id: "set", name: "Опции", icon: "⚙️", bg: "linear-gradient(135deg, #95a5a6, #7f8c8d)", path: "01_Dashboard/04_Settings.md" }
        ];

        apps.forEach(appDef => {
            const item = dock.createEl('div', { cls: 'app-icon' });
            const sq = item.createEl('div', { cls: 'app-squircle', text: appDef.icon });
            sq.style.background = appDef.bg;
            item.createEl('div', { cls: 'app-label', text: appDef.name });
            setupLinkClick(item, appDef.path, appDef.id === 'day');
        });

        // 5. Ритуалы
        leftCol.createEl('div', { cls: 'panel-title', text: "Ритуалы" });
        const rGrid = leftCol.createEl('div', { cls: 'rituals-grid' });
        const habits = engine.CONFIG?.custom_habits || [];
        const completedHabits = todayLog?.habits_completed ? (Array.isArray(todayLog.habits_completed) ? todayLog.habits_completed : [todayLog.habits_completed]) : [];

        if (habits.length === 0) {
            rGrid.createEl('div', { text: "Ритуалы не настроены.", attr: { style: "font-size: 0.8em; color: var(--text-muted); font-style: italic; text-align: center;" }});
        } else {
            habits.forEach(habit => {
                if (!habit.active) return;
                const isDone = completedHabits.includes(habit.id);
                const currentStreak = ctx.habitStreaks?.[habit.id] || 0;
                
                const btn = rGrid.createEl('div', { cls: `ritual-btn ${isDone ? 'done' : ''}` });
                
                let titleHtml = `<span>${habit.icon} ${habit.name}</span>`;
                if (currentStreak > 0) {
                    titleHtml = `<span>${habit.icon} ${habit.name} <span style="color:#e67e22; font-size:0.9em; margin-left: 6px;">🔥 ${currentStreak}</span></span>`;
                }
                
                let activeStreak = isDone ? currentStreak : (currentStreak + 1);
                let mult = activeStreak >= 7 ? 1.5 : (activeStreak >= 3 ? 1.2 : 1.0);
                let displayXp = Math.floor(habit.xp * mult);
                
                btn.innerHTML = `${titleHtml} <span style="${mult > 1.0 && !isDone ? 'color:#f1c40f;' : ''}">+${displayXp} XP</span>`;
                
                btn.addEventListener('click', async () => {
                    if (!todayFile) { new Notice("❌ Сначала создайте дневник на сегодня!"); return; }
                    if (window.isRPGTransactionActive) return;
                    window.isRPGTransactionActive = true; 
                    btn.style.opacity = '0.5';
                    
                    try {
                        let baseGp = habit.gp !== undefined ? habit.gp : habit.xp;
                        let finalXp = Math.floor(habit.xp * mult);
                        let finalGp = Math.floor(baseGp * mult);

                        await app.fileManager.processFrontMatter(todayFile, (f) => {
                            if (!Array.isArray(f.habits_completed)) f.habits_completed = [];
                            let curXp = parseInt(f.daily_xp) || 0; 
                            let curGold = parseInt(f.daily_gold) || 0;
                            
                            if (f.habits_completed.includes(habit.id)) {
                                f.habits_completed = f.habits_completed.filter(x => x !== habit.id);
                                f.daily_xp = Math.max(0, curXp - finalXp); 
                                f.daily_gold = Math.max(0, curGold - finalGp);
                            } else {
                                f.habits_completed.push(habit.id);
                                f.daily_xp = curXp + finalXp; 
                                f.daily_gold = curGold + finalGp;
                            }
                        });
                        
                        if (!isDone) {
                            if (mult > 1.0) new Notice(`🔥 Стрик ${activeStreak}! Награда умножена (x${mult}): +${finalXp} XP / +${finalGp} GP`);
                            else new Notice(`✅ Ритуал выполнен: +${finalXp} XP / +${finalGp} GP`);
                        } else {
                            new Notice(`↩️ Отмена ритуала: -${finalXp} XP / -${finalGp} GP`);
                        }
                        
                        engine.invalidateCache(); 
                        setTimeout(() => app.commands.executeCommandById("dataview:dataview-refresh-views"), 200);
                    } catch (err) { new Notice("❌ Ошибка записи: " + err.message); } 
                    finally { window.isRPGTransactionActive = false; }
                });
            });
        }

        // 6. Сводка дня 
        leftCol.createEl('div', { cls: 'panel-title', text: "Сводка Сегодня" });
        const sumBox = leftCol.createEl('div', { cls: 'summary-box' });
        
        const formatMins = (m) => m >= 60 ? `${Math.floor(m/60)}ч ${m%60}м` : `${m}м`;
        let tFocus = 0, tWaste = 0;
        if (todayLog) {
            tFocus = parseInt(todayLog.focus_mins) || 0;
            tWaste = parseInt(todayLog.waste_mins) || 0;
        }

        const sr1 = sumBox.createEl('div', { cls: 'sum-row' });
        sr1.createEl('span', { text: "🔴 Фокус:" }); sr1.createEl('span', { text: formatMins(tFocus) });
        const sr2 = sumBox.createEl('div', { cls: 'sum-row' });
        sr2.createEl('span', { text: "⚠️ Слив:" }); sr2.createEl('span', { text: formatMins(tWaste) });

        // =========================================================
        // ПРАВАЯ КОЛОНКА
        // =========================================================
        const rightCol = root.createEl('div');
        rightCol.style.cssText = "display: flex; flex-direction: column; gap: 20px; box-shadow: none !important;";

        if (!todayFile) {
            const createBanner = rightCol.createEl('div', { cls: 'start-day-banner' });
            createBanner.createEl('h3', { text: "⚡ Начать новый день", attr: { style: "margin:0; color: #2ecc71;" } });
            createBanner.createEl('p', { text: `Журнал за ${displayDateStr} еще не создан. Кликни, чтобы запустить трекинг.`, attr: { style: "margin: 5px 0 0 0; color: var(--text-muted); font-size: 0.9em;" } });
            createBanner.addEventListener('click', () => { app.workspace.openLinkText(todayPath, todayPath, false); });
        }

        // --- ИИ-СОВЕТНИК ---
        const aiFeed = rightCol.createEl('div', { cls: 'ai-advisor-feed' });
        let alertsCollected = [];
        
        let criticalProj = activeProjectsData.find(p => p.daysLeft !== null && p.daysLeft < 0 && (p.rank === 'S' || p.rank === 'A'));
        let warningProj = activeProjectsData.find(p => p.daysLeft !== null && p.daysLeft >= 0 && p.daysLeft <= 3 && ['S','A','B'].includes(p.rank));

        if (criticalProj) alertsCollected.push({ icon: "🚨", class: "alert-crit", text: `КРИТИЧЕСКИЙ СБОЙ: Эпический квест «${criticalProj.name}» просрочен! Марш за работу!` });
        if (warningProj) alertsCollected.push({ icon: "⚠️", class: "alert-high", text: `ВНИМАНИЕ: Проект «${warningProj.name}» сгорит через ${warningProj.daysLeft} дн. Скоро пойдет урон по HP!` });

        const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
        let mentorStateAlert = null;
        let maxStreak = 0;
        if (ctx.habitStreaks) {
            for (let key in ctx.habitStreaks) { if (ctx.habitStreaks[key] > maxStreak) maxStreak = ctx.habitStreaks[key]; }
        }

        if (hp <= 0) {
            mentorStateAlert = { icon: "💔", class: "alert-crit", text: pickRandom([
                "Персонаж в состоянии глубокой травмы. Заработок снижен на 50%. Срочно восстанови здоровье фокусом или зельями!",
                "Жизненные показатели на нулю. Мы работаем в минус. Срочно принимай меры по спасению персонажа!"
            ])};
        } else if (hp < 30) {
            mentorStateAlert = { icon: "🩸", class: "alert-crit", text: pickRandom([
                "Критический уровень энергии! Срочно нужен отдых или зелье. Проекты могут подождать.",
                "Красная зона HP! Система рекомендует снизить нагрузку и позаботиться о себе."
            ])};
        } else if (tWaste > 60) {
            mentorStateAlert = { icon: "🗑️", class: "alert-high", text: pickRandom([
                "Слив времени превысил час. Сконцентрируйся, золото само себя не заработает.",
                "Прокрастинация ворует твои уровни. Пора взять себя в руки и активировать режим фокуса."
            ])};
        } else if (tFocus > 180) {
            let focusHrs = Math.floor(tFocus / 60);
            mentorStateAlert = { icon: "🔥", class: "alert-safe", text: pickRandom([
                "Абсолютная концентрация! Ты идешь на рекорд. Твоя продуктивность сегодня пробивает потолок.",
                `Машина продуктивности! Уже ${focusHrs} ч. чистого фокуса — система в восторге от твоей отдачи.`,
                "Режим потока активирован. Золото и опыт льются рекой. Главное — не забудь сделать перерыв.",
                "Феноменальный результат! Твой мозг сегодня работает на 200%. Продолжай в том же духе!"
            ])};
        } else if (maxStreak > 5) {
            mentorStateAlert = { icon: "📈", class: "alert-warn", text: pickRandom([
                "Цепочка ритуалов выглядит отлично. Множитель опыта работает на тебя.",
                "Идеальная дисциплина. Стрики привычек разогреты до максимума, ты получаешь повышенные награды!"
            ])};
        } else {
            mentorStateAlert = { icon: "✨", class: "alert-safe", text: pickRandom([
                "Системы в норме. Выбирай контракт из списка ниже или запускай таймер фокуса.",
                "Все показатели в зеленой зоне. Отличный день для того, чтобы взять сложный эпический квест."
            ])};
        }

        if (mentorStateAlert) alertsCollected.push(mentorStateAlert);

        if (ctx.currentGold < 0) {
            alertsCollected.push({ icon: "💸", class: "alert-crit", text: `БАНКРОТСТВО: Твой долг составляет ${ctx.currentGold} GP. Система кредитов перегружена, срочно сдавай квесты!` });
        } else if (ctx.currentGold > 2000) {
            alertsCollected.push({ icon: "💰", class: "alert-safe", text: `КАПИТАЛ: Накоплено ${ctx.currentGold} GP. Зайди в Лавку и побалуй себя наградой!` });
        }

        alertsCollected.forEach(al => {
            const bx = aiFeed.createEl('div', { cls: `ai-alert ${al.class}` });
            const bxIcon = bx.createEl('div', { cls: 'ai-icon', text: al.icon });
            bx.createEl('div', { text: al.text });
        });

        // РАДАР ПРОЕКТОВ
        const pPanel = rightCol.createEl('div', { cls: 'db-panel' });
        pPanel.createEl('div', { cls: 'panel-title', text: "📡 Радар Активных Проектов" });
        const pGrid = pPanel.createEl('div', { cls: 'proj-grid' });
        
        if (activeProjectsData.length === 0) {
            pGrid.createEl('div', { text: "Нет открытых проектов. Возьми контракт в гильдии.", attr: { style: "grid-column: 1/-1; text-align: center; color: var(--text-muted); font-style: italic; padding: 20px;" }});
        } else {
            activeProjectsData.forEach(p => {
                const pCard = pGrid.createEl('div', { cls: 'proj-card' });
                let dBadge = p.daysLeft !== null ? (p.daysLeft < 0 ? 'ПРОСРОЧЕНО' : `${p.daysLeft} дн.`) : 'БЕЗ ДАТЫ';
                
                const hdr = pCard.createEl('div', { cls: 'proj-header' });
                hdr.createEl('span', { cls: 'p-badge b-rank', text: `Ранг ${p.rank}` });
                
                const dlSpan = hdr.createEl('span', { cls: `p-badge ${p.daysLeft !== null && p.daysLeft <= 3 ? 'b-dead' : 'b-rank'}`, text: dBadge });
                if (p.daysLeft !== null && p.daysLeft > 3) dlSpan.style.cssText = 'background: rgba(255,255,255,0.1); color: var(--text-muted); border: 1px solid rgba(255,255,255,0.12);';

                pCard.createEl('h4', { cls: 'proj-title', text: p.name });

                const bWrap = pCard.createEl('div', { cls: 'p-bar-wrapper' });
                const bInfo = bWrap.createEl('div', { cls: 'p-bar-info' });
                bInfo.createEl('span', { text: "Прогресс" });
                bInfo.createEl('span', { text: `${p.done}/${p.total} (${p.pct}%)` });
                
                const pBar = bWrap.createEl('div', { cls: 'p-bar-bg' });
                pBar.createEl('div', { cls: 'p-bar-fg', attr: { style: `width: ${p.pct}%;` } });
                
                setupLinkClick(pCard, p.path, false);
            });
        }

        // ЛЕТОПИСЬ ФОКУСА
        const mPanel = rightCol.createEl('div', { cls: 'db-panel' });
        mPanel.createEl('div', { cls: 'panel-title', text: "🔥 Летопись Фокуса" });

        const fMap = {};
        if (ctx.logsArray) { for (let p of ctx.logsArray) fMap[p.file.name] = parseInt(p.focus_mins) || 0; }

        const getLvlClass = (mins, isFuture) => {
            if (isFuture) return 'hm-future'; if (mins === 0) return 'hm-lvl-0';
            if (mins <= 120) return 'hm-lvl-1'; if (mins <= 240) return 'hm-lvl-2';  
            if (mins <= 420) return 'hm-lvl-3'; return 'hm-lvl-4';                    
        };

        const todayObj = window.moment(todayStr, "YYYY-MM-DD");
        const startOfYear = window.moment(todayObj).startOf('year');
        const endOfYear = window.moment(todayObj).endOf('year');
        const totalDaysYear = endOfYear.diff(startOfYear, 'days') + 1;
        const yearStartWeekday = startOfYear.isoWeekday();

        const scrollBox = mPanel.createEl('div', { cls: 'hm-scroll-box' });
        const monthsRow = scrollBox.createEl('div', { cls: 'hm-months-row' });
        let currentMonth = -1;
        
        let curLabelDay = window.moment(startOfYear);
        for (let i = 0; i < totalDaysYear; i++) {
            if (curLabelDay.month() !== currentMonth) {
                currentMonth = curLabelDay.month();
                const colIndex = Math.floor((i + yearStartWeekday - 1) / 7);
                monthsRow.createEl('span', { cls: 'hm-month-label', text: curLabelDay.format("MMM"), attr: { style: `left: ${colIndex * 17}px;` } });
            }
            curLabelDay.add(1, 'days');
        }

        const gridContainer = scrollBox.createEl('div', { cls: 'hm-grid-container' });
        const daysCol = gridContainer.createEl('div', { cls: 'hm-days-column', attr: { style: `grid-template-rows: repeat(7, 13px);` } });
        ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].forEach(d => daysCol.createEl('div', { cls: 'hm-day-label', text: d, attr: { style: `height: 13px;` } }));

        const yGrid = gridContainer.createEl('div', { cls: 'hm-cells-grid', attr: { style: `grid-template-rows: repeat(7, 13px);` } });
        
        const fragment = document.createDocumentFragment();
        
        for (let i = 1; i < yearStartWeekday; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'hm-cell mc-empty';
            fragment.appendChild(emptyCell);
        }

        let todayIndex = -1; let curYearDay = window.moment(startOfYear);
        for (let i = 0; i < totalDaysYear; i++) {
            let dateStr = curYearDay.format("YYYY-MM-DD");
            let mins = fMap[dateStr] || 0;
            let isFuture = curYearDay.isAfter(todayObj, 'day');
            if (curYearDay.isSame(todayObj, 'day')) todayIndex = i;

            let lvlClass = getLvlClass(mins, isFuture);
            let extraClass = curYearDay.isSame(todayObj, 'day') ? ' hm-today' : '';
            
            const cell = document.createElement('div');
            cell.className = `hm-cell ${lvlClass}${extraClass}`;
            
            if (!isFuture) {
                let hrs = Math.floor(mins / 60); let m = mins % 60;
                cell.title = `${curYearDay.format("DD.MM.YYYY")} | ${hrs > 0 ? (m > 0 ? hrs+'ч '+m+'м' : hrs+'ч') : (mins > 0 ? m+' мин' : 'Нет фокуса')}`;
                setupLinkClick(cell, `${cleanJournalFolder}/${dateStr}.md`, false);
            }
            fragment.appendChild(cell);
            curYearDay.add(1, 'days');
        }
        
        yGrid.appendChild(fragment);

        setTimeout(() => {
            if (todayIndex !== -1) {
                const colIndex = Math.floor((todayIndex + yearStartWeekday - 1) / 7);
                scrollBox.scrollLeft = Math.max(0, (colIndex * 17) - 200);
            }
        }, 100);

    } catch (e) {
        container.createEl('div', { text: "⚠️ Критическая ошибка хаба: " + e.message, attr: { style: "color: #e74c3c; font-weight: bold; background: rgba(231,76,60,0.1); padding: 15px; border-radius: 8px;" } });
    }
})();
```
