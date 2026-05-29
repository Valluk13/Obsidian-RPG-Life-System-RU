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
        const dailyLogs = dv.pages(this.CONFIG.journalPath);
        const zettelConcepts = dv.pages(this.CONFIG.zettelPath).where(p => p.file.size > 50 && p.file.folder.includes('02_Concepts'));
        
        let globalStats = { focus: 0, routine: 0, rest: 0, waste: 0, questXp: 0, questGold: 0, hpDamage: 0, tasksCompleted: 0 };
        let todayStats = { focus: 0, routine: 0, rest: 0, procrastinate: 0 };
        let focusMap = {};
        let monthTagMap = {};
        let globalTagMap = {};

        // Карта фокуса за 35 дней
        for (let i = 34; i >= 0; i--) { focusMap[window.moment().subtract(i, 'days').format("YYYY-MM-DD")] = 0; }

        for (let page of dailyLogs) {
            let fm = page.file.frontmatter || {};
            let isToday = (page.file.name === todayStr);
            let dFocus = parseInt(fm.focus_mins) || 0;
            let hasFailedToday = false;
            
            // 1. Сбор времени из YAML
            globalStats.focus += dFocus;
            globalStats.routine += parseInt(fm.routine_mins) || 0;
            globalStats.rest += parseInt(fm.rest_mins) || 0;
            globalStats.waste += parseInt(fm.waste_mins) || 0;
            
            let dailyTimeXp = parseInt(fm.daily_xp) || 0;
            let dailyTimeGold = parseInt(fm.daily_gold) || 0;

            // 2. Сбор тегов из YAML
            if (fm.tags_stat) {
                for (let [tag, mins] of Object.entries(fm.tags_stat)) {
                    globalTagMap[tag] = (globalTagMap[tag] || 0) + mins;
                    monthTagMap[tag] = (monthTagMap[tag] || 0) + mins;
                }
            }

            // 3. Парсинг Квестов (чекбоксов) через кэш Dataview
            let dailyQuestXp = 0, dailyQuestGold = 0;
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
                    if (bonus.isMain) globalStats.hpDamage += bonus.dmg;
                    continue; 
                }

                let multiplier = isPartial ? 0.5 : 1;

                if (isCompleted || isPartial) {
                    globalStats.tasksCompleted += 1;
                    if (bonus.isMain) {
                        dailyQuestXp += Math.floor(bonus.xp * multiplier);
                        dailyQuestGold += Math.floor(bonus.gp * multiplier);
                    } else {
                        dailyQuestXp += Math.floor(5 * multiplier);
                        dailyQuestGold += Math.floor(5 * multiplier);
                    }
                }
            }

            globalStats.questXp += (dailyTimeXp + dailyQuestXp);
            globalStats.questGold += (dailyTimeGold + dailyQuestGold);

            globalStats.hpDamage += parseInt(fm.hp_lost) || 0;
            if (!isToday && dFocus === 0) globalStats.hpDamage += 10; // Штраф за пропуск дня
            if (dFocus >= 60 && !hasFailedToday) globalStats.hpDamage -= 10; // Хилл за фокус

            if (focusMap[page.file.name] !== undefined) focusMap[page.file.name] = dFocus;

            if (isToday) {
                todayStats.focus = dFocus;
                todayStats.routine = parseInt(fm.routine_mins) || 0;
                todayStats.rest = parseInt(fm.rest_mins) || 0;
                todayStats.procrastinate = parseInt(fm.waste_mins) || 0;
            }
        }

        // --- РАСЧЕТ ИТОГОВ (HP, ЗОЛОТО, ОПЫТ) ---
        let profileSpent = parseInt(profileFm.gold_spent) || 0;
        
        // Подсчет выпитых зелий из профиля
        let totalPotions = parseInt(profileFm.total_potions_consumed) || 0;
        let potionsHistory = profileFm.potions_history || {};
        for (let d in potionsHistory) { totalPotions += (parseInt(potionsHistory[d]) || 0); }
        
        let currentHp = this.CONFIG.maxHp + (totalPotions * this.CONFIG.potionHeal) - globalStats.hpDamage;
        currentHp = Math.max(0, Math.min(this.CONFIG.maxHp, currentHp));

        if (currentHp <= 0) globalStats.questGold = Math.floor(globalStats.questGold * 0.5);

        let zettelXp = zettelConcepts.length * 10;
        let totalXpEarned = globalStats.questXp + zettelXp + (parseInt(profileFm.bonus_xp) || 0) + (parseInt(profileFm.archive_xp) || 0);
        let currentGold = globalStats.questGold + (parseInt(profileFm.bonus_gold) || 0) + (parseInt(profileFm.archive_gold) || 0) - profileSpent - globalStats.waste;
        
        let currentLevel = Math.floor(totalXpEarned / this.CONFIG.xpPerLevel) + 1;
        let xpInCurrentLevel = totalXpEarned % this.CONFIG.xpPerLevel;
        let progressPercent = Math.floor((xpInCurrentLevel / this.CONFIG.xpPerLevel) * 100);
        
        let title = "🔮 Адепт-Новичок";
        if (currentLevel >= 10) title = "📜 Искатель Знаний";
        if (currentLevel >= 25) title = "📐 Магистр Уравнений";
        if (currentLevel >= 50) title = "💻 Разрушитель Кода";
        if (currentLevel >= 100) title = "🌌 Верховный Мудрец БД";

        const builtData = {
            currentGold, currentHp, totalXpEarned, currentLevel, xpInCurrentLevel, progressPercent,
            title, focusMap, zettelCount: zettelConcepts.length, 
            todayStats, monthTagMap, globalTagMap, 
            
            // ВАЖНО: Восстановлено для работы "Доски Долгов"
            logsArray: dailyLogs.values || Array.from(dailyLogs),
            archiveCutoff: profileFm.archive_cutoff || "2000-01-01",

            timeStats: { 
                totalMinutes: globalStats.focus, totalRoutineMinutes: globalStats.routine, 
                totalRestMinutes: globalStats.rest, totalProcrastinateMinutes: globalStats.waste 
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