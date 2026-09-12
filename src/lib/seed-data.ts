/**
 * Curated six-pack knowledge base.
 * Used by the seed script AND by signup (starter plans) — pure data, no db imports.
 */

export type BaseExercise = {
  name: string;
  targetArea: string;
  difficulty: string;
  equipment: string;
  description: string;
  steps: string[];
  tips: string[];
  sets: number;
  reps: string;
  durationSeconds: number | null;
  restSeconds: number;
  kcalPerMin: number;
  accent: string;
  icon: string;
};

export const BASE_EXERCISES: BaseExercise[] = [
  {
    name: "Crunch",
    targetArea: "upper",
    difficulty: "beginner",
    equipment: "none",
    description:
      "The classic ab builder. Short-range spinal flexion that zeroes in on the upper rectus abdominis — the top bricks of your six-pack.",
    steps: [
      "Lie on your back, knees bent, feet flat on the floor hip-width apart.",
      "Place fingertips lightly behind your ears — never pull on your neck.",
      "Exhale and curl your ribs toward your pelvis, lifting shoulder blades 10 cm off the floor.",
      "Squeeze your abs hard at the top for a full second.",
      "Lower back down with control over 2 seconds. Don't let your shoulders rest.",
    ],
    tips: [
      "Think 'ribcage to pelvis' — it is a curl, not a sit-up.",
      "Exhale on the way up to get 20% deeper contraction.",
      "Chin stays off your chest; keep a fist's width of space.",
    ],
    sets: 3,
    reps: "15–20",
    durationSeconds: null,
    restSeconds: 40,
    kcalPerMin: 6,
    accent: "volt",
    icon: "flame",
  },
  {
    name: "Forearm Plank",
    targetArea: "full",
    difficulty: "beginner",
    equipment: "none",
    description:
      "The anti-extension king. Builds deep core stiffness that flattens your stomach and protects your spine under every other lift.",
    steps: [
      "Set forearms on the floor, elbows directly under shoulders, fists together.",
      "Step feet back so your body forms one straight line from head to heels.",
      "Brace your abs like you're about to take a punch; squeeze glutes and quads.",
      "Pull your elbows toward your toes without moving them to create tension.",
      "Breathe steadily behind the brace for the full hold.",
    ],
    tips: [
      "Never let hips sag or pike — a straight line only.",
      "Shorter, harder holds beat long, soft ones.",
      "Film yourself from the side to check your line.",
    ],
    sets: 3,
    reps: "45 sec",
    durationSeconds: 45,
    restSeconds: 45,
    kcalPerMin: 5,
    accent: "ghost",
    icon: "shield",
  },
  {
    name: "Bicycle Crunch",
    targetArea: "obliques",
    difficulty: "beginner",
    equipment: "none",
    description:
      "Ranked #1 for combined rectus + oblique activation in ACE lab studies. Rotation plus flexion carves the whole midsection at once.",
    steps: [
      "Lie back, hands behind ears, legs in tabletop (hips and knees at 90°).",
      "Lift shoulder blades off the floor and keep them off.",
      "Rotate your right elbow toward your left knee while extending the right leg straight.",
      "Switch sides in one fluid pedaling motion.",
      "Rotate through your ribs, not just your elbows.",
    ],
    tips: [
      "Slow is strong — 2 seconds per side beats flailing.",
      "Fully extend the straight leg, hovering 15 cm off the floor.",
      "Feel the twist in your side abs, not your neck.",
    ],
    sets: 3,
    reps: "20 total",
    durationSeconds: null,
    restSeconds: 40,
    kcalPerMin: 8,
    accent: "frost",
    icon: "repeat",
  },
  {
    name: "Reverse Crunch",
    targetArea: "lower",
    difficulty: "beginner",
    equipment: "none",
    description:
      "Curls the pelvis instead of the ribcage — the most reliable way to load the stubborn lower abs at home.",
    steps: [
      "Lie back, arms by your sides pressing into the floor for stability.",
      "Bring knees over hips, shins parallel to the floor.",
      "Curl your tailbone off the floor, pulling knees toward your chest.",
      "Pause when your lower back just leaves the mat.",
      "Lower slowly until hips touch — no swinging into the next rep.",
    ],
    tips: [
      "The lift is small — 5 to 10 cm. Control is everything.",
      "Exhale hard as the pelvis rolls up.",
      "Avoid using momentum; if you rock, slow down.",
    ],
    sets: 3,
    reps: "12–15",
    durationSeconds: null,
    restSeconds: 40,
    kcalPerMin: 6,
    accent: "ember",
    icon: "arrow-up",
  },
  {
    name: "Mountain Climbers",
    targetArea: "full",
    difficulty: "beginner",
    equipment: "none",
    description:
      "A plank in motion. Torches calories while hammering the deep core — the fat-burning finisher of every six-pack plan.",
    steps: [
      "Start in a high plank, hands under shoulders, body in one line.",
      "Drive one knee toward your chest without lifting your hips.",
      "Switch legs explosively, like sprinting horizontally.",
      "Keep shoulders stacked over wrists the whole time.",
      "Ramp the pace while keeping the brace.",
    ],
    tips: [
      "Hips level — no bouncing up and down.",
      "Land softly on the balls of your feet.",
      "Add a cross-body knee drive for more obliques.",
    ],
    sets: 3,
    reps: "40 sec",
    durationSeconds: 40,
    restSeconds: 40,
    kcalPerMin: 12,
    accent: "ember",
    icon: "zap",
  },
  {
    name: "Russian Twist",
    targetArea: "obliques",
    difficulty: "beginner",
    equipment: "none",
    description:
      "Rotational carve for the obliques and the V-line frame. Add a weight plate or water bottle when bodyweight gets easy.",
    steps: [
      "Sit with knees bent, heels lightly planted, torso leaned back to 45°.",
      "Lift your chest and brace — spine long, not rounded.",
      "Rotate your ribs to the right, hands following to tap the floor.",
      "Rotate all the way left with control. That's one rep per side.",
      "Keep hips perfectly still; only the torso moves.",
    ],
    tips: [
      "Eyes follow your hands to drive a bigger rotation.",
      "Lift your feet for +30% difficulty.",
      "Move slow — 2 seconds per side.",
    ],
    sets: 3,
    reps: "20 twists",
    durationSeconds: null,
    restSeconds: 40,
    kcalPerMin: 7,
    accent: "frost",
    icon: "repeat",
  },
  {
    name: "Dead Bug",
    targetArea: "full",
    difficulty: "beginner",
    equipment: "none",
    description:
      "Physical-therapy-grade core control. Teaches your abs to hold your spine still while limbs move — the hidden base of a tight waist.",
    steps: [
      "Lie back, arms straight up over shoulders, legs in tabletop.",
      "Crush your lower back into the floor — no gap, ever.",
      "Slowly extend right arm overhead and left leg straight, hovering.",
      "Return to start and switch sides.",
      "Move only as far as you can keep your back glued down.",
    ],
    tips: [
      "Exhale fully before each extension.",
      "Prize: zero lower-back movement. Film it.",
      "Slower reps = dramatically harder.",
    ],
    sets: 3,
    reps: "10 / side",
    durationSeconds: null,
    restSeconds: 30,
    kcalPerMin: 5,
    accent: "ghost",
    icon: "shield",
  },
  {
    name: "Flutter Kicks",
    targetArea: "lower",
    difficulty: "beginner",
    equipment: "none",
    description:
      "Military-grade lower ab burner. Constant tension on the lower rectus with zero equipment — perfect for home sessions.",
    steps: [
      "Lie back, hands under your glutes, palms down for support.",
      "Lift both legs to 30° and press your lower back into the floor.",
      "Kick up and down in small, fast scissors — 20 cm range.",
      "Keep legs straight but knees soft.",
      "Breathe in short, sharp sips while braced.",
    ],
    tips: [
      "Lower the legs = harder. Raise them if your back arches.",
      "Chin slightly tucked, gaze at your toes.",
      "Quality over speed when your form breaks.",
    ],
    sets: 3,
    reps: "30 sec",
    durationSeconds: 30,
    restSeconds: 40,
    kcalPerMin: 7,
    accent: "ember",
    icon: "zap",
  },
  {
    name: "Side Plank",
    targetArea: "obliques",
    difficulty: "beginner",
    equipment: "none",
    description:
      "Direct hit on the obliques and quadratus lumborum — the muscles that cinch your waist and carve the side V.",
    steps: [
      "Lie on your side, forearm under shoulder, legs stacked.",
      "Lift hips until your body is one straight line.",
      "Reach your top arm to the ceiling and open your chest.",
      "Drive the bottom forearm down and actively lift the bottom hip.",
      "Hold, breathe, then switch sides.",
    ],
    tips: [
      "Hips stacked and slightly forward — not rolled back.",
      "Drop to knees to scale down.",
      "Imagine a string pulling your top hip to the ceiling.",
    ],
    sets: 3,
    reps: "30 sec / side",
    durationSeconds: 30,
    restSeconds: 30,
    kcalPerMin: 5,
    accent: "frost",
    icon: "shield",
  },
  {
    name: "Hanging Knee Raise",
    targetArea: "lower",
    difficulty: "intermediate",
    equipment: "bar",
    description:
      "The gateway hanging move. Loading the lower abs against gravity from a dead hang — a gym staple for real lower-ab growth.",
    steps: [
      "Hang from a pull-up bar, grip just outside shoulders.",
      "Kill all swing — engage lats by pulling shoulders down.",
      "Curl knees toward your chest, rolling the pelvis up at the top.",
      "Pause when thighs pass parallel to the floor.",
      "Lower under full control for 3 seconds. No swinging into rep two.",
    ],
    tips: [
      "Posterior pelvic tilt at the top is where the magic is.",
      "Use straps if grip fails before your abs do.",
      "Exhale fully on the way up.",
    ],
    sets: 3,
    reps: "10–12",
    durationSeconds: null,
    restSeconds: 60,
    kcalPerMin: 8,
    accent: "ember",
    icon: "arrow-up",
  },
  {
    name: "Cable Crunch",
    targetArea: "upper",
    difficulty: "intermediate",
    equipment: "cable",
    description:
      "The only crunch you can progressively overload forever. Kneeling rope crunches let you add weight week after week — like any real lift.",
    steps: [
      "Attach a rope to a high pulley. Kneel facing the stack, rope by your ears.",
      "Lock your hips — they stay stacked over your knees the entire set.",
      "Crunch down by curling your ribs to your pelvis, elbows to thighs.",
      "Squeeze hard at the bottom for a second.",
      "Rise slowly without letting the weight yank you up.",
    ],
    tips: [
      "Hips don't sit back — that's cheating with your hip flexors.",
      "Think of your spine as a curling rope, not a hinge.",
      "Log the weight. Progressive overload builds visible abs.",
    ],
    sets: 3,
    reps: "12–15",
    durationSeconds: null,
    restSeconds: 60,
    kcalPerMin: 6,
    accent: "volt",
    icon: "dumbbell",
  },
  {
    name: "V-Up",
    targetArea: "full",
    difficulty: "intermediate",
    equipment: "none",
    description:
      "Upper and lower abs contract simultaneously — a full rectus abdominis blast that demands coordination and real strength.",
    steps: [
      "Lie flat, arms extended overhead, legs straight.",
      "In one motion, lift shoulders and legs to meet over your hips.",
      "Reach fingertips to toes at the top of the 'V'.",
      "Lower everything down with control — no flopping.",
      "Keep lower back pressed toward the floor throughout.",
    ],
    tips: [
      "Exhale sharply as you fold.",
      "Bend knees slightly to scale it down.",
      "Touch is optional — height and control matter more.",
    ],
    sets: 3,
    reps: "12–15",
    durationSeconds: null,
    restSeconds: 45,
    kcalPerMin: 8,
    accent: "ghost",
    icon: "flame",
  },
  {
    name: "Hollow Body Hold",
    targetArea: "full",
    difficulty: "intermediate",
    equipment: "none",
    description:
      "The gymnast's secret. A maximal anti-extension hold that builds the dense, flat midsection athletes call 'an armor plate'.",
    steps: [
      "Lie back, press lower back into the floor, arms overhead.",
      "Lift shoulders and legs so only your mid-back touches the floor.",
      "Point toes, squeeze glutes, reach fingertips long.",
      "Breathe shallow and fast behind an iron brace.",
      "Scale by bending knees or bringing arms to your sides.",
    ],
    tips: [
      "If your lower back lifts, shorten the lever immediately.",
      "10 perfect seconds beats 30 broken ones.",
      "Shake is normal — breathe through it.",
    ],
    sets: 3,
    reps: "25 sec",
    durationSeconds: 25,
    restSeconds: 45,
    kcalPerMin: 6,
    accent: "ghost",
    icon: "shield",
  },
  {
    name: "Weighted Sit-Up",
    targetArea: "upper",
    difficulty: "intermediate",
    equipment: "weights",
    description:
      "Full-range spinal flexion with a plate on your chest. Overload + stretch position = serious ab hypertrophy.",
    steps: [
      "Hook feet under a bench or dumbbells, knees bent 90°.",
      "Hug a weight plate to your chest, elbows tucked.",
      "Curl up vertebra by vertebra until torso is vertical.",
      "Reverse the roll slowly — 3 seconds down.",
      "Keep the plate pinned; never swing it for momentum.",
    ],
    tips: [
      "Start with 5 kg. Abs respond to load like any muscle.",
      "Anchor your feet but don't yank with your hip flexors.",
      "Pair with cable crunches in the same session for a brutal pump.",
    ],
    sets: 3,
    reps: "10–12",
    durationSeconds: null,
    restSeconds: 60,
    kcalPerMin: 6,
    accent: "volt",
    icon: "dumbbell",
  },
  {
    name: "Burpee",
    targetArea: "full",
    difficulty: "intermediate",
    equipment: "none",
    description:
      "The fat-loss weapon. A full-body metabolic bomb — because revealed abs are built by your heart rate as much as your crunches.",
    steps: [
      "From standing, squat down and plant hands under shoulders.",
      "Jump feet back to a strong high plank — core braced.",
      "Optional: one push-up with chest to floor.",
      "Jump feet back outside your hands.",
      "Explode up, clap overhead, land soft and repeat.",
    ],
    tips: [
      "Plank position must stay rigid — no hip sag.",
      "Breathe in rhythm: one breath per rep.",
      "Scale by stepping back instead of jumping.",
    ],
    sets: 3,
    reps: "30 sec",
    durationSeconds: 30,
    restSeconds: 45,
    kcalPerMin: 14,
    accent: "ember",
    icon: "zap",
  },
  {
    name: "Ab Wheel Rollout",
    targetArea: "full",
    difficulty: "advanced",
    equipment: "wheel",
    description:
      "The most feared core tool in the gym. Massive anti-extension demand — nothing builds bulletproof, popping abs faster.",
    steps: [
      "Kneel on a pad, wheel under shoulders, arms locked.",
      "Tuck your pelvis (slight posterior tilt) and brace hard.",
      "Roll forward slowly as far as you can without your back arching.",
      "Pull the wheel back by crunching your abs, not your hips.",
      "Add range week by week; full standing is the final boss.",
    ],
    tips: [
      "Your spine must never extend beyond neutral.",
      "Stop 5 cm short of your limit and own that range first.",
      "Squeeze your glutes — it stabilizes everything.",
    ],
    sets: 4,
    reps: "8–10",
    durationSeconds: null,
    restSeconds: 75,
    kcalPerMin: 7,
    accent: "ghost",
    icon: "circle-dot",
  },
  {
    name: "Hanging Leg Raise",
    targetArea: "lower",
    difficulty: "advanced",
    equipment: "bar",
    description:
      "The advanced hanging move — straight legs multiply the lever and the burn. Toes-to-bar is the fully-evolved form.",
    steps: [
      "Dead hang, shoulders engaged, zero swing.",
      "Keeping legs straight, raise them by curling the pelvis up.",
      "Lift until toes reach hip height — or the bar for full reps.",
      "Lower for a strict 3 seconds to a dead stop.",
      "Reset every rep. No kip, no momentum.",
    ],
    tips: [
      "The last 20° of the curl is where lower abs work hardest.",
      "Bend your knees slightly if hamstrings limit you.",
      "Try a slow negative-only set when full reps stall.",
    ],
    sets: 4,
    reps: "8–12",
    durationSeconds: null,
    restSeconds: 75,
    kcalPerMin: 9,
    accent: "ember",
    icon: "arrow-up",
  },
  {
    name: "Dragon Flag",
    targetArea: "full",
    difficulty: "advanced",
    equipment: "bench",
    description:
      "Bruce Lee's signature move. Your entire body becomes a lever that your abs must control — the ultimate display of core strength.",
    steps: [
      "Lie on a bench, grip it hard behind your head.",
      "Kick legs and hips up until you're vertical on your shoulders.",
      "Body locked in one rigid line — glutes, abs, quads all on.",
      "Lower the entire plank of your body slowly toward the bench.",
      "Stop just before your back touches, then drive back up.",
    ],
    tips: [
      "All the weight sits on your traps, never your neck.",
      "Start with tuck flags: knees bent, short lever.",
      "Negatives only are a legit stepping stone.",
    ],
    sets: 3,
    reps: "5–8",
    durationSeconds: null,
    restSeconds: 90,
    kcalPerMin: 8,
    accent: "volt",
    icon: "flame",
  },
  {
    name: "Toe Touch",
    targetArea: "upper",
    difficulty: "beginner",
    equipment: "none",
    description:
      "Legs vertical, hands reaching for toes. Puts the upper abs under a deep, constant contraction with nowhere to hide.",
    steps: [
      "Lie back and raise legs straight up, feet over hips.",
      "Reach both arms toward the ceiling.",
      "Crunch up, lifting shoulder blades and reaching for your toes.",
      "Pause for a second at the top, abs fully crunched.",
      "Lower shoulders with control; legs stay up the whole set.",
    ],
    tips: [
      "It's okay if you can't touch — reach and contract.",
      "Keep legs as still as possible; abs move, not legs.",
      "Look at your toes to keep your neck neutral.",
    ],
    sets: 3,
    reps: "15",
    durationSeconds: null,
    restSeconds: 40,
    kcalPerMin: 6,
    accent: "volt",
    icon: "arrow-up",
  },
];

