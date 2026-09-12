import {
  PrismaClient,
  Role,
  ExerciseCategory,
  EquipmentType,
  Difficulty,
  FitnessGoal,
  FitnessLevel,
  Gender,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed Achievements
  const achievements = [
    {
      code: 'FIRST_WORKOUT',
      title: 'First Step',
      description: 'Completed your very first logged workout session!',
      icon: 'zap',
      points: 10,
    },
    {
      code: 'STREAK_3',
      title: 'Consistency Starter',
      description: 'Logged workouts 3 consecutive days.',
      icon: 'flame',
      points: 20,
    },
    {
      code: 'STREAK_7',
      title: 'Iron Habit',
      description: 'Maintained a 7-day workout streak!',
      icon: 'award',
      points: 50,
    },
    {
      code: 'CENTURY_CLUB',
      title: 'Century Club',
      description: 'Lifted 100 kg or more in a single set.',
      icon: 'shield',
      points: 100,
    },
    {
      code: 'VOLUME_BEAST',
      title: 'Volume Beast',
      description: 'Moved over 10,000 kg total volume in one workout session.',
      icon: 'activity',
      points: 75,
    },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: ach,
      create: ach,
    });
  }
  console.log('✅ Achievements seeded.');

  // 2. Seed Users
  const adminPassword = await hash('Admin@12345');
  const trainerPassword = await hash('Trainer@12345');
  const athletePassword = await hash('Athlete@12345');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fitness.app' },
    update: {},
    create: {
      email: 'admin@fitness.app',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      isEmailVerified: true,
      profile: {
        create: {
          name: 'Chief Admin',
          gender: Gender.PREFER_NOT_TO_SAY,
          fitnessLevel: FitnessLevel.ADVANCED,
          primaryGoal: FitnessGoal.IMPROVE_STRENGTH,
          bio: 'Platform administrator and lead fitness coordinator.',
        },
      },
    },
  });

  const trainer = await prisma.user.upsert({
    where: { email: 'coach@fitness.app' },
    update: {},
    create: {
      email: 'coach@fitness.app',
      passwordHash: trainerPassword,
      role: Role.TRAINER,
      isEmailVerified: true,
      profile: {
        create: {
          name: 'Coach Marcus Vance',
          gender: Gender.MALE,
          fitnessLevel: FitnessLevel.ADVANCED,
          primaryGoal: FitnessGoal.ATHLETIC_PERFORMANCE,
          bio: 'Certified CSCS coach with 12+ years of strength & conditioning expertise.',
        },
      },
    },
  });

  const athlete = await prisma.user.upsert({
    where: { email: 'athlete@fitness.app' },
    update: {},
    create: {
      email: 'athlete@fitness.app',
      passwordHash: athletePassword,
      role: Role.USER,
      isEmailVerified: true,
      profile: {
        create: {
          name: 'Alex Mercer',
          gender: Gender.MALE,
          heightCm: 180,
          weightKg: 78.5,
          fitnessLevel: FitnessLevel.INTERMEDIATE,
          primaryGoal: FitnessGoal.BUILD_MUSCLE,
          preferredDurationMin: 60,
          preferredWorkoutDays: [1, 2, 4, 5],
          availableEquipment: [
            EquipmentType.BARBELL,
            EquipmentType.DUMBBELL,
            EquipmentType.CABLE,
            EquipmentType.MACHINE,
            EquipmentType.BODYWEIGHT,
          ],
          bio: 'Dedicated gym athlete focused on progressive overload and aesthetic symmetry.',
        },
      },
    },
  });

  console.log('✅ Users seeded: admin@fitness.app, coach@fitness.app, athlete@fitness.app');

  // 3. Seed Comprehensive Exercise Library
  const exercisesData = [
    // Chest
    {
      name: 'Barbell Bench Press',
      slug: 'barbell-bench-press',
      category: ExerciseCategory.CHEST,
      primaryMuscle: 'Pectoralis Major',
      secondaryMuscles: ['Triceps', 'Anterior Deltoids'],
      equipment: EquipmentType.BARBELL,
      difficulty: Difficulty.INTERMEDIATE,
      description: 'The foundational compound upper-body pushing exercise for building horizontal pressing power and chest hypertrophy.',
      instructions: [
        'Lie flat on the bench with eyes directly under the racked bar.',
        'Grip the bar slightly wider than shoulder-width with hands wrapped securely.',
        'Plant feet firmly on the floor and retract your shoulder blades into the bench.',
        'Unrack the bar and stabilize it directly over your upper chest.',
        'Lower the bar under control until it gently touches mid-chest.',
        'Drive the bar up forcefully back to the starting locked position.',
      ],
      safetyInstructions: 'Always use a spotter or safety pins when attempting heavy work sets.',
      commonMistakes: ['Bouncing the bar off ribs', 'Flaring elbows at a 90-degree angle', 'Lifting hips off the bench'],
    },
    {
      name: 'Incline Dumbbell Press',
      slug: 'incline-dumbbell-press',
      category: ExerciseCategory.CHEST,
      primaryMuscle: 'Clavicular Pectoralis (Upper Chest)',
      secondaryMuscles: ['Anterior Deltoids', 'Triceps'],
      equipment: EquipmentType.DUMBBELL,
      difficulty: Difficulty.INTERMEDIATE,
      description: 'Compound dumbbell pressing movement focused on developing upper chest thickness and stabilizer balance.',
      instructions: [
        'Set an adjustable bench to an incline angle between 30 and 45 degrees.',
        'Sit with dumbbells resting on your thighs, then kick them up to shoulder level as you lean back.',
        'Retract scapulae and press both dumbbells upward in an arc towards the ceiling.',
        'Lower the dumbbells steadily until you feel a deep stretch in the upper pectorals.',
        'Press upward contract the chest at the apex without banging the weights together.',
      ],
      safetyInstructions: 'Never drop heavy dumbbells carelessly from the top position; lower them to your knees.',
    },
    {
      name: 'Cable Chest Fly',
      slug: 'cable-chest-fly',
      category: ExerciseCategory.CHEST,
      primaryMuscle: 'Pectoralis Major',
      secondaryMuscles: ['Anterior Deltoids'],
      equipment: EquipmentType.CABLE,
      difficulty: Difficulty.BEGINNER,
      description: 'Constant-tension isolation exercise for targeting adduction and full peak contraction of the chest.',
      instructions: [
        'Position cable pulleys at chest height with single handles attached.',
        'Grasp handles and step forward into a staggered stance with a slight forward torso lean.',
        'Maintain a slight bend in your elbows throughout the movement.',
        'Bring your hands forward in a hugging motion until they meet in front of your chest.',
        'Squeeze the pectorals for a second, then return slowly to the starting stretch.',
      ],
    },
    {
      name: 'Push-Ups',
      slug: 'push-ups',
      category: ExerciseCategory.CHEST,
      primaryMuscle: 'Pectoralis Major',
      secondaryMuscles: ['Triceps', 'Core', 'Anterior Deltoids'],
      equipment: EquipmentType.BODYWEIGHT,
      difficulty: Difficulty.BEGINNER,
      description: 'The classic bodyweight pushing exercise that trains horizontal pressing strength, shoulder health, and core stability.',
      instructions: [
        'Start in a high plank position with hands positioned slightly wider than shoulder-width.',
        'Keep your body in a straight line from head to heels by bracing your core and glutes.',
        'Lower yourself under control until your chest is an inch above the floor.',
        'Push firmly through the floor to return to full arm extension.',
      ],
    },

    // Back
    {
      name: 'Barbell Deadlift',
      slug: 'barbell-deadlift',
      category: ExerciseCategory.BACK,
      primaryMuscle: 'Erector Spinae & Latissimus Dorsi',
      secondaryMuscles: ['Glutes', 'Hamstrings', 'Trapezius', 'Forearms'],
      equipment: EquipmentType.BARBELL,
      difficulty: Difficulty.ADVANCED,
      description: 'The king of posterior chain exercises. Builds total-body pulling power, back density, and hip hinge strength.',
      instructions: [
        'Stand with feet hip-width apart, the bar over mid-foot about an inch from your shins.',
        'Hinge at hips to grip the bar outside your legs with a double overhand or mixed grip.',
        'Drop hips until shins touch the bar, pull chest up, engage lats, and pull slack out of the bar.',
        'Drive the floor away with your legs, keeping the bar close to your body throughout.',
        'Lock out hips and knees simultaneously at the top without hyperextending the lower back.',
        'Hinge at the hips to return the bar along your thighs down to the platform.',
      ],
      safetyInstructions: 'Maintain a neutral spine throughout the pull. Never round your lumbar spine under load.',
    },
    {
      name: 'Pull-Ups',
      slug: 'pull-ups',
      category: ExerciseCategory.BACK,
      primaryMuscle: 'Latissimus Dorsi',
      secondaryMuscles: ['Biceps', 'Rhomboids', 'Rear Deltoids', 'Core'],
      equipment: EquipmentType.BODYWEIGHT,
      difficulty: Difficulty.INTERMEDIATE,
      description: 'The gold standard vertical pulling movement for developing lat width and upper body pulling strength.',
      instructions: [
        'Grip the pull-up bar with an overhand grip slightly wider than shoulder width.',
        'Hang at full extension with core braced and legs straight or crossed.',
        'Initiate the pull by depressing your shoulder blades down and back.',
        'Pull your chest up towards the bar until your chin clears the bar comfortably.',
        'Lower yourself with control back to a full dead hang stretch.',
      ],
    },
    {
      name: 'Barbell Bent-Over Row',
      slug: 'barbell-bent-over-row',
      category: ExerciseCategory.BACK,
      primaryMuscle: 'Latissimus Dorsi & Rhomboids',
      secondaryMuscles: ['Trapezius', 'Rear Deltoids', 'Biceps', 'Spinal Erectors'],
      equipment: EquipmentType.BARBELL,
      difficulty: Difficulty.INTERMEDIATE,
      description: 'Horizontal compound pull that builds upper and mid-back thickness and isometric lower back endurance.',
      instructions: [
        'Stand with feet shoulder-width apart holding a barbell with a pronated grip.',
        'Hinge forward at the hips until your torso is roughly 45 degrees to the floor.',
        'Pull the barbell towards your lower abdomen while driving elbows back.',
        'Squeeze the back muscles hard at the top of the contraction.',
        'Lower the bar under control back to full arm extension without shifting torso angle.',
      ],
    },
    {
      name: 'Lat Pulldown',
      slug: 'lat-pulldown',
      category: ExerciseCategory.BACK,
      primaryMuscle: 'Latissimus Dorsi',
      secondaryMuscles: ['Biceps', 'Teres Major', 'Rhomboids'],
      equipment: EquipmentType.CABLE,
      difficulty: Difficulty.BEGINNER,
      description: 'Cable vertical pull ideal for isolating latissimus dorsi activation and mind-muscle connection.',
      instructions: [
        'Sit with thighs secured snuggly under the roller pads.',
        'Grasp the wide bar with an overhand grip wider than your shoulders.',
        'Lean back very slightly (10-15 degrees) and draw the bar down to your clavicle.',
        'Focus on pulling with your elbows rather than your hands.',
        'Return the bar up smoothly until your lats are fully stretched.',
      ],
    },

    // Shoulders
    {
      name: 'Overhead Barbell Press',
      slug: 'overhead-barbell-press',
      category: ExerciseCategory.SHOULDERS,
      primaryMuscle: 'Anterior & Lateral Deltoids',
      secondaryMuscles: ['Triceps', 'Upper Chest', 'Core', 'Trapezius'],
      equipment: EquipmentType.BARBELL,
      difficulty: Difficulty.INTERMEDIATE,
      description: 'The strict military press builds formidable shoulder strength, lockout power, and overhead stability.',
      instructions: [
        'Stand tall with feet hip-width apart and grip the bar just outside your shoulders.',
        'Rest the bar across your front deltoids and collarbone with forearms vertical.',
        'Brace your abdomen, glutes, and thighs firmly.',
        'Press the bar upward in a straight line, tilting your head back slightly to clear the chin.',
        'Once past the forehead, push head forward to lock out the bar directly over mid-foot.',
        'Lower the bar with control back to the clavicle rack position.',
      ],
    },
    {
      name: 'Dumbbell Lateral Raise',
      slug: 'dumbbell-lateral-raise',
      category: ExerciseCategory.SHOULDERS,
      primaryMuscle: 'Lateral Deltoids',
      secondaryMuscles: ['Trapezius', 'Anterior Deltoids'],
      equipment: EquipmentType.DUMBBELL,
      difficulty: Difficulty.BEGINNER,
      description: 'Premier isolation movement for side deltoid growth, creating the coveted shoulder width and V-taper look.',
      instructions: [
        'Stand with dumbbells at sides, palms facing inward and a slight bend in knees and hips.',
        'Raise arms out to the sides leading with your elbows until upper arms are parallel to the floor.',
        'Keep pinkies slightly elevated relative to thumbs as if pouring a pitcher of water.',
        'Pause momentarily at shoulder height before lowering slowly over 2-3 seconds.',
      ],
    },
    {
      name: 'Face Pull',
      slug: 'face-pull',
      category: ExerciseCategory.SHOULDERS,
      primaryMuscle: 'Rear Deltoids & Rotator Cuff',
      secondaryMuscles: ['Rhomboids', 'Middle Trapezius'],
      equipment: EquipmentType.CABLE,
      difficulty: Difficulty.BEGINNER,
      description: 'Essential postural exercise for external shoulder rotation, rear delt health, and balanced posture.',
      instructions: [
        'Attach a dual-rope attachment to a cable pulley set at eye level.',
        'Grip ropes with a thumbs-backward overhand or neutral grip.',
        'Step back into a solid stance and pull the center of the rope directly towards your eyes.',
        'As you pull back, flare elbows high and rotate your hands back behind your ears.',
        'Hold the peak contraction for 1 second, then release smoothly.',
      ],
    },

    // Legs / Quads
    {
      name: 'Barbell Back Squat',
      slug: 'barbell-back-squat',
      category: ExerciseCategory.QUADS,
      primaryMuscle: 'Quadriceps & Gluteus Maximus',
      secondaryMuscles: ['Adductors', 'Hamstrings', 'Calves', 'Core'],
      equipment: EquipmentType.BARBELL,
      difficulty: Difficulty.ADVANCED,
      description: 'The gold-standard lower body compound exercise for developing massive leg drive, quad size, and core strength.',
      instructions: [
        'Step under the bar and rest it across your upper trapezius (high-bar) or rear delts (low-bar).',
        'Unrack the bar, take two deliberate steps back, and set feet shoulder-width apart.',
        'Take a deep belly breath and brace your core with the Valsalva maneuver.',
        'Break at knees and hips simultaneously, squatting down until hip crease is below knee level.',
        'Drive feet through the ground to stand back up, keeping knees tracking over your toes.',
      ],
      safetyInstructions: 'Never squat heavy without safety catches adjusted to hip height.',
    },
    {
      name: 'Leg Press',
      slug: 'leg-press',
      category: ExerciseCategory.QUADS,
      primaryMuscle: 'Quadriceps',
      secondaryMuscles: ['Glutes', 'Hamstrings'],
      equipment: EquipmentType.MACHINE,
      difficulty: Difficulty.BEGINNER,
      description: 'Machine-based heavy compound press allowing maximal quad loading without spinal compression.',
      instructions: [
        'Sit on the 45-degree machine with lower back and hips pressed firmly into the backrest.',
        'Place feet shoulder-width apart in the center of the sled platform.',
        'Disengage the safety levers and lower the sled until knees are bent to approximately 90 degrees.',
        'Press the sled away through your mid-foot and heels without violently locking your knees.',
      ],
      safetyInstructions: 'Never let your lower back round off the seat, and never hyperextend/lock knees.',
    },
    {
      name: 'Bulgarian Split Squat',
      slug: 'bulgarian-split-squat',
      category: ExerciseCategory.QUADS,
      primaryMuscle: 'Quadriceps & Gluteus Medius',
      secondaryMuscles: ['Hamstrings', 'Calves', 'Core'],
      equipment: EquipmentType.DUMBBELL,
      difficulty: Difficulty.INTERMEDIATE,
      description: 'Brutal unilateral lower body builder that fixes leg imbalances and stimulates deep quad and glute fiber recruitment.',
      instructions: [
        'Stand roughly two feet in front of a flat bench holding dumbbells at your sides.',
        'Reach one foot backward and rest the top of your foot on the bench.',
        'Lower your hips straight down until your front thigh is parallel to the ground.',
        'Keep front knee aligned over mid-foot and torso tall with a slight natural forward lean.',
        'Drive through the front heel to return to the starting position.',
      ],
    },

    // Hamstrings / Glutes
    {
      name: 'Romanian Deadlift (RDL)',
      slug: 'romanian-deadlift',
      category: ExerciseCategory.HAMSTRINGS,
      primaryMuscle: 'Hamstrings & Gluteus Maximus',
      secondaryMuscles: ['Erector Spinae', 'Trapezius', 'Forearms'],
      equipment: EquipmentType.BARBELL,
      difficulty: Difficulty.INTERMEDIATE,
      description: 'Hip-hinge staple that eccentric-loads the hamstrings for exceptional hypertrophy and injury prevention.',
      instructions: [
        'Hold a barbell at thigh level with an overhand grip and feet hip-width apart.',
        'Keep a soft, slight bend in your knees that stays fixed throughout the movement.',
        'Push your hips straight back as if trying to touch a wall behind you with your glutes.',
        'Slide the bar closely down your shins until you feel an intense stretch in the hamstrings.',
        'Drive hips forward forcefully to lock out and squeeze glutes at the top.',
      ],
    },
    {
      name: 'Lying Leg Curl',
      slug: 'lying-leg-curl',
      category: ExerciseCategory.HAMSTRINGS,
      primaryMuscle: 'Hamstrings (Biceps Femoris)',
      secondaryMuscles: ['Gastrocnemius'],
      equipment: EquipmentType.MACHINE,
      difficulty: Difficulty.BEGINNER,
      description: 'Knee-flexion isolation movement ensuring complete hamstring development across all heads.',
      instructions: [
        'Lie face down on the machine with the roller pad positioned just below your calf muscles.',
        'Grasp the side handles and keep your pelvis pushed down against the bench.',
        'Curl the weight up towards your glutes as far as possible without lifting your hips.',
        'Squeeze hamstrings for a second, then lower under control for 3 seconds.',
      ],
    },
    {
      name: 'Barbell Hip Thrust',
      slug: 'barbell-hip-thrust',
      category: ExerciseCategory.GLUTES,
      primaryMuscle: 'Gluteus Maximus',
      secondaryMuscles: ['Hamstrings', 'Quadriceps'],
      equipment: EquipmentType.BARBELL,
      difficulty: Difficulty.INTERMEDIATE,
      description: 'The supreme glute-builder that delivers horizontal hip extension loading with unmatched peak glute activation.',
      instructions: [
        'Sit on the ground with upper back against a sturdy bench and a padded barbell over hips.',
        'Bend knees and place feet flat on the floor, about hip-width apart.',
        'Drive through heels and push hips upward until thighs and torso are in a straight horizontal line.',
        'Lock out at the top with posterior pelvic tilt (ribs down, chin tucked) and squeeze glutes hard.',
        'Lower hips down under control to reset for the next rep.',
      ],
    },

    // Arms: Biceps & Triceps
    {
      name: 'Barbell Bicep Curl',
      slug: 'barbell-bicep-curl',
      category: ExerciseCategory.BICEPS,
      primaryMuscle: 'Biceps Brachii',
      secondaryMuscles: ['Brachialis', 'Forearms'],
      equipment: EquipmentType.BARBELL,
      difficulty: Difficulty.BEGINNER,
      description: 'Classic mass builder for biceps peak and arm thickness with heavy progressive overload.',
      instructions: [
        'Stand erect holding a barbell with a shoulder-width underhand grip.',
        'Pin your elbows near your ribs and maintain a braced torso.',
        'Curl the bar upward by flexing your biceps until forearms are nearly vertical.',
        'Hold the contraction briefly, then lower the bar with control to full extension.',
      ],
    },
    {
      name: 'Incline Dumbbell Curl',
      slug: 'incline-dumbbell-curl',
      category: ExerciseCategory.BICEPS,
      primaryMuscle: 'Biceps Brachii (Long Head)',
      secondaryMuscles: ['Brachialis'],
      equipment: EquipmentType.DUMBBELL,
      difficulty: Difficulty.INTERMEDIATE,
      description: 'Puts the long head of the biceps under loaded stretch behind the torso for superior biceps peak shape.',
      instructions: [
        'Set an incline bench to 60 degrees and sit with dumbbells hanging down at your sides.',
        'Keep shoulders back and elbows pointed towards the floor.',
        'Curl the weights upward while supinating your wrists (turning palms up and outward).',
        'Lower the dumbbells slowly until your biceps are stretched completely at the bottom.',
      ],
    },
    {
      name: 'Tricep Rope Pushdown',
      slug: 'tricep-rope-pushdown',
      category: ExerciseCategory.TRICEPS,
      primaryMuscle: 'Triceps (Lateral & Medial Heads)',
      secondaryMuscles: ['Anconeus'],
      equipment: EquipmentType.CABLE,
      difficulty: Difficulty.BEGINNER,
      description: 'High-tension cable pushdown allowing full elbow extension and lateral head isolation at the lockout.',
      instructions: [
        'Attach a rope to a high cable pulley and grip with palms facing each other.',
        'Keep elbows pinned tight against your sides with a slight forward torso tilt.',
        'Push the rope straight down by extending your elbows.',
        'At the bottom, spread the rope ends apart and squeeze the triceps hard.',
        'Allow the rope to return up to chest level while keeping elbows motionless.',
      ],
    },
    {
      name: 'Skull Crushers (Lying Tricep Extension)',
      slug: 'skull-crushers',
      category: ExerciseCategory.TRICEPS,
      primaryMuscle: 'Triceps Brachii (Long Head)',
      secondaryMuscles: ['Lateral Head', 'Medial Head'],
      equipment: EquipmentType.EZ_BAR,
      difficulty: Difficulty.INTERMEDIATE,
      description: 'Lying extension using an EZ curl bar to stretch and load the long head of the triceps for upper arm mass.',
      instructions: [
        'Lie on a flat bench holding an EZ-bar with hands on the inner bends, arms extended above chest.',
        'Angle your upper arms back roughly 10-15 degrees towards your head.',
        'Bend elbows to lower the bar towards your forehead or crown of your head.',
        'Extend elbows smoothly to push the bar back to the angled starting position.',
      ],
    },

    // Core / Abs
    {
      name: 'Hanging Leg Raise',
      slug: 'hanging-leg-raise',
      category: ExerciseCategory.ABS,
      primaryMuscle: 'Rectus Abdominis (Lower Region)',
      secondaryMuscles: ['Hip Flexors', 'Obliques', 'Forearms'],
      equipment: EquipmentType.BODYWEIGHT,
      difficulty: Difficulty.INTERMEDIATE,
      description: 'Dynamic abdominal movement that curls the pelvis upward against gravity for complete abdominal development.',
      instructions: [
        'Hang from a pull-up bar with an overhand grip and arms fully extended.',
        'Without swinging, raise your legs by flexing your hips and rounding your pelvis up towards your chest.',
        'Lift legs until thighs are at least parallel to the floor (or touch toes to bar).',
        'Lower legs with total control to avoid swinging momentum.',
      ],
    },
    {
      name: 'Plank',
      slug: 'plank',
      category: ExerciseCategory.ABS,
      primaryMuscle: 'Transverse Abdominis & Rectus Abdominis',
      secondaryMuscles: ['Glutes', 'Deltoids', 'Lower Back'],
      equipment: EquipmentType.BODYWEIGHT,
      difficulty: Difficulty.BEGINNER,
      description: 'Foundational anti-extension isometric core hold that builds pillar stability and core endurance.',
      instructions: [
        'Place elbows under shoulders with forearms parallel on the floor.',
        'Extend legs straight back, resting on your toes.',
        'Form a completely rigid straight line from shoulders to heels.',
        'Brace your abdominal wall as if bracing for a punch and squeeze your glutes.',
        'Breathe steadily while holding the position without letting hips sag.',
      ],
    },
  ];

  const exerciseMap = new Map<string, string>();

  for (const ex of exercisesData) {
    const created = await prisma.exercise.upsert({
      where: { slug: ex.slug },
      update: ex,
      create: {
        ...ex,
        isCustom: false,
      },
    });
    exerciseMap.set(ex.slug, created.id);
  }
  console.log(`✅ ${exercisesData.length} core exercises seeded.`);

  // 4. Seed Starter Workout Templates
  const benchId = exerciseMap.get('barbell-bench-press')!;
  const inclineId = exerciseMap.get('incline-dumbbell-press')!;
  const flyId = exerciseMap.get('cable-chest-fly')!;
  const pushdownId = exerciseMap.get('tricep-rope-pushdown')!;
  const ohpId = exerciseMap.get('overhead-barbell-press')!;
  const lateralId = exerciseMap.get('dumbbell-lateral-raise')!;

  const deadliftId = exerciseMap.get('barbell-deadlift')!;
  const pullupId = exerciseMap.get('pull-ups')!;
  const rowId = exerciseMap.get('barbell-bent-over-row')!;
  const bicepCurlId = exerciseMap.get('barbell-bicep-curl')!;
  const facepullId = exerciseMap.get('face-pull')!;

  const squatId = exerciseMap.get('barbell-back-squat')!;
  const legPressId = exerciseMap.get('leg-press')!;
  const rdlId = exerciseMap.get('romanian-deadlift')!;
  const hipThrustId = exerciseMap.get('barbell-hip-thrust')!;
  const legRaiseId = exerciseMap.get('hanging-leg-raise')!;

  const starterTemplates = [
    {
      userId: trainer.id,
      name: 'Push Day: Hypertrophy & Power',
      description: 'Complete chest, front deltoid, and tricep workout designed for muscle growth and pressing power.',
      isPublic: true,
      estimatedDuration: 60,
      workoutType: 'Push',
      exercises: [
        { exerciseId: benchId, orderIndex: 0, targetSets: 4, targetReps: '6-8', restSeconds: 120 },
        { exerciseId: inclineId, orderIndex: 1, targetSets: 3, targetReps: '10-12', restSeconds: 90 },
        { exerciseId: ohpId, orderIndex: 2, targetSets: 3, targetReps: '8-10', restSeconds: 90 },
        { exerciseId: lateralId, orderIndex: 3, targetSets: 4, targetReps: '15', restSeconds: 60 },
        { exerciseId: pushdownId, orderIndex: 4, targetSets: 3, targetReps: '12-15', restSeconds: 60 },
      ],
    },
    {
      userId: trainer.id,
      name: 'Pull Day: Lat Width & Density',
      description: 'Back, rear delt, and biceps session targeting full posterior chain development.',
      isPublic: true,
      estimatedDuration: 65,
      workoutType: 'Pull',
      exercises: [
        { exerciseId: deadliftId, orderIndex: 0, targetSets: 3, targetReps: '5', restSeconds: 180 },
        { exerciseId: pullupId, orderIndex: 1, targetSets: 4, targetReps: '8-10', restSeconds: 90 },
        { exerciseId: rowId, orderIndex: 2, targetSets: 3, targetReps: '8-10', restSeconds: 90 },
        { exerciseId: facepullId, orderIndex: 3, targetSets: 3, targetReps: '15', restSeconds: 60 },
        { exerciseId: bicepCurlId, orderIndex: 4, targetSets: 3, targetReps: '10-12', restSeconds: 60 },
      ],
    },
    {
      userId: trainer.id,
      name: 'Leg Day: Quad & Posterior Strength',
      description: 'Demanding lower body workout covering heavy squats, hinges, and glute emphasis.',
      isPublic: true,
      estimatedDuration: 70,
      workoutType: 'Legs',
      exercises: [
        { exerciseId: squatId, orderIndex: 0, targetSets: 4, targetReps: '6-8', restSeconds: 180 },
        { exerciseId: rdlId, orderIndex: 1, targetSets: 3, targetReps: '8-10', restSeconds: 120 },
        { exerciseId: legPressId, orderIndex: 2, targetSets: 3, targetReps: '12-15', restSeconds: 90 },
        { exerciseId: hipThrustId, orderIndex: 3, targetSets: 3, targetReps: '10', restSeconds: 90 },
        { exerciseId: legRaiseId, orderIndex: 4, targetSets: 3, targetReps: '15', restSeconds: 60 },
      ],
    },
  ];

  for (const tmpl of starterTemplates) {
    const existing = await prisma.workoutTemplate.findFirst({
      where: { name: tmpl.name },
    });

    if (!existing) {
      await prisma.workoutTemplate.create({
        data: {
          userId: tmpl.userId,
          name: tmpl.name,
          description: tmpl.description,
          isPublic: tmpl.isPublic,
          estimatedDuration: tmpl.estimatedDuration,
          workoutType: tmpl.workoutType,
          exercises: {
            create: tmpl.exercises.map((e) => ({
              exerciseId: e.exerciseId,
              orderIndex: e.orderIndex,
              targetSets: e.targetSets,
              targetReps: e.targetReps,
              restSeconds: e.restSeconds,
            })),
          },
        },
      });
    }
  }
  console.log('✅ Starter workout templates seeded.');

  // 5. Seed a Sample Completed Session and Personal Records for the athlete
  const existingAthleteSession = await prisma.workoutSession.findFirst({
    where: { userId: athlete.id },
  });

  if (!existingAthleteSession) {
    const sessionDate = new Date();
    sessionDate.setDate(sessionDate.getDate() - 1);

    const session = await prisma.workoutSession.create({
      data: {
        userId: athlete.id,
        name: 'Bench & Upper Body Blast',
        status: 'COMPLETED',
        startedAt: sessionDate,
        endedAt: new Date(sessionDate.getTime() + 55 * 60 * 1000),
        durationSeconds: 3300,
        totalVolumeKg: 4250,
        totalCalories: 380,
        notes: 'Felt strong on bench press today. Paused reps at bottom.',
        exercises: {
          create: [
            {
              exerciseId: benchId,
              orderIndex: 0,
              notes: 'Top set was 100kg!',
              sets: {
                create: [
                  { setNumber: 1, weightKg: 60, reps: 10, isWarmup: true, isCompleted: true },
                  { setNumber: 2, weightKg: 80, reps: 8, isWarmup: false, isCompleted: true },
                  { setNumber: 3, weightKg: 90, reps: 6, isWarmup: false, isCompleted: true },
                  { setNumber: 4, weightKg: 100, reps: 5, isWarmup: false, isCompleted: true, isPersonalRecord: true },
                ],
              },
            },
            {
              exerciseId: inclineId,
              orderIndex: 1,
              sets: {
                create: [
                  { setNumber: 1, weightKg: 30, reps: 10, isCompleted: true },
                  { setNumber: 2, weightKg: 34, reps: 8, isCompleted: true },
                  { setNumber: 3, weightKg: 34, reps: 8, isCompleted: true },
                ],
              },
            },
          ],
        },
      },
    });

    // Seed Personal Records
    await prisma.personalRecord.createMany({
      data: [
        {
          userId: athlete.id,
          exerciseId: benchId,
          recordType: 'HEAVIEST_WEIGHT',
          value: 100,
          previousValue: 95,
          workoutSessionId: session.id,
          achievedAt: sessionDate,
        },
        {
          userId: athlete.id,
          exerciseId: benchId,
          recordType: 'ESTIMATED_1RM',
          value: 116.7,
          previousValue: 110,
          workoutSessionId: session.id,
          achievedAt: sessionDate,
        },
      ],
    });

    // Seed Initial Body Measurement
    await prisma.progressMeasurement.create({
      data: {
        userId: athlete.id,
        date: sessionDate,
        weightKg: 78.5,
        bodyFatPercentage: 14.2,
        chestCm: 106,
        waistCm: 81,
        armsCm: 39,
        thighsCm: 61,
        notes: 'Baseline measurement after 8-week training cycle.',
      },
    });

    console.log('✅ Sample session, PRs, and measurement seeded for athlete.');
  }

  // 6. Seed Multi-Week Program
  const existingProgram = await prisma.workoutProgram.findFirst({
    where: { title: '12-Week Foundation Strength & Hypertrophy' },
  });

  if (!existingProgram) {
    const program = await prisma.workoutProgram.create({
      data: {
        title: '12-Week Foundation Strength & Hypertrophy',
        description: 'A scientifically periodized 12-week linear progression program designed for intermediate lifters looking to maximize muscle hypertrophy and compound strength.',
        level: FitnessLevel.INTERMEDIATE,
        durationWeeks: 12,
        daysPerWeek: 4,
        creatorId: trainer.id,
        weeks: {
          create: [
            {
              weekNumber: 1,
              description: 'Introductory accumulation block - 3x8 base loading.',
              days: {
                create: [
                  {
                    dayNumber: 1,
                    name: 'Day 1: Upper Body Heavy',
                    isRestDay: false,
                    exercises: {
                      create: [
                        { exerciseId: benchId, orderIndex: 0, targetSets: 4, targetReps: '6-8', restSeconds: 120 },
                        { exerciseId: rowId, orderIndex: 1, targetSets: 4, targetReps: '8', restSeconds: 90 },
                      ],
                    },
                  },
                  {
                    dayNumber: 2,
                    name: 'Day 2: Lower Body Quad Focus',
                    isRestDay: false,
                    exercises: {
                      create: [
                        { exerciseId: squatId, orderIndex: 0, targetSets: 4, targetReps: '6-8', restSeconds: 180 },
                        { exerciseId: legPressId, orderIndex: 1, targetSets: 3, targetReps: '12', restSeconds: 90 },
                      ],
                    },
                  },
                  {
                    dayNumber: 3,
                    name: 'Day 3: Active Recovery / Rest',
                    isRestDay: true,
                  },
                  {
                    dayNumber: 4,
                    name: 'Day 4: Upper Body Volume',
                    isRestDay: false,
                    exercises: {
                      create: [
                        { exerciseId: inclineId, orderIndex: 0, targetSets: 3, targetReps: '10-12', restSeconds: 90 },
                        { exerciseId: pullupId, orderIndex: 1, targetSets: 3, targetReps: '10', restSeconds: 90 },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    // Enroll the athlete in this program
    await prisma.programEnrollment.create({
      data: {
        userId: athlete.id,
        programId: program.id,
        startDate: new Date(),
        currentWeek: 1,
        currentDay: 1,
        status: 'ACTIVE',
      },
    });

    console.log('✅ Multi-week program and athlete enrollment seeded.');
  }

  // 7. Seed Membership Plans
  const plans = [
    {
      name: 'Monthly Pro',
      slug: 'monthly',
      description: 'Full access to the six-pack operating system. Cancel anytime with zero lock-in.',
      price: 99,
      currency: 'INR',
      durationDays: 30,
      popular: false,
      badge: null,
      tagline: 'Monthly flexibility to chisel your core',
      sortOrder: 1,
      features: [
        'Full 23+ coached exercise library',
        'Interactive live workout companion with audio timer',
        'Unlimited workout logging & streak tracking',
        'Body metrics (weight & waist) trend line charts',
        'Rule-based smart coach workout suggestions',
      ],
    },
    {
      name: 'Yearly Elite',
      slug: 'yearly',
      description: 'The ideal duration to reveal deep definition and maintain rock-hard core strength year-round.',
      price: 550,
      currency: 'INR',
      durationDays: 365,
      popular: true,
      badge: 'Save ₹638 / year',
      tagline: 'The 12-month serious transformation path',
      sortOrder: 2,
      features: [
        'Everything in Monthly Pro',
        'All structured progression workout programs',
        '98-day training volume & activity heat map',
        'Custom exercise creator with personal coaching cues',
        'Elite member badge across dashboard & profile',
        'Priority feature access & updates',
      ],
    },
    {
      name: 'VIP Lifetime',
      slug: 'lifetime',
      description: 'Permanent VIP Founder access. No monthly fees, no yearly renewals. Yours forever.',
      price: 1200,
      currency: 'INR',
      durationDays: null,
      popular: false,
      badge: 'VIP Founder',
      tagline: 'Pay once. Master your midline for life.',
      sortOrder: 3,
      features: [
        'Permanent unlimited lifetime access — forever',
        'All future programs, features & AI coach upgrades included',
        'Distinguished VIP Founder Crown badge on profile',
        'Unlimited custom exercises & workout programs',
        'Priority 1-on-1 routine architecture review',
        'Zero subscriptions. Ever.',
      ],
    },
  ];

  for (const plan of plans) {
    await prisma.membershipPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }
  console.log('✅ Configurable Membership Plans seeded (₹99, ₹550, ₹1,200).');

  // Seed sample active Yearly membership for athlete
  const yearlyPlan = await prisma.membershipPlan.findUnique({ where: { slug: 'yearly' } });
  if (yearlyPlan) {
    const existingMembership = await prisma.membership.findFirst({
      where: { userId: athlete.id, status: 'ACTIVE' },
    });

    if (!existingMembership) {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

      const membership = await prisma.membership.create({
        data: {
          userId: athlete.id,
          planId: yearlyPlan.id,
          status: 'ACTIVE',
          startDate,
          endDate,
          autoRenew: false,
        },
      });

      const payment = await prisma.payment.create({
        data: {
          userId: athlete.id,
          membershipId: membership.id,
          amount: 550,
          currency: 'INR',
          provider: 'GATEWAY',
          providerPaymentId: `pay_seed_${Date.now()}`,
          paymentMethod: 'UPI (athlete@okhdfcbank)',
          status: 'SUCCESS',
          paidAt: startDate,
        },
      });

      await prisma.invoice.create({
        data: {
          invoiceNumber: 'INV-2026-00001',
          userId: athlete.id,
          paymentId: payment.id,
          membershipId: membership.id,
          amount: 550,
          totalAmount: 550,
          currency: 'INR',
          status: 'PAID',
          issueDate: startDate,
        },
      });

      console.log('✅ Sample Yearly Elite membership, payment & invoice seeded for athlete.');
    }
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
