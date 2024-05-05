import { SWYVERS } from "../config/swyvers.mjs";

const rollTemplate = "systems/swyvers/templates/dice/roll.hbs";

export async function roll(item, under) {
  await under ? rollUnder(item) : rollAsHigh(item);
}

export async function rollUnder(item) {
  await _rollUnder(item,
    item.system.attribute == SWYVERS.SKILL.ATTRIBUTES.uncertain.id ?
      _rollUnderNumberButtons :
      _rollUnderAttributeButtons
  );
}

async function _rollUnder(item, buttonsFunc) {
  const testName = game.i18n.localize("SWYVERS.TestTitle", { title: item.name });
  const originalContent = await item.system.getCardData();
  const [buttons, targetInfo, additionalTargetInfo] = await buttonsFunc(item, originalContent);

  const dialogContent = `${originalContent}<p class="item-target">${game.i18n.localize("SWYVERS.Target")}: ${targetInfo} + ${item.system.value}${additionalTargetInfo}</p>`;
  new Dialog(
    {
      title: testName,
      content: dialogContent,
      buttons: buttons
    }).render(true);
}

async function _rollUnderNumberButtons(item, content) {
  const additionalFlavor = `<input type="text" id="target" value="10" data-dtype="Number">`;
  return [{
    roll: {
      icon: '<i class="fas fa-dice"></i>',
      label: `Roll`,
      callback: (html) => {
        const targetInfo = parseInt(html.find("#target")[0].value);
        _rollDiceUnder(item, 3, content, targetInfo, targetInfo, "");
      }
    }
  }, additionalFlavor, ""];
}

async function _rollUnderAttributeButtons(item, content) {
  const rollData = item.getRollData();
  let target = rollData.actor.attributes[rollData.attribute].value;
  let targetInfo = `${game.i18n.localize(SWYVERS.SKILL.ATTRIBUTES[item.system.attribute].label)} (${item.actor.system.attributes[item.system.attribute].value})`;
  let [mod, additionalTargetInfo] = await _getAttributeModifier(item);
  target += mod;

  let buttons = {};
  for (let index = 2; index < 6; index++) {
    buttons[`button${index}d6`] = {
      icon: '<i class="fas fa-dice"></i>',
      label: `${index}d6`,
      callback: () => _rollDiceUnder(item, index, content, target, targetInfo, additionalTargetInfo)
    };
  }
  return [buttons, targetInfo, additionalTargetInfo];
}

async function _rollDiceUnder(item, dice, content, target, targetInfo, additionalTargetInfo) {
  let roll = await new Roll(`${dice}d6`).roll({ async: true });

  const additionalFlavor = `<p class="item-target">${game.i18n.localize("SWYVERS.Target")}: ${targetInfo} + ${item.system.value}${additionalTargetInfo}</p>`;
  const finalTarget = target + item.system.value;
  const chatContent = await renderTemplate(rollTemplate, {
    flavor: content,
    additionalFlavor: additionalFlavor,
    formula: `${dice}d6 < ${finalTarget}`,
    tooltip: await roll.getTooltip(),
    total: `${roll.total}`,
    totalClass: roll.total < finalTarget ? "success" : "failure"
  })
  roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: item.actor }),
    content: chatContent
  });
}

export async function rollAsHigh(item) {
  const testName = game.i18n.localize("SWYVERS.TestTitle", { title: item.name });
  let [mod, additionalTargetInfo] = await _getAttributeModifier(item);
  let content = await item.system.getCardData() + `<p class="item-target">${game.i18n.localize("SWYVERS.RollAsHigh")} + ${item.system.value}${additionalTargetInfo}</p>`;

  new Dialog(
    {
      title: testName,
      content: content,
      buttons: {
        roll: {
          icon: '<i class="fas fa-dice"></i>',
          label: `Roll`,
          callback: () => _rollDiceAsHigh(item, 3, content, mod, additionalTargetInfo)
        }
      }
    }).render(true);
}

async function _rollDiceAsHigh(item, dice, content, mod) {
  let formula = `${dice}d6 + @value`;
  if (mod)
    formula += ` ${mod}`;
  let roll = await new Roll(formula, item.getRollData()).roll({ async: true });

  const chatContent = await renderTemplate(rollTemplate, {
    flavor: content,
    formula: roll.formula,
    tooltip: await roll.getTooltip(),
    total: `${roll.total}`
  })
  roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: item.actor }),
    content: chatContent
  });
}

async function _getAttributeModifier(item) {
  let mod = await item.actor.system.getAttributeModifier(item.system.attribute);
  let additionalTargetInfo = "";
  if (mod > 0)
    additionalTargetInfo = ` + ${mod}`;
  else if (mod < 0)
    additionalTargetInfo = ` ${mod}`;

  return [mod, additionalTargetInfo];
}