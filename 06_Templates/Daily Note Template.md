---
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

let tState = fm.timer_state || null;
let tStart = fm.timer_start ? new Date(fm.timer_start).getTime() : null;
let tElapsed = fm.timer_elapsed || 0;
let tTags = fm.timer_tags || "";

const container = this.container;
container.empty();

const style = document.createElement('style');
style.textContent = `
.timer-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 18px; margin: 15px 0; }
.row { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
.btn { border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; flex-grow: 1; transition: 0.2s; opacity: 0.5; color: white; }
.btn:hover { opacity: 0.8; }
.active { opacity: 1; transform: scale(1.02); box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.3); }
.bg-f { background: #e74c3c; } .bg-r { background: #e67e22; } .bg-re { background: #2ecc71; } .bg-d { background: #95a5a6; }
.inp { background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: var(--text-normal); padding: 8px 12px; border-radius: 6px; flex-grow: 1; width: 100%; box-sizing: border-box; font-family: monospace; }
.disp { font-size: 2.5em; font-family: monospace; font-weight: bold; color: var(--text-accent); text-align: center; margin: 15px 0; letter-spacing: 2px; }
.controls { display: flex; gap: 10px; margin-top: 10px; }
.act-btn { flex: 1; padding: 12px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; color: #fff; font-size: 1.05em; transition: 0.2s;}
.act-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.bg-p { background: #f39c12; } .bg-res { background: #3498db; } .bg-s { background: #e74c3c; }
.chain-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-size: 0.85em; color: var(--text-muted); background: rgba(0,0,0,0.15); padding: 10px 14px; border-radius: 6px; border: 1px dashed rgba(255,255,255,0.1); }
.chain-label { cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: bold; color: var(--text-normal); }
.chain-label input { margin: 0; cursor: pointer; width: 16px; height: 16px; accent-color: var(--interactive-accent); }
`;
container.appendChild(style);

const card = container.createEl('div', {cls: 'timer-card'});

function fmtTime(ms) {
    let h = Math.floor(ms / 3600000).toString().padStart(2, '0');
    let m = Math.floor((ms % 3600000) / 60000).toString().padStart(2, '0');
    let s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    return h + ":" + m + ":" + s;
}

// ПАРСИНГ ЖУРНАЛА ДЛЯ ФУНКЦИИ "ВСТЫК"
let fileContent = await app.vault.read(tFile);
let lastLogTime = null;
let lastLogDate = null;
let logMatches = [...fileContent.matchAll(/- \d{2}:\d{2}\s*-\s*(\d{2}):(\d{2})\s*\|/g)];

if (logMatches.length > 0) {
    let lm = logMatches[logMatches.length - 1]; // Берем ПОСЛЕДНИЙ лог
    lastLogTime = lm[1] + ":" + lm[2];
    lastLogDate = new Date();
    lastLogDate.setHours(parseInt(lm[1]), parseInt(lm[2]), 0, 0);
    if (lastLogDate > new Date()) lastLogDate.setDate(lastLogDate.getDate() - 1);
}

let chainCheck;
if (lastLogTime && !tState) {
    let chainRow = card.createEl('div', {cls: 'chain-row'});
    let chainLabel = chainRow.createEl('label', {cls: 'chain-label'});
    chainCheck = chainLabel.createEl('input', {type: 'checkbox'});
    chainLabel.createEl('span', {text: `🔗 Начать встык (с ${lastLogTime})`});
    
    let pad = x => x.toString().padStart(2, '0');
    let n = new Date();
    chainRow.createEl('span', {text: `Сейчас: ${pad(n.getHours())}:${pad(n.getMinutes())}`});
}

const tagInput = card.createEl('input', {type: 'text', placeholder: '#тег (опционально)', cls: 'inp', value: tTags, attr: {style: 'margin-bottom: 12px;'}});
const btnRow = card.createEl('div', {cls: 'row'});

const states = [
    { id: '🔴 Фокус', cls: 'bg-f', yamlKey: 'focus_mins' }, 
    { id: '🪵 Рутина', cls: 'bg-r', yamlKey: 'routine_mins' },
    { id: '⚪ Отдых', cls: 'bg-re', yamlKey: 'rest_mins' }, 
    { id: '⚠️ Слив', cls: 'bg-d', yamlKey: 'waste_mins' }
];

states.forEach(s => {
    let isActive = (tState === s.id) ? ' active' : '';
    let btn = btnRow.createEl('button', {text: s.id.split(' ')[1], cls: "btn " + s.cls + isActive});
    btn.disabled = tState !== null; 
    btn.addEventListener('click', async () => {
        if (tState !== null) return; 
        btn.innerText = "⏳...";
        
        let startTimeToSave = new Date();
        if (chainCheck && chainCheck.checked && lastLogDate) {
            startTimeToSave = lastLogDate;
        }
        
        await app.fileManager.processFrontMatter(tFile, (f) => {
            f.timer_state = s.id;
            f.timer_start = startTimeToSave.toISOString();
            f.timer_elapsed = 0;
            f.timer_tags = tagInput.value;
        });
        new Notice("▶️ Запущен режим: " + s.id);
    });
});

