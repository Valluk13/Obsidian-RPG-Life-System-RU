# Баланс
```dataviewjs
(async () => {
    const container = this.container;
    container.empty();

    if (!window.customJS || !customJS.RPG_Engine) return;

    try {
        const engine = customJS.RPG_Engine;
        const profilePage = dv.page("01_Dashboard/00_Profile.md");
        const ctx = await engine.getSharedContext(dv, profilePage);
        let currentGold = ctx.currentGold;

        const styleEl = container.createEl('style');
        styleEl.innerHTML = `
          .shop-header { display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 15px 20px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 5px; }
          .shop-title { margin: 0; font-size: 1.4em; color: var(--text-title); }
          .shop-balance { font-size: 1.2em; font-weight: bold; padding: 5px 12px; border-radius: 6px; transition: 0.3s; }
          .balance-positive { background: rgba(46, 204, 113, 0.1); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.3); }
          .balance-negative { background: rgba(231, 76, 60, 0.1); color: #e74c3c; border: 1px solid rgba(231, 76, 60, 0.3); }
        `;

        const headerDiv = container.createEl('div', { cls: 'shop-header' });
        headerDiv.createEl('h3', { cls: 'shop-title', text: '🛒 Торговая Лавка' });
        const balanceSpan = headerDiv.createEl('div', { cls: `shop-balance ${currentGold >= 0 ? 'balance-positive' : 'balance-negative'}` });
        balanceSpan.innerText = `💰 Баланс: ${currentGold} GP`;

        const updateBalanceUI = (e) => {
            if (!balanceSpan || !document.body.contains(balanceSpan)) return;
            const newGold = e.detail.gold;
            balanceSpan.innerText = `💰 Баланс: ${newGold} GP`;
            balanceSpan.className = `shop-balance ${newGold >= 0 ? 'balance-positive' : 'balance-negative'}`;
        };

        if (window.rpgWalletListener) window.removeEventListener('rpg-balance-updated', window.rpgWalletListener);
        window.rpgWalletListener = updateBalanceUI;
        window.addEventListener('rpg-balance-updated', window.rpgWalletListener);

        this.onunload = () => { if (window.rpgWalletListener) window.removeEventListener('rpg-balance-updated', window.rpgWalletListener); };
    } catch(e) {
        container.createEl('p', {text: "Ошибка загрузки кошелька: " + e.message, attr: {style: "color:red;"}});
    }
})();
```
# Магазин 
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
        const profileFile = app.vault.getAbstractFileByPath(profilePage.file.path);
        const ctx = await engine.getSharedContext(dv, profilePage);
        
        const journalFolderRaw = engine.CONFIG.journalPath || "05_Journal";
        const cleanJournalFolder = journalFolderRaw.replace(/"/g, '');
        const dailyPages = dv.pages(journalFolderRaw);
        const itemDb = engine.CONFIG.itemDb || {};
        
        let totalPurchasesCount = 0; let totalJournalSpent = 0; const statsMap = {};
        const iconMap = { potion: "🧪", walk: "🏃‍♂️", tea: "🍵", youtube: "📺", games: "🎮", social: "📱", dayoff: "🛌" };
        
        for (let id in itemDb) { statsMap[id] = { id: id, name: itemDb[id].name, cost: itemDb[id].cost, count: 0, spent: 0 }; }

        for (let page of dailyPages) {
            if (Array.isArray(page.purchases)) {
                for (let itemId of page.purchases) {
                    const itemCost = itemDb[itemId]?.cost || 0;
                    if (itemDb[itemId]) { totalPurchasesCount++; totalJournalSpent += itemCost; }
                    if (!statsMap[itemId]) statsMap[itemId] = { id: itemId, name: `Удаленный товар`, cost: itemCost, count: 0, spent: 0 };
                    statsMap[itemId].count++; statsMap[itemId].spent += itemCost;
                }
            }
        }

        let currentGold = ctx.currentGold;
        const creditLimit = engine.CONFIG.creditLimit || -500; 

        const styleEl = container.createEl('style');
        styleEl.innerHTML = `
          .rpg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 15px; margin-top: 15px; }
          .shop-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 18px; border-radius: 10px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; }
          .shop-controls { display: flex; gap: 8px; width: 100%; align-items: stretch; margin-top: 15px; flex-wrap: wrap; }
          .qty-input { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: var(--text-normal); padding: 8px; border-radius: 6px; width: 50px; text-align: center; font-weight: bold; box-sizing: border-box; height: 36px; }
          .shop-btn { background: var(--interactive-accent); color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; flex-grow: 2; font-weight: bold; transition: 0.2s; height: 36px; font-size: 0.9em; }
          .shop-btn:disabled { opacity: 0.3; cursor: not-allowed; }
          .shop-btn-pf { background: transparent; border: 1px solid var(--interactive-accent); color: var(--text-normal); padding: 8px 10px; border-radius: 6px; cursor: pointer; flex-grow: 1; font-weight: bold; transition: 0.2s; height: 36px; font-size: 0.85em; }
          .shop-btn-pf:disabled { opacity: 0.3; cursor: not-allowed; }
          .an-wrapper { background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 12px; padding: 20px; margin-top: 35px; }
          .an-summary { display: flex; gap: 30px; background: var(--background-primary); padding: 15px 20px; border-radius: 8px; border: 1px solid var(--background-modifier-border); margin-bottom: 20px; }
          .an-table { width: 100%; border-collapse: collapse; font-size: 0.9em; }
          .an-table th { text-align: left; padding: 10px; border-bottom: 2px solid var(--background-modifier-border); color: var(--text-muted); font-size: 0.85em; text-transform: uppercase; }
          .an-table td { padding: 10px; border-bottom: 1px solid var(--background-modifier-border-alt); }
        `;

        const gridDiv = container.createEl('div', {cls: 'rpg-grid'});

        for (let id in itemDb) {
            const item = itemDb[id]; const card = gridDiv.createEl('div', {cls: 'shop-card'});
            card.createEl('div', {text: item.name, attr: {style: 'font-weight: bold; font-size: 1.05em; margin-bottom: 6px; text-align:center; color: var(--text-normal);'}});
            card.createEl('div', {text: item.cost + " GP", attr: {style: 'color: #f1c40f; font-weight: bold; margin-bottom: auto; font-size: 0.95em; text-align:center;'}});
            
            const controls = card.createEl('div', {cls: 'shop-controls'});
            const qtyInput = controls.createEl('input', {type: 'number', value: '1', min: '1', max: '99', cls: 'qty-input'});
            const buyBtn = controls.createEl('button', {text: 'Выкупить', cls: 'shop-btn'});
            const pfBtn = controls.createEl('button', {text: 'Постфактум ⚡', cls: 'shop-btn-pf'});
            
            const updateBtnState = () => {
                let qty = parseInt(qtyInput.value) || 1; if (qty < 1) { qty = 1; qtyInput.value = 1; }
                let totalCost = item.cost * qty;
                buyBtn.disabled = (currentGold - totalCost < creditLimit);
                pfBtn.disabled = (currentGold - totalCost < creditLimit);
                buyBtn.innerText = buyBtn.disabled ? 'Лимит долга' : (currentGold - totalCost < 0 ? 'В кредит' : 'Выкупить');
            };
            qtyInput.addEventListener('input', updateBtnState); updateBtnState(); 

            const getLogicalTargetDate = () => {
                let currentMoment = window.moment();
                if (currentMoment.hour() < 4) { currentMoment.subtract(1, 'days'); }
                return currentMoment.format("YYYY-MM-DD");
            };

            buyBtn.addEventListener('click', async () => {
                if (window.isRPGTransactionActive) return;
                window.isRPGTransactionActive = true;
                gridDiv.style.pointerEvents = 'none'; buyBtn.disabled = true; pfBtn.disabled = true;
                
                let qty = parseInt(qtyInput.value) || 1; let totalCost = item.cost * qty;
                const targetDayStr = getLogicalTargetDate();
                const todayFile = app.vault.getAbstractFileByPath(`${cleanJournalFolder}/${targetDayStr}.md`);
                
                if (!todayFile) {
                    new Notice(`❌ Сначала создайте Ежедневную заметку за день (${targetDayStr})!`);
                    gridDiv.style.pointerEvents = 'auto'; updateBtnState(); window.isRPGTransactionActive = false; return;
                }
                
                try {
                    await app.fileManager.processFrontMatter(todayFile, (fm) => {
                        if (!Array.isArray(fm.purchases)) fm.purchases = [];
                        for (let i = 0; i < qty; i++) fm.purchases.push(id);
                    });
                    await app.fileManager.processFrontMatter(profileFile, (p) => {
                        if (!p.inventory) p.inventory = {};
                        p.inventory[id] = (parseInt(p.inventory[id]) || 0) + qty;
                    });
                    currentGold -= totalCost;
                    window.dispatchEvent(new CustomEvent('rpg-balance-updated', { detail: { gold: currentGold } }));
                    engine.invalidateCache();
                    new Notice(`✅ Куплено: ` + item.name + ' (x' + qty + ')');
                } catch (err) { new Notice("❌ Ошибка: " + err.message); } 
                finally {
                    setTimeout(() => { app.commands.executeCommandById("dataview:dataview-refresh-views"); window.isRPGTransactionActive = false; }, 300);
                }
            });

            pfBtn.addEventListener('click', async () => {
                if (window.isRPGTransactionActive) return;
                window.isRPGTransactionActive = true;
                gridDiv.style.pointerEvents = 'none'; buyBtn.disabled = true; pfBtn.disabled = true;
                
                let qty = parseInt(qtyInput.value) || 1; let totalCost = item.cost * qty;
                
                try {
                    if (id === 'dayoff') {
                        let logicalNow = window.moment();
                        if (logicalNow.hour() < 4) logicalNow.subtract(1, 'days');
                        
                        let filesToFix = [];
                        for (let d = 1; d <= 14 && filesToFix.length < qty; d++) {
                            let checkStr = logicalNow.clone().subtract(d, 'days').format("YYYY-MM-DD");
                            let fileCardPath = `${cleanJournalFolder}/${checkStr}.md`;
                            let pFile = app.vault.getAbstractFileByPath(fileCardPath);
                            
                            let isMissed = false;
                            if (pFile) {
                                let pPage = dv.page(pFile.path);
                                if (pPage && (parseInt(pPage.focus_mins) || 0) === 0 && pPage.day_off !== true) {
                                    isMissed = true;
                                }
                            } else {
                                isMissed = true; 
                            }

                            if (isMissed) {
                                filesToFix.push({ file: pFile, path: fileCardPath, dateStr: checkStr });
                            }
                        }

                        for (let itemFix of filesToFix) {
                            if (!itemFix.file) {
                                let initialContent = `---\nday_off: true\nhp_lost: 0\ndaily_gold: 0\ndaily_xp: 0\nwaste_mins: 0\nrest_mins: 0\nroutine_mins: 0\nfocus_mins: 0\npurchases: ["${id}"]\nused_items: ["${id}"]\n---\n# Дневник: ${itemFix.dateStr}\n## ⏳ Журнал Активности\n`;
                                await app.vault.create(itemFix.path, initialContent);
                            } else {
                                await app.fileManager.processFrontMatter(itemFix.file, (fm) => {
                                    if (!Array.isArray(fm.purchases)) fm.purchases = [];
                                    if (!Array.isArray(fm.used_items)) fm.used_items = [];
                                    fm.purchases.push(id); fm.used_items.push(id);
                                    fm.day_off = true;
                                });
                            }
                        }

                        let remainder = qty - filesToFix.length;
                        if (remainder > 0) {
                            await app.fileManager.processFrontMatter(profileFile, (p) => {
                                if (!p.inventory) p.inventory = {};
                                p.inventory[id] = (parseInt(p.inventory[id]) || 0) + remainder;
                            });
                            
                            let todayStr = getLogicalTargetDate();
                            let todayFile = app.vault.getAbstractFileByPath(`${cleanJournalFolder}/${todayStr}.md`);
                            if (todayFile) {
                                await app.fileManager.processFrontMatter(todayFile, (fm) => {
                                    if (!Array.isArray(fm.purchases)) fm.purchases = [];
                                    for (let i = 0; i < remainder; i++) fm.purchases.push(id);
                                });
                            }
                            new Notice(`🛌 ${filesToFix.length} прогулов нейтрализовано. Оставшиеся выходные (${remainder} шт.) сбережены в Рюкзаке!`);
                        } else {
                            new Notice(`🛌 Успешно активировано ${filesToFix.length} ед. «Выходного дня» для нейтрализации урона.`);
                        }
                    } else {
                        const targetDayStr = getLogicalTargetDate();
                        const todayFile = app.vault.getAbstractFileByPath(`${cleanJournalFolder}/${targetDayStr}.md`);
                        if (!todayFile) throw new Error(`Создайте дневник на день ${targetDayStr}`);

                        await app.fileManager.processFrontMatter(todayFile, (fm) => {
                            if (!Array.isArray(fm.purchases)) fm.purchases = [];
                            if (!Array.isArray(fm.used_items)) fm.used_items = [];
                            for (let i = 0; i < qty; i++) { fm.purchases.push(id); fm.used_items.push(id); }
                        });

                        if (id === 'potion') {
                            await app.fileManager.processFrontMatter(profileFile, (p) => {
                                if (!p.potions_history) p.potions_history = {};
                                p.potions_history[targetDayStr] = (parseInt(p.potions_history[targetDayStr]) || 0) + qty;
                            });
                        }
                        new Notice(`⚡ Списано постфактум за день ${targetDayStr}: ${item.name} (x${qty})`);
                    }

                    currentGold -= totalCost;
                    window.dispatchEvent(new CustomEvent('rpg-balance-updated', { detail: { gold: currentGold } }));
                    engine.invalidateCache();
                } catch (err) { new Notice("❌ Ошибка: " + err.message); } 
                finally {
                    setTimeout(() => { app.commands.executeCommandById("dataview:dataview-refresh-views"); window.isRPGTransactionActive = false; }, 300);
                }
            });
        }

        const wrapper = container.createEl('div', { cls: 'an-wrapper' });
        wrapper.createEl('h3', { text: "📊 Глобальная Аналитика Покупок", attr: { style: "margin-top: 0; color: var(--text-title);" } });

        const summary = wrapper.createEl('div', { cls: 'an-summary' });
        summary.innerHTML = `<div style='display:flex; flex-direction:column;'><span style='color:var(--text-muted); font-size:0.85em; text-transform:uppercase;'>Новых покупок</span><span style='font-size:1.6em; font-weight:bold; color:var(--text-accent);'>${totalPurchasesCount} шт.</span></div><div style='display:flex; flex-direction:column; margin-left: 30px;'><span style='color:var(--text-muted); font-size:0.85em; text-transform:uppercase;'>Всего затрачено</span><span style='font-size:1.6em; font-weight:bold; color:#f1c40f;'>💰 ${totalJournalSpent} GP</span></div>`;

        const statsArray = Object.values(statsMap).filter(item => item.count > 0); statsArray.sort((a, b) => b.spent - a.spent);

        if (statsArray.length > 0) {
            const table = wrapper.createEl('table', { cls: 'an-table' }); const thead = table.createEl('tr');
            ["Иконка / ID", "Название", "Кол-во", "Доля трат"].forEach(h => thead.createEl('th', { text: h }));
            statsArray.forEach(item => {
                const icon = iconMap[item.id] || "🛒"; const sharePct = totalJournalSpent > 0 ? ((item.spent / totalJournalSpent) * 100).toFixed(1) : "0.0";
                const tr = table.createEl('tr');
                tr.createEl('td', { text: `${icon} ${item.id}`, attr: { style: "font-family: monospace; font-size: 0.9em; color: var(--text-muted);" } });
                tr.createEl('td', { text: item.name, attr: { style: "font-weight: bold;" } });
                tr.createEl('td', { text: `${item.count} шт.` });
                tr.createEl('td', { text: `${sharePct}% (${item.spent} GP)`, attr: { style: "color: #f1c40f; font-weight: bold;" } });
            });
        }
    } catch(e) { container.createEl('p', {text: "Ошибка: " + e.message, attr: {style: "color:red;"}}); }
})();
```
# Кузница Артефактов 
```dataviewjs
(async () => {
    const container = this.container; if (!window.customJS || !customJS.RPG_Engine) return;
    try {
        const engine = customJS.RPG_Engine; const profilePage = dv.page("01_Dashboard/00_Profile.md");
        const profileFile = app.vault.getAbstractFileByPath(profilePage.file.path);
        const ctx = await engine.getSharedContext(dv, profilePage); const t = ctx.currentTokens;

        const styleEl = container.createEl('style');
        styleEl.innerHTML = `.forge-panel { background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; } .tokens-hud { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; } .token-pill { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px 14px; border-radius: 8px; font-weight: bold; font-size: 0.9em; display: flex; align-items: center; gap: 8px; } .craft-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; } .craft-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 18px; display: flex; flex-direction: column; } .craft-title { font-size: 1.1em; font-weight: 800; color: var(--text-normal); margin-bottom: 6px; } .craft-desc { font-size: 0.85em; color: var(--text-muted); margin-bottom: 15px; flex-grow: 1; } .craft-cost { font-size: 0.85em; background: rgba(0,0,0,0.3); padding: 6px 10px; border-radius: 6px; margin-bottom: 15px; font-family: monospace; } .craft-btn { background: linear-gradient(135deg, #8e44ad, #9b59b6); color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 10px rgba(155, 89, 182, 0.2); } .craft-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-2px); } .craft-btn:disabled { opacity: 0.4; cursor: not-allowed; background: var(--background-modifier-border); box-shadow: none; }`;

        const panel = container.createEl('div', { cls: 'forge-panel' });
        const hud = panel.createEl('div', { cls: 'tokens-hud' });
        hud.createEl('div', { cls: 'token-pill', text: `🔷 Кристаллы: ${t.focus}` });
        hud.createEl('div', { cls: 'token-pill', text: `📜 Печати: ${t.quests}` });
        hud.createEl('div', { cls: 'token-pill', text: `💠 Эссенции: ${t.zettel}` });

        const recipes = [
            { id: 'gold_infusion', name: "Сфера Богатства", desc: "Мгновенно добавляет +1000 GP.", cost: { focus: 1, quests: 1, zettel: 0 }, costStr: "🔷 1 Кристалл + 📜 1 Печать", action: (p) => { p.bonus_gold = (parseInt(p.bonus_gold) || 0) + 1000; } },
            { id: 'xp_infusion', name: "Фиал Озарения", desc: "Моментально конвертируется в +1500 XP.", cost: { focus: 0, quests: 0, zettel: 2 }, costStr: "💠 2 Эссенции Знаний", action: (p) => { p.bonus_xp = (parseInt(p.bonus_xp) || 0) + 1500; } },
            { id: 'potion_bundle', name: "Ящик Алхимика", desc: "Добавляет сразу 5 Зелий Лечения вам в инвентарь.", cost: { focus: 1, quests: 0, zettel: 1 }, costStr: "🔷 1 Кристалл + 💠 1 Эссенция", action: (p) => { if (!p.inventory) p.inventory = {}; p.inventory['potion'] = (parseInt(p.inventory['potion']) || 0) + 5; } }
        ];

        const grid = panel.createEl('div', { cls: 'craft-grid' });
        recipes.forEach(r => {
            const card = grid.createEl('div', { cls: 'craft-card' }); card.createEl('div', { cls: 'craft-title', text: r.name }); card.createEl('div', { cls: 'craft-desc', text: r.desc }); card.createEl('div', { cls: 'craft-cost', text: `Цена: ${r.costStr}` });
            const canAfford = t.focus >= r.cost.focus && t.quests >= r.cost.quests && t.zettel >= r.cost.zettel;
            const btn = card.createEl('button', { cls: 'craft-btn', text: canAfford ? '⚒️ Скрафтить' : 'Не хватает токенов' }); btn.disabled = !canAfford;

            btn.addEventListener('click', async () => {
                if (window.isRPGTransactionActive) return; window.isRPGTransactionActive = true;
                btn.disabled = true; btn.innerText = "⏳...";
                try {
                    await app.fileManager.processFrontMatter(profileFile, (p) => {
                        if (!p.tokens_spent) p.tokens_spent = { focus: 0, quests: 0, zettel: 0 };
                        p.tokens_spent.focus += r.cost.focus; p.tokens_spent.quests += r.cost.quests; p.tokens_spent.zettel += r.cost.zettel;
                        r.action(p);
                    });
                    engine.invalidateCache(); new Notice(`✨ Вы создали: ${r.name}`);
                } catch (err) { new Notice("❌ Ошибка: " + err.message); } 
                finally { setTimeout(() => { app.commands.executeCommandById("dataview:dataview-refresh-views"); window.isRPGTransactionActive = false; }, 300); }
            });
        });
    } catch (e) { panel.createEl('div', { text: "⚠️ Ошибка: " + e.message }); }
})();
```
