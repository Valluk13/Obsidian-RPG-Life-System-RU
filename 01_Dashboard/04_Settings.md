# ⚙️ Терминал Настройки Баланса Life RPG

```dataviewjs
(async () => {
    const container = this.container; container.empty();

    if (!window.customJS || !customJS.RPG_Engine) {
        container.createEl('div', { text: "⚠️ Ожидание запуска Ядра системы...", attr: { style: "color: #e74c3c;" } });
        return;
    }

    const engine = customJS.RPG_Engine; const config = await engine.loadConfig();
    let activeTabName = window.rpgActiveSettingsTab || "habits"; 

    const generateSlug = (text) => {
        const ru = {"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"shch","ы":"y","э":"e","ю":"yu","я":"ya"};
        let str = text.toLowerCase().trim(); let res = "";
        for (let i = 0; i < str.length; i++) { res += ru[str[i]] !== undefined ? ru[str[i]] : str[i]; }
        return res.replace(/[^a-z0-9]/g, "_") + "_" + Math.random().toString(36).substring(2, 5);
    };

    const triggerBackgroundRefresh = () => { setTimeout(() => { app.commands.executeCommandById("dataview:dataview-refresh-views"); }, 150); };

    // 🎨 ЭТАЛОННЫЙ ДИЗАЙН И ФИКС ЦВЕТОВОЙ ГАММЫ СЕЛЕКТА
    const mainStyle = container.createEl('style');
    mainStyle.innerHTML = `
        .adm-wrapper { background: var(--background-primary-alt); border-radius: 16px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); margin-top: 15px; }
        
        /* Хедер вкладок капсом */
        .adm-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .adm-tab-btn { background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.05); padding: 12px 5px; border-radius: 8px; color: var(--text-muted); text-align: center; text-transform: uppercase; font-weight: 800; font-size: 0.85em; letter-spacing: 1px; cursor: pointer; transition: all 0.25s ease; display: flex; align-items: center; justify-content: center; }
        .adm-tab-btn:hover { background: rgba(255,255,255,0.04); color: var(--text-normal); border-color: rgba(255,255,255,0.1); }
        .adm-tab-btn.active { background: linear-gradient(135deg, var(--interactive-accent), var(--interactive-accent-hover)); color: #ffffff; border: none; box-shadow: 0 4px 12px rgba(var(--interactive-accent-rgb), 0.3); }
        
        .adm-panel { display: none; background: rgba(0,0,0,0.12); border: 1px solid rgba(255,255,255,0.03); padding: 25px; border-radius: 12px; }
        .adm-panel.active { display: block; }
        
        .adm-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 0.9em; }
        .adm-table th { text-align: left; background: rgba(0,0,0,0.2); padding: 12px 15px; color: var(--text-muted); font-size: 0.8em; text-transform: uppercase; letter-spacing: 1px; }
        .adm-table td { padding: 12px 15px; border-bottom: 1px dashed rgba(255,255,255,0.05); vertical-align: middle; }
        
        .adm-actions-cell { display: inline-flex; gap: 8px; align-items: center; }
        .adm-btn-toggle { padding: 5px 12px; border-radius: 6px; border: none; cursor: pointer; font-weight: bold; font-size: 0.85em; text-transform: uppercase; }
        .btn-active-true { background: rgba(46, 204, 113, 0.15); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.2); }
        .btn-active-false { background: rgba(231, 76, 60, 0.15); color: #e74c3c; border: 1px solid rgba(231, 76, 60, 0.2); }
        .adm-btn-hard-del { background: rgba(231, 76, 60, 0.1); border: 1px solid rgba(231, 76, 60, 0.2); color: #e74c3c; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        
        /* ✨ ДВУХКОЛОНОЧНЫЙ КРАСИВЫЙ БЛОК ФОРМЫ СЕКЦИИ ДОБАВЛЕНИЯ */
        .adm-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; margin-top: 25px; padding: 25px; background: rgba(0,0,0,0.18); border-radius: 12px; border: 1px solid rgba(255,255,255,0.04); align-items: end; }
        .adm-form-title { grid-column: 1 / -1; font-weight: bold; font-size: 0.85em; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; display: flex; align-items: center; gap: 6px; }
        .adm-form-cell { display: flex; flex-direction: column; gap: 6px; width: 100%; }
        .adm-form-label { font-size: 0.75em; font-weight: bold; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        
        /* Стилизация полей ввода */
        .adm-input { background: var(--background-modifier-form-field); border: 1px solid var(--background-modifier-border); color: var(--text-normal); padding: 8px 12px; border-radius: 6px; font-size: 0.95em; width: 100%; box-sizing: border-box; height: 38px; }
        .adm-input:focus { border-color: var(--text-accent); outline: none; }
        
        /* 👍 ТОТАЛЬНЫЙ ФИКС ДЛЯ СЕЛЕКТА: Запрещаем вертикальное обрезание */
        select.adm-input { 
            appearance: none; -webkit-appearance: none;
            background: var(--background-modifier-form-field) url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 4l4 4 4-4'/%3E%3C/svg%3E") no-repeat right 12px center !important;
            padding: 0 35px 0 12px !important; /* Убираем вертикальные отступы, чтобы текст влез */
            text-overflow: ellipsis !important; /* Вместо clip используем ellipsis */
            white-space: nowrap;
            cursor: pointer;
            line-height: 36px; /* Фиксируем высоту строки точно по размеру блока */
        }
        select.adm-input option { background: var(--background-primary); color: var(--text-normal); }
        
        /* Кнопка Добавить */
        .adm-btn-submit { background: var(--interactive-accent); color: white; border: none; padding: 0 20px; border-radius: 6px; font-weight: bold; height: 38px; transition: 0.2s; text-transform: uppercase; font-size: 0.85em; letter-spacing: 0.5px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; width: 100%; box-sizing: border-box; }
        .adm-btn-submit:hover { background: var(--interactive-accent-hover); }
        
        .balance-row { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 14px 18px; border-bottom: 1px dashed rgba(255,255,255,0.05); background: rgba(255,255,255,0.01); border-radius: 6px; margin-bottom: 6px; }
        .balance-info { display: flex; flex-direction: column; gap: 2px; }
        .balance-label { font-weight: bold; font-size: 0.95em; }
        .balance-desc { font-size: 0.8em; color: var(--text-muted); }
    `;

    const wrapper = container.createEl('div', { cls: 'adm-wrapper' });
    const tabsContainer = wrapper.createEl('div', { cls: 'adm-tabs' });
    
    const tabHabits = tabsContainer.createEl('div', { cls: 'adm-tab-btn', text: "🎯 РИТУАЛЫ" });
    const tabShop = tabsContainer.createEl('div', { cls: 'adm-tab-btn', text: "🛒 ЛАВКА" });
    const tabAreas = tabsContainer.createEl('div', { cls: 'adm-tab-btn', text: "🌐 СФЕРЫ" });
    const tabSystem = tabsContainer.createEl('div', { cls: 'adm-tab-btn', text: "⚖️ БАЛАНС" });

    const panelHabits = wrapper.createEl('div', { cls: 'adm-panel' });
    const panelShop = wrapper.createEl('div', { cls: 'adm-panel' });
    const panelAreas = wrapper.createEl('div', { cls: 'adm-panel' });
    const panelSystem = wrapper.createEl('div', { cls: 'adm-panel' });

    if (activeTabName === "habits") { tabHabits.classList.add('active'); panelHabits.classList.add('active'); }
    if (activeTabName === "shop") { tabShop.classList.add('active'); panelShop.classList.add('active'); }
    if (activeTabName === "areas") { tabAreas.classList.add('active'); panelAreas.classList.add('active'); }
    if (activeTabName === "system") { tabSystem.classList.add('active'); panelSystem.classList.add('active'); }

    const setTab = (name, tabEl, panelEl) => {
        activeTabName = name; window.rpgActiveSettingsTab = name;
        tabsContainer.querySelectorAll('.adm-tab-btn').forEach(t => t.classList.remove('active'));
        wrapper.querySelectorAll('.adm-panel').forEach(p => p.classList.remove('active'));
        tabEl.classList.add('active');
        panelEl.classList.add('active');
    };

    tabHabits.addEventListener('click', () => setTab("habits", tabHabits, panelHabits));
    tabShop.addEventListener('click', () => setTab("shop", tabShop, panelShop));
    tabAreas.addEventListener('click', () => setTab("areas", tabAreas, panelAreas));
    tabSystem.addEventListener('click', () => setTab("system", tabSystem, panelSystem));

    const renderAll = async () => {
        panelHabits.empty(); panelShop.empty(); panelAreas.empty(); panelSystem.empty();

        // === ПАНЕЛЬ 1: РИТУАЛЫ ===
        panelHabits.createEl('h3', { text: "Реестр Ежедневных Ритуалов", attr: { style: "margin-top:0; margin-bottom: 15px; color: var(--text-title);" } });
        
        if (Array.isArray(config.custom_habits) && config.custom_habits.length > 0) {
            const tHabits = panelHabits.createEl('table', { cls: 'adm-table' });
            const thh = tHabits.createEl('tr');
            ["Иконка", "Название", "Сфера", "Награда", "Управление"].forEach(x => thh.createEl('th', { text: x }));

            config.custom_habits.forEach((habit, idx) => {
                const tr = tHabits.createEl('tr');
                tr.createEl('td', { text: habit.icon, attr: { style: "font-size:1.4em; text-align:center;" } });
                tr.createEl('td', { text: habit.name, attr: { style: "font-weight:bold; color: var(--text-normal);" } });
                tr.createEl('td', { text: config.life_areas?.[habit.area]?.label || habit.area, attr: { style: "color: var(--text-muted);" } });
                tr.createEl('td', { text: `+${habit.xp}XP / +${habit.gp}GP` });
                
                const tdActions = tr.createEl('td');
                const boxActions = tdActions.createEl('div', { cls: 'adm-actions-cell' });
                
                const btnToggle = boxActions.createEl('button', { text: habit.active ? "Активен" : "Скрыт", cls: `adm-btn-toggle btn-active-${habit.active}` });
                btnToggle.addEventListener('click', async () => {
                    boxActions.style.pointerEvents = 'none';
                    config.custom_habits[idx].active = !config.custom_habits[idx].active;
                    await engine.saveConfig(config); triggerBackgroundRefresh(); renderAll();
                });

                const btnHard = boxActions.createEl('button', { text: "🗑️", cls: 'adm-btn-hard-del' });
                btnHard.addEventListener('click', async () => {
                    if(confirm(`⚠️ Удалить ритуал "${habit.name}"?`)) {
                        boxActions.style.pointerEvents = 'none';
                        config.custom_habits.splice(idx, 1);
                        await engine.saveConfig(config); triggerBackgroundRefresh(); renderAll();
                    }
                });
            });
        } else {
            panelHabits.createEl('p', { text: "База ритуалов пуста. Добавьте свой первый ритуал ниже.", attr: { style: "font-style: italic; color: var(--text-muted); margin-bottom: 15px;" } });
        }

        const fHabit = panelHabits.createEl('div', { cls: 'adm-form' });
        fHabit.createEl('div', { cls: 'adm-form-title' }).innerHTML = '<span>✨</span> <span>СОЗДАТЬ НОВЫЙ РИТУАЛ</span>';
        
        const h1 = fHabit.createEl('div', { cls: 'adm-form-cell' }); h1.createEl('label', { cls: 'adm-form-label', text: 'Название' });
        const inHName = h1.createEl('input', { type: 'text', placeholder: 'Медитация', cls: 'adm-input' });
        
        const h2 = fHabit.createEl('div', { cls: 'adm-form-cell' }); h2.createEl('label', { cls: 'adm-form-label', text: 'Иконка' });
        const inHIcon = h2.createEl('input', { type: 'text', placeholder: '🧘‍♂️', cls: 'adm-input', attr: {style: "text-align: center;"} });
        
        const h3 = fHabit.createEl('div', { cls: 'adm-form-cell' }); h3.createEl('label', { cls: 'adm-form-label', text: 'Сфера жизни' });
        const selHArea = h3.createEl('select', { cls: 'adm-input' });
        
        let hasAreas = false;
        Object.entries(config.life_areas || {}).forEach(([key, val]) => { 
            if(val && val.active !== false) {
                hasAreas = true;
                selHArea.createEl('option', { value: key, text: `${val.icon || "🌐"} ${val.label || key}` }); 
            }
        });

        // ФИКС: Ультракороткий текст, который точно влезет
        if (!hasAreas) {
            selHArea.createEl('option', { value: "", text: "Нет сфер", attr: { selected: true, disabled: true, hidden: true } });
            selHArea.disabled = true;
            selHArea.style.color = "var(--text-muted)";
            selHArea.style.cursor = "not-allowed";
            selHArea.style.opacity = "0.6";
        }
        
        const h4_ = fHabit.createEl('div', { cls: 'adm-form-cell' }); h4_.createEl('label', { cls: 'adm-form-label', text: 'Опыт (XP)' });
        const inHXp = h4_.createEl('input', { type: 'number', placeholder: '20', cls: 'adm-input', value: "20" });
        
        const h5 = fHabit.createEl('div', { cls: 'adm-form-cell' }); h5.createEl('label', { cls: 'adm-form-label', text: 'Золото (GP)' });
        const inHGp = h5.createEl('input', { type: 'number', placeholder: '10', cls: 'adm-input', value: "10" });
        
        const btnContainer = fHabit.createEl('div', { cls: 'adm-form-cell' });
        const btnHSubmit = btnContainer.createEl('button', { text: "Добавить", cls: 'adm-btn-submit' });

        btnHSubmit.addEventListener('click', async () => {
            if (!inHName.value.trim() || !inHXp.value || !inHGp.value) { new Notice("⚠️ Заполните все поля ввода!"); return; }
            if (hasAreas && !selHArea.value) { new Notice("⚠️ Выберите Сферу Жизни!"); return; }
            fHabit.style.pointerEvents = 'none';
            config.custom_habits.push({
                id: generateSlug(inHName.value), name: inHName.value.trim(), icon: inHIcon.value.trim() || "🔹",
                xp: parseInt(inHXp.value) || 0, gp: parseInt(inHGp.value) || 0, area: selHArea.value, active: true
            });
            await engine.saveConfig(config); new Notice(`✅ Ритуал успешно добавлен!`); triggerBackgroundRefresh(); renderAll();
        });

        // === ПАНЕЛЬ 2: МАГАЗИН ===
        panelShop.createEl('h3', { text: "🛒 Управление Товарами Магазина", attr: { style: "margin-top:0; margin-bottom: 15px; color: var(--text-title);" } });
        
        if (Array.isArray(config.shop_items) && config.shop_items.length > 0) {
            const tShop = panelShop.createEl('table', { cls: 'adm-table' });
            const ths = tShop.createEl('tr');
            ["ID лота", "Наименование товара", "Цена", "Управление"].forEach(x => ths.createEl('th', { text: x }));

            config.shop_items.forEach((item, idx) => {
                const tr = tShop.createEl('tr');
                tr.createEl('td', { text: item.id, attr: { style: "font-family: monospace; font-size:0.85em; color:var(--text-muted);" } });
                tr.createEl('td', { text: item.name, attr: { style: "font-weight:bold; color: var(--text-normal);" } });
                tr.createEl('td', { text: `${item.cost} GP`, attr: { style: "color: #f1c40f; font-weight:bold;" } });
                
                const tdActions = tr.createEl('td');
                const boxActions = tdActions.createEl('div', { cls: 'adm-actions-cell' });
                
                const btnToggle = boxActions.createEl('button', { text: item.active ? "В продаже" : "Снят", cls: `adm-btn-toggle btn-active-${item.active}` });
                btnToggle.addEventListener('click', async () => {
                    boxActions.style.pointerEvents = 'none';
                    config.shop_items[idx].active = !config.shop_items[idx].active;
                    await engine.saveConfig(config); triggerBackgroundRefresh(); renderAll();
                });

                const btnHard = boxActions.createEl('button', { text: "🗑️", cls: 'adm-btn-hard-del' });
                btnHard.addEventListener('click', async () => {
                    if(confirm(`⚠️ НАВСЕГДА удалить товар "${item.name}"?`)) {
                        boxActions.style.pointerEvents = 'none';
                        config.shop_items.splice(idx, 1);
                        await engine.saveConfig(config); triggerBackgroundRefresh(); renderAll();
                    }
                });
            });
        }

        const fShop = panelShop.createEl('div', { cls: 'adm-form' });
        fShop.createEl('div', { cls: 'adm-form-title' }).innerHTML = '<span>🛒</span> <span>ВЫСТАВИТЬ НОВЫЙ ТОВАР</span>';
        
        const s1 = fShop.createEl('div', { cls: 'adm-form-cell' }); s1.createEl('label', { cls: 'adm-form-label', text: 'ID товара (eng)' });
        const inSId = s1.createEl('input', { type: 'text', placeholder: 'potion_heal', cls: 'adm-input' });
        const s2 = fShop.createEl('div', { cls: 'adm-form-cell' }); s2.createEl('label', { cls: 'adm-form-label', text: 'Название лота' });
        const inSName = s2.createEl('input', { type: 'text', placeholder: '🧪 Зелье маны', cls: 'adm-input' });
        const s3 = fShop.createEl('div', { cls: 'adm-form-cell' }); s3.createEl('label', { cls: 'adm-form-label', text: 'Цена (GP)' });
        const inSCost = s3.createEl('input', { type: 'number', placeholder: '100', cls: 'adm-input' });
        const btnSContainer = fShop.createEl('div', { cls: 'adm-form-cell' });
        const btnShopSubmit = btnSContainer.createEl('button', { text: "Выставить", cls: 'adm-btn-submit' });

        btnShopSubmit.addEventListener('click', async () => {
            const rawId = inSId.value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
            if (!rawId || !inSName.value.trim() || !inSCost.value) { new Notice("⚠️ Заполните все поля!"); return; }
            if (!Array.isArray(config.shop_items)) config.shop_items = [];
            if (config.shop_items.some(x => x.id === rawId)) { new Notice("❌ Этот ID лота уже занят!"); return; }
            fShop.style.pointerEvents = 'none';
            config.shop_items.push({ id: rawId, name: inSName.value.trim(), cost: parseInt(inSCost.value) || 0, active: true });
            await engine.saveConfig(config); new Notice("✅ Товар выставлен!"); triggerBackgroundRefresh(); renderAll();
        });

        // =========================================================================
        // ПАНЕЛЬ 3: СФЕРЫ ЖИЗНИ
        // =========================================================================
        panelAreas.createEl('h4', { text: "🌐 Реестр сфер жизни", attr: { style: "margin-top:0; margin-bottom: 15px;" } });
        
        if (config.life_areas && Object.keys(config.life_areas).length > 0) {
            const tAreas = panelAreas.createEl('table', { cls: 'adm-table' });
            const tha = tAreas.createEl('tr');
            ["Сфера", "ID сферы", "Цвет тега", "Управление"].forEach(x => tha.createEl('th', { text: x }));

            Object.entries(config.life_areas).forEach(([key, val]) => {
                if(!val) return;
                const tr = tAreas.createEl('tr');
                tr.createEl('td', { text: `${val.icon || "🌐"} ${val.label || key}`, attr: { style: "font-weight:bold; color: var(--text-normal);" } });
                tr.createEl('td', { text: key, attr: { style: "font-family: monospace; color: var(--text-muted);" } });
                tr.createEl('td', { text: val.color || "inherit", attr: { style: `color: ${val.color}; font-weight:bold;` } });
                
                const tdActions = tr.createEl('td');
                const boxActions = tdActions.createEl('div', { cls: 'adm-actions-cell' });
                const isAreaActive = val.active !== false;

                const btnToggle = boxActions.createEl('button', { text: isAreaActive ? "Активна" : "Скрыта", cls: `adm-btn-toggle btn-active-${isAreaActive}` });
                btnToggle.addEventListener('click', async () => {
                    boxActions.style.pointerEvents = 'none';
                    config.life_areas[key].active = !isAreaActive;
                    await engine.saveConfig(config); triggerBackgroundRefresh(); renderAll();
                });

                const btnHard = boxActions.createEl('button', { text: "🗑️", cls: 'adm-btn-hard-del' });
                btnHard.addEventListener('click', async () => {
                    if(confirm(`⚠️ Удалить сферу "${val.label || key}"?`)) {
                        boxActions.style.pointerEvents = 'none';
                        delete config.life_areas[key];
                        await engine.saveConfig(config); triggerBackgroundRefresh(); renderAll();
                    }
                });
            });
        }

        const fArea = panelAreas.createEl('div', { cls: 'adm-form' });
        fArea.createEl('div', { cls: 'adm-form-title' }).innerHTML = '<span>🌐</span> <span>СОЗДАТЬ НОВУЮ СФЕРУ ЖИЗНИ</span>';
        
        const a1 = fArea.createEl('div', { cls: 'adm-form-cell' }); a1.createEl('label', { cls: 'adm-form-label', text: 'Английский ID' });
        const inAId = a1.createEl('input', { type: 'text', placeholder: 'mind', cls: 'adm-input' });
        const a2 = fArea.createEl('div', { cls: 'adm-form-cell' }); a2.createEl('label', { cls: 'adm-form-label', text: 'Имя сферы' });
        const inALabel = a2.createEl('input', { type: 'text', placeholder: 'Разум', cls: 'adm-input' });
        const a3 = fArea.createEl('div', { cls: 'adm-form-cell' }); a3.createEl('label', { cls: 'adm-form-label', text: 'Эмодзи' });
        const inAIcon = a3.createEl('input', { type: 'text', placeholder: '🧠', cls: 'adm-input', attr: {style: "text-align: center;"} });
        const a4 = fArea.createEl('div', { cls: 'adm-form-cell' }); a4.createEl('label', { cls: 'adm-form-label', text: 'HEX Цвет' });
        const inAColor = a4.createEl('input', { type: 'text', placeholder: '#3498db', cls: 'adm-input' });
        const btnAContainer = fArea.createEl('div', { cls: 'adm-form-cell' });
        const btnAreaSubmit = btnAContainer.createEl('button', { text: "Создать сферу", cls: 'adm-btn-submit' });

        btnAreaSubmit.addEventListener('click', async () => {
            const rawId = inAId.value.trim().toLowerCase().replace(/[^a-z]/g, "");
            if(!rawId || !inALabel.value.trim()) { new Notice("⚠️ Заполните имя и ID!"); return; }
            if(!config.life_areas) config.life_areas = {};
            config.life_areas[rawId] = { label: inALabel.value.trim(), icon: inAIcon.value.trim() || "🌐", color: inAColor.value.trim() || "var(--text-normal)", active: true };
            await engine.saveConfig(config); new Notice("✅ Сфера развития зафиксирована!"); triggerBackgroundRefresh(); renderAll();
        });

        // =========================================================================
        // ПАНЕЛЬ 4: ГЕЙМ-БАЛАНС
        // =========================================================================
        panelSystem.createEl('h4', { text: "⚖️ Калибровка весов геймификации", attr: { style: "margin-top:0;" } });
        const balanceBox = panelSystem.createEl('div');

        const renderBalanceField = (parent, label, desc, configKey, subKey, fallbackVal) => {
            const row = parent.createEl('div', { cls: 'balance-row' });
            const info = row.createEl('div', { cls: 'balance-info' });
            info.createEl('span', { cls: 'balance-label', text: label });
            info.createEl('span', { cls: 'balance-desc', text: desc });
            
            if (config[configKey][subKey] === undefined || config[configKey][subKey] === null) config[configKey][subKey] = fallbackVal;

            const input = row.createEl('input', { type: 'number', cls: 'adm-input', value: config[configKey][subKey], attr: { style: "width: 140px; text-align: center; font-weight: bold; font-size: 1.1em; background: rgba(0,0,0,0.5);" } });
            input.addEventListener('change', async () => {
                config[configKey][subKey] = parseInt(input.value) || 0;
                await engine.saveConfig(config); new Notice("⚙️ Метрика баланса обновлена!"); triggerBackgroundRefresh();
            });
        };

        renderBalanceField(balanceBox, "XP на уровень", "Опыт для перехода на следующий уровень", "game_balance", "xpPerLevel", 1000);
        renderBalanceField(balanceBox, "Максимум Здоровья (HP)", "Верхний лимит здоровья персонажа", "game_balance", "maxHp", 100);
        renderBalanceField(balanceBox, "Лечение от зелий", "Восстановление здоровья при питье эликсира", "game_balance", "potionHeal", 25);
        renderBalanceField(balanceBox, "Кредитный лимит Лавки", "Баланс, ниже которого покупки блокируются", "game_balance", "creditLimit", -500);
        renderBalanceField(balanceBox, "Урон бездействия (0 мин фокуса)", "Количество HP, списываемое за полностью пропущенный день работы", "game_balance", "passiveHpLoss", 10);
        renderBalanceField(balanceBox, "Регенерация за закрытый день", "Сколько HP восстанавливает герой, если закрыл план без провалов", "game_balance", "passiveHpGain", 10);
        renderBalanceField(balanceBox, "Порог минут для регенерации", "Минимум фокуса за день, необходимый для запуска хила", "game_balance", "focusThreshold", 60);
        renderBalanceField(balanceBox, "Окно ретроспективного анализа", "Глубина дней, за которые подсчитывается пассивный урон", "game_balance", "decayDays", 14);

        panelSystem.createEl('h5', { text: "⚔️ Настройки наград за сложность квестов", attr: { style: "margin-top: 25px; margin-bottom: 10px; color: var(--text-accent);" } });
        const tDiffs = panelSystem.createEl('table', { cls: 'adm-table' });
        const thd = tDiffs.createEl('tr');
        ["Ключевой Тег", "Базовый XP", "Базовый Золото", "Урон при провале"].forEach(x => thd.createEl('th', { text: x }));

        Object.entries(config.difficulties || {}).forEach(([key, val]) => {
            if(!val) return;
            const tr = tDiffs.createEl('tr');
            tr.createEl('td', { text: `[difficulty:: ${key}]`, attr: { style: "font-family: monospace; font-weight: bold; color: var(--text-normal);" } });
            
            const createStatInput = (parentTr, valKey) => {
                const td = parentTr.createEl('td');
                const inp = td.createEl('input', { type: 'number', cls: 'adm-input', value: val[valKey], attr: {style: 'width: 80px; text-align:center; background: rgba(0,0,0,0.5);'} });
                inp.addEventListener('change', async () => {
                    config.difficulties[key][valKey] = parseInt(inp.value) || 0; await engine.saveConfig(config); triggerBackgroundRefresh();
                });
            };
            createStatInput(tr, 'xp'); createStatInput(tr, 'gp'); createStatInput(tr, 'dmg');
        });
    };

    await renderAll();
})();
```