const display = card.createEl('div', {cls: 'disp', text: '00:00:00'});

if (tState) {
    if (window.currentRpgTimer) window.clearInterval(window.currentRpgTimer);
    const tick = () => { display.setText(fmtTime(tElapsed + (tStart ? Date.now() - tStart : 0))); };
    tick();
    if (tStart) window.currentRpgTimer = window.setInterval(tick, 1000);
    else display.style.opacity = '0.5'; 

    const ctrls = card.createEl('div', {cls: 'controls'});
    if (tStart) {
        let pauseBtn = ctrls.createEl('button', {text: '⏸ Пауза', cls: 'act-btn bg-p'});
        pauseBtn.addEventListener('click', async () => {
            if (window.currentRpgTimer) window.clearInterval(window.currentRpgTimer);
            pauseBtn.innerText = "⏳...";
            await app.fileManager.processFrontMatter(tFile, (f) => {
                f.timer_start = null;
                f.timer_elapsed = tElapsed + (Date.now() - tStart);
                f.timer_tags = tagInput.value;
            });
        });
    } else {
        let resBtn = ctrls.createEl('button', {text: '▶️ Продолжить', cls: 'act-btn bg-res'});
        resBtn.addEventListener('click', async () => {
            resBtn.innerText = "⏳...";
            await app.fileManager.processFrontMatter(tFile, (f) => {
                f.timer_start = new Date().toISOString();
                f.timer_tags = tagInput.value;
            });
        });
    }

    let stopBtn = card.createEl('button', {text: '⏹ Завершить', cls: 'act-btn bg-s', attr: {style: 'width:100%; margin-top:10px;'}});
    stopBtn.addEventListener('click', async () => {
        if (window.currentRpgTimer) window.clearInterval(window.currentRpgTimer);
        stopBtn.disabled = true; stopBtn.innerText = 'Запись...';
        
        let totalMs = tElapsed + (tStart ? Date.now() - tStart : 0);
        let mins = Math.max(1, Math.round(totalMs / 60000));
        let cappedMins = (tState === '⚪ Отдых') ? Math.min(mins, 1440) : Math.min(mins, 240);
        
        let activeStateObj = states.find(x => x.id === tState);
        
        // 1. ЗАПИСЬ ДАННЫХ В СВОЙСТВА ДЛЯ ДВИЖКА
        await app.fileManager.processFrontMatter(tFile, (f) => {
            f.timer_state = null;
            f.timer_start = null;
            f.timer_tags = null;
            f.timer_elapsed = 0;
            
            if (activeStateObj) f[activeStateObj.yamlKey] = (parseInt(f[activeStateObj.yamlKey]) || 0) + cappedMins;
            
            if (tState === '🔴 Фокус') {
                f.daily_xp = (parseInt(f.daily_xp) || 0) + cappedMins;
                f.daily_gold = (parseInt(f.daily_gold) || 0) + cappedMins;
            } else if (tState === '🪵 Рутина') {
                f.daily_xp = (parseInt(f.daily_xp) || 0) + Math.floor(cappedMins * 0.5);
                f.daily_gold = (parseInt(f.daily_gold) || 0) + Math.floor(cappedMins * 0.5);
            }

            let tagsRaw = tagInput.value || "";
            let tagsArray = tagsRaw.match(/#[^\s\[\]]+/g);
            if (tagsArray) {
                if (!f.tags_stat) f.tags_stat = {};
                tagsArray.forEach(tag => {
                    let clean = tag.replace('#', '');
                    f.tags_stat[clean] = (parseInt(f.tags_stat[clean]) || 0) + cappedMins;
                });
            } else if (tState === '🔴 Фокус' || tState === '🪵 Рутина') {
                if (!f.tags_stat) f.tags_stat = {};
                f.tags_stat["Прочее"] = (parseInt(f.tags_stat["Прочее"]) || 0) + cappedMins;
            }
        });

        // 2. ЗАПИСЬ ТЕКСТОВОГО ЛОГА (Как ты и хотел)
        let now = new Date();
        let start = new Date(now.getTime() - (cappedMins * 60000));
        let pad = (n) => n.toString().padStart(2, '0');
        let sStr = pad(start.getHours()) + ":" + pad(start.getMinutes());
        let eStr = pad(now.getHours()) + ":" + pad(now.getMinutes());
        
        let tStr = (tagInput.value || "").trim();
        if (tStr && !tStr.startsWith(' ')) tStr = " " + tStr;
        let logLine = "- " + sStr + " - " + eStr + " | " + tState + " | " + cappedMins + " мин" + tStr;
        let targetHeading = "## ⏳ Журнал Активности"; 
        
        await app.vault.process(tFile, (content) => {
            const targetHeadingRegex = /(## ⏳ Журнал Активности\s*)(\r?\n)/;
            if (targetHeadingRegex.test(content)) {
                return content.replace(targetHeadingRegex, `$1$2${logLine}$2`);
            } else {
                return content.trimEnd() + `\n\n${targetHeading}\n${logLine}\n`;
            }
        });
        
        new Notice("💾 Активность зафиксирована!");
    });
} else {
    display.style.opacity = '0.3';
}
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

