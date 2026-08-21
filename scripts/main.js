const FLAG_SCOPE = "pf2e-dual-class";

async function buildDualClassData(class1, class2) {
    if (class1 === class2) { return ui.notifications.warn("You cannot select the same class twice"); }


    // Change this 
    /*const dClassObj = Object.assign({}, class1);
    Object.defineProperty(dClassObj, 'system', {
        value: foundry.utils.duplicate(class1.system),
        configurable: true,
        writeable: true
    });*/

    const rE = {
        "domain": "all",
        "key": "RollOption",
        "option": `class:${class2.system.slug}`,
        "priority": 0
    };

    const dClass = class1.toObject();

    dClass.name = `${class1.name} - ${class2.name}`;

    dClass.system.rules = mergeRules(class1.system.rules, class2.system.rules);
    dClass.system.rules.push(rE);

    //Attacks
    if (class2.system.attacks.advanced > dClass.system.attacks.advanced) { dClass.system.attacks.advanced = class2.system.attacks.advanced }
    if (class2.system.attacks.martial > dClass.system.attacks.martial) { dClass.system.attacks.martial = class2.system.attacks.martial }
    if (class2.system.attacks.simple > dClass.system.attacks.simple) { dClass.system.attacks.simple = class2.system.attacks.simple }
    if (class2.system.attacks.unarmed > dClass.system.attacks.unarmed) { dClass.system.attacks.unarmed = class2.system.attacks.unarmed }
    if (dClass.system.attacks.martial <= dClass.system.attacks.other.rank) {
        if (class2.system.attacks.other.rank === dClass.system.attacks.other.rank) {
            let mashed = `${dClass.system.attacks.other.name}, ${class2.system.attacks.other.name}`
            mashed = mashed.replace("and ", "")
            dClass.system.attacks.other.name = [...new Set(mashed.split(','))].join(',');
        }
        if (class2.system.attacks.other.rank > dClass.system.attacks.other.rank) { dClass.system.attacks.other.name = class2.system.attacks.other.name; dClass.system.attacks.other.rank = class2.system.attacks.other.rank; }
    }
    if (dClass.system.attacks.martial >= class2.system.attacks.other.rank && dClass.system.attacks.martial >= dClass.system.attacks.other.rank) { dClass.system.attacks.other.rank = 0; dClass.system.attacks.other.name = ""; }

    //Class DC
    if (class2.system.classDC > dClass.system.classDC) { dClass.system.classDC = class2.system.classDC }
    // Add the 2nd class DC using rules
    dClass.system.rules.push(
        {
            key: "ChoiceSet",
            prompt: `Ability for ${class2.name} Class DC`,
            flag: `${class2.slug}Ability`,
            adjustName: false,
            choices:
                class2.system.keyAbility.value.map(a => ({ value: a, label: `PF2E.Ability${a[0].toUpperCase() + a.slice(1)}` })).
                    concat({ value: "key", label: "Character's Key Ability" })
        },
        {
            key: "ActiveEffectLike",
            mode: "override",
            path: `system.proficiencies.classDCs.${class2.slug}.attribute`,
            value: `{item|flags.pf2e.rulesSelections.${class2.slug}Ability}`,
            predicate: [{ not: { eq: [`{item|flags.pf2e.rulesSelections.${class2.slug}Ability}`, "key"] } }]
        },
        {
            key: "ActiveEffectLike",
            mode: "override",
            path: `system.proficiencies.classDCs.${class2.slug}.attribute`,
            value: "{actor|keyAttribute}",
            predicate: [{ eq: [`{item|flags.pf2e.rulesSelections.${class2.slug}Ability}`, "key"] }]
        },
        {
            key: "ActiveEffectLike",
            mode: "upgrade",
            path: `system.proficiencies.classDCs.${class2.slug}.rank`,
            value: 1
        },
        {
            key: "ActiveEffectLike",
            mode: "override",
            path: `system.proficiencies.classDCs.${class2.slug}.label`,
            value: class2.name
        },
        {
            key: "ActiveEffectLike",
            mode: "override",
            path: `system.proficiencies.classDCs.${class1.system.slug}.label`,
            value: class1.name
        }
    );

    //Defenses
    if (class2.system.defenses.heavy > dClass.system.defenses.heavy) { dClass.system.defenses.heavy = class2.system.defenses.heavy }
    if (class2.system.defenses.light > dClass.system.defenses.light) { dClass.system.defenses.light = class2.system.defenses.light }
    if (class2.system.defenses.heavy > dClass.system.defenses.medium) { dClass.system.defenses.medium = class2.system.defenses.medium }
    if (class2.system.defenses.unarmored > dClass.system.defenses.unarmored) { dClass.system.defenses.unarmored = class2.system.defenses.unarmored }

    //Description
    dClass.system.description.value = `${dClass.system.description.value} ${class2.system.description.value}`;

    //HP
    if (class2.system.hp > dClass.system.hp) { dClass.system.hp = class2.system.hp }

    //Items
    Object.entries(class2.system.items).forEach(i => {
        if (Object.values(dClass.system.items).some(x => x.uuid === i[1].uuid && x.level <= i[1].level)) { return }
        if (Object.values(dClass.system.items).some(x => x.uuid === i[1].uuid && x.level > i[1].level)) { return Object.values(dClass.system.items).find(x => x.uuid === i[1].uuid).level = i[1].level }
        else { dClass.system.items[i[0]] = i[1]; }
    });

    //Key Ability
    class2.system.keyAbility.value.forEach(v => {
        if (dClass.system.keyAbility.value.includes(v)) { return }
        dClass.system.keyAbility.value.push(v);
    });

    //Perception
    if (class2.system.perception > dClass.system.perception) { dClass.system.perception = class2.system.perception }

    //Saving Throws
    if (class2.system.savingThrows.fortitude > dClass.system.savingThrows.fortitude) { dClass.system.savingThrows.fortitude = class2.system.savingThrows.fortitude }
    if (class2.system.savingThrows.reflex > dClass.system.savingThrows.reflex) { dClass.system.savingThrows.reflex = class2.system.savingThrows.reflex }
    if (class2.system.savingThrows.will > dClass.system.savingThrows.will) { dClass.system.savingThrows.will = class2.system.savingThrows.will }

    //Skill Feat Levels
    class2.system.skillFeatLevels.value.forEach(v => { dClass.system.skillFeatLevels.value.push(v) });
    dClass.system.skillFeatLevels.value = [...new Set(dClass.system.skillFeatLevels.value)].sort((a, b) => { return a - b; });

    //Skill Increase Levels
    class2.system.skillIncreaseLevels.value.forEach(v => { dClass.system.skillIncreaseLevels.value.push(v) });
    dClass.system.skillIncreaseLevels.value = [...new Set(dClass.system.skillIncreaseLevels.value)].sort((a, b) => { return a - b; });

    //Trained Skills
    if (class2.system.trainedSkills.additional > dClass.system.trainedSkills.additional) { dClass.system.trainedSkills.additional = class2.system.trainedSkills.additional }
    class2.system.trainedSkills.value.forEach(v => {
        if (dClass.system.trainedSkills.value.includes(v)) { return }
        dClass.system.trainedSkills.value.push(v);
    });

    //Set the image of the Class
    dClass.img = "systems/pf2e/icons/spells/guidance.webp";

    return dClass;
}

