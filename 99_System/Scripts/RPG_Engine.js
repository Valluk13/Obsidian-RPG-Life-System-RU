class RPG_Engine {
    constructor() {
        this.CONFIG = {
            journalPath: '"05_Journal"',
            zettelPath: '"04_Zettelkasten"',
            maxHp: 100,
            potionHeal: 25,
            xpPerLevel: 1000,
            itemDb: {
                'potion': { name: 'Зелье Лечения (+25 HP)', cost: 150 },
                'walk': { name: 'Длинная прогулка на улице', cost: 60 },
                'tea': { name: 'Чайная церемония (Релакс)', cost: 120 },
                'youtube': { name: '1 Час YouTube / Стримов', cost: 180 },
                'games': { name: '1 Час video-games / ПК', cost: 220 },
                'social': { name: '1 Час соцсетей / Reels', cost: 250 },
                'dayoff': { name: 'Полный день отдыха', cost: 1200 }
            }
        };
        this._contextPromise = null;
        this._lastCacheTime = 0;
    }

    invalidateCache() {
        this._contextPromise = null;
        this._lastCacheTime = 0;
    }

    calculateQuestBonus(diffStr) {
        let d = String(diffStr || "").toLowerCase();
        if (d.includes("легкий")) return { xp: 20, gp: 25, isMain: true, dmg: 5 };
        if (d.includes("средний")) return { xp: 50, gp: 50, isMain: true, dmg: 15 };
        if (d.includes("сложный")) return { xp: 100, gp: 100, isMain: true, dmg: 30 };
        return { xp: 0, gp: 0, isMain: false, dmg: 0 };
    }

    async getSharedContext(dv, profilePage) {
        const now = Date.now();
        const CACHE_TTL = 4000; 

        if (this._contextPromise && (now - this._lastCacheTime < CACHE_TTL)) {
            return this._contextPromise;
        }

        this._lastCacheTime = now;
        this._contextPromise = this.buildContext(dv, profilePage);
        return this._contextPromise;
    }

    async buildContext(dv, profileFm) {
        const todayStr = window.moment().format("YYYY-MM-DD");
        const currentMonthStr = window.moment().format("YYYY-MM");
        const dailyLogs = dv.pages(this.CONFIG.journalPath);
        const zettelConcepts = dv.pages(this.CONFIG.zettelPath).where(p => p.file.size > 50 && p.file.folder.includes('02_Concepts'));
        
        let globalStats = { focus: 0, routine: 0, rest: 0, waste: 0, tasksCompleted: 0 };
        let monthStats = { focus: 0, routine: 0, rest: 0, waste: 0, tasksCompleted: 0 };
        let todayStats = { focus: 0, routine: 0, rest: 0, procrastinate: 0 };
        
        let focusMap = {};
        let monthTagMap = {};
        let globalTagMap = {};

        for (let i = 34; i >= 0; i--) { focusMap[window.moment().subtract(i, 'days').format("YYYY-MM-DD")] = 0; }

        let sortedLogs = [...dailyLogs].sort((a, b) => a.file.name.localeCompare(b.file.name));

        let runningHp = this.CONFIG.maxHp;
        let accumulatedQuestXp = 0;
        let accumulatedQuestGold = 0;
        let lifetimeGold = 0;

        let potionsHistory = profileFm.potions_history || {};

        for (let page of sortedLogs) {
            let fm = page; 
            let isToday = (page.file.name === todayStr);
            let isCurrentMonth = page.file.name.startsWith(currentMonthStr);
            
            let dFocus = parseInt(fm.focus_mins) || 0;
            let dRoutine = parseInt(fm.routine_mins) || 0;
            let dRest = parseInt(fm.rest_mins) || 0;
            let dWaste = parseInt(fm.waste_mins) || 0;
            let hasFailedToday = false;
            
            globalStats.focus += dFocus;
            globalStats.routine += dRoutine;
            globalStats.rest += dRest;
            globalStats.waste += dWaste;
            
            if (isCurrentMonth) {
                monthStats.focus += dFocus;
                monthStats.routine += dRoutine;
                monthStats.rest += dRest;
                monthStats.waste += dWaste;
            }
            
            let dailyTimeXp = parseInt(fm.daily_xp) || 0;
            let dailyTimeGold = parseInt(fm.daily_gold) || 0;

            if (fm.tags_stat) {
                let tagsObj = Object.assign({}, fm.tags_stat);
                for (let [tag, mins] of Object.entries(tagsObj)) {
                    globalTagMap[tag] = (globalTagMap[tag] || 0) + mins;
                    if (isCurrentMonth) {
                        monthTagMap[tag] = (monthTagMap[tag] || 0) + mins;
                    }
                }
            }

            let dailyQuestXp = 0;
            let dailyQuestGold = 0;
            let tasks = page.file.tasks ? (page.file.tasks.values || Array.from(page.file.tasks)) : [];
            
            for (let t of tasks) {
                const isCompleted = t.status === 'x' || t.status === 'X';
                const isPartial = t.status === '/'; 
                const isFailed = t.status === '-';

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
                    
                    if (bonus.isMain) {
                        dailyQuestXp += Math.floor(bonus.xp * multiplier);
                        dailyQuestGold += Math.floor(bonus.gp * multiplier);
                    } else {
                        dailyQuestXp += Math.floor(5 * multiplier);
                        dailyQuestGold += Math.floor(5 * multiplier);
                    }
                }
            }

            runningHp -= (parseInt(fm.hp_lost) || 0);
            let potionsToday = parseInt(potionsHistory[page.file.name]) || 0;
            runningHp += (potionsToday * this.CONFIG.potionHeal);

            let pageDate = window.moment(page.file.name, "YYYY-MM-DD");
            let isRecent = pageDate.isValid() && window.moment().diff(pageDate, 'days') <= 14;
            
            if (isRecent && fm.day_off !== true) {
                if (!isToday && dFocus === 0) runningHp -= 10;
                if (dFocus >= 60 && !hasFailedToday) runningHp += 10;
            }

            runningHp = Math.max(0, Math.min(this.CONFIG.maxHp, runningHp));

            let dayXpSum = dailyTimeXp + dailyQuestXp;
            let dayGoldSum = dailyTimeGold + dailyQuestGold;

            if (isToday && runningHp <= 0) {
                dayGoldSum = Math.floor(dayGoldSum * 0.5);
            }

            accumulatedQuestXp += dayXpSum;
            accumulatedQuestGold += dayGoldSum;
            lifetimeGold += dayGoldSum;

            if (focusMap[page.file.name] !== undefined) focusMap[page.file.name] = dFocus;

            if (isToday) {
                todayStats.focus = dFocus;
                todayStats.routine = dRoutine;
                todayStats.rest = dRest;
                todayStats.procrastinate = dWaste;
            }
        }

        let profileSpent = parseInt(profileFm.gold_spent) || 0;
        let zettelXp = zettelConcepts.length * 10;
        let totalXpEarned = accumulatedQuestXp + zettelXp + (parseInt(profileFm.bonus_xp) || 0) + (parseInt(profileFm.archive_xp) || 0);
        let currentGold = accumulatedQuestGold + (parseInt(profileFm.bonus_gold) || 0) + (parseInt(profileFm.archive_gold) || 0) - profileSpent - globalStats.waste;
        
        let currentLevel = Math.floor(totalXpEarned / this.CONFIG.xpPerLevel) + 1;
        let xpInCurrentLevel = totalXpEarned % this.CONFIG.xpPerLevel;
        let progressPercent = Math.floor((xpInCurrentLevel / this.CONFIG.xpPerLevel) * 100);
        
        let title = "🔮 Адепт-Новичок";
        if (currentLevel >= 10) title = "📚 Искатель Знаний";
        if (currentLevel >= 25) title = "📐 Магистр Уравнений";
        if (currentLevel >= 50) title = "💻 Разрушитель Кода";
        if (currentLevel >= 100) title = "🌌 Верховный Мудрец БД";

        const builtData = {
            currentGold, currentHp: runningHp, totalXpEarned, currentLevel, xpInCurrentLevel, progressPercent,
            title, focusMap, zettelCount: zettelConcepts.length, lifetimeGold,
            todayStats, monthTagMap, globalTagMap, 
            logsArray: dailyLogs.values || Array.from(dailyLogs),
            archiveCutoff: profileFm.archive_cutoff || "2000-01-01",
            timeStats: { 
                totalMinutes: monthStats.focus, 
                totalRoutineMinutes: monthStats.routine, 
                totalRestMinutes: monthStats.rest, 
                totalProcrastinateMinutes: monthStats.waste 
            },
            globalTimeStats: { 
                totalMinutes: globalStats.focus + (parseInt(profileFm.archive_focus_mins) || 0),
                totalRoutineMinutes: globalStats.routine + (parseInt(profileFm.archive_routine_mins) || 0),
                totalRestMinutes: globalStats.rest + (parseInt(profileFm.archive_rest_mins) || 0),
                totalProcrastinateMinutes: globalStats.waste + (parseInt(profileFm.archive_procrastination_spent) || 0)
            },
            counters: { totalTasks: globalStats.tasksCompleted + (parseInt(profileFm.archive_quests_count) || 0) }
        };
        
        window.ObsidianRPG_Core = builtData;
        return builtData;
    }
}