# Tera Skills Cast

Create a list of the target's rotation and information about each skill (as current attack Speed and time between each cast)

#### Command : /8 (or ! in any chat except toolbox /8)

```txt
/8 cast                      : enable/disable (reset when disable)
/8 cast reset                : reset all skills register
/8 cast target               : will target the next player you inspect to make his skills list
                               (target by default is yourself)
/8 cast target "player name" : will target "player name" (will auto-inspect when possible)
/8 cast save                 : create two .json, one of the rotation the other one of the average
                               animation skills (reset after save)
```

note : for yourself only work when you are in combat / for other's player work anytime

#### Objective of the mod :

Be able to detect player with animation cancel (or not) to know with who you can compare HPMs. 

#### known issues :

- other's player skill hook don't work yet [working on it].
- i don't know yet how to hook updated attack speed of other's player (fix?)

Contact Discord : Harkelion#8888