async function createDualClassItem(class1, class2) {
    const data = await buildDualClassData(class1, class2);
    const created = await Item.create(data);
    await created.setFlag(FLAG_SCOPE, "sourceClasses", { class1: class1.uuid, class2: class2.uuid });
    await created.setFlag(FLAG_SCOPE, "mergeVersion", 1);
    ui.notifications.info(`Created dual class item: ${created.name}`);
    return created;
}

async function resyncDualClassItem(item) {
    const sourceClasses = item.getFlag(FLAG_SCOPE, "sourceClasses");
    if (!sourceClasses) return ui.notifications.warn(`${item.name} has no dual-class source data.`);

    const class1 = await fromUuid(sourceClasses.class1);
    const class2 = await fromUuid(sourceClasses.class2);
    if (!class1 || !class2) return ui.notifications.error(`Could not resolve source classes for ${item.name}.`);

    const rebuilt = await buildDualClassData(class1, class2);
    await item.update({ system: rebuilt.system });
    ui.notifications.info(`${item.name} resynced.`);
}

async function promptForTwoClasses(classesData) {
    const sorted = [...classesData].sort((a, b) => a.name.localeCompare(b.name));
    const optionsHtml = sorted.map(c => `<option value="${c.uuid}">${c.name}</option>`).join("");

    const content = `
  <div style="display: flex; gap: 1rem;">
    <fieldset style="flex: 1;">
      <label>First Class</label>
      <select name="class1">${optionsHtml}</select>
    </fieldset>
    <fieldset style="flex: 1;">
      <label>Second Class</label>
      <select name="class2">${optionsHtml}</select>
    </fieldset>
  </div>
`;

    const result = await foundry.applications.api.DialogV2.wait({
        window: { title: "Dual Class Item Creator" },
        position: { width: 400 },
        content,
        buttons: [
            {
                action: "create",
                label: "Create",
                default: true,
                callback: (event, button) => ({
                    class1: button.form.elements.class1.value,
                    class2: button.form.elements.class2.value
                })
            },
            { action: "cancel", label: "Cancel", callback: () => null }
        ],
        rejectClose: false
    });

    if (!result) return null;

    if (result.class1 === result.class2) {
        ui.notifications.warn("You must select two different classes.");
        return promptForTwoClasses(classesData);
    }

    const [class1, class2] = await Promise.all([fromUuid(result.class1), fromUuid(result.class2)]);
    return { class1, class2 };
}

