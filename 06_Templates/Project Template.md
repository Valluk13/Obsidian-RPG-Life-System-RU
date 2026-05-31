---
status: active
rank: 
pool_xp: 
pool_gold: 
deadline: 
claimed_milestones: []
---
# 🚀 Эпический Квест: <% tp.file.title %>

```dataviewjs
const container = this.container;
container.empty();

const currentFile = app.vault.getAbstractFileByPath(dv.current().file.path);
const profileFile = app.vault.getAbstractFileByPath("01_Dashboard/00_Profile.md");

if (!profileFile) {
    container.createEl('div', {text: "⚠️ Критическая ошибка: Файл профиля не найден!", attr: {style: "color: var(--text-error); font-weight: bold;"}});
    return;
}

const fm = dv.current();
const status = fm.status || "active";
const claimed = Array.isArray(fm.claimed_milestones) ? fm.claimed_milestones : [];

// --- БЛОК 1: СТИЛИ (Адаптированные под нативный Obsidian) ---
const styleEl = container.createEl('style');
styleEl.innerHTML = `
    /* Стили HUD-панели */
    .proj-card { background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .proj-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 15px; flex-wrap: wrap; gap: 12px; }
    .proj-stat { font-size: 0.85em; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
    .proj-stat span { color: var(--text-normal); font-weight: 700; font-size: 1.15em; margin-left: 6px; }
    .prog-wrap { background: var(--background-modifier-darken); border-radius: 8px; height: 24px; width: 100%; border: 1px solid var(--background-modifier-border); overflow: hidden; position: relative; margin-top: 12px; }
    .prog-fill { background: linear-gradient(90deg, var(--interactive-accent), var(--interactive-accent-hover)); height: 100%; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    .prog-text { position: absolute; width: 100%; text-align: center; top: 0; left: 0; font-size: 0.85em; font-weight: 800; color: #ffffff; line-height: 24px; text-shadow: 0 1px 3px rgba(0,0,0,0.6); }
    .claim-btn { background: var(--interactive-accent); color: var(--text-on-accent); border: none; padding: 14px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; margin-top: 18px; transition: 0.2s ease; font-size: 0.95em; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    .claim-btn:hover:not(:disabled) { filter: brightness(1.15); transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0,0,0,0.2); }
    .claim-btn:disabled { opacity: 0.4; cursor: not-allowed; filter: grayscale(80%); box-shadow: none; transform: none; }
    .proj-done { background: rgba(46, 204, 113, 0.1); border: 1px solid #2ecc71; color: #2ecc71; padding: 16px; border-radius: 8px; text-align: center; font-weight: bold; margin-top: 15px; font-size: 1.1em; letter-spacing: 1px; text-transform: uppercase; }
    .overdue-text { color: var(--text-error) !important; }
    .reward-preview { font-size: 0.85em; color: var(--text-muted); margin-top: 15px; text-align: center; background: var(--background-primary-alt); padding: 10px; border-radius: 8px; border: 1px dashed var(--background-modifier-border); font-weight: 500; }
    .mode-badge { display: inline-block; background: var(--background-modifier-active-hover); border: 1px solid var(--interactive-accent); color: var(--interactive-accent); font-size: 0.75em; padding: 4px 10px; border-radius: 6px; margin-left: 10px; vertical-align: middle; font-weight: 700; }
    
    /* ИСПРАВЛЕННЫЕ Стили для формы настроек (Zero Config) */
    .setup-form { display: flex; flex-direction: column; gap: 18px; padding: 5px 0; }
    .setup-row { display: flex; flex-direction: column; gap: 8px; }
    .setup-label { font-size: 0.85em; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .setup-input { background: var(--background-modifier-form-field); border: 1px solid var(--background-modifier-border); color: var(--text-normal); padding: 8px 12px; border-radius: 6px; font-family: inherit; width: 100%; box-sizing: border-box; min-height: 42px; font-size: 1em; line-height: 1.5; outline: none; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
    .setup-input:focus { border-color: var(--interactive-accent); box-shadow: 0 0 0 2px rgba(var(--interactive-accent-rgb), 0.2); }
    .setup-save-btn { background: var(--interactive-accent); color: var(--text-on-accent); border: none; padding: 14px; border-radius: 8px; font-weight: bold; font-size: 1em; cursor: pointer; margin-top: 10px; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .setup-save-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.2); }
    .setup-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .edit-btn { background: transparent; border: 1px solid var(--background-modifier-border); color: var(--text-muted); padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold; transition: 0.2s; margin-left: 10px; }
    .edit-btn:hover { background: var(--background-modifier-hover); color: var(--text-normal); border-color: var(--text-muted); }
`;

const wrapper = container.createEl('div');

// --- БЛОК 2: ИНИЦИАЛИЗАЦИЯ (ПРОВЕРКА НАСТРОЕК) ---
const isConfigured = fm.rank || fm.pool_xp;

if (!isConfigured) {
    // ==========================================
    // ИНТЕРФЕЙС НАСТРОЙКИ (ONBOARDING)
    // ==========================================
    const card = wrapper.createEl('div', {cls: 'proj-card'});
    card.createEl('h3', {text: '⚙️ Настройка Эпического Квеста', attr: {style: 'margin-top:0; margin-bottom: 20px; color: var(--text-title); font-weight: 800;'}});
    
    const form = card.createEl('div', {cls: 'setup-form'});
    
    // Выбор режима/ранга
    const rowRank = form.createEl('div', {cls: 'setup-row'});
    rowRank.createEl('label', {cls: 'setup-label', text: 'Уровень сложности (Ранг) или Ручной режим:'});
    const selectRank = rowRank.createEl('select', {cls: 'setup-input'});
    const options = [
        {val: 'D', text: 'Ранг D (Легкий квест: Быстрый старт)'},
        {val: 'C', text: 'Ранг C (Обычный квест: Стандартный баланс)'},
        {val: 'B', text: 'Ранг B (Продвинутый: Хорошая награда)'},
        {val: 'A', text: 'Ранг A (Эпический: Мощный бонус за усердие)'},
        {val: 'S', text: 'Ранг S (Легендарный: Грандиозный финал)'},
        {val: 'CUSTOM', text: '✍️ Ручной ввод (Жестко задать пул наград)'}
    ];
    options.forEach(o => selectRank.createEl('option', {value: o.val, text: o.text}));
    if (fm.rank) selectRank.value = fm.rank;

    // Ручные инпуты для кастомного режима
    const rowCustom = form.createEl('div', {cls: 'setup-row', attr: {style: 'display: none; flex-direction: row; flex-wrap: wrap; gap: 15px;'}});
    
    const xpWrapper = rowCustom.createEl('div', {attr: {style: 'flex: 1; min-width: 150px; display: flex; flex-direction: column; gap: 8px;'}});
    xpWrapper.createEl('label', {cls: 'setup-label', text: 'Общий пул XP:'});
    const xpInput = xpWrapper.createEl('input', {type: 'number', placeholder: 'Например, 5000', cls: 'setup-input', value: fm.pool_xp || ''});
    
    const goldWrapper = rowCustom.createEl('div', {attr: {style: 'flex: 1; min-width: 150px; display: flex; flex-direction: column; gap: 8px;'}});
    goldWrapper.createEl('label', {cls: 'setup-label', text: 'Общий пул Золота:'});
    const goldInput = goldWrapper.createEl('input', {type: 'number', placeholder: 'Например, 1500', cls: 'setup-input', value: fm.pool_gold || ''});

    selectRank.addEventListener('change', () => {
        rowCustom.style.display = selectRank.value === 'CUSTOM' ? 'flex' : 'none';
    });
    if (!fm.rank && fm.pool_xp) {
        selectRank.value = 'CUSTOM';
        rowCustom.style.display = 'flex';
    }

    // Дедлайн
    const rowDate = form.createEl('div', {cls: 'setup-row'});
    rowDate.createEl('label', {cls: 'setup-label', text: 'Дедлайн (Опционально):'});
    const dateInput = rowDate.createEl('input', {type: 'date', cls: 'setup-input', value: fm.deadline || ''});

    // Кнопка сохранения
    const saveBtn = form.createEl('button', {cls: 'setup-save-btn', text: '💾 Утвердить Контракт Проекта'});
    saveBtn.addEventListener('click', async () => {
        saveBtn.disabled = true;
        saveBtn.innerText = "⏳ Запись в реестр...";
        
        await app.fileManager.processFrontMatter(currentFile, (c) => {
            if (selectRank.value === 'CUSTOM') {
                c.rank = null;
                c.pool_xp = parseInt(xpInput.value) || 0;
                c.pool_gold = parseInt(goldInput.value) || 0;
            } else {
                c.rank = selectRank.value;
                c.pool_xp = null;
                c.pool_gold = null;
            }
            c.deadline = dateInput.value || null;
        });
    });

} else {
    // ==========================================
    // ПАНЕЛЬ УПРАВЛЕНИЯ ПРОЕКТОМ (HUD)
    // ==========================================
    
    // 1. АБСТРАКТНЫЙ ПОДСЧЕТ ЗАДАЧ
    const tasks = fm.file.tasks ? (fm.file.tasks.values || Array.from(fm.file.tasks)) : [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed || t.status === 'x' || t.status === 'X').length;
    const progressPct = totalTasks > 0 ? Math.floor((completedTasks / totalTasks) * 100) : 0;

    // 2. ВЫЧИСЛЕНИЕ ПУЛА НАГРАД (Гибридный режим)
    let isFixedMode = (!isNaN(parseInt(fm.pool_xp)) && fm.pool_xp > 0);
    let totalXpPool = 0;
    let totalGoldPool = 0;
    let modeText = "";

    if (isFixedMode) {
        totalXpPool = parseInt(fm.pool_xp) || 0;
        totalGoldPool = parseInt(fm.pool_gold) || 0;
        modeText = "Ручной Контракт";
    } else {
        const rank = (fm.rank || "D").toUpperCase();
        // ВНИМАНИЕ: Балансировка наград по рангам
        const rankData = {
            'D': { xpPerTask: 5, gpPerTask: 2, xpBonus: 50, gpBonus: 20 },
            'C': { xpPerTask: 15, gpPerTask: 5, xpBonus: 200, gpBonus: 100 },
            'B': { xpPerTask: 40, gpPerTask: 15, xpBonus: 1000, gpBonus: 400 },
            'A': { xpPerTask: 100, gpPerTask: 40, xpBonus: 3000, gpBonus: 1000 },
            'S': { xpPerTask: 300, gpPerTask: 100, xpBonus: 8000, gpBonus: 3000 }
        };
        const rInfo = rankData[rank] || rankData['D'];
        totalXpPool = (totalTasks * rInfo.xpPerTask) + rInfo.xpBonus;
        totalGoldPool = (totalTasks * rInfo.gpPerTask) + rInfo.gpBonus;
        modeText = `Ранг ${rankData[rank] ? rank : 'D'} (Авто)`;
    }

    // 3. ВЫЧИСЛЕНИЕ ДЕДЛАЙНА
    let deadlineText = "Без дедлайна";
    let isOverdue = false;
    if (fm.deadline) {
        const diff = window.moment(fm.deadline).startOf('day').diff(window.moment().startOf('day'), 'days');
        deadlineText = diff >= 0 ? `Осталось дней: ${diff}` : `ПРОСРОЧЕНО НА ${Math.abs(diff)} ДН!`;
        isOverdue = diff < 0;
    }

    // 4. ОТРИСОВКА КАРТОЧКИ
    const card = wrapper.createEl('div', {cls: 'proj-card'});
    const header = card.createEl('div', {cls: 'proj-header'});

    const modeStat = header.createEl('div', {cls: 'proj-stat'});
    modeStat.createEl('span', {text: `Режим:`});
    modeStat.createEl('span', {text: modeText, cls: 'mode-badge'});
    
    const editBtn = modeStat.createEl('button', {cls: 'edit-btn', text: '⚙️'});
    editBtn.title = "Изменить конфигурацию проекта";
    editBtn.addEventListener('click', async () => {
        await app.fileManager.processFrontMatter(currentFile, (c) => {
            c.rank = null;
            c.pool_xp = null;
        });
    });

    const tasksStat = header.createEl('div', {cls: 'proj-stat'});
    tasksStat.createEl('span', {text: `Прогресс:`});
    tasksStat.createEl('span', {text: `${completedTasks} / ${totalTasks}`});

    const deadlineStat = header.createEl('div', {cls: 'proj-stat'});
    deadlineStat.createEl('span', {text: `Время:`});
    const dlSpan = deadlineStat.createEl('span', {text: deadlineText});
    if (isOverdue) dlSpan.addClass('overdue-text');

    const progWrap = card.createEl('div', {cls: 'prog-wrap'});
    progWrap.createEl('div', {cls: 'prog-fill', attr: {style: `width: ${progressPct}%;`}});
    progWrap.createEl('div', {cls: 'prog-text', text: `${progressPct}%`});

    // 5. РУБЕЖИ И ДОЛИ НАГРАД (15%, 20%, 25%, 40%)
    const milestones = [
        { pct: 25, share: 0.15, name: "I Квартиль" },
        { pct: 50, share: 0.20, name: "Экватор" },
        { pct: 75, share: 0.25, name: "III Квартиль" },
        { pct: 100, share: 0.40, name: "Триумф" }
    ];

    let availableMilestone = null;
    if (totalTasks > 0 && status !== 'completed') {
        for (let m of milestones) {
            if (progressPct >= m.pct && !claimed.includes(m.pct)) {
                availableMilestone = m;
            }
        }
    }

    // 6. ТРАНЗАКЦИЯ КЛЕЙМА ИЛИ ПРОГНОЗ
    if (availableMilestone) {
        const rewardXP = Math.floor(totalXpPool * availableMilestone.share);
        const rewardGold = Math.floor(totalGoldPool * availableMilestone.share);
        
        const btn = card.createEl('button', { 
            text: `🎁 Взять рубеж ${availableMilestone.pct}% (${availableMilestone.name}): +${rewardXP} XP, +${rewardGold} GP`, 
            cls: "claim-btn" 
        });
        
        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.innerText = "⏳ Одобрение транзакции...";
            
            try {
                await app.fileManager.processFrontMatter(profileFile, (p) => {
                    p.bonus_xp = (parseInt(p.bonus_xp) || 0) + rewardXP;
                    p.bonus_gold = (parseInt(p.bonus_gold) || 0) + rewardGold;
                });
                
                await app.fileManager.processFrontMatter(currentFile, (c) => {
                    if (!Array.isArray(c.claimed_milestones)) c.claimed_milestones = [];
                    if (!c.claimed_milestones.includes(availableMilestone.pct)) {
                        c.claimed_milestones.push(availableMilestone.pct);
                    }
                    if (availableMilestone.pct === 100) {
                        c.status = 'completed';
                    }
                });
                
                new Notice(`🎉 Рубеж в ${availableMilestone.pct}% пройден! Награды зачислены.`);
                if (window.customJS && customJS.RPG_Engine) customJS.RPG_Engine.invalidateCache();
                setTimeout(() => app.commands.executeCommandById("dataview:dataview-refresh-views"), 300);
                
            } catch (err) {
                new Notice("❌ Ошибка записи: " + err.message);
                btn.disabled = false;
            }
        });
    } else if (status === 'completed') {
        card.createEl('div', {cls: 'proj-done', text: '🏆 Этот легендарный квест полностью завершен!'});
    } else if (totalTasks === 0) {
        card.createEl('div', {text: '💡 Добавьте чекбоксы (- [ ]), чтобы запустить отслеживание проекта.', attr: {style: 'margin-top: 15px; font-size: 0.85em; color: var(--text-muted); text-align: center; font-style: italic;'}});
    } else {
        const nextMs = milestones.find(m => !claimed.includes(m.pct));
        if (nextMs) {
            const nextXp = Math.floor(totalXpPool * nextMs.share);
            const nextGold = Math.floor(totalGoldPool * nextMs.share);
            card.createEl('div', {
                cls: 'reward-preview', 
                text: `🎯 Следующая цель: ${nextMs.pct}% (${nextMs.name}). Прогноз награды: ${nextXp} XP | ${nextGold} GP`
            });
        }
    }
}
```
## 📋 Структура Квеста (Пример)

### Глава 1. Подготовка

- [ ] Шаг 1
    
- [ ] Шаг 2
