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

  let isEnabled = true;
  let skill_list = {};
  let aspd = player["aspd"];
  let aspdDivider = aspd;
  let skillNumber = 0;
  let playerName = null;
  let settingsPath = `./data/valkyrie.json`;
  let startTimeNewSkill = 0;
  let startTimePreviousSkill = 0;
  let debug = false;
  let previousSkill;
  let myID = null;
  let myName = null;
  let playerId = null;
  let animDuration;
  let playerIdHooked;

  command.add("tsl", (arg1, arg2) => {
    if (arg1 == null) {
      isEnabled = !isEnabled;
      if (!isEnabled) {
        debug = false;
      }
      reset();
      command.message(
        "Tera Skill List is now " + (isEnabled ? "enabled" : "disabled") + "."
      );
    }
    if (arg1 == "save") {
      reformateSkillList();
      saveJsonData(settingsPath, skill_list);
      reset();
    }
    if (arg1 == "reset") {
      command.message("Tera Skill List is reset");
      reset();
    }
    if (arg1 == "debug") {
      debug = !debug;
      command.message(
        "Tera Skill List Debug is now " + (debug ? "enabled" : "disabled") + "."
      );
    }
    if (arg1 == "name") {
      if (arg2 != null) {
        command.message("Tera Skill List target " + arg2);
        playerName = arg2;
        playerIdHooked = false;
      } else {
        command.message("Please enter a name");
      }
    }
  });

  mod.hook("S_LOGIN", 14, (event) => {
    aspdDivider = (event.templateId - 10101) % 100 >= 8 ? 100 : aspd;
    myID = event.gameId;
    myName = event.gameId;
    debug ? console.log("playerId :" + event.gameId) : "";
  });

  mod.hook("S_PLAYER_STAT_UPDATE", 14, (event) => {
    aspd = (event.attackSpeed + event.attackSpeedBonus) / aspdDivider;
    debug ? console.log("aspd :" + aspd) : "";
    debug ? console.log("aspdDivider :" + aspdDivider) : "";
  });

  mod.hook(
    "S_ACTION_STAGE",
    9,
    { order: -1000000, filter: { fake: true } },
    (event) => {
      if (isEnabled) {
        if (myID == event.gameId && player.inCombat) {
          debug ? console.log("My Skill :" + event.gameId) : "";
          // if (
          //   previousSkill == event.skill.id ||
          //   !Object.keys(skillsName).includes(
          //     JSON.stringify(Math.floor(event.skill.id / 10000))
          //   )
          // )
          //   return;
          startTimeNewSkill = Date.now();
          animDuration = event.animSeq[0];
          debug
            ? console.log("Skill id :" + Math.floor(event.skill.id / 10000))
            : "";
          addSkill(Math.floor(event.skill.id / 10000));
          // previousSkill = event.skill.id;
        }
      }
    }
  );

  mod.hook(
    "S_ACTION_STAGE",
    9,
    { order: -999999, filter: { fake: true } },
    (event) => {
      debug ? console.log("player used a Skill :" + event.gameId) : "";
      if (isEnabled) {
        if (playerId == event.gameId) {
          debug ? console.log("Target use Skill :" + event.gameId) : "";
          startTimeNewSkill = Date.now();
          animDuration = event.animSeq[0];
          debug
            ? console.log("Skill id :" + Math.floor(event.skill.id / 10000))
            : "";
          addSkill(Math.floor(event.skill.id / 10000));
        }
      }
    }
  );

  mod.hook("S_SPAWN_USER", 17, (event) => {
    if (
      (event.name = playerName) &&
      isEnabled &&
      playerName != null &&
      !playerIdHooked
    ) {
      playerIdHooked = true;
      playerId = event.gameId;
      debug ? console.log("playerId hooked : " + playerIdHooked) : "";
      debug ? console.log("id : " + event.playerId) : "";
      debug ? console.log("gameId : " + event.gameId) : "";
    }
  });

  // mod.hook('C_CANCEL_SKILL', 3, event => {

  // });

  function reset() {
    skillNumber = 0;
    skill_list = {};
    playerId = null;
    playerName = null;
  }

  function addSkill(skillId) {
    skill_list[skillNumber] = {
      skillName: skillsName[skillId],
      skillId: skillId,
      castTime:
        skillNumber == 0 ? 0 : startTimeNewSkill - startTimePreviousSkill,
      currentSpeed: aspd * 100,
      animDuration: animDuration,
      animCalculed: null,
    };
    debug ? console.log("castTime :" + skill_list[skillNumber].castTime) : "";
    debug
      ? console.log("currentSpeed :" + skill_list[skillNumber].currentSpeed)
      : "";
    startTimePreviousSkill = startTimeNewSkill;
    skillNumber++;
  }

  function reformateSkillList() {
    for (const element in skill_list) {
      if (skill_list[JSON.stringify(parseInt(element) + 1)]) {
        skill_list[element].castTime =
          skill_list[JSON.stringify(parseInt(element) + 1)].castTime;
      } else {
        skill_list[element].castTime = 0;
      }
      skill_list[element].animCalculed =
        skill_list[element].castTime * skill_list[element].currentSpeed;
    }
    debug ? console.log("reform :" + skill_list) : "";
    skill_list["Player info"] = {
      Name: playerName != null ? playerName : myName,
      Job: "Valkyrie",
      Id: playerId != null ? playerId : myID,
    };
  }

  function saveJsonData(pathToFile, data) {
    fs.writeFileSync(
      path.join(__dirname, pathToFile),
      JSON.stringify(data, null, "    ")
    );
  }
};