function ruleIdentity(r) {
    switch (r.key) {
        case "MartialProficiency": return `${r.key}:${r.slug}`;
        case "ActiveEffectLike": return `${r.key}:${r.path}:${r.mode}`;
        case "RollOption": return `${r.key}:${r.domain}:${r.option}`;
        case "ChoiceSet": return `${r.key}:${r.flag}`;
        default: return null;
    }
}

function mergeRules(class1Rules, class2Rules) {
    const merged = foundry.utils.deepClone(class1Rules);

    for (const rule of class2Rules) {
        const isDuplicate = merged.some(r => foundry.utils.equals(r, rule));
        if (!isDuplicate) merged.push(rule);
    }

    const groups = new Map();
    for (const rule of merged) {
        const id = ruleIdentity(rule);
        if (!id) continue;
        if (!groups.has(id)) groups.set(id, []);
        groups.get(id).push(rule);
    }
    for (const [id, rules] of groups) {
        if (rules.length > 1) {
            console.warn(`Dual Class: conflicting rule elements for ${id}`, rules);
        }
    }

    return merged;
}

Hooks.once("init", () => {
    game.modules.get(FLAG_SCOPE).api = {
        createDualClassItem,
        resyncDualClassItem,
        promptForTwoClasses
    };
});

Hooks.on("renderItemSheetPF2e", (sheet, html) => {
    const item = sheet.document ?? sheet.object;
    if (!item?.getFlag(FLAG_SCOPE, "sourceClasses")) return;

    const root = html[0];
    const title = root.querySelector(".window-header .window-title");
    if (!title) {
        console.warn("Dual Class: couldn't find window title to attach resync button.");
        return;
    }

    if (root.querySelector(".dual-class-resync")) return;

    const button = document.createElement("a");
    button.classList.add("dual-class-resync");
    button.innerHTML = `<i class="fa-solid fa-rotate"></i> Resync`;
    button.style.marginLeft = "0.5rem";
    button.addEventListener("click", (event) => {
        event.preventDefault();
        game.modules.get(FLAG_SCOPE).api.resyncDualClassItem(item);
    });

    title.after(button);
});