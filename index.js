const fs = require("fs"),
  path = require("path");

if (!fs.existsSync(path.join(__dirname, "./data"))) {
  fs.mkdirSync(path.join(__dirname, "./data"));
}

module.exports = function tsl(mod) {
  const { command } = mod;
  const { player } = mod.require.library;
  const skillsData = require("./skillsData.json");
  const jobsName = {
    0: "Warrior",
    1: "Lancer",
    2: "Slayer",
    3: "Berzerk",
    4: "Sorcerer",
    5: "Archer",
    6: "Priest",
    7: "Mystic",
    8: "Reaper",
    9: "Gunner",
    10: "Brawler",
    11: "Ninja",
    12: "Valkyrie",
  };

  let isEnabled = true,
    skills_list = {},
    skills_mean = {},
    aspd = player["aspd"],
    aspdDivider = aspd,
    skillNumber = 0,
    playerName = null,
    startTimeNewSkill = 0,
    startTimePreviousSkill = 0,
    debug = false,
    previousSkill,
    myID = null,
    myName = null,
    playerId = null,
    animDuration,
    playerIdHooked,
    skills_listPath = `./data/skills_list-${jobsName[jobNumber]}-${
      playerName != null ? playerName : myName
    }.json`,
    skills_meanPath = `./data/skills_mean-${jobsName[jobNumber]}-${
      playerName != null ? playerName : myName
    }.json`,
    jobNumber;

  const skillsName = skillsData[jobsName[jobNumber]];

  command.add("list", (arg1, arg2) => {
    if (arg1 == null) {
      isEnabled = !isEnabled;
      if (!isEnabled) {
        debug = false;
      }
      reset();
      command.message(
        "Skills List is now " + (isEnabled ? "enabled" : "disabled") + "."
      );
    }
    if (arg1 == "save") {
      reformateSkillList();
      saveJsonData(skills_listPath, skills_list);
      calculMean(skills_list);
      saveJsonData(skills_meanPath, skills_mean);
      reset();
    }
    if (arg1 == "reset") {
      command.message("Skills List is reset");
      reset();
    }
    if (arg1 == "debug") {
      debug = !debug;
      command.message(
        "Skills List Debug is now " + (debug ? "enabled" : "disabled") + "."
      );
    }
    if (arg1 == "name") {
      if (arg2 != null) {
        command.message("Skills List target is now " + arg2);
        playerName = arg2;
        playerIdHooked = false;
      } else {
        command.message("Please enter a name");
      }
    }
  });

  mod.hook("S_LOGIN", 14, (event) => {
    if (!isEnabled) return;
    jobNumber = (event.templateId - 10101) % 100;
    aspdDivider = jobNumber >= 8 ? 100 : aspd;
    myID = event.gameId;
    myName = event.gameId;
    debug ? console.log("playerId :" + event.gameId) : "";
  });

  mod.hook("S_PLAYER_STAT_UPDATE", 14, (event) => {
    if (!isEnabled) return;
    aspd = (event.attackSpeed + event.attackSpeedBonus) / aspdDivider;
    debug ? console.log("aspd :" + aspd) : "";
    debug ? console.log("aspdDivider :" + aspdDivider) : "";
  });

  mod.hook(
    "S_ACTION_STAGE",
    9,
    { order: -1000000, filter: { fake: true } },
    (event) => {
      if (!isEnabled) return;
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
  );

  mod.hook(
    "S_ACTION_STAGE",
    9,
    { order: 999999, filter: { fake: null, silenced: null, modified: null } },
    (event) => {
      debug ? console.log("player used a Skill :" + event.gameId) : "";
      if (!isEnabled) return;
      if (playerId == event.gameId) {
        debug ? console.log("Target use Skill :" + event.gameId) : "";
        startTimeNewSkill = Date.now();
        animDuration = event.animSeq[0];
        debug
          ? console.log("Skill id :" + Math.floor(event.skill.id / 10000))
          : "";
        addSkill(event.skill.id);
      }
    }
  );

  mod.hook("S_SPAWN_USER", 17, (event) => {
    if (!isEnabled) return;
    if ((event.name = playerName) && playerName != null && !playerIdHooked) {
      playerIdHooked = true;
      playerId = event.gameId;
      jobNumber = (event.templateId - 10101) % 100;
      command.message(playerName + " found ! Class : " + jobsName[jobNumber]);
      debug ? console.log("playerId hooked : " + playerIdHooked) : "";
      debug ? console.log("id : " + event.playerId) : "";
      debug ? console.log("gameId : " + event.gameId) : "";
    }
  });

  // mod.hook('C_CANCEL_SKILL', 3, event => {

  // });

  function reset() {
    skillNumber = 0;
    skills_list = {};
    playerId = null;
    playerName = null;
  }

  function addSkill(skillId) {
    skills_list[skillNumber] = {
      skillName: `${skillsName[Math.floor(skillId / 10000)]}-${skillId % 100}`,
      SkillId: skillId,
      castTime:
        skillNumber == 0 ? 0 : startTimeNewSkill - startTimePreviousSkill,
      currentSpeed: aspd * 100,
      animDuration: animDuration,
      animCalculed: null,
    };
    debug ? console.log("castTime :" + skills_list[skillNumber].castTime) : "";
    debug
      ? console.log("currentSpeed :" + skills_list[skillNumber].currentSpeed)
      : "";
    startTimePreviousSkill = startTimeNewSkill;
    skillNumber++;
  }

  for (const id in skillsName) {
    skills_mean[skillsName[id]] = {
      castTimeMini: 99999,
      allAnimCalculedTime: 0,
      NumberOfCast: 0,
      castTimeMean: 0,
    };
  }

  function calculMean(skills_list) {
    for (const skillUsed in skills_list) {
      for (const id in skillsName) {
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
    }
    for (const name in skills_mean) {
      if (skills_mean[name].NumberOfCast != 0) {
        skills_mean[name] = {
          skillName: skills_mean[name].skillName,
          // 2.08 is max att speed class
          castTimeMini: Math.floor(skills_mean[name].castTimeMini * 2.08),
          animationMean: Math.floor(
            skills_mean[name].allAnimCalculedTime /
              skills_mean[name].NumberOfCast /
              100
          ),
        };
      } else {
        delete skills_mean[name];
      }
    }
    // skills_list = skills_list + skills_mean
  }

  function reformateSkillList() {
    for (const element in skills_list) {
      if (skills_list[JSON.stringify(parseInt(element) + 1)]) {
        skills_list[element].castTime =
          skills_list[JSON.stringify(parseInt(element) + 1)].castTime;
      } else {
        skills_list[element].castTime = 0;
      }
      skills_list[element].animCalculed = Math.floor(
        (skills_list[element].castTime * skills_list[element].currentSpeed) /
          aspdDivider
      );
    }
    debug ? console.log("reform :" + skills_list) : "";
    skills_list["Player info"] = {
      Name: playerName != null ? playerName : myName,
      job: jobsName[jobNumber],
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
