# 🎒 Рюкзак Инвентаря

```dataviewjs
(async () => {
    const container = this.container;
    container.empty();

    if (!window.customJS || !customJS.RPG_Engine) {
        container.createEl('div', { text: "⚠️ Движок загружается...", attr: {style: "color: #e74c3c;"} });
        return;
    }

    try {
        const engine = customJS.RPG_Engine;
        const profilePage = dv.page("01_Dashboard/00_Profile.md");
        const tFile = app.vault.getAbstractFileByPath(profilePage.file.path);
        
        const profileCache = app.metadataCache.getFileCache(tFile);
        const inventory = profileCache?.frontmatter?.inventory || {};
        const ctx = await engine.getSharedContext(dv, profilePage);
        
        const gridDiv = container.createEl('div', {cls: 'rpg-grid'});
        
        const styleEl = container.createEl('style');
        styleEl.innerHTML = 
          ".rpg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-top: 15px; }" +
          ".inv-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 18px; border-radius: 10px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; }" +
          ".inv-controls { display: flex; gap: 10px; margin-top: 15px; }" +
          ".inv-btn { background: var(--interactive-accent); color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; flex-grow: 1; font-weight: bold; font-size: 0.85em; transition: 0.2s; height: 32px; display: inline-flex; align-items: center; justify-content: center; }" +
          ".inv-btn:disabled { opacity: 0.5; cursor: not-allowed; }" +
          ".sell-btn { background: rgba(46, 204, 113, 0.05); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.2); }";

        const itemDb = engine.CONFIG.itemDb || {};
        const iconMap = { potion: "🧪", walk: "🏃‍♂️", tea: "🍵", youtube: "📺", games: "🎮", social: "📱", dayoff: "🛌" };
        
        // СВЯЗЫВАНИЕ БАЛАНСА: Вытаскиваем цены напрямую из активного конфига лавки
        const secureBaseCosts = {};
        if (Array.isArray(engine.CONFIG.shop_items)) {
            engine.CONFIG.shop_items.forEach(item => { secureBaseCosts[item.id] = item.cost; });
        }
        const coreFallbacks = { potion: 150, walk: 60, tea: 120, youtube: 180, games: 220, social: 250, dayoff: 1200 };

        let hasItems = false;
        for (let id in inventory) {
            let qty = parseInt(inventory[id]) || 0;
            if (qty <= 0) continue;
            hasItems = true;

            const itemInfo = itemDb[id] || { name: id, cost: 0 };
            const secureSellPrice = secureBaseCosts[id] || itemInfo.cost || coreFallbacks[id] || 0; 

            const card = gridDiv.createEl('div', {cls: 'inv-card'});
            const icon = iconMap[id] || "📦";
            card.createEl('div', {text: icon + " " + itemInfo.name, attr: {style: 'font-weight: bold; margin-bottom: 5px; color: var(--text-normal);'}});
            const qtyDiv = card.createEl('div', {text: "В наличии: " + qty + " шт.", attr: {style: 'font-size: 0.85em; color: var(--text-muted); margin-bottom: 10px;'}});

            const controls = card.createEl('div', {cls: 'inv-controls'});
            
            const actionBtn = controls.createEl('button', {
                text: id === 'potion' ? 'Выпить' : 'Активировать', 
                cls: 'inv-btn'
            });

            const sellBtn = controls.createEl('button', {
                text: "Продать (+" + secureSellPrice + " GP)", 
                cls: 'inv-btn'
            });
            sellBtn.style.cssText = 'background: rgba(46, 204, 113, 0.05); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.2);';
            
            const getLogicalTargetDate = () => {
                let currentMoment = window.moment();
                if (currentMoment.hour() < 4) { currentMoment.subtract(1, 'days'); }
                return currentMoment.format("YYYY-MM-DD");
            };

            actionBtn.addEventListener('click', async () => {
                if (window.isRPGTransactionActive) return;
                window.isRPGTransactionActive = true;
                gridDiv.style.pointerEvents = 'none';
                actionBtn.disabled = true;
                
                try {
                    const targetDayStr = getLogicalTargetDate();
                    
                    if (id === 'potion') {
                        await app.fileManager.processFrontMatter(tFile, (f) => {
                            if (f.inventory) f.inventory[id] = Math.max(0, (parseInt(f.inventory[id]) || 0) - 1);
                            if (!f.potions_history) f.potions_history = {};
                            f.potions_history[targetDayStr] = (parseInt(f.potions_history[targetDayStr]) || 0) + 1;
                        });
                        engine.invalidateCache();
                        new Notice(`🧪 Применено Зелье Лечения! Игровой день: ${targetDayStr}.`);
                        
                        qty -= 1;
                        qtyDiv.innerText = "В наличии: " + qty + " шт.";
                        if (qty <= 0) {
                            actionBtn.innerText = "Истрачено"; actionBtn.disabled = true; sellBtn.disabled = true;
                        }
                        setTimeout(() => { app.commands.executeCommandById("dataview:dataview-refresh-views"); }, 200);
                        
                    } else {
                        const journalFolderRaw = engine.CONFIG.journalPath || "05_Journal";
                        const cleanJournalFolder = journalFolderRaw.replace(/"/g, '');
                        const todayPath = `${cleanJournalFolder}/${targetDayStr}.md`;
                        const todayFile = app.vault.getAbstractFileByPath(todayPath);
                        
                        if (!todayFile) {
                            new Notice(`❌ Для использования награды сначала создайте дневник на игровой день (${targetDayStr})!`);
                            actionBtn.disabled = false; gridDiv.style.pointerEvents = 'auto'; window.isRPGTransactionActive = false; return;
                        }
                        
                        await app.fileManager.processFrontMatter(tFile, (f) => {
                            if (f.inventory && f.inventory[id]) {
                                f.inventory[id] = Math.max(0, (parseInt(f.inventory[id]) || 0) - 1);
                            }
                        });
                        
                        await app.fileManager.processFrontMatter(todayFile, (fm) => {
                            if (!Array.isArray(fm.used_items)) fm.used_items = [];
                            fm.used_items.push(id);
                            if (id === 'dayoff') fm.day_off = true; 
                        });
                        
                        engine.invalidateCache();
                        new Notice(`✨ Активировано: ${itemInfo.name}. Лог записан в игровой день ${targetDayStr}.`);
                        
                        qty -= 1;
                        qtyDiv.innerText = "В наличии: " + qty + " шт.";
                        if (qty <= 0) {
                            actionBtn.innerText = "Истрачено"; actionBtn.disabled = true; sellBtn.disabled = true;
                        }
                        setTimeout(() => { app.commands.executeCommandById("dataview:dataview-refresh-views"); }, 200);
                    }
                } catch(err) {
                    new Notice("❌ Ошибка применения предмета: " + err.message);
                    if (qty > 0) actionBtn.disabled = false;
                } finally {
                    gridDiv.style.pointerEvents = 'auto'; window.isRPGTransactionActive = false;
                }
            });

            sellBtn.addEventListener('click', async () => {
                if (window.isRPGTransactionActive) return;
                window.isRPGTransactionActive = true; gridDiv.style.pointerEvents = 'none';
                sellBtn.disabled = true; sellBtn.innerText = "⏳...";

                try {
                    const journalFolderRaw = engine.CONFIG.journalPath || "05_Journal";
                    const cleanJournalFolder = journalFolderRaw.replace(/"/g, '');
                    const journalPages = dv.pages(`"${cleanJournalFolder}"`).where(p => Array.isArray(p.purchases) && p.purchases.includes(id)).sort(p => p.file.name, 'desc');
                    
                    let logRemoved = false; let targetDayStr = "крафта / запасов";

                    if (journalPages.length > 0) {
                        const fileToUpdate = app.vault.getAbstractFileByPath(journalPages[0].file.path);
                        if (fileToUpdate) {
                            await app.fileManager.processFrontMatter(fileToUpdate, (fm) => {
                                if (Array.isArray(fm.purchases)) {
                                    const idx = fm.purchases.indexOf(id);
                                    if (idx !== -1) { fm.purchases.splice(idx, 1); logRemoved = true; }
                                }
                            });
                            if (logRemoved) targetDayStr = fileToUpdate.basename;
                        }
                    }

                    await app.fileManager.processFrontMatter(tFile, (f) => {
                        if (f.inventory && f.inventory[id]) { f.inventory[id] = Math.max(0, (parseInt(f.inventory[id]) || 0) - 1); }
                        if (!logRemoved) { f.bonus_gold = (parseInt(f.bonus_gold) || 0) + secureSellPrice; }
                    });

                    engine.invalidateCache();
                    const newCtx = await engine.buildContext(dv, profilePage);
                    window.dispatchEvent(new CustomEvent('rpg-balance-updated', { detail: { gold: newCtx.currentGold } }));

                    qty -= 1; qtyDiv.innerText = "В наличии: " + qty + " шт.";
                    new Notice(`💰 Возврат успешен! Компенсация ${secureSellPrice} GP получена.`);
                } catch (err) { new Notice("❌ Ошибка продажи: " + err.message); } 
                finally {
                    setTimeout(() => { 
                        gridDiv.style.pointerEvents = 'auto';
                        if (qty > 0) {
                            if (sellBtn && document.body.contains(sellBtn)) { sellBtn.innerText = "Продать (+" + secureSellPrice + " GP)"; sellBtn.disabled = false; }
                        } else {
                            if (sellBtn && document.body.contains(sellBtn)) { sellBtn.innerText = "Продано"; sellBtn.disabled = true; }
                            if (actionBtn && document.body.contains(actionBtn)) { actionBtn.innerText = "Истрачено"; actionBtn.disabled = true; }
                        }
                        window.isRPGTransactionActive = false;
                    }, 400);
                }
            });
        }

        if (!hasItems) {
            container.createEl('div', { text: "🎒 Твой рюкзак абсолютно пуст.", attr: {style: "font-style: italic; color: var(--text-muted); text-align: center; padding: 20px;"} });
        }
    } catch (e) {
        container.createEl('p', {text: "Ошибка инвентаря: " + e.message, attr: {style: "color:red;"}});
    }
})();
```