export type BasePlan = {
  name: string;
  description: string;
  level: string;
  focus: string;
  items: Array<{
    exercise: string;
    sets?: number;
    reps?: string;
    duration?: number | null;
    rest?: number;
  }>;
};

export const BASE_PLANS: BasePlan[] = [
  {
    name: "Home Shred Starter",
    description:
      "Zero equipment, maximum burn. The perfect first 2 weeks — build the habit and wake every ab up from your living room.",
    level: "beginner",
    focus: "shred",
    items: [
      { exercise: "Crunch" },
      { exercise: "Reverse Crunch" },
      { exercise: "Mountain Climbers" },
      { exercise: "Bicycle Crunch" },
      { exercise: "Forearm Plank" },
    ],
  },
  {
    name: "7-Minute Daily Core",
    description:
      "A ruthless little circuit for busy days. One set each, minimal rest, done before your coffee gets cold. Consistency is the program.",
    level: "beginner",
    focus: "daily",
    items: [
      { exercise: "Crunch", sets: 1, reps: "20", rest: 10 },
      { exercise: "Dead Bug", sets: 1, rest: 10 },
      { exercise: "Russian Twist", sets: 1, rest: 10 },
      { exercise: "Flutter Kicks", sets: 1, rest: 10 },
      { exercise: "Side Plank", sets: 1, reps: "20 sec / side", rest: 10 },
      { exercise: "Forearm Plank", sets: 1, reps: "40 sec", duration: 40, rest: 10 },
    ],
  },
  {
    name: "Gym Core Crusher",
    description:
      "Cables, plates and the pull-up bar. Progressive overload for your midsection — this is how gym rats build abs that show year-round.",
    level: "intermediate",
    focus: "hypertrophy",
    items: [
      { exercise: "Cable Crunch", sets: 4 },
      { exercise: "Hanging Knee Raise", sets: 4 },
      { exercise: "Weighted Sit-Up", sets: 3 },
      { exercise: "Russian Twist", sets: 3, reps: "24 twists" },
      { exercise: "Forearm Plank", sets: 3, reps: "60 sec", duration: 60 },
    ],
  },
  {
    name: "Advanced Ab Assault",
    description:
      "The gauntlet. Rollouts, dragon flags and toes-to-bar work — only attempt this when intermediate moves feel easy. Respect the rest periods.",
    level: "advanced",
    focus: "strength",
    items: [
      { exercise: "Ab Wheel Rollout", sets: 4 },
      { exercise: "Hanging Leg Raise", sets: 4 },
      { exercise: "Dragon Flag", sets: 3 },
      { exercise: "V-Up", sets: 3 },
      { exercise: "Hollow Body Hold", sets: 3, reps: "30 sec", duration: 30 },
      { exercise: "Burpee", sets: 3, reps: "40 sec", duration: 40 },
    ],
  },
];

