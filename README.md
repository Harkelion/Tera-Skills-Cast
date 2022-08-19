# Tera Skills List

Create a list of the target's rotation and information about each skill (as current attack Speed and time between each cast)

#### Command : /8 (or ! in any chat except toolbox /8)

```txt
/8 list                      : enable/disable (reset when disable)
/8 list reset                : reset all skills register
/8 list target               : will target the next player you inspect to make his skills list
                               (target by default is yourself)
/8 list target "player name" : will target "player name" (will auto-inspect when possible)
/8 list save                 : create two .json, one of the rotation the other one of the average
                               animation skills (reset after save)
```

note : for yourself only work when you are in combat / for other's player work anytime

known issues :

- other's player skill hook don't work yet [working on it].
- i don't know yet how to hook updated attack speed of other's player (fix?)

Contact Discord : Harkelion#8888
