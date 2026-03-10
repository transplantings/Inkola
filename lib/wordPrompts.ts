export interface WordPrompt {
  word: string
  prompt: string // short visual context only — GLOBAL_PROMPT_PREFIX is prepended at request time
}

export const GLOBAL_PROMPT_PREFIX = 'Vibrant colorful illustration, use the sketch as a rough guide: '

export const WORD_PROMPTS: WordPrompt[] = [
  { word: 'Volcano',        prompt: 'volcano, mountain, eruption, triangle, cone shape' },
  { word: 'Rollercoaster',  prompt: 'rollercoaster, theme park ride, tracks, looping lines, wavy curves' },
  { word: 'Hot Air Balloon', prompt: 'hot air balloon, blimp, teardrop shape, circle, square basket' },
  { word: 'Submarine',      prompt: 'submarine, underwater boat, long oval, cylinder, pill shape' },
  { word: 'T-Rex',          prompt: 't-rex, dinosaur, trex, big lizard, heavy blocky shapes' },
  { word: 'Castle',         prompt: 'castle, fortress, tower, squares, rectangles, triangle roof' },
  { word: 'Spaceship',      prompt: 'spaceship, rocket, ufo, triangle, dart shape, oval' },
  { word: 'Staircase',      prompt: 'staircase, stairs, steps, zigzag lines, ascending blocks' },
  { word: 'Tornado',        prompt: 'tornado, twister, cyclone, spiral, spinning cone' },
  { word: 'Pirate Ship',    prompt: 'pirate ship, galleon, boat, half circle, triangle sails' },
  { word: 'Haunted House',  prompt: 'haunted house, creepy mansion, square building, triangle roof, crooked lines' },
  { word: 'Robot',          prompt: 'robot, android, cyborg, square head, rectangle body, blocky shapes' },
  { word: 'Pizza',          prompt: 'pizza, pizza slice, flat circle, triangle wedge, round pepperonis' },
  { word: 'Guitar',         prompt: 'guitar, acoustic guitar, figure eight shape, long rectangle neck, straight lines' },
  { word: 'Lighthouse',     prompt: 'lighthouse, beacon tower, tall cylinder, rectangle, triangle top' },
  { word: 'Drone',          prompt: 'drone, quadcopter, flat square, four small circles, cross shape' },
  { word: 'Umbrella',       prompt: 'umbrella, parasol, half circle, dome, straight vertical line handle' },
  { word: 'Train',          prompt: 'train, locomotive, railway car, long rectangles, connecting blocks, circles for wheels' },
  { word: 'Camera',         prompt: 'camera, photograph machine, square body, large circle lens, rectangle' },
  { word: 'Helicopter',     prompt: 'helicopter, chopper, round teardrop body, long straight line tail, crossing lines for blades' },
  { word: 'Waterfall',      prompt: 'waterfall, river cascade, vertical lines, steep drop' },
  { word: 'Forest',         prompt: 'forest, woods, trees, tall vertical lines, bumpy circles, triangles' },
  { word: 'Desert',         prompt: 'desert, sahara, dunes, wavy horizontal lines, rolling curves' },
  { word: 'Glacier',        prompt: 'glacier, iceberg, frozen mountain, jagged triangles, sharp blocky shapes' },
  { word: 'Coral Reef',     prompt: 'coral reef, underwater plants, bumpy circles, squiggly lines' },
  { word: 'Meteor',         prompt: 'meteor, shooting star, asteroid, round rock, diagonal trailing lines' },
  { word: 'Cave',           prompt: 'cave, cavern, tunnel, dark half circle, arched doorway shape' },
  { word: 'Beach',          prompt: 'beach, seashore, coast, curving horizontal lines, flat landscape' },
  { word: 'Time Machine',   prompt: 'time machine, sci-fi pod, round sphere, boxes, spinning circles' },
  { word: 'Telescope',      prompt: 'telescope, spyglass, long diagonal cylinder, overlapping tubes, triangle stand' },
  { word: 'Cyberpunk',      prompt: 'cyberpunk city, futuristic street, tall glowing rectangles, straight vertical lines' },
  { word: 'Satellite',      prompt: 'satellite, space probe, flat rectangles, central cylinder, crossing geometric shapes' },
  { word: 'Jetpack',        prompt: 'jetpack, rocket pack, two vertical cylinders, rectangles, straight lines downward' },
  { word: 'Arcade Game',    prompt: 'arcade game, retro cabinet, tall rectangle box, square screen' },
  { word: 'Laser',          prompt: 'laser, beam of light, straight diagonal line, sharp rigid line' },
  { word: 'Dragon',         prompt: 'dragon, mythical beast, winged lizard, sharp triangles, curvy serpentine lines' },
  { word: 'Sword',          prompt: 'sword, blade, long skinny rectangle, cross shape, pointed triangle tip' },
  { word: 'Magic Wand',     prompt: 'magic wand, wizard staff, long thin straight line, star shape, circles' },
  { word: 'Mummy',          prompt: 'mummy, pharaoh, cylinder shape, horizontal wrapping lines, humanoid shape' },
  { word: 'Treasure',       prompt: 'treasure, chest, open rectangle box, half circle lid, shiny circles' },
  { word: 'Knight',         prompt: 'knight, armor, warrior, rectangle body, cylinder limbs, stiff geometric shapes' },
  { word: 'Pegasus',        prompt: 'pegasus, flying horse, oval body, long curves, wide triangle wings' },
  { word: 'Bridge',         prompt: 'bridge, overpass, long horizontal rectangle, vertical supporting lines, arches' },
  { word: 'Skyscraper',     prompt: 'skyscraper, highrise building, very tall rectangle, grid of small squares, vertical lines' },
  { word: 'Tractor',        prompt: 'tractor, farm vehicle, blocky squares, two giant circles, two small circles' },
  { word: 'Ferris Wheel',   prompt: 'ferris wheel, big wheel, giant circle, crossing straight lines, small hanging squares' },
  { word: 'Hamburger',      prompt: 'hamburger, cheeseburger, flat ovals, stacked horizontal layers, half circle top' },
  { word: 'Sneaker',        prompt: 'sneaker, running shoe, curved L-shape, flat bottom line, triangle wedge' },
  { word: 'Ice Cream',      prompt: 'ice cream, cone, upside down triangle, stacked circles, swirling round top' },
  { word: 'Backpack',       prompt: 'backpack, rucksack, big square, half circle top, small rectangle pocket' },
]

export function pickRandom(exclude?: WordPrompt): WordPrompt {
  const pool = exclude ? WORD_PROMPTS.filter((w) => w.word !== exclude.word) : WORD_PROMPTS
  return pool[Math.floor(Math.random() * pool.length)]
}
