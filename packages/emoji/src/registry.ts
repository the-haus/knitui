import type { EmojiComponent } from "./types";

type EmojiLoader = () => Promise<{ default: EmojiComponent }>;

/**
 * Maps a kebab-case emoji name to a lazy loader. Used by the dynamic `Emoji`
 * component so a runtime name resolves to a code-split emoji module.
 */
export const emojiRegistry = {
  "0": () => import("./emojis/Emoji0"),
  "1": () => import("./emojis/Emoji1"),
  "1st-place-medal": () => import("./emojis/Emoji1stPlaceMedal"),
  "2": () => import("./emojis/Emoji2"),
  "2nd-place-medal": () => import("./emojis/Emoji2ndPlaceMedal"),
  "3": () => import("./emojis/Emoji3"),
  "3rd-place-medal": () => import("./emojis/Emoji3rdPlaceMedal"),
  "4": () => import("./emojis/Emoji4"),
  "5": () => import("./emojis/Emoji5"),
  "6": () => import("./emojis/Emoji6"),
  "7": () => import("./emojis/Emoji7"),
  "8": () => import("./emojis/Emoji8"),
  "9": () => import("./emojis/Emoji9"),
  "a-button-blood-type": () => import("./emojis/EmojiAButtonBloodType"),
  "ab-button-blood-type": () => import("./emojis/EmojiAbButtonBloodType"),
  abacus: () => import("./emojis/EmojiAbacus"),
  accordion: () => import("./emojis/EmojiAccordion"),
  "adhesive-bandage": () => import("./emojis/EmojiAdhesiveBandage"),
  "admission-tickets": () => import("./emojis/EmojiAdmissionTickets"),
  "aerial-tramway": () => import("./emojis/EmojiAerialTramway"),
  airplane: () => import("./emojis/EmojiAirplane"),
  "airplane-arrival": () => import("./emojis/EmojiAirplaneArrival"),
  "airplane-departure": () => import("./emojis/EmojiAirplaneDeparture"),
  "alarm-clock": () => import("./emojis/EmojiAlarmClock"),
  alembic: () => import("./emojis/EmojiAlembic"),
  alien: () => import("./emojis/EmojiAlien"),
  "alien-monster": () => import("./emojis/EmojiAlienMonster"),
  ambulance: () => import("./emojis/EmojiAmbulance"),
  "american-football": () => import("./emojis/EmojiAmericanFootball"),
  amphora: () => import("./emojis/EmojiAmphora"),
  "anatomical-heart": () => import("./emojis/EmojiAnatomicalHeart"),
  anchor: () => import("./emojis/EmojiAnchor"),
  "anger-symbol": () => import("./emojis/EmojiAngerSymbol"),
  "angry-face": () => import("./emojis/EmojiAngryFace"),
  "angry-face-with-horns": () => import("./emojis/EmojiAngryFaceWithHorns"),
  "anguished-face": () => import("./emojis/EmojiAnguishedFace"),
  ant: () => import("./emojis/EmojiAnt"),
  "antenna-bars": () => import("./emojis/EmojiAntennaBars"),
  "anxious-face-with-sweat": () => import("./emojis/EmojiAnxiousFaceWithSweat"),
  aquarius: () => import("./emojis/EmojiAquarius"),
  aries: () => import("./emojis/EmojiAries"),
  "articulated-lorry": () => import("./emojis/EmojiArticulatedLorry"),
  artist: () => import("./emojis/EmojiArtist"),
  "artist-dark-skin-tone": () => import("./emojis/EmojiArtistDarkSkinTone"),
  "artist-light-skin-tone": () => import("./emojis/EmojiArtistLightSkinTone"),
  "artist-medium-dark-skin-tone": () => import("./emojis/EmojiArtistMediumDarkSkinTone"),
  "artist-medium-light-skin-tone": () => import("./emojis/EmojiArtistMediumLightSkinTone"),
  "artist-medium-skin-tone": () => import("./emojis/EmojiArtistMediumSkinTone"),
  "artist-palette": () => import("./emojis/EmojiArtistPalette"),
  asterisk: () => import("./emojis/EmojiAsterisk"),
  "astonished-face": () => import("./emojis/EmojiAstonishedFace"),
  astronaut: () => import("./emojis/EmojiAstronaut"),
  "astronaut-dark-skin-tone": () => import("./emojis/EmojiAstronautDarkSkinTone"),
  "astronaut-light-skin-tone": () => import("./emojis/EmojiAstronautLightSkinTone"),
  "astronaut-medium-dark-skin-tone": () => import("./emojis/EmojiAstronautMediumDarkSkinTone"),
  "astronaut-medium-light-skin-tone": () => import("./emojis/EmojiAstronautMediumLightSkinTone"),
  "astronaut-medium-skin-tone": () => import("./emojis/EmojiAstronautMediumSkinTone"),
  "atm-sign": () => import("./emojis/EmojiAtmSign"),
  "atom-symbol": () => import("./emojis/EmojiAtomSymbol"),
  "auto-rickshaw": () => import("./emojis/EmojiAutoRickshaw"),
  automobile: () => import("./emojis/EmojiAutomobile"),
  avocado: () => import("./emojis/EmojiAvocado"),
  axe: () => import("./emojis/EmojiAxe"),
  "b-button-blood-type": () => import("./emojis/EmojiBButtonBloodType"),
  baby: () => import("./emojis/EmojiBaby"),
  "baby-angel": () => import("./emojis/EmojiBabyAngel"),
  "baby-angel-dark-skin-tone": () => import("./emojis/EmojiBabyAngelDarkSkinTone"),
  "baby-angel-light-skin-tone": () => import("./emojis/EmojiBabyAngelLightSkinTone"),
  "baby-angel-medium-dark-skin-tone": () => import("./emojis/EmojiBabyAngelMediumDarkSkinTone"),
  "baby-angel-medium-light-skin-tone": () => import("./emojis/EmojiBabyAngelMediumLightSkinTone"),
  "baby-angel-medium-skin-tone": () => import("./emojis/EmojiBabyAngelMediumSkinTone"),
  "baby-bottle": () => import("./emojis/EmojiBabyBottle"),
  "baby-chick": () => import("./emojis/EmojiBabyChick"),
  "baby-dark-skin-tone": () => import("./emojis/EmojiBabyDarkSkinTone"),
  "baby-light-skin-tone": () => import("./emojis/EmojiBabyLightSkinTone"),
  "baby-medium-dark-skin-tone": () => import("./emojis/EmojiBabyMediumDarkSkinTone"),
  "baby-medium-light-skin-tone": () => import("./emojis/EmojiBabyMediumLightSkinTone"),
  "baby-medium-skin-tone": () => import("./emojis/EmojiBabyMediumSkinTone"),
  "baby-symbol": () => import("./emojis/EmojiBabySymbol"),
  "back-arrow": () => import("./emojis/EmojiBackArrow"),
  "backhand-index-pointing-down": () => import("./emojis/EmojiBackhandIndexPointingDown"),
  "backhand-index-pointing-down-dark-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingDownDarkSkinTone"),
  "backhand-index-pointing-down-light-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingDownLightSkinTone"),
  "backhand-index-pointing-down-medium-dark-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingDownMediumDarkSkinTone"),
  "backhand-index-pointing-down-medium-light-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingDownMediumLightSkinTone"),
  "backhand-index-pointing-down-medium-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingDownMediumSkinTone"),
  "backhand-index-pointing-left": () => import("./emojis/EmojiBackhandIndexPointingLeft"),
  "backhand-index-pointing-left-dark-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingLeftDarkSkinTone"),
  "backhand-index-pointing-left-light-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingLeftLightSkinTone"),
  "backhand-index-pointing-left-medium-dark-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingLeftMediumDarkSkinTone"),
  "backhand-index-pointing-left-medium-light-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingLeftMediumLightSkinTone"),
  "backhand-index-pointing-left-medium-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingLeftMediumSkinTone"),
  "backhand-index-pointing-right": () => import("./emojis/EmojiBackhandIndexPointingRight"),
  "backhand-index-pointing-right-dark-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingRightDarkSkinTone"),
  "backhand-index-pointing-right-light-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingRightLightSkinTone"),
  "backhand-index-pointing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingRightMediumDarkSkinTone"),
  "backhand-index-pointing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingRightMediumLightSkinTone"),
  "backhand-index-pointing-right-medium-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingRightMediumSkinTone"),
  "backhand-index-pointing-up": () => import("./emojis/EmojiBackhandIndexPointingUp"),
  "backhand-index-pointing-up-dark-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingUpDarkSkinTone"),
  "backhand-index-pointing-up-light-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingUpLightSkinTone"),
  "backhand-index-pointing-up-medium-dark-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingUpMediumDarkSkinTone"),
  "backhand-index-pointing-up-medium-light-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingUpMediumLightSkinTone"),
  "backhand-index-pointing-up-medium-skin-tone": () =>
    import("./emojis/EmojiBackhandIndexPointingUpMediumSkinTone"),
  backpack: () => import("./emojis/EmojiBackpack"),
  bacon: () => import("./emojis/EmojiBacon"),
  badger: () => import("./emojis/EmojiBadger"),
  badminton: () => import("./emojis/EmojiBadminton"),
  bagel: () => import("./emojis/EmojiBagel"),
  "baggage-claim": () => import("./emojis/EmojiBaggageClaim"),
  "baguette-bread": () => import("./emojis/EmojiBaguetteBread"),
  "balance-scale": () => import("./emojis/EmojiBalanceScale"),
  bald: () => import("./emojis/EmojiBald"),
  "ballet-dancer": () => import("./emojis/EmojiBalletDancer"),
  "ballet-dancer-dark-skin-tone": () => import("./emojis/EmojiBalletDancerDarkSkinTone"),
  "ballet-dancer-light-skin-tone": () => import("./emojis/EmojiBalletDancerLightSkinTone"),
  "ballet-dancer-medium-dark-skin-tone": () =>
    import("./emojis/EmojiBalletDancerMediumDarkSkinTone"),
  "ballet-dancer-medium-light-skin-tone": () =>
    import("./emojis/EmojiBalletDancerMediumLightSkinTone"),
  "ballet-dancer-medium-skin-tone": () => import("./emojis/EmojiBalletDancerMediumSkinTone"),
  "ballet-shoes": () => import("./emojis/EmojiBalletShoes"),
  balloon: () => import("./emojis/EmojiBalloon"),
  "ballot-box-with-ballot": () => import("./emojis/EmojiBallotBoxWithBallot"),
  banana: () => import("./emojis/EmojiBanana"),
  banjo: () => import("./emojis/EmojiBanjo"),
  bank: () => import("./emojis/EmojiBank"),
  "bar-chart": () => import("./emojis/EmojiBarChart"),
  "barber-pole": () => import("./emojis/EmojiBarberPole"),
  baseball: () => import("./emojis/EmojiBaseball"),
  basket: () => import("./emojis/EmojiBasket"),
  basketball: () => import("./emojis/EmojiBasketball"),
  bat: () => import("./emojis/EmojiBat"),
  bathtub: () => import("./emojis/EmojiBathtub"),
  battery: () => import("./emojis/EmojiBattery"),
  "beach-with-umbrella": () => import("./emojis/EmojiBeachWithUmbrella"),
  "beaming-face-with-smiling-eyes": () => import("./emojis/EmojiBeamingFaceWithSmilingEyes"),
  beans: () => import("./emojis/EmojiBeans"),
  bear: () => import("./emojis/EmojiBear"),
  "beating-heart": () => import("./emojis/EmojiBeatingHeart"),
  beaver: () => import("./emojis/EmojiBeaver"),
  bed: () => import("./emojis/EmojiBed"),
  "beer-mug": () => import("./emojis/EmojiBeerMug"),
  beetle: () => import("./emojis/EmojiBeetle"),
  bell: () => import("./emojis/EmojiBell"),
  "bell-pepper": () => import("./emojis/EmojiBellPepper"),
  "bell-with-slash": () => import("./emojis/EmojiBellWithSlash"),
  "bellhop-bell": () => import("./emojis/EmojiBellhopBell"),
  "bento-box": () => import("./emojis/EmojiBentoBox"),
  "beverage-box": () => import("./emojis/EmojiBeverageBox"),
  bicycle: () => import("./emojis/EmojiBicycle"),
  bikini: () => import("./emojis/EmojiBikini"),
  "billed-cap": () => import("./emojis/EmojiBilledCap"),
  biohazard: () => import("./emojis/EmojiBiohazard"),
  bird: () => import("./emojis/EmojiBird"),
  "birthday-cake": () => import("./emojis/EmojiBirthdayCake"),
  bison: () => import("./emojis/EmojiBison"),
  "biting-lip": () => import("./emojis/EmojiBitingLip"),
  "black-bird": () => import("./emojis/EmojiBlackBird"),
  "black-cat": () => import("./emojis/EmojiBlackCat"),
  "black-circle": () => import("./emojis/EmojiBlackCircle"),
  "black-flag": () => import("./emojis/EmojiBlackFlag"),
  "black-heart": () => import("./emojis/EmojiBlackHeart"),
  "black-large-square": () => import("./emojis/EmojiBlackLargeSquare"),
  "black-medium-small-square": () => import("./emojis/EmojiBlackMediumSmallSquare"),
  "black-medium-square": () => import("./emojis/EmojiBlackMediumSquare"),
  "black-nib": () => import("./emojis/EmojiBlackNib"),
  "black-small-square": () => import("./emojis/EmojiBlackSmallSquare"),
  "black-square-button": () => import("./emojis/EmojiBlackSquareButton"),
  blossom: () => import("./emojis/EmojiBlossom"),
  blowfish: () => import("./emojis/EmojiBlowfish"),
  "blue-book": () => import("./emojis/EmojiBlueBook"),
  "blue-circle": () => import("./emojis/EmojiBlueCircle"),
  "blue-heart": () => import("./emojis/EmojiBlueHeart"),
  "blue-square": () => import("./emojis/EmojiBlueSquare"),
  blueberries: () => import("./emojis/EmojiBlueberries"),
  boar: () => import("./emojis/EmojiBoar"),
  bomb: () => import("./emojis/EmojiBomb"),
  bone: () => import("./emojis/EmojiBone"),
  bookmark: () => import("./emojis/EmojiBookmark"),
  "bookmark-tabs": () => import("./emojis/EmojiBookmarkTabs"),
  books: () => import("./emojis/EmojiBooks"),
  boomerang: () => import("./emojis/EmojiBoomerang"),
  "bottle-with-popping-cork": () => import("./emojis/EmojiBottleWithPoppingCork"),
  bouquet: () => import("./emojis/EmojiBouquet"),
  "bow-and-arrow": () => import("./emojis/EmojiBowAndArrow"),
  "bowl-with-spoon": () => import("./emojis/EmojiBowlWithSpoon"),
  bowling: () => import("./emojis/EmojiBowling"),
  "boxing-glove": () => import("./emojis/EmojiBoxingGlove"),
  boy: () => import("./emojis/EmojiBoy"),
  "boy-dark-skin-tone": () => import("./emojis/EmojiBoyDarkSkinTone"),
  "boy-light-skin-tone": () => import("./emojis/EmojiBoyLightSkinTone"),
  "boy-medium-dark-skin-tone": () => import("./emojis/EmojiBoyMediumDarkSkinTone"),
  "boy-medium-light-skin-tone": () => import("./emojis/EmojiBoyMediumLightSkinTone"),
  "boy-medium-skin-tone": () => import("./emojis/EmojiBoyMediumSkinTone"),
  brain: () => import("./emojis/EmojiBrain"),
  bread: () => import("./emojis/EmojiBread"),
  "breast-feeding": () => import("./emojis/EmojiBreastFeeding"),
  "breast-feeding-dark-skin-tone": () => import("./emojis/EmojiBreastFeedingDarkSkinTone"),
  "breast-feeding-light-skin-tone": () => import("./emojis/EmojiBreastFeedingLightSkinTone"),
  "breast-feeding-medium-dark-skin-tone": () =>
    import("./emojis/EmojiBreastFeedingMediumDarkSkinTone"),
  "breast-feeding-medium-light-skin-tone": () =>
    import("./emojis/EmojiBreastFeedingMediumLightSkinTone"),
  "breast-feeding-medium-skin-tone": () => import("./emojis/EmojiBreastFeedingMediumSkinTone"),
  "breast-feeding-tone1": () => import("./emojis/EmojiBreastFeedingTone1"),
  "breast-feeding-tone2": () => import("./emojis/EmojiBreastFeedingTone2"),
  "breast-feeding-tone3": () => import("./emojis/EmojiBreastFeedingTone3"),
  "breast-feeding-tone4": () => import("./emojis/EmojiBreastFeedingTone4"),
  "breast-feeding-tone5": () => import("./emojis/EmojiBreastFeedingTone5"),
  brick: () => import("./emojis/EmojiBrick"),
  "bridge-at-night": () => import("./emojis/EmojiBridgeAtNight"),
  briefcase: () => import("./emojis/EmojiBriefcase"),
  briefs: () => import("./emojis/EmojiBriefs"),
  "bright-button": () => import("./emojis/EmojiBrightButton"),
  broccoli: () => import("./emojis/EmojiBroccoli"),
  "broken-chain": () => import("./emojis/EmojiBrokenChain"),
  "broken-heart": () => import("./emojis/EmojiBrokenHeart"),
  broom: () => import("./emojis/EmojiBroom"),
  "brown-circle": () => import("./emojis/EmojiBrownCircle"),
  "brown-heart": () => import("./emojis/EmojiBrownHeart"),
  "brown-mushroom": () => import("./emojis/EmojiBrownMushroom"),
  "brown-square": () => import("./emojis/EmojiBrownSquare"),
  "bubble-tea": () => import("./emojis/EmojiBubbleTea"),
  bubbles: () => import("./emojis/EmojiBubbles"),
  bucket: () => import("./emojis/EmojiBucket"),
  bug: () => import("./emojis/EmojiBug"),
  "building-construction": () => import("./emojis/EmojiBuildingConstruction"),
  "bullet-train": () => import("./emojis/EmojiBulletTrain"),
  bullseye: () => import("./emojis/EmojiBullseye"),
  burrito: () => import("./emojis/EmojiBurrito"),
  bus: () => import("./emojis/EmojiBus"),
  "bus-stop": () => import("./emojis/EmojiBusStop"),
  "bust-in-silhouette": () => import("./emojis/EmojiBustInSilhouette"),
  "busts-in-silhouette": () => import("./emojis/EmojiBustsInSilhouette"),
  butter: () => import("./emojis/EmojiButter"),
  butterfly: () => import("./emojis/EmojiButterfly"),
  cactus: () => import("./emojis/EmojiCactus"),
  calendar: () => import("./emojis/EmojiCalendar"),
  "call-me-hand": () => import("./emojis/EmojiCallMeHand"),
  "call-me-hand-dark-skin-tone": () => import("./emojis/EmojiCallMeHandDarkSkinTone"),
  "call-me-hand-light-skin-tone": () => import("./emojis/EmojiCallMeHandLightSkinTone"),
  "call-me-hand-medium-dark-skin-tone": () => import("./emojis/EmojiCallMeHandMediumDarkSkinTone"),
  "call-me-hand-medium-light-skin-tone": () =>
    import("./emojis/EmojiCallMeHandMediumLightSkinTone"),
  "call-me-hand-medium-skin-tone": () => import("./emojis/EmojiCallMeHandMediumSkinTone"),
  camel: () => import("./emojis/EmojiCamel"),
  camera: () => import("./emojis/EmojiCamera"),
  "camera-with-flash": () => import("./emojis/EmojiCameraWithFlash"),
  camping: () => import("./emojis/EmojiCamping"),
  cancer: () => import("./emojis/EmojiCancer"),
  candle: () => import("./emojis/EmojiCandle"),
  candy: () => import("./emojis/EmojiCandy"),
  "canned-food": () => import("./emojis/EmojiCannedFood"),
  canoe: () => import("./emojis/EmojiCanoe"),
  capricorn: () => import("./emojis/EmojiCapricorn"),
  "card-file-box": () => import("./emojis/EmojiCardFileBox"),
  "card-index": () => import("./emojis/EmojiCardIndex"),
  "card-index-dividers": () => import("./emojis/EmojiCardIndexDividers"),
  "carousel-horse": () => import("./emojis/EmojiCarouselHorse"),
  "carp-streamer": () => import("./emojis/EmojiCarpStreamer"),
  "carpentry-saw": () => import("./emojis/EmojiCarpentrySaw"),
  carrot: () => import("./emojis/EmojiCarrot"),
  castle: () => import("./emojis/EmojiCastle"),
  cat: () => import("./emojis/EmojiCat"),
  "cat-face": () => import("./emojis/EmojiCatFace"),
  "cat-with-tears-of-joy": () => import("./emojis/EmojiCatWithTearsOfJoy"),
  "cat-with-wry-smile": () => import("./emojis/EmojiCatWithWrySmile"),
  chains: () => import("./emojis/EmojiChains"),
  chair: () => import("./emojis/EmojiChair"),
  "chart-decreasing": () => import("./emojis/EmojiChartDecreasing"),
  "chart-increasing": () => import("./emojis/EmojiChartIncreasing"),
  "chart-increasing-with-yen": () => import("./emojis/EmojiChartIncreasingWithYen"),
  "check-box-with-check": () => import("./emojis/EmojiCheckBoxWithCheck"),
  "check-mark": () => import("./emojis/EmojiCheckMark"),
  "check-mark-button": () => import("./emojis/EmojiCheckMarkButton"),
  "cheese-wedge": () => import("./emojis/EmojiCheeseWedge"),
  "chequered-flag": () => import("./emojis/EmojiChequeredFlag"),
  cherries: () => import("./emojis/EmojiCherries"),
  "cherry-blossom": () => import("./emojis/EmojiCherryBlossom"),
  "chess-pawn": () => import("./emojis/EmojiChessPawn"),
  chestnut: () => import("./emojis/EmojiChestnut"),
  chicken: () => import("./emojis/EmojiChicken"),
  child: () => import("./emojis/EmojiChild"),
  "child-dark-skin-tone": () => import("./emojis/EmojiChildDarkSkinTone"),
  "child-light-skin-tone": () => import("./emojis/EmojiChildLightSkinTone"),
  "child-medium-dark-skin-tone": () => import("./emojis/EmojiChildMediumDarkSkinTone"),
  "child-medium-light-skin-tone": () => import("./emojis/EmojiChildMediumLightSkinTone"),
  "child-medium-skin-tone": () => import("./emojis/EmojiChildMediumSkinTone"),
  "children-crossing": () => import("./emojis/EmojiChildrenCrossing"),
  chipmunk: () => import("./emojis/EmojiChipmunk"),
  "chocolate-bar": () => import("./emojis/EmojiChocolateBar"),
  chopsticks: () => import("./emojis/EmojiChopsticks"),
  "christmas-tree": () => import("./emojis/EmojiChristmasTree"),
  church: () => import("./emojis/EmojiChurch"),
  cigarette: () => import("./emojis/EmojiCigarette"),
  cinema: () => import("./emojis/EmojiCinema"),
  "circled-m": () => import("./emojis/EmojiCircledM"),
  "circus-tent": () => import("./emojis/EmojiCircusTent"),
  cityscape: () => import("./emojis/EmojiCityscape"),
  "cityscape-at-dusk": () => import("./emojis/EmojiCityscapeAtDusk"),
  "cl-button": () => import("./emojis/EmojiClButton"),
  clamp: () => import("./emojis/EmojiClamp"),
  "clapper-board": () => import("./emojis/EmojiClapperBoard"),
  "clapping-hands": () => import("./emojis/EmojiClappingHands"),
  "clapping-hands-dark-skin-tone": () => import("./emojis/EmojiClappingHandsDarkSkinTone"),
  "clapping-hands-light-skin-tone": () => import("./emojis/EmojiClappingHandsLightSkinTone"),
  "clapping-hands-medium-dark-skin-tone": () =>
    import("./emojis/EmojiClappingHandsMediumDarkSkinTone"),
  "clapping-hands-medium-light-skin-tone": () =>
    import("./emojis/EmojiClappingHandsMediumLightSkinTone"),
  "clapping-hands-medium-skin-tone": () => import("./emojis/EmojiClappingHandsMediumSkinTone"),
  "classical-building": () => import("./emojis/EmojiClassicalBuilding"),
  "clinking-beer-mugs": () => import("./emojis/EmojiClinkingBeerMugs"),
  "clinking-glasses": () => import("./emojis/EmojiClinkingGlasses"),
  clipboard: () => import("./emojis/EmojiClipboard"),
  "clockwise-vertical-arrows": () => import("./emojis/EmojiClockwiseVerticalArrows"),
  "closed-book": () => import("./emojis/EmojiClosedBook"),
  "closed-mailbox-with-lowered-flag": () => import("./emojis/EmojiClosedMailboxWithLoweredFlag"),
  "closed-mailbox-with-raised-flag": () => import("./emojis/EmojiClosedMailboxWithRaisedFlag"),
  "closed-umbrella": () => import("./emojis/EmojiClosedUmbrella"),
  cloud: () => import("./emojis/EmojiCloud"),
  "cloud-with-lightning": () => import("./emojis/EmojiCloudWithLightning"),
  "cloud-with-lightning-and-rain": () => import("./emojis/EmojiCloudWithLightningAndRain"),
  "cloud-with-rain": () => import("./emojis/EmojiCloudWithRain"),
  "cloud-with-snow": () => import("./emojis/EmojiCloudWithSnow"),
  "clown-face": () => import("./emojis/EmojiClownFace"),
  "club-suit": () => import("./emojis/EmojiClubSuit"),
  "clutch-bag": () => import("./emojis/EmojiClutchBag"),
  coat: () => import("./emojis/EmojiCoat"),
  cockroach: () => import("./emojis/EmojiCockroach"),
  "cocktail-glass": () => import("./emojis/EmojiCocktailGlass"),
  coconut: () => import("./emojis/EmojiCoconut"),
  coffin: () => import("./emojis/EmojiCoffin"),
  coin: () => import("./emojis/EmojiCoin"),
  "cold-face": () => import("./emojis/EmojiColdFace"),
  collision: () => import("./emojis/EmojiCollision"),
  comet: () => import("./emojis/EmojiComet"),
  compass: () => import("./emojis/EmojiCompass"),
  "computer-disk": () => import("./emojis/EmojiComputerDisk"),
  "computer-mouse": () => import("./emojis/EmojiComputerMouse"),
  "confetti-ball": () => import("./emojis/EmojiConfettiBall"),
  "confounded-face": () => import("./emojis/EmojiConfoundedFace"),
  "confused-face": () => import("./emojis/EmojiConfusedFace"),
  construction: () => import("./emojis/EmojiConstruction"),
  "construction-worker": () => import("./emojis/EmojiConstructionWorker"),
  "construction-worker-dark-skin-tone": () =>
    import("./emojis/EmojiConstructionWorkerDarkSkinTone"),
  "construction-worker-light-skin-tone": () =>
    import("./emojis/EmojiConstructionWorkerLightSkinTone"),
  "construction-worker-medium-dark-skin-tone": () =>
    import("./emojis/EmojiConstructionWorkerMediumDarkSkinTone"),
  "construction-worker-medium-light-skin-tone": () =>
    import("./emojis/EmojiConstructionWorkerMediumLightSkinTone"),
  "construction-worker-medium-skin-tone": () =>
    import("./emojis/EmojiConstructionWorkerMediumSkinTone"),
  "control-knobs": () => import("./emojis/EmojiControlKnobs"),
  "convenience-store": () => import("./emojis/EmojiConvenienceStore"),
  cook: () => import("./emojis/EmojiCook"),
  "cook-dark-skin-tone": () => import("./emojis/EmojiCookDarkSkinTone"),
  "cook-light-skin-tone": () => import("./emojis/EmojiCookLightSkinTone"),
  "cook-medium-dark-skin-tone": () => import("./emojis/EmojiCookMediumDarkSkinTone"),
  "cook-medium-light-skin-tone": () => import("./emojis/EmojiCookMediumLightSkinTone"),
  "cook-medium-skin-tone": () => import("./emojis/EmojiCookMediumSkinTone"),
  "cooked-rice": () => import("./emojis/EmojiCookedRice"),
  cookie: () => import("./emojis/EmojiCookie"),
  cooking: () => import("./emojis/EmojiCooking"),
  "cool-button": () => import("./emojis/EmojiCoolButton"),
  copyright: () => import("./emojis/EmojiCopyright"),
  coral: () => import("./emojis/EmojiCoral"),
  "couch-and-lamp": () => import("./emojis/EmojiCouchAndLamp"),
  "counterclockwise-arrows-button": () => import("./emojis/EmojiCounterclockwiseArrowsButton"),
  "couple-with-heart": () => import("./emojis/EmojiCoupleWithHeart"),
  "couple-with-heart-dark-skin-tone": () => import("./emojis/EmojiCoupleWithHeartDarkSkinTone"),
  "couple-with-heart-light-skin-tone": () => import("./emojis/EmojiCoupleWithHeartLightSkinTone"),
  "couple-with-heart-man-man": () => import("./emojis/EmojiCoupleWithHeartManMan"),
  "couple-with-heart-man-man-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManDarkSkinTone"),
  "couple-with-heart-man-man-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManDarkSkinToneLightSkinTone"),
  "couple-with-heart-man-man-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManDarkSkinToneMediumDarkSkinTone"),
  "couple-with-heart-man-man-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManDarkSkinToneMediumLightSkinTone"),
  "couple-with-heart-man-man-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManDarkSkinToneMediumSkinTone"),
  "couple-with-heart-man-man-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManLightSkinTone"),
  "couple-with-heart-man-man-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManLightSkinToneDarkSkinTone"),
  "couple-with-heart-man-man-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManLightSkinToneMediumDarkSkinTone"),
  "couple-with-heart-man-man-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManLightSkinToneMediumLightSkinTone"),
  "couple-with-heart-man-man-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManLightSkinToneMediumSkinTone"),
  "couple-with-heart-man-man-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManMediumDarkSkinTone"),
  "couple-with-heart-man-man-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManMediumDarkSkinToneDarkSkinTone"),
  "couple-with-heart-man-man-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManMediumDarkSkinToneLightSkinTone"),
  "couple-with-heart-man-man-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManMediumDarkSkinToneMediumLightSkinTone"),
  "couple-with-heart-man-man-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManMediumDarkSkinToneMediumSkinTone"),
  "couple-with-heart-man-man-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManMediumLightSkinTone"),
  "couple-with-heart-man-man-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManMediumLightSkinToneDarkSkinTone"),
  "couple-with-heart-man-man-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManMediumLightSkinToneLightSkinTone"),
  "couple-with-heart-man-man-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManMediumLightSkinToneMediumDarkSkinTone"),
  "couple-with-heart-man-man-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManMediumLightSkinToneMediumSkinTone"),
  "couple-with-heart-man-man-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManMediumSkinTone"),
  "couple-with-heart-man-man-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManMediumSkinToneDarkSkinTone"),
  "couple-with-heart-man-man-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManMediumSkinToneLightSkinTone"),
  "couple-with-heart-man-man-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManMediumSkinToneMediumDarkSkinTone"),
  "couple-with-heart-man-man-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartManManMediumSkinToneMediumLightSkinTone"),
  "couple-with-heart-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartMediumDarkSkinTone"),
  "couple-with-heart-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartMediumLightSkinTone"),
  "couple-with-heart-medium-skin-tone": () => import("./emojis/EmojiCoupleWithHeartMediumSkinTone"),
  "couple-with-heart-person-person-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonDarkSkinToneLightSkinTone"),
  "couple-with-heart-person-person-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonDarkSkinToneMediumDarkSkinTone"),
  "couple-with-heart-person-person-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonDarkSkinToneMediumLightSkinTone"),
  "couple-with-heart-person-person-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonDarkSkinToneMediumSkinTone"),
  "couple-with-heart-person-person-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonLightSkinToneDarkSkinTone"),
  "couple-with-heart-person-person-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonLightSkinToneMediumDarkSkinTone"),
  "couple-with-heart-person-person-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonLightSkinToneMediumLightSkinTone"),
  "couple-with-heart-person-person-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonLightSkinToneMediumSkinTone"),
  "couple-with-heart-person-person-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonMediumDarkSkinToneDarkSkinTone"),
  "couple-with-heart-person-person-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonMediumDarkSkinToneLightSkinTone"),
  "couple-with-heart-person-person-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonMediumDarkSkinToneMediumLightSkinTone"),
  "couple-with-heart-person-person-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonMediumDarkSkinToneMediumSkinTone"),
  "couple-with-heart-person-person-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonMediumLightSkinToneDarkSkinTone"),
  "couple-with-heart-person-person-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonMediumLightSkinToneLightSkinTone"),
  "couple-with-heart-person-person-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonMediumLightSkinToneMediumDarkSkinTone"),
  "couple-with-heart-person-person-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonMediumLightSkinToneMediumSkinTone"),
  "couple-with-heart-person-person-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonMediumSkinToneDarkSkinTone"),
  "couple-with-heart-person-person-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonMediumSkinToneLightSkinTone"),
  "couple-with-heart-person-person-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonMediumSkinToneMediumDarkSkinTone"),
  "couple-with-heart-person-person-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartPersonPersonMediumSkinToneMediumLightSkinTone"),
  "couple-with-heart-woman-man": () => import("./emojis/EmojiCoupleWithHeartWomanMan"),
  "couple-with-heart-woman-man-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManDarkSkinTone"),
  "couple-with-heart-woman-man-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManDarkSkinToneLightSkinTone"),
  "couple-with-heart-woman-man-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManDarkSkinToneMediumDarkSkinTone"),
  "couple-with-heart-woman-man-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManDarkSkinToneMediumLightSkinTone"),
  "couple-with-heart-woman-man-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManDarkSkinToneMediumSkinTone"),
  "couple-with-heart-woman-man-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManLightSkinTone"),
  "couple-with-heart-woman-man-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManLightSkinToneDarkSkinTone"),
  "couple-with-heart-woman-man-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManLightSkinToneMediumDarkSkinTone"),
  "couple-with-heart-woman-man-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManLightSkinToneMediumLightSkinTone"),
  "couple-with-heart-woman-man-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManLightSkinToneMediumSkinTone"),
  "couple-with-heart-woman-man-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManMediumDarkSkinTone"),
  "couple-with-heart-woman-man-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManMediumDarkSkinToneDarkSkinTone"),
  "couple-with-heart-woman-man-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManMediumDarkSkinToneLightSkinTone"),
  "couple-with-heart-woman-man-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManMediumDarkSkinToneMediumLightSkinTone"),
  "couple-with-heart-woman-man-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManMediumDarkSkinToneMediumSkinTone"),
  "couple-with-heart-woman-man-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManMediumLightSkinTone"),
  "couple-with-heart-woman-man-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManMediumLightSkinToneDarkSkinTone"),
  "couple-with-heart-woman-man-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManMediumLightSkinToneLightSkinTone"),
  "couple-with-heart-woman-man-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManMediumLightSkinToneMediumDarkSkinTone"),
  "couple-with-heart-woman-man-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManMediumLightSkinToneMediumSkinTone"),
  "couple-with-heart-woman-man-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManMediumSkinTone"),
  "couple-with-heart-woman-man-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManMediumSkinToneDarkSkinTone"),
  "couple-with-heart-woman-man-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManMediumSkinToneLightSkinTone"),
  "couple-with-heart-woman-man-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManMediumSkinToneMediumDarkSkinTone"),
  "couple-with-heart-woman-man-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanManMediumSkinToneMediumLightSkinTone"),
  "couple-with-heart-woman-woman": () => import("./emojis/EmojiCoupleWithHeartWomanWoman"),
  "couple-with-heart-woman-woman-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanDarkSkinTone"),
  "couple-with-heart-woman-woman-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanDarkSkinToneLightSkinTone"),
  "couple-with-heart-woman-woman-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanDarkSkinToneMediumDarkSkinTone"),
  "couple-with-heart-woman-woman-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanDarkSkinToneMediumLightSkinTone"),
  "couple-with-heart-woman-woman-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanDarkSkinToneMediumSkinTone"),
  "couple-with-heart-woman-woman-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanLightSkinTone"),
  "couple-with-heart-woman-woman-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanLightSkinToneDarkSkinTone"),
  "couple-with-heart-woman-woman-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanLightSkinToneMediumDarkSkinTone"),
  "couple-with-heart-woman-woman-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanLightSkinToneMediumLightSkinTone"),
  "couple-with-heart-woman-woman-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanLightSkinToneMediumSkinTone"),
  "couple-with-heart-woman-woman-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanMediumDarkSkinTone"),
  "couple-with-heart-woman-woman-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanMediumDarkSkinToneDarkSkinTone"),
  "couple-with-heart-woman-woman-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanMediumDarkSkinToneLightSkinTone"),
  "couple-with-heart-woman-woman-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanMediumDarkSkinToneMediumLightSkinTone"),
  "couple-with-heart-woman-woman-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanMediumDarkSkinToneMediumSkinTone"),
  "couple-with-heart-woman-woman-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanMediumLightSkinTone"),
  "couple-with-heart-woman-woman-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanMediumLightSkinToneDarkSkinTone"),
  "couple-with-heart-woman-woman-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanMediumLightSkinToneLightSkinTone"),
  "couple-with-heart-woman-woman-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanMediumLightSkinToneMediumDarkSkinTone"),
  "couple-with-heart-woman-woman-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanMediumLightSkinToneMediumSkinTone"),
  "couple-with-heart-woman-woman-medium-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanMediumSkinTone"),
  "couple-with-heart-woman-woman-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanMediumSkinToneDarkSkinTone"),
  "couple-with-heart-woman-woman-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanMediumSkinToneLightSkinTone"),
  "couple-with-heart-woman-woman-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanMediumSkinToneMediumDarkSkinTone"),
  "couple-with-heart-woman-woman-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiCoupleWithHeartWomanWomanMediumSkinToneMediumLightSkinTone"),
  cow: () => import("./emojis/EmojiCow"),
  "cow-face": () => import("./emojis/EmojiCowFace"),
  "cowboy-hat-face": () => import("./emojis/EmojiCowboyHatFace"),
  crab: () => import("./emojis/EmojiCrab"),
  crayon: () => import("./emojis/EmojiCrayon"),
  "crazy-face": () => import("./emojis/EmojiCrazyFace"),
  "credit-card": () => import("./emojis/EmojiCreditCard"),
  "crescent-moon": () => import("./emojis/EmojiCrescentMoon"),
  cricket: () => import("./emojis/EmojiCricket"),
  "cricket-game": () => import("./emojis/EmojiCricketGame"),
  crocodile: () => import("./emojis/EmojiCrocodile"),
  croissant: () => import("./emojis/EmojiCroissant"),
  "cross-mark": () => import("./emojis/EmojiCrossMark"),
  "cross-mark-button": () => import("./emojis/EmojiCrossMarkButton"),
  "crossed-fingers": () => import("./emojis/EmojiCrossedFingers"),
  "crossed-fingers-dark-skin-tone": () => import("./emojis/EmojiCrossedFingersDarkSkinTone"),
  "crossed-fingers-light-skin-tone": () => import("./emojis/EmojiCrossedFingersLightSkinTone"),
  "crossed-fingers-medium-dark-skin-tone": () =>
    import("./emojis/EmojiCrossedFingersMediumDarkSkinTone"),
  "crossed-fingers-medium-light-skin-tone": () =>
    import("./emojis/EmojiCrossedFingersMediumLightSkinTone"),
  "crossed-fingers-medium-skin-tone": () => import("./emojis/EmojiCrossedFingersMediumSkinTone"),
  "crossed-flags": () => import("./emojis/EmojiCrossedFlags"),
  "crossed-swords": () => import("./emojis/EmojiCrossedSwords"),
  crown: () => import("./emojis/EmojiCrown"),
  crutch: () => import("./emojis/EmojiCrutch"),
  "crying-cat": () => import("./emojis/EmojiCryingCat"),
  "crying-face": () => import("./emojis/EmojiCryingFace"),
  "crystal-ball": () => import("./emojis/EmojiCrystalBall"),
  cucumber: () => import("./emojis/EmojiCucumber"),
  "cup-with-straw": () => import("./emojis/EmojiCupWithStraw"),
  cupcake: () => import("./emojis/EmojiCupcake"),
  "curling-stone": () => import("./emojis/EmojiCurlingStone"),
  "curly-haired": () => import("./emojis/EmojiCurlyHaired"),
  "curly-loop": () => import("./emojis/EmojiCurlyLoop"),
  "currency-exchange": () => import("./emojis/EmojiCurrencyExchange"),
  "curry-rice": () => import("./emojis/EmojiCurryRice"),
  custard: () => import("./emojis/EmojiCustard"),
  customs: () => import("./emojis/EmojiCustoms"),
  "cut-of-meat": () => import("./emojis/EmojiCutOfMeat"),
  cyclone: () => import("./emojis/EmojiCyclone"),
  dagger: () => import("./emojis/EmojiDagger"),
  dango: () => import("./emojis/EmojiDango"),
  "dark-skin-tone": () => import("./emojis/EmojiDarkSkinTone"),
  "dashing-away": () => import("./emojis/EmojiDashingAway"),
  "deaf-man": () => import("./emojis/EmojiDeafMan"),
  "deaf-man-dark-skin-tone": () => import("./emojis/EmojiDeafManDarkSkinTone"),
  "deaf-man-light-skin-tone": () => import("./emojis/EmojiDeafManLightSkinTone"),
  "deaf-man-medium-dark-skin-tone": () => import("./emojis/EmojiDeafManMediumDarkSkinTone"),
  "deaf-man-medium-light-skin-tone": () => import("./emojis/EmojiDeafManMediumLightSkinTone"),
  "deaf-man-medium-skin-tone": () => import("./emojis/EmojiDeafManMediumSkinTone"),
  "deaf-person": () => import("./emojis/EmojiDeafPerson"),
  "deaf-person-dark-skin-tone": () => import("./emojis/EmojiDeafPersonDarkSkinTone"),
  "deaf-person-light-skin-tone": () => import("./emojis/EmojiDeafPersonLightSkinTone"),
  "deaf-person-medium-dark-skin-tone": () => import("./emojis/EmojiDeafPersonMediumDarkSkinTone"),
  "deaf-person-medium-light-skin-tone": () => import("./emojis/EmojiDeafPersonMediumLightSkinTone"),
  "deaf-person-medium-skin-tone": () => import("./emojis/EmojiDeafPersonMediumSkinTone"),
  "deaf-woman": () => import("./emojis/EmojiDeafWoman"),
  "deaf-woman-dark-skin-tone": () => import("./emojis/EmojiDeafWomanDarkSkinTone"),
  "deaf-woman-light-skin-tone": () => import("./emojis/EmojiDeafWomanLightSkinTone"),
  "deaf-woman-medium-dark-skin-tone": () => import("./emojis/EmojiDeafWomanMediumDarkSkinTone"),
  "deaf-woman-medium-light-skin-tone": () => import("./emojis/EmojiDeafWomanMediumLightSkinTone"),
  "deaf-woman-medium-skin-tone": () => import("./emojis/EmojiDeafWomanMediumSkinTone"),
  "deciduous-tree": () => import("./emojis/EmojiDeciduousTree"),
  deer: () => import("./emojis/EmojiDeer"),
  "delivery-truck": () => import("./emojis/EmojiDeliveryTruck"),
  "department-store": () => import("./emojis/EmojiDepartmentStore"),
  "derelict-house": () => import("./emojis/EmojiDerelictHouse"),
  desert: () => import("./emojis/EmojiDesert"),
  "desert-island": () => import("./emojis/EmojiDesertIsland"),
  "desktop-computer": () => import("./emojis/EmojiDesktopComputer"),
  detective: () => import("./emojis/EmojiDetective"),
  "detective-dark-skin-tone": () => import("./emojis/EmojiDetectiveDarkSkinTone"),
  "detective-light-skin-tone": () => import("./emojis/EmojiDetectiveLightSkinTone"),
  "detective-medium-dark-skin-tone": () => import("./emojis/EmojiDetectiveMediumDarkSkinTone"),
  "detective-medium-light-skin-tone": () => import("./emojis/EmojiDetectiveMediumLightSkinTone"),
  "detective-medium-skin-tone": () => import("./emojis/EmojiDetectiveMediumSkinTone"),
  "diamond-suit": () => import("./emojis/EmojiDiamondSuit"),
  "diamond-with-a-dot": () => import("./emojis/EmojiDiamondWithADot"),
  "digit-eight": () => import("./emojis/EmojiDigitEight"),
  "digit-five": () => import("./emojis/EmojiDigitFive"),
  "digit-four": () => import("./emojis/EmojiDigitFour"),
  "digit-nine": () => import("./emojis/EmojiDigitNine"),
  "digit-one": () => import("./emojis/EmojiDigitOne"),
  "digit-seven": () => import("./emojis/EmojiDigitSeven"),
  "digit-six": () => import("./emojis/EmojiDigitSix"),
  "digit-three": () => import("./emojis/EmojiDigitThree"),
  "digit-two": () => import("./emojis/EmojiDigitTwo"),
  "digit-zero": () => import("./emojis/EmojiDigitZero"),
  "dim-button": () => import("./emojis/EmojiDimButton"),
  "disappointed-but-relieved-face": () => import("./emojis/EmojiDisappointedButRelievedFace"),
  "disappointed-face": () => import("./emojis/EmojiDisappointedFace"),
  "disguised-face": () => import("./emojis/EmojiDisguisedFace"),
  "distorted-face": () => import("./emojis/EmojiDistortedFace"),
  divide: () => import("./emojis/EmojiDivide"),
  "diving-mask": () => import("./emojis/EmojiDivingMask"),
  "diya-lamp": () => import("./emojis/EmojiDiyaLamp"),
  dizzy: () => import("./emojis/EmojiDizzy"),
  dna: () => import("./emojis/EmojiDna"),
  dodo: () => import("./emojis/EmojiDodo"),
  dog: () => import("./emojis/EmojiDog"),
  "dog-face": () => import("./emojis/EmojiDogFace"),
  "dollar-banknote": () => import("./emojis/EmojiDollarBanknote"),
  dolphin: () => import("./emojis/EmojiDolphin"),
  donkey: () => import("./emojis/EmojiDonkey"),
  door: () => import("./emojis/EmojiDoor"),
  "dotted-line-face": () => import("./emojis/EmojiDottedLineFace"),
  "dotted-six-pointed-star": () => import("./emojis/EmojiDottedSixPointedStar"),
  "double-curly-loop": () => import("./emojis/EmojiDoubleCurlyLoop"),
  "double-exclamation-mark": () => import("./emojis/EmojiDoubleExclamationMark"),
  doughnut: () => import("./emojis/EmojiDoughnut"),
  dove: () => import("./emojis/EmojiDove"),
  "down-arrow": () => import("./emojis/EmojiDownArrow"),
  "down-left-arrow": () => import("./emojis/EmojiDownLeftArrow"),
  "down-right-arrow": () => import("./emojis/EmojiDownRightArrow"),
  "downcast-face-with-sweat": () => import("./emojis/EmojiDowncastFaceWithSweat"),
  "downwards-button": () => import("./emojis/EmojiDownwardsButton"),
  dragon: () => import("./emojis/EmojiDragon"),
  "dragon-face": () => import("./emojis/EmojiDragonFace"),
  dress: () => import("./emojis/EmojiDress"),
  "drooling-face": () => import("./emojis/EmojiDroolingFace"),
  "drop-of-blood": () => import("./emojis/EmojiDropOfBlood"),
  droplet: () => import("./emojis/EmojiDroplet"),
  drum: () => import("./emojis/EmojiDrum"),
  duck: () => import("./emojis/EmojiDuck"),
  dumpling: () => import("./emojis/EmojiDumpling"),
  dvd: () => import("./emojis/EmojiDvd"),
  "e-mail": () => import("./emojis/EmojiEMail"),
  eagle: () => import("./emojis/EmojiEagle"),
  ear: () => import("./emojis/EmojiEar"),
  "ear-dark-skin-tone": () => import("./emojis/EmojiEarDarkSkinTone"),
  "ear-light-skin-tone": () => import("./emojis/EmojiEarLightSkinTone"),
  "ear-medium-dark-skin-tone": () => import("./emojis/EmojiEarMediumDarkSkinTone"),
  "ear-medium-light-skin-tone": () => import("./emojis/EmojiEarMediumLightSkinTone"),
  "ear-medium-skin-tone": () => import("./emojis/EmojiEarMediumSkinTone"),
  "ear-of-corn": () => import("./emojis/EmojiEarOfCorn"),
  "ear-with-hearing-aid": () => import("./emojis/EmojiEarWithHearingAid"),
  "ear-with-hearing-aid-dark-skin-tone": () =>
    import("./emojis/EmojiEarWithHearingAidDarkSkinTone"),
  "ear-with-hearing-aid-light-skin-tone": () =>
    import("./emojis/EmojiEarWithHearingAidLightSkinTone"),
  "ear-with-hearing-aid-medium-dark-skin-tone": () =>
    import("./emojis/EmojiEarWithHearingAidMediumDarkSkinTone"),
  "ear-with-hearing-aid-medium-light-skin-tone": () =>
    import("./emojis/EmojiEarWithHearingAidMediumLightSkinTone"),
  "ear-with-hearing-aid-medium-skin-tone": () =>
    import("./emojis/EmojiEarWithHearingAidMediumSkinTone"),
  egg: () => import("./emojis/EmojiEgg"),
  eggplant: () => import("./emojis/EmojiEggplant"),
  "eight-oclock": () => import("./emojis/EmojiEightOclock"),
  "eight-pointed-star": () => import("./emojis/EmojiEightPointedStar"),
  "eight-spoked-asterisk": () => import("./emojis/EmojiEightSpokedAsterisk"),
  "eight-thirty": () => import("./emojis/EmojiEightThirty"),
  "eject-button": () => import("./emojis/EmojiEjectButton"),
  "electric-plug": () => import("./emojis/EmojiElectricPlug"),
  elephant: () => import("./emojis/EmojiElephant"),
  elevator: () => import("./emojis/EmojiElevator"),
  "eleven-oclock": () => import("./emojis/EmojiElevenOclock"),
  "eleven-thirty": () => import("./emojis/EmojiElevenThirty"),
  elf: () => import("./emojis/EmojiElf"),
  "elf-dark-skin-tone": () => import("./emojis/EmojiElfDarkSkinTone"),
  "elf-light-skin-tone": () => import("./emojis/EmojiElfLightSkinTone"),
  "elf-medium-dark-skin-tone": () => import("./emojis/EmojiElfMediumDarkSkinTone"),
  "elf-medium-light-skin-tone": () => import("./emojis/EmojiElfMediumLightSkinTone"),
  "elf-medium-skin-tone": () => import("./emojis/EmojiElfMediumSkinTone"),
  "empty-nest": () => import("./emojis/EmojiEmptyNest"),
  "end-arrow": () => import("./emojis/EmojiEndArrow"),
  "enraged-face": () => import("./emojis/EmojiEnragedFace"),
  envelope: () => import("./emojis/EmojiEnvelope"),
  "envelope-with-arrow": () => import("./emojis/EmojiEnvelopeWithArrow"),
  "euro-banknote": () => import("./emojis/EmojiEuroBanknote"),
  "evergreen-tree": () => import("./emojis/EmojiEvergreenTree"),
  ewe: () => import("./emojis/EmojiEwe"),
  "exclamation-question-mark": () => import("./emojis/EmojiExclamationQuestionMark"),
  "exploding-head": () => import("./emojis/EmojiExplodingHead"),
  "expressionless-face": () => import("./emojis/EmojiExpressionlessFace"),
  eye: () => import("./emojis/EmojiEye"),
  "eye-in-speech-bubble": () => import("./emojis/EmojiEyeInSpeechBubble"),
  eyes: () => import("./emojis/EmojiEyes"),
  "face-blowing-a-kiss": () => import("./emojis/EmojiFaceBlowingAKiss"),
  "face-exhaling": () => import("./emojis/EmojiFaceExhaling"),
  "face-holding-back-tears": () => import("./emojis/EmojiFaceHoldingBackTears"),
  "face-in-clouds": () => import("./emojis/EmojiFaceInClouds"),
  "face-savoring-food": () => import("./emojis/EmojiFaceSavoringFood"),
  "face-savouring-delicious-food": () => import("./emojis/EmojiFaceSavouringDeliciousFood"),
  "face-screaming-in-fear": () => import("./emojis/EmojiFaceScreamingInFear"),
  "face-vomiting": () => import("./emojis/EmojiFaceVomiting"),
  "face-with-bags-under-eyes": () => import("./emojis/EmojiFaceWithBagsUnderEyes"),
  "face-with-cold-sweat": () => import("./emojis/EmojiFaceWithColdSweat"),
  "face-with-crossed-out-eyes": () => import("./emojis/EmojiFaceWithCrossedOutEyes"),
  "face-with-diagonal-mouth": () => import("./emojis/EmojiFaceWithDiagonalMouth"),
  "face-with-hand-over-mouth": () => import("./emojis/EmojiFaceWithHandOverMouth"),
  "face-with-head-bandage": () => import("./emojis/EmojiFaceWithHeadBandage"),
  "face-with-medical-mask": () => import("./emojis/EmojiFaceWithMedicalMask"),
  "face-with-monocle": () => import("./emojis/EmojiFaceWithMonocle"),
  "face-with-open-eyes-and-hand-over-mouth": () =>
    import("./emojis/EmojiFaceWithOpenEyesAndHandOverMouth"),
  "face-with-open-mouth": () => import("./emojis/EmojiFaceWithOpenMouth"),
  "face-with-open-mouth-and-cold-sweat": () =>
    import("./emojis/EmojiFaceWithOpenMouthAndColdSweat"),
  "face-with-peeking-eye": () => import("./emojis/EmojiFaceWithPeekingEye"),
  "face-with-raised-eyebrow": () => import("./emojis/EmojiFaceWithRaisedEyebrow"),
  "face-with-rolling-eyes": () => import("./emojis/EmojiFaceWithRollingEyes"),
  "face-with-spiral-eyes": () => import("./emojis/EmojiFaceWithSpiralEyes"),
  "face-with-steam-from-nose": () => import("./emojis/EmojiFaceWithSteamFromNose"),
  "face-with-stuck-out-tongue": () => import("./emojis/EmojiFaceWithStuckOutTongue"),
  "face-with-stuck-out-tongue-and-closed-eyes": () =>
    import("./emojis/EmojiFaceWithStuckOutTongueAndClosedEyes"),
  "face-with-stuck-out-tongue-and-winking-eye": () =>
    import("./emojis/EmojiFaceWithStuckOutTongueAndWinkingEye"),
  "face-with-symbols-on-mouth": () => import("./emojis/EmojiFaceWithSymbolsOnMouth"),
  "face-with-symbols-over-mouth": () => import("./emojis/EmojiFaceWithSymbolsOverMouth"),
  "face-with-tears-of-joy": () => import("./emojis/EmojiFaceWithTearsOfJoy"),
  "face-with-thermometer": () => import("./emojis/EmojiFaceWithThermometer"),
  "face-with-tongue": () => import("./emojis/EmojiFaceWithTongue"),
  "face-without-mouth": () => import("./emojis/EmojiFaceWithoutMouth"),
  factory: () => import("./emojis/EmojiFactory"),
  "factory-worker": () => import("./emojis/EmojiFactoryWorker"),
  "factory-worker-dark-skin-tone": () => import("./emojis/EmojiFactoryWorkerDarkSkinTone"),
  "factory-worker-light-skin-tone": () => import("./emojis/EmojiFactoryWorkerLightSkinTone"),
  "factory-worker-medium-dark-skin-tone": () =>
    import("./emojis/EmojiFactoryWorkerMediumDarkSkinTone"),
  "factory-worker-medium-light-skin-tone": () =>
    import("./emojis/EmojiFactoryWorkerMediumLightSkinTone"),
  "factory-worker-medium-skin-tone": () => import("./emojis/EmojiFactoryWorkerMediumSkinTone"),
  fairy: () => import("./emojis/EmojiFairy"),
  "fairy-dark-skin-tone": () => import("./emojis/EmojiFairyDarkSkinTone"),
  "fairy-light-skin-tone": () => import("./emojis/EmojiFairyLightSkinTone"),
  "fairy-medium-dark-skin-tone": () => import("./emojis/EmojiFairyMediumDarkSkinTone"),
  "fairy-medium-light-skin-tone": () => import("./emojis/EmojiFairyMediumLightSkinTone"),
  "fairy-medium-skin-tone": () => import("./emojis/EmojiFairyMediumSkinTone"),
  falafel: () => import("./emojis/EmojiFalafel"),
  "fallen-leaf": () => import("./emojis/EmojiFallenLeaf"),
  family: () => import("./emojis/EmojiFamily"),
  "family-adult-adult-child": () => import("./emojis/EmojiFamilyAdultAdultChild"),
  "family-adult-adult-child-child": () => import("./emojis/EmojiFamilyAdultAdultChildChild"),
  "family-adult-child": () => import("./emojis/EmojiFamilyAdultChild"),
  "family-adult-child-child": () => import("./emojis/EmojiFamilyAdultChildChild"),
  "family-man-boy": () => import("./emojis/EmojiFamilyManBoy"),
  "family-man-boy-boy": () => import("./emojis/EmojiFamilyManBoyBoy"),
  "family-man-girl": () => import("./emojis/EmojiFamilyManGirl"),
  "family-man-girl-boy": () => import("./emojis/EmojiFamilyManGirlBoy"),
  "family-man-girl-girl": () => import("./emojis/EmojiFamilyManGirlGirl"),
  "family-man-man-boy": () => import("./emojis/EmojiFamilyManManBoy"),
  "family-man-man-boy-boy": () => import("./emojis/EmojiFamilyManManBoyBoy"),
  "family-man-man-girl": () => import("./emojis/EmojiFamilyManManGirl"),
  "family-man-man-girl-boy": () => import("./emojis/EmojiFamilyManManGirlBoy"),
  "family-man-man-girl-girl": () => import("./emojis/EmojiFamilyManManGirlGirl"),
  "family-man-woman-boy": () => import("./emojis/EmojiFamilyManWomanBoy"),
  "family-man-woman-boy-boy": () => import("./emojis/EmojiFamilyManWomanBoyBoy"),
  "family-man-woman-girl": () => import("./emojis/EmojiFamilyManWomanGirl"),
  "family-man-woman-girl-boy": () => import("./emojis/EmojiFamilyManWomanGirlBoy"),
  "family-man-woman-girl-girl": () => import("./emojis/EmojiFamilyManWomanGirlGirl"),
  "family-woman-boy": () => import("./emojis/EmojiFamilyWomanBoy"),
  "family-woman-boy-boy": () => import("./emojis/EmojiFamilyWomanBoyBoy"),
  "family-woman-girl": () => import("./emojis/EmojiFamilyWomanGirl"),
  "family-woman-girl-boy": () => import("./emojis/EmojiFamilyWomanGirlBoy"),
  "family-woman-girl-girl": () => import("./emojis/EmojiFamilyWomanGirlGirl"),
  "family-woman-woman-boy": () => import("./emojis/EmojiFamilyWomanWomanBoy"),
  "family-woman-woman-boy-boy": () => import("./emojis/EmojiFamilyWomanWomanBoyBoy"),
  "family-woman-woman-girl": () => import("./emojis/EmojiFamilyWomanWomanGirl"),
  "family-woman-woman-girl-boy": () => import("./emojis/EmojiFamilyWomanWomanGirlBoy"),
  "family-woman-woman-girl-girl": () => import("./emojis/EmojiFamilyWomanWomanGirlGirl"),
  farmer: () => import("./emojis/EmojiFarmer"),
  "farmer-dark-skin-tone": () => import("./emojis/EmojiFarmerDarkSkinTone"),
  "farmer-light-skin-tone": () => import("./emojis/EmojiFarmerLightSkinTone"),
  "farmer-medium-dark-skin-tone": () => import("./emojis/EmojiFarmerMediumDarkSkinTone"),
  "farmer-medium-light-skin-tone": () => import("./emojis/EmojiFarmerMediumLightSkinTone"),
  "farmer-medium-skin-tone": () => import("./emojis/EmojiFarmerMediumSkinTone"),
  "fast-down-button": () => import("./emojis/EmojiFastDownButton"),
  "fast-forward-button": () => import("./emojis/EmojiFastForwardButton"),
  "fast-reverse-button": () => import("./emojis/EmojiFastReverseButton"),
  "fast-up-button": () => import("./emojis/EmojiFastUpButton"),
  "fax-machine": () => import("./emojis/EmojiFaxMachine"),
  "fearful-face": () => import("./emojis/EmojiFearfulFace"),
  feather: () => import("./emojis/EmojiFeather"),
  "female-sign": () => import("./emojis/EmojiFemaleSign"),
  "ferris-wheel": () => import("./emojis/EmojiFerrisWheel"),
  ferry: () => import("./emojis/EmojiFerry"),
  "field-hockey": () => import("./emojis/EmojiFieldHockey"),
  "fight-cloud": () => import("./emojis/EmojiFightCloud"),
  "file-cabinet": () => import("./emojis/EmojiFileCabinet"),
  "file-folder": () => import("./emojis/EmojiFileFolder"),
  "film-frames": () => import("./emojis/EmojiFilmFrames"),
  "film-projector": () => import("./emojis/EmojiFilmProjector"),
  fingerprint: () => import("./emojis/EmojiFingerprint"),
  fire: () => import("./emojis/EmojiFire"),
  "fire-engine": () => import("./emojis/EmojiFireEngine"),
  "fire-extinguisher": () => import("./emojis/EmojiFireExtinguisher"),
  firecracker: () => import("./emojis/EmojiFirecracker"),
  firefighter: () => import("./emojis/EmojiFirefighter"),
  "firefighter-dark-skin-tone": () => import("./emojis/EmojiFirefighterDarkSkinTone"),
  "firefighter-light-skin-tone": () => import("./emojis/EmojiFirefighterLightSkinTone"),
  "firefighter-medium-dark-skin-tone": () => import("./emojis/EmojiFirefighterMediumDarkSkinTone"),
  "firefighter-medium-light-skin-tone": () =>
    import("./emojis/EmojiFirefighterMediumLightSkinTone"),
  "firefighter-medium-skin-tone": () => import("./emojis/EmojiFirefighterMediumSkinTone"),
  fireworks: () => import("./emojis/EmojiFireworks"),
  "first-quarter-moon": () => import("./emojis/EmojiFirstQuarterMoon"),
  "first-quarter-moon-face": () => import("./emojis/EmojiFirstQuarterMoonFace"),
  "first-quarter-moon-with-face": () => import("./emojis/EmojiFirstQuarterMoonWithFace"),
  fish: () => import("./emojis/EmojiFish"),
  "fish-cake-with-swirl": () => import("./emojis/EmojiFishCakeWithSwirl"),
  "fishing-pole": () => import("./emojis/EmojiFishingPole"),
  "five-oclock": () => import("./emojis/EmojiFiveOclock"),
  "five-thirty": () => import("./emojis/EmojiFiveThirty"),
  "flag-in-hole": () => import("./emojis/EmojiFlagInHole"),
  "flag-martinique": () => import("./emojis/EmojiFlagMartinique"),
  flamingo: () => import("./emojis/EmojiFlamingo"),
  flashlight: () => import("./emojis/EmojiFlashlight"),
  "flat-shoe": () => import("./emojis/EmojiFlatShoe"),
  flatbread: () => import("./emojis/EmojiFlatbread"),
  "fleur-de-lis": () => import("./emojis/EmojiFleurDeLis"),
  "flexed-biceps": () => import("./emojis/EmojiFlexedBiceps"),
  "flexed-biceps-dark-skin-tone": () => import("./emojis/EmojiFlexedBicepsDarkSkinTone"),
  "flexed-biceps-light-skin-tone": () => import("./emojis/EmojiFlexedBicepsLightSkinTone"),
  "flexed-biceps-medium-dark-skin-tone": () =>
    import("./emojis/EmojiFlexedBicepsMediumDarkSkinTone"),
  "flexed-biceps-medium-light-skin-tone": () =>
    import("./emojis/EmojiFlexedBicepsMediumLightSkinTone"),
  "flexed-biceps-medium-skin-tone": () => import("./emojis/EmojiFlexedBicepsMediumSkinTone"),
  "floppy-disk": () => import("./emojis/EmojiFloppyDisk"),
  "flower-playing-cards": () => import("./emojis/EmojiFlowerPlayingCards"),
  "flushed-face": () => import("./emojis/EmojiFlushedFace"),
  flute: () => import("./emojis/EmojiFlute"),
  fly: () => import("./emojis/EmojiFly"),
  "flying-disc": () => import("./emojis/EmojiFlyingDisc"),
  "flying-saucer": () => import("./emojis/EmojiFlyingSaucer"),
  fog: () => import("./emojis/EmojiFog"),
  foggy: () => import("./emojis/EmojiFoggy"),
  "folded-hands": () => import("./emojis/EmojiFoldedHands"),
  "folded-hands-dark-skin-tone": () => import("./emojis/EmojiFoldedHandsDarkSkinTone"),
  "folded-hands-light-skin-tone": () => import("./emojis/EmojiFoldedHandsLightSkinTone"),
  "folded-hands-medium-dark-skin-tone": () => import("./emojis/EmojiFoldedHandsMediumDarkSkinTone"),
  "folded-hands-medium-light-skin-tone": () =>
    import("./emojis/EmojiFoldedHandsMediumLightSkinTone"),
  "folded-hands-medium-skin-tone": () => import("./emojis/EmojiFoldedHandsMediumSkinTone"),
  "folding-hand-fan": () => import("./emojis/EmojiFoldingHandFan"),
  fondue: () => import("./emojis/EmojiFondue"),
  foot: () => import("./emojis/EmojiFoot"),
  "foot-dark-skin-tone": () => import("./emojis/EmojiFootDarkSkinTone"),
  "foot-light-skin-tone": () => import("./emojis/EmojiFootLightSkinTone"),
  "foot-medium-dark-skin-tone": () => import("./emojis/EmojiFootMediumDarkSkinTone"),
  "foot-medium-light-skin-tone": () => import("./emojis/EmojiFootMediumLightSkinTone"),
  "foot-medium-skin-tone": () => import("./emojis/EmojiFootMediumSkinTone"),
  footprints: () => import("./emojis/EmojiFootprints"),
  "fork-and-knife": () => import("./emojis/EmojiForkAndKnife"),
  "fork-and-knife-with-plate": () => import("./emojis/EmojiForkAndKnifeWithPlate"),
  "fortune-cookie": () => import("./emojis/EmojiFortuneCookie"),
  fountain: () => import("./emojis/EmojiFountain"),
  "fountain-pen": () => import("./emojis/EmojiFountainPen"),
  "four-leaf-clover": () => import("./emojis/EmojiFourLeafClover"),
  "four-oclock": () => import("./emojis/EmojiFourOclock"),
  "four-thirty": () => import("./emojis/EmojiFourThirty"),
  fox: () => import("./emojis/EmojiFox"),
  "framed-picture": () => import("./emojis/EmojiFramedPicture"),
  "free-button": () => import("./emojis/EmojiFreeButton"),
  "french-fries": () => import("./emojis/EmojiFrenchFries"),
  "fried-shrimp": () => import("./emojis/EmojiFriedShrimp"),
  frog: () => import("./emojis/EmojiFrog"),
  "front-facing-baby-chick": () => import("./emojis/EmojiFrontFacingBabyChick"),
  "frowning-face": () => import("./emojis/EmojiFrowningFace"),
  "frowning-face-with-open-mouth": () => import("./emojis/EmojiFrowningFaceWithOpenMouth"),
  "fuel-pump": () => import("./emojis/EmojiFuelPump"),
  "full-moon": () => import("./emojis/EmojiFullMoon"),
  "full-moon-face": () => import("./emojis/EmojiFullMoonFace"),
  "full-moon-with-face": () => import("./emojis/EmojiFullMoonWithFace"),
  "funeral-urn": () => import("./emojis/EmojiFuneralUrn"),
  "game-die": () => import("./emojis/EmojiGameDie"),
  garlic: () => import("./emojis/EmojiGarlic"),
  gear: () => import("./emojis/EmojiGear"),
  "gem-stone": () => import("./emojis/EmojiGemStone"),
  gemini: () => import("./emojis/EmojiGemini"),
  genie: () => import("./emojis/EmojiGenie"),
  ghost: () => import("./emojis/EmojiGhost"),
  "ginger-root": () => import("./emojis/EmojiGingerRoot"),
  giraffe: () => import("./emojis/EmojiGiraffe"),
  girl: () => import("./emojis/EmojiGirl"),
  "girl-dark-skin-tone": () => import("./emojis/EmojiGirlDarkSkinTone"),
  "girl-light-skin-tone": () => import("./emojis/EmojiGirlLightSkinTone"),
  "girl-medium-dark-skin-tone": () => import("./emojis/EmojiGirlMediumDarkSkinTone"),
  "girl-medium-light-skin-tone": () => import("./emojis/EmojiGirlMediumLightSkinTone"),
  "girl-medium-skin-tone": () => import("./emojis/EmojiGirlMediumSkinTone"),
  "glass-of-milk": () => import("./emojis/EmojiGlassOfMilk"),
  glasses: () => import("./emojis/EmojiGlasses"),
  "globe-showing-americas": () => import("./emojis/EmojiGlobeShowingAmericas"),
  "globe-showing-asia-australia": () => import("./emojis/EmojiGlobeShowingAsiaAustralia"),
  "globe-showing-europe-africa": () => import("./emojis/EmojiGlobeShowingEuropeAfrica"),
  "globe-with-meridians": () => import("./emojis/EmojiGlobeWithMeridians"),
  gloves: () => import("./emojis/EmojiGloves"),
  "glowing-star": () => import("./emojis/EmojiGlowingStar"),
  "goal-net": () => import("./emojis/EmojiGoalNet"),
  goat: () => import("./emojis/EmojiGoat"),
  goblin: () => import("./emojis/EmojiGoblin"),
  goggles: () => import("./emojis/EmojiGoggles"),
  goose: () => import("./emojis/EmojiGoose"),
  gorilla: () => import("./emojis/EmojiGorilla"),
  "graduation-cap": () => import("./emojis/EmojiGraduationCap"),
  grapes: () => import("./emojis/EmojiGrapes"),
  "green-apple": () => import("./emojis/EmojiGreenApple"),
  "green-book": () => import("./emojis/EmojiGreenBook"),
  "green-circle": () => import("./emojis/EmojiGreenCircle"),
  "green-heart": () => import("./emojis/EmojiGreenHeart"),
  "green-salad": () => import("./emojis/EmojiGreenSalad"),
  "green-square": () => import("./emojis/EmojiGreenSquare"),
  "grey-heart": () => import("./emojis/EmojiGreyHeart"),
  "grimacing-face": () => import("./emojis/EmojiGrimacingFace"),
  "grinning-cat": () => import("./emojis/EmojiGrinningCat"),
  "grinning-cat-with-smiling-eyes": () => import("./emojis/EmojiGrinningCatWithSmilingEyes"),
  "grinning-face": () => import("./emojis/EmojiGrinningFace"),
  "grinning-face-with-big-eyes": () => import("./emojis/EmojiGrinningFaceWithBigEyes"),
  "grinning-face-with-smiling-eyes": () => import("./emojis/EmojiGrinningFaceWithSmilingEyes"),
  "grinning-face-with-sweat": () => import("./emojis/EmojiGrinningFaceWithSweat"),
  "grinning-squinting-face": () => import("./emojis/EmojiGrinningSquintingFace"),
  "growing-heart": () => import("./emojis/EmojiGrowingHeart"),
  guard: () => import("./emojis/EmojiGuard"),
  "guard-dark-skin-tone": () => import("./emojis/EmojiGuardDarkSkinTone"),
  "guard-light-skin-tone": () => import("./emojis/EmojiGuardLightSkinTone"),
  "guard-medium-dark-skin-tone": () => import("./emojis/EmojiGuardMediumDarkSkinTone"),
  "guard-medium-light-skin-tone": () => import("./emojis/EmojiGuardMediumLightSkinTone"),
  "guard-medium-skin-tone": () => import("./emojis/EmojiGuardMediumSkinTone"),
  "guide-dog": () => import("./emojis/EmojiGuideDog"),
  guitar: () => import("./emojis/EmojiGuitar"),
  "hair-pick": () => import("./emojis/EmojiHairPick"),
  "hairy-creature": () => import("./emojis/EmojiHairyCreature"),
  hamburger: () => import("./emojis/EmojiHamburger"),
  hammer: () => import("./emojis/EmojiHammer"),
  "hammer-and-pick": () => import("./emojis/EmojiHammerAndPick"),
  "hammer-and-wrench": () => import("./emojis/EmojiHammerAndWrench"),
  hamsa: () => import("./emojis/EmojiHamsa"),
  hamster: () => import("./emojis/EmojiHamster"),
  "hand-with-fingers-splayed": () => import("./emojis/EmojiHandWithFingersSplayed"),
  "hand-with-fingers-splayed-dark-skin-tone": () =>
    import("./emojis/EmojiHandWithFingersSplayedDarkSkinTone"),
  "hand-with-fingers-splayed-light-skin-tone": () =>
    import("./emojis/EmojiHandWithFingersSplayedLightSkinTone"),
  "hand-with-fingers-splayed-medium-dark-skin-tone": () =>
    import("./emojis/EmojiHandWithFingersSplayedMediumDarkSkinTone"),
  "hand-with-fingers-splayed-medium-light-skin-tone": () =>
    import("./emojis/EmojiHandWithFingersSplayedMediumLightSkinTone"),
  "hand-with-fingers-splayed-medium-skin-tone": () =>
    import("./emojis/EmojiHandWithFingersSplayedMediumSkinTone"),
  "hand-with-index-finger-and-thumb-crossed": () =>
    import("./emojis/EmojiHandWithIndexFingerAndThumbCrossed"),
  "hand-with-index-finger-and-thumb-crossed-dark-skin-tone": () =>
    import("./emojis/EmojiHandWithIndexFingerAndThumbCrossedDarkSkinTone"),
  "hand-with-index-finger-and-thumb-crossed-light-skin-tone": () =>
    import("./emojis/EmojiHandWithIndexFingerAndThumbCrossedLightSkinTone"),
  "hand-with-index-finger-and-thumb-crossed-medium-dark-skin-tone": () =>
    import("./emojis/EmojiHandWithIndexFingerAndThumbCrossedMediumDarkSkinTone"),
  "hand-with-index-finger-and-thumb-crossed-medium-light-skin-tone": () =>
    import("./emojis/EmojiHandWithIndexFingerAndThumbCrossedMediumLightSkinTone"),
  "hand-with-index-finger-and-thumb-crossed-medium-skin-tone": () =>
    import("./emojis/EmojiHandWithIndexFingerAndThumbCrossedMediumSkinTone"),
  handbag: () => import("./emojis/EmojiHandbag"),
  handshake: () => import("./emojis/EmojiHandshake"),
  "handshake-dark-skin-tone": () => import("./emojis/EmojiHandshakeDarkSkinTone"),
  "handshake-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiHandshakeDarkSkinToneLightSkinTone"),
  "handshake-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiHandshakeDarkSkinToneMediumDarkSkinTone"),
  "handshake-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiHandshakeDarkSkinToneMediumLightSkinTone"),
  "handshake-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiHandshakeDarkSkinToneMediumSkinTone"),
  "handshake-light-skin-tone": () => import("./emojis/EmojiHandshakeLightSkinTone"),
  "handshake-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiHandshakeLightSkinToneDarkSkinTone"),
  "handshake-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiHandshakeLightSkinToneMediumDarkSkinTone"),
  "handshake-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiHandshakeLightSkinToneMediumLightSkinTone"),
  "handshake-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiHandshakeLightSkinToneMediumSkinTone"),
  "handshake-medium-dark-skin-tone": () => import("./emojis/EmojiHandshakeMediumDarkSkinTone"),
  "handshake-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiHandshakeMediumDarkSkinToneDarkSkinTone"),
  "handshake-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiHandshakeMediumDarkSkinToneLightSkinTone"),
  "handshake-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiHandshakeMediumDarkSkinToneMediumLightSkinTone"),
  "handshake-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiHandshakeMediumDarkSkinToneMediumSkinTone"),
  "handshake-medium-light-skin-tone": () => import("./emojis/EmojiHandshakeMediumLightSkinTone"),
  "handshake-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiHandshakeMediumLightSkinToneDarkSkinTone"),
  "handshake-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiHandshakeMediumLightSkinToneLightSkinTone"),
  "handshake-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiHandshakeMediumLightSkinToneMediumDarkSkinTone"),
  "handshake-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiHandshakeMediumLightSkinToneMediumSkinTone"),
  "handshake-medium-skin-tone": () => import("./emojis/EmojiHandshakeMediumSkinTone"),
  "handshake-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiHandshakeMediumSkinToneDarkSkinTone"),
  "handshake-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiHandshakeMediumSkinToneLightSkinTone"),
  "handshake-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiHandshakeMediumSkinToneMediumDarkSkinTone"),
  "handshake-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiHandshakeMediumSkinToneMediumLightSkinTone"),
  harp: () => import("./emojis/EmojiHarp"),
  "hatching-chick": () => import("./emojis/EmojiHatchingChick"),
  "head-shaking-horizontally": () => import("./emojis/EmojiHeadShakingHorizontally"),
  "head-shaking-vertically": () => import("./emojis/EmojiHeadShakingVertically"),
  headphone: () => import("./emojis/EmojiHeadphone"),
  headstone: () => import("./emojis/EmojiHeadstone"),
  "health-worker": () => import("./emojis/EmojiHealthWorker"),
  "health-worker-dark-skin-tone": () => import("./emojis/EmojiHealthWorkerDarkSkinTone"),
  "health-worker-light-skin-tone": () => import("./emojis/EmojiHealthWorkerLightSkinTone"),
  "health-worker-medium-dark-skin-tone": () =>
    import("./emojis/EmojiHealthWorkerMediumDarkSkinTone"),
  "health-worker-medium-light-skin-tone": () =>
    import("./emojis/EmojiHealthWorkerMediumLightSkinTone"),
  "health-worker-medium-skin-tone": () => import("./emojis/EmojiHealthWorkerMediumSkinTone"),
  "hear-no-evil-monkey": () => import("./emojis/EmojiHearNoEvilMonkey"),
  "heart-decoration": () => import("./emojis/EmojiHeartDecoration"),
  "heart-exclamation": () => import("./emojis/EmojiHeartExclamation"),
  "heart-hands": () => import("./emojis/EmojiHeartHands"),
  "heart-hands-dark-skin-tone": () => import("./emojis/EmojiHeartHandsDarkSkinTone"),
  "heart-hands-light-skin-tone": () => import("./emojis/EmojiHeartHandsLightSkinTone"),
  "heart-hands-medium-dark-skin-tone": () => import("./emojis/EmojiHeartHandsMediumDarkSkinTone"),
  "heart-hands-medium-light-skin-tone": () => import("./emojis/EmojiHeartHandsMediumLightSkinTone"),
  "heart-hands-medium-skin-tone": () => import("./emojis/EmojiHeartHandsMediumSkinTone"),
  "heart-on-fire": () => import("./emojis/EmojiHeartOnFire"),
  "heart-suit": () => import("./emojis/EmojiHeartSuit"),
  "heart-with-arrow": () => import("./emojis/EmojiHeartWithArrow"),
  "heart-with-ribbon": () => import("./emojis/EmojiHeartWithRibbon"),
  "heavy-dollar-sign": () => import("./emojis/EmojiHeavyDollarSign"),
  "heavy-equals-sign": () => import("./emojis/EmojiHeavyEqualsSign"),
  hedgehog: () => import("./emojis/EmojiHedgehog"),
  helicopter: () => import("./emojis/EmojiHelicopter"),
  herb: () => import("./emojis/EmojiHerb"),
  hibiscus: () => import("./emojis/EmojiHibiscus"),
  "high-heeled-shoe": () => import("./emojis/EmojiHighHeeledShoe"),
  "high-speed-train": () => import("./emojis/EmojiHighSpeedTrain"),
  "high-voltage": () => import("./emojis/EmojiHighVoltage"),
  "hiking-boot": () => import("./emojis/EmojiHikingBoot"),
  "hindu-temple": () => import("./emojis/EmojiHinduTemple"),
  hippopotamus: () => import("./emojis/EmojiHippopotamus"),
  hole: () => import("./emojis/EmojiHole"),
  "hollow-red-circle": () => import("./emojis/EmojiHollowRedCircle"),
  "honey-pot": () => import("./emojis/EmojiHoneyPot"),
  honeybee: () => import("./emojis/EmojiHoneybee"),
  hook: () => import("./emojis/EmojiHook"),
  "horizontal-traffic-light": () => import("./emojis/EmojiHorizontalTrafficLight"),
  horse: () => import("./emojis/EmojiHorse"),
  "horse-face": () => import("./emojis/EmojiHorseFace"),
  "horse-racing": () => import("./emojis/EmojiHorseRacing"),
  "horse-racing-dark-skin-tone": () => import("./emojis/EmojiHorseRacingDarkSkinTone"),
  "horse-racing-light-skin-tone": () => import("./emojis/EmojiHorseRacingLightSkinTone"),
  "horse-racing-medium-dark-skin-tone": () => import("./emojis/EmojiHorseRacingMediumDarkSkinTone"),
  "horse-racing-medium-light-skin-tone": () =>
    import("./emojis/EmojiHorseRacingMediumLightSkinTone"),
  "horse-racing-medium-skin-tone": () => import("./emojis/EmojiHorseRacingMediumSkinTone"),
  hospital: () => import("./emojis/EmojiHospital"),
  "hot-beverage": () => import("./emojis/EmojiHotBeverage"),
  "hot-dog": () => import("./emojis/EmojiHotDog"),
  "hot-face": () => import("./emojis/EmojiHotFace"),
  "hot-pepper": () => import("./emojis/EmojiHotPepper"),
  "hot-springs": () => import("./emojis/EmojiHotSprings"),
  hotel: () => import("./emojis/EmojiHotel"),
  "hourglass-done": () => import("./emojis/EmojiHourglassDone"),
  "hourglass-not-done": () => import("./emojis/EmojiHourglassNotDone"),
  house: () => import("./emojis/EmojiHouse"),
  "house-with-garden": () => import("./emojis/EmojiHouseWithGarden"),
  houses: () => import("./emojis/EmojiHouses"),
  "hugging-face": () => import("./emojis/EmojiHuggingFace"),
  "hundred-points": () => import("./emojis/EmojiHundredPoints"),
  "hushed-face": () => import("./emojis/EmojiHushedFace"),
  hut: () => import("./emojis/EmojiHut"),
  hyacinth: () => import("./emojis/EmojiHyacinth"),
  ice: () => import("./emojis/EmojiIce"),
  "ice-cream": () => import("./emojis/EmojiIceCream"),
  "ice-hockey": () => import("./emojis/EmojiIceHockey"),
  "ice-skate": () => import("./emojis/EmojiIceSkate"),
  "id-button": () => import("./emojis/EmojiIdButton"),
  "identification-card": () => import("./emojis/EmojiIdentificationCard"),
  "inbox-tray": () => import("./emojis/EmojiInboxTray"),
  "incoming-envelope": () => import("./emojis/EmojiIncomingEnvelope"),
  "index-pointing-at-the-viewer": () => import("./emojis/EmojiIndexPointingAtTheViewer"),
  "index-pointing-at-the-viewer-dark-skin-tone": () =>
    import("./emojis/EmojiIndexPointingAtTheViewerDarkSkinTone"),
  "index-pointing-at-the-viewer-light-skin-tone": () =>
    import("./emojis/EmojiIndexPointingAtTheViewerLightSkinTone"),
  "index-pointing-at-the-viewer-medium-dark-skin-tone": () =>
    import("./emojis/EmojiIndexPointingAtTheViewerMediumDarkSkinTone"),
  "index-pointing-at-the-viewer-medium-light-skin-tone": () =>
    import("./emojis/EmojiIndexPointingAtTheViewerMediumLightSkinTone"),
  "index-pointing-at-the-viewer-medium-skin-tone": () =>
    import("./emojis/EmojiIndexPointingAtTheViewerMediumSkinTone"),
  "index-pointing-up": () => import("./emojis/EmojiIndexPointingUp"),
  "index-pointing-up-dark-skin-tone": () => import("./emojis/EmojiIndexPointingUpDarkSkinTone"),
  "index-pointing-up-light-skin-tone": () => import("./emojis/EmojiIndexPointingUpLightSkinTone"),
  "index-pointing-up-medium-dark-skin-tone": () =>
    import("./emojis/EmojiIndexPointingUpMediumDarkSkinTone"),
  "index-pointing-up-medium-light-skin-tone": () =>
    import("./emojis/EmojiIndexPointingUpMediumLightSkinTone"),
  "index-pointing-up-medium-skin-tone": () => import("./emojis/EmojiIndexPointingUpMediumSkinTone"),
  infinity: () => import("./emojis/EmojiInfinity"),
  information: () => import("./emojis/EmojiInformation"),
  "input-latin-letters": () => import("./emojis/EmojiInputLatinLetters"),
  "input-latin-lowercase": () => import("./emojis/EmojiInputLatinLowercase"),
  "input-latin-uppercase": () => import("./emojis/EmojiInputLatinUppercase"),
  "input-numbers": () => import("./emojis/EmojiInputNumbers"),
  "input-symbols": () => import("./emojis/EmojiInputSymbols"),
  "jack-o-lantern": () => import("./emojis/EmojiJackOLantern"),
  "japanese-acceptable-button": () => import("./emojis/EmojiJapaneseAcceptableButton"),
  "japanese-application-button": () => import("./emojis/EmojiJapaneseApplicationButton"),
  "japanese-bargain-button": () => import("./emojis/EmojiJapaneseBargainButton"),
  "japanese-castle": () => import("./emojis/EmojiJapaneseCastle"),
  "japanese-congratulations-button": () => import("./emojis/EmojiJapaneseCongratulationsButton"),
  "japanese-discount-button": () => import("./emojis/EmojiJapaneseDiscountButton"),
  "japanese-dolls": () => import("./emojis/EmojiJapaneseDolls"),
  "japanese-free-of-charge-button": () => import("./emojis/EmojiJapaneseFreeOfChargeButton"),
  "japanese-here-button": () => import("./emojis/EmojiJapaneseHereButton"),
  "japanese-monthly-amount-button": () => import("./emojis/EmojiJapaneseMonthlyAmountButton"),
  "japanese-no-vacancy-button": () => import("./emojis/EmojiJapaneseNoVacancyButton"),
  "japanese-not-free-of-charge-button": () => import("./emojis/EmojiJapaneseNotFreeOfChargeButton"),
  "japanese-open-for-business-button": () => import("./emojis/EmojiJapaneseOpenForBusinessButton"),
  "japanese-passing-grade-button": () => import("./emojis/EmojiJapanesePassingGradeButton"),
  "japanese-post-office": () => import("./emojis/EmojiJapanesePostOffice"),
  "japanese-prohibited-button": () => import("./emojis/EmojiJapaneseProhibitedButton"),
  "japanese-reserved-button": () => import("./emojis/EmojiJapaneseReservedButton"),
  "japanese-secret-button": () => import("./emojis/EmojiJapaneseSecretButton"),
  "japanese-service-charge-button": () => import("./emojis/EmojiJapaneseServiceChargeButton"),
  "japanese-symbol-for-beginner": () => import("./emojis/EmojiJapaneseSymbolForBeginner"),
  "japanese-vacancy-button": () => import("./emojis/EmojiJapaneseVacancyButton"),
  jar: () => import("./emojis/EmojiJar"),
  jeans: () => import("./emojis/EmojiJeans"),
  jellyfish: () => import("./emojis/EmojiJellyfish"),
  joker: () => import("./emojis/EmojiJoker"),
  joystick: () => import("./emojis/EmojiJoystick"),
  judge: () => import("./emojis/EmojiJudge"),
  "judge-dark-skin-tone": () => import("./emojis/EmojiJudgeDarkSkinTone"),
  "judge-light-skin-tone": () => import("./emojis/EmojiJudgeLightSkinTone"),
  "judge-medium-dark-skin-tone": () => import("./emojis/EmojiJudgeMediumDarkSkinTone"),
  "judge-medium-light-skin-tone": () => import("./emojis/EmojiJudgeMediumLightSkinTone"),
  "judge-medium-skin-tone": () => import("./emojis/EmojiJudgeMediumSkinTone"),
  kaaba: () => import("./emojis/EmojiKaaba"),
  kangaroo: () => import("./emojis/EmojiKangaroo"),
  key: () => import("./emojis/EmojiKey"),
  keyboard: () => import("./emojis/EmojiKeyboard"),
  keycap: () => import("./emojis/EmojiKeycap"),
  "keycap-0": () => import("./emojis/EmojiKeycap0"),
  "keycap-1": () => import("./emojis/EmojiKeycap1"),
  "keycap-10": () => import("./emojis/EmojiKeycap10"),
  "keycap-2": () => import("./emojis/EmojiKeycap2"),
  "keycap-3": () => import("./emojis/EmojiKeycap3"),
  "keycap-4": () => import("./emojis/EmojiKeycap4"),
  "keycap-5": () => import("./emojis/EmojiKeycap5"),
  "keycap-6": () => import("./emojis/EmojiKeycap6"),
  "keycap-7": () => import("./emojis/EmojiKeycap7"),
  "keycap-8": () => import("./emojis/EmojiKeycap8"),
  "keycap-9": () => import("./emojis/EmojiKeycap9"),
  "keycap-asterisk": () => import("./emojis/EmojiKeycapAsterisk"),
  "keycap-pound": () => import("./emojis/EmojiKeycapPound"),
  khanda: () => import("./emojis/EmojiKhanda"),
  "kick-scooter": () => import("./emojis/EmojiKickScooter"),
  kimono: () => import("./emojis/EmojiKimono"),
  kiss: () => import("./emojis/EmojiKiss"),
  "kiss-dark-skin-tone": () => import("./emojis/EmojiKissDarkSkinTone"),
  "kiss-light-skin-tone": () => import("./emojis/EmojiKissLightSkinTone"),
  "kiss-man-man": () => import("./emojis/EmojiKissManMan"),
  "kiss-man-man-dark-skin-tone": () => import("./emojis/EmojiKissManManDarkSkinTone"),
  "kiss-man-man-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiKissManManDarkSkinToneLightSkinTone"),
  "kiss-man-man-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiKissManManDarkSkinToneMediumDarkSkinTone"),
  "kiss-man-man-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissManManDarkSkinToneMediumLightSkinTone"),
  "kiss-man-man-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiKissManManDarkSkinToneMediumSkinTone"),
  "kiss-man-man-light-skin-tone": () => import("./emojis/EmojiKissManManLightSkinTone"),
  "kiss-man-man-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiKissManManLightSkinToneDarkSkinTone"),
  "kiss-man-man-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiKissManManLightSkinToneMediumDarkSkinTone"),
  "kiss-man-man-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissManManLightSkinToneMediumLightSkinTone"),
  "kiss-man-man-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiKissManManLightSkinToneMediumSkinTone"),
  "kiss-man-man-medium-dark-skin-tone": () => import("./emojis/EmojiKissManManMediumDarkSkinTone"),
  "kiss-man-man-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiKissManManMediumDarkSkinToneDarkSkinTone"),
  "kiss-man-man-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiKissManManMediumDarkSkinToneLightSkinTone"),
  "kiss-man-man-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissManManMediumDarkSkinToneMediumLightSkinTone"),
  "kiss-man-man-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiKissManManMediumDarkSkinToneMediumSkinTone"),
  "kiss-man-man-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissManManMediumLightSkinTone"),
  "kiss-man-man-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiKissManManMediumLightSkinToneDarkSkinTone"),
  "kiss-man-man-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiKissManManMediumLightSkinToneLightSkinTone"),
  "kiss-man-man-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiKissManManMediumLightSkinToneMediumDarkSkinTone"),
  "kiss-man-man-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiKissManManMediumLightSkinToneMediumSkinTone"),
  "kiss-man-man-medium-skin-tone": () => import("./emojis/EmojiKissManManMediumSkinTone"),
  "kiss-man-man-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiKissManManMediumSkinToneDarkSkinTone"),
  "kiss-man-man-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiKissManManMediumSkinToneLightSkinTone"),
  "kiss-man-man-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiKissManManMediumSkinToneMediumDarkSkinTone"),
  "kiss-man-man-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissManManMediumSkinToneMediumLightSkinTone"),
  "kiss-mark": () => import("./emojis/EmojiKissMark"),
  "kiss-medium-dark-skin-tone": () => import("./emojis/EmojiKissMediumDarkSkinTone"),
  "kiss-medium-light-skin-tone": () => import("./emojis/EmojiKissMediumLightSkinTone"),
  "kiss-medium-skin-tone": () => import("./emojis/EmojiKissMediumSkinTone"),
  "kiss-person-person-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonDarkSkinToneLightSkinTone"),
  "kiss-person-person-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonDarkSkinToneMediumDarkSkinTone"),
  "kiss-person-person-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonDarkSkinToneMediumLightSkinTone"),
  "kiss-person-person-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonDarkSkinToneMediumSkinTone"),
  "kiss-person-person-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonLightSkinToneDarkSkinTone"),
  "kiss-person-person-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonLightSkinToneMediumDarkSkinTone"),
  "kiss-person-person-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonLightSkinToneMediumLightSkinTone"),
  "kiss-person-person-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonLightSkinToneMediumSkinTone"),
  "kiss-person-person-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonMediumDarkSkinToneDarkSkinTone"),
  "kiss-person-person-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonMediumDarkSkinToneLightSkinTone"),
  "kiss-person-person-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonMediumDarkSkinToneMediumLightSkinTone"),
  "kiss-person-person-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonMediumDarkSkinToneMediumSkinTone"),
  "kiss-person-person-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonMediumLightSkinToneDarkSkinTone"),
  "kiss-person-person-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonMediumLightSkinToneLightSkinTone"),
  "kiss-person-person-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonMediumLightSkinToneMediumDarkSkinTone"),
  "kiss-person-person-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonMediumLightSkinToneMediumSkinTone"),
  "kiss-person-person-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonMediumSkinToneDarkSkinTone"),
  "kiss-person-person-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonMediumSkinToneLightSkinTone"),
  "kiss-person-person-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonMediumSkinToneMediumDarkSkinTone"),
  "kiss-person-person-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissPersonPersonMediumSkinToneMediumLightSkinTone"),
  "kiss-woman-man": () => import("./emojis/EmojiKissWomanMan"),
  "kiss-woman-man-dark-skin-tone": () => import("./emojis/EmojiKissWomanManDarkSkinTone"),
  "kiss-woman-man-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiKissWomanManDarkSkinToneLightSkinTone"),
  "kiss-woman-man-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiKissWomanManDarkSkinToneMediumDarkSkinTone"),
  "kiss-woman-man-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissWomanManDarkSkinToneMediumLightSkinTone"),
  "kiss-woman-man-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiKissWomanManDarkSkinToneMediumSkinTone"),
  "kiss-woman-man-light-skin-tone": () => import("./emojis/EmojiKissWomanManLightSkinTone"),
  "kiss-woman-man-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiKissWomanManLightSkinToneDarkSkinTone"),
  "kiss-woman-man-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiKissWomanManLightSkinToneMediumDarkSkinTone"),
  "kiss-woman-man-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissWomanManLightSkinToneMediumLightSkinTone"),
  "kiss-woman-man-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiKissWomanManLightSkinToneMediumSkinTone"),
  "kiss-woman-man-medium-dark-skin-tone": () =>
    import("./emojis/EmojiKissWomanManMediumDarkSkinTone"),
  "kiss-woman-man-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiKissWomanManMediumDarkSkinToneDarkSkinTone"),
  "kiss-woman-man-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiKissWomanManMediumDarkSkinToneLightSkinTone"),
  "kiss-woman-man-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissWomanManMediumDarkSkinToneMediumLightSkinTone"),
  "kiss-woman-man-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiKissWomanManMediumDarkSkinToneMediumSkinTone"),
  "kiss-woman-man-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissWomanManMediumLightSkinTone"),
  "kiss-woman-man-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiKissWomanManMediumLightSkinToneDarkSkinTone"),
  "kiss-woman-man-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiKissWomanManMediumLightSkinToneLightSkinTone"),
  "kiss-woman-man-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiKissWomanManMediumLightSkinToneMediumDarkSkinTone"),
  "kiss-woman-man-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiKissWomanManMediumLightSkinToneMediumSkinTone"),
  "kiss-woman-man-medium-skin-tone": () => import("./emojis/EmojiKissWomanManMediumSkinTone"),
  "kiss-woman-man-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiKissWomanManMediumSkinToneDarkSkinTone"),
  "kiss-woman-man-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiKissWomanManMediumSkinToneLightSkinTone"),
  "kiss-woman-man-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiKissWomanManMediumSkinToneMediumDarkSkinTone"),
  "kiss-woman-man-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissWomanManMediumSkinToneMediumLightSkinTone"),
  "kiss-woman-woman": () => import("./emojis/EmojiKissWomanWoman"),
  "kiss-woman-woman-dark-skin-tone": () => import("./emojis/EmojiKissWomanWomanDarkSkinTone"),
  "kiss-woman-woman-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanDarkSkinToneLightSkinTone"),
  "kiss-woman-woman-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanDarkSkinToneMediumDarkSkinTone"),
  "kiss-woman-woman-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanDarkSkinToneMediumLightSkinTone"),
  "kiss-woman-woman-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanDarkSkinToneMediumSkinTone"),
  "kiss-woman-woman-light-skin-tone": () => import("./emojis/EmojiKissWomanWomanLightSkinTone"),
  "kiss-woman-woman-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanLightSkinToneDarkSkinTone"),
  "kiss-woman-woman-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanLightSkinToneMediumDarkSkinTone"),
  "kiss-woman-woman-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanLightSkinToneMediumLightSkinTone"),
  "kiss-woman-woman-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanLightSkinToneMediumSkinTone"),
  "kiss-woman-woman-medium-dark-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanMediumDarkSkinTone"),
  "kiss-woman-woman-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanMediumDarkSkinToneDarkSkinTone"),
  "kiss-woman-woman-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanMediumDarkSkinToneLightSkinTone"),
  "kiss-woman-woman-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanMediumDarkSkinToneMediumLightSkinTone"),
  "kiss-woman-woman-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanMediumDarkSkinToneMediumSkinTone"),
  "kiss-woman-woman-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanMediumLightSkinTone"),
  "kiss-woman-woman-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanMediumLightSkinToneDarkSkinTone"),
  "kiss-woman-woman-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanMediumLightSkinToneLightSkinTone"),
  "kiss-woman-woman-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanMediumLightSkinToneMediumDarkSkinTone"),
  "kiss-woman-woman-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanMediumLightSkinToneMediumSkinTone"),
  "kiss-woman-woman-medium-skin-tone": () => import("./emojis/EmojiKissWomanWomanMediumSkinTone"),
  "kiss-woman-woman-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanMediumSkinToneDarkSkinTone"),
  "kiss-woman-woman-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanMediumSkinToneLightSkinTone"),
  "kiss-woman-woman-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanMediumSkinToneMediumDarkSkinTone"),
  "kiss-woman-woman-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiKissWomanWomanMediumSkinToneMediumLightSkinTone"),
  "kissing-cat": () => import("./emojis/EmojiKissingCat"),
  "kissing-face": () => import("./emojis/EmojiKissingFace"),
  "kissing-face-with-closed-eyes": () => import("./emojis/EmojiKissingFaceWithClosedEyes"),
  "kissing-face-with-smiling-eyes": () => import("./emojis/EmojiKissingFaceWithSmilingEyes"),
  "kitchen-knife": () => import("./emojis/EmojiKitchenKnife"),
  kite: () => import("./emojis/EmojiKite"),
  "kiwi-fruit": () => import("./emojis/EmojiKiwiFruit"),
  "knocked-out-face": () => import("./emojis/EmojiKnockedOutFace"),
  knot: () => import("./emojis/EmojiKnot"),
  koala: () => import("./emojis/EmojiKoala"),
  "lab-coat": () => import("./emojis/EmojiLabCoat"),
  label: () => import("./emojis/EmojiLabel"),
  lacrosse: () => import("./emojis/EmojiLacrosse"),
  ladder: () => import("./emojis/EmojiLadder"),
  "lady-beetle": () => import("./emojis/EmojiLadyBeetle"),
  landslide: () => import("./emojis/EmojiLandslide"),
  laptop: () => import("./emojis/EmojiLaptop"),
  "large-blue-diamond": () => import("./emojis/EmojiLargeBlueDiamond"),
  "large-orange-diamond": () => import("./emojis/EmojiLargeOrangeDiamond"),
  "last-quarter-moon": () => import("./emojis/EmojiLastQuarterMoon"),
  "last-quarter-moon-face": () => import("./emojis/EmojiLastQuarterMoonFace"),
  "last-quarter-moon-with-face": () => import("./emojis/EmojiLastQuarterMoonWithFace"),
  "last-track-button": () => import("./emojis/EmojiLastTrackButton"),
  "latin-cross": () => import("./emojis/EmojiLatinCross"),
  "leaf-fluttering-in-wind": () => import("./emojis/EmojiLeafFlutteringInWind"),
  "leafless-tree": () => import("./emojis/EmojiLeaflessTree"),
  "leafy-green": () => import("./emojis/EmojiLeafyGreen"),
  ledger: () => import("./emojis/EmojiLedger"),
  "left-arrow": () => import("./emojis/EmojiLeftArrow"),
  "left-arrow-curving-right": () => import("./emojis/EmojiLeftArrowCurvingRight"),
  "left-facing-fist": () => import("./emojis/EmojiLeftFacingFist"),
  "left-facing-fist-dark-skin-tone": () => import("./emojis/EmojiLeftFacingFistDarkSkinTone"),
  "left-facing-fist-light-skin-tone": () => import("./emojis/EmojiLeftFacingFistLightSkinTone"),
  "left-facing-fist-medium-dark-skin-tone": () =>
    import("./emojis/EmojiLeftFacingFistMediumDarkSkinTone"),
  "left-facing-fist-medium-light-skin-tone": () =>
    import("./emojis/EmojiLeftFacingFistMediumLightSkinTone"),
  "left-facing-fist-medium-skin-tone": () => import("./emojis/EmojiLeftFacingFistMediumSkinTone"),
  "left-luggage": () => import("./emojis/EmojiLeftLuggage"),
  "left-pointing-magnifying-glass": () => import("./emojis/EmojiLeftPointingMagnifyingGlass"),
  "left-right-arrow": () => import("./emojis/EmojiLeftRightArrow"),
  "left-speech-bubble": () => import("./emojis/EmojiLeftSpeechBubble"),
  "leftwards-hand": () => import("./emojis/EmojiLeftwardsHand"),
  "leftwards-hand-dark-skin-tone": () => import("./emojis/EmojiLeftwardsHandDarkSkinTone"),
  "leftwards-hand-light-skin-tone": () => import("./emojis/EmojiLeftwardsHandLightSkinTone"),
  "leftwards-hand-medium-dark-skin-tone": () =>
    import("./emojis/EmojiLeftwardsHandMediumDarkSkinTone"),
  "leftwards-hand-medium-light-skin-tone": () =>
    import("./emojis/EmojiLeftwardsHandMediumLightSkinTone"),
  "leftwards-hand-medium-skin-tone": () => import("./emojis/EmojiLeftwardsHandMediumSkinTone"),
  "leftwards-pushing-hand": () => import("./emojis/EmojiLeftwardsPushingHand"),
  "leftwards-pushing-hand-dark-skin-tone": () =>
    import("./emojis/EmojiLeftwardsPushingHandDarkSkinTone"),
  "leftwards-pushing-hand-light-skin-tone": () =>
    import("./emojis/EmojiLeftwardsPushingHandLightSkinTone"),
  "leftwards-pushing-hand-medium-dark-skin-tone": () =>
    import("./emojis/EmojiLeftwardsPushingHandMediumDarkSkinTone"),
  "leftwards-pushing-hand-medium-light-skin-tone": () =>
    import("./emojis/EmojiLeftwardsPushingHandMediumLightSkinTone"),
  "leftwards-pushing-hand-medium-skin-tone": () =>
    import("./emojis/EmojiLeftwardsPushingHandMediumSkinTone"),
  leg: () => import("./emojis/EmojiLeg"),
  "leg-dark-skin-tone": () => import("./emojis/EmojiLegDarkSkinTone"),
  "leg-light-skin-tone": () => import("./emojis/EmojiLegLightSkinTone"),
  "leg-medium-dark-skin-tone": () => import("./emojis/EmojiLegMediumDarkSkinTone"),
  "leg-medium-light-skin-tone": () => import("./emojis/EmojiLegMediumLightSkinTone"),
  "leg-medium-skin-tone": () => import("./emojis/EmojiLegMediumSkinTone"),
  lemon: () => import("./emojis/EmojiLemon"),
  leo: () => import("./emojis/EmojiLeo"),
  leopard: () => import("./emojis/EmojiLeopard"),
  "letter-a": () => import("./emojis/EmojiLetterA"),
  "letter-b": () => import("./emojis/EmojiLetterB"),
  "letter-c": () => import("./emojis/EmojiLetterC"),
  "letter-d": () => import("./emojis/EmojiLetterD"),
  "letter-e": () => import("./emojis/EmojiLetterE"),
  "letter-f": () => import("./emojis/EmojiLetterF"),
  "letter-g": () => import("./emojis/EmojiLetterG"),
  "letter-h": () => import("./emojis/EmojiLetterH"),
  "letter-i": () => import("./emojis/EmojiLetterI"),
  "letter-j": () => import("./emojis/EmojiLetterJ"),
  "letter-k": () => import("./emojis/EmojiLetterK"),
  "letter-l": () => import("./emojis/EmojiLetterL"),
  "letter-m": () => import("./emojis/EmojiLetterM"),
  "letter-n": () => import("./emojis/EmojiLetterN"),
  "letter-o": () => import("./emojis/EmojiLetterO"),
  "letter-p": () => import("./emojis/EmojiLetterP"),
  "letter-q": () => import("./emojis/EmojiLetterQ"),
  "letter-r": () => import("./emojis/EmojiLetterR"),
  "letter-s": () => import("./emojis/EmojiLetterS"),
  "letter-t": () => import("./emojis/EmojiLetterT"),
  "letter-u": () => import("./emojis/EmojiLetterU"),
  "letter-v": () => import("./emojis/EmojiLetterV"),
  "letter-w": () => import("./emojis/EmojiLetterW"),
  "letter-x": () => import("./emojis/EmojiLetterX"),
  "letter-y": () => import("./emojis/EmojiLetterY"),
  "letter-z": () => import("./emojis/EmojiLetterZ"),
  "level-slider": () => import("./emojis/EmojiLevelSlider"),
  libra: () => import("./emojis/EmojiLibra"),
  "light-blue-heart": () => import("./emojis/EmojiLightBlueHeart"),
  "light-bulb": () => import("./emojis/EmojiLightBulb"),
  "light-rail": () => import("./emojis/EmojiLightRail"),
  "light-skin-tone": () => import("./emojis/EmojiLightSkinTone"),
  lime: () => import("./emojis/EmojiLime"),
  link: () => import("./emojis/EmojiLink"),
  "linked-paperclips": () => import("./emojis/EmojiLinkedPaperclips"),
  lion: () => import("./emojis/EmojiLion"),
  lipstick: () => import("./emojis/EmojiLipstick"),
  "litter-in-bin-sign": () => import("./emojis/EmojiLitterInBinSign"),
  lizard: () => import("./emojis/EmojiLizard"),
  llama: () => import("./emojis/EmojiLlama"),
  lobster: () => import("./emojis/EmojiLobster"),
  locked: () => import("./emojis/EmojiLocked"),
  "locked-with-key": () => import("./emojis/EmojiLockedWithKey"),
  "locked-with-pen": () => import("./emojis/EmojiLockedWithPen"),
  locomotive: () => import("./emojis/EmojiLocomotive"),
  lollipop: () => import("./emojis/EmojiLollipop"),
  "long-drum": () => import("./emojis/EmojiLongDrum"),
  "lotion-bottle": () => import("./emojis/EmojiLotionBottle"),
  lotus: () => import("./emojis/EmojiLotus"),
  "loudly-crying-face": () => import("./emojis/EmojiLoudlyCryingFace"),
  loudspeaker: () => import("./emojis/EmojiLoudspeaker"),
  "love-hotel": () => import("./emojis/EmojiLoveHotel"),
  "love-letter": () => import("./emojis/EmojiLoveLetter"),
  "love-you-gesture": () => import("./emojis/EmojiLoveYouGesture"),
  "love-you-gesture-dark-skin-tone": () => import("./emojis/EmojiLoveYouGestureDarkSkinTone"),
  "love-you-gesture-light-skin-tone": () => import("./emojis/EmojiLoveYouGestureLightSkinTone"),
  "love-you-gesture-medium-dark-skin-tone": () =>
    import("./emojis/EmojiLoveYouGestureMediumDarkSkinTone"),
  "love-you-gesture-medium-light-skin-tone": () =>
    import("./emojis/EmojiLoveYouGestureMediumLightSkinTone"),
  "love-you-gesture-medium-skin-tone": () => import("./emojis/EmojiLoveYouGestureMediumSkinTone"),
  "love-you-gesture-tone1": () => import("./emojis/EmojiLoveYouGestureTone1"),
  "love-you-gesture-tone2": () => import("./emojis/EmojiLoveYouGestureTone2"),
  "love-you-gesture-tone3": () => import("./emojis/EmojiLoveYouGestureTone3"),
  "love-you-gesture-tone4": () => import("./emojis/EmojiLoveYouGestureTone4"),
  "love-you-gesture-tone5": () => import("./emojis/EmojiLoveYouGestureTone5"),
  "low-battery": () => import("./emojis/EmojiLowBattery"),
  luggage: () => import("./emojis/EmojiLuggage"),
  lungs: () => import("./emojis/EmojiLungs"),
  "lying-face": () => import("./emojis/EmojiLyingFace"),
  mage: () => import("./emojis/EmojiMage"),
  "mage-dark-skin-tone": () => import("./emojis/EmojiMageDarkSkinTone"),
  "mage-light-skin-tone": () => import("./emojis/EmojiMageLightSkinTone"),
  "mage-medium-dark-skin-tone": () => import("./emojis/EmojiMageMediumDarkSkinTone"),
  "mage-medium-light-skin-tone": () => import("./emojis/EmojiMageMediumLightSkinTone"),
  "mage-medium-skin-tone": () => import("./emojis/EmojiMageMediumSkinTone"),
  "magic-wand": () => import("./emojis/EmojiMagicWand"),
  magnet: () => import("./emojis/EmojiMagnet"),
  "magnifying-glass-tilted-left": () => import("./emojis/EmojiMagnifyingGlassTiltedLeft"),
  "magnifying-glass-tilted-right": () => import("./emojis/EmojiMagnifyingGlassTiltedRight"),
  "mahjong-red-dragon": () => import("./emojis/EmojiMahjongRedDragon"),
  "male-sign": () => import("./emojis/EmojiMaleSign"),
  mammoth: () => import("./emojis/EmojiMammoth"),
  man: () => import("./emojis/EmojiMan"),
  "man-artist": () => import("./emojis/EmojiManArtist"),
  "man-artist-dark-skin-tone": () => import("./emojis/EmojiManArtistDarkSkinTone"),
  "man-artist-light-skin-tone": () => import("./emojis/EmojiManArtistLightSkinTone"),
  "man-artist-medium-dark-skin-tone": () => import("./emojis/EmojiManArtistMediumDarkSkinTone"),
  "man-artist-medium-light-skin-tone": () => import("./emojis/EmojiManArtistMediumLightSkinTone"),
  "man-artist-medium-skin-tone": () => import("./emojis/EmojiManArtistMediumSkinTone"),
  "man-astronaut": () => import("./emojis/EmojiManAstronaut"),
  "man-astronaut-dark-skin-tone": () => import("./emojis/EmojiManAstronautDarkSkinTone"),
  "man-astronaut-light-skin-tone": () => import("./emojis/EmojiManAstronautLightSkinTone"),
  "man-astronaut-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManAstronautMediumDarkSkinTone"),
  "man-astronaut-medium-light-skin-tone": () =>
    import("./emojis/EmojiManAstronautMediumLightSkinTone"),
  "man-astronaut-medium-skin-tone": () => import("./emojis/EmojiManAstronautMediumSkinTone"),
  "man-bald": () => import("./emojis/EmojiManBald"),
  "man-beard": () => import("./emojis/EmojiManBeard"),
  "man-biking": () => import("./emojis/EmojiManBiking"),
  "man-biking-dark-skin-tone": () => import("./emojis/EmojiManBikingDarkSkinTone"),
  "man-biking-light-skin-tone": () => import("./emojis/EmojiManBikingLightSkinTone"),
  "man-biking-medium-dark-skin-tone": () => import("./emojis/EmojiManBikingMediumDarkSkinTone"),
  "man-biking-medium-light-skin-tone": () => import("./emojis/EmojiManBikingMediumLightSkinTone"),
  "man-biking-medium-skin-tone": () => import("./emojis/EmojiManBikingMediumSkinTone"),
  "man-blond-hair": () => import("./emojis/EmojiManBlondHair"),
  "man-bouncing-ball": () => import("./emojis/EmojiManBouncingBall"),
  "man-bouncing-ball-dark-skin-tone": () => import("./emojis/EmojiManBouncingBallDarkSkinTone"),
  "man-bouncing-ball-light-skin-tone": () => import("./emojis/EmojiManBouncingBallLightSkinTone"),
  "man-bouncing-ball-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManBouncingBallMediumDarkSkinTone"),
  "man-bouncing-ball-medium-light-skin-tone": () =>
    import("./emojis/EmojiManBouncingBallMediumLightSkinTone"),
  "man-bouncing-ball-medium-skin-tone": () => import("./emojis/EmojiManBouncingBallMediumSkinTone"),
  "man-bowing": () => import("./emojis/EmojiManBowing"),
  "man-bowing-dark-skin-tone": () => import("./emojis/EmojiManBowingDarkSkinTone"),
  "man-bowing-light-skin-tone": () => import("./emojis/EmojiManBowingLightSkinTone"),
  "man-bowing-medium-dark-skin-tone": () => import("./emojis/EmojiManBowingMediumDarkSkinTone"),
  "man-bowing-medium-light-skin-tone": () => import("./emojis/EmojiManBowingMediumLightSkinTone"),
  "man-bowing-medium-skin-tone": () => import("./emojis/EmojiManBowingMediumSkinTone"),
  "man-cartwheeling": () => import("./emojis/EmojiManCartwheeling"),
  "man-cartwheeling-dark-skin-tone": () => import("./emojis/EmojiManCartwheelingDarkSkinTone"),
  "man-cartwheeling-light-skin-tone": () => import("./emojis/EmojiManCartwheelingLightSkinTone"),
  "man-cartwheeling-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManCartwheelingMediumDarkSkinTone"),
  "man-cartwheeling-medium-light-skin-tone": () =>
    import("./emojis/EmojiManCartwheelingMediumLightSkinTone"),
  "man-cartwheeling-medium-skin-tone": () => import("./emojis/EmojiManCartwheelingMediumSkinTone"),
  "man-climbing": () => import("./emojis/EmojiManClimbing"),
  "man-climbing-dark-skin-tone": () => import("./emojis/EmojiManClimbingDarkSkinTone"),
  "man-climbing-light-skin-tone": () => import("./emojis/EmojiManClimbingLightSkinTone"),
  "man-climbing-medium-dark-skin-tone": () => import("./emojis/EmojiManClimbingMediumDarkSkinTone"),
  "man-climbing-medium-light-skin-tone": () =>
    import("./emojis/EmojiManClimbingMediumLightSkinTone"),
  "man-climbing-medium-skin-tone": () => import("./emojis/EmojiManClimbingMediumSkinTone"),
  "man-climbing-tone1": () => import("./emojis/EmojiManClimbingTone1"),
  "man-climbing-tone2": () => import("./emojis/EmojiManClimbingTone2"),
  "man-climbing-tone3": () => import("./emojis/EmojiManClimbingTone3"),
  "man-climbing-tone4": () => import("./emojis/EmojiManClimbingTone4"),
  "man-climbing-tone5": () => import("./emojis/EmojiManClimbingTone5"),
  "man-construction-worker": () => import("./emojis/EmojiManConstructionWorker"),
  "man-construction-worker-dark-skin-tone": () =>
    import("./emojis/EmojiManConstructionWorkerDarkSkinTone"),
  "man-construction-worker-light-skin-tone": () =>
    import("./emojis/EmojiManConstructionWorkerLightSkinTone"),
  "man-construction-worker-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManConstructionWorkerMediumDarkSkinTone"),
  "man-construction-worker-medium-light-skin-tone": () =>
    import("./emojis/EmojiManConstructionWorkerMediumLightSkinTone"),
  "man-construction-worker-medium-skin-tone": () =>
    import("./emojis/EmojiManConstructionWorkerMediumSkinTone"),
  "man-cook": () => import("./emojis/EmojiManCook"),
  "man-cook-dark-skin-tone": () => import("./emojis/EmojiManCookDarkSkinTone"),
  "man-cook-light-skin-tone": () => import("./emojis/EmojiManCookLightSkinTone"),
  "man-cook-medium-dark-skin-tone": () => import("./emojis/EmojiManCookMediumDarkSkinTone"),
  "man-cook-medium-light-skin-tone": () => import("./emojis/EmojiManCookMediumLightSkinTone"),
  "man-cook-medium-skin-tone": () => import("./emojis/EmojiManCookMediumSkinTone"),
  "man-curly-hair": () => import("./emojis/EmojiManCurlyHair"),
  "man-dancing": () => import("./emojis/EmojiManDancing"),
  "man-dancing-dark-skin-tone": () => import("./emojis/EmojiManDancingDarkSkinTone"),
  "man-dancing-light-skin-tone": () => import("./emojis/EmojiManDancingLightSkinTone"),
  "man-dancing-medium-dark-skin-tone": () => import("./emojis/EmojiManDancingMediumDarkSkinTone"),
  "man-dancing-medium-light-skin-tone": () => import("./emojis/EmojiManDancingMediumLightSkinTone"),
  "man-dancing-medium-skin-tone": () => import("./emojis/EmojiManDancingMediumSkinTone"),
  "man-dark-skin-tone": () => import("./emojis/EmojiManDarkSkinTone"),
  "man-dark-skin-tone-bald": () => import("./emojis/EmojiManDarkSkinToneBald"),
  "man-dark-skin-tone-beard": () => import("./emojis/EmojiManDarkSkinToneBeard"),
  "man-dark-skin-tone-blond-hair": () => import("./emojis/EmojiManDarkSkinToneBlondHair"),
  "man-dark-skin-tone-curly-hair": () => import("./emojis/EmojiManDarkSkinToneCurlyHair"),
  "man-dark-skin-tone-red-hair": () => import("./emojis/EmojiManDarkSkinToneRedHair"),
  "man-dark-skin-tone-white-hair": () => import("./emojis/EmojiManDarkSkinToneWhiteHair"),
  "man-detective": () => import("./emojis/EmojiManDetective"),
  "man-detective-dark-skin-tone": () => import("./emojis/EmojiManDetectiveDarkSkinTone"),
  "man-detective-light-skin-tone": () => import("./emojis/EmojiManDetectiveLightSkinTone"),
  "man-detective-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManDetectiveMediumDarkSkinTone"),
  "man-detective-medium-light-skin-tone": () =>
    import("./emojis/EmojiManDetectiveMediumLightSkinTone"),
  "man-detective-medium-skin-tone": () => import("./emojis/EmojiManDetectiveMediumSkinTone"),
  "man-elf": () => import("./emojis/EmojiManElf"),
  "man-elf-dark-skin-tone": () => import("./emojis/EmojiManElfDarkSkinTone"),
  "man-elf-light-skin-tone": () => import("./emojis/EmojiManElfLightSkinTone"),
  "man-elf-medium-dark-skin-tone": () => import("./emojis/EmojiManElfMediumDarkSkinTone"),
  "man-elf-medium-light-skin-tone": () => import("./emojis/EmojiManElfMediumLightSkinTone"),
  "man-elf-medium-skin-tone": () => import("./emojis/EmojiManElfMediumSkinTone"),
  "man-elf-tone1": () => import("./emojis/EmojiManElfTone1"),
  "man-elf-tone2": () => import("./emojis/EmojiManElfTone2"),
  "man-elf-tone3": () => import("./emojis/EmojiManElfTone3"),
  "man-elf-tone4": () => import("./emojis/EmojiManElfTone4"),
  "man-elf-tone5": () => import("./emojis/EmojiManElfTone5"),
  "man-facepalming": () => import("./emojis/EmojiManFacepalming"),
  "man-facepalming-dark-skin-tone": () => import("./emojis/EmojiManFacepalmingDarkSkinTone"),
  "man-facepalming-light-skin-tone": () => import("./emojis/EmojiManFacepalmingLightSkinTone"),
  "man-facepalming-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManFacepalmingMediumDarkSkinTone"),
  "man-facepalming-medium-light-skin-tone": () =>
    import("./emojis/EmojiManFacepalmingMediumLightSkinTone"),
  "man-facepalming-medium-skin-tone": () => import("./emojis/EmojiManFacepalmingMediumSkinTone"),
  "man-factory-worker": () => import("./emojis/EmojiManFactoryWorker"),
  "man-factory-worker-dark-skin-tone": () => import("./emojis/EmojiManFactoryWorkerDarkSkinTone"),
  "man-factory-worker-light-skin-tone": () => import("./emojis/EmojiManFactoryWorkerLightSkinTone"),
  "man-factory-worker-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManFactoryWorkerMediumDarkSkinTone"),
  "man-factory-worker-medium-light-skin-tone": () =>
    import("./emojis/EmojiManFactoryWorkerMediumLightSkinTone"),
  "man-factory-worker-medium-skin-tone": () =>
    import("./emojis/EmojiManFactoryWorkerMediumSkinTone"),
  "man-fairy": () => import("./emojis/EmojiManFairy"),
  "man-fairy-dark-skin-tone": () => import("./emojis/EmojiManFairyDarkSkinTone"),
  "man-fairy-light-skin-tone": () => import("./emojis/EmojiManFairyLightSkinTone"),
  "man-fairy-medium-dark-skin-tone": () => import("./emojis/EmojiManFairyMediumDarkSkinTone"),
  "man-fairy-medium-light-skin-tone": () => import("./emojis/EmojiManFairyMediumLightSkinTone"),
  "man-fairy-medium-skin-tone": () => import("./emojis/EmojiManFairyMediumSkinTone"),
  "man-farmer": () => import("./emojis/EmojiManFarmer"),
  "man-farmer-dark-skin-tone": () => import("./emojis/EmojiManFarmerDarkSkinTone"),
  "man-farmer-light-skin-tone": () => import("./emojis/EmojiManFarmerLightSkinTone"),
  "man-farmer-medium-dark-skin-tone": () => import("./emojis/EmojiManFarmerMediumDarkSkinTone"),
  "man-farmer-medium-light-skin-tone": () => import("./emojis/EmojiManFarmerMediumLightSkinTone"),
  "man-farmer-medium-skin-tone": () => import("./emojis/EmojiManFarmerMediumSkinTone"),
  "man-feeding-baby": () => import("./emojis/EmojiManFeedingBaby"),
  "man-feeding-baby-dark-skin-tone": () => import("./emojis/EmojiManFeedingBabyDarkSkinTone"),
  "man-feeding-baby-light-skin-tone": () => import("./emojis/EmojiManFeedingBabyLightSkinTone"),
  "man-feeding-baby-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManFeedingBabyMediumDarkSkinTone"),
  "man-feeding-baby-medium-light-skin-tone": () =>
    import("./emojis/EmojiManFeedingBabyMediumLightSkinTone"),
  "man-feeding-baby-medium-skin-tone": () => import("./emojis/EmojiManFeedingBabyMediumSkinTone"),
  "man-firefighter": () => import("./emojis/EmojiManFirefighter"),
  "man-firefighter-dark-skin-tone": () => import("./emojis/EmojiManFirefighterDarkSkinTone"),
  "man-firefighter-light-skin-tone": () => import("./emojis/EmojiManFirefighterLightSkinTone"),
  "man-firefighter-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManFirefighterMediumDarkSkinTone"),
  "man-firefighter-medium-light-skin-tone": () =>
    import("./emojis/EmojiManFirefighterMediumLightSkinTone"),
  "man-firefighter-medium-skin-tone": () => import("./emojis/EmojiManFirefighterMediumSkinTone"),
  "man-frowning": () => import("./emojis/EmojiManFrowning"),
  "man-frowning-dark-skin-tone": () => import("./emojis/EmojiManFrowningDarkSkinTone"),
  "man-frowning-light-skin-tone": () => import("./emojis/EmojiManFrowningLightSkinTone"),
  "man-frowning-medium-dark-skin-tone": () => import("./emojis/EmojiManFrowningMediumDarkSkinTone"),
  "man-frowning-medium-light-skin-tone": () =>
    import("./emojis/EmojiManFrowningMediumLightSkinTone"),
  "man-frowning-medium-skin-tone": () => import("./emojis/EmojiManFrowningMediumSkinTone"),
  "man-genie": () => import("./emojis/EmojiManGenie"),
  "man-gesturing-no": () => import("./emojis/EmojiManGesturingNo"),
  "man-gesturing-no-dark-skin-tone": () => import("./emojis/EmojiManGesturingNoDarkSkinTone"),
  "man-gesturing-no-light-skin-tone": () => import("./emojis/EmojiManGesturingNoLightSkinTone"),
  "man-gesturing-no-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManGesturingNoMediumDarkSkinTone"),
  "man-gesturing-no-medium-light-skin-tone": () =>
    import("./emojis/EmojiManGesturingNoMediumLightSkinTone"),
  "man-gesturing-no-medium-skin-tone": () => import("./emojis/EmojiManGesturingNoMediumSkinTone"),
  "man-gesturing-ok": () => import("./emojis/EmojiManGesturingOk"),
  "man-gesturing-ok-dark-skin-tone": () => import("./emojis/EmojiManGesturingOkDarkSkinTone"),
  "man-gesturing-ok-light-skin-tone": () => import("./emojis/EmojiManGesturingOkLightSkinTone"),
  "man-gesturing-ok-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManGesturingOkMediumDarkSkinTone"),
  "man-gesturing-ok-medium-light-skin-tone": () =>
    import("./emojis/EmojiManGesturingOkMediumLightSkinTone"),
  "man-gesturing-ok-medium-skin-tone": () => import("./emojis/EmojiManGesturingOkMediumSkinTone"),
  "man-getting-haircut": () => import("./emojis/EmojiManGettingHaircut"),
  "man-getting-haircut-dark-skin-tone": () => import("./emojis/EmojiManGettingHaircutDarkSkinTone"),
  "man-getting-haircut-light-skin-tone": () =>
    import("./emojis/EmojiManGettingHaircutLightSkinTone"),
  "man-getting-haircut-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManGettingHaircutMediumDarkSkinTone"),
  "man-getting-haircut-medium-light-skin-tone": () =>
    import("./emojis/EmojiManGettingHaircutMediumLightSkinTone"),
  "man-getting-haircut-medium-skin-tone": () =>
    import("./emojis/EmojiManGettingHaircutMediumSkinTone"),
  "man-getting-massage": () => import("./emojis/EmojiManGettingMassage"),
  "man-getting-massage-dark-skin-tone": () => import("./emojis/EmojiManGettingMassageDarkSkinTone"),
  "man-getting-massage-light-skin-tone": () =>
    import("./emojis/EmojiManGettingMassageLightSkinTone"),
  "man-getting-massage-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManGettingMassageMediumDarkSkinTone"),
  "man-getting-massage-medium-light-skin-tone": () =>
    import("./emojis/EmojiManGettingMassageMediumLightSkinTone"),
  "man-getting-massage-medium-skin-tone": () =>
    import("./emojis/EmojiManGettingMassageMediumSkinTone"),
  "man-golfing": () => import("./emojis/EmojiManGolfing"),
  "man-golfing-dark-skin-tone": () => import("./emojis/EmojiManGolfingDarkSkinTone"),
  "man-golfing-light-skin-tone": () => import("./emojis/EmojiManGolfingLightSkinTone"),
  "man-golfing-medium-dark-skin-tone": () => import("./emojis/EmojiManGolfingMediumDarkSkinTone"),
  "man-golfing-medium-light-skin-tone": () => import("./emojis/EmojiManGolfingMediumLightSkinTone"),
  "man-golfing-medium-skin-tone": () => import("./emojis/EmojiManGolfingMediumSkinTone"),
  "man-guard": () => import("./emojis/EmojiManGuard"),
  "man-guard-dark-skin-tone": () => import("./emojis/EmojiManGuardDarkSkinTone"),
  "man-guard-light-skin-tone": () => import("./emojis/EmojiManGuardLightSkinTone"),
  "man-guard-medium-dark-skin-tone": () => import("./emojis/EmojiManGuardMediumDarkSkinTone"),
  "man-guard-medium-light-skin-tone": () => import("./emojis/EmojiManGuardMediumLightSkinTone"),
  "man-guard-medium-skin-tone": () => import("./emojis/EmojiManGuardMediumSkinTone"),
  "man-health-worker": () => import("./emojis/EmojiManHealthWorker"),
  "man-health-worker-dark-skin-tone": () => import("./emojis/EmojiManHealthWorkerDarkSkinTone"),
  "man-health-worker-light-skin-tone": () => import("./emojis/EmojiManHealthWorkerLightSkinTone"),
  "man-health-worker-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManHealthWorkerMediumDarkSkinTone"),
  "man-health-worker-medium-light-skin-tone": () =>
    import("./emojis/EmojiManHealthWorkerMediumLightSkinTone"),
  "man-health-worker-medium-skin-tone": () => import("./emojis/EmojiManHealthWorkerMediumSkinTone"),
  "man-in-business-suit-levitating": () => import("./emojis/EmojiManInBusinessSuitLevitating"),
  "man-in-business-suit-levitating-dark-skin-tone": () =>
    import("./emojis/EmojiManInBusinessSuitLevitatingDarkSkinTone"),
  "man-in-business-suit-levitating-light-skin-tone": () =>
    import("./emojis/EmojiManInBusinessSuitLevitatingLightSkinTone"),
  "man-in-business-suit-levitating-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManInBusinessSuitLevitatingMediumDarkSkinTone"),
  "man-in-business-suit-levitating-medium-light-skin-tone": () =>
    import("./emojis/EmojiManInBusinessSuitLevitatingMediumLightSkinTone"),
  "man-in-business-suit-levitating-medium-skin-tone": () =>
    import("./emojis/EmojiManInBusinessSuitLevitatingMediumSkinTone"),
  "man-in-lotus-position": () => import("./emojis/EmojiManInLotusPosition"),
  "man-in-lotus-position-dark-skin-tone": () =>
    import("./emojis/EmojiManInLotusPositionDarkSkinTone"),
  "man-in-lotus-position-light-skin-tone": () =>
    import("./emojis/EmojiManInLotusPositionLightSkinTone"),
  "man-in-lotus-position-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManInLotusPositionMediumDarkSkinTone"),
  "man-in-lotus-position-medium-light-skin-tone": () =>
    import("./emojis/EmojiManInLotusPositionMediumLightSkinTone"),
  "man-in-lotus-position-medium-skin-tone": () =>
    import("./emojis/EmojiManInLotusPositionMediumSkinTone"),
  "man-in-manual-wheelchair": () => import("./emojis/EmojiManInManualWheelchair"),
  "man-in-manual-wheelchair-dark-skin-tone": () =>
    import("./emojis/EmojiManInManualWheelchairDarkSkinTone"),
  "man-in-manual-wheelchair-facing-right": () =>
    import("./emojis/EmojiManInManualWheelchairFacingRight"),
  "man-in-manual-wheelchair-facing-right-dark-skin-tone": () =>
    import("./emojis/EmojiManInManualWheelchairFacingRightDarkSkinTone"),
  "man-in-manual-wheelchair-facing-right-light-skin-tone": () =>
    import("./emojis/EmojiManInManualWheelchairFacingRightLightSkinTone"),
  "man-in-manual-wheelchair-facing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManInManualWheelchairFacingRightMediumDarkSkinTone"),
  "man-in-manual-wheelchair-facing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiManInManualWheelchairFacingRightMediumLightSkinTone"),
  "man-in-manual-wheelchair-facing-right-medium-skin-tone": () =>
    import("./emojis/EmojiManInManualWheelchairFacingRightMediumSkinTone"),
  "man-in-manual-wheelchair-light-skin-tone": () =>
    import("./emojis/EmojiManInManualWheelchairLightSkinTone"),
  "man-in-manual-wheelchair-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManInManualWheelchairMediumDarkSkinTone"),
  "man-in-manual-wheelchair-medium-light-skin-tone": () =>
    import("./emojis/EmojiManInManualWheelchairMediumLightSkinTone"),
  "man-in-manual-wheelchair-medium-skin-tone": () =>
    import("./emojis/EmojiManInManualWheelchairMediumSkinTone"),
  "man-in-motorized-wheelchair": () => import("./emojis/EmojiManInMotorizedWheelchair"),
  "man-in-motorized-wheelchair-dark-skin-tone": () =>
    import("./emojis/EmojiManInMotorizedWheelchairDarkSkinTone"),
  "man-in-motorized-wheelchair-facing-right": () =>
    import("./emojis/EmojiManInMotorizedWheelchairFacingRight"),
  "man-in-motorized-wheelchair-facing-right-dark-skin-tone": () =>
    import("./emojis/EmojiManInMotorizedWheelchairFacingRightDarkSkinTone"),
  "man-in-motorized-wheelchair-facing-right-light-skin-tone": () =>
    import("./emojis/EmojiManInMotorizedWheelchairFacingRightLightSkinTone"),
  "man-in-motorized-wheelchair-facing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManInMotorizedWheelchairFacingRightMediumDarkSkinTone"),
  "man-in-motorized-wheelchair-facing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiManInMotorizedWheelchairFacingRightMediumLightSkinTone"),
  "man-in-motorized-wheelchair-facing-right-medium-skin-tone": () =>
    import("./emojis/EmojiManInMotorizedWheelchairFacingRightMediumSkinTone"),
  "man-in-motorized-wheelchair-light-skin-tone": () =>
    import("./emojis/EmojiManInMotorizedWheelchairLightSkinTone"),
  "man-in-motorized-wheelchair-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManInMotorizedWheelchairMediumDarkSkinTone"),
  "man-in-motorized-wheelchair-medium-light-skin-tone": () =>
    import("./emojis/EmojiManInMotorizedWheelchairMediumLightSkinTone"),
  "man-in-motorized-wheelchair-medium-skin-tone": () =>
    import("./emojis/EmojiManInMotorizedWheelchairMediumSkinTone"),
  "man-in-steamy-room": () => import("./emojis/EmojiManInSteamyRoom"),
  "man-in-steamy-room-dark-skin-tone": () => import("./emojis/EmojiManInSteamyRoomDarkSkinTone"),
  "man-in-steamy-room-light-skin-tone": () => import("./emojis/EmojiManInSteamyRoomLightSkinTone"),
  "man-in-steamy-room-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManInSteamyRoomMediumDarkSkinTone"),
  "man-in-steamy-room-medium-light-skin-tone": () =>
    import("./emojis/EmojiManInSteamyRoomMediumLightSkinTone"),
  "man-in-steamy-room-medium-skin-tone": () =>
    import("./emojis/EmojiManInSteamyRoomMediumSkinTone"),
  "man-in-tuxedo": () => import("./emojis/EmojiManInTuxedo"),
  "man-in-tuxedo-dark-skin-tone": () => import("./emojis/EmojiManInTuxedoDarkSkinTone"),
  "man-in-tuxedo-light-skin-tone": () => import("./emojis/EmojiManInTuxedoLightSkinTone"),
  "man-in-tuxedo-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManInTuxedoMediumDarkSkinTone"),
  "man-in-tuxedo-medium-light-skin-tone": () =>
    import("./emojis/EmojiManInTuxedoMediumLightSkinTone"),
  "man-in-tuxedo-medium-skin-tone": () => import("./emojis/EmojiManInTuxedoMediumSkinTone"),
  "man-judge": () => import("./emojis/EmojiManJudge"),
  "man-judge-dark-skin-tone": () => import("./emojis/EmojiManJudgeDarkSkinTone"),
  "man-judge-light-skin-tone": () => import("./emojis/EmojiManJudgeLightSkinTone"),
  "man-judge-medium-dark-skin-tone": () => import("./emojis/EmojiManJudgeMediumDarkSkinTone"),
  "man-judge-medium-light-skin-tone": () => import("./emojis/EmojiManJudgeMediumLightSkinTone"),
  "man-judge-medium-skin-tone": () => import("./emojis/EmojiManJudgeMediumSkinTone"),
  "man-juggling": () => import("./emojis/EmojiManJuggling"),
  "man-juggling-dark-skin-tone": () => import("./emojis/EmojiManJugglingDarkSkinTone"),
  "man-juggling-light-skin-tone": () => import("./emojis/EmojiManJugglingLightSkinTone"),
  "man-juggling-medium-dark-skin-tone": () => import("./emojis/EmojiManJugglingMediumDarkSkinTone"),
  "man-juggling-medium-light-skin-tone": () =>
    import("./emojis/EmojiManJugglingMediumLightSkinTone"),
  "man-juggling-medium-skin-tone": () => import("./emojis/EmojiManJugglingMediumSkinTone"),
  "man-kneeling": () => import("./emojis/EmojiManKneeling"),
  "man-kneeling-dark-skin-tone": () => import("./emojis/EmojiManKneelingDarkSkinTone"),
  "man-kneeling-facing-right": () => import("./emojis/EmojiManKneelingFacingRight"),
  "man-kneeling-facing-right-dark-skin-tone": () =>
    import("./emojis/EmojiManKneelingFacingRightDarkSkinTone"),
  "man-kneeling-facing-right-light-skin-tone": () =>
    import("./emojis/EmojiManKneelingFacingRightLightSkinTone"),
  "man-kneeling-facing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManKneelingFacingRightMediumDarkSkinTone"),
  "man-kneeling-facing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiManKneelingFacingRightMediumLightSkinTone"),
  "man-kneeling-facing-right-medium-skin-tone": () =>
    import("./emojis/EmojiManKneelingFacingRightMediumSkinTone"),
  "man-kneeling-light-skin-tone": () => import("./emojis/EmojiManKneelingLightSkinTone"),
  "man-kneeling-medium-dark-skin-tone": () => import("./emojis/EmojiManKneelingMediumDarkSkinTone"),
  "man-kneeling-medium-light-skin-tone": () =>
    import("./emojis/EmojiManKneelingMediumLightSkinTone"),
  "man-kneeling-medium-skin-tone": () => import("./emojis/EmojiManKneelingMediumSkinTone"),
  "man-lifting-weights": () => import("./emojis/EmojiManLiftingWeights"),
  "man-lifting-weights-dark-skin-tone": () => import("./emojis/EmojiManLiftingWeightsDarkSkinTone"),
  "man-lifting-weights-light-skin-tone": () =>
    import("./emojis/EmojiManLiftingWeightsLightSkinTone"),
  "man-lifting-weights-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManLiftingWeightsMediumDarkSkinTone"),
  "man-lifting-weights-medium-light-skin-tone": () =>
    import("./emojis/EmojiManLiftingWeightsMediumLightSkinTone"),
  "man-lifting-weights-medium-skin-tone": () =>
    import("./emojis/EmojiManLiftingWeightsMediumSkinTone"),
  "man-light-skin-tone": () => import("./emojis/EmojiManLightSkinTone"),
  "man-light-skin-tone-bald": () => import("./emojis/EmojiManLightSkinToneBald"),
  "man-light-skin-tone-beard": () => import("./emojis/EmojiManLightSkinToneBeard"),
  "man-light-skin-tone-blond-hair": () => import("./emojis/EmojiManLightSkinToneBlondHair"),
  "man-light-skin-tone-curly-hair": () => import("./emojis/EmojiManLightSkinToneCurlyHair"),
  "man-light-skin-tone-red-hair": () => import("./emojis/EmojiManLightSkinToneRedHair"),
  "man-light-skin-tone-white-hair": () => import("./emojis/EmojiManLightSkinToneWhiteHair"),
  "man-mage": () => import("./emojis/EmojiManMage"),
  "man-mage-dark-skin-tone": () => import("./emojis/EmojiManMageDarkSkinTone"),
  "man-mage-light-skin-tone": () => import("./emojis/EmojiManMageLightSkinTone"),
  "man-mage-medium-dark-skin-tone": () => import("./emojis/EmojiManMageMediumDarkSkinTone"),
  "man-mage-medium-light-skin-tone": () => import("./emojis/EmojiManMageMediumLightSkinTone"),
  "man-mage-medium-skin-tone": () => import("./emojis/EmojiManMageMediumSkinTone"),
  "man-mechanic": () => import("./emojis/EmojiManMechanic"),
  "man-mechanic-dark-skin-tone": () => import("./emojis/EmojiManMechanicDarkSkinTone"),
  "man-mechanic-light-skin-tone": () => import("./emojis/EmojiManMechanicLightSkinTone"),
  "man-mechanic-medium-dark-skin-tone": () => import("./emojis/EmojiManMechanicMediumDarkSkinTone"),
  "man-mechanic-medium-light-skin-tone": () =>
    import("./emojis/EmojiManMechanicMediumLightSkinTone"),
  "man-mechanic-medium-skin-tone": () => import("./emojis/EmojiManMechanicMediumSkinTone"),
  "man-medium-dark-skin-tone": () => import("./emojis/EmojiManMediumDarkSkinTone"),
  "man-medium-dark-skin-tone-bald": () => import("./emojis/EmojiManMediumDarkSkinToneBald"),
  "man-medium-dark-skin-tone-beard": () => import("./emojis/EmojiManMediumDarkSkinToneBeard"),
  "man-medium-dark-skin-tone-blond-hair": () =>
    import("./emojis/EmojiManMediumDarkSkinToneBlondHair"),
  "man-medium-dark-skin-tone-curly-hair": () =>
    import("./emojis/EmojiManMediumDarkSkinToneCurlyHair"),
  "man-medium-dark-skin-tone-red-hair": () => import("./emojis/EmojiManMediumDarkSkinToneRedHair"),
  "man-medium-dark-skin-tone-white-hair": () =>
    import("./emojis/EmojiManMediumDarkSkinToneWhiteHair"),
  "man-medium-light-skin-tone": () => import("./emojis/EmojiManMediumLightSkinTone"),
  "man-medium-light-skin-tone-bald": () => import("./emojis/EmojiManMediumLightSkinToneBald"),
  "man-medium-light-skin-tone-beard": () => import("./emojis/EmojiManMediumLightSkinToneBeard"),
  "man-medium-light-skin-tone-blond-hair": () =>
    import("./emojis/EmojiManMediumLightSkinToneBlondHair"),
  "man-medium-light-skin-tone-curly-hair": () =>
    import("./emojis/EmojiManMediumLightSkinToneCurlyHair"),
  "man-medium-light-skin-tone-red-hair": () =>
    import("./emojis/EmojiManMediumLightSkinToneRedHair"),
  "man-medium-light-skin-tone-white-hair": () =>
    import("./emojis/EmojiManMediumLightSkinToneWhiteHair"),
  "man-medium-skin-tone": () => import("./emojis/EmojiManMediumSkinTone"),
  "man-medium-skin-tone-bald": () => import("./emojis/EmojiManMediumSkinToneBald"),
  "man-medium-skin-tone-beard": () => import("./emojis/EmojiManMediumSkinToneBeard"),
  "man-medium-skin-tone-blond-hair": () => import("./emojis/EmojiManMediumSkinToneBlondHair"),
  "man-medium-skin-tone-curly-hair": () => import("./emojis/EmojiManMediumSkinToneCurlyHair"),
  "man-medium-skin-tone-red-hair": () => import("./emojis/EmojiManMediumSkinToneRedHair"),
  "man-medium-skin-tone-white-hair": () => import("./emojis/EmojiManMediumSkinToneWhiteHair"),
  "man-mountain-biking": () => import("./emojis/EmojiManMountainBiking"),
  "man-mountain-biking-dark-skin-tone": () => import("./emojis/EmojiManMountainBikingDarkSkinTone"),
  "man-mountain-biking-light-skin-tone": () =>
    import("./emojis/EmojiManMountainBikingLightSkinTone"),
  "man-mountain-biking-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManMountainBikingMediumDarkSkinTone"),
  "man-mountain-biking-medium-light-skin-tone": () =>
    import("./emojis/EmojiManMountainBikingMediumLightSkinTone"),
  "man-mountain-biking-medium-skin-tone": () =>
    import("./emojis/EmojiManMountainBikingMediumSkinTone"),
  "man-office-worker": () => import("./emojis/EmojiManOfficeWorker"),
  "man-office-worker-dark-skin-tone": () => import("./emojis/EmojiManOfficeWorkerDarkSkinTone"),
  "man-office-worker-light-skin-tone": () => import("./emojis/EmojiManOfficeWorkerLightSkinTone"),
  "man-office-worker-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManOfficeWorkerMediumDarkSkinTone"),
  "man-office-worker-medium-light-skin-tone": () =>
    import("./emojis/EmojiManOfficeWorkerMediumLightSkinTone"),
  "man-office-worker-medium-skin-tone": () => import("./emojis/EmojiManOfficeWorkerMediumSkinTone"),
  "man-pilot": () => import("./emojis/EmojiManPilot"),
  "man-pilot-dark-skin-tone": () => import("./emojis/EmojiManPilotDarkSkinTone"),
  "man-pilot-light-skin-tone": () => import("./emojis/EmojiManPilotLightSkinTone"),
  "man-pilot-medium-dark-skin-tone": () => import("./emojis/EmojiManPilotMediumDarkSkinTone"),
  "man-pilot-medium-light-skin-tone": () => import("./emojis/EmojiManPilotMediumLightSkinTone"),
  "man-pilot-medium-skin-tone": () => import("./emojis/EmojiManPilotMediumSkinTone"),
  "man-playing-handball": () => import("./emojis/EmojiManPlayingHandball"),
  "man-playing-handball-dark-skin-tone": () =>
    import("./emojis/EmojiManPlayingHandballDarkSkinTone"),
  "man-playing-handball-light-skin-tone": () =>
    import("./emojis/EmojiManPlayingHandballLightSkinTone"),
  "man-playing-handball-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManPlayingHandballMediumDarkSkinTone"),
  "man-playing-handball-medium-light-skin-tone": () =>
    import("./emojis/EmojiManPlayingHandballMediumLightSkinTone"),
  "man-playing-handball-medium-skin-tone": () =>
    import("./emojis/EmojiManPlayingHandballMediumSkinTone"),
  "man-playing-water-polo": () => import("./emojis/EmojiManPlayingWaterPolo"),
  "man-playing-water-polo-dark-skin-tone": () =>
    import("./emojis/EmojiManPlayingWaterPoloDarkSkinTone"),
  "man-playing-water-polo-light-skin-tone": () =>
    import("./emojis/EmojiManPlayingWaterPoloLightSkinTone"),
  "man-playing-water-polo-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManPlayingWaterPoloMediumDarkSkinTone"),
  "man-playing-water-polo-medium-light-skin-tone": () =>
    import("./emojis/EmojiManPlayingWaterPoloMediumLightSkinTone"),
  "man-playing-water-polo-medium-skin-tone": () =>
    import("./emojis/EmojiManPlayingWaterPoloMediumSkinTone"),
  "man-police-officer": () => import("./emojis/EmojiManPoliceOfficer"),
  "man-police-officer-dark-skin-tone": () => import("./emojis/EmojiManPoliceOfficerDarkSkinTone"),
  "man-police-officer-light-skin-tone": () => import("./emojis/EmojiManPoliceOfficerLightSkinTone"),
  "man-police-officer-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManPoliceOfficerMediumDarkSkinTone"),
  "man-police-officer-medium-light-skin-tone": () =>
    import("./emojis/EmojiManPoliceOfficerMediumLightSkinTone"),
  "man-police-officer-medium-skin-tone": () =>
    import("./emojis/EmojiManPoliceOfficerMediumSkinTone"),
  "man-pouting": () => import("./emojis/EmojiManPouting"),
  "man-pouting-dark-skin-tone": () => import("./emojis/EmojiManPoutingDarkSkinTone"),
  "man-pouting-light-skin-tone": () => import("./emojis/EmojiManPoutingLightSkinTone"),
  "man-pouting-medium-dark-skin-tone": () => import("./emojis/EmojiManPoutingMediumDarkSkinTone"),
  "man-pouting-medium-light-skin-tone": () => import("./emojis/EmojiManPoutingMediumLightSkinTone"),
  "man-pouting-medium-skin-tone": () => import("./emojis/EmojiManPoutingMediumSkinTone"),
  "man-raising-hand": () => import("./emojis/EmojiManRaisingHand"),
  "man-raising-hand-dark-skin-tone": () => import("./emojis/EmojiManRaisingHandDarkSkinTone"),
  "man-raising-hand-light-skin-tone": () => import("./emojis/EmojiManRaisingHandLightSkinTone"),
  "man-raising-hand-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManRaisingHandMediumDarkSkinTone"),
  "man-raising-hand-medium-light-skin-tone": () =>
    import("./emojis/EmojiManRaisingHandMediumLightSkinTone"),
  "man-raising-hand-medium-skin-tone": () => import("./emojis/EmojiManRaisingHandMediumSkinTone"),
  "man-red-hair": () => import("./emojis/EmojiManRedHair"),
  "man-rowing-boat": () => import("./emojis/EmojiManRowingBoat"),
  "man-rowing-boat-dark-skin-tone": () => import("./emojis/EmojiManRowingBoatDarkSkinTone"),
  "man-rowing-boat-light-skin-tone": () => import("./emojis/EmojiManRowingBoatLightSkinTone"),
  "man-rowing-boat-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManRowingBoatMediumDarkSkinTone"),
  "man-rowing-boat-medium-light-skin-tone": () =>
    import("./emojis/EmojiManRowingBoatMediumLightSkinTone"),
  "man-rowing-boat-medium-skin-tone": () => import("./emojis/EmojiManRowingBoatMediumSkinTone"),
  "man-running": () => import("./emojis/EmojiManRunning"),
  "man-running-dark-skin-tone": () => import("./emojis/EmojiManRunningDarkSkinTone"),
  "man-running-facing-right": () => import("./emojis/EmojiManRunningFacingRight"),
  "man-running-facing-right-dark-skin-tone": () =>
    import("./emojis/EmojiManRunningFacingRightDarkSkinTone"),
  "man-running-facing-right-light-skin-tone": () =>
    import("./emojis/EmojiManRunningFacingRightLightSkinTone"),
  "man-running-facing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManRunningFacingRightMediumDarkSkinTone"),
  "man-running-facing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiManRunningFacingRightMediumLightSkinTone"),
  "man-running-facing-right-medium-skin-tone": () =>
    import("./emojis/EmojiManRunningFacingRightMediumSkinTone"),
  "man-running-light-skin-tone": () => import("./emojis/EmojiManRunningLightSkinTone"),
  "man-running-medium-dark-skin-tone": () => import("./emojis/EmojiManRunningMediumDarkSkinTone"),
  "man-running-medium-light-skin-tone": () => import("./emojis/EmojiManRunningMediumLightSkinTone"),
  "man-running-medium-skin-tone": () => import("./emojis/EmojiManRunningMediumSkinTone"),
  "man-scientist": () => import("./emojis/EmojiManScientist"),
  "man-scientist-dark-skin-tone": () => import("./emojis/EmojiManScientistDarkSkinTone"),
  "man-scientist-light-skin-tone": () => import("./emojis/EmojiManScientistLightSkinTone"),
  "man-scientist-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManScientistMediumDarkSkinTone"),
  "man-scientist-medium-light-skin-tone": () =>
    import("./emojis/EmojiManScientistMediumLightSkinTone"),
  "man-scientist-medium-skin-tone": () => import("./emojis/EmojiManScientistMediumSkinTone"),
  "man-shrugging": () => import("./emojis/EmojiManShrugging"),
  "man-shrugging-dark-skin-tone": () => import("./emojis/EmojiManShruggingDarkSkinTone"),
  "man-shrugging-light-skin-tone": () => import("./emojis/EmojiManShruggingLightSkinTone"),
  "man-shrugging-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManShruggingMediumDarkSkinTone"),
  "man-shrugging-medium-light-skin-tone": () =>
    import("./emojis/EmojiManShruggingMediumLightSkinTone"),
  "man-shrugging-medium-skin-tone": () => import("./emojis/EmojiManShruggingMediumSkinTone"),
  "man-singer": () => import("./emojis/EmojiManSinger"),
  "man-singer-dark-skin-tone": () => import("./emojis/EmojiManSingerDarkSkinTone"),
  "man-singer-light-skin-tone": () => import("./emojis/EmojiManSingerLightSkinTone"),
  "man-singer-medium-dark-skin-tone": () => import("./emojis/EmojiManSingerMediumDarkSkinTone"),
  "man-singer-medium-light-skin-tone": () => import("./emojis/EmojiManSingerMediumLightSkinTone"),
  "man-singer-medium-skin-tone": () => import("./emojis/EmojiManSingerMediumSkinTone"),
  "man-standing": () => import("./emojis/EmojiManStanding"),
  "man-standing-dark-skin-tone": () => import("./emojis/EmojiManStandingDarkSkinTone"),
  "man-standing-light-skin-tone": () => import("./emojis/EmojiManStandingLightSkinTone"),
  "man-standing-medium-dark-skin-tone": () => import("./emojis/EmojiManStandingMediumDarkSkinTone"),
  "man-standing-medium-light-skin-tone": () =>
    import("./emojis/EmojiManStandingMediumLightSkinTone"),
  "man-standing-medium-skin-tone": () => import("./emojis/EmojiManStandingMediumSkinTone"),
  "man-student": () => import("./emojis/EmojiManStudent"),
  "man-student-dark-skin-tone": () => import("./emojis/EmojiManStudentDarkSkinTone"),
  "man-student-light-skin-tone": () => import("./emojis/EmojiManStudentLightSkinTone"),
  "man-student-medium-dark-skin-tone": () => import("./emojis/EmojiManStudentMediumDarkSkinTone"),
  "man-student-medium-light-skin-tone": () => import("./emojis/EmojiManStudentMediumLightSkinTone"),
  "man-student-medium-skin-tone": () => import("./emojis/EmojiManStudentMediumSkinTone"),
  "man-superhero": () => import("./emojis/EmojiManSuperhero"),
  "man-superhero-dark-skin-tone": () => import("./emojis/EmojiManSuperheroDarkSkinTone"),
  "man-superhero-light-skin-tone": () => import("./emojis/EmojiManSuperheroLightSkinTone"),
  "man-superhero-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManSuperheroMediumDarkSkinTone"),
  "man-superhero-medium-light-skin-tone": () =>
    import("./emojis/EmojiManSuperheroMediumLightSkinTone"),
  "man-superhero-medium-skin-tone": () => import("./emojis/EmojiManSuperheroMediumSkinTone"),
  "man-supervillain": () => import("./emojis/EmojiManSupervillain"),
  "man-supervillain-dark-skin-tone": () => import("./emojis/EmojiManSupervillainDarkSkinTone"),
  "man-supervillain-light-skin-tone": () => import("./emojis/EmojiManSupervillainLightSkinTone"),
  "man-supervillain-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManSupervillainMediumDarkSkinTone"),
  "man-supervillain-medium-light-skin-tone": () =>
    import("./emojis/EmojiManSupervillainMediumLightSkinTone"),
  "man-supervillain-medium-skin-tone": () => import("./emojis/EmojiManSupervillainMediumSkinTone"),
  "man-surfing": () => import("./emojis/EmojiManSurfing"),
  "man-surfing-dark-skin-tone": () => import("./emojis/EmojiManSurfingDarkSkinTone"),
  "man-surfing-light-skin-tone": () => import("./emojis/EmojiManSurfingLightSkinTone"),
  "man-surfing-medium-dark-skin-tone": () => import("./emojis/EmojiManSurfingMediumDarkSkinTone"),
  "man-surfing-medium-light-skin-tone": () => import("./emojis/EmojiManSurfingMediumLightSkinTone"),
  "man-surfing-medium-skin-tone": () => import("./emojis/EmojiManSurfingMediumSkinTone"),
  "man-swimming": () => import("./emojis/EmojiManSwimming"),
  "man-swimming-dark-skin-tone": () => import("./emojis/EmojiManSwimmingDarkSkinTone"),
  "man-swimming-light-skin-tone": () => import("./emojis/EmojiManSwimmingLightSkinTone"),
  "man-swimming-medium-dark-skin-tone": () => import("./emojis/EmojiManSwimmingMediumDarkSkinTone"),
  "man-swimming-medium-light-skin-tone": () =>
    import("./emojis/EmojiManSwimmingMediumLightSkinTone"),
  "man-swimming-medium-skin-tone": () => import("./emojis/EmojiManSwimmingMediumSkinTone"),
  "man-teacher": () => import("./emojis/EmojiManTeacher"),
  "man-teacher-dark-skin-tone": () => import("./emojis/EmojiManTeacherDarkSkinTone"),
  "man-teacher-light-skin-tone": () => import("./emojis/EmojiManTeacherLightSkinTone"),
  "man-teacher-medium-dark-skin-tone": () => import("./emojis/EmojiManTeacherMediumDarkSkinTone"),
  "man-teacher-medium-light-skin-tone": () => import("./emojis/EmojiManTeacherMediumLightSkinTone"),
  "man-teacher-medium-skin-tone": () => import("./emojis/EmojiManTeacherMediumSkinTone"),
  "man-technologist": () => import("./emojis/EmojiManTechnologist"),
  "man-technologist-dark-skin-tone": () => import("./emojis/EmojiManTechnologistDarkSkinTone"),
  "man-technologist-light-skin-tone": () => import("./emojis/EmojiManTechnologistLightSkinTone"),
  "man-technologist-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManTechnologistMediumDarkSkinTone"),
  "man-technologist-medium-light-skin-tone": () =>
    import("./emojis/EmojiManTechnologistMediumLightSkinTone"),
  "man-technologist-medium-skin-tone": () => import("./emojis/EmojiManTechnologistMediumSkinTone"),
  "man-tipping-hand": () => import("./emojis/EmojiManTippingHand"),
  "man-tipping-hand-dark-skin-tone": () => import("./emojis/EmojiManTippingHandDarkSkinTone"),
  "man-tipping-hand-light-skin-tone": () => import("./emojis/EmojiManTippingHandLightSkinTone"),
  "man-tipping-hand-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManTippingHandMediumDarkSkinTone"),
  "man-tipping-hand-medium-light-skin-tone": () =>
    import("./emojis/EmojiManTippingHandMediumLightSkinTone"),
  "man-tipping-hand-medium-skin-tone": () => import("./emojis/EmojiManTippingHandMediumSkinTone"),
  "man-vampire": () => import("./emojis/EmojiManVampire"),
  "man-vampire-dark-skin-tone": () => import("./emojis/EmojiManVampireDarkSkinTone"),
  "man-vampire-light-skin-tone": () => import("./emojis/EmojiManVampireLightSkinTone"),
  "man-vampire-medium-dark-skin-tone": () => import("./emojis/EmojiManVampireMediumDarkSkinTone"),
  "man-vampire-medium-light-skin-tone": () => import("./emojis/EmojiManVampireMediumLightSkinTone"),
  "man-vampire-medium-skin-tone": () => import("./emojis/EmojiManVampireMediumSkinTone"),
  "man-walking": () => import("./emojis/EmojiManWalking"),
  "man-walking-dark-skin-tone": () => import("./emojis/EmojiManWalkingDarkSkinTone"),
  "man-walking-facing-right": () => import("./emojis/EmojiManWalkingFacingRight"),
  "man-walking-facing-right-dark-skin-tone": () =>
    import("./emojis/EmojiManWalkingFacingRightDarkSkinTone"),
  "man-walking-facing-right-light-skin-tone": () =>
    import("./emojis/EmojiManWalkingFacingRightLightSkinTone"),
  "man-walking-facing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManWalkingFacingRightMediumDarkSkinTone"),
  "man-walking-facing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiManWalkingFacingRightMediumLightSkinTone"),
  "man-walking-facing-right-medium-skin-tone": () =>
    import("./emojis/EmojiManWalkingFacingRightMediumSkinTone"),
  "man-walking-light-skin-tone": () => import("./emojis/EmojiManWalkingLightSkinTone"),
  "man-walking-medium-dark-skin-tone": () => import("./emojis/EmojiManWalkingMediumDarkSkinTone"),
  "man-walking-medium-light-skin-tone": () => import("./emojis/EmojiManWalkingMediumLightSkinTone"),
  "man-walking-medium-skin-tone": () => import("./emojis/EmojiManWalkingMediumSkinTone"),
  "man-wearing-turban": () => import("./emojis/EmojiManWearingTurban"),
  "man-wearing-turban-dark-skin-tone": () => import("./emojis/EmojiManWearingTurbanDarkSkinTone"),
  "man-wearing-turban-light-skin-tone": () => import("./emojis/EmojiManWearingTurbanLightSkinTone"),
  "man-wearing-turban-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManWearingTurbanMediumDarkSkinTone"),
  "man-wearing-turban-medium-light-skin-tone": () =>
    import("./emojis/EmojiManWearingTurbanMediumLightSkinTone"),
  "man-wearing-turban-medium-skin-tone": () =>
    import("./emojis/EmojiManWearingTurbanMediumSkinTone"),
  "man-white-hair": () => import("./emojis/EmojiManWhiteHair"),
  "man-with-veil": () => import("./emojis/EmojiManWithVeil"),
  "man-with-veil-dark-skin-tone": () => import("./emojis/EmojiManWithVeilDarkSkinTone"),
  "man-with-veil-light-skin-tone": () => import("./emojis/EmojiManWithVeilLightSkinTone"),
  "man-with-veil-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManWithVeilMediumDarkSkinTone"),
  "man-with-veil-medium-light-skin-tone": () =>
    import("./emojis/EmojiManWithVeilMediumLightSkinTone"),
  "man-with-veil-medium-skin-tone": () => import("./emojis/EmojiManWithVeilMediumSkinTone"),
  "man-with-white-cane": () => import("./emojis/EmojiManWithWhiteCane"),
  "man-with-white-cane-dark-skin-tone": () => import("./emojis/EmojiManWithWhiteCaneDarkSkinTone"),
  "man-with-white-cane-facing-right": () => import("./emojis/EmojiManWithWhiteCaneFacingRight"),
  "man-with-white-cane-facing-right-dark-skin-tone": () =>
    import("./emojis/EmojiManWithWhiteCaneFacingRightDarkSkinTone"),
  "man-with-white-cane-facing-right-light-skin-tone": () =>
    import("./emojis/EmojiManWithWhiteCaneFacingRightLightSkinTone"),
  "man-with-white-cane-facing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManWithWhiteCaneFacingRightMediumDarkSkinTone"),
  "man-with-white-cane-facing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiManWithWhiteCaneFacingRightMediumLightSkinTone"),
  "man-with-white-cane-facing-right-medium-skin-tone": () =>
    import("./emojis/EmojiManWithWhiteCaneFacingRightMediumSkinTone"),
  "man-with-white-cane-light-skin-tone": () =>
    import("./emojis/EmojiManWithWhiteCaneLightSkinTone"),
  "man-with-white-cane-medium-dark-skin-tone": () =>
    import("./emojis/EmojiManWithWhiteCaneMediumDarkSkinTone"),
  "man-with-white-cane-medium-light-skin-tone": () =>
    import("./emojis/EmojiManWithWhiteCaneMediumLightSkinTone"),
  "man-with-white-cane-medium-skin-tone": () =>
    import("./emojis/EmojiManWithWhiteCaneMediumSkinTone"),
  "man-zombie": () => import("./emojis/EmojiManZombie"),
  mango: () => import("./emojis/EmojiMango"),
  "mans-shoe": () => import("./emojis/EmojiMansShoe"),
  "mantelpiece-clock": () => import("./emojis/EmojiMantelpieceClock"),
  "manual-wheelchair": () => import("./emojis/EmojiManualWheelchair"),
  "map-of-japan": () => import("./emojis/EmojiMapOfJapan"),
  "maple-leaf": () => import("./emojis/EmojiMapleLeaf"),
  maracas: () => import("./emojis/EmojiMaracas"),
  "martial-arts-uniform": () => import("./emojis/EmojiMartialArtsUniform"),
  mate: () => import("./emojis/EmojiMate"),
  "meat-on-bone": () => import("./emojis/EmojiMeatOnBone"),
  mechanic: () => import("./emojis/EmojiMechanic"),
  "mechanic-dark-skin-tone": () => import("./emojis/EmojiMechanicDarkSkinTone"),
  "mechanic-light-skin-tone": () => import("./emojis/EmojiMechanicLightSkinTone"),
  "mechanic-medium-dark-skin-tone": () => import("./emojis/EmojiMechanicMediumDarkSkinTone"),
  "mechanic-medium-light-skin-tone": () => import("./emojis/EmojiMechanicMediumLightSkinTone"),
  "mechanic-medium-skin-tone": () => import("./emojis/EmojiMechanicMediumSkinTone"),
  "mechanical-arm": () => import("./emojis/EmojiMechanicalArm"),
  "mechanical-leg": () => import("./emojis/EmojiMechanicalLeg"),
  "medical-symbol": () => import("./emojis/EmojiMedicalSymbol"),
  "medium-dark-skin-tone": () => import("./emojis/EmojiMediumDarkSkinTone"),
  "medium-light-skin-tone": () => import("./emojis/EmojiMediumLightSkinTone"),
  "medium-skin-tone": () => import("./emojis/EmojiMediumSkinTone"),
  megaphone: () => import("./emojis/EmojiMegaphone"),
  melon: () => import("./emojis/EmojiMelon"),
  "melting-face": () => import("./emojis/EmojiMeltingFace"),
  memo: () => import("./emojis/EmojiMemo"),
  "men-holding-hands": () => import("./emojis/EmojiMenHoldingHands"),
  "men-holding-hands-dark-skin-tone": () => import("./emojis/EmojiMenHoldingHandsDarkSkinTone"),
  "men-holding-hands-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsDarkSkinToneLightSkinTone"),
  "men-holding-hands-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsDarkSkinToneMediumDarkSkinTone"),
  "men-holding-hands-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsDarkSkinToneMediumLightSkinTone"),
  "men-holding-hands-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsDarkSkinToneMediumSkinTone"),
  "men-holding-hands-light-skin-tone": () => import("./emojis/EmojiMenHoldingHandsLightSkinTone"),
  "men-holding-hands-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsLightSkinToneDarkSkinTone"),
  "men-holding-hands-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsLightSkinToneMediumDarkSkinTone"),
  "men-holding-hands-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsLightSkinToneMediumLightSkinTone"),
  "men-holding-hands-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsLightSkinToneMediumSkinTone"),
  "men-holding-hands-medium-dark-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsMediumDarkSkinTone"),
  "men-holding-hands-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsMediumDarkSkinToneDarkSkinTone"),
  "men-holding-hands-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsMediumDarkSkinToneLightSkinTone"),
  "men-holding-hands-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsMediumDarkSkinToneMediumLightSkinTone"),
  "men-holding-hands-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsMediumDarkSkinToneMediumSkinTone"),
  "men-holding-hands-medium-light-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsMediumLightSkinTone"),
  "men-holding-hands-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsMediumLightSkinToneDarkSkinTone"),
  "men-holding-hands-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsMediumLightSkinToneLightSkinTone"),
  "men-holding-hands-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsMediumLightSkinToneMediumDarkSkinTone"),
  "men-holding-hands-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsMediumLightSkinToneMediumSkinTone"),
  "men-holding-hands-medium-skin-tone": () => import("./emojis/EmojiMenHoldingHandsMediumSkinTone"),
  "men-holding-hands-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsMediumSkinToneDarkSkinTone"),
  "men-holding-hands-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsMediumSkinToneLightSkinTone"),
  "men-holding-hands-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsMediumSkinToneMediumDarkSkinTone"),
  "men-holding-hands-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiMenHoldingHandsMediumSkinToneMediumLightSkinTone"),
  "men-with-bunny-ears": () => import("./emojis/EmojiMenWithBunnyEars"),
  "men-with-bunny-ears-dark-skin-tone": () => import("./emojis/EmojiMenWithBunnyEarsDarkSkinTone"),
  "men-with-bunny-ears-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsDarkSkinToneLightSkinTone"),
  "men-with-bunny-ears-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsDarkSkinToneMediumDarkSkinTone"),
  "men-with-bunny-ears-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsDarkSkinToneMediumLightSkinTone"),
  "men-with-bunny-ears-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsDarkSkinToneMediumSkinTone"),
  "men-with-bunny-ears-light-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsLightSkinTone"),
  "men-with-bunny-ears-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsLightSkinToneDarkSkinTone"),
  "men-with-bunny-ears-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsLightSkinToneMediumDarkSkinTone"),
  "men-with-bunny-ears-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsLightSkinToneMediumLightSkinTone"),
  "men-with-bunny-ears-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsLightSkinToneMediumSkinTone"),
  "men-with-bunny-ears-medium-dark-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsMediumDarkSkinTone"),
  "men-with-bunny-ears-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsMediumDarkSkinToneDarkSkinTone"),
  "men-with-bunny-ears-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsMediumDarkSkinToneLightSkinTone"),
  "men-with-bunny-ears-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsMediumDarkSkinToneMediumLightSkinTone"),
  "men-with-bunny-ears-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsMediumDarkSkinToneMediumSkinTone"),
  "men-with-bunny-ears-medium-light-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsMediumLightSkinTone"),
  "men-with-bunny-ears-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsMediumLightSkinToneDarkSkinTone"),
  "men-with-bunny-ears-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsMediumLightSkinToneLightSkinTone"),
  "men-with-bunny-ears-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsMediumLightSkinToneMediumDarkSkinTone"),
  "men-with-bunny-ears-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsMediumLightSkinToneMediumSkinTone"),
  "men-with-bunny-ears-medium-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsMediumSkinTone"),
  "men-with-bunny-ears-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsMediumSkinToneDarkSkinTone"),
  "men-with-bunny-ears-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsMediumSkinToneLightSkinTone"),
  "men-with-bunny-ears-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsMediumSkinToneMediumDarkSkinTone"),
  "men-with-bunny-ears-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiMenWithBunnyEarsMediumSkinToneMediumLightSkinTone"),
  "men-wrestling": () => import("./emojis/EmojiMenWrestling"),
  "men-wrestling-dark-skin-tone": () => import("./emojis/EmojiMenWrestlingDarkSkinTone"),
  "men-wrestling-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingDarkSkinToneLightSkinTone"),
  "men-wrestling-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingDarkSkinToneMediumDarkSkinTone"),
  "men-wrestling-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingDarkSkinToneMediumLightSkinTone"),
  "men-wrestling-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingDarkSkinToneMediumSkinTone"),
  "men-wrestling-light-skin-tone": () => import("./emojis/EmojiMenWrestlingLightSkinTone"),
  "men-wrestling-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingLightSkinToneDarkSkinTone"),
  "men-wrestling-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingLightSkinToneMediumDarkSkinTone"),
  "men-wrestling-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingLightSkinToneMediumLightSkinTone"),
  "men-wrestling-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingLightSkinToneMediumSkinTone"),
  "men-wrestling-medium-dark-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingMediumDarkSkinTone"),
  "men-wrestling-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingMediumDarkSkinToneDarkSkinTone"),
  "men-wrestling-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingMediumDarkSkinToneLightSkinTone"),
  "men-wrestling-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingMediumDarkSkinToneMediumLightSkinTone"),
  "men-wrestling-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingMediumDarkSkinToneMediumSkinTone"),
  "men-wrestling-medium-light-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingMediumLightSkinTone"),
  "men-wrestling-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingMediumLightSkinToneDarkSkinTone"),
  "men-wrestling-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingMediumLightSkinToneLightSkinTone"),
  "men-wrestling-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingMediumLightSkinToneMediumDarkSkinTone"),
  "men-wrestling-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingMediumLightSkinToneMediumSkinTone"),
  "men-wrestling-medium-skin-tone": () => import("./emojis/EmojiMenWrestlingMediumSkinTone"),
  "men-wrestling-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingMediumSkinToneDarkSkinTone"),
  "men-wrestling-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingMediumSkinToneLightSkinTone"),
  "men-wrestling-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingMediumSkinToneMediumDarkSkinTone"),
  "men-wrestling-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiMenWrestlingMediumSkinToneMediumLightSkinTone"),
  "mending-heart": () => import("./emojis/EmojiMendingHeart"),
  menorah: () => import("./emojis/EmojiMenorah"),
  "mens-room": () => import("./emojis/EmojiMensRoom"),
  mermaid: () => import("./emojis/EmojiMermaid"),
  "mermaid-dark-skin-tone": () => import("./emojis/EmojiMermaidDarkSkinTone"),
  "mermaid-light-skin-tone": () => import("./emojis/EmojiMermaidLightSkinTone"),
  "mermaid-medium-dark-skin-tone": () => import("./emojis/EmojiMermaidMediumDarkSkinTone"),
  "mermaid-medium-light-skin-tone": () => import("./emojis/EmojiMermaidMediumLightSkinTone"),
  "mermaid-medium-skin-tone": () => import("./emojis/EmojiMermaidMediumSkinTone"),
  "mermaid-tone1": () => import("./emojis/EmojiMermaidTone1"),
  "mermaid-tone2": () => import("./emojis/EmojiMermaidTone2"),
  "mermaid-tone3": () => import("./emojis/EmojiMermaidTone3"),
  "mermaid-tone4": () => import("./emojis/EmojiMermaidTone4"),
  "mermaid-tone5": () => import("./emojis/EmojiMermaidTone5"),
  merman: () => import("./emojis/EmojiMerman"),
  "merman-dark-skin-tone": () => import("./emojis/EmojiMermanDarkSkinTone"),
  "merman-light-skin-tone": () => import("./emojis/EmojiMermanLightSkinTone"),
  "merman-medium-dark-skin-tone": () => import("./emojis/EmojiMermanMediumDarkSkinTone"),
  "merman-medium-light-skin-tone": () => import("./emojis/EmojiMermanMediumLightSkinTone"),
  "merman-medium-skin-tone": () => import("./emojis/EmojiMermanMediumSkinTone"),
  merperson: () => import("./emojis/EmojiMerperson"),
  "merperson-dark-skin-tone": () => import("./emojis/EmojiMerpersonDarkSkinTone"),
  "merperson-light-skin-tone": () => import("./emojis/EmojiMerpersonLightSkinTone"),
  "merperson-medium-dark-skin-tone": () => import("./emojis/EmojiMerpersonMediumDarkSkinTone"),
  "merperson-medium-light-skin-tone": () => import("./emojis/EmojiMerpersonMediumLightSkinTone"),
  "merperson-medium-skin-tone": () => import("./emojis/EmojiMerpersonMediumSkinTone"),
  metro: () => import("./emojis/EmojiMetro"),
  microbe: () => import("./emojis/EmojiMicrobe"),
  microphone: () => import("./emojis/EmojiMicrophone"),
  microscope: () => import("./emojis/EmojiMicroscope"),
  "middle-finger": () => import("./emojis/EmojiMiddleFinger"),
  "middle-finger-dark-skin-tone": () => import("./emojis/EmojiMiddleFingerDarkSkinTone"),
  "middle-finger-light-skin-tone": () => import("./emojis/EmojiMiddleFingerLightSkinTone"),
  "middle-finger-medium-dark-skin-tone": () =>
    import("./emojis/EmojiMiddleFingerMediumDarkSkinTone"),
  "middle-finger-medium-light-skin-tone": () =>
    import("./emojis/EmojiMiddleFingerMediumLightSkinTone"),
  "middle-finger-medium-skin-tone": () => import("./emojis/EmojiMiddleFingerMediumSkinTone"),
  "military-helmet": () => import("./emojis/EmojiMilitaryHelmet"),
  "military-medal": () => import("./emojis/EmojiMilitaryMedal"),
  "milky-way": () => import("./emojis/EmojiMilkyWay"),
  minibus: () => import("./emojis/EmojiMinibus"),
  minus: () => import("./emojis/EmojiMinus"),
  mirror: () => import("./emojis/EmojiMirror"),
  "mirror-ball": () => import("./emojis/EmojiMirrorBall"),
  moai: () => import("./emojis/EmojiMoai"),
  "mobile-phone": () => import("./emojis/EmojiMobilePhone"),
  "mobile-phone-off": () => import("./emojis/EmojiMobilePhoneOff"),
  "mobile-phone-with-arrow": () => import("./emojis/EmojiMobilePhoneWithArrow"),
  "money-bag": () => import("./emojis/EmojiMoneyBag"),
  "money-mouth-face": () => import("./emojis/EmojiMoneyMouthFace"),
  "money-with-wings": () => import("./emojis/EmojiMoneyWithWings"),
  monkey: () => import("./emojis/EmojiMonkey"),
  "monkey-face": () => import("./emojis/EmojiMonkeyFace"),
  monorail: () => import("./emojis/EmojiMonorail"),
  "moon-cake": () => import("./emojis/EmojiMoonCake"),
  "moon-viewing-ceremony": () => import("./emojis/EmojiMoonViewingCeremony"),
  moose: () => import("./emojis/EmojiMoose"),
  mosque: () => import("./emojis/EmojiMosque"),
  mosquito: () => import("./emojis/EmojiMosquito"),
  "motor-boat": () => import("./emojis/EmojiMotorBoat"),
  "motor-scooter": () => import("./emojis/EmojiMotorScooter"),
  motorcycle: () => import("./emojis/EmojiMotorcycle"),
  "motorized-wheelchair": () => import("./emojis/EmojiMotorizedWheelchair"),
  motorway: () => import("./emojis/EmojiMotorway"),
  "mount-fuji": () => import("./emojis/EmojiMountFuji"),
  mountain: () => import("./emojis/EmojiMountain"),
  "mountain-cableway": () => import("./emojis/EmojiMountainCableway"),
  "mountain-railway": () => import("./emojis/EmojiMountainRailway"),
  mouse: () => import("./emojis/EmojiMouse"),
  "mouse-face": () => import("./emojis/EmojiMouseFace"),
  "mouse-trap": () => import("./emojis/EmojiMouseTrap"),
  mouth: () => import("./emojis/EmojiMouth"),
  "movie-camera": () => import("./emojis/EmojiMovieCamera"),
  "mrs-claus": () => import("./emojis/EmojiMrsClaus"),
  "mrs-claus-dark-skin-tone": () => import("./emojis/EmojiMrsClausDarkSkinTone"),
  "mrs-claus-light-skin-tone": () => import("./emojis/EmojiMrsClausLightSkinTone"),
  "mrs-claus-medium-dark-skin-tone": () => import("./emojis/EmojiMrsClausMediumDarkSkinTone"),
  "mrs-claus-medium-light-skin-tone": () => import("./emojis/EmojiMrsClausMediumLightSkinTone"),
  "mrs-claus-medium-skin-tone": () => import("./emojis/EmojiMrsClausMediumSkinTone"),
  multiply: () => import("./emojis/EmojiMultiply"),
  mushroom: () => import("./emojis/EmojiMushroom"),
  "musical-keyboard": () => import("./emojis/EmojiMusicalKeyboard"),
  "musical-note": () => import("./emojis/EmojiMusicalNote"),
  "musical-notes": () => import("./emojis/EmojiMusicalNotes"),
  "musical-score": () => import("./emojis/EmojiMusicalScore"),
  "muted-speaker": () => import("./emojis/EmojiMutedSpeaker"),
  "mx-claus": () => import("./emojis/EmojiMxClaus"),
  "mx-claus-dark-skin-tone": () => import("./emojis/EmojiMxClausDarkSkinTone"),
  "mx-claus-light-skin-tone": () => import("./emojis/EmojiMxClausLightSkinTone"),
  "mx-claus-medium-dark-skin-tone": () => import("./emojis/EmojiMxClausMediumDarkSkinTone"),
  "mx-claus-medium-light-skin-tone": () => import("./emojis/EmojiMxClausMediumLightSkinTone"),
  "mx-claus-medium-skin-tone": () => import("./emojis/EmojiMxClausMediumSkinTone"),
  "nail-polish": () => import("./emojis/EmojiNailPolish"),
  "nail-polish-dark-skin-tone": () => import("./emojis/EmojiNailPolishDarkSkinTone"),
  "nail-polish-light-skin-tone": () => import("./emojis/EmojiNailPolishLightSkinTone"),
  "nail-polish-medium-dark-skin-tone": () => import("./emojis/EmojiNailPolishMediumDarkSkinTone"),
  "nail-polish-medium-light-skin-tone": () => import("./emojis/EmojiNailPolishMediumLightSkinTone"),
  "nail-polish-medium-skin-tone": () => import("./emojis/EmojiNailPolishMediumSkinTone"),
  "name-badge": () => import("./emojis/EmojiNameBadge"),
  "national-park": () => import("./emojis/EmojiNationalPark"),
  "nauseated-face": () => import("./emojis/EmojiNauseatedFace"),
  "nazar-amulet": () => import("./emojis/EmojiNazarAmulet"),
  necktie: () => import("./emojis/EmojiNecktie"),
  "nerd-face": () => import("./emojis/EmojiNerdFace"),
  "nest-with-eggs": () => import("./emojis/EmojiNestWithEggs"),
  "nesting-dolls": () => import("./emojis/EmojiNestingDolls"),
  "neutral-face": () => import("./emojis/EmojiNeutralFace"),
  "new-button": () => import("./emojis/EmojiNewButton"),
  "new-moon": () => import("./emojis/EmojiNewMoon"),
  "new-moon-face": () => import("./emojis/EmojiNewMoonFace"),
  newspaper: () => import("./emojis/EmojiNewspaper"),
  "next-track-button": () => import("./emojis/EmojiNextTrackButton"),
  "ng-button": () => import("./emojis/EmojiNgButton"),
  "night-with-stars": () => import("./emojis/EmojiNightWithStars"),
  "nine-oclock": () => import("./emojis/EmojiNineOclock"),
  "nine-thirty": () => import("./emojis/EmojiNineThirty"),
  ninja: () => import("./emojis/EmojiNinja"),
  "ninja-dark-skin-tone": () => import("./emojis/EmojiNinjaDarkSkinTone"),
  "ninja-light-skin-tone": () => import("./emojis/EmojiNinjaLightSkinTone"),
  "ninja-medium-dark-skin-tone": () => import("./emojis/EmojiNinjaMediumDarkSkinTone"),
  "ninja-medium-light-skin-tone": () => import("./emojis/EmojiNinjaMediumLightSkinTone"),
  "ninja-medium-skin-tone": () => import("./emojis/EmojiNinjaMediumSkinTone"),
  "no-bicycles": () => import("./emojis/EmojiNoBicycles"),
  "no-entry": () => import("./emojis/EmojiNoEntry"),
  "no-littering": () => import("./emojis/EmojiNoLittering"),
  "no-mobile-phones": () => import("./emojis/EmojiNoMobilePhones"),
  "no-one-under-eighteen": () => import("./emojis/EmojiNoOneUnderEighteen"),
  "no-pedestrians": () => import("./emojis/EmojiNoPedestrians"),
  "no-smoking": () => import("./emojis/EmojiNoSmoking"),
  "non-potable-water": () => import("./emojis/EmojiNonPotableWater"),
  nose: () => import("./emojis/EmojiNose"),
  "nose-dark-skin-tone": () => import("./emojis/EmojiNoseDarkSkinTone"),
  "nose-light-skin-tone": () => import("./emojis/EmojiNoseLightSkinTone"),
  "nose-medium-dark-skin-tone": () => import("./emojis/EmojiNoseMediumDarkSkinTone"),
  "nose-medium-light-skin-tone": () => import("./emojis/EmojiNoseMediumLightSkinTone"),
  "nose-medium-skin-tone": () => import("./emojis/EmojiNoseMediumSkinTone"),
  notebook: () => import("./emojis/EmojiNotebook"),
  "notebook-with-decorative-cover": () => import("./emojis/EmojiNotebookWithDecorativeCover"),
  "nut-and-bolt": () => import("./emojis/EmojiNutAndBolt"),
  "o-button-blood-type": () => import("./emojis/EmojiOButtonBloodType"),
  octopus: () => import("./emojis/EmojiOctopus"),
  oden: () => import("./emojis/EmojiOden"),
  "office-building": () => import("./emojis/EmojiOfficeBuilding"),
  "office-worker": () => import("./emojis/EmojiOfficeWorker"),
  "office-worker-dark-skin-tone": () => import("./emojis/EmojiOfficeWorkerDarkSkinTone"),
  "office-worker-light-skin-tone": () => import("./emojis/EmojiOfficeWorkerLightSkinTone"),
  "office-worker-medium-dark-skin-tone": () =>
    import("./emojis/EmojiOfficeWorkerMediumDarkSkinTone"),
  "office-worker-medium-light-skin-tone": () =>
    import("./emojis/EmojiOfficeWorkerMediumLightSkinTone"),
  "office-worker-medium-skin-tone": () => import("./emojis/EmojiOfficeWorkerMediumSkinTone"),
  ogre: () => import("./emojis/EmojiOgre"),
  "oil-drum": () => import("./emojis/EmojiOilDrum"),
  "ok-button": () => import("./emojis/EmojiOkButton"),
  "ok-hand": () => import("./emojis/EmojiOkHand"),
  "ok-hand-dark-skin-tone": () => import("./emojis/EmojiOkHandDarkSkinTone"),
  "ok-hand-light-skin-tone": () => import("./emojis/EmojiOkHandLightSkinTone"),
  "ok-hand-medium-dark-skin-tone": () => import("./emojis/EmojiOkHandMediumDarkSkinTone"),
  "ok-hand-medium-light-skin-tone": () => import("./emojis/EmojiOkHandMediumLightSkinTone"),
  "ok-hand-medium-skin-tone": () => import("./emojis/EmojiOkHandMediumSkinTone"),
  "old-key": () => import("./emojis/EmojiOldKey"),
  "old-man": () => import("./emojis/EmojiOldMan"),
  "old-man-dark-skin-tone": () => import("./emojis/EmojiOldManDarkSkinTone"),
  "old-man-light-skin-tone": () => import("./emojis/EmojiOldManLightSkinTone"),
  "old-man-medium-dark-skin-tone": () => import("./emojis/EmojiOldManMediumDarkSkinTone"),
  "old-man-medium-light-skin-tone": () => import("./emojis/EmojiOldManMediumLightSkinTone"),
  "old-man-medium-skin-tone": () => import("./emojis/EmojiOldManMediumSkinTone"),
  "old-woman": () => import("./emojis/EmojiOldWoman"),
  "old-woman-dark-skin-tone": () => import("./emojis/EmojiOldWomanDarkSkinTone"),
  "old-woman-light-skin-tone": () => import("./emojis/EmojiOldWomanLightSkinTone"),
  "old-woman-medium-dark-skin-tone": () => import("./emojis/EmojiOldWomanMediumDarkSkinTone"),
  "old-woman-medium-light-skin-tone": () => import("./emojis/EmojiOldWomanMediumLightSkinTone"),
  "old-woman-medium-skin-tone": () => import("./emojis/EmojiOldWomanMediumSkinTone"),
  "older-person": () => import("./emojis/EmojiOlderPerson"),
  "older-person-dark-skin-tone": () => import("./emojis/EmojiOlderPersonDarkSkinTone"),
  "older-person-light-skin-tone": () => import("./emojis/EmojiOlderPersonLightSkinTone"),
  "older-person-medium-dark-skin-tone": () => import("./emojis/EmojiOlderPersonMediumDarkSkinTone"),
  "older-person-medium-light-skin-tone": () =>
    import("./emojis/EmojiOlderPersonMediumLightSkinTone"),
  "older-person-medium-skin-tone": () => import("./emojis/EmojiOlderPersonMediumSkinTone"),
  olive: () => import("./emojis/EmojiOlive"),
  om: () => import("./emojis/EmojiOm"),
  "on-exclamation-arrow": () => import("./emojis/EmojiOnExclamationArrow"),
  "oncoming-automobile": () => import("./emojis/EmojiOncomingAutomobile"),
  "oncoming-bus": () => import("./emojis/EmojiOncomingBus"),
  "oncoming-fist": () => import("./emojis/EmojiOncomingFist"),
  "oncoming-fist-dark-skin-tone": () => import("./emojis/EmojiOncomingFistDarkSkinTone"),
  "oncoming-fist-light-skin-tone": () => import("./emojis/EmojiOncomingFistLightSkinTone"),
  "oncoming-fist-medium-dark-skin-tone": () =>
    import("./emojis/EmojiOncomingFistMediumDarkSkinTone"),
  "oncoming-fist-medium-light-skin-tone": () =>
    import("./emojis/EmojiOncomingFistMediumLightSkinTone"),
  "oncoming-fist-medium-skin-tone": () => import("./emojis/EmojiOncomingFistMediumSkinTone"),
  "oncoming-police-car": () => import("./emojis/EmojiOncomingPoliceCar"),
  "oncoming-taxi": () => import("./emojis/EmojiOncomingTaxi"),
  "one-oclock": () => import("./emojis/EmojiOneOclock"),
  "one-piece-swimsuit": () => import("./emojis/EmojiOnePieceSwimsuit"),
  "one-thirty": () => import("./emojis/EmojiOneThirty"),
  onion: () => import("./emojis/EmojiOnion"),
  "open-book": () => import("./emojis/EmojiOpenBook"),
  "open-file-folder": () => import("./emojis/EmojiOpenFileFolder"),
  "open-hands": () => import("./emojis/EmojiOpenHands"),
  "open-hands-dark-skin-tone": () => import("./emojis/EmojiOpenHandsDarkSkinTone"),
  "open-hands-light-skin-tone": () => import("./emojis/EmojiOpenHandsLightSkinTone"),
  "open-hands-medium-dark-skin-tone": () => import("./emojis/EmojiOpenHandsMediumDarkSkinTone"),
  "open-hands-medium-light-skin-tone": () => import("./emojis/EmojiOpenHandsMediumLightSkinTone"),
  "open-hands-medium-skin-tone": () => import("./emojis/EmojiOpenHandsMediumSkinTone"),
  "open-mailbox-with-lowered-flag": () => import("./emojis/EmojiOpenMailboxWithLoweredFlag"),
  "open-mailbox-with-raised-flag": () => import("./emojis/EmojiOpenMailboxWithRaisedFlag"),
  ophiuchus: () => import("./emojis/EmojiOphiuchus"),
  "optical-disk": () => import("./emojis/EmojiOpticalDisk"),
  "orange-book": () => import("./emojis/EmojiOrangeBook"),
  "orange-circle": () => import("./emojis/EmojiOrangeCircle"),
  "orange-heart": () => import("./emojis/EmojiOrangeHeart"),
  "orange-square": () => import("./emojis/EmojiOrangeSquare"),
  orangutan: () => import("./emojis/EmojiOrangutan"),
  orca: () => import("./emojis/EmojiOrca"),
  "orthodox-cross": () => import("./emojis/EmojiOrthodoxCross"),
  otter: () => import("./emojis/EmojiOtter"),
  "outbox-tray": () => import("./emojis/EmojiOutboxTray"),
  owl: () => import("./emojis/EmojiOwl"),
  ox: () => import("./emojis/EmojiOx"),
  oyster: () => import("./emojis/EmojiOyster"),
  "p-button": () => import("./emojis/EmojiPButton"),
  package: () => import("./emojis/EmojiPackage"),
  "page-facing-up": () => import("./emojis/EmojiPageFacingUp"),
  "page-with-curl": () => import("./emojis/EmojiPageWithCurl"),
  pager: () => import("./emojis/EmojiPager"),
  paintbrush: () => import("./emojis/EmojiPaintbrush"),
  "palm-down-hand": () => import("./emojis/EmojiPalmDownHand"),
  "palm-down-hand-dark-skin-tone": () => import("./emojis/EmojiPalmDownHandDarkSkinTone"),
  "palm-down-hand-light-skin-tone": () => import("./emojis/EmojiPalmDownHandLightSkinTone"),
  "palm-down-hand-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPalmDownHandMediumDarkSkinTone"),
  "palm-down-hand-medium-light-skin-tone": () =>
    import("./emojis/EmojiPalmDownHandMediumLightSkinTone"),
  "palm-down-hand-medium-skin-tone": () => import("./emojis/EmojiPalmDownHandMediumSkinTone"),
  "palm-tree": () => import("./emojis/EmojiPalmTree"),
  "palm-up-hand": () => import("./emojis/EmojiPalmUpHand"),
  "palm-up-hand-dark-skin-tone": () => import("./emojis/EmojiPalmUpHandDarkSkinTone"),
  "palm-up-hand-light-skin-tone": () => import("./emojis/EmojiPalmUpHandLightSkinTone"),
  "palm-up-hand-medium-dark-skin-tone": () => import("./emojis/EmojiPalmUpHandMediumDarkSkinTone"),
  "palm-up-hand-medium-light-skin-tone": () =>
    import("./emojis/EmojiPalmUpHandMediumLightSkinTone"),
  "palm-up-hand-medium-skin-tone": () => import("./emojis/EmojiPalmUpHandMediumSkinTone"),
  "palms-up-together": () => import("./emojis/EmojiPalmsUpTogether"),
  "palms-up-together-dark-skin-tone": () => import("./emojis/EmojiPalmsUpTogetherDarkSkinTone"),
  "palms-up-together-light-skin-tone": () => import("./emojis/EmojiPalmsUpTogetherLightSkinTone"),
  "palms-up-together-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPalmsUpTogetherMediumDarkSkinTone"),
  "palms-up-together-medium-light-skin-tone": () =>
    import("./emojis/EmojiPalmsUpTogetherMediumLightSkinTone"),
  "palms-up-together-medium-skin-tone": () => import("./emojis/EmojiPalmsUpTogetherMediumSkinTone"),
  pancakes: () => import("./emojis/EmojiPancakes"),
  panda: () => import("./emojis/EmojiPanda"),
  paperclip: () => import("./emojis/EmojiPaperclip"),
  parachute: () => import("./emojis/EmojiParachute"),
  parrot: () => import("./emojis/EmojiParrot"),
  "part-alternation-mark": () => import("./emojis/EmojiPartAlternationMark"),
  "party-popper": () => import("./emojis/EmojiPartyPopper"),
  "partying-face": () => import("./emojis/EmojiPartyingFace"),
  "passenger-ship": () => import("./emojis/EmojiPassengerShip"),
  "passport-control": () => import("./emojis/EmojiPassportControl"),
  "pause-button": () => import("./emojis/EmojiPauseButton"),
  "paw-prints": () => import("./emojis/EmojiPawPrints"),
  "pea-pod": () => import("./emojis/EmojiPeaPod"),
  "peace-symbol": () => import("./emojis/EmojiPeaceSymbol"),
  peach: () => import("./emojis/EmojiPeach"),
  peacock: () => import("./emojis/EmojiPeacock"),
  peanuts: () => import("./emojis/EmojiPeanuts"),
  pear: () => import("./emojis/EmojiPear"),
  pen: () => import("./emojis/EmojiPen"),
  pencil: () => import("./emojis/EmojiPencil"),
  penguin: () => import("./emojis/EmojiPenguin"),
  "pensive-face": () => import("./emojis/EmojiPensiveFace"),
  "people-holding-hands": () => import("./emojis/EmojiPeopleHoldingHands"),
  "people-holding-hands-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsDarkSkinTone"),
  "people-holding-hands-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsDarkSkinToneLightSkinTone"),
  "people-holding-hands-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsDarkSkinToneMediumDarkSkinTone"),
  "people-holding-hands-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsDarkSkinToneMediumLightSkinTone"),
  "people-holding-hands-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsDarkSkinToneMediumSkinTone"),
  "people-holding-hands-light-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsLightSkinTone"),
  "people-holding-hands-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsLightSkinToneDarkSkinTone"),
  "people-holding-hands-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsLightSkinToneMediumDarkSkinTone"),
  "people-holding-hands-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsLightSkinToneMediumLightSkinTone"),
  "people-holding-hands-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsLightSkinToneMediumSkinTone"),
  "people-holding-hands-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsMediumDarkSkinTone"),
  "people-holding-hands-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsMediumDarkSkinToneDarkSkinTone"),
  "people-holding-hands-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsMediumDarkSkinToneLightSkinTone"),
  "people-holding-hands-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsMediumDarkSkinToneMediumLightSkinTone"),
  "people-holding-hands-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsMediumDarkSkinToneMediumSkinTone"),
  "people-holding-hands-medium-light-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsMediumLightSkinTone"),
  "people-holding-hands-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsMediumLightSkinToneDarkSkinTone"),
  "people-holding-hands-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsMediumLightSkinToneLightSkinTone"),
  "people-holding-hands-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsMediumLightSkinToneMediumDarkSkinTone"),
  "people-holding-hands-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsMediumLightSkinToneMediumSkinTone"),
  "people-holding-hands-medium-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsMediumSkinTone"),
  "people-holding-hands-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsMediumSkinToneDarkSkinTone"),
  "people-holding-hands-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsMediumSkinToneLightSkinTone"),
  "people-holding-hands-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsMediumSkinToneMediumDarkSkinTone"),
  "people-holding-hands-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiPeopleHoldingHandsMediumSkinToneMediumLightSkinTone"),
  "people-hugging": () => import("./emojis/EmojiPeopleHugging"),
  "people-with-bunny-ears": () => import("./emojis/EmojiPeopleWithBunnyEars"),
  "people-with-bunny-ears-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsDarkSkinTone"),
  "people-with-bunny-ears-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsDarkSkinToneLightSkinTone"),
  "people-with-bunny-ears-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsDarkSkinToneMediumDarkSkinTone"),
  "people-with-bunny-ears-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsDarkSkinToneMediumLightSkinTone"),
  "people-with-bunny-ears-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsDarkSkinToneMediumSkinTone"),
  "people-with-bunny-ears-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsLightSkinTone"),
  "people-with-bunny-ears-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsLightSkinToneDarkSkinTone"),
  "people-with-bunny-ears-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsLightSkinToneMediumDarkSkinTone"),
  "people-with-bunny-ears-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsLightSkinToneMediumLightSkinTone"),
  "people-with-bunny-ears-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsLightSkinToneMediumSkinTone"),
  "people-with-bunny-ears-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsMediumDarkSkinTone"),
  "people-with-bunny-ears-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsMediumDarkSkinToneDarkSkinTone"),
  "people-with-bunny-ears-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsMediumDarkSkinToneLightSkinTone"),
  "people-with-bunny-ears-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsMediumDarkSkinToneMediumLightSkinTone"),
  "people-with-bunny-ears-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsMediumDarkSkinToneMediumSkinTone"),
  "people-with-bunny-ears-medium-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsMediumLightSkinTone"),
  "people-with-bunny-ears-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsMediumLightSkinToneDarkSkinTone"),
  "people-with-bunny-ears-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsMediumLightSkinToneLightSkinTone"),
  "people-with-bunny-ears-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsMediumLightSkinToneMediumDarkSkinTone"),
  "people-with-bunny-ears-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsMediumLightSkinToneMediumSkinTone"),
  "people-with-bunny-ears-medium-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsMediumSkinTone"),
  "people-with-bunny-ears-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsMediumSkinToneDarkSkinTone"),
  "people-with-bunny-ears-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsMediumSkinToneLightSkinTone"),
  "people-with-bunny-ears-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsMediumSkinToneMediumDarkSkinTone"),
  "people-with-bunny-ears-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWithBunnyEarsMediumSkinToneMediumLightSkinTone"),
  "people-wrestling": () => import("./emojis/EmojiPeopleWrestling"),
  "people-wrestling-dark-skin-tone": () => import("./emojis/EmojiPeopleWrestlingDarkSkinTone"),
  "people-wrestling-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingDarkSkinToneLightSkinTone"),
  "people-wrestling-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingDarkSkinToneMediumDarkSkinTone"),
  "people-wrestling-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingDarkSkinToneMediumLightSkinTone"),
  "people-wrestling-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingDarkSkinToneMediumSkinTone"),
  "people-wrestling-light-skin-tone": () => import("./emojis/EmojiPeopleWrestlingLightSkinTone"),
  "people-wrestling-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingLightSkinToneDarkSkinTone"),
  "people-wrestling-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingLightSkinToneMediumDarkSkinTone"),
  "people-wrestling-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingLightSkinToneMediumLightSkinTone"),
  "people-wrestling-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingLightSkinToneMediumSkinTone"),
  "people-wrestling-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingMediumDarkSkinTone"),
  "people-wrestling-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingMediumDarkSkinToneDarkSkinTone"),
  "people-wrestling-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingMediumDarkSkinToneLightSkinTone"),
  "people-wrestling-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingMediumDarkSkinToneMediumLightSkinTone"),
  "people-wrestling-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingMediumDarkSkinToneMediumSkinTone"),
  "people-wrestling-medium-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingMediumLightSkinTone"),
  "people-wrestling-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingMediumLightSkinToneDarkSkinTone"),
  "people-wrestling-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingMediumLightSkinToneLightSkinTone"),
  "people-wrestling-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingMediumLightSkinToneMediumDarkSkinTone"),
  "people-wrestling-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingMediumLightSkinToneMediumSkinTone"),
  "people-wrestling-medium-skin-tone": () => import("./emojis/EmojiPeopleWrestlingMediumSkinTone"),
  "people-wrestling-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingMediumSkinToneDarkSkinTone"),
  "people-wrestling-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingMediumSkinToneLightSkinTone"),
  "people-wrestling-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingMediumSkinToneMediumDarkSkinTone"),
  "people-wrestling-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiPeopleWrestlingMediumSkinToneMediumLightSkinTone"),
  "performing-arts": () => import("./emojis/EmojiPerformingArts"),
  "persevering-face": () => import("./emojis/EmojiPerseveringFace"),
  person: () => import("./emojis/EmojiPerson"),
  "person-bald": () => import("./emojis/EmojiPersonBald"),
  "person-beard": () => import("./emojis/EmojiPersonBeard"),
  "person-biking": () => import("./emojis/EmojiPersonBiking"),
  "person-biking-dark-skin-tone": () => import("./emojis/EmojiPersonBikingDarkSkinTone"),
  "person-biking-light-skin-tone": () => import("./emojis/EmojiPersonBikingLightSkinTone"),
  "person-biking-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonBikingMediumDarkSkinTone"),
  "person-biking-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonBikingMediumLightSkinTone"),
  "person-biking-medium-skin-tone": () => import("./emojis/EmojiPersonBikingMediumSkinTone"),
  "person-blond-hair": () => import("./emojis/EmojiPersonBlondHair"),
  "person-bouncing-ball": () => import("./emojis/EmojiPersonBouncingBall"),
  "person-bouncing-ball-dark-skin-tone": () =>
    import("./emojis/EmojiPersonBouncingBallDarkSkinTone"),
  "person-bouncing-ball-light-skin-tone": () =>
    import("./emojis/EmojiPersonBouncingBallLightSkinTone"),
  "person-bouncing-ball-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonBouncingBallMediumDarkSkinTone"),
  "person-bouncing-ball-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonBouncingBallMediumLightSkinTone"),
  "person-bouncing-ball-medium-skin-tone": () =>
    import("./emojis/EmojiPersonBouncingBallMediumSkinTone"),
  "person-bowing": () => import("./emojis/EmojiPersonBowing"),
  "person-bowing-dark-skin-tone": () => import("./emojis/EmojiPersonBowingDarkSkinTone"),
  "person-bowing-light-skin-tone": () => import("./emojis/EmojiPersonBowingLightSkinTone"),
  "person-bowing-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonBowingMediumDarkSkinTone"),
  "person-bowing-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonBowingMediumLightSkinTone"),
  "person-bowing-medium-skin-tone": () => import("./emojis/EmojiPersonBowingMediumSkinTone"),
  "person-cartwheeling": () => import("./emojis/EmojiPersonCartwheeling"),
  "person-cartwheeling-dark-skin-tone": () =>
    import("./emojis/EmojiPersonCartwheelingDarkSkinTone"),
  "person-cartwheeling-light-skin-tone": () =>
    import("./emojis/EmojiPersonCartwheelingLightSkinTone"),
  "person-cartwheeling-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonCartwheelingMediumDarkSkinTone"),
  "person-cartwheeling-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonCartwheelingMediumLightSkinTone"),
  "person-cartwheeling-medium-skin-tone": () =>
    import("./emojis/EmojiPersonCartwheelingMediumSkinTone"),
  "person-climbing": () => import("./emojis/EmojiPersonClimbing"),
  "person-climbing-dark-skin-tone": () => import("./emojis/EmojiPersonClimbingDarkSkinTone"),
  "person-climbing-light-skin-tone": () => import("./emojis/EmojiPersonClimbingLightSkinTone"),
  "person-climbing-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonClimbingMediumDarkSkinTone"),
  "person-climbing-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonClimbingMediumLightSkinTone"),
  "person-climbing-medium-skin-tone": () => import("./emojis/EmojiPersonClimbingMediumSkinTone"),
  "person-curly-hair": () => import("./emojis/EmojiPersonCurlyHair"),
  "person-dark-skin-tone": () => import("./emojis/EmojiPersonDarkSkinTone"),
  "person-dark-skin-tone-bald": () => import("./emojis/EmojiPersonDarkSkinToneBald"),
  "person-dark-skin-tone-beard": () => import("./emojis/EmojiPersonDarkSkinToneBeard"),
  "person-dark-skin-tone-blond-hair": () => import("./emojis/EmojiPersonDarkSkinToneBlondHair"),
  "person-dark-skin-tone-curly-hair": () => import("./emojis/EmojiPersonDarkSkinToneCurlyHair"),
  "person-dark-skin-tone-red-hair": () => import("./emojis/EmojiPersonDarkSkinToneRedHair"),
  "person-dark-skin-tone-white-hair": () => import("./emojis/EmojiPersonDarkSkinToneWhiteHair"),
  "person-facepalming": () => import("./emojis/EmojiPersonFacepalming"),
  "person-facepalming-dark-skin-tone": () => import("./emojis/EmojiPersonFacepalmingDarkSkinTone"),
  "person-facepalming-light-skin-tone": () =>
    import("./emojis/EmojiPersonFacepalmingLightSkinTone"),
  "person-facepalming-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonFacepalmingMediumDarkSkinTone"),
  "person-facepalming-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonFacepalmingMediumLightSkinTone"),
  "person-facepalming-medium-skin-tone": () =>
    import("./emojis/EmojiPersonFacepalmingMediumSkinTone"),
  "person-feeding-baby": () => import("./emojis/EmojiPersonFeedingBaby"),
  "person-feeding-baby-dark-skin-tone": () => import("./emojis/EmojiPersonFeedingBabyDarkSkinTone"),
  "person-feeding-baby-light-skin-tone": () =>
    import("./emojis/EmojiPersonFeedingBabyLightSkinTone"),
  "person-feeding-baby-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonFeedingBabyMediumDarkSkinTone"),
  "person-feeding-baby-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonFeedingBabyMediumLightSkinTone"),
  "person-feeding-baby-medium-skin-tone": () =>
    import("./emojis/EmojiPersonFeedingBabyMediumSkinTone"),
  "person-fencing": () => import("./emojis/EmojiPersonFencing"),
  "person-frowning": () => import("./emojis/EmojiPersonFrowning"),
  "person-frowning-dark-skin-tone": () => import("./emojis/EmojiPersonFrowningDarkSkinTone"),
  "person-frowning-light-skin-tone": () => import("./emojis/EmojiPersonFrowningLightSkinTone"),
  "person-frowning-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonFrowningMediumDarkSkinTone"),
  "person-frowning-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonFrowningMediumLightSkinTone"),
  "person-frowning-medium-skin-tone": () => import("./emojis/EmojiPersonFrowningMediumSkinTone"),
  "person-gesturing-no": () => import("./emojis/EmojiPersonGesturingNo"),
  "person-gesturing-no-dark-skin-tone": () => import("./emojis/EmojiPersonGesturingNoDarkSkinTone"),
  "person-gesturing-no-light-skin-tone": () =>
    import("./emojis/EmojiPersonGesturingNoLightSkinTone"),
  "person-gesturing-no-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonGesturingNoMediumDarkSkinTone"),
  "person-gesturing-no-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonGesturingNoMediumLightSkinTone"),
  "person-gesturing-no-medium-skin-tone": () =>
    import("./emojis/EmojiPersonGesturingNoMediumSkinTone"),
  "person-gesturing-ok": () => import("./emojis/EmojiPersonGesturingOk"),
  "person-gesturing-ok-dark-skin-tone": () => import("./emojis/EmojiPersonGesturingOkDarkSkinTone"),
  "person-gesturing-ok-light-skin-tone": () =>
    import("./emojis/EmojiPersonGesturingOkLightSkinTone"),
  "person-gesturing-ok-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonGesturingOkMediumDarkSkinTone"),
  "person-gesturing-ok-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonGesturingOkMediumLightSkinTone"),
  "person-gesturing-ok-medium-skin-tone": () =>
    import("./emojis/EmojiPersonGesturingOkMediumSkinTone"),
  "person-getting-haircut": () => import("./emojis/EmojiPersonGettingHaircut"),
  "person-getting-haircut-dark-skin-tone": () =>
    import("./emojis/EmojiPersonGettingHaircutDarkSkinTone"),
  "person-getting-haircut-light-skin-tone": () =>
    import("./emojis/EmojiPersonGettingHaircutLightSkinTone"),
  "person-getting-haircut-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonGettingHaircutMediumDarkSkinTone"),
  "person-getting-haircut-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonGettingHaircutMediumLightSkinTone"),
  "person-getting-haircut-medium-skin-tone": () =>
    import("./emojis/EmojiPersonGettingHaircutMediumSkinTone"),
  "person-getting-massage": () => import("./emojis/EmojiPersonGettingMassage"),
  "person-getting-massage-dark-skin-tone": () =>
    import("./emojis/EmojiPersonGettingMassageDarkSkinTone"),
  "person-getting-massage-light-skin-tone": () =>
    import("./emojis/EmojiPersonGettingMassageLightSkinTone"),
  "person-getting-massage-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonGettingMassageMediumDarkSkinTone"),
  "person-getting-massage-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonGettingMassageMediumLightSkinTone"),
  "person-getting-massage-medium-skin-tone": () =>
    import("./emojis/EmojiPersonGettingMassageMediumSkinTone"),
  "person-golfing": () => import("./emojis/EmojiPersonGolfing"),
  "person-golfing-dark-skin-tone": () => import("./emojis/EmojiPersonGolfingDarkSkinTone"),
  "person-golfing-light-skin-tone": () => import("./emojis/EmojiPersonGolfingLightSkinTone"),
  "person-golfing-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonGolfingMediumDarkSkinTone"),
  "person-golfing-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonGolfingMediumLightSkinTone"),
  "person-golfing-medium-skin-tone": () => import("./emojis/EmojiPersonGolfingMediumSkinTone"),
  "person-in-bed": () => import("./emojis/EmojiPersonInBed"),
  "person-in-bed-dark-skin-tone": () => import("./emojis/EmojiPersonInBedDarkSkinTone"),
  "person-in-bed-light-skin-tone": () => import("./emojis/EmojiPersonInBedLightSkinTone"),
  "person-in-bed-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonInBedMediumDarkSkinTone"),
  "person-in-bed-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonInBedMediumLightSkinTone"),
  "person-in-bed-medium-skin-tone": () => import("./emojis/EmojiPersonInBedMediumSkinTone"),
  "person-in-lotus-position": () => import("./emojis/EmojiPersonInLotusPosition"),
  "person-in-lotus-position-dark-skin-tone": () =>
    import("./emojis/EmojiPersonInLotusPositionDarkSkinTone"),
  "person-in-lotus-position-light-skin-tone": () =>
    import("./emojis/EmojiPersonInLotusPositionLightSkinTone"),
  "person-in-lotus-position-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonInLotusPositionMediumDarkSkinTone"),
  "person-in-lotus-position-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonInLotusPositionMediumLightSkinTone"),
  "person-in-lotus-position-medium-skin-tone": () =>
    import("./emojis/EmojiPersonInLotusPositionMediumSkinTone"),
  "person-in-manual-wheelchair": () => import("./emojis/EmojiPersonInManualWheelchair"),
  "person-in-manual-wheelchair-dark-skin-tone": () =>
    import("./emojis/EmojiPersonInManualWheelchairDarkSkinTone"),
  "person-in-manual-wheelchair-facing-right": () =>
    import("./emojis/EmojiPersonInManualWheelchairFacingRight"),
  "person-in-manual-wheelchair-facing-right-dark-skin-tone": () =>
    import("./emojis/EmojiPersonInManualWheelchairFacingRightDarkSkinTone"),
  "person-in-manual-wheelchair-facing-right-light-skin-tone": () =>
    import("./emojis/EmojiPersonInManualWheelchairFacingRightLightSkinTone"),
  "person-in-manual-wheelchair-facing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonInManualWheelchairFacingRightMediumDarkSkinTone"),
  "person-in-manual-wheelchair-facing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonInManualWheelchairFacingRightMediumLightSkinTone"),
  "person-in-manual-wheelchair-facing-right-medium-skin-tone": () =>
    import("./emojis/EmojiPersonInManualWheelchairFacingRightMediumSkinTone"),
  "person-in-manual-wheelchair-light-skin-tone": () =>
    import("./emojis/EmojiPersonInManualWheelchairLightSkinTone"),
  "person-in-manual-wheelchair-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonInManualWheelchairMediumDarkSkinTone"),
  "person-in-manual-wheelchair-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonInManualWheelchairMediumLightSkinTone"),
  "person-in-manual-wheelchair-medium-skin-tone": () =>
    import("./emojis/EmojiPersonInManualWheelchairMediumSkinTone"),
  "person-in-motorized-wheelchair": () => import("./emojis/EmojiPersonInMotorizedWheelchair"),
  "person-in-motorized-wheelchair-dark-skin-tone": () =>
    import("./emojis/EmojiPersonInMotorizedWheelchairDarkSkinTone"),
  "person-in-motorized-wheelchair-facing-right": () =>
    import("./emojis/EmojiPersonInMotorizedWheelchairFacingRight"),
  "person-in-motorized-wheelchair-facing-right-dark-skin-tone": () =>
    import("./emojis/EmojiPersonInMotorizedWheelchairFacingRightDarkSkinTone"),
  "person-in-motorized-wheelchair-facing-right-light-skin-tone": () =>
    import("./emojis/EmojiPersonInMotorizedWheelchairFacingRightLightSkinTone"),
  "person-in-motorized-wheelchair-facing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonInMotorizedWheelchairFacingRightMediumDarkSkinTone"),
  "person-in-motorized-wheelchair-facing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonInMotorizedWheelchairFacingRightMediumLightSkinTone"),
  "person-in-motorized-wheelchair-facing-right-medium-skin-tone": () =>
    import("./emojis/EmojiPersonInMotorizedWheelchairFacingRightMediumSkinTone"),
  "person-in-motorized-wheelchair-light-skin-tone": () =>
    import("./emojis/EmojiPersonInMotorizedWheelchairLightSkinTone"),
  "person-in-motorized-wheelchair-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonInMotorizedWheelchairMediumDarkSkinTone"),
  "person-in-motorized-wheelchair-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonInMotorizedWheelchairMediumLightSkinTone"),
  "person-in-motorized-wheelchair-medium-skin-tone": () =>
    import("./emojis/EmojiPersonInMotorizedWheelchairMediumSkinTone"),
  "person-in-steamy-room": () => import("./emojis/EmojiPersonInSteamyRoom"),
  "person-in-steamy-room-dark-skin-tone": () =>
    import("./emojis/EmojiPersonInSteamyRoomDarkSkinTone"),
  "person-in-steamy-room-light-skin-tone": () =>
    import("./emojis/EmojiPersonInSteamyRoomLightSkinTone"),
  "person-in-steamy-room-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonInSteamyRoomMediumDarkSkinTone"),
  "person-in-steamy-room-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonInSteamyRoomMediumLightSkinTone"),
  "person-in-steamy-room-medium-skin-tone": () =>
    import("./emojis/EmojiPersonInSteamyRoomMediumSkinTone"),
  "person-in-suit-levitating": () => import("./emojis/EmojiPersonInSuitLevitating"),
  "person-in-suit-levitating-dark-skin-tone": () =>
    import("./emojis/EmojiPersonInSuitLevitatingDarkSkinTone"),
  "person-in-suit-levitating-light-skin-tone": () =>
    import("./emojis/EmojiPersonInSuitLevitatingLightSkinTone"),
  "person-in-suit-levitating-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonInSuitLevitatingMediumDarkSkinTone"),
  "person-in-suit-levitating-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonInSuitLevitatingMediumLightSkinTone"),
  "person-in-suit-levitating-medium-skin-tone": () =>
    import("./emojis/EmojiPersonInSuitLevitatingMediumSkinTone"),
  "person-in-tuxedo": () => import("./emojis/EmojiPersonInTuxedo"),
  "person-in-tuxedo-dark-skin-tone": () => import("./emojis/EmojiPersonInTuxedoDarkSkinTone"),
  "person-in-tuxedo-light-skin-tone": () => import("./emojis/EmojiPersonInTuxedoLightSkinTone"),
  "person-in-tuxedo-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonInTuxedoMediumDarkSkinTone"),
  "person-in-tuxedo-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonInTuxedoMediumLightSkinTone"),
  "person-in-tuxedo-medium-skin-tone": () => import("./emojis/EmojiPersonInTuxedoMediumSkinTone"),
  "person-juggling": () => import("./emojis/EmojiPersonJuggling"),
  "person-juggling-dark-skin-tone": () => import("./emojis/EmojiPersonJugglingDarkSkinTone"),
  "person-juggling-light-skin-tone": () => import("./emojis/EmojiPersonJugglingLightSkinTone"),
  "person-juggling-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonJugglingMediumDarkSkinTone"),
  "person-juggling-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonJugglingMediumLightSkinTone"),
  "person-juggling-medium-skin-tone": () => import("./emojis/EmojiPersonJugglingMediumSkinTone"),
  "person-kneeling": () => import("./emojis/EmojiPersonKneeling"),
  "person-kneeling-dark-skin-tone": () => import("./emojis/EmojiPersonKneelingDarkSkinTone"),
  "person-kneeling-facing-right": () => import("./emojis/EmojiPersonKneelingFacingRight"),
  "person-kneeling-facing-right-dark-skin-tone": () =>
    import("./emojis/EmojiPersonKneelingFacingRightDarkSkinTone"),
  "person-kneeling-facing-right-light-skin-tone": () =>
    import("./emojis/EmojiPersonKneelingFacingRightLightSkinTone"),
  "person-kneeling-facing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonKneelingFacingRightMediumDarkSkinTone"),
  "person-kneeling-facing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonKneelingFacingRightMediumLightSkinTone"),
  "person-kneeling-facing-right-medium-skin-tone": () =>
    import("./emojis/EmojiPersonKneelingFacingRightMediumSkinTone"),
  "person-kneeling-light-skin-tone": () => import("./emojis/EmojiPersonKneelingLightSkinTone"),
  "person-kneeling-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonKneelingMediumDarkSkinTone"),
  "person-kneeling-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonKneelingMediumLightSkinTone"),
  "person-kneeling-medium-skin-tone": () => import("./emojis/EmojiPersonKneelingMediumSkinTone"),
  "person-lifting-weights": () => import("./emojis/EmojiPersonLiftingWeights"),
  "person-lifting-weights-dark-skin-tone": () =>
    import("./emojis/EmojiPersonLiftingWeightsDarkSkinTone"),
  "person-lifting-weights-light-skin-tone": () =>
    import("./emojis/EmojiPersonLiftingWeightsLightSkinTone"),
  "person-lifting-weights-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonLiftingWeightsMediumDarkSkinTone"),
  "person-lifting-weights-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonLiftingWeightsMediumLightSkinTone"),
  "person-lifting-weights-medium-skin-tone": () =>
    import("./emojis/EmojiPersonLiftingWeightsMediumSkinTone"),
  "person-light-skin-tone": () => import("./emojis/EmojiPersonLightSkinTone"),
  "person-light-skin-tone-bald": () => import("./emojis/EmojiPersonLightSkinToneBald"),
  "person-light-skin-tone-beard": () => import("./emojis/EmojiPersonLightSkinToneBeard"),
  "person-light-skin-tone-blond-hair": () => import("./emojis/EmojiPersonLightSkinToneBlondHair"),
  "person-light-skin-tone-curly-hair": () => import("./emojis/EmojiPersonLightSkinToneCurlyHair"),
  "person-light-skin-tone-red-hair": () => import("./emojis/EmojiPersonLightSkinToneRedHair"),
  "person-light-skin-tone-white-hair": () => import("./emojis/EmojiPersonLightSkinToneWhiteHair"),
  "person-medium-dark-skin-tone": () => import("./emojis/EmojiPersonMediumDarkSkinTone"),
  "person-medium-dark-skin-tone-bald": () => import("./emojis/EmojiPersonMediumDarkSkinToneBald"),
  "person-medium-dark-skin-tone-beard": () => import("./emojis/EmojiPersonMediumDarkSkinToneBeard"),
  "person-medium-dark-skin-tone-blond-hair": () =>
    import("./emojis/EmojiPersonMediumDarkSkinToneBlondHair"),
  "person-medium-dark-skin-tone-curly-hair": () =>
    import("./emojis/EmojiPersonMediumDarkSkinToneCurlyHair"),
  "person-medium-dark-skin-tone-red-hair": () =>
    import("./emojis/EmojiPersonMediumDarkSkinToneRedHair"),
  "person-medium-dark-skin-tone-white-hair": () =>
    import("./emojis/EmojiPersonMediumDarkSkinToneWhiteHair"),
  "person-medium-light-skin-tone": () => import("./emojis/EmojiPersonMediumLightSkinTone"),
  "person-medium-light-skin-tone-bald": () => import("./emojis/EmojiPersonMediumLightSkinToneBald"),
  "person-medium-light-skin-tone-beard": () =>
    import("./emojis/EmojiPersonMediumLightSkinToneBeard"),
  "person-medium-light-skin-tone-blond-hair": () =>
    import("./emojis/EmojiPersonMediumLightSkinToneBlondHair"),
  "person-medium-light-skin-tone-curly-hair": () =>
    import("./emojis/EmojiPersonMediumLightSkinToneCurlyHair"),
  "person-medium-light-skin-tone-red-hair": () =>
    import("./emojis/EmojiPersonMediumLightSkinToneRedHair"),
  "person-medium-light-skin-tone-white-hair": () =>
    import("./emojis/EmojiPersonMediumLightSkinToneWhiteHair"),
  "person-medium-skin-tone": () => import("./emojis/EmojiPersonMediumSkinTone"),
  "person-medium-skin-tone-bald": () => import("./emojis/EmojiPersonMediumSkinToneBald"),
  "person-medium-skin-tone-beard": () => import("./emojis/EmojiPersonMediumSkinToneBeard"),
  "person-medium-skin-tone-blond-hair": () => import("./emojis/EmojiPersonMediumSkinToneBlondHair"),
  "person-medium-skin-tone-curly-hair": () => import("./emojis/EmojiPersonMediumSkinToneCurlyHair"),
  "person-medium-skin-tone-red-hair": () => import("./emojis/EmojiPersonMediumSkinToneRedHair"),
  "person-medium-skin-tone-white-hair": () => import("./emojis/EmojiPersonMediumSkinToneWhiteHair"),
  "person-mountain-biking": () => import("./emojis/EmojiPersonMountainBiking"),
  "person-mountain-biking-dark-skin-tone": () =>
    import("./emojis/EmojiPersonMountainBikingDarkSkinTone"),
  "person-mountain-biking-light-skin-tone": () =>
    import("./emojis/EmojiPersonMountainBikingLightSkinTone"),
  "person-mountain-biking-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonMountainBikingMediumDarkSkinTone"),
  "person-mountain-biking-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonMountainBikingMediumLightSkinTone"),
  "person-mountain-biking-medium-skin-tone": () =>
    import("./emojis/EmojiPersonMountainBikingMediumSkinTone"),
  "person-playing-handball": () => import("./emojis/EmojiPersonPlayingHandball"),
  "person-playing-handball-dark-skin-tone": () =>
    import("./emojis/EmojiPersonPlayingHandballDarkSkinTone"),
  "person-playing-handball-light-skin-tone": () =>
    import("./emojis/EmojiPersonPlayingHandballLightSkinTone"),
  "person-playing-handball-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonPlayingHandballMediumDarkSkinTone"),
  "person-playing-handball-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonPlayingHandballMediumLightSkinTone"),
  "person-playing-handball-medium-skin-tone": () =>
    import("./emojis/EmojiPersonPlayingHandballMediumSkinTone"),
  "person-playing-water-polo": () => import("./emojis/EmojiPersonPlayingWaterPolo"),
  "person-playing-water-polo-dark-skin-tone": () =>
    import("./emojis/EmojiPersonPlayingWaterPoloDarkSkinTone"),
  "person-playing-water-polo-light-skin-tone": () =>
    import("./emojis/EmojiPersonPlayingWaterPoloLightSkinTone"),
  "person-playing-water-polo-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonPlayingWaterPoloMediumDarkSkinTone"),
  "person-playing-water-polo-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonPlayingWaterPoloMediumLightSkinTone"),
  "person-playing-water-polo-medium-skin-tone": () =>
    import("./emojis/EmojiPersonPlayingWaterPoloMediumSkinTone"),
  "person-pouting": () => import("./emojis/EmojiPersonPouting"),
  "person-pouting-dark-skin-tone": () => import("./emojis/EmojiPersonPoutingDarkSkinTone"),
  "person-pouting-light-skin-tone": () => import("./emojis/EmojiPersonPoutingLightSkinTone"),
  "person-pouting-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonPoutingMediumDarkSkinTone"),
  "person-pouting-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonPoutingMediumLightSkinTone"),
  "person-pouting-medium-skin-tone": () => import("./emojis/EmojiPersonPoutingMediumSkinTone"),
  "person-raising-hand": () => import("./emojis/EmojiPersonRaisingHand"),
  "person-raising-hand-dark-skin-tone": () => import("./emojis/EmojiPersonRaisingHandDarkSkinTone"),
  "person-raising-hand-light-skin-tone": () =>
    import("./emojis/EmojiPersonRaisingHandLightSkinTone"),
  "person-raising-hand-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonRaisingHandMediumDarkSkinTone"),
  "person-raising-hand-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonRaisingHandMediumLightSkinTone"),
  "person-raising-hand-medium-skin-tone": () =>
    import("./emojis/EmojiPersonRaisingHandMediumSkinTone"),
  "person-red-hair": () => import("./emojis/EmojiPersonRedHair"),
  "person-rowing-boat": () => import("./emojis/EmojiPersonRowingBoat"),
  "person-rowing-boat-dark-skin-tone": () => import("./emojis/EmojiPersonRowingBoatDarkSkinTone"),
  "person-rowing-boat-light-skin-tone": () => import("./emojis/EmojiPersonRowingBoatLightSkinTone"),
  "person-rowing-boat-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonRowingBoatMediumDarkSkinTone"),
  "person-rowing-boat-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonRowingBoatMediumLightSkinTone"),
  "person-rowing-boat-medium-skin-tone": () =>
    import("./emojis/EmojiPersonRowingBoatMediumSkinTone"),
  "person-running": () => import("./emojis/EmojiPersonRunning"),
  "person-running-dark-skin-tone": () => import("./emojis/EmojiPersonRunningDarkSkinTone"),
  "person-running-facing-right": () => import("./emojis/EmojiPersonRunningFacingRight"),
  "person-running-facing-right-dark-skin-tone": () =>
    import("./emojis/EmojiPersonRunningFacingRightDarkSkinTone"),
  "person-running-facing-right-light-skin-tone": () =>
    import("./emojis/EmojiPersonRunningFacingRightLightSkinTone"),
  "person-running-facing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonRunningFacingRightMediumDarkSkinTone"),
  "person-running-facing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonRunningFacingRightMediumLightSkinTone"),
  "person-running-facing-right-medium-skin-tone": () =>
    import("./emojis/EmojiPersonRunningFacingRightMediumSkinTone"),
  "person-running-light-skin-tone": () => import("./emojis/EmojiPersonRunningLightSkinTone"),
  "person-running-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonRunningMediumDarkSkinTone"),
  "person-running-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonRunningMediumLightSkinTone"),
  "person-running-medium-skin-tone": () => import("./emojis/EmojiPersonRunningMediumSkinTone"),
  "person-shrugging": () => import("./emojis/EmojiPersonShrugging"),
  "person-shrugging-dark-skin-tone": () => import("./emojis/EmojiPersonShruggingDarkSkinTone"),
  "person-shrugging-light-skin-tone": () => import("./emojis/EmojiPersonShruggingLightSkinTone"),
  "person-shrugging-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonShruggingMediumDarkSkinTone"),
  "person-shrugging-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonShruggingMediumLightSkinTone"),
  "person-shrugging-medium-skin-tone": () => import("./emojis/EmojiPersonShruggingMediumSkinTone"),
  "person-standing": () => import("./emojis/EmojiPersonStanding"),
  "person-standing-dark-skin-tone": () => import("./emojis/EmojiPersonStandingDarkSkinTone"),
  "person-standing-light-skin-tone": () => import("./emojis/EmojiPersonStandingLightSkinTone"),
  "person-standing-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonStandingMediumDarkSkinTone"),
  "person-standing-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonStandingMediumLightSkinTone"),
  "person-standing-medium-skin-tone": () => import("./emojis/EmojiPersonStandingMediumSkinTone"),
  "person-surfing": () => import("./emojis/EmojiPersonSurfing"),
  "person-surfing-dark-skin-tone": () => import("./emojis/EmojiPersonSurfingDarkSkinTone"),
  "person-surfing-light-skin-tone": () => import("./emojis/EmojiPersonSurfingLightSkinTone"),
  "person-surfing-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonSurfingMediumDarkSkinTone"),
  "person-surfing-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonSurfingMediumLightSkinTone"),
  "person-surfing-medium-skin-tone": () => import("./emojis/EmojiPersonSurfingMediumSkinTone"),
  "person-swimming": () => import("./emojis/EmojiPersonSwimming"),
  "person-swimming-dark-skin-tone": () => import("./emojis/EmojiPersonSwimmingDarkSkinTone"),
  "person-swimming-light-skin-tone": () => import("./emojis/EmojiPersonSwimmingLightSkinTone"),
  "person-swimming-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonSwimmingMediumDarkSkinTone"),
  "person-swimming-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonSwimmingMediumLightSkinTone"),
  "person-swimming-medium-skin-tone": () => import("./emojis/EmojiPersonSwimmingMediumSkinTone"),
  "person-taking-bath": () => import("./emojis/EmojiPersonTakingBath"),
  "person-taking-bath-dark-skin-tone": () => import("./emojis/EmojiPersonTakingBathDarkSkinTone"),
  "person-taking-bath-light-skin-tone": () => import("./emojis/EmojiPersonTakingBathLightSkinTone"),
  "person-taking-bath-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonTakingBathMediumDarkSkinTone"),
  "person-taking-bath-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonTakingBathMediumLightSkinTone"),
  "person-taking-bath-medium-skin-tone": () =>
    import("./emojis/EmojiPersonTakingBathMediumSkinTone"),
  "person-tipping-hand": () => import("./emojis/EmojiPersonTippingHand"),
  "person-tipping-hand-dark-skin-tone": () => import("./emojis/EmojiPersonTippingHandDarkSkinTone"),
  "person-tipping-hand-light-skin-tone": () =>
    import("./emojis/EmojiPersonTippingHandLightSkinTone"),
  "person-tipping-hand-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonTippingHandMediumDarkSkinTone"),
  "person-tipping-hand-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonTippingHandMediumLightSkinTone"),
  "person-tipping-hand-medium-skin-tone": () =>
    import("./emojis/EmojiPersonTippingHandMediumSkinTone"),
  "person-walking": () => import("./emojis/EmojiPersonWalking"),
  "person-walking-dark-skin-tone": () => import("./emojis/EmojiPersonWalkingDarkSkinTone"),
  "person-walking-facing-right": () => import("./emojis/EmojiPersonWalkingFacingRight"),
  "person-walking-facing-right-dark-skin-tone": () =>
    import("./emojis/EmojiPersonWalkingFacingRightDarkSkinTone"),
  "person-walking-facing-right-light-skin-tone": () =>
    import("./emojis/EmojiPersonWalkingFacingRightLightSkinTone"),
  "person-walking-facing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonWalkingFacingRightMediumDarkSkinTone"),
  "person-walking-facing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonWalkingFacingRightMediumLightSkinTone"),
  "person-walking-facing-right-medium-skin-tone": () =>
    import("./emojis/EmojiPersonWalkingFacingRightMediumSkinTone"),
  "person-walking-light-skin-tone": () => import("./emojis/EmojiPersonWalkingLightSkinTone"),
  "person-walking-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonWalkingMediumDarkSkinTone"),
  "person-walking-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonWalkingMediumLightSkinTone"),
  "person-walking-medium-skin-tone": () => import("./emojis/EmojiPersonWalkingMediumSkinTone"),
  "person-wearing-turban": () => import("./emojis/EmojiPersonWearingTurban"),
  "person-wearing-turban-dark-skin-tone": () =>
    import("./emojis/EmojiPersonWearingTurbanDarkSkinTone"),
  "person-wearing-turban-light-skin-tone": () =>
    import("./emojis/EmojiPersonWearingTurbanLightSkinTone"),
  "person-wearing-turban-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonWearingTurbanMediumDarkSkinTone"),
  "person-wearing-turban-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonWearingTurbanMediumLightSkinTone"),
  "person-wearing-turban-medium-skin-tone": () =>
    import("./emojis/EmojiPersonWearingTurbanMediumSkinTone"),
  "person-white-hair": () => import("./emojis/EmojiPersonWhiteHair"),
  "person-with-crown": () => import("./emojis/EmojiPersonWithCrown"),
  "person-with-crown-dark-skin-tone": () => import("./emojis/EmojiPersonWithCrownDarkSkinTone"),
  "person-with-crown-light-skin-tone": () => import("./emojis/EmojiPersonWithCrownLightSkinTone"),
  "person-with-crown-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonWithCrownMediumDarkSkinTone"),
  "person-with-crown-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonWithCrownMediumLightSkinTone"),
  "person-with-crown-medium-skin-tone": () => import("./emojis/EmojiPersonWithCrownMediumSkinTone"),
  "person-with-skullcap": () => import("./emojis/EmojiPersonWithSkullcap"),
  "person-with-skullcap-dark-skin-tone": () =>
    import("./emojis/EmojiPersonWithSkullcapDarkSkinTone"),
  "person-with-skullcap-light-skin-tone": () =>
    import("./emojis/EmojiPersonWithSkullcapLightSkinTone"),
  "person-with-skullcap-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonWithSkullcapMediumDarkSkinTone"),
  "person-with-skullcap-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonWithSkullcapMediumLightSkinTone"),
  "person-with-skullcap-medium-skin-tone": () =>
    import("./emojis/EmojiPersonWithSkullcapMediumSkinTone"),
  "person-with-veil": () => import("./emojis/EmojiPersonWithVeil"),
  "person-with-veil-dark-skin-tone": () => import("./emojis/EmojiPersonWithVeilDarkSkinTone"),
  "person-with-veil-light-skin-tone": () => import("./emojis/EmojiPersonWithVeilLightSkinTone"),
  "person-with-veil-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonWithVeilMediumDarkSkinTone"),
  "person-with-veil-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonWithVeilMediumLightSkinTone"),
  "person-with-veil-medium-skin-tone": () => import("./emojis/EmojiPersonWithVeilMediumSkinTone"),
  "person-with-white-cane": () => import("./emojis/EmojiPersonWithWhiteCane"),
  "person-with-white-cane-dark-skin-tone": () =>
    import("./emojis/EmojiPersonWithWhiteCaneDarkSkinTone"),
  "person-with-white-cane-facing-right": () =>
    import("./emojis/EmojiPersonWithWhiteCaneFacingRight"),
  "person-with-white-cane-facing-right-dark-skin-tone": () =>
    import("./emojis/EmojiPersonWithWhiteCaneFacingRightDarkSkinTone"),
  "person-with-white-cane-facing-right-light-skin-tone": () =>
    import("./emojis/EmojiPersonWithWhiteCaneFacingRightLightSkinTone"),
  "person-with-white-cane-facing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonWithWhiteCaneFacingRightMediumDarkSkinTone"),
  "person-with-white-cane-facing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonWithWhiteCaneFacingRightMediumLightSkinTone"),
  "person-with-white-cane-facing-right-medium-skin-tone": () =>
    import("./emojis/EmojiPersonWithWhiteCaneFacingRightMediumSkinTone"),
  "person-with-white-cane-light-skin-tone": () =>
    import("./emojis/EmojiPersonWithWhiteCaneLightSkinTone"),
  "person-with-white-cane-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPersonWithWhiteCaneMediumDarkSkinTone"),
  "person-with-white-cane-medium-light-skin-tone": () =>
    import("./emojis/EmojiPersonWithWhiteCaneMediumLightSkinTone"),
  "person-with-white-cane-medium-skin-tone": () =>
    import("./emojis/EmojiPersonWithWhiteCaneMediumSkinTone"),
  "petri-dish": () => import("./emojis/EmojiPetriDish"),
  phoenix: () => import("./emojis/EmojiPhoenix"),
  pick: () => import("./emojis/EmojiPick"),
  "pickup-truck": () => import("./emojis/EmojiPickupTruck"),
  pie: () => import("./emojis/EmojiPie"),
  pig: () => import("./emojis/EmojiPig"),
  "pig-face": () => import("./emojis/EmojiPigFace"),
  "pig-nose": () => import("./emojis/EmojiPigNose"),
  "pile-of-poo": () => import("./emojis/EmojiPileOfPoo"),
  pill: () => import("./emojis/EmojiPill"),
  pilot: () => import("./emojis/EmojiPilot"),
  "pilot-dark-skin-tone": () => import("./emojis/EmojiPilotDarkSkinTone"),
  "pilot-light-skin-tone": () => import("./emojis/EmojiPilotLightSkinTone"),
  "pilot-medium-dark-skin-tone": () => import("./emojis/EmojiPilotMediumDarkSkinTone"),
  "pilot-medium-light-skin-tone": () => import("./emojis/EmojiPilotMediumLightSkinTone"),
  "pilot-medium-skin-tone": () => import("./emojis/EmojiPilotMediumSkinTone"),
  pinata: () => import("./emojis/EmojiPinata"),
  "pinched-fingers": () => import("./emojis/EmojiPinchedFingers"),
  "pinched-fingers-dark-skin-tone": () => import("./emojis/EmojiPinchedFingersDarkSkinTone"),
  "pinched-fingers-light-skin-tone": () => import("./emojis/EmojiPinchedFingersLightSkinTone"),
  "pinched-fingers-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPinchedFingersMediumDarkSkinTone"),
  "pinched-fingers-medium-light-skin-tone": () =>
    import("./emojis/EmojiPinchedFingersMediumLightSkinTone"),
  "pinched-fingers-medium-skin-tone": () => import("./emojis/EmojiPinchedFingersMediumSkinTone"),
  "pinching-hand": () => import("./emojis/EmojiPinchingHand"),
  "pinching-hand-dark-skin-tone": () => import("./emojis/EmojiPinchingHandDarkSkinTone"),
  "pinching-hand-light-skin-tone": () => import("./emojis/EmojiPinchingHandLightSkinTone"),
  "pinching-hand-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPinchingHandMediumDarkSkinTone"),
  "pinching-hand-medium-light-skin-tone": () =>
    import("./emojis/EmojiPinchingHandMediumLightSkinTone"),
  "pinching-hand-medium-skin-tone": () => import("./emojis/EmojiPinchingHandMediumSkinTone"),
  "pine-decoration": () => import("./emojis/EmojiPineDecoration"),
  pineapple: () => import("./emojis/EmojiPineapple"),
  "ping-pong": () => import("./emojis/EmojiPingPong"),
  "pink-heart": () => import("./emojis/EmojiPinkHeart"),
  "pirate-flag": () => import("./emojis/EmojiPirateFlag"),
  pisces: () => import("./emojis/EmojiPisces"),
  pizza: () => import("./emojis/EmojiPizza"),
  placard: () => import("./emojis/EmojiPlacard"),
  "place-of-worship": () => import("./emojis/EmojiPlaceOfWorship"),
  "play-button": () => import("./emojis/EmojiPlayButton"),
  "play-or-pause-button": () => import("./emojis/EmojiPlayOrPauseButton"),
  "playground-slide": () => import("./emojis/EmojiPlaygroundSlide"),
  "pleading-face": () => import("./emojis/EmojiPleadingFace"),
  plunger: () => import("./emojis/EmojiPlunger"),
  plus: () => import("./emojis/EmojiPlus"),
  "polar-bear": () => import("./emojis/EmojiPolarBear"),
  "police-car": () => import("./emojis/EmojiPoliceCar"),
  "police-car-light": () => import("./emojis/EmojiPoliceCarLight"),
  "police-officer": () => import("./emojis/EmojiPoliceOfficer"),
  "police-officer-dark-skin-tone": () => import("./emojis/EmojiPoliceOfficerDarkSkinTone"),
  "police-officer-light-skin-tone": () => import("./emojis/EmojiPoliceOfficerLightSkinTone"),
  "police-officer-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPoliceOfficerMediumDarkSkinTone"),
  "police-officer-medium-light-skin-tone": () =>
    import("./emojis/EmojiPoliceOfficerMediumLightSkinTone"),
  "police-officer-medium-skin-tone": () => import("./emojis/EmojiPoliceOfficerMediumSkinTone"),
  poodle: () => import("./emojis/EmojiPoodle"),
  "pool-8-ball": () => import("./emojis/EmojiPool8Ball"),
  popcorn: () => import("./emojis/EmojiPopcorn"),
  "post-office": () => import("./emojis/EmojiPostOffice"),
  "postal-horn": () => import("./emojis/EmojiPostalHorn"),
  postbox: () => import("./emojis/EmojiPostbox"),
  "pot-of-food": () => import("./emojis/EmojiPotOfFood"),
  "potable-water": () => import("./emojis/EmojiPotableWater"),
  potato: () => import("./emojis/EmojiPotato"),
  "potted-plant": () => import("./emojis/EmojiPottedPlant"),
  "poultry-leg": () => import("./emojis/EmojiPoultryLeg"),
  pound: () => import("./emojis/EmojiPound"),
  "pound-banknote": () => import("./emojis/EmojiPoundBanknote"),
  "pound-symbol": () => import("./emojis/EmojiPoundSymbol"),
  "pouring-liquid": () => import("./emojis/EmojiPouringLiquid"),
  "pouting-cat": () => import("./emojis/EmojiPoutingCat"),
  "prayer-beads": () => import("./emojis/EmojiPrayerBeads"),
  "pregnant-man": () => import("./emojis/EmojiPregnantMan"),
  "pregnant-man-dark-skin-tone": () => import("./emojis/EmojiPregnantManDarkSkinTone"),
  "pregnant-man-light-skin-tone": () => import("./emojis/EmojiPregnantManLightSkinTone"),
  "pregnant-man-medium-dark-skin-tone": () => import("./emojis/EmojiPregnantManMediumDarkSkinTone"),
  "pregnant-man-medium-light-skin-tone": () =>
    import("./emojis/EmojiPregnantManMediumLightSkinTone"),
  "pregnant-man-medium-skin-tone": () => import("./emojis/EmojiPregnantManMediumSkinTone"),
  "pregnant-person": () => import("./emojis/EmojiPregnantPerson"),
  "pregnant-person-dark-skin-tone": () => import("./emojis/EmojiPregnantPersonDarkSkinTone"),
  "pregnant-person-light-skin-tone": () => import("./emojis/EmojiPregnantPersonLightSkinTone"),
  "pregnant-person-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPregnantPersonMediumDarkSkinTone"),
  "pregnant-person-medium-light-skin-tone": () =>
    import("./emojis/EmojiPregnantPersonMediumLightSkinTone"),
  "pregnant-person-medium-skin-tone": () => import("./emojis/EmojiPregnantPersonMediumSkinTone"),
  "pregnant-woman": () => import("./emojis/EmojiPregnantWoman"),
  "pregnant-woman-dark-skin-tone": () => import("./emojis/EmojiPregnantWomanDarkSkinTone"),
  "pregnant-woman-light-skin-tone": () => import("./emojis/EmojiPregnantWomanLightSkinTone"),
  "pregnant-woman-medium-dark-skin-tone": () =>
    import("./emojis/EmojiPregnantWomanMediumDarkSkinTone"),
  "pregnant-woman-medium-light-skin-tone": () =>
    import("./emojis/EmojiPregnantWomanMediumLightSkinTone"),
  "pregnant-woman-medium-skin-tone": () => import("./emojis/EmojiPregnantWomanMediumSkinTone"),
  pretzel: () => import("./emojis/EmojiPretzel"),
  prince: () => import("./emojis/EmojiPrince"),
  "prince-dark-skin-tone": () => import("./emojis/EmojiPrinceDarkSkinTone"),
  "prince-light-skin-tone": () => import("./emojis/EmojiPrinceLightSkinTone"),
  "prince-medium-dark-skin-tone": () => import("./emojis/EmojiPrinceMediumDarkSkinTone"),
  "prince-medium-light-skin-tone": () => import("./emojis/EmojiPrinceMediumLightSkinTone"),
  "prince-medium-skin-tone": () => import("./emojis/EmojiPrinceMediumSkinTone"),
  princess: () => import("./emojis/EmojiPrincess"),
  "princess-dark-skin-tone": () => import("./emojis/EmojiPrincessDarkSkinTone"),
  "princess-light-skin-tone": () => import("./emojis/EmojiPrincessLightSkinTone"),
  "princess-medium-dark-skin-tone": () => import("./emojis/EmojiPrincessMediumDarkSkinTone"),
  "princess-medium-light-skin-tone": () => import("./emojis/EmojiPrincessMediumLightSkinTone"),
  "princess-medium-skin-tone": () => import("./emojis/EmojiPrincessMediumSkinTone"),
  printer: () => import("./emojis/EmojiPrinter"),
  prohibited: () => import("./emojis/EmojiProhibited"),
  "purple-circle": () => import("./emojis/EmojiPurpleCircle"),
  "purple-heart": () => import("./emojis/EmojiPurpleHeart"),
  "purple-square": () => import("./emojis/EmojiPurpleSquare"),
  purse: () => import("./emojis/EmojiPurse"),
  pushpin: () => import("./emojis/EmojiPushpin"),
  "puzzle-piece": () => import("./emojis/EmojiPuzzlePiece"),
  rabbit: () => import("./emojis/EmojiRabbit"),
  "rabbit-face": () => import("./emojis/EmojiRabbitFace"),
  raccoon: () => import("./emojis/EmojiRaccoon"),
  "racing-car": () => import("./emojis/EmojiRacingCar"),
  radio: () => import("./emojis/EmojiRadio"),
  "radio-button": () => import("./emojis/EmojiRadioButton"),
  radioactive: () => import("./emojis/EmojiRadioactive"),
  "railway-car": () => import("./emojis/EmojiRailwayCar"),
  "railway-track": () => import("./emojis/EmojiRailwayTrack"),
  rainbow: () => import("./emojis/EmojiRainbow"),
  "rainbow-flag": () => import("./emojis/EmojiRainbowFlag"),
  "raised-back-of-hand": () => import("./emojis/EmojiRaisedBackOfHand"),
  "raised-back-of-hand-dark-skin-tone": () => import("./emojis/EmojiRaisedBackOfHandDarkSkinTone"),
  "raised-back-of-hand-light-skin-tone": () =>
    import("./emojis/EmojiRaisedBackOfHandLightSkinTone"),
  "raised-back-of-hand-medium-dark-skin-tone": () =>
    import("./emojis/EmojiRaisedBackOfHandMediumDarkSkinTone"),
  "raised-back-of-hand-medium-light-skin-tone": () =>
    import("./emojis/EmojiRaisedBackOfHandMediumLightSkinTone"),
  "raised-back-of-hand-medium-skin-tone": () =>
    import("./emojis/EmojiRaisedBackOfHandMediumSkinTone"),
  "raised-fist": () => import("./emojis/EmojiRaisedFist"),
  "raised-fist-dark-skin-tone": () => import("./emojis/EmojiRaisedFistDarkSkinTone"),
  "raised-fist-light-skin-tone": () => import("./emojis/EmojiRaisedFistLightSkinTone"),
  "raised-fist-medium-dark-skin-tone": () => import("./emojis/EmojiRaisedFistMediumDarkSkinTone"),
  "raised-fist-medium-light-skin-tone": () => import("./emojis/EmojiRaisedFistMediumLightSkinTone"),
  "raised-fist-medium-skin-tone": () => import("./emojis/EmojiRaisedFistMediumSkinTone"),
  "raised-hand": () => import("./emojis/EmojiRaisedHand"),
  "raised-hand-dark-skin-tone": () => import("./emojis/EmojiRaisedHandDarkSkinTone"),
  "raised-hand-light-skin-tone": () => import("./emojis/EmojiRaisedHandLightSkinTone"),
  "raised-hand-medium-dark-skin-tone": () => import("./emojis/EmojiRaisedHandMediumDarkSkinTone"),
  "raised-hand-medium-light-skin-tone": () => import("./emojis/EmojiRaisedHandMediumLightSkinTone"),
  "raised-hand-medium-skin-tone": () => import("./emojis/EmojiRaisedHandMediumSkinTone"),
  "raising-hands": () => import("./emojis/EmojiRaisingHands"),
  "raising-hands-dark-skin-tone": () => import("./emojis/EmojiRaisingHandsDarkSkinTone"),
  "raising-hands-light-skin-tone": () => import("./emojis/EmojiRaisingHandsLightSkinTone"),
  "raising-hands-medium-dark-skin-tone": () =>
    import("./emojis/EmojiRaisingHandsMediumDarkSkinTone"),
  "raising-hands-medium-light-skin-tone": () =>
    import("./emojis/EmojiRaisingHandsMediumLightSkinTone"),
  "raising-hands-medium-skin-tone": () => import("./emojis/EmojiRaisingHandsMediumSkinTone"),
  ram: () => import("./emojis/EmojiRam"),
  rat: () => import("./emojis/EmojiRat"),
  razor: () => import("./emojis/EmojiRazor"),
  receipt: () => import("./emojis/EmojiReceipt"),
  "record-button": () => import("./emojis/EmojiRecordButton"),
  "recycling-symbol": () => import("./emojis/EmojiRecyclingSymbol"),
  "red-apple": () => import("./emojis/EmojiRedApple"),
  "red-circle": () => import("./emojis/EmojiRedCircle"),
  "red-envelope": () => import("./emojis/EmojiRedEnvelope"),
  "red-exclamation-mark": () => import("./emojis/EmojiRedExclamationMark"),
  "red-haired": () => import("./emojis/EmojiRedHaired"),
  "red-heart": () => import("./emojis/EmojiRedHeart"),
  "red-paper-lantern": () => import("./emojis/EmojiRedPaperLantern"),
  "red-question-mark": () => import("./emojis/EmojiRedQuestionMark"),
  "red-square": () => import("./emojis/EmojiRedSquare"),
  "red-triangle-pointed-down": () => import("./emojis/EmojiRedTrianglePointedDown"),
  "red-triangle-pointed-up": () => import("./emojis/EmojiRedTrianglePointedUp"),
  registered: () => import("./emojis/EmojiRegistered"),
  "relieved-face": () => import("./emojis/EmojiRelievedFace"),
  "reminder-ribbon": () => import("./emojis/EmojiReminderRibbon"),
  "repeat-button": () => import("./emojis/EmojiRepeatButton"),
  "repeat-single-button": () => import("./emojis/EmojiRepeatSingleButton"),
  "rescue-workers-helmet": () => import("./emojis/EmojiRescueWorkersHelmet"),
  restroom: () => import("./emojis/EmojiRestroom"),
  "reverse-button": () => import("./emojis/EmojiReverseButton"),
  "revolving-hearts": () => import("./emojis/EmojiRevolvingHearts"),
  rhinoceros: () => import("./emojis/EmojiRhinoceros"),
  ribbon: () => import("./emojis/EmojiRibbon"),
  "rice-ball": () => import("./emojis/EmojiRiceBall"),
  "rice-cracker": () => import("./emojis/EmojiRiceCracker"),
  "right-anger-bubble": () => import("./emojis/EmojiRightAngerBubble"),
  "right-arrow": () => import("./emojis/EmojiRightArrow"),
  "right-arrow-curving-down": () => import("./emojis/EmojiRightArrowCurvingDown"),
  "right-arrow-curving-left": () => import("./emojis/EmojiRightArrowCurvingLeft"),
  "right-arrow-curving-up": () => import("./emojis/EmojiRightArrowCurvingUp"),
  "right-facing-fist": () => import("./emojis/EmojiRightFacingFist"),
  "right-facing-fist-dark-skin-tone": () => import("./emojis/EmojiRightFacingFistDarkSkinTone"),
  "right-facing-fist-light-skin-tone": () => import("./emojis/EmojiRightFacingFistLightSkinTone"),
  "right-facing-fist-medium-dark-skin-tone": () =>
    import("./emojis/EmojiRightFacingFistMediumDarkSkinTone"),
  "right-facing-fist-medium-light-skin-tone": () =>
    import("./emojis/EmojiRightFacingFistMediumLightSkinTone"),
  "right-facing-fist-medium-skin-tone": () => import("./emojis/EmojiRightFacingFistMediumSkinTone"),
  "right-pointing-magnifying-glass": () => import("./emojis/EmojiRightPointingMagnifyingGlass"),
  "rightwards-hand": () => import("./emojis/EmojiRightwardsHand"),
  "rightwards-hand-dark-skin-tone": () => import("./emojis/EmojiRightwardsHandDarkSkinTone"),
  "rightwards-hand-light-skin-tone": () => import("./emojis/EmojiRightwardsHandLightSkinTone"),
  "rightwards-hand-medium-dark-skin-tone": () =>
    import("./emojis/EmojiRightwardsHandMediumDarkSkinTone"),
  "rightwards-hand-medium-light-skin-tone": () =>
    import("./emojis/EmojiRightwardsHandMediumLightSkinTone"),
  "rightwards-hand-medium-skin-tone": () => import("./emojis/EmojiRightwardsHandMediumSkinTone"),
  "rightwards-pushing-hand": () => import("./emojis/EmojiRightwardsPushingHand"),
  "rightwards-pushing-hand-dark-skin-tone": () =>
    import("./emojis/EmojiRightwardsPushingHandDarkSkinTone"),
  "rightwards-pushing-hand-light-skin-tone": () =>
    import("./emojis/EmojiRightwardsPushingHandLightSkinTone"),
  "rightwards-pushing-hand-medium-dark-skin-tone": () =>
    import("./emojis/EmojiRightwardsPushingHandMediumDarkSkinTone"),
  "rightwards-pushing-hand-medium-light-skin-tone": () =>
    import("./emojis/EmojiRightwardsPushingHandMediumLightSkinTone"),
  "rightwards-pushing-hand-medium-skin-tone": () =>
    import("./emojis/EmojiRightwardsPushingHandMediumSkinTone"),
  ring: () => import("./emojis/EmojiRing"),
  "ring-buoy": () => import("./emojis/EmojiRingBuoy"),
  "ringed-planet": () => import("./emojis/EmojiRingedPlanet"),
  "roasted-sweet-potato": () => import("./emojis/EmojiRoastedSweetPotato"),
  robot: () => import("./emojis/EmojiRobot"),
  rock: () => import("./emojis/EmojiRock"),
  rocket: () => import("./emojis/EmojiRocket"),
  "roll-of-paper": () => import("./emojis/EmojiRollOfPaper"),
  "rolled-up-newspaper": () => import("./emojis/EmojiRolledUpNewspaper"),
  "roller-coaster": () => import("./emojis/EmojiRollerCoaster"),
  "roller-skate": () => import("./emojis/EmojiRollerSkate"),
  "rolling-on-the-floor-laughing": () => import("./emojis/EmojiRollingOnTheFloorLaughing"),
  rooster: () => import("./emojis/EmojiRooster"),
  "root-vegetable": () => import("./emojis/EmojiRootVegetable"),
  rose: () => import("./emojis/EmojiRose"),
  rosette: () => import("./emojis/EmojiRosette"),
  "round-pushpin": () => import("./emojis/EmojiRoundPushpin"),
  "rugby-football": () => import("./emojis/EmojiRugbyFootball"),
  "running-shirt": () => import("./emojis/EmojiRunningShirt"),
  "running-shoe": () => import("./emojis/EmojiRunningShoe"),
  "sad-but-relieved-face": () => import("./emojis/EmojiSadButRelievedFace"),
  "safety-pin": () => import("./emojis/EmojiSafetyPin"),
  "safety-vest": () => import("./emojis/EmojiSafetyVest"),
  sagittarius: () => import("./emojis/EmojiSagittarius"),
  sailboat: () => import("./emojis/EmojiSailboat"),
  sake: () => import("./emojis/EmojiSake"),
  salt: () => import("./emojis/EmojiSalt"),
  "saluting-face": () => import("./emojis/EmojiSalutingFace"),
  sandwich: () => import("./emojis/EmojiSandwich"),
  "santa-claus": () => import("./emojis/EmojiSantaClaus"),
  "santa-claus-dark-skin-tone": () => import("./emojis/EmojiSantaClausDarkSkinTone"),
  "santa-claus-light-skin-tone": () => import("./emojis/EmojiSantaClausLightSkinTone"),
  "santa-claus-medium-dark-skin-tone": () => import("./emojis/EmojiSantaClausMediumDarkSkinTone"),
  "santa-claus-medium-light-skin-tone": () => import("./emojis/EmojiSantaClausMediumLightSkinTone"),
  "santa-claus-medium-skin-tone": () => import("./emojis/EmojiSantaClausMediumSkinTone"),
  sari: () => import("./emojis/EmojiSari"),
  satellite: () => import("./emojis/EmojiSatellite"),
  "satellite-antenna": () => import("./emojis/EmojiSatelliteAntenna"),
  sauropod: () => import("./emojis/EmojiSauropod"),
  saxophone: () => import("./emojis/EmojiSaxophone"),
  scarf: () => import("./emojis/EmojiScarf"),
  school: () => import("./emojis/EmojiSchool"),
  scientist: () => import("./emojis/EmojiScientist"),
  "scientist-dark-skin-tone": () => import("./emojis/EmojiScientistDarkSkinTone"),
  "scientist-light-skin-tone": () => import("./emojis/EmojiScientistLightSkinTone"),
  "scientist-medium-dark-skin-tone": () => import("./emojis/EmojiScientistMediumDarkSkinTone"),
  "scientist-medium-light-skin-tone": () => import("./emojis/EmojiScientistMediumLightSkinTone"),
  "scientist-medium-skin-tone": () => import("./emojis/EmojiScientistMediumSkinTone"),
  scissors: () => import("./emojis/EmojiScissors"),
  scorpio: () => import("./emojis/EmojiScorpio"),
  scorpion: () => import("./emojis/EmojiScorpion"),
  screwdriver: () => import("./emojis/EmojiScrewdriver"),
  scroll: () => import("./emojis/EmojiScroll"),
  seal: () => import("./emojis/EmojiSeal"),
  seat: () => import("./emojis/EmojiSeat"),
  "see-no-evil-monkey": () => import("./emojis/EmojiSeeNoEvilMonkey"),
  seedling: () => import("./emojis/EmojiSeedling"),
  selfie: () => import("./emojis/EmojiSelfie"),
  "selfie-dark-skin-tone": () => import("./emojis/EmojiSelfieDarkSkinTone"),
  "selfie-light-skin-tone": () => import("./emojis/EmojiSelfieLightSkinTone"),
  "selfie-medium-dark-skin-tone": () => import("./emojis/EmojiSelfieMediumDarkSkinTone"),
  "selfie-medium-light-skin-tone": () => import("./emojis/EmojiSelfieMediumLightSkinTone"),
  "selfie-medium-skin-tone": () => import("./emojis/EmojiSelfieMediumSkinTone"),
  "service-dog": () => import("./emojis/EmojiServiceDog"),
  "seven-oclock": () => import("./emojis/EmojiSevenOclock"),
  "seven-thirty": () => import("./emojis/EmojiSevenThirty"),
  "sewing-needle": () => import("./emojis/EmojiSewingNeedle"),
  "shaking-face": () => import("./emojis/EmojiShakingFace"),
  "shallow-pan-of-food": () => import("./emojis/EmojiShallowPanOfFood"),
  shamrock: () => import("./emojis/EmojiShamrock"),
  shark: () => import("./emojis/EmojiShark"),
  "shaved-ice": () => import("./emojis/EmojiShavedIce"),
  "sheaf-of-rice": () => import("./emojis/EmojiSheafOfRice"),
  shield: () => import("./emojis/EmojiShield"),
  "shinto-shrine": () => import("./emojis/EmojiShintoShrine"),
  ship: () => import("./emojis/EmojiShip"),
  "shooting-star": () => import("./emojis/EmojiShootingStar"),
  "shopping-bags": () => import("./emojis/EmojiShoppingBags"),
  "shopping-cart": () => import("./emojis/EmojiShoppingCart"),
  shortcake: () => import("./emojis/EmojiShortcake"),
  shorts: () => import("./emojis/EmojiShorts"),
  shovel: () => import("./emojis/EmojiShovel"),
  shower: () => import("./emojis/EmojiShower"),
  shrimp: () => import("./emojis/EmojiShrimp"),
  "shuffle-tracks-button": () => import("./emojis/EmojiShuffleTracksButton"),
  "shushing-face": () => import("./emojis/EmojiShushingFace"),
  "sign-of-the-horns": () => import("./emojis/EmojiSignOfTheHorns"),
  "sign-of-the-horns-dark-skin-tone": () => import("./emojis/EmojiSignOfTheHornsDarkSkinTone"),
  "sign-of-the-horns-light-skin-tone": () => import("./emojis/EmojiSignOfTheHornsLightSkinTone"),
  "sign-of-the-horns-medium-dark-skin-tone": () =>
    import("./emojis/EmojiSignOfTheHornsMediumDarkSkinTone"),
  "sign-of-the-horns-medium-light-skin-tone": () =>
    import("./emojis/EmojiSignOfTheHornsMediumLightSkinTone"),
  "sign-of-the-horns-medium-skin-tone": () => import("./emojis/EmojiSignOfTheHornsMediumSkinTone"),
  singer: () => import("./emojis/EmojiSinger"),
  "singer-dark-skin-tone": () => import("./emojis/EmojiSingerDarkSkinTone"),
  "singer-light-skin-tone": () => import("./emojis/EmojiSingerLightSkinTone"),
  "singer-medium-dark-skin-tone": () => import("./emojis/EmojiSingerMediumDarkSkinTone"),
  "singer-medium-light-skin-tone": () => import("./emojis/EmojiSingerMediumLightSkinTone"),
  "singer-medium-skin-tone": () => import("./emojis/EmojiSingerMediumSkinTone"),
  "six-oclock": () => import("./emojis/EmojiSixOclock"),
  "six-thirty": () => import("./emojis/EmojiSixThirty"),
  skateboard: () => import("./emojis/EmojiSkateboard"),
  skier: () => import("./emojis/EmojiSkier"),
  skis: () => import("./emojis/EmojiSkis"),
  skull: () => import("./emojis/EmojiSkull"),
  "skull-and-crossbones": () => import("./emojis/EmojiSkullAndCrossbones"),
  skunk: () => import("./emojis/EmojiSkunk"),
  sled: () => import("./emojis/EmojiSled"),
  "sleeping-face": () => import("./emojis/EmojiSleepingFace"),
  "sleepy-face": () => import("./emojis/EmojiSleepyFace"),
  "slightly-frowning-face": () => import("./emojis/EmojiSlightlyFrowningFace"),
  "slightly-smiling-face": () => import("./emojis/EmojiSlightlySmilingFace"),
  "slot-machine": () => import("./emojis/EmojiSlotMachine"),
  sloth: () => import("./emojis/EmojiSloth"),
  "small-airplane": () => import("./emojis/EmojiSmallAirplane"),
  "small-blue-diamond": () => import("./emojis/EmojiSmallBlueDiamond"),
  "small-orange-diamond": () => import("./emojis/EmojiSmallOrangeDiamond"),
  "smiling-cat-with-heart-eyes": () => import("./emojis/EmojiSmilingCatWithHeartEyes"),
  "smiling-face": () => import("./emojis/EmojiSmilingFace"),
  "smiling-face-with-halo": () => import("./emojis/EmojiSmilingFaceWithHalo"),
  "smiling-face-with-heart-eyes": () => import("./emojis/EmojiSmilingFaceWithHeartEyes"),
  "smiling-face-with-hearts": () => import("./emojis/EmojiSmilingFaceWithHearts"),
  "smiling-face-with-horns": () => import("./emojis/EmojiSmilingFaceWithHorns"),
  "smiling-face-with-open-hands": () => import("./emojis/EmojiSmilingFaceWithOpenHands"),
  "smiling-face-with-open-mouth": () => import("./emojis/EmojiSmilingFaceWithOpenMouth"),
  "smiling-face-with-open-mouth-and-closed-eyes": () =>
    import("./emojis/EmojiSmilingFaceWithOpenMouthAndClosedEyes"),
  "smiling-face-with-open-mouth-and-cold-sweat": () =>
    import("./emojis/EmojiSmilingFaceWithOpenMouthAndColdSweat"),
  "smiling-face-with-open-mouth-and-smiling-eyes": () =>
    import("./emojis/EmojiSmilingFaceWithOpenMouthAndSmilingEyes"),
  "smiling-face-with-smiling-eyes": () => import("./emojis/EmojiSmilingFaceWithSmilingEyes"),
  "smiling-face-with-sunglasses": () => import("./emojis/EmojiSmilingFaceWithSunglasses"),
  "smiling-face-with-tear": () => import("./emojis/EmojiSmilingFaceWithTear"),
  "smirking-face": () => import("./emojis/EmojiSmirkingFace"),
  snail: () => import("./emojis/EmojiSnail"),
  snake: () => import("./emojis/EmojiSnake"),
  "sneezing-face": () => import("./emojis/EmojiSneezingFace"),
  "snow-capped-mountain": () => import("./emojis/EmojiSnowCappedMountain"),
  snowboarder: () => import("./emojis/EmojiSnowboarder"),
  "snowboarder-dark-skin-tone": () => import("./emojis/EmojiSnowboarderDarkSkinTone"),
  "snowboarder-light-skin-tone": () => import("./emojis/EmojiSnowboarderLightSkinTone"),
  "snowboarder-medium-dark-skin-tone": () => import("./emojis/EmojiSnowboarderMediumDarkSkinTone"),
  "snowboarder-medium-light-skin-tone": () =>
    import("./emojis/EmojiSnowboarderMediumLightSkinTone"),
  "snowboarder-medium-skin-tone": () => import("./emojis/EmojiSnowboarderMediumSkinTone"),
  snowflake: () => import("./emojis/EmojiSnowflake"),
  snowman: () => import("./emojis/EmojiSnowman"),
  "snowman-without-snow": () => import("./emojis/EmojiSnowmanWithoutSnow"),
  soap: () => import("./emojis/EmojiSoap"),
  "soccer-ball": () => import("./emojis/EmojiSoccerBall"),
  socks: () => import("./emojis/EmojiSocks"),
  "soft-ice-cream": () => import("./emojis/EmojiSoftIceCream"),
  softball: () => import("./emojis/EmojiSoftball"),
  "soon-arrow": () => import("./emojis/EmojiSoonArrow"),
  "sos-button": () => import("./emojis/EmojiSosButton"),
  "spade-suit": () => import("./emojis/EmojiSpadeSuit"),
  spaghetti: () => import("./emojis/EmojiSpaghetti"),
  sparkle: () => import("./emojis/EmojiSparkle"),
  sparkler: () => import("./emojis/EmojiSparkler"),
  sparkles: () => import("./emojis/EmojiSparkles"),
  "sparkling-heart": () => import("./emojis/EmojiSparklingHeart"),
  "speak-no-evil-monkey": () => import("./emojis/EmojiSpeakNoEvilMonkey"),
  "speaker-high-volume": () => import("./emojis/EmojiSpeakerHighVolume"),
  "speaker-low-volume": () => import("./emojis/EmojiSpeakerLowVolume"),
  "speaker-medium-volume": () => import("./emojis/EmojiSpeakerMediumVolume"),
  "speaking-head": () => import("./emojis/EmojiSpeakingHead"),
  "speech-balloon": () => import("./emojis/EmojiSpeechBalloon"),
  speedboat: () => import("./emojis/EmojiSpeedboat"),
  spider: () => import("./emojis/EmojiSpider"),
  "spider-web": () => import("./emojis/EmojiSpiderWeb"),
  "spiral-calendar": () => import("./emojis/EmojiSpiralCalendar"),
  "spiral-notepad": () => import("./emojis/EmojiSpiralNotepad"),
  "spiral-shell": () => import("./emojis/EmojiSpiralShell"),
  splatter: () => import("./emojis/EmojiSplatter"),
  sponge: () => import("./emojis/EmojiSponge"),
  spoon: () => import("./emojis/EmojiSpoon"),
  "sport-utility-vehicle": () => import("./emojis/EmojiSportUtilityVehicle"),
  "sports-medal": () => import("./emojis/EmojiSportsMedal"),
  "spouting-whale": () => import("./emojis/EmojiSpoutingWhale"),
  squid: () => import("./emojis/EmojiSquid"),
  "squinting-face-with-tongue": () => import("./emojis/EmojiSquintingFaceWithTongue"),
  stadium: () => import("./emojis/EmojiStadium"),
  star: () => import("./emojis/EmojiStar"),
  "star-and-crescent": () => import("./emojis/EmojiStarAndCrescent"),
  "star-of-david": () => import("./emojis/EmojiStarOfDavid"),
  "star-struck": () => import("./emojis/EmojiStarStruck"),
  station: () => import("./emojis/EmojiStation"),
  "statue-of-liberty": () => import("./emojis/EmojiStatueOfLiberty"),
  "steaming-bowl": () => import("./emojis/EmojiSteamingBowl"),
  stethoscope: () => import("./emojis/EmojiStethoscope"),
  "stop-button": () => import("./emojis/EmojiStopButton"),
  "stop-sign": () => import("./emojis/EmojiStopSign"),
  stopwatch: () => import("./emojis/EmojiStopwatch"),
  "straight-ruler": () => import("./emojis/EmojiStraightRuler"),
  strawberry: () => import("./emojis/EmojiStrawberry"),
  student: () => import("./emojis/EmojiStudent"),
  "student-dark-skin-tone": () => import("./emojis/EmojiStudentDarkSkinTone"),
  "student-light-skin-tone": () => import("./emojis/EmojiStudentLightSkinTone"),
  "student-medium-dark-skin-tone": () => import("./emojis/EmojiStudentMediumDarkSkinTone"),
  "student-medium-light-skin-tone": () => import("./emojis/EmojiStudentMediumLightSkinTone"),
  "student-medium-skin-tone": () => import("./emojis/EmojiStudentMediumSkinTone"),
  "studio-microphone": () => import("./emojis/EmojiStudioMicrophone"),
  "stuffed-flatbread": () => import("./emojis/EmojiStuffedFlatbread"),
  sun: () => import("./emojis/EmojiSun"),
  "sun-behind-cloud": () => import("./emojis/EmojiSunBehindCloud"),
  "sun-behind-large-cloud": () => import("./emojis/EmojiSunBehindLargeCloud"),
  "sun-behind-rain-cloud": () => import("./emojis/EmojiSunBehindRainCloud"),
  "sun-behind-small-cloud": () => import("./emojis/EmojiSunBehindSmallCloud"),
  "sun-with-face": () => import("./emojis/EmojiSunWithFace"),
  sunflower: () => import("./emojis/EmojiSunflower"),
  sunglasses: () => import("./emojis/EmojiSunglasses"),
  sunrise: () => import("./emojis/EmojiSunrise"),
  "sunrise-over-mountains": () => import("./emojis/EmojiSunriseOverMountains"),
  sunset: () => import("./emojis/EmojiSunset"),
  superhero: () => import("./emojis/EmojiSuperhero"),
  "superhero-dark-skin-tone": () => import("./emojis/EmojiSuperheroDarkSkinTone"),
  "superhero-light-skin-tone": () => import("./emojis/EmojiSuperheroLightSkinTone"),
  "superhero-medium-dark-skin-tone": () => import("./emojis/EmojiSuperheroMediumDarkSkinTone"),
  "superhero-medium-light-skin-tone": () => import("./emojis/EmojiSuperheroMediumLightSkinTone"),
  "superhero-medium-skin-tone": () => import("./emojis/EmojiSuperheroMediumSkinTone"),
  supervillain: () => import("./emojis/EmojiSupervillain"),
  "supervillain-dark-skin-tone": () => import("./emojis/EmojiSupervillainDarkSkinTone"),
  "supervillain-light-skin-tone": () => import("./emojis/EmojiSupervillainLightSkinTone"),
  "supervillain-medium-dark-skin-tone": () =>
    import("./emojis/EmojiSupervillainMediumDarkSkinTone"),
  "supervillain-medium-light-skin-tone": () =>
    import("./emojis/EmojiSupervillainMediumLightSkinTone"),
  "supervillain-medium-skin-tone": () => import("./emojis/EmojiSupervillainMediumSkinTone"),
  sushi: () => import("./emojis/EmojiSushi"),
  "suspension-railway": () => import("./emojis/EmojiSuspensionRailway"),
  swan: () => import("./emojis/EmojiSwan"),
  "sweat-droplets": () => import("./emojis/EmojiSweatDroplets"),
  synagogue: () => import("./emojis/EmojiSynagogue"),
  syringe: () => import("./emojis/EmojiSyringe"),
  "t-rex": () => import("./emojis/EmojiTRex"),
  "t-shirt": () => import("./emojis/EmojiTShirt"),
  taco: () => import("./emojis/EmojiTaco"),
  "takeout-box": () => import("./emojis/EmojiTakeoutBox"),
  tamale: () => import("./emojis/EmojiTamale"),
  "tanabata-tree": () => import("./emojis/EmojiTanabataTree"),
  tangerine: () => import("./emojis/EmojiTangerine"),
  taurus: () => import("./emojis/EmojiTaurus"),
  taxi: () => import("./emojis/EmojiTaxi"),
  teacher: () => import("./emojis/EmojiTeacher"),
  "teacher-dark-skin-tone": () => import("./emojis/EmojiTeacherDarkSkinTone"),
  "teacher-light-skin-tone": () => import("./emojis/EmojiTeacherLightSkinTone"),
  "teacher-medium-dark-skin-tone": () => import("./emojis/EmojiTeacherMediumDarkSkinTone"),
  "teacher-medium-light-skin-tone": () => import("./emojis/EmojiTeacherMediumLightSkinTone"),
  "teacher-medium-skin-tone": () => import("./emojis/EmojiTeacherMediumSkinTone"),
  "teacup-without-handle": () => import("./emojis/EmojiTeacupWithoutHandle"),
  teapot: () => import("./emojis/EmojiTeapot"),
  "tear-off-calendar": () => import("./emojis/EmojiTearOffCalendar"),
  technologist: () => import("./emojis/EmojiTechnologist"),
  "technologist-dark-skin-tone": () => import("./emojis/EmojiTechnologistDarkSkinTone"),
  "technologist-light-skin-tone": () => import("./emojis/EmojiTechnologistLightSkinTone"),
  "technologist-medium-dark-skin-tone": () =>
    import("./emojis/EmojiTechnologistMediumDarkSkinTone"),
  "technologist-medium-light-skin-tone": () =>
    import("./emojis/EmojiTechnologistMediumLightSkinTone"),
  "technologist-medium-skin-tone": () => import("./emojis/EmojiTechnologistMediumSkinTone"),
  "teddy-bear": () => import("./emojis/EmojiTeddyBear"),
  telephone: () => import("./emojis/EmojiTelephone"),
  "telephone-receiver": () => import("./emojis/EmojiTelephoneReceiver"),
  telescope: () => import("./emojis/EmojiTelescope"),
  television: () => import("./emojis/EmojiTelevision"),
  "ten-oclock": () => import("./emojis/EmojiTenOclock"),
  "ten-thirty": () => import("./emojis/EmojiTenThirty"),
  tennis: () => import("./emojis/EmojiTennis"),
  tent: () => import("./emojis/EmojiTent"),
  "test-tube": () => import("./emojis/EmojiTestTube"),
  thermometer: () => import("./emojis/EmojiThermometer"),
  "thinking-face": () => import("./emojis/EmojiThinkingFace"),
  "thong-sandal": () => import("./emojis/EmojiThongSandal"),
  "thought-balloon": () => import("./emojis/EmojiThoughtBalloon"),
  thread: () => import("./emojis/EmojiThread"),
  "three-oclock": () => import("./emojis/EmojiThreeOclock"),
  "three-thirty": () => import("./emojis/EmojiThreeThirty"),
  "thumbs-down": () => import("./emojis/EmojiThumbsDown"),
  "thumbs-down-dark-skin-tone": () => import("./emojis/EmojiThumbsDownDarkSkinTone"),
  "thumbs-down-light-skin-tone": () => import("./emojis/EmojiThumbsDownLightSkinTone"),
  "thumbs-down-medium-dark-skin-tone": () => import("./emojis/EmojiThumbsDownMediumDarkSkinTone"),
  "thumbs-down-medium-light-skin-tone": () => import("./emojis/EmojiThumbsDownMediumLightSkinTone"),
  "thumbs-down-medium-skin-tone": () => import("./emojis/EmojiThumbsDownMediumSkinTone"),
  "thumbs-up": () => import("./emojis/EmojiThumbsUp"),
  "thumbs-up-dark-skin-tone": () => import("./emojis/EmojiThumbsUpDarkSkinTone"),
  "thumbs-up-light-skin-tone": () => import("./emojis/EmojiThumbsUpLightSkinTone"),
  "thumbs-up-medium-dark-skin-tone": () => import("./emojis/EmojiThumbsUpMediumDarkSkinTone"),
  "thumbs-up-medium-light-skin-tone": () => import("./emojis/EmojiThumbsUpMediumLightSkinTone"),
  "thumbs-up-medium-skin-tone": () => import("./emojis/EmojiThumbsUpMediumSkinTone"),
  ticket: () => import("./emojis/EmojiTicket"),
  tiger: () => import("./emojis/EmojiTiger"),
  "tiger-face": () => import("./emojis/EmojiTigerFace"),
  "timer-clock": () => import("./emojis/EmojiTimerClock"),
  "tired-face": () => import("./emojis/EmojiTiredFace"),
  toilet: () => import("./emojis/EmojiToilet"),
  "tokyo-tower": () => import("./emojis/EmojiTokyoTower"),
  tomato: () => import("./emojis/EmojiTomato"),
  tongue: () => import("./emojis/EmojiTongue"),
  toolbox: () => import("./emojis/EmojiToolbox"),
  tooth: () => import("./emojis/EmojiTooth"),
  toothbrush: () => import("./emojis/EmojiToothbrush"),
  "top-arrow": () => import("./emojis/EmojiTopArrow"),
  "top-hat": () => import("./emojis/EmojiTopHat"),
  tornado: () => import("./emojis/EmojiTornado"),
  trackball: () => import("./emojis/EmojiTrackball"),
  tractor: () => import("./emojis/EmojiTractor"),
  "trade-mark": () => import("./emojis/EmojiTradeMark"),
  train: () => import("./emojis/EmojiTrain"),
  tram: () => import("./emojis/EmojiTram"),
  "tram-car": () => import("./emojis/EmojiTramCar"),
  "transgender-flag": () => import("./emojis/EmojiTransgenderFlag"),
  "transgender-symbol": () => import("./emojis/EmojiTransgenderSymbol"),
  "treasure-chest": () => import("./emojis/EmojiTreasureChest"),
  "triangular-flag": () => import("./emojis/EmojiTriangularFlag"),
  "triangular-ruler": () => import("./emojis/EmojiTriangularRuler"),
  "trident-emblem": () => import("./emojis/EmojiTridentEmblem"),
  troll: () => import("./emojis/EmojiTroll"),
  trolleybus: () => import("./emojis/EmojiTrolleybus"),
  trombone: () => import("./emojis/EmojiTrombone"),
  trophy: () => import("./emojis/EmojiTrophy"),
  "tropical-drink": () => import("./emojis/EmojiTropicalDrink"),
  "tropical-fish": () => import("./emojis/EmojiTropicalFish"),
  trumpet: () => import("./emojis/EmojiTrumpet"),
  tulip: () => import("./emojis/EmojiTulip"),
  "tumbler-glass": () => import("./emojis/EmojiTumblerGlass"),
  turkey: () => import("./emojis/EmojiTurkey"),
  turtle: () => import("./emojis/EmojiTurtle"),
  "twelve-oclock": () => import("./emojis/EmojiTwelveOclock"),
  "twelve-thirty": () => import("./emojis/EmojiTwelveThirty"),
  "two-hearts": () => import("./emojis/EmojiTwoHearts"),
  "two-hump-camel": () => import("./emojis/EmojiTwoHumpCamel"),
  "two-oclock": () => import("./emojis/EmojiTwoOclock"),
  "two-thirty": () => import("./emojis/EmojiTwoThirty"),
  umbrella: () => import("./emojis/EmojiUmbrella"),
  "umbrella-on-ground": () => import("./emojis/EmojiUmbrellaOnGround"),
  "umbrella-with-rain-drops": () => import("./emojis/EmojiUmbrellaWithRainDrops"),
  "unamused-face": () => import("./emojis/EmojiUnamusedFace"),
  unicorn: () => import("./emojis/EmojiUnicorn"),
  "unknown-flag": () => import("./emojis/EmojiUnknownFlag"),
  unlocked: () => import("./emojis/EmojiUnlocked"),
  "up-arrow": () => import("./emojis/EmojiUpArrow"),
  "up-down-arrow": () => import("./emojis/EmojiUpDownArrow"),
  "up-exclamation-button": () => import("./emojis/EmojiUpExclamationButton"),
  "up-left-arrow": () => import("./emojis/EmojiUpLeftArrow"),
  "up-right-arrow": () => import("./emojis/EmojiUpRightArrow"),
  "upside-down-face": () => import("./emojis/EmojiUpsideDownFace"),
  "upwards-button": () => import("./emojis/EmojiUpwardsButton"),
  vampire: () => import("./emojis/EmojiVampire"),
  "vampire-dark-skin-tone": () => import("./emojis/EmojiVampireDarkSkinTone"),
  "vampire-light-skin-tone": () => import("./emojis/EmojiVampireLightSkinTone"),
  "vampire-medium-dark-skin-tone": () => import("./emojis/EmojiVampireMediumDarkSkinTone"),
  "vampire-medium-light-skin-tone": () => import("./emojis/EmojiVampireMediumLightSkinTone"),
  "vampire-medium-skin-tone": () => import("./emojis/EmojiVampireMediumSkinTone"),
  "vertical-traffic-light": () => import("./emojis/EmojiVerticalTrafficLight"),
  "vibration-mode": () => import("./emojis/EmojiVibrationMode"),
  "victory-hand": () => import("./emojis/EmojiVictoryHand"),
  "victory-hand-dark-skin-tone": () => import("./emojis/EmojiVictoryHandDarkSkinTone"),
  "victory-hand-light-skin-tone": () => import("./emojis/EmojiVictoryHandLightSkinTone"),
  "victory-hand-medium-dark-skin-tone": () => import("./emojis/EmojiVictoryHandMediumDarkSkinTone"),
  "victory-hand-medium-light-skin-tone": () =>
    import("./emojis/EmojiVictoryHandMediumLightSkinTone"),
  "victory-hand-medium-skin-tone": () => import("./emojis/EmojiVictoryHandMediumSkinTone"),
  "video-camera": () => import("./emojis/EmojiVideoCamera"),
  "video-game": () => import("./emojis/EmojiVideoGame"),
  videocassette: () => import("./emojis/EmojiVideocassette"),
  violin: () => import("./emojis/EmojiViolin"),
  virgo: () => import("./emojis/EmojiVirgo"),
  volcano: () => import("./emojis/EmojiVolcano"),
  volleyball: () => import("./emojis/EmojiVolleyball"),
  "vs-button": () => import("./emojis/EmojiVsButton"),
  "vulcan-salute": () => import("./emojis/EmojiVulcanSalute"),
  "vulcan-salute-dark-skin-tone": () => import("./emojis/EmojiVulcanSaluteDarkSkinTone"),
  "vulcan-salute-light-skin-tone": () => import("./emojis/EmojiVulcanSaluteLightSkinTone"),
  "vulcan-salute-medium-dark-skin-tone": () =>
    import("./emojis/EmojiVulcanSaluteMediumDarkSkinTone"),
  "vulcan-salute-medium-light-skin-tone": () =>
    import("./emojis/EmojiVulcanSaluteMediumLightSkinTone"),
  "vulcan-salute-medium-skin-tone": () => import("./emojis/EmojiVulcanSaluteMediumSkinTone"),
  waffle: () => import("./emojis/EmojiWaffle"),
  "waning-crescent-moon": () => import("./emojis/EmojiWaningCrescentMoon"),
  "waning-gibbous-moon": () => import("./emojis/EmojiWaningGibbousMoon"),
  warning: () => import("./emojis/EmojiWarning"),
  wastebasket: () => import("./emojis/EmojiWastebasket"),
  watch: () => import("./emojis/EmojiWatch"),
  "water-buffalo": () => import("./emojis/EmojiWaterBuffalo"),
  "water-closet": () => import("./emojis/EmojiWaterCloset"),
  "water-pistol": () => import("./emojis/EmojiWaterPistol"),
  "water-wave": () => import("./emojis/EmojiWaterWave"),
  watermelon: () => import("./emojis/EmojiWatermelon"),
  "waving-hand": () => import("./emojis/EmojiWavingHand"),
  "waving-hand-dark-skin-tone": () => import("./emojis/EmojiWavingHandDarkSkinTone"),
  "waving-hand-light-skin-tone": () => import("./emojis/EmojiWavingHandLightSkinTone"),
  "waving-hand-medium-dark-skin-tone": () => import("./emojis/EmojiWavingHandMediumDarkSkinTone"),
  "waving-hand-medium-light-skin-tone": () => import("./emojis/EmojiWavingHandMediumLightSkinTone"),
  "waving-hand-medium-skin-tone": () => import("./emojis/EmojiWavingHandMediumSkinTone"),
  "wavy-dash": () => import("./emojis/EmojiWavyDash"),
  "waxing-crescent-moon": () => import("./emojis/EmojiWaxingCrescentMoon"),
  "waxing-gibbous-moon": () => import("./emojis/EmojiWaxingGibbousMoon"),
  "weary-cat": () => import("./emojis/EmojiWearyCat"),
  "weary-face": () => import("./emojis/EmojiWearyFace"),
  wedding: () => import("./emojis/EmojiWedding"),
  whale: () => import("./emojis/EmojiWhale"),
  wheel: () => import("./emojis/EmojiWheel"),
  "wheel-of-dharma": () => import("./emojis/EmojiWheelOfDharma"),
  "wheelchair-symbol": () => import("./emojis/EmojiWheelchairSymbol"),
  "white-cane": () => import("./emojis/EmojiWhiteCane"),
  "white-circle": () => import("./emojis/EmojiWhiteCircle"),
  "white-exclamation-mark": () => import("./emojis/EmojiWhiteExclamationMark"),
  "white-flag": () => import("./emojis/EmojiWhiteFlag"),
  "white-flower": () => import("./emojis/EmojiWhiteFlower"),
  "white-haired": () => import("./emojis/EmojiWhiteHaired"),
  "white-heart": () => import("./emojis/EmojiWhiteHeart"),
  "white-large-square": () => import("./emojis/EmojiWhiteLargeSquare"),
  "white-medium-small-square": () => import("./emojis/EmojiWhiteMediumSmallSquare"),
  "white-medium-square": () => import("./emojis/EmojiWhiteMediumSquare"),
  "white-question-mark": () => import("./emojis/EmojiWhiteQuestionMark"),
  "white-small-square": () => import("./emojis/EmojiWhiteSmallSquare"),
  "white-square-button": () => import("./emojis/EmojiWhiteSquareButton"),
  "wilted-flower": () => import("./emojis/EmojiWiltedFlower"),
  "wind-chime": () => import("./emojis/EmojiWindChime"),
  "wind-face": () => import("./emojis/EmojiWindFace"),
  window: () => import("./emojis/EmojiWindow"),
  "wine-glass": () => import("./emojis/EmojiWineGlass"),
  wing: () => import("./emojis/EmojiWing"),
  "winking-face": () => import("./emojis/EmojiWinkingFace"),
  "winking-face-with-tongue": () => import("./emojis/EmojiWinkingFaceWithTongue"),
  wireless: () => import("./emojis/EmojiWireless"),
  wolf: () => import("./emojis/EmojiWolf"),
  woman: () => import("./emojis/EmojiWoman"),
  "woman-and-man-holding-hands": () => import("./emojis/EmojiWomanAndManHoldingHands"),
  "woman-and-man-holding-hands-dark-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsDarkSkinTone"),
  "woman-and-man-holding-hands-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsDarkSkinToneLightSkinTone"),
  "woman-and-man-holding-hands-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsDarkSkinToneMediumDarkSkinTone"),
  "woman-and-man-holding-hands-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsDarkSkinToneMediumLightSkinTone"),
  "woman-and-man-holding-hands-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsDarkSkinToneMediumSkinTone"),
  "woman-and-man-holding-hands-light-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsLightSkinTone"),
  "woman-and-man-holding-hands-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsLightSkinToneDarkSkinTone"),
  "woman-and-man-holding-hands-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsLightSkinToneMediumDarkSkinTone"),
  "woman-and-man-holding-hands-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsLightSkinToneMediumLightSkinTone"),
  "woman-and-man-holding-hands-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsLightSkinToneMediumSkinTone"),
  "woman-and-man-holding-hands-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsMediumDarkSkinTone"),
  "woman-and-man-holding-hands-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsMediumDarkSkinToneDarkSkinTone"),
  "woman-and-man-holding-hands-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsMediumDarkSkinToneLightSkinTone"),
  "woman-and-man-holding-hands-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsMediumDarkSkinToneMediumLightSkinTone"),
  "woman-and-man-holding-hands-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsMediumDarkSkinToneMediumSkinTone"),
  "woman-and-man-holding-hands-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsMediumLightSkinTone"),
  "woman-and-man-holding-hands-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsMediumLightSkinToneDarkSkinTone"),
  "woman-and-man-holding-hands-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsMediumLightSkinToneLightSkinTone"),
  "woman-and-man-holding-hands-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsMediumLightSkinToneMediumDarkSkinTone"),
  "woman-and-man-holding-hands-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsMediumLightSkinToneMediumSkinTone"),
  "woman-and-man-holding-hands-medium-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsMediumSkinTone"),
  "woman-and-man-holding-hands-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsMediumSkinToneDarkSkinTone"),
  "woman-and-man-holding-hands-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsMediumSkinToneLightSkinTone"),
  "woman-and-man-holding-hands-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsMediumSkinToneMediumDarkSkinTone"),
  "woman-and-man-holding-hands-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanAndManHoldingHandsMediumSkinToneMediumLightSkinTone"),
  "woman-artist": () => import("./emojis/EmojiWomanArtist"),
  "woman-artist-dark-skin-tone": () => import("./emojis/EmojiWomanArtistDarkSkinTone"),
  "woman-artist-light-skin-tone": () => import("./emojis/EmojiWomanArtistLightSkinTone"),
  "woman-artist-medium-dark-skin-tone": () => import("./emojis/EmojiWomanArtistMediumDarkSkinTone"),
  "woman-artist-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanArtistMediumLightSkinTone"),
  "woman-artist-medium-skin-tone": () => import("./emojis/EmojiWomanArtistMediumSkinTone"),
  "woman-astronaut": () => import("./emojis/EmojiWomanAstronaut"),
  "woman-astronaut-dark-skin-tone": () => import("./emojis/EmojiWomanAstronautDarkSkinTone"),
  "woman-astronaut-light-skin-tone": () => import("./emojis/EmojiWomanAstronautLightSkinTone"),
  "woman-astronaut-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanAstronautMediumDarkSkinTone"),
  "woman-astronaut-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanAstronautMediumLightSkinTone"),
  "woman-astronaut-medium-skin-tone": () => import("./emojis/EmojiWomanAstronautMediumSkinTone"),
  "woman-bald": () => import("./emojis/EmojiWomanBald"),
  "woman-beard": () => import("./emojis/EmojiWomanBeard"),
  "woman-biking": () => import("./emojis/EmojiWomanBiking"),
  "woman-biking-dark-skin-tone": () => import("./emojis/EmojiWomanBikingDarkSkinTone"),
  "woman-biking-light-skin-tone": () => import("./emojis/EmojiWomanBikingLightSkinTone"),
  "woman-biking-medium-dark-skin-tone": () => import("./emojis/EmojiWomanBikingMediumDarkSkinTone"),
  "woman-biking-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanBikingMediumLightSkinTone"),
  "woman-biking-medium-skin-tone": () => import("./emojis/EmojiWomanBikingMediumSkinTone"),
  "woman-blond-hair": () => import("./emojis/EmojiWomanBlondHair"),
  "woman-bouncing-ball": () => import("./emojis/EmojiWomanBouncingBall"),
  "woman-bouncing-ball-dark-skin-tone": () => import("./emojis/EmojiWomanBouncingBallDarkSkinTone"),
  "woman-bouncing-ball-light-skin-tone": () =>
    import("./emojis/EmojiWomanBouncingBallLightSkinTone"),
  "woman-bouncing-ball-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanBouncingBallMediumDarkSkinTone"),
  "woman-bouncing-ball-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanBouncingBallMediumLightSkinTone"),
  "woman-bouncing-ball-medium-skin-tone": () =>
    import("./emojis/EmojiWomanBouncingBallMediumSkinTone"),
  "woman-bowing": () => import("./emojis/EmojiWomanBowing"),
  "woman-bowing-dark-skin-tone": () => import("./emojis/EmojiWomanBowingDarkSkinTone"),
  "woman-bowing-light-skin-tone": () => import("./emojis/EmojiWomanBowingLightSkinTone"),
  "woman-bowing-medium-dark-skin-tone": () => import("./emojis/EmojiWomanBowingMediumDarkSkinTone"),
  "woman-bowing-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanBowingMediumLightSkinTone"),
  "woman-bowing-medium-skin-tone": () => import("./emojis/EmojiWomanBowingMediumSkinTone"),
  "woman-cartwheeling": () => import("./emojis/EmojiWomanCartwheeling"),
  "woman-cartwheeling-dark-skin-tone": () => import("./emojis/EmojiWomanCartwheelingDarkSkinTone"),
  "woman-cartwheeling-light-skin-tone": () =>
    import("./emojis/EmojiWomanCartwheelingLightSkinTone"),
  "woman-cartwheeling-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanCartwheelingMediumDarkSkinTone"),
  "woman-cartwheeling-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanCartwheelingMediumLightSkinTone"),
  "woman-cartwheeling-medium-skin-tone": () =>
    import("./emojis/EmojiWomanCartwheelingMediumSkinTone"),
  "woman-climbing": () => import("./emojis/EmojiWomanClimbing"),
  "woman-climbing-dark-skin-tone": () => import("./emojis/EmojiWomanClimbingDarkSkinTone"),
  "woman-climbing-light-skin-tone": () => import("./emojis/EmojiWomanClimbingLightSkinTone"),
  "woman-climbing-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanClimbingMediumDarkSkinTone"),
  "woman-climbing-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanClimbingMediumLightSkinTone"),
  "woman-climbing-medium-skin-tone": () => import("./emojis/EmojiWomanClimbingMediumSkinTone"),
  "woman-climbing-tone1": () => import("./emojis/EmojiWomanClimbingTone1"),
  "woman-climbing-tone2": () => import("./emojis/EmojiWomanClimbingTone2"),
  "woman-climbing-tone3": () => import("./emojis/EmojiWomanClimbingTone3"),
  "woman-climbing-tone4": () => import("./emojis/EmojiWomanClimbingTone4"),
  "woman-climbing-tone5": () => import("./emojis/EmojiWomanClimbingTone5"),
  "woman-construction-worker": () => import("./emojis/EmojiWomanConstructionWorker"),
  "woman-construction-worker-dark-skin-tone": () =>
    import("./emojis/EmojiWomanConstructionWorkerDarkSkinTone"),
  "woman-construction-worker-light-skin-tone": () =>
    import("./emojis/EmojiWomanConstructionWorkerLightSkinTone"),
  "woman-construction-worker-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanConstructionWorkerMediumDarkSkinTone"),
  "woman-construction-worker-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanConstructionWorkerMediumLightSkinTone"),
  "woman-construction-worker-medium-skin-tone": () =>
    import("./emojis/EmojiWomanConstructionWorkerMediumSkinTone"),
  "woman-cook": () => import("./emojis/EmojiWomanCook"),
  "woman-cook-dark-skin-tone": () => import("./emojis/EmojiWomanCookDarkSkinTone"),
  "woman-cook-light-skin-tone": () => import("./emojis/EmojiWomanCookLightSkinTone"),
  "woman-cook-medium-dark-skin-tone": () => import("./emojis/EmojiWomanCookMediumDarkSkinTone"),
  "woman-cook-medium-light-skin-tone": () => import("./emojis/EmojiWomanCookMediumLightSkinTone"),
  "woman-cook-medium-skin-tone": () => import("./emojis/EmojiWomanCookMediumSkinTone"),
  "woman-curly-hair": () => import("./emojis/EmojiWomanCurlyHair"),
  "woman-dancing": () => import("./emojis/EmojiWomanDancing"),
  "woman-dancing-dark-skin-tone": () => import("./emojis/EmojiWomanDancingDarkSkinTone"),
  "woman-dancing-light-skin-tone": () => import("./emojis/EmojiWomanDancingLightSkinTone"),
  "woman-dancing-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanDancingMediumDarkSkinTone"),
  "woman-dancing-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanDancingMediumLightSkinTone"),
  "woman-dancing-medium-skin-tone": () => import("./emojis/EmojiWomanDancingMediumSkinTone"),
  "woman-dark-skin-tone": () => import("./emojis/EmojiWomanDarkSkinTone"),
  "woman-dark-skin-tone-bald": () => import("./emojis/EmojiWomanDarkSkinToneBald"),
  "woman-dark-skin-tone-beard": () => import("./emojis/EmojiWomanDarkSkinToneBeard"),
  "woman-dark-skin-tone-blond-hair": () => import("./emojis/EmojiWomanDarkSkinToneBlondHair"),
  "woman-dark-skin-tone-curly-hair": () => import("./emojis/EmojiWomanDarkSkinToneCurlyHair"),
  "woman-dark-skin-tone-red-hair": () => import("./emojis/EmojiWomanDarkSkinToneRedHair"),
  "woman-dark-skin-tone-white-hair": () => import("./emojis/EmojiWomanDarkSkinToneWhiteHair"),
  "woman-detective": () => import("./emojis/EmojiWomanDetective"),
  "woman-detective-dark-skin-tone": () => import("./emojis/EmojiWomanDetectiveDarkSkinTone"),
  "woman-detective-light-skin-tone": () => import("./emojis/EmojiWomanDetectiveLightSkinTone"),
  "woman-detective-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanDetectiveMediumDarkSkinTone"),
  "woman-detective-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanDetectiveMediumLightSkinTone"),
  "woman-detective-medium-skin-tone": () => import("./emojis/EmojiWomanDetectiveMediumSkinTone"),
  "woman-elf": () => import("./emojis/EmojiWomanElf"),
  "woman-elf-dark-skin-tone": () => import("./emojis/EmojiWomanElfDarkSkinTone"),
  "woman-elf-light-skin-tone": () => import("./emojis/EmojiWomanElfLightSkinTone"),
  "woman-elf-medium-dark-skin-tone": () => import("./emojis/EmojiWomanElfMediumDarkSkinTone"),
  "woman-elf-medium-light-skin-tone": () => import("./emojis/EmojiWomanElfMediumLightSkinTone"),
  "woman-elf-medium-skin-tone": () => import("./emojis/EmojiWomanElfMediumSkinTone"),
  "woman-facepalming": () => import("./emojis/EmojiWomanFacepalming"),
  "woman-facepalming-dark-skin-tone": () => import("./emojis/EmojiWomanFacepalmingDarkSkinTone"),
  "woman-facepalming-light-skin-tone": () => import("./emojis/EmojiWomanFacepalmingLightSkinTone"),
  "woman-facepalming-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanFacepalmingMediumDarkSkinTone"),
  "woman-facepalming-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanFacepalmingMediumLightSkinTone"),
  "woman-facepalming-medium-skin-tone": () =>
    import("./emojis/EmojiWomanFacepalmingMediumSkinTone"),
  "woman-factory-worker": () => import("./emojis/EmojiWomanFactoryWorker"),
  "woman-factory-worker-dark-skin-tone": () =>
    import("./emojis/EmojiWomanFactoryWorkerDarkSkinTone"),
  "woman-factory-worker-light-skin-tone": () =>
    import("./emojis/EmojiWomanFactoryWorkerLightSkinTone"),
  "woman-factory-worker-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanFactoryWorkerMediumDarkSkinTone"),
  "woman-factory-worker-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanFactoryWorkerMediumLightSkinTone"),
  "woman-factory-worker-medium-skin-tone": () =>
    import("./emojis/EmojiWomanFactoryWorkerMediumSkinTone"),
  "woman-fairy": () => import("./emojis/EmojiWomanFairy"),
  "woman-fairy-dark-skin-tone": () => import("./emojis/EmojiWomanFairyDarkSkinTone"),
  "woman-fairy-light-skin-tone": () => import("./emojis/EmojiWomanFairyLightSkinTone"),
  "woman-fairy-medium-dark-skin-tone": () => import("./emojis/EmojiWomanFairyMediumDarkSkinTone"),
  "woman-fairy-medium-light-skin-tone": () => import("./emojis/EmojiWomanFairyMediumLightSkinTone"),
  "woman-fairy-medium-skin-tone": () => import("./emojis/EmojiWomanFairyMediumSkinTone"),
  "woman-farmer": () => import("./emojis/EmojiWomanFarmer"),
  "woman-farmer-dark-skin-tone": () => import("./emojis/EmojiWomanFarmerDarkSkinTone"),
  "woman-farmer-light-skin-tone": () => import("./emojis/EmojiWomanFarmerLightSkinTone"),
  "woman-farmer-medium-dark-skin-tone": () => import("./emojis/EmojiWomanFarmerMediumDarkSkinTone"),
  "woman-farmer-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanFarmerMediumLightSkinTone"),
  "woman-farmer-medium-skin-tone": () => import("./emojis/EmojiWomanFarmerMediumSkinTone"),
  "woman-feeding-baby": () => import("./emojis/EmojiWomanFeedingBaby"),
  "woman-feeding-baby-dark-skin-tone": () => import("./emojis/EmojiWomanFeedingBabyDarkSkinTone"),
  "woman-feeding-baby-light-skin-tone": () => import("./emojis/EmojiWomanFeedingBabyLightSkinTone"),
  "woman-feeding-baby-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanFeedingBabyMediumDarkSkinTone"),
  "woman-feeding-baby-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanFeedingBabyMediumLightSkinTone"),
  "woman-feeding-baby-medium-skin-tone": () =>
    import("./emojis/EmojiWomanFeedingBabyMediumSkinTone"),
  "woman-firefighter": () => import("./emojis/EmojiWomanFirefighter"),
  "woman-firefighter-dark-skin-tone": () => import("./emojis/EmojiWomanFirefighterDarkSkinTone"),
  "woman-firefighter-light-skin-tone": () => import("./emojis/EmojiWomanFirefighterLightSkinTone"),
  "woman-firefighter-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanFirefighterMediumDarkSkinTone"),
  "woman-firefighter-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanFirefighterMediumLightSkinTone"),
  "woman-firefighter-medium-skin-tone": () =>
    import("./emojis/EmojiWomanFirefighterMediumSkinTone"),
  "woman-frowning": () => import("./emojis/EmojiWomanFrowning"),
  "woman-frowning-dark-skin-tone": () => import("./emojis/EmojiWomanFrowningDarkSkinTone"),
  "woman-frowning-light-skin-tone": () => import("./emojis/EmojiWomanFrowningLightSkinTone"),
  "woman-frowning-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanFrowningMediumDarkSkinTone"),
  "woman-frowning-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanFrowningMediumLightSkinTone"),
  "woman-frowning-medium-skin-tone": () => import("./emojis/EmojiWomanFrowningMediumSkinTone"),
  "woman-genie": () => import("./emojis/EmojiWomanGenie"),
  "woman-gesturing-no": () => import("./emojis/EmojiWomanGesturingNo"),
  "woman-gesturing-no-dark-skin-tone": () => import("./emojis/EmojiWomanGesturingNoDarkSkinTone"),
  "woman-gesturing-no-light-skin-tone": () => import("./emojis/EmojiWomanGesturingNoLightSkinTone"),
  "woman-gesturing-no-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanGesturingNoMediumDarkSkinTone"),
  "woman-gesturing-no-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanGesturingNoMediumLightSkinTone"),
  "woman-gesturing-no-medium-skin-tone": () =>
    import("./emojis/EmojiWomanGesturingNoMediumSkinTone"),
  "woman-gesturing-ok": () => import("./emojis/EmojiWomanGesturingOk"),
  "woman-gesturing-ok-dark-skin-tone": () => import("./emojis/EmojiWomanGesturingOkDarkSkinTone"),
  "woman-gesturing-ok-light-skin-tone": () => import("./emojis/EmojiWomanGesturingOkLightSkinTone"),
  "woman-gesturing-ok-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanGesturingOkMediumDarkSkinTone"),
  "woman-gesturing-ok-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanGesturingOkMediumLightSkinTone"),
  "woman-gesturing-ok-medium-skin-tone": () =>
    import("./emojis/EmojiWomanGesturingOkMediumSkinTone"),
  "woman-getting-haircut": () => import("./emojis/EmojiWomanGettingHaircut"),
  "woman-getting-haircut-dark-skin-tone": () =>
    import("./emojis/EmojiWomanGettingHaircutDarkSkinTone"),
  "woman-getting-haircut-light-skin-tone": () =>
    import("./emojis/EmojiWomanGettingHaircutLightSkinTone"),
  "woman-getting-haircut-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanGettingHaircutMediumDarkSkinTone"),
  "woman-getting-haircut-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanGettingHaircutMediumLightSkinTone"),
  "woman-getting-haircut-medium-skin-tone": () =>
    import("./emojis/EmojiWomanGettingHaircutMediumSkinTone"),
  "woman-getting-massage": () => import("./emojis/EmojiWomanGettingMassage"),
  "woman-getting-massage-dark-skin-tone": () =>
    import("./emojis/EmojiWomanGettingMassageDarkSkinTone"),
  "woman-getting-massage-light-skin-tone": () =>
    import("./emojis/EmojiWomanGettingMassageLightSkinTone"),
  "woman-getting-massage-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanGettingMassageMediumDarkSkinTone"),
  "woman-getting-massage-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanGettingMassageMediumLightSkinTone"),
  "woman-getting-massage-medium-skin-tone": () =>
    import("./emojis/EmojiWomanGettingMassageMediumSkinTone"),
  "woman-golfing": () => import("./emojis/EmojiWomanGolfing"),
  "woman-golfing-dark-skin-tone": () => import("./emojis/EmojiWomanGolfingDarkSkinTone"),
  "woman-golfing-light-skin-tone": () => import("./emojis/EmojiWomanGolfingLightSkinTone"),
  "woman-golfing-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanGolfingMediumDarkSkinTone"),
  "woman-golfing-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanGolfingMediumLightSkinTone"),
  "woman-golfing-medium-skin-tone": () => import("./emojis/EmojiWomanGolfingMediumSkinTone"),
  "woman-guard": () => import("./emojis/EmojiWomanGuard"),
  "woman-guard-dark-skin-tone": () => import("./emojis/EmojiWomanGuardDarkSkinTone"),
  "woman-guard-light-skin-tone": () => import("./emojis/EmojiWomanGuardLightSkinTone"),
  "woman-guard-medium-dark-skin-tone": () => import("./emojis/EmojiWomanGuardMediumDarkSkinTone"),
  "woman-guard-medium-light-skin-tone": () => import("./emojis/EmojiWomanGuardMediumLightSkinTone"),
  "woman-guard-medium-skin-tone": () => import("./emojis/EmojiWomanGuardMediumSkinTone"),
  "woman-health-worker": () => import("./emojis/EmojiWomanHealthWorker"),
  "woman-health-worker-dark-skin-tone": () => import("./emojis/EmojiWomanHealthWorkerDarkSkinTone"),
  "woman-health-worker-light-skin-tone": () =>
    import("./emojis/EmojiWomanHealthWorkerLightSkinTone"),
  "woman-health-worker-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanHealthWorkerMediumDarkSkinTone"),
  "woman-health-worker-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanHealthWorkerMediumLightSkinTone"),
  "woman-health-worker-medium-skin-tone": () =>
    import("./emojis/EmojiWomanHealthWorkerMediumSkinTone"),
  "woman-in-lotus-position": () => import("./emojis/EmojiWomanInLotusPosition"),
  "woman-in-lotus-position-dark-skin-tone": () =>
    import("./emojis/EmojiWomanInLotusPositionDarkSkinTone"),
  "woman-in-lotus-position-light-skin-tone": () =>
    import("./emojis/EmojiWomanInLotusPositionLightSkinTone"),
  "woman-in-lotus-position-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanInLotusPositionMediumDarkSkinTone"),
  "woman-in-lotus-position-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanInLotusPositionMediumLightSkinTone"),
  "woman-in-lotus-position-medium-skin-tone": () =>
    import("./emojis/EmojiWomanInLotusPositionMediumSkinTone"),
  "woman-in-manual-wheelchair": () => import("./emojis/EmojiWomanInManualWheelchair"),
  "woman-in-manual-wheelchair-dark-skin-tone": () =>
    import("./emojis/EmojiWomanInManualWheelchairDarkSkinTone"),
  "woman-in-manual-wheelchair-facing-right": () =>
    import("./emojis/EmojiWomanInManualWheelchairFacingRight"),
  "woman-in-manual-wheelchair-facing-right-dark-skin-tone": () =>
    import("./emojis/EmojiWomanInManualWheelchairFacingRightDarkSkinTone"),
  "woman-in-manual-wheelchair-facing-right-light-skin-tone": () =>
    import("./emojis/EmojiWomanInManualWheelchairFacingRightLightSkinTone"),
  "woman-in-manual-wheelchair-facing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanInManualWheelchairFacingRightMediumDarkSkinTone"),
  "woman-in-manual-wheelchair-facing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanInManualWheelchairFacingRightMediumLightSkinTone"),
  "woman-in-manual-wheelchair-facing-right-medium-skin-tone": () =>
    import("./emojis/EmojiWomanInManualWheelchairFacingRightMediumSkinTone"),
  "woman-in-manual-wheelchair-light-skin-tone": () =>
    import("./emojis/EmojiWomanInManualWheelchairLightSkinTone"),
  "woman-in-manual-wheelchair-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanInManualWheelchairMediumDarkSkinTone"),
  "woman-in-manual-wheelchair-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanInManualWheelchairMediumLightSkinTone"),
  "woman-in-manual-wheelchair-medium-skin-tone": () =>
    import("./emojis/EmojiWomanInManualWheelchairMediumSkinTone"),
  "woman-in-motorized-wheelchair": () => import("./emojis/EmojiWomanInMotorizedWheelchair"),
  "woman-in-motorized-wheelchair-dark-skin-tone": () =>
    import("./emojis/EmojiWomanInMotorizedWheelchairDarkSkinTone"),
  "woman-in-motorized-wheelchair-facing-right": () =>
    import("./emojis/EmojiWomanInMotorizedWheelchairFacingRight"),
  "woman-in-motorized-wheelchair-facing-right-dark-skin-tone": () =>
    import("./emojis/EmojiWomanInMotorizedWheelchairFacingRightDarkSkinTone"),
  "woman-in-motorized-wheelchair-facing-right-light-skin-tone": () =>
    import("./emojis/EmojiWomanInMotorizedWheelchairFacingRightLightSkinTone"),
  "woman-in-motorized-wheelchair-facing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanInMotorizedWheelchairFacingRightMediumDarkSkinTone"),
  "woman-in-motorized-wheelchair-facing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanInMotorizedWheelchairFacingRightMediumLightSkinTone"),
  "woman-in-motorized-wheelchair-facing-right-medium-skin-tone": () =>
    import("./emojis/EmojiWomanInMotorizedWheelchairFacingRightMediumSkinTone"),
  "woman-in-motorized-wheelchair-light-skin-tone": () =>
    import("./emojis/EmojiWomanInMotorizedWheelchairLightSkinTone"),
  "woman-in-motorized-wheelchair-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanInMotorizedWheelchairMediumDarkSkinTone"),
  "woman-in-motorized-wheelchair-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanInMotorizedWheelchairMediumLightSkinTone"),
  "woman-in-motorized-wheelchair-medium-skin-tone": () =>
    import("./emojis/EmojiWomanInMotorizedWheelchairMediumSkinTone"),
  "woman-in-steamy-room": () => import("./emojis/EmojiWomanInSteamyRoom"),
  "woman-in-steamy-room-dark-skin-tone": () =>
    import("./emojis/EmojiWomanInSteamyRoomDarkSkinTone"),
  "woman-in-steamy-room-light-skin-tone": () =>
    import("./emojis/EmojiWomanInSteamyRoomLightSkinTone"),
  "woman-in-steamy-room-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanInSteamyRoomMediumDarkSkinTone"),
  "woman-in-steamy-room-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanInSteamyRoomMediumLightSkinTone"),
  "woman-in-steamy-room-medium-skin-tone": () =>
    import("./emojis/EmojiWomanInSteamyRoomMediumSkinTone"),
  "woman-in-tuxedo": () => import("./emojis/EmojiWomanInTuxedo"),
  "woman-in-tuxedo-dark-skin-tone": () => import("./emojis/EmojiWomanInTuxedoDarkSkinTone"),
  "woman-in-tuxedo-light-skin-tone": () => import("./emojis/EmojiWomanInTuxedoLightSkinTone"),
  "woman-in-tuxedo-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanInTuxedoMediumDarkSkinTone"),
  "woman-in-tuxedo-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanInTuxedoMediumLightSkinTone"),
  "woman-in-tuxedo-medium-skin-tone": () => import("./emojis/EmojiWomanInTuxedoMediumSkinTone"),
  "woman-judge": () => import("./emojis/EmojiWomanJudge"),
  "woman-judge-dark-skin-tone": () => import("./emojis/EmojiWomanJudgeDarkSkinTone"),
  "woman-judge-light-skin-tone": () => import("./emojis/EmojiWomanJudgeLightSkinTone"),
  "woman-judge-medium-dark-skin-tone": () => import("./emojis/EmojiWomanJudgeMediumDarkSkinTone"),
  "woman-judge-medium-light-skin-tone": () => import("./emojis/EmojiWomanJudgeMediumLightSkinTone"),
  "woman-judge-medium-skin-tone": () => import("./emojis/EmojiWomanJudgeMediumSkinTone"),
  "woman-juggling": () => import("./emojis/EmojiWomanJuggling"),
  "woman-juggling-dark-skin-tone": () => import("./emojis/EmojiWomanJugglingDarkSkinTone"),
  "woman-juggling-light-skin-tone": () => import("./emojis/EmojiWomanJugglingLightSkinTone"),
  "woman-juggling-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanJugglingMediumDarkSkinTone"),
  "woman-juggling-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanJugglingMediumLightSkinTone"),
  "woman-juggling-medium-skin-tone": () => import("./emojis/EmojiWomanJugglingMediumSkinTone"),
  "woman-kneeling": () => import("./emojis/EmojiWomanKneeling"),
  "woman-kneeling-dark-skin-tone": () => import("./emojis/EmojiWomanKneelingDarkSkinTone"),
  "woman-kneeling-facing-right": () => import("./emojis/EmojiWomanKneelingFacingRight"),
  "woman-kneeling-facing-right-dark-skin-tone": () =>
    import("./emojis/EmojiWomanKneelingFacingRightDarkSkinTone"),
  "woman-kneeling-facing-right-light-skin-tone": () =>
    import("./emojis/EmojiWomanKneelingFacingRightLightSkinTone"),
  "woman-kneeling-facing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanKneelingFacingRightMediumDarkSkinTone"),
  "woman-kneeling-facing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanKneelingFacingRightMediumLightSkinTone"),
  "woman-kneeling-facing-right-medium-skin-tone": () =>
    import("./emojis/EmojiWomanKneelingFacingRightMediumSkinTone"),
  "woman-kneeling-light-skin-tone": () => import("./emojis/EmojiWomanKneelingLightSkinTone"),
  "woman-kneeling-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanKneelingMediumDarkSkinTone"),
  "woman-kneeling-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanKneelingMediumLightSkinTone"),
  "woman-kneeling-medium-skin-tone": () => import("./emojis/EmojiWomanKneelingMediumSkinTone"),
  "woman-lifting-weights": () => import("./emojis/EmojiWomanLiftingWeights"),
  "woman-lifting-weights-dark-skin-tone": () =>
    import("./emojis/EmojiWomanLiftingWeightsDarkSkinTone"),
  "woman-lifting-weights-light-skin-tone": () =>
    import("./emojis/EmojiWomanLiftingWeightsLightSkinTone"),
  "woman-lifting-weights-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanLiftingWeightsMediumDarkSkinTone"),
  "woman-lifting-weights-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanLiftingWeightsMediumLightSkinTone"),
  "woman-lifting-weights-medium-skin-tone": () =>
    import("./emojis/EmojiWomanLiftingWeightsMediumSkinTone"),
  "woman-light-skin-tone": () => import("./emojis/EmojiWomanLightSkinTone"),
  "woman-light-skin-tone-bald": () => import("./emojis/EmojiWomanLightSkinToneBald"),
  "woman-light-skin-tone-beard": () => import("./emojis/EmojiWomanLightSkinToneBeard"),
  "woman-light-skin-tone-blond-hair": () => import("./emojis/EmojiWomanLightSkinToneBlondHair"),
  "woman-light-skin-tone-curly-hair": () => import("./emojis/EmojiWomanLightSkinToneCurlyHair"),
  "woman-light-skin-tone-red-hair": () => import("./emojis/EmojiWomanLightSkinToneRedHair"),
  "woman-light-skin-tone-white-hair": () => import("./emojis/EmojiWomanLightSkinToneWhiteHair"),
  "woman-mage": () => import("./emojis/EmojiWomanMage"),
  "woman-mage-dark-skin-tone": () => import("./emojis/EmojiWomanMageDarkSkinTone"),
  "woman-mage-light-skin-tone": () => import("./emojis/EmojiWomanMageLightSkinTone"),
  "woman-mage-medium-dark-skin-tone": () => import("./emojis/EmojiWomanMageMediumDarkSkinTone"),
  "woman-mage-medium-light-skin-tone": () => import("./emojis/EmojiWomanMageMediumLightSkinTone"),
  "woman-mage-medium-skin-tone": () => import("./emojis/EmojiWomanMageMediumSkinTone"),
  "woman-mage-tone3": () => import("./emojis/EmojiWomanMageTone3"),
  "woman-mechanic": () => import("./emojis/EmojiWomanMechanic"),
  "woman-mechanic-dark-skin-tone": () => import("./emojis/EmojiWomanMechanicDarkSkinTone"),
  "woman-mechanic-light-skin-tone": () => import("./emojis/EmojiWomanMechanicLightSkinTone"),
  "woman-mechanic-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanMechanicMediumDarkSkinTone"),
  "woman-mechanic-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanMechanicMediumLightSkinTone"),
  "woman-mechanic-medium-skin-tone": () => import("./emojis/EmojiWomanMechanicMediumSkinTone"),
  "woman-medium-dark-skin-tone": () => import("./emojis/EmojiWomanMediumDarkSkinTone"),
  "woman-medium-dark-skin-tone-bald": () => import("./emojis/EmojiWomanMediumDarkSkinToneBald"),
  "woman-medium-dark-skin-tone-beard": () => import("./emojis/EmojiWomanMediumDarkSkinToneBeard"),
  "woman-medium-dark-skin-tone-blond-hair": () =>
    import("./emojis/EmojiWomanMediumDarkSkinToneBlondHair"),
  "woman-medium-dark-skin-tone-curly-hair": () =>
    import("./emojis/EmojiWomanMediumDarkSkinToneCurlyHair"),
  "woman-medium-dark-skin-tone-red-hair": () =>
    import("./emojis/EmojiWomanMediumDarkSkinToneRedHair"),
  "woman-medium-dark-skin-tone-white-hair": () =>
    import("./emojis/EmojiWomanMediumDarkSkinToneWhiteHair"),
  "woman-medium-light-skin-tone": () => import("./emojis/EmojiWomanMediumLightSkinTone"),
  "woman-medium-light-skin-tone-bald": () => import("./emojis/EmojiWomanMediumLightSkinToneBald"),
  "woman-medium-light-skin-tone-beard": () => import("./emojis/EmojiWomanMediumLightSkinToneBeard"),
  "woman-medium-light-skin-tone-blond-hair": () =>
    import("./emojis/EmojiWomanMediumLightSkinToneBlondHair"),
  "woman-medium-light-skin-tone-curly-hair": () =>
    import("./emojis/EmojiWomanMediumLightSkinToneCurlyHair"),
  "woman-medium-light-skin-tone-red-hair": () =>
    import("./emojis/EmojiWomanMediumLightSkinToneRedHair"),
  "woman-medium-light-skin-tone-white-hair": () =>
    import("./emojis/EmojiWomanMediumLightSkinToneWhiteHair"),
  "woman-medium-skin-tone": () => import("./emojis/EmojiWomanMediumSkinTone"),
  "woman-medium-skin-tone-bald": () => import("./emojis/EmojiWomanMediumSkinToneBald"),
  "woman-medium-skin-tone-beard": () => import("./emojis/EmojiWomanMediumSkinToneBeard"),
  "woman-medium-skin-tone-blond-hair": () => import("./emojis/EmojiWomanMediumSkinToneBlondHair"),
  "woman-medium-skin-tone-curly-hair": () => import("./emojis/EmojiWomanMediumSkinToneCurlyHair"),
  "woman-medium-skin-tone-red-hair": () => import("./emojis/EmojiWomanMediumSkinToneRedHair"),
  "woman-medium-skin-tone-white-hair": () => import("./emojis/EmojiWomanMediumSkinToneWhiteHair"),
  "woman-mountain-biking": () => import("./emojis/EmojiWomanMountainBiking"),
  "woman-mountain-biking-dark-skin-tone": () =>
    import("./emojis/EmojiWomanMountainBikingDarkSkinTone"),
  "woman-mountain-biking-light-skin-tone": () =>
    import("./emojis/EmojiWomanMountainBikingLightSkinTone"),
  "woman-mountain-biking-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanMountainBikingMediumDarkSkinTone"),
  "woman-mountain-biking-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanMountainBikingMediumLightSkinTone"),
  "woman-mountain-biking-medium-skin-tone": () =>
    import("./emojis/EmojiWomanMountainBikingMediumSkinTone"),
  "woman-office-worker": () => import("./emojis/EmojiWomanOfficeWorker"),
  "woman-office-worker-dark-skin-tone": () => import("./emojis/EmojiWomanOfficeWorkerDarkSkinTone"),
  "woman-office-worker-light-skin-tone": () =>
    import("./emojis/EmojiWomanOfficeWorkerLightSkinTone"),
  "woman-office-worker-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanOfficeWorkerMediumDarkSkinTone"),
  "woman-office-worker-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanOfficeWorkerMediumLightSkinTone"),
  "woman-office-worker-medium-skin-tone": () =>
    import("./emojis/EmojiWomanOfficeWorkerMediumSkinTone"),
  "woman-pilot": () => import("./emojis/EmojiWomanPilot"),
  "woman-pilot-dark-skin-tone": () => import("./emojis/EmojiWomanPilotDarkSkinTone"),
  "woman-pilot-light-skin-tone": () => import("./emojis/EmojiWomanPilotLightSkinTone"),
  "woman-pilot-medium-dark-skin-tone": () => import("./emojis/EmojiWomanPilotMediumDarkSkinTone"),
  "woman-pilot-medium-light-skin-tone": () => import("./emojis/EmojiWomanPilotMediumLightSkinTone"),
  "woman-pilot-medium-skin-tone": () => import("./emojis/EmojiWomanPilotMediumSkinTone"),
  "woman-playing-handball": () => import("./emojis/EmojiWomanPlayingHandball"),
  "woman-playing-handball-dark-skin-tone": () =>
    import("./emojis/EmojiWomanPlayingHandballDarkSkinTone"),
  "woman-playing-handball-light-skin-tone": () =>
    import("./emojis/EmojiWomanPlayingHandballLightSkinTone"),
  "woman-playing-handball-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanPlayingHandballMediumDarkSkinTone"),
  "woman-playing-handball-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanPlayingHandballMediumLightSkinTone"),
  "woman-playing-handball-medium-skin-tone": () =>
    import("./emojis/EmojiWomanPlayingHandballMediumSkinTone"),
  "woman-playing-water-polo": () => import("./emojis/EmojiWomanPlayingWaterPolo"),
  "woman-playing-water-polo-dark-skin-tone": () =>
    import("./emojis/EmojiWomanPlayingWaterPoloDarkSkinTone"),
  "woman-playing-water-polo-light-skin-tone": () =>
    import("./emojis/EmojiWomanPlayingWaterPoloLightSkinTone"),
  "woman-playing-water-polo-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanPlayingWaterPoloMediumDarkSkinTone"),
  "woman-playing-water-polo-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanPlayingWaterPoloMediumLightSkinTone"),
  "woman-playing-water-polo-medium-skin-tone": () =>
    import("./emojis/EmojiWomanPlayingWaterPoloMediumSkinTone"),
  "woman-police-officer": () => import("./emojis/EmojiWomanPoliceOfficer"),
  "woman-police-officer-dark-skin-tone": () =>
    import("./emojis/EmojiWomanPoliceOfficerDarkSkinTone"),
  "woman-police-officer-light-skin-tone": () =>
    import("./emojis/EmojiWomanPoliceOfficerLightSkinTone"),
  "woman-police-officer-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanPoliceOfficerMediumDarkSkinTone"),
  "woman-police-officer-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanPoliceOfficerMediumLightSkinTone"),
  "woman-police-officer-medium-skin-tone": () =>
    import("./emojis/EmojiWomanPoliceOfficerMediumSkinTone"),
  "woman-pouting": () => import("./emojis/EmojiWomanPouting"),
  "woman-pouting-dark-skin-tone": () => import("./emojis/EmojiWomanPoutingDarkSkinTone"),
  "woman-pouting-light-skin-tone": () => import("./emojis/EmojiWomanPoutingLightSkinTone"),
  "woman-pouting-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanPoutingMediumDarkSkinTone"),
  "woman-pouting-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanPoutingMediumLightSkinTone"),
  "woman-pouting-medium-skin-tone": () => import("./emojis/EmojiWomanPoutingMediumSkinTone"),
  "woman-raising-hand": () => import("./emojis/EmojiWomanRaisingHand"),
  "woman-raising-hand-dark-skin-tone": () => import("./emojis/EmojiWomanRaisingHandDarkSkinTone"),
  "woman-raising-hand-light-skin-tone": () => import("./emojis/EmojiWomanRaisingHandLightSkinTone"),
  "woman-raising-hand-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanRaisingHandMediumDarkSkinTone"),
  "woman-raising-hand-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanRaisingHandMediumLightSkinTone"),
  "woman-raising-hand-medium-skin-tone": () =>
    import("./emojis/EmojiWomanRaisingHandMediumSkinTone"),
  "woman-red-hair": () => import("./emojis/EmojiWomanRedHair"),
  "woman-rowing-boat": () => import("./emojis/EmojiWomanRowingBoat"),
  "woman-rowing-boat-dark-skin-tone": () => import("./emojis/EmojiWomanRowingBoatDarkSkinTone"),
  "woman-rowing-boat-light-skin-tone": () => import("./emojis/EmojiWomanRowingBoatLightSkinTone"),
  "woman-rowing-boat-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanRowingBoatMediumDarkSkinTone"),
  "woman-rowing-boat-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanRowingBoatMediumLightSkinTone"),
  "woman-rowing-boat-medium-skin-tone": () => import("./emojis/EmojiWomanRowingBoatMediumSkinTone"),
  "woman-running": () => import("./emojis/EmojiWomanRunning"),
  "woman-running-dark-skin-tone": () => import("./emojis/EmojiWomanRunningDarkSkinTone"),
  "woman-running-facing-right": () => import("./emojis/EmojiWomanRunningFacingRight"),
  "woman-running-facing-right-dark-skin-tone": () =>
    import("./emojis/EmojiWomanRunningFacingRightDarkSkinTone"),
  "woman-running-facing-right-light-skin-tone": () =>
    import("./emojis/EmojiWomanRunningFacingRightLightSkinTone"),
  "woman-running-facing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanRunningFacingRightMediumDarkSkinTone"),
  "woman-running-facing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanRunningFacingRightMediumLightSkinTone"),
  "woman-running-facing-right-medium-skin-tone": () =>
    import("./emojis/EmojiWomanRunningFacingRightMediumSkinTone"),
  "woman-running-light-skin-tone": () => import("./emojis/EmojiWomanRunningLightSkinTone"),
  "woman-running-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanRunningMediumDarkSkinTone"),
  "woman-running-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanRunningMediumLightSkinTone"),
  "woman-running-medium-skin-tone": () => import("./emojis/EmojiWomanRunningMediumSkinTone"),
  "woman-scientist": () => import("./emojis/EmojiWomanScientist"),
  "woman-scientist-dark-skin-tone": () => import("./emojis/EmojiWomanScientistDarkSkinTone"),
  "woman-scientist-light-skin-tone": () => import("./emojis/EmojiWomanScientistLightSkinTone"),
  "woman-scientist-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanScientistMediumDarkSkinTone"),
  "woman-scientist-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanScientistMediumLightSkinTone"),
  "woman-scientist-medium-skin-tone": () => import("./emojis/EmojiWomanScientistMediumSkinTone"),
  "woman-shrugging": () => import("./emojis/EmojiWomanShrugging"),
  "woman-shrugging-dark-skin-tone": () => import("./emojis/EmojiWomanShruggingDarkSkinTone"),
  "woman-shrugging-light-skin-tone": () => import("./emojis/EmojiWomanShruggingLightSkinTone"),
  "woman-shrugging-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanShruggingMediumDarkSkinTone"),
  "woman-shrugging-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanShruggingMediumLightSkinTone"),
  "woman-shrugging-medium-skin-tone": () => import("./emojis/EmojiWomanShruggingMediumSkinTone"),
  "woman-singer": () => import("./emojis/EmojiWomanSinger"),
  "woman-singer-dark-skin-tone": () => import("./emojis/EmojiWomanSingerDarkSkinTone"),
  "woman-singer-light-skin-tone": () => import("./emojis/EmojiWomanSingerLightSkinTone"),
  "woman-singer-medium-dark-skin-tone": () => import("./emojis/EmojiWomanSingerMediumDarkSkinTone"),
  "woman-singer-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanSingerMediumLightSkinTone"),
  "woman-singer-medium-skin-tone": () => import("./emojis/EmojiWomanSingerMediumSkinTone"),
  "woman-standing": () => import("./emojis/EmojiWomanStanding"),
  "woman-standing-dark-skin-tone": () => import("./emojis/EmojiWomanStandingDarkSkinTone"),
  "woman-standing-light-skin-tone": () => import("./emojis/EmojiWomanStandingLightSkinTone"),
  "woman-standing-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanStandingMediumDarkSkinTone"),
  "woman-standing-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanStandingMediumLightSkinTone"),
  "woman-standing-medium-skin-tone": () => import("./emojis/EmojiWomanStandingMediumSkinTone"),
  "woman-student": () => import("./emojis/EmojiWomanStudent"),
  "woman-student-dark-skin-tone": () => import("./emojis/EmojiWomanStudentDarkSkinTone"),
  "woman-student-light-skin-tone": () => import("./emojis/EmojiWomanStudentLightSkinTone"),
  "woman-student-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanStudentMediumDarkSkinTone"),
  "woman-student-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanStudentMediumLightSkinTone"),
  "woman-student-medium-skin-tone": () => import("./emojis/EmojiWomanStudentMediumSkinTone"),
  "woman-superhero": () => import("./emojis/EmojiWomanSuperhero"),
  "woman-superhero-dark-skin-tone": () => import("./emojis/EmojiWomanSuperheroDarkSkinTone"),
  "woman-superhero-light-skin-tone": () => import("./emojis/EmojiWomanSuperheroLightSkinTone"),
  "woman-superhero-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanSuperheroMediumDarkSkinTone"),
  "woman-superhero-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanSuperheroMediumLightSkinTone"),
  "woman-superhero-medium-skin-tone": () => import("./emojis/EmojiWomanSuperheroMediumSkinTone"),
  "woman-supervillain": () => import("./emojis/EmojiWomanSupervillain"),
  "woman-supervillain-dark-skin-tone": () => import("./emojis/EmojiWomanSupervillainDarkSkinTone"),
  "woman-supervillain-light-skin-tone": () =>
    import("./emojis/EmojiWomanSupervillainLightSkinTone"),
  "woman-supervillain-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanSupervillainMediumDarkSkinTone"),
  "woman-supervillain-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanSupervillainMediumLightSkinTone"),
  "woman-supervillain-medium-skin-tone": () =>
    import("./emojis/EmojiWomanSupervillainMediumSkinTone"),
  "woman-surfing": () => import("./emojis/EmojiWomanSurfing"),
  "woman-surfing-dark-skin-tone": () => import("./emojis/EmojiWomanSurfingDarkSkinTone"),
  "woman-surfing-light-skin-tone": () => import("./emojis/EmojiWomanSurfingLightSkinTone"),
  "woman-surfing-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanSurfingMediumDarkSkinTone"),
  "woman-surfing-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanSurfingMediumLightSkinTone"),
  "woman-surfing-medium-skin-tone": () => import("./emojis/EmojiWomanSurfingMediumSkinTone"),
  "woman-swimming": () => import("./emojis/EmojiWomanSwimming"),
  "woman-swimming-dark-skin-tone": () => import("./emojis/EmojiWomanSwimmingDarkSkinTone"),
  "woman-swimming-light-skin-tone": () => import("./emojis/EmojiWomanSwimmingLightSkinTone"),
  "woman-swimming-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanSwimmingMediumDarkSkinTone"),
  "woman-swimming-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanSwimmingMediumLightSkinTone"),
  "woman-swimming-medium-skin-tone": () => import("./emojis/EmojiWomanSwimmingMediumSkinTone"),
  "woman-teacher": () => import("./emojis/EmojiWomanTeacher"),
  "woman-teacher-dark-skin-tone": () => import("./emojis/EmojiWomanTeacherDarkSkinTone"),
  "woman-teacher-light-skin-tone": () => import("./emojis/EmojiWomanTeacherLightSkinTone"),
  "woman-teacher-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanTeacherMediumDarkSkinTone"),
  "woman-teacher-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanTeacherMediumLightSkinTone"),
  "woman-teacher-medium-skin-tone": () => import("./emojis/EmojiWomanTeacherMediumSkinTone"),
  "woman-technologist": () => import("./emojis/EmojiWomanTechnologist"),
  "woman-technologist-dark-skin-tone": () => import("./emojis/EmojiWomanTechnologistDarkSkinTone"),
  "woman-technologist-light-skin-tone": () =>
    import("./emojis/EmojiWomanTechnologistLightSkinTone"),
  "woman-technologist-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanTechnologistMediumDarkSkinTone"),
  "woman-technologist-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanTechnologistMediumLightSkinTone"),
  "woman-technologist-medium-skin-tone": () =>
    import("./emojis/EmojiWomanTechnologistMediumSkinTone"),
  "woman-tipping-hand": () => import("./emojis/EmojiWomanTippingHand"),
  "woman-tipping-hand-dark-skin-tone": () => import("./emojis/EmojiWomanTippingHandDarkSkinTone"),
  "woman-tipping-hand-light-skin-tone": () => import("./emojis/EmojiWomanTippingHandLightSkinTone"),
  "woman-tipping-hand-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanTippingHandMediumDarkSkinTone"),
  "woman-tipping-hand-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanTippingHandMediumLightSkinTone"),
  "woman-tipping-hand-medium-skin-tone": () =>
    import("./emojis/EmojiWomanTippingHandMediumSkinTone"),
  "woman-vampire": () => import("./emojis/EmojiWomanVampire"),
  "woman-vampire-dark-skin-tone": () => import("./emojis/EmojiWomanVampireDarkSkinTone"),
  "woman-vampire-light-skin-tone": () => import("./emojis/EmojiWomanVampireLightSkinTone"),
  "woman-vampire-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanVampireMediumDarkSkinTone"),
  "woman-vampire-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanVampireMediumLightSkinTone"),
  "woman-vampire-medium-skin-tone": () => import("./emojis/EmojiWomanVampireMediumSkinTone"),
  "woman-walking": () => import("./emojis/EmojiWomanWalking"),
  "woman-walking-dark-skin-tone": () => import("./emojis/EmojiWomanWalkingDarkSkinTone"),
  "woman-walking-facing-right": () => import("./emojis/EmojiWomanWalkingFacingRight"),
  "woman-walking-facing-right-dark-skin-tone": () =>
    import("./emojis/EmojiWomanWalkingFacingRightDarkSkinTone"),
  "woman-walking-facing-right-light-skin-tone": () =>
    import("./emojis/EmojiWomanWalkingFacingRightLightSkinTone"),
  "woman-walking-facing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanWalkingFacingRightMediumDarkSkinTone"),
  "woman-walking-facing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanWalkingFacingRightMediumLightSkinTone"),
  "woman-walking-facing-right-medium-skin-tone": () =>
    import("./emojis/EmojiWomanWalkingFacingRightMediumSkinTone"),
  "woman-walking-light-skin-tone": () => import("./emojis/EmojiWomanWalkingLightSkinTone"),
  "woman-walking-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanWalkingMediumDarkSkinTone"),
  "woman-walking-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanWalkingMediumLightSkinTone"),
  "woman-walking-medium-skin-tone": () => import("./emojis/EmojiWomanWalkingMediumSkinTone"),
  "woman-wearing-turban": () => import("./emojis/EmojiWomanWearingTurban"),
  "woman-wearing-turban-dark-skin-tone": () =>
    import("./emojis/EmojiWomanWearingTurbanDarkSkinTone"),
  "woman-wearing-turban-light-skin-tone": () =>
    import("./emojis/EmojiWomanWearingTurbanLightSkinTone"),
  "woman-wearing-turban-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanWearingTurbanMediumDarkSkinTone"),
  "woman-wearing-turban-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanWearingTurbanMediumLightSkinTone"),
  "woman-wearing-turban-medium-skin-tone": () =>
    import("./emojis/EmojiWomanWearingTurbanMediumSkinTone"),
  "woman-white-hair": () => import("./emojis/EmojiWomanWhiteHair"),
  "woman-with-headscarf": () => import("./emojis/EmojiWomanWithHeadscarf"),
  "woman-with-headscarf-dark-skin-tone": () =>
    import("./emojis/EmojiWomanWithHeadscarfDarkSkinTone"),
  "woman-with-headscarf-light-skin-tone": () =>
    import("./emojis/EmojiWomanWithHeadscarfLightSkinTone"),
  "woman-with-headscarf-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanWithHeadscarfMediumDarkSkinTone"),
  "woman-with-headscarf-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanWithHeadscarfMediumLightSkinTone"),
  "woman-with-headscarf-medium-skin-tone": () =>
    import("./emojis/EmojiWomanWithHeadscarfMediumSkinTone"),
  "woman-with-veil": () => import("./emojis/EmojiWomanWithVeil"),
  "woman-with-veil-dark-skin-tone": () => import("./emojis/EmojiWomanWithVeilDarkSkinTone"),
  "woman-with-veil-light-skin-tone": () => import("./emojis/EmojiWomanWithVeilLightSkinTone"),
  "woman-with-veil-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanWithVeilMediumDarkSkinTone"),
  "woman-with-veil-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanWithVeilMediumLightSkinTone"),
  "woman-with-veil-medium-skin-tone": () => import("./emojis/EmojiWomanWithVeilMediumSkinTone"),
  "woman-with-white-cane": () => import("./emojis/EmojiWomanWithWhiteCane"),
  "woman-with-white-cane-dark-skin-tone": () =>
    import("./emojis/EmojiWomanWithWhiteCaneDarkSkinTone"),
  "woman-with-white-cane-facing-right": () => import("./emojis/EmojiWomanWithWhiteCaneFacingRight"),
  "woman-with-white-cane-facing-right-dark-skin-tone": () =>
    import("./emojis/EmojiWomanWithWhiteCaneFacingRightDarkSkinTone"),
  "woman-with-white-cane-facing-right-light-skin-tone": () =>
    import("./emojis/EmojiWomanWithWhiteCaneFacingRightLightSkinTone"),
  "woman-with-white-cane-facing-right-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanWithWhiteCaneFacingRightMediumDarkSkinTone"),
  "woman-with-white-cane-facing-right-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanWithWhiteCaneFacingRightMediumLightSkinTone"),
  "woman-with-white-cane-facing-right-medium-skin-tone": () =>
    import("./emojis/EmojiWomanWithWhiteCaneFacingRightMediumSkinTone"),
  "woman-with-white-cane-light-skin-tone": () =>
    import("./emojis/EmojiWomanWithWhiteCaneLightSkinTone"),
  "woman-with-white-cane-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomanWithWhiteCaneMediumDarkSkinTone"),
  "woman-with-white-cane-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomanWithWhiteCaneMediumLightSkinTone"),
  "woman-with-white-cane-medium-skin-tone": () =>
    import("./emojis/EmojiWomanWithWhiteCaneMediumSkinTone"),
  "woman-zombie": () => import("./emojis/EmojiWomanZombie"),
  "womans-boot": () => import("./emojis/EmojiWomansBoot"),
  "womans-clothes": () => import("./emojis/EmojiWomansClothes"),
  "womans-hat": () => import("./emojis/EmojiWomansHat"),
  "womans-sandal": () => import("./emojis/EmojiWomansSandal"),
  "women-holding-hands": () => import("./emojis/EmojiWomenHoldingHands"),
  "women-holding-hands-dark-skin-tone": () => import("./emojis/EmojiWomenHoldingHandsDarkSkinTone"),
  "women-holding-hands-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsDarkSkinToneLightSkinTone"),
  "women-holding-hands-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsDarkSkinToneMediumDarkSkinTone"),
  "women-holding-hands-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsDarkSkinToneMediumLightSkinTone"),
  "women-holding-hands-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsDarkSkinToneMediumSkinTone"),
  "women-holding-hands-light-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsLightSkinTone"),
  "women-holding-hands-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsLightSkinToneDarkSkinTone"),
  "women-holding-hands-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsLightSkinToneMediumDarkSkinTone"),
  "women-holding-hands-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsLightSkinToneMediumLightSkinTone"),
  "women-holding-hands-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsLightSkinToneMediumSkinTone"),
  "women-holding-hands-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsMediumDarkSkinTone"),
  "women-holding-hands-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsMediumDarkSkinToneDarkSkinTone"),
  "women-holding-hands-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsMediumDarkSkinToneLightSkinTone"),
  "women-holding-hands-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsMediumDarkSkinToneMediumLightSkinTone"),
  "women-holding-hands-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsMediumDarkSkinToneMediumSkinTone"),
  "women-holding-hands-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsMediumLightSkinTone"),
  "women-holding-hands-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsMediumLightSkinToneDarkSkinTone"),
  "women-holding-hands-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsMediumLightSkinToneLightSkinTone"),
  "women-holding-hands-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsMediumLightSkinToneMediumDarkSkinTone"),
  "women-holding-hands-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsMediumLightSkinToneMediumSkinTone"),
  "women-holding-hands-medium-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsMediumSkinTone"),
  "women-holding-hands-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsMediumSkinToneDarkSkinTone"),
  "women-holding-hands-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsMediumSkinToneLightSkinTone"),
  "women-holding-hands-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsMediumSkinToneMediumDarkSkinTone"),
  "women-holding-hands-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomenHoldingHandsMediumSkinToneMediumLightSkinTone"),
  "women-with-bunny-ears": () => import("./emojis/EmojiWomenWithBunnyEars"),
  "women-with-bunny-ears-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsDarkSkinTone"),
  "women-with-bunny-ears-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsDarkSkinToneLightSkinTone"),
  "women-with-bunny-ears-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsDarkSkinToneMediumDarkSkinTone"),
  "women-with-bunny-ears-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsDarkSkinToneMediumLightSkinTone"),
  "women-with-bunny-ears-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsDarkSkinToneMediumSkinTone"),
  "women-with-bunny-ears-light-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsLightSkinTone"),
  "women-with-bunny-ears-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsLightSkinToneDarkSkinTone"),
  "women-with-bunny-ears-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsLightSkinToneMediumDarkSkinTone"),
  "women-with-bunny-ears-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsLightSkinToneMediumLightSkinTone"),
  "women-with-bunny-ears-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsLightSkinToneMediumSkinTone"),
  "women-with-bunny-ears-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsMediumDarkSkinTone"),
  "women-with-bunny-ears-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsMediumDarkSkinToneDarkSkinTone"),
  "women-with-bunny-ears-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsMediumDarkSkinToneLightSkinTone"),
  "women-with-bunny-ears-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsMediumDarkSkinToneMediumLightSkinTone"),
  "women-with-bunny-ears-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsMediumDarkSkinToneMediumSkinTone"),
  "women-with-bunny-ears-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsMediumLightSkinTone"),
  "women-with-bunny-ears-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsMediumLightSkinToneDarkSkinTone"),
  "women-with-bunny-ears-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsMediumLightSkinToneLightSkinTone"),
  "women-with-bunny-ears-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsMediumLightSkinToneMediumDarkSkinTone"),
  "women-with-bunny-ears-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsMediumLightSkinToneMediumSkinTone"),
  "women-with-bunny-ears-medium-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsMediumSkinTone"),
  "women-with-bunny-ears-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsMediumSkinToneDarkSkinTone"),
  "women-with-bunny-ears-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsMediumSkinToneLightSkinTone"),
  "women-with-bunny-ears-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsMediumSkinToneMediumDarkSkinTone"),
  "women-with-bunny-ears-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomenWithBunnyEarsMediumSkinToneMediumLightSkinTone"),
  "women-wrestling": () => import("./emojis/EmojiWomenWrestling"),
  "women-wrestling-dark-skin-tone": () => import("./emojis/EmojiWomenWrestlingDarkSkinTone"),
  "women-wrestling-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingDarkSkinToneLightSkinTone"),
  "women-wrestling-dark-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingDarkSkinToneMediumDarkSkinTone"),
  "women-wrestling-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingDarkSkinToneMediumLightSkinTone"),
  "women-wrestling-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingDarkSkinToneMediumSkinTone"),
  "women-wrestling-light-skin-tone": () => import("./emojis/EmojiWomenWrestlingLightSkinTone"),
  "women-wrestling-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingLightSkinToneDarkSkinTone"),
  "women-wrestling-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingLightSkinToneMediumDarkSkinTone"),
  "women-wrestling-light-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingLightSkinToneMediumLightSkinTone"),
  "women-wrestling-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingLightSkinToneMediumSkinTone"),
  "women-wrestling-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingMediumDarkSkinTone"),
  "women-wrestling-medium-dark-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingMediumDarkSkinToneDarkSkinTone"),
  "women-wrestling-medium-dark-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingMediumDarkSkinToneLightSkinTone"),
  "women-wrestling-medium-dark-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingMediumDarkSkinToneMediumLightSkinTone"),
  "women-wrestling-medium-dark-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingMediumDarkSkinToneMediumSkinTone"),
  "women-wrestling-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingMediumLightSkinTone"),
  "women-wrestling-medium-light-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingMediumLightSkinToneDarkSkinTone"),
  "women-wrestling-medium-light-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingMediumLightSkinToneLightSkinTone"),
  "women-wrestling-medium-light-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingMediumLightSkinToneMediumDarkSkinTone"),
  "women-wrestling-medium-light-skin-tone-medium-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingMediumLightSkinToneMediumSkinTone"),
  "women-wrestling-medium-skin-tone": () => import("./emojis/EmojiWomenWrestlingMediumSkinTone"),
  "women-wrestling-medium-skin-tone-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingMediumSkinToneDarkSkinTone"),
  "women-wrestling-medium-skin-tone-light-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingMediumSkinToneLightSkinTone"),
  "women-wrestling-medium-skin-tone-medium-dark-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingMediumSkinToneMediumDarkSkinTone"),
  "women-wrestling-medium-skin-tone-medium-light-skin-tone": () =>
    import("./emojis/EmojiWomenWrestlingMediumSkinToneMediumLightSkinTone"),
  "womens-room": () => import("./emojis/EmojiWomensRoom"),
  wood: () => import("./emojis/EmojiWood"),
  "woozy-face": () => import("./emojis/EmojiWoozyFace"),
  "world-map": () => import("./emojis/EmojiWorldMap"),
  worm: () => import("./emojis/EmojiWorm"),
  "worried-face": () => import("./emojis/EmojiWorriedFace"),
  "wrapped-gift": () => import("./emojis/EmojiWrappedGift"),
  wrench: () => import("./emojis/EmojiWrench"),
  "writing-hand": () => import("./emojis/EmojiWritingHand"),
  "writing-hand-dark-skin-tone": () => import("./emojis/EmojiWritingHandDarkSkinTone"),
  "writing-hand-light-skin-tone": () => import("./emojis/EmojiWritingHandLightSkinTone"),
  "writing-hand-medium-dark-skin-tone": () => import("./emojis/EmojiWritingHandMediumDarkSkinTone"),
  "writing-hand-medium-light-skin-tone": () =>
    import("./emojis/EmojiWritingHandMediumLightSkinTone"),
  "writing-hand-medium-skin-tone": () => import("./emojis/EmojiWritingHandMediumSkinTone"),
  "x-ray": () => import("./emojis/EmojiXRay"),
  yarn: () => import("./emojis/EmojiYarn"),
  "yawning-face": () => import("./emojis/EmojiYawningFace"),
  "yellow-circle": () => import("./emojis/EmojiYellowCircle"),
  "yellow-heart": () => import("./emojis/EmojiYellowHeart"),
  "yellow-square": () => import("./emojis/EmojiYellowSquare"),
  "yen-banknote": () => import("./emojis/EmojiYenBanknote"),
  "yin-yang": () => import("./emojis/EmojiYinYang"),
  "yo-yo": () => import("./emojis/EmojiYoYo"),
  "zany-face": () => import("./emojis/EmojiZanyFace"),
  zebra: () => import("./emojis/EmojiZebra"),
  "zipper-mouth-face": () => import("./emojis/EmojiZipperMouthFace"),
  zombie: () => import("./emojis/EmojiZombie"),
  zzz: () => import("./emojis/EmojiZzz"),
} satisfies Record<string, EmojiLoader>;

export type EmojiName = keyof typeof emojiRegistry;