export const BLUEPRINT = [
  {
    icon: "salad",
    title: "Nutrition First",
    tag: "80% of the result",
    points: [
      "Run a 300–500 kcal daily deficit — abs appear at roughly 10–14% body fat for men, 16–20% for women.",
      "Hit 1.6–2.2 g of protein per kg of bodyweight to protect muscle while cutting.",
      "Build plates around lean protein, fibrous carbs and whole foods. What you drink matters too.",
    ],
  },
  {
    icon: "dumbbell",
    title: "Train Abs Like a Muscle",
    tag: "3–4x per week",
    points: [
      "Abs grow from progressive overload — add reps, sets, load or lever length weekly.",
      "Hit all four zones: upper, lower, obliques and deep core. One crunch variant is not enough.",
      "Weighted moves (cable crunch, sit-up) build the bricks; planks and holds chisel the details.",
    ],
  },
  {
    icon: "heart-pulse",
    title: "Reveal With Cardio",
    tag: "2–3x per week",
    points: [
      "You can't spot-reduce fat — cardio widens the calorie deficit that unveils your work.",
      "Finish sessions with 10 minutes of intervals: mountain climbers, burpees, sprints.",
      "8–10k daily steps is the silent fat-loss weapon most people ignore.",
    ],
  },
  {
    icon: "moon",
    title: "Recover & Sleep",
    tag: "7–9 hours",
    points: [
      "Poor sleep spikes cortisol and hunger hormones — a direct assault on your waistline.",
      "Train abs fresh: put core work first on 2 days, after compounds on the others.",
      "Same muscles need ~48h between hard sessions. Boredom is a sign it's working.",
    ],
  },
  {
    icon: "calendar-check",
    title: "Consistency Compounds",
    tag: "12-week minimum",
    points: [
      "Expect visible change in 8–12 weeks of honest work. Anything faster is dehydration.",
      "Track waist, weight and workouts weekly — data beats motivation.",
      "Missing one session changes nothing. Quitting for a week changes everything.",
    ],
  },
];
