const fs = require("fs"),
  path = require("path");

if (!fs.existsSync(path.join(__dirname, "./save"))) {
  fs.mkdirSync(path.join(__dirname, "./save"));
}

module.exports = function tsc(mod) {
  const { command } = mod;
  const skillsData = require("./skillsData.json");
  const jobsName = Object.keys(skillsData);
  const abData = require("./abData.json");

  const allType = {
    0: "Finished",
    1: "Cancel (lockon)",
    2: "Cancel (movement/etc.)",
    3: "Special Interrupt (ex. Lancer: Shield Counter)",
    4: "Chain",
    5: "Retaliate",
    6: "Interrupt",
    9: "Unknown (HB-Recall, knockdown) ?",
    10: "Button Release",
    11: "Button Release + Chain (ex. Mystic: Corruption Ring)",
    13: "Out of Stamina",
    19: "Invalid Target",
    25: "Unknown (ex. Command: Recall)",
    29: "Interrupted by Terrain (ex. entering water)",
    36: "Lockon Cast",
    37: "Interrupted by Loading",
    39: "Dash Finished",
    43: "Interrupted by Cutscene",
    49: "HB-Recall",
    51: "Finished + Button Release (ex. Brawler: Counter)",
    60: "Unknown (dodge / backstab) ?  ",
    699: "Unknown (used for movement skill) ?",
    12394123: "Fast script !",
    0x02: "Bern Force End ?",
  };

  let isEnabled = true,
    debug = false,
    skills_list = {},
    skills_mean = {},
    skillNumber = 0,
    playerName = null,
    startSkill = 0,
    endSkill = 0,
    startBeforeEnd = false,
    skillSpeed,
    skillType,
    myID = null,
    myName = null,
    playerId = null,
    bossId = null,
    playerHooked1 = true,
    playerHooked2 = true,
    myJobNumber = null,
    jobNumber = null,
    skills_listPath,
    skills_meanPath,
    bossCondition = true,
    bossEngaged = false,
    autoSave = true,
    SkillsImpossible = {};
  skillReplaced = false;
  let skillsName = skillsData[jobsName[jobNumber]];

  command.add("cast", (arg1, arg2) => {
    if (arg1 == null) {
      isEnabled = !isEnabled;
      if (!isEnabled) {
        debug = false;
      }
      reset();
      command.message(
        "Skills cast is now " + (isEnabled ? "enabled" : "disabled") + "."
      );
    }
    if (arg1 == "save") {
      let today = new Date();
      skills_listPath =
        "./save/" +
        jobsName[jobNumber] +
        "-" +
        (playerName != null ? playerName : myName) +
        "-" +
        today.getHours() +
        "-" +
        today.getMinutes() +
        "-" +
        today.getSeconds() +
        "-skills_list.json";
      skills_meanPath =
        "./save/" +
        jobsName[jobNumber] +
        "-" +
        (playerName != null ? playerName : myName) +
        "-" +
        today.getHours() +
        "-" +
        today.getMinutes() +
        "-" +
        today.getSeconds() +
        "-skills_mean.json";
      addInfoSkillList();
      saveJsonData(skills_listPath, skills_list);
      calculMean(skills_list);
      saveJsonData(skills_meanPath, skills_mean);
      skills_list = {};
      skills_mean = {};
      skillNumber = 0;
      bossEngaged = false;
      command.message("Skills cast is save and reset");
    }
    if (arg1 == "reset") {
      command.message("Skills cast is reset");
      reset();
    }
    if (arg1 == "boss") {
      bossCondition = !bossCondition;
      command.message(
        "Will start only when boss is engaged : " +
          (bossCondition ? "enabled" : "disabled") +
          "."
      );
      reset();
    }
    if (arg1 == "debug") {
      debug = !debug;
      command.message(
        "Skills cast Debug is now " + (debug ? "enabled" : "disabled") + "."
      );
    }
    if (arg1 == "target") {
      reset();
      if (arg2 != null) {
        command.message("Skills cast target is now " + arg2);
        playerName = arg2;
        playerHooked1 = false;
      } else {
        playerHooked2 = false;
        command.message("Please inspect the player");
      }
    }
  });

  mod.hook("S_LOGIN", 14, (event) => {
    if (!isEnabled) return;
    myJobNumber = (event.templateId - 10101) % 100;
    jobNumber = myJobNumber;
    skillsName = skillsData[jobsName[jobNumber]];
    myID = event.gameId;
    myName = event.name;
    debug ? console.log("your Id :" + event.gameId) : "";
    debug ? console.log("your job :" + jobsName[jobNumber]) : "";
  });

  mod.hook("S_SPAWN_USER", 17, (event) => {
    if (!isEnabled) return;
    if ((event.name = playerName) && playerName != null && !playerHooked1) {
      playerHooked1 = true;
      playerId = event.gameId;
      jobNumber = (event.templateId - 10101) % 100;
      skillsName = skillsData[jobsName[jobNumber]];
      // mod.send("C_REQUEST_USER_PAPERDOLL_INFO", 3, {
      //   zoom: false,
      //   name: playerName,
      // });
      command.message(playerName + " found ! Class : " + jobsName[jobNumber]);
      debug ? console.log("playerId hooked : " + playerHooked1) : "";
      debug ? console.log("id : " + event.playerId) : "";
      debug ? console.log("gameId : " + event.gameId) : "";
    }
  });

  mod.hook(
    "S_USER_PAPERDOLL_INFO",
    // { order: 999999, filter: { fake: null, silenced: null, modified: null } },
    11,
    (event) => {
      if (!isEnabled) return;
      // debug ? saveJsonData("./save/S_USER_PAPERDOLL_INFO.json", event) : "";
      if (!playerHooked2) {
        playerHooked2 = true;
        playerId = event.gameId;
        jobNumber = (event.templateId - 10101) % 100;
        skillsName = skillsData[jobsName[jobNumber]];
        playerName = event.name;
        command.message(playerName + " found ! Class : " + jobsName[jobNumber]);
      }
    }
  );

  mod.hook(
    "S_ACTION_STAGE",
    9,
    { order: -1000000, filter: { fake: true } },
    (event) => {
      if (!isEnabled || playerId != null) return;
      // debug ? saveJsonData("./save/S_ACTION_STAGE.json", event) : "";
      if (myID == event.gameId && (!bossCondition || bossEngaged)) {
        if (skillNumber == 0) {
          command.message("Skills cast start to hook " + myName + ".");
        }
        debug ? console.log("My Skill :" + event.gameId) : "";
        startSkill = Date.now();
        startBeforeEnd = startSkill < endSkill ? true : false;
        skillSpeed = event.speed;
        interSkills(skillNumber);
        debug
          ? console.log("Skill id :" + Math.floor(event.skill.id / 10000))
          : "";
        debug ? console.log("Speed skill :" + event.speed) : "";
      }
    }
  );

  mod.hook(
    "S_ACTION_END",
    5,
    { order: -1000000, filter: { fake: true } },
    (event) => {
      if (!isEnabled || playerId != null) return;
      if (myID == event.gameId && (!bossCondition || bossEngaged)) {
        endSkill = Date.now();
        debug ? console.log("Event Type :" + event.type) : "";
        allType[event.type]
          ? (skillType = allType[event.type])
          : (skillType = event.type);
        addSkill(event.skill.id, skillSpeed);
      }
    }
  );

  mod.hook(
    "S_ACTION_STAGE",
    9,
    { order: 999999, filter: { fake: null, silenced: null, modified: null } },
    (event) => {
      if (!isEnabled) return;
      if (playerId == event.gameId && (!bossCondition || bossEngaged)) {
        if (skillNumber == 0) {
          command.message("Skills cast start to hook " + playerName + ".");
        }
        debug ? console.log("My Skill :" + event.gameId) : "";
        startSkill = Date.now();
        skillSpeed = event.speed;
        debug
          ? console.log("Skill id :" + Math.floor(event.skill.id / 10000))
          : "";
        debug ? console.log("Speed skill :" + event.speed) : "";
      }
    }
  );

  mod.hook(
    "S_ACTION_END",
    5,
    { order: 999999, filter: { fake: null, silenced: null, modified: null } },
    (event) => {
      if (!isEnabled) return;
      if (playerId == event.gameId && (!bossCondition || bossEngaged)) {
        endSkill = Date.now();
        debug ? console.log("Event Type :" + event.type) : "";
        allType[event.type]
          ? (skillType = allType[event.type])
          : (skillType = event.type);
        addSkill(event.skill.id, skillSpeed);
      }
    }
  );

  mod.hook("S_BOSS_GAGE_INFO", 3, (event) => {
    if (!isEnabled) return;
    if (bossCondition && !bossEngaged) {
      if (bossId != event.gameId) {
        reset();
      }
      if (event.maxHp != event.curHp) {
        bossEngaged = true;
        command.message("Boss Engaged !");
        bossId = event.gameId;
      } else {
        bossEngaged = false;
      }
    }
  });

  mod.hook("S_DESPAWN_NPC", 3, (event) => {
    if (!isEnabled) return;
    if (bossEngaged) {
      if (event.gameId == bossId) {
        command.message(
          "Boss is dead or reset" + (autoSave ? " - Auto-Save" : "") + "."
        );
        if (autoSave) {
          addInfoSkillList();
          saveJsonData(skills_listPath, skills_list);
          calculMean(skills_list);
          saveJsonData(skills_meanPath, skills_mean);
          skills_list = {};
          skills_mean = {};
          skillNumber = 0;
          bossEngaged = false;
        }
      }
    }
  });

  mod.hook("S_ABNORMALITY_BEGIN", 4, (event) => {
    if (!isEnabled) return;
    if (event.target == playerId || event.source == playerId) {
      if (abData.includes(event.id) && abData[event.id].job == jobsName) {
        if (abData[event.id].SkillsImpossible == "begin") {
          SkillsImpossible[event.id] = {
            buff: abData[event.id].name,
            skillsId: abData[event.id].skillsId,
          };
        }
        if (abData[event.id].SkillsImpossible == "end") {
          delete SkillsImpossible[event.id];
        }
      }
    }
  });

  mod.hook("S_ABNORMALITY_END", 1, (event) => {
    if (!isEnabled) return;
    if (event.target == playerId) {
      if (abData.includes(event.id) && abData[event.id].job == jobsName) {
        if (abData[event.id].SkillsImpossible == "end") {
          SkillsImpossible[event.id] = {
            buff: abData[event.id].name,
            skillsId: abData[event.id].skillsId,
          };
        }
        if (abData[event.id].SkillsImpossible == "begin") {
          delete SkillsImpossible[event.id];
        }
      }
    }
  });

  // mod.hook("_", 0, (event) => {

  // });

  function addSkill(skillId, speed) {
    for (const abId in SkillsImpossible) {
      if (SkillsImpossible[abId].includes(skillId)) {
        skillReplaced = true;
      }
    }
    skills_list[skillNumber] = {
      skillName:
        skillsName[Math.floor(skillId / 10000)] +
        "-" +
        (skillId - Math.floor(skillId / 10000) * 10000),
      Skill_Id: skillId,
      castTime: skillNumber == 0 ? 0 : endSkill - startSkill,
      currentSpeed: Math.round(speed * 100),
      animCalculed: Math.round(
        (skillNumber == 0 ? 0 : endSkill - startSkill) * speed
      ),
      startBeforeEnd: startBeforeEnd,
      // "skillReplaced ?": skillReplaced ? "Yes" : "No",
      action: skillType,
    };
    debug ? console.log("castTime :" + skills_list[skillNumber].castTime) : "";
    debug
      ? console.log("currentSpeed :" + skills_list[skillNumber].currentSpeed)
      : "";
    skillReplaced = false;
    skillNumber++;
  }

  function interSkills(skillNumber) {
    if (skillNumber < 1) return;
    let interskillNumber = skillNumber - 1 + "-" + skillNumber;
    skills_list[interskillNumber] = {
      PreviousSkill: skills_list[skillNumber - 1].skillName,
      DelayBetween: startSkill - endSkill,
    };
  }

  function calculMean(skills_list) {
    for (const id in skillsName) {
      skills_mean[skillsName[id]] = {
        castTimeMini: 99999,
        allAnimCalculedTime: 0,
        NumberOfCast: 0,
        castTimeMean: 0,
      };
    }
    for (const skillUsed in skills_list) {
      for (const id in skillsName) {
        if (skills_list[skillUsed].skillName) {
          if (skills_list[skillUsed].skillName.includes(skillsName[id])) {
            skills_mean[skills_list[skillUsed].skillName] = {
              castTimeMini:
                skills_mean[skillsName[id]].castTimeMini <
                skills_list[skillUsed].castTime
                  ? skills_mean[skillsName[id]].castTimeMini
                  : skills_list[skillUsed].castTime,
              allAnimCalculedTime:
                skills_mean[skillsName[id]].allAnimCalculedTime +
                skills_list[skillUsed].animCalculed,
              NumberOfCast: skills_mean[skillsName[id]].NumberOfCast + 1,
            };
          }
        }
        if (skills_list[skillUsed].PreviousSkill) {
          skills_mean[skills_list[skillUsed].PreviousSkill + "after"] = {
            allDelayCalculed:
              skills_mean[skillsName[id] + "after"].allDelayCalculed +
              skills_list[skillUsed].DelayBetween,
          };
        }
      }
    }
    for (const name in skills_mean) {
      if (skills_mean[name].NumberOfCast != 0) {
        skills_mean[name] = {
          castTimeMini: Math.floor(skills_mean[name].castTimeMini),
          AnimationMean: Math.floor(
            skills_mean[name].allAnimCalculedTime /
              skills_mean[name].NumberOfCast
          ),
        };
      } else {
        delete skills_mean[name];
      }
    }
  }

  function addInfoSkillList() {
    // debug ? console.log("reform :" + skills_list) : "";
    skills_list["Player info"] = {
      Name: playerName != null ? playerName : myName,
      job: jobsName[jobNumber],
    };
  }

  function saveJsonData(pathToFile, data) {
    fs.writeFileSync(
      path.join(__dirname, pathToFile),
      JSON.stringify(data, null, "    ")
    );
  }

  function reset() {
    skills_list = {};
    skills_mean = {};
    jobNumber = myJobNumber;
    skillsName = skillsData[jobsName[jobNumber]];
    skillNumber = 0;
    playerName = myName;
    startSkill = 0;
    endSkill = 0;
    playerId = null;
    bossId = null;
    playerHooked1 = true;
    playerHooked2 = true;
    bossEngaged = false;
  }
};
