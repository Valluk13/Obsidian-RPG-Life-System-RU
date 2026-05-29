class RPG_Engine {
    constructor() {
        this.CONFIG = {
            journalPath: '"05_Journal"',
            zettelPath: '"04_Zettelkasten"',
            maxHp: 100,
            potionHeal: 25,
            xpPerLevel: 1000,
            itemDb: {
                'potion': { name: 'Healing Potion (+25 HP)', cost: 150 },
                'walk': { name: 'Long Walk Outside', cost: 60 },
                'tea': { name: 'Tea Ceremony (Relax)', cost: 120 },
                'youtube': { name: '1 Hour of YouTube / Streams', cost: 180 },
                'games': { name: '1 Hour of Gaming / PC', cost: 220 },
                'social': { name: '1 Hour of Social Media / Reels', cost: 250 },
                'dayoff': { name: 'Full Day Off', cost: 1200 }
            }
        };
        this._contextPromise = null;
        this._lastCacheTime = 0;
    }

    calculateQuestBonus(diffStr) {
        let d = String(diffStr || "").toLowerCase();
        if (d.includes("easy")) return { xp: 20, gp: 25, isMain: true, dmg: 5 };
        if (d.includes("medium")) return { xp: 50, gp: 50, isMain: true, dmg: 15 };
        if (d.includes("hard")) return { xp: 100, gp: 100, isMain: true, dmg: 30 };
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

        for (let i = 34; i >= 0; i--) { focusMap[window.moment().subtract(i, 'days').format("YYYY-MM-DD")] = 0; }

        for (let page of dailyLogs) {
            let fm = page.file.frontmatter || {};
            let isToday = (page.file.name === todayStr);
            let dFocus = parseInt(fm.focus_mins) || 0;
            let hasFailedToday = false;
            
            globalStats.focus += dFocus;
            globalStats.routine += parseInt(fm.routine_mins) || 0;
            globalStats.rest += parseInt(fm.rest_mins) || 0;
            globalStats.waste += parseInt(fm.waste_mins) || 0;
            
            let dailyTimeXp = parseInt(fm.daily_xp) || 0;
            let dailyTimeGold = parseInt(fm.daily_gold) || 0;

            if (fm.tags_stat) {
                for (let [tag, mins] of Object.entries(fm.tags_stat)) {
                    globalTagMap[tag] = (globalTagMap[tag] || 0) + mins;
                    monthTagMap[tag] = (monthTagMap[tag] || 0) + mins;
                }
            }

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
            if (!isToday && dFocus === 0) globalStats.hpDamage += 10; 
            if (dFocus >= 60 && !hasFailedToday) globalStats.hpDamage -= 10; 

            if (focusMap[page.file.name] !== undefined) focusMap[page.file.name] = dFocus;

            if (isToday) {
                todayStats.focus = dFocus;
                todayStats.routine = parseInt(fm.routine_mins) || 0;
                todayStats.rest = parseInt(fm.rest_mins) || 0;
                todayStats.procrastinate = parseInt(fm.waste_mins) || 0;
            }
        }

        let profileSpent = parseInt(profileFm.gold_spent) || 0;
        
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
        
        let title = "🔮 Novice Adept";
        if (currentLevel >= 10) title = "📜 Knowledge Seeker";
        if (currentLevel >= 25) title = "📐 Master of Equations";
        if (currentLevel >= 50) title = "💻 Code Breaker";
        if (currentLevel >= 100) title = "🌌 Supreme Database Sage";
        if (currentLevel >= 250) title = "👑 Architect of Reality";

        const builtData = {
            currentGold, currentHp, totalXpEarned, currentLevel, xpInCurrentLevel, progressPercent,
            title, focusMap, zettelCount: zettelConcepts.length, 
            todayStats, monthTagMap, globalTagMap, 
            
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