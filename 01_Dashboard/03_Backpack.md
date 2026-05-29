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
          ".inv-btn { background: #2ecc71; color: #000; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; width: 100%; font-weight: bold; margin-top: 15px; transition: 0.2s; }" +
          ".inv-btn:disabled { opacity: 0.3; cursor: not-allowed; background: rgba(255,255,255,0.1); color: var(--text-muted); }" +
          ".sell-btn { background: none; border: 1px dashed rgba(231, 76, 60, 0.4); color: #e74c3c; padding: 6px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85em; font-weight: bold; margin-top: 10px; width: 100%; transition: 0.2s; }" +
          ".sell-btn:hover:not(:disabled) { background: rgba(231, 76, 60, 0.05); border-color: #e74c3c; }";

        let hasItems = false;
        for (let key in inventory) {
            if (inventory[key] > 0) hasItems = true;
        }

        if (!hasItems) {
            container.createEl('div', { text: "Ваш рюкзак пуст.", attr: { style: "color: var(--text-muted); font-size: 0.9em; padding: 10px 0; text-align: center;" }});
            return;
        }

        for (let id in inventory) {
            let qty = parseInt(inventory[id]);
            if (qty <= 0) continue;

            const itemInfo = engine.CONFIG.itemDb[id] || { name: 'Неизвестный предмет', cost: 0 };
            
            const card = gridDiv.createEl('div', {cls: 'inv-card'});
            card.createEl('div', {text: itemInfo.name, attr: {style: 'font-weight: bold; font-size: 1.05em; margin-bottom: 6px; color: var(--text-normal);'}});
            const qtyDiv = card.createEl('div', {text: "В наличии: " + qty + " шт.", attr: {style: 'color: #3498db; font-weight: bold; margin-bottom: auto; font-size: 0.95em;'}});

            const useBtn = card.createEl('button', { text: 'Применить', cls: 'inv-btn' });
            
            if (id === 'potion' && ctx.currentHp >= 100) {
                useBtn.disabled = true;
                useBtn.innerText = "HP полное";
            } else {
                useBtn.addEventListener('click', async () => {
                    if (window.isRPGTransactionActive) return;
                    window.isRPGTransactionActive = true;
                    useBtn.disabled = true;
                    const todayStr = window.moment().format("YYYY-MM-DD");

                    try {
                        await app.fileManager.processFrontMatter(tFile, (f) => {
                            f.inventory[id] = Math.max(0, (parseInt(f.inventory[id]) || 0) - 1);
                            if (id === 'potion') {
                                if (!f.potions_history) f.potions_history = {};
                                f.potions_history[todayStr] = (parseInt(f.potions_history[todayStr]) || 0) + 1;
                            }
                        });

                        engine.invalidateCache();
                        qty -= 1;
                        qtyDiv.innerText = "В наличии: " + qty + " шт.";

                        if (id === 'potion') new Notice("✅ Здоровье восстановлено (+25 HP).");
                        else new Notice("✅ Использовано: " + itemInfo.name + ".");
                    } finally {
                        setTimeout(() => { 
                            if (qty > 0) {
                                if (useBtn && document.body.contains(useBtn)) {
                                    useBtn.innerText = "Применить";
                                    useBtn.disabled = false;
                                }
                            } else {
                                if (useBtn && document.body.contains(useBtn)) useBtn.innerText = "Закончилось";
                            }
                            window.isRPGTransactionActive = false;
                        }, 500);
                    }
                });
            }

            const sellBtn = card.createEl('button', { text: "Продать (+" + itemInfo.cost + " GP)", cls: 'sell-btn' });
            sellBtn.addEventListener('click', async () => {
                if (window.isRPGTransactionActive) return;
                window.isRPGTransactionActive = true;
                sellBtn.disabled = true;
                try {
                    await app.fileManager.processFrontMatter(tFile, (f) => {
                        f.inventory[id] = Math.max(0, (parseInt(f.inventory[id]) || 0) - 1);
                        f.bonus_gold = (parseInt(f.bonus_gold) || 0) + itemInfo.cost;
                    });
                    
                    engine.invalidateCache();
                    const newCtx = await engine.buildContext(dv, profilePage);
                    window.dispatchEvent(new CustomEvent('rpg-balance-updated', { detail: { gold: newCtx.currentGold } }));

                    qty -= 1;
                    qtyDiv.innerText = "В наличии: " + qty + " шт.";

                    new Notice("💰 Предмет продан! Вы получили " + itemInfo.cost + " GP.");
                } finally {
                    setTimeout(() => { 
                        if (qty > 0) {
                            if (sellBtn && document.body.contains(sellBtn)) {
                                sellBtn.innerText = "Продать (+" + itemInfo.cost + " GP)";
                                sellBtn.disabled = false;
                            }
                        } else {
                            if (sellBtn && document.body.contains(sellBtn)) sellBtn.innerText = "Продано";
                        }
                        window.isRPGTransactionActive = false;
                    }, 500);
                }
            });
        }
    } catch (e) {
        container.createEl('p', {text: "Ошибка инвентаря: " + e.message, attr: {style: "color:red;"}});
    }
})();
```
