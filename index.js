const fs = require("fs"),
  path = require("path");

if (!fs.existsSync(path.join(__dirname, "./data"))) {
  fs.mkdirSync(path.join(__dirname, "./data"));
}

module.exports = function tsl(mod) {
  const { command } = mod;
  const { player } = mod.require.library;
  const skillsName = {
    1: "Slash ",
    2: "Overhead Slash ",
    3: "Glaive Strike",
    4: "Charge ",
    5: "Maelstrom ",
    6: "Leaping Slash",
    7: "Spinning Death",
    8: "Titansbane",
    9: "Ground Bash",
    10: "Dream Slash",
    11: "Shining Crescent",
    12: "Ragnarok",
    13: "Bloodflower",
    14: "Evasion",
    15: "Windslash ",
    16: "Runeburst",
    17: "Balder's Tears",
    18: "Retaliate",
    19: "Reclamation",
    20: "Backstab",
    21: "Dark Herald",
    23: "Gungnir's Bite",
    24: "Twilight Waltz",
    25: "Godsfall",
  };

  let skill_list = {};
  let isEnabled = false;
  let aspd = player["aspd"];
  let aspdDivider = player["job"] >= 8 ? 100 : aspd;
  let skillNumber = 0;
  let settingsPath = `./data/${player["name"]}.json`;
  let startTimeNewSkill = 0;
  let startTimePreviousSkill = 0;

  command.add("tsl", (arg) => {
    if (arg == null) {
      isEnabled = !isEnabled;
      command.message(
        " Tera Skill List is now " + (isEnabled ? "enabled" : "disabled") + "."
      );
    }
    if (arg == "save") {
      saveJsonData(settingsPath, skill_list);
    }
    if (arg == "reset") {
      skillNumber = 0;
      skill_list = {};
    }
  });

  mod.hook("S_PLAYER_STAT_UPDATE", 14, (event) => {
    aspd = event.attackSpeed + event.attackSpeedBonus / aspdDivider;
  });

  mod.hook("S_ACTION_STAGE", 9, (event) => {
    if (!isEnabled) return;
    startTimeNewSkill = Date.now();
    addSkill(Math.floor(event.skill.id / 10000));
  });

  // mod.hook('C_CANCEL_SKILL', 3, event => {

  // });

  function addSkill(skillId) {
    skill_list[skillNumber] = {
      skillName: skillsName.skillId,
      startTime:
        skillNumber == 0 ? 0 : startTimeNewSkill - startTimePreviousSkill,
      currentSpeed: aspd,
    };
    startTimePreviousSkill = Date.now();
    skillNumber++;
  }

  function saveJsonData(pathToFile, data) {
    fs.writeFileSync(
      path.join(__dirname, pathToFile),
      JSON.stringify(data, null, "    ")
    );
  }
};
