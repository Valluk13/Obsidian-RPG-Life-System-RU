---
day_off: false
hp_lost: 0
daily_gold: 0
daily_xp: 0
waste_mins: 0
rest_mins: 0
routine_mins: 0
focus_mins: 0
last_timer_end:
timer_tags:
timer_elapsed: 0
timer_start:
timer_state:
---
# Дневник: <% tp.date.now("YYYY-MM-DD") %>
## 🎮 Пульт управления временем

```dataviewjs
const tFile = app.vault.getAbstractFileByPath(dv.current().file.path);
const fm = dv.current();

let logicalToday = window.moment();
if (logicalToday.hour() < 4) logicalToday.subtract(1, 'days');
const logicalTodayStr = logicalToday.format("YYYY-MM-DD");
const physicalTodayStr = window.moment().format("YYYY-MM-DD");

const noteDateStr = dv.current().file.name;
const isNoteToday = (noteDateStr === logicalTodayStr || noteDateStr === physicalTodayStr);

let tState = fm.timer_state || null;
let tStart = fm.timer_start ? (fm.timer_start.ts ? fm.timer_start.ts : new Date(fm.timer_start).getTime()) : null;
let tElapsed = fm.timer_elapsed || 0;
let tTags = fm.timer_tags || "";

if (!isNoteToday && tState) {
    await app.fileManager.processFrontMatter(tFile, f => {
        f.timer_state = null; f.timer_start = null; f.timer_elapsed = 0; f.timer_tags = null;
    });
    tState = null; tStart = null; tElapsed = 0; tTags = "";
}

// ФИКС ДЛИННОГО ТАЙМЕРА: Авто-спасение времени в буфер
if (isNoteToday && tState && tStart) {
    const maxDuration = 12 * 60 * 60 * 1000;
    if (Date.now() - tStart > maxDuration) {
        tState = null; tStart = null; tTags = null;
        tElapsed = 240 * 60 * 1000; 
        await app.fileManager.processFrontMatter(tFile, f => {
            f.timer_state = null; f.timer_start = null; f.timer_elapsed = 240 * 60 * 1000; f.timer_tags = "Авто-спасение сессии";
        });
        new Notice("⚠️ Сессия превысила 12 часов! Буфер спасён: 4 часа добавлены в накопитель. Нажмите СТОП для фиксации.");
    }
}

const container = this.container;
container.empty();

const style = document.createElement('style');
style.textContent = `
.timer-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin: 15px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.row { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: nowrap; }
.btn { border: none; padding: 12px 5px; border-radius: 8px; cursor: pointer; font-weight: bold; flex: 1; flex-basis: 0; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: all 0.2s ease; opacity: 0.6; color: white; font-size: 0.9em; }
.btn:hover { opacity: 0.9; transform: translateY(-1px); }
.active { opacity: 1; transform: scale(1.03) !important; box-shadow: 0 6px 15px rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.4); }
.bg-f { background: #e74c3c; } .bg-r { background: #e67e22; } .bg-re { background: #2ecc71; } .bg-d { background: #95a5a6; }
.inp { background: var(--background-modifier-form-field); border: 1px solid var(--background-modifier-border); color: var(--text-normal); padding: 10px 14px; border-radius: 8px; flex-grow: 1; width: 100%; box-sizing: border-box; font-family: inherit; font-size: 0.95em; transition: 0.2s; }
.inp:focus { border-color: var(--text-accent); outline: none; }
.disp { font-size: 3em; font-family: monospace; font-weight: bold; color: var(--text-accent); text-align: center; margin: 20px 0; letter-spacing: 3px; text-shadow: 0 2px 10px rgba(0,0,0,0.2); }
.controls { display: flex; gap: 12px; margin-top: 15px; }
.act-btn { flex: 1; padding: 14px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; color: #fff; font-size: 1.1em; transition: all 0.2s ease; text-transform: uppercase; letter-spacing: 1px; }
.act-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
.act-btn:disabled { opacity: 0.4; cursor: not-allowed; filter: grayscale(50%); transform: none !important; box-shadow: none !important; }
.bg-p { background: #f39c12; } .bg-res { background: #3498db; } .bg-s { background: #e74c3c; }
.chain-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-size: 0.9em; color: var(--text-muted); background: rgba(0,0,0,0.15); padding: 12px 16px; border-radius: 8px; border: 1px dashed rgba(255,255,255,0.1); }
.chain-label { cursor: pointer; display: flex; align-items: center; gap: 10px; font-weight: bold; color: var(--text-normal); }
.chain-label input { margin: 0; cursor: pointer; width: 18px; height: 18px; accent-color: var(--interactive-accent); }
.warn-banner { background: rgba(230, 126, 34, 0.1); border-left: 4px solid #e67e22; color: #f39c12; padding: 12px 15px; border-radius: 4px; margin-bottom: 15px; font-size: 0.9em; font-weight: bold; display: flex; align-items: center; gap: 10px; }
`;
container.appendChild(style);

const card = container.createEl('div', {cls: 'timer-card'});

if (!isNoteToday) {
    const warnEl = card.createEl('div', { cls: 'warn-banner' });
    warnEl.innerHTML = `<span>⚠️</span> <span>Внимание: Живой пульт отключен. Вы находитесь в архивной или будущей заметке. Воспользуйтесь ручным вводом ниже.</span>`;
}

function fmtTime(ms) {
    if (isNaN(ms)) return "00:00:00";
    let h = Math.floor(ms / 3600000).toString().padStart(2, '0');
    let m = Math.floor((ms % 3600000) / 60000).toString().padStart(2, '0');
    let s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    return h + ":" + m + ":" + s;
}

const fileContentForLog = await app.vault.read(tFile);
let lastLogTime = null; let lastLogDate = null;
let logMatches = [...fileContentForLog.matchAll(/- \d{2}:\d{2}\s*-\s*(\d{2}):(\d{2})\s*\|/g)];

if (logMatches.length > 0) {
    let maxMinutes = -1; let latestLogMatch = null;
    for (let match of logMatches) {
        let hLog = parseInt(match[1]); let sortLogHr = hLog < 4 ? hLog + 24 : hLog;
        let mins = sortLogHr * 60 + parseInt(match[2]);
        if (mins > maxMinutes) { maxMinutes = mins; latestLogMatch = match; }
    }
    if (latestLogMatch) {
        let dateParts = noteDateStr.split('-');
        if(dateParts.length === 3) {
            let year = parseInt(dateParts[0]), month = parseInt(dateParts[1]) - 1, day = parseInt(dateParts[2]);
            let logTimeToday = new Date(year, month, day, parseInt(latestLogMatch[1]), parseInt(latestLogMatch[2]), 0, 0);
            lastLogDate = logTimeToday;
            let pad = x => x.toString().padStart(2, '0');
            lastLogTime = pad(lastLogDate.getHours()) + ":" + pad(lastLogDate.getMinutes());
        }
    }
}

let chainCheck;
if (isNoteToday && lastLogTime && !tState) {
    let chainRow = card.createEl('div', {cls: 'chain-row'}); 
    let chainLabel = chainRow.createEl('label', {cls: 'chain-label'});
    chainCheck = chainLabel.createEl('input', {type: 'checkbox'}); 
    chainLabel.createEl('span', {text: `🔗 Начать встык (с ${lastLogTime})`});
    let pad = x => x.toString().padStart(2, '0'); let n = new Date();
    chainRow.createEl('span', {text: `Сейчас: ${pad(n.getHours())}:${pad(n.getMinutes())}`});
}

const tagInput = card.createEl('input', {type: 'text', placeholder: '✍️ Описание задачи / #тег', cls: 'inp', value: tTags, attr: {style: 'margin-bottom: 20px;'}});
if (!isNoteToday) tagInput.style.display = 'none';

const btnRow = card.createEl('div', {cls: 'row'});

const states = [
    { id: '🔴 Фокус', cls: 'bg-f', yamlKey: 'focus_mins' }, 
    { id: '🪵 Рутина', cls: 'bg-r', yamlKey: 'routine_mins' },
    { id: '⚪ Отдых', cls: 'bg-re', yamlKey: 'rest_mins' }, 
    { id: '⚠️ Слив', cls: 'bg-d', yamlKey: 'waste_mins' }
];

if (isNoteToday) {
    states.forEach(s => {
        let isActive = (tState === s.id) ? ' active' : '';
        let btn = btnRow.createEl('button', {text: s.id, cls: "btn " + s.cls + isActive});
        btn.disabled = tState !== null; 
        btn.addEventListener('click', async () => {
            if (tState !== null || window.isRPGTransactionActive) return; 
            if (tElapsed > 0 && tState === null) { new Notice("❌ Сначала завершите (Стоп) предыдущую сессию!"); return; }
            
            window.isRPGTransactionActive = true;
            btn.innerText = "⏳...";
            let startTimeToSave = new Date();
            if (chainCheck && chainCheck.checked && lastLogDate) startTimeToSave = lastLogDate;
            
            await app.fileManager.processFrontMatter(tFile, (f) => {
                f.timer_state = s.id; f.timer_start = startTimeToSave.toISOString(); f.timer_elapsed = 0; f.timer_tags = tagInput.value;
            });
            window.isRPGTransactionActive = false;
            new Notice("▶️ Активирован: " + s.id);
        });
    });
} else {
    btnRow.style.display = 'none';
}

const display = card.createEl('div', {cls: 'disp', text: '00:00:00'});
if (!isNoteToday) display.style.display = 'none';

let localTimerId = null;

if (tState && isNoteToday) {
    const tick = () => { display.setText(fmtTime(tElapsed + (tStart ? Date.now() - tStart : 0))); };
    tick();
    
    if (tStart) {
        display.style.color = tState === '🔴 Фокус' ? '#e74c3c' : (tState === '⚪ Отдых' ? '#2ecc71' : (tState === '🪵 Рутина' ? '#e67e22' : '#95a5a6'));
        display.style.textShadow = `0 0 20px ${display.style.color}`;
        localTimerId = setInterval(tick, 1000);
        let observer = new MutationObserver(() => { if (!document.body.contains(card)) { clearInterval(localTimerId); observer.disconnect(); } });
        observer.observe(document.body, {childList: true, subtree: true});
    } else {
        display.style.opacity = '0.5'; display.style.textShadow = 'none';
    }

    const ctrls = card.createEl('div', {cls: 'controls'});
    if (tStart) {
        let pauseBtn = ctrls.createEl('button', {text: '⏸ Пауза', cls: 'act-btn bg-p'});
        pauseBtn.addEventListener('click', async () => {
            if (window.isRPGTransactionActive) return; window.isRPGTransactionActive = true;
            if (localTimerId) clearInterval(localTimerId);
            pauseBtn.innerText = "⏳...";
            const additionalElapsed = Date.now() - tStart;
            await app.fileManager.processFrontMatter(tFile, (f) => {
                f.timer_start = null; f.timer_elapsed = tElapsed + additionalElapsed; f.timer_tags = tagInput.value;
            });
            window.isRPGTransactionActive = false;
        });

        let cancelBtn = ctrls.createEl('button', {text: '❌ Отмена', cls: 'act-btn bg-s', attr: {style: 'flex: 0.5; background: transparent; color: #e74c3c; border: 1px solid #e74c3c;'}});
        cancelBtn.addEventListener('click', async () => {
            if (window.isRPGTransactionActive) return; window.isRPGTransactionActive = true;
            if (localTimerId) clearInterval(localTimerId);
            card.querySelectorAll('.act-btn').forEach(b => b.disabled = true);
            cancelBtn.innerText = "⏳";
            await app.fileManager.processFrontMatter(tFile, (f) => {
                f.timer_state = null; f.timer_start = null; f.timer_elapsed = 0; f.timer_tags = null;
            });
            window.isRPGTransactionActive = false;
            new Notice("🚫 Процесс прерван");
        });
    } else {
        let resBtn = ctrls.createEl('button', {text: '▶️ Продолжить', cls: 'act-btn bg-res'});
        resBtn.addEventListener('click', async () => {
            if (window.isRPGTransactionActive) return; window.isRPGTransactionActive = true;
            resBtn.innerText = "⏳...";
            await app.fileManager.processFrontMatter(tFile, (f) => {
                f.timer_start = new Date().toISOString(); f.timer_tags = tagInput.value;
            });
            window.isRPGTransactionActive = false;
        });
    }

    let stopBtn = card.createEl('button', {text: '⏹ ЗАВЕРШИТЬ СЕАНС', cls: 'act-btn bg-s', attr: {style: 'width:100%; margin-top:12px; background: linear-gradient(135deg, #c0392b, #8e44ad);'}});
    stopBtn.addEventListener('click', async () => {
        if (window.isRPGTransactionActive) return; window.isRPGTransactionActive = true;
        if (localTimerId) clearInterval(localTimerId);
        card.querySelectorAll('.act-btn').forEach(b => b.disabled = true);
        stopBtn.innerText = 'КОМПИЛЯЦИЯ...';
        
        let totalMs = tElapsed + (tStart ? Date.now() - tStart : 0);
        let mins = Math.max(1, Math.round(totalMs / 60000));
        let cappedMins = (tState === '⚪ Отдых') ? Math.min(mins, 1440) : Math.min(mins, 240);
        let activeStateObj = states.find(x => x.id === tState);
        let tagsRaw = tagInput.value || "";

        let xpReward = cappedMins; let goldReward = cappedMins;
        if (tState === '🪵 Рутина') { xpReward = Math.round(cappedMins * 0.5); goldReward = Math.round(cappedMins * 0.5); }
        else if (tState === '⚪ Отдых' || tState === '⚠️ Слив') { xpReward = 0; goldReward = 0; }

        let cleanTags = [];
        if (tagsRaw.trim()) { cleanTags = tagsRaw.split(',').map(t => { let s = t.trim(); return s.startsWith('#') ? s : '#' + s; }).filter(t => t.length > 1); }

        let now = new Date(); let start = new Date(now.getTime() - (mins * 60000));
        let pad = (n) => n.toString().padStart(2, '0');
        let sStr = pad(start.getHours()) + ":" + pad(start.getMinutes()); let eStr = pad(now.getHours()) + ":" + pad(now.getMinutes());
        let tStr = cleanTags.join(' '); if (tStr) tStr = " " + tStr;
        let logLine = "- " + sStr + " - " + eStr + " | " + tState + " | " + mins + " мин" + tStr;
        const targetHeading = "## ⏳ Журнал Активности";
        
        // ШАГ 1: Полное и безопасное обновление всех данных через единый API Obsidian
        await app.fileManager.processFrontMatter(tFile, (f) => {
            f.timer_state = null; f.timer_start = null; f.timer_elapsed = 0; f.timer_tags = null;
            f.last_timer_end = eStr;
            
            if (activeStateObj) { f[activeStateObj.yamlKey] = (parseInt(f[activeStateObj.yamlKey]) || 0) + cappedMins; }
            f.daily_xp = (parseInt(f.daily_xp) || 0) + xpReward;
            f.daily_gold = (parseInt(f.daily_gold) || 0) + goldReward;
            
            if (cleanTags.length > 0) {
                if (!f.tags_stat) f.tags_stat = {};
                cleanTags.forEach(t => { let rawTag = t.substring(1); f.tags_stat[rawTag] = (parseInt(f.tags_stat[rawTag]) || 0) + cappedMins; });
            }
        });
        
        // ШАГ 2: Добавление строки в тело заметки (теперь безопасно)
        await app.vault.process(tFile, (content) => {
            const lines = content.split('\n'); const headerIdx = lines.findIndex(line => line.trim() === targetHeading);
            if (headerIdx !== -1) {
                let hNew = parseInt(sStr.split(':')[0]); let sortNewHr = hNew < 4 ? hNew + 24 : hNew;
                let newLogMins = sortNewHr * 60 + parseInt(sStr.split(':')[1]); let insertIdx = headerIdx + 1;
                for (let i = headerIdx + 1; i < lines.length; i++) {
                    let line = lines[i]; if (line.trim() === "") continue; let match = line.match(/^- (\d{2}):(\d{2})/);
                    if (match) {
                        let hLine = parseInt(match[1]); let sortLineHr = hLine < 4 ? hLine + 24 : hLine;
                        let lineMins = sortLineHr * 60 + parseInt(match[2]);
                        if (newLogMins >= lineMins) { insertIdx = i; break; }
                    } else { insertIdx = i; break; }
                    insertIdx = i + 1;
                }
                lines.splice(insertIdx, 0, logLine); return lines.join('\n');
            } else { return content.trimEnd() + `\n\n${targetHeading}\n${logLine}\n`; }
        });
        
        if (window.customJS && customJS.RPG_Engine) customJS.RPG_Engine.invalidateCache();
        window.isRPGTransactionActive = false;
        app.commands.executeCommandById("dataview:dataview-refresh-views");
    });
}

// РУЧНОЙ ВВОД 
const statesManual = [
    { id: '🔴 Фокус', cls: 'bg-f', yamlKey: 'focus_mins' }, { id: '🪵 Рутина', cls: 'bg-r', yamlKey: 'routine_mins' },
    { id: '⚪ Отдых', cls: 'bg-re', yamlKey: 'rest_mins' }, { id: '⚠️ Слив', cls: 'bg-d', yamlKey: 'waste_mins' }
];

const manualDetails = card.createEl('details', {attr: {style: 'margin-top: 25px; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 15px; outline: none;'}});
const manualSummary = manualDetails.createEl('summary', {text: '✍️ Добавить лог вручную (терминал)', attr: {style: 'cursor: pointer; font-size: 0.9em; color: var(--text-muted); font-weight: 800; list-style: none; text-transform: uppercase; letter-spacing: 1px;'}});
const manualForm = manualDetails.createEl('div', {attr: {style: 'display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap; align-items: center; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);'}});

const stateSel = manualForm.createEl('select', {cls: 'inp', attr: {style: 'width: auto; flex-grow: 1; padding: 8px 12px; height: 42px; cursor: pointer;'}});
statesManual.forEach(s => stateSel.createEl('option', {value: s.id, text: s.id}));
stateSel.createEl('option', {value: 'log', text: '📝 Просто заметка'});

const timeStart = manualForm.createEl('input', {type: 'time', cls: 'inp', attr: {style: 'width: auto; padding: 8px 12px; height: 42px; text-align: center;'}});
const timeEnd = manualForm.createEl('input', {type: 'time', cls: 'inp', attr: {style: 'width: auto; padding: 8px 12px; height: 42px; text-align: center;'}});
const descInp = manualForm.createEl('input', {type: 'text', placeholder: 'Текст / #тег', cls: 'inp', attr: {style: 'flex-grow: 2; min-width: 150px; padding: 8px 12px; height: 42px;'}});
const addBtn = manualForm.createEl('button', {text: '➕ ДОБАВИТЬ', cls: 'act-btn bg-res', attr: {style: 'height: 42px; padding: 0 20px; flex-grow: 1;'}});

let nowForInputs = new Date();
let padInput = (n) => n.toString().padStart(2, '0');
timeStart.value = padInput(nowForInputs.getHours()) + ":" + padInput(nowForInputs.getMinutes());
timeEnd.value = padInput(nowForInputs.getHours()) + ":" + padInput(nowForInputs.getMinutes());

stateSel.addEventListener('change', () => { timeEnd.style.display = stateSel.value === 'log' ? 'none' : 'block'; });

addBtn.addEventListener('click', async () => {
    if (window.isRPGTransactionActive) return; window.isRPGTransactionActive = true;
    const selState = stateSel.value; const desc = descInp.value.trim();

    if (!timeStart.value || (selState !== 'log' && !timeEnd.value)) { new Notice("⚠️ Заполните временные рамки!"); window.isRPGTransactionActive = false; return; }

    let sTimeStr = timeStart.value; let eTimeStr = selState === 'log' ? "" : timeEnd.value; let mins = 0;

    if (selState !== 'log') {
        let sParts = sTimeStr.split(':'); let eParts = eTimeStr.split(':');
        let startMin = parseInt(sParts[0]) * 60 + parseInt(sParts[1]);
        let endMin = parseInt(eParts[0]) * 60 + parseInt(eParts[1]);
        if (endMin < startMin) endMin += 24 * 60; 
        mins = endMin - startMin;
        if (mins <= 0) { new Notice("⚠️ Время окончания должно быть позже времени начала!"); window.isRPGTransactionActive = false; return; }
    }

    addBtn.disabled = true; addBtn.innerText = '⏳...';
    let logLine = "";

    if (selState === 'log') {
        let logText = desc ? desc : "Без описания";
        logLine = `- ${sTimeStr} | 📝 Заметка | ${logText}`;
    } else {
        let logText = desc ? " " + desc : "";
        logLine = `- ${sTimeStr} - ${eTimeStr} | ${selState} | ${mins} мин${logText}`;
        let activeStateObj = statesManual.find(x => x.id === selState);
        
        if (activeStateObj) {
            let capped = (selState === '⚪ Отдых') ? Math.min(mins, 1440) : Math.min(mins, 240);
            let xp = capped; let gp = capped;
            if (selState === '🪵 Рутина') { xp = Math.round(capped * 0.5); gp = Math.round(capped * 0.5); }
            else if (selState === '⚪ Отдых' || selState === '⚠️ Слив') { xp = 0; gp = 0; }

            // ШАГ 1: Объединенное и безопасное обновление YAML (без парсинга текста)
            await app.fileManager.processFrontMatter(tFile, (f) => {
                f.last_timer_end = eTimeStr;
                f[activeStateObj.yamlKey] = (parseInt(f[activeStateObj.yamlKey]) || 0) + capped;
                f.daily_xp = (parseInt(f.daily_xp) || 0) + xp;
                f.daily_gold = (parseInt(f.daily_gold) || 0) + gp;
                
                let tagsArray = desc.match(/#[^\s\[\]]+/g);
                if (tagsArray) {
                    if (!f.tags_stat) f.tags_stat = {};
                    tagsArray.forEach(tag => { let clean = tag.replace('#', ''); f.tags_stat[clean] = (parseInt(f.tags_stat[clean]) || 0) + capped; });
                } else if (selState === '🔴 Фокус' || selState === '🪵 Рутина') {
                    if (!f.tags_stat) f.tags_stat = {}; f.tags_stat["Прочее"] = (parseInt(f.tags_stat["Прочее"]) || 0) + capped;
                }
            });
        }
    }

    // ШАГ 2: Добавление строки лога в тело заметки
    const targetHeading = "## ⏳ Журнал Активности";
    await app.vault.process(tFile, (content) => {
        const lines = content.split('\n'); const headerIdx = lines.findIndex(line => line.trim() === targetHeading);
        if (headerIdx !== -1) {
            let hNew = parseInt(sTimeStr.split(':')[0]); let sortNewHr = hNew < 4 ? hNew + 24 : hNew;
            let newLogMins = sortNewHr * 60 + parseInt(sTimeStr.split(':')[1]); let insertIdx = headerIdx + 1;
            for (let i = headerIdx + 1; i < lines.length; i++) {
                let line = lines[i]; if (line.trim() === "") continue; let match = line.match(/^- (\d{2}):(\d{2})/);
                if (match) {
                    let hLine = parseInt(match[1]); let sortLineHr = hLine < 4 ? hLine + 24 : hLine;
                    let lineMins = sortLineHr * 60 + parseInt(match[2]);
                    if (newLogMins >= lineMins) { insertIdx = i; break; }
                } else { insertIdx = i; break; }
                insertIdx = i + 1;
            }
            lines.splice(insertIdx, 0, logLine); return lines.join('\n');
        } else { return content.trimEnd() + `\n\n${targetHeading}\n${logLine}\n`; }
    });
    
    if (window.customJS && customJS.RPG_Engine) customJS.RPG_Engine.invalidateCache();
    app.commands.executeCommandById("dataview:dataview-refresh-views");
    window.isRPGTransactionActive = false;
    new Notice("✅ Запись добавлена!"); addBtn.disabled = false; addBtn.innerText = '➕ ДОБАВИТЬ';
});
```

### Шаблоны для сложности задач
[difficulty:: 🟢 Легкий] 
[difficulty:: 🟡 Средний] 
[difficulty:: 🔴 Сложный]
### Шаблон лога
`- ЧЧ:ММ - ЧЧ:ММ | [ЭМОДЗИ И КАТЕГОРИЯ] | [КОЛИЧЕСТВО] мин [ОПЦИОНАЛЬНО #ТЕГИ]`
## 📜 Свиток Квестов 
- [ ] 
## ⏳ Журнал Активности