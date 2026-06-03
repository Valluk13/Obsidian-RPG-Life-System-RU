class RPG_Engine {
    constructor() {
        this.CONFIG_PATH = "99_System/rpg_config.json";
        this.CONFIG = null;
        this._initPromise = null;
        this._contextPromise = null;
        this._lastCacheTime = 0;
    }

    invalidateCache() {
        this._contextPromise = null;
        this._lastCacheTime = 0;
    }

    async loadConfig() {
        if (this.CONFIG) return this.CONFIG;
        if (this._initPromise) return this._initPromise;

        this._initPromise = (async () => {
            const adapter = app.vault.adapter;
            try {
                if (!(await adapter.exists(this.CONFIG_PATH))) {
                    const defaultConfig = {
                        game_balance: {
                            journalPath: '"05_Journal"', zettelPath: '"04_Zettelkasten"', maxHp: 100, potionHeal: 25,
                            xpPerLevel: 1000, creditLimit: -500, passiveHpLoss: 10, passiveHpGain: 10, focusThreshold: 60, decayDays: 14
                        },
                        difficulties: { "легкий": { xp: 20, gp: 25, dmg: 5 }, "средний": { xp: 50, gp: 50, dmg: 15 }, "сложный": { xp: 100, gp: 100, dmg: 30 } },
                        life_areas: { "work": { label: "💼 Работа", icon: "💼", color: "var(--text-accent)", active: true }, "health": { label: "❤️ Здоровье", icon: "❤️", color: "#e74c3c", active: true }, "mind": { label: "🧠 Разум", icon: "🧠", color: "#3498db", active: true } },
                        levels: [
                            { minLevel: 1, title: "🔮 Адепт-Новичок" }, { minLevel: 10, title: "📚 Искатель Знаний" }, { minLevel: 25, title: "📐 Магистр Уравнений" },
                            { minLevel: 50, title: "💻 Разрушитель Кода" }, { minLevel: 100, title: "🌌 Верховный Мудрец БД" }
                        ],
                        custom_habits: [], shop_items: []
                    };
                    if (!(await adapter.exists("99_System"))) await app.vault.createFolder("99_System");
                    await adapter.write(this.CONFIG_PATH, JSON.stringify(defaultConfig, null, 4));
                }

                const content = await adapter.read(this.CONFIG_PATH);
                const parsedConfig = JSON.parse(content);

                parsedConfig.itemDb = {};
                if (Array.isArray(parsedConfig.shop_items)) {
                    parsedConfig.shop_items.forEach(item => { parsedConfig.itemDb[item.id] = { name: item.name, cost: item.cost }; });
                }
                
                if (parsedConfig.game_balance) {
                    Object.keys(parsedConfig.game_balance).forEach(key => { parsedConfig[key] = parsedConfig.game_balance[key]; });
                }

                this.CONFIG = parsedConfig;
                return parsedConfig;
            } catch (e) { new Notice("❌ Ошибка загрузки конфига RPG: " + e.message); throw e; } 
            finally { this._initPromise = null; }
        })();

        return this._initPromise;
    }

    async saveConfig(newConfig) {
        try {
            const cleanConfig = JSON.parse(JSON.stringify(newConfig));
            delete cleanConfig.itemDb;
            if (cleanConfig.game_balance) Object.keys(cleanConfig.game_balance).forEach(key => { delete cleanConfig[key]; });
            await app.vault.adapter.write(this.CONFIG_PATH, JSON.stringify(cleanConfig, null, 4));
            this.CONFIG = null; this.invalidateCache(); await this.loadConfig();
        } catch (e) { new Notice("❌ Ошибка записи конфига: " + e.message); throw e; }
    }

    calculateQuestBonus(diffStr) {
        if (!this.CONFIG) return { xp: 0, gp: 0, isMain: false, dmg: 0 };
        let d = String(diffStr || "").toLowerCase();
        for (let key in this.CONFIG.difficulties) {
            if (d.includes(key)) {
                const target = this.CONFIG.difficulties[key];
                return { xp: target.xp, gp: target.gp, isMain: true, dmg: target.dmg };
            }
        }
        return { xp: 0, gp: 0, isMain: false, dmg: 0 };
    }

    async getSharedContext(dv, profilePage) {
        await this.loadConfig();
        const now = Date.now();
        const CACHE_TTL = 4000; 
        if (this._contextPromise && (now - this._lastCacheTime < CACHE_TTL)) return this._contextPromise;
        this._lastCacheTime = now;
        this._contextPromise = this.buildContext(dv, profilePage);
        return this._contextPromise;
    }

    async buildContext(dv, profilePage) {
        await this.loadConfig();
        const profileFm = profilePage;
        
        let logicalToday = window.moment();
        if (logicalToday.hour() < 4) { logicalToday.subtract(1, 'days'); }
        const todayStr = logicalToday.format("YYYY-MM-DD");
        const currentMonthStr = logicalToday.format("YYYY-MM");
        
        const dailyLogs = dv.pages(this.CONFIG.game_balance.journalPath);
        const zettelConcepts = dv.pages(this.CONFIG.game_balance.zettelPath).where(p => p.file.size > 50 && p.file.folder.includes('02_Concepts'));
        
        let globalStats = { focus: 0, routine: 0, rest: 0, waste: 0, tasksCompleted: 0 };
        let monthStats = { focus: 0, routine: 0, rest: 0, waste: 0, tasksCompleted: 0 };
        let todayStats = { focus: 0, routine: 0, rest: 0, procrastinate: 0 };
        
        let focusMap = {}; let monthTagMap = {}; let globalTagMap = {};
        for (let i = 34; i >= 0; i--) { focusMap[logicalToday.clone().subtract(i, 'days').format("YYYY-MM-DD")] = 0; }
        
        let sortedLogs = [...dailyLogs].sort((a, b) => a.file.name.localeCompare(b.file.name));

        let runningHp = this.CONFIG.game_balance.maxHp;
        let accumulatedQuestXp = 0; let accumulatedQuestGold = 0; let lifetimeGold = 0; let dailyPurchasesSpent = 0;
        let potionsHistory = profileFm.potions_history || {};

        const pLoss = this.CONFIG.game_balance.passiveHpLoss ?? 10;
        const pGain = this.CONFIG.game_balance.passiveHpGain ?? 10;
        const fThreshold = this.CONFIG.game_balance.focusThreshold ?? 60;
        const dDays = this.CONFIG.game_balance.decayDays ?? 14;

        let logsByDate = {};
        for (let log of sortedLogs) { logsByDate[log.file.name] = log; }

        let earliestDateStr = sortedLogs[0]?.file.name || todayStr;
        let curMom = window.moment(earliestDateStr, "YYYY-MM-DD");
        let todayMom = window.moment(todayStr, "YYYY-MM-DD");

        let diffDays = logicalToday.startOf('day').diff(curMom.startOf('day'), 'days');

        while (curMom.isBefore(todayMom, 'day') || curMom.isSame(todayMom, 'day')) {
            let curDateStr = curMom.format("YYYY-MM-DD");
            let page = logsByDate[curDateStr];
            let isToday = (curDateStr === todayStr);
            let isCurrentMonth = curDateStr.startsWith(currentMonthStr);
            
            let dFocus = 0, dRoutine = 0, dRest = 0, dWaste = 0;
            let hasFailedToday = false;
            let dailyTimeXp = 0, dailyTimeGold = 0;
            let dailyQuestXp = 0, dailyQuestGold = 0;
            let fm = page || {};

            if (page) {
                dFocus = parseInt(fm.focus_mins) || 0;
                dRoutine = parseInt(fm.routine_mins) || 0;
                dRest = parseInt(fm.rest_mins) || 0;
                dWaste = parseInt(fm.waste_mins) || 0;
                
                globalStats.focus += dFocus; globalStats.routine += dRoutine; globalStats.rest += dRest; globalStats.waste += dWaste;
                if (isCurrentMonth) { monthStats.focus += dFocus; monthStats.routine += dRoutine; monthStats.rest += dRest; monthStats.waste += dWaste; }
                
                dailyTimeXp = parseInt(fm.daily_xp) || 0; dailyTimeGold = parseInt(fm.daily_gold) || 0;

                if (fm.tags_stat) {
                    let tagsObj = Object.assign({}, fm.tags_stat);
                    for (let [tag, mins] of Object.entries(tagsObj)) {
                        globalTagMap[tag] = (globalTagMap[tag] || 0) + mins;
                        if (isCurrentMonth) monthTagMap[tag] = (monthTagMap[tag] || 0) + mins;
                    }
                }

                if (Array.isArray(fm.purchases)) {
                    for (let pId of fm.purchases) {
                        if (this.CONFIG.itemDb && this.CONFIG.itemDb[pId]) dailyPurchasesSpent += this.CONFIG.itemDb[pId].cost;
                    }
                }

                let tasks = page.file.tasks ? (page.file.tasks.values || Array.from(page.file.tasks)) : [];
                for (let t of tasks) {
                    const isCompleted = t.status === 'x' || t.status === 'X'; const isPartial = t.status === '/'; const isFailed = t.status === '-';
                    if (!isCompleted && !isPartial && !isFailed) continue;

                    let diffStr = t.difficulty ? (Array.isArray(t.difficulty) ? t.difficulty.join(' ') : String(t.difficulty)) : "";
                    let bonus = this.calculateQuestBonus(diffStr);

                    if (isFailed) {
                        hasFailedToday = true;
                        if (bonus.isMain) runningHp -= bonus.dmg;
                        continue; 
                    }

                    let multiplier = isPartial ? 0.5 : 1;
                    if (isCompleted || isPartial) {
                        globalStats.tasksCompleted += 1;
                        if (isCurrentMonth) monthStats.tasksCompleted += 1;
                        if (bonus.isMain) { dailyQuestXp += Math.floor(bonus.xp * multiplier); dailyQuestGold += Math.floor(bonus.gp * multiplier); } 
                        else { dailyQuestXp += Math.floor(5 * multiplier); dailyQuestGold += Math.floor(5 * multiplier); }
                    }
                }
                runningHp -= (parseInt(fm.hp_lost) || 0);
            } else {
                dFocus = 0;
            }

            let potionsToday = parseInt(potionsHistory[curDateStr]) || 0;
            runningHp += (potionsToday * this.CONFIG.game_balance.potionHeal);

            let isWithinDecayWindow = diffDays >= 0 && diffDays <= dDays;
            if (isWithinDecayWindow && fm.day_off !== true) {
                if (!isToday && dFocus === 0) runningHp -= pLoss;
                if (dFocus >= fThreshold && !hasFailedToday) runningHp += pGain;
            }

            runningHp = Math.max(0, Math.min(this.CONFIG.game_balance.maxHp, runningHp));

            let dayXpSum = dailyTimeXp + dailyQuestXp; let dayGoldSum = dailyTimeGold + dailyQuestGold;
            if (isToday && runningHp <= 0) dayGoldSum = Math.floor(dayGoldSum * 0.5);

            accumulatedQuestXp += dayXpSum; accumulatedQuestGold += dayGoldSum; lifetimeGold += dayGoldSum;
            if (focusMap[curDateStr] !== undefined) focusMap[curDateStr] = dFocus;

            if (isToday) { todayStats.focus = dFocus; todayStats.routine = dRoutine; todayStats.rest = dRest; todayStats.procrastinate = dWaste; }
            curMom.add(1, 'days');
            diffDays--;
        }

        let habitStreaks = {};
        if (this.CONFIG.custom_habits && Array.isArray(this.CONFIG.custom_habits)) {
            this.CONFIG.custom_habits.forEach(habit => {
                let streak = 0; let checkDate = logicalToday.clone().subtract(1, 'days');
                while (true) {
                    let dStr = checkDate.format("YYYY-MM-DD"); let log = logsByDate[dStr];
                    if (log && log.habits_completed) {
                        let isCompleted = Array.isArray(log.habits_completed) ? log.habits_completed.includes(habit.id) : log.habits_completed === habit.id;
                        if (isCompleted) { streak++; checkDate.subtract(1, 'days'); continue; }
                    }
                    break;
                }
                let tLog = logsByDate[todayStr];
                if (tLog && tLog.habits_completed) {
                    let isCompleted = Array.isArray(tLog.habits_completed) ? tLog.habits_completed.includes(habit.id) : tLog.habits_completed === habit.id;
                    if (isCompleted) streak++;
                }
                habitStreaks[habit.id] = streak;
            });
        }

        let profileSpent = parseInt(profilePage.gold_spent) || 0;
        let zettelXp = zettelConcepts.length * 10;
        let totalXpEarned = accumulatedQuestXp + zettelXp + (parseInt(profilePage.bonus_xp) || 0) + (parseInt(profilePage.archive_xp) || 0);
        let currentGold = accumulatedQuestGold + (parseInt(profilePage.bonus_gold) || 0) + (parseInt(profilePage.archive_gold) || 0) - profileSpent - dailyPurchasesSpent - globalStats.waste;
        
        let currentLevel = Math.floor(totalXpEarned / this.CONFIG.game_balance.xpPerLevel) + 1;
        let xpInCurrentLevel = totalXpEarned % this.CONFIG.game_balance.xpPerLevel;
        let progressPercent = Math.floor((xpInCurrentLevel / this.CONFIG.game_balance.xpPerLevel) * 100);
        
        let title = "🔮 Странник";
        if (this.CONFIG.levels && this.CONFIG.levels.length > 0) {
            const sortedLevels = [...this.CONFIG.levels].sort((a,b) => b.minLevel - a.minLevel);
            const found = sortedLevels.find(l => currentLevel >= l.minLevel);
            if (found) title = found.title;
        }

        let totalFocusAllTime = globalStats.focus + (parseInt(profilePage.archive_focus_mins) || 0);
        let totalTasksAllTime = globalStats.tasksCompleted + (parseInt(profilePage.archive_quests_count) || 0);
        let focusTokensEarned = Math.floor(totalFocusAllTime / 600); 
        let questTokensEarned = Math.floor(totalTasksAllTime / 50);  
        let zettelTokensEarned = Math.floor(zettelConcepts.length / 5);
        let tokensSpent = profilePage.tokens_spent || { focus: 0, quests: 0, zettel: 0 };

        let currentTokens = {
            focus: Math.max(0, focusTokensEarned - (parseInt(tokensSpent.focus) || 0)),
            quests: Math.max(0, questTokensEarned - (parseInt(tokensSpent.quests) || 0)),
            zettel: Math.max(0, zettelTokensEarned - (parseInt(tokensSpent.zettel) || 0))
        };

        const builtData = {
            currentGold, currentHp: runningHp, totalXpEarned, currentLevel, xpInCurrentLevel, progressPercent,
            title, focusMap, zettelCount: zettelConcepts.length, lifetimeGold,
            todayStats, monthTagMap, globalTagMap, 
            logsArray: dailyLogs.values || Array.from(dailyLogs),
            archiveCutoff: profilePage.archive_cutoff || "2000-01-01",
            timeStats: { totalMinutes: monthStats.focus, totalRoutineMinutes: monthStats.routine, totalRestMinutes: monthStats.rest, totalProcrastinateMinutes: monthStats.waste },
            globalTimeStats: { totalMinutes: totalFocusAllTime, totalRoutineMinutes: globalStats.routine + (parseInt(profilePage.archive_routine_mins) || 0), totalRestMinutes: globalStats.rest + (parseInt(profilePage.archive_rest_mins) || 0), totalProcrastinateMinutes: globalStats.waste + (parseInt(profilePage.archive_procrastination_spent) || 0) },
            counters: { totalTasks: totalTasksAllTime },
            dailyPurchasesSpent, habitStreaks, currentTokens
        };
        
        window.ObsidianRPG_Core = builtData;
        return builtData;
    }
}