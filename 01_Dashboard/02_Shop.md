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

        // Слушатель событий: ждет сигнала от магазина, чтобы мгновенно обновить цифры
        const updateBalanceUI = (e) => {
            const newGold = e.detail.gold;
            balanceSpan.innerText = `💰 Баланс: ${newGold} GP`;
            balanceSpan.className = `shop-balance ${newGold >= 0 ? 'balance-positive' : 'balance-negative'}`;
        };

        // Защита от дублирования слушателей при перезагрузке страницы
        if (window.rpgWalletListener) {
            window.removeEventListener('rpg-balance-updated', window.rpgWalletListener);
        }
        window.rpgWalletListener = updateBalanceUI;
        window.addEventListener('rpg-balance-updated', window.rpgWalletListener);

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
        const tFile = app.vault.getAbstractFileByPath(profilePage.file.path);
        
        const ctx = await engine.getSharedContext(dv, profilePage);
        let currentGold = ctx.currentGold;
        const creditLimit = -500; 

        const styleEl = container.createEl('style');
        styleEl.innerHTML = `
          .rpg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-top: 15px; }
          .shop-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 18px; border-radius: 10px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; }
          .shop-controls { display: flex; gap: 10px; width: 100%; align-items: stretch; margin-top: 15px; }
          .qty-input { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); color: var(--text-normal); padding: 8px; border-radius: 6px; width: 60px; text-align: center; font-weight: bold; box-sizing: border-box; }
          .shop-btn { background: var(--interactive-accent); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; flex-grow: 1; font-weight: bold; transition: 0.2s; }
          .shop-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        `;

        const gridDiv = container.createEl('div', {cls: 'rpg-grid'});

        for (let id in engine.CONFIG.itemDb) {
            const item = engine.CONFIG.itemDb[id];
            const card = gridDiv.createEl('div', {cls: 'shop-card'});
            
            card.createEl('div', {text: item.name, attr: {style: 'font-weight: bold; font-size: 1.05em; margin-bottom: 6px; text-align:center; color: var(--text-normal);'}});
            card.createEl('div', {text: item.cost + " GP", attr: {style: 'color: #f1c40f; font-weight: bold; margin-bottom: auto; font-size: 0.95em; text-align:center;'}});
            
            const controls = card.createEl('div', {cls: 'shop-controls'});
            const qtyInput = controls.createEl('input', {type: 'number', value: '1', min: '1', max: '99', cls: 'qty-input'});
            const buyBtn = controls.createEl('button', {text: 'Выкупить', cls: 'shop-btn'});
            
            const updateBtnState = () => {
                let qty = parseInt(qtyInput.value) || 1;
                if (qty < 1) { qty = 1; qtyInput.value = 1; }
                let totalCost = item.cost * qty;
                let projectedBalance = currentGold - totalCost;
                
                if (projectedBalance < creditLimit) {
                    buyBtn.innerText = 'Лимит долга';
                    buyBtn.disabled = true;
                } else if (projectedBalance < 0) {
                    buyBtn.innerText = 'В кредит';
                    buyBtn.disabled = false;
                } else {
                    buyBtn.innerText = 'Выкупить';
                    buyBtn.disabled = false;
                }
            };
            
            qtyInput.addEventListener('input', updateBtnState);
            updateBtnState(); 

            buyBtn.addEventListener('click', async () => {
                if (window.isRPGTransactionActive) return;
                window.isRPGTransactionActive = true;
                buyBtn.disabled = true;
                
                let qty = parseInt(qtyInput.value) || 1;
                let totalCost = item.cost * qty;
                
                if (currentGold - totalCost < creditLimit) {
                    new Notice(`❌ Превышен кредитный лимит (${creditLimit} GP)!`);
                    buyBtn.disabled = false;
                    window.isRPGTransactionActive = false;
                    return;
                }
                
                buyBtn.innerText = "⏳...";
                
                try {
                    await app.fileManager.processFrontMatter(tFile, (fm) => {
                        fm.gold_spent = (parseInt(fm.gold_spent) || 0) + totalCost;
                        if (!fm.inventory) fm.inventory = {};
                        fm.inventory[id] = (parseInt(fm.inventory[id]) || 0) + qty;
                    });
                    
                    // Вычитаем золото и отправляем сигнал кошельку обновиться
                    currentGold -= totalCost;
                    window.dispatchEvent(new CustomEvent('rpg-balance-updated', { detail: { gold: currentGold } }));

                    new Notice('✅ Приобретено: ' + item.name + ' (x' + qty + ')');
                } catch (e) {
                    new Notice('Ошибка транзакции: ' + e.message);
                } finally {
                    setTimeout(() => {
                        if (buyBtn && document.body.contains(buyBtn)) {
                            updateBtnState();
                        }
                        window.isRPGTransactionActive = false;
                    }, 1000);
                }
            });
        }
    } catch(e) {
        container.createEl('p', {text: "Ошибка работы торговой лавки: " + e.message, attr: {style: "color:red;"}});
    }
})();
```
