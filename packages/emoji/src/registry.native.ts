import type { EmojiComponent } from "./types";

type EmojiLoader = () => EmojiComponent;

/**
 * Native registry. Mirrors `registry.ts` but resolves each emoji with a
 * synchronous `require` instead of `import()`. On React Native every emoji is
 * already in the Metro bundle, so the dynamic `Emoji` component can render
 * without a Suspense boundary. The `require` sits inside the thunk, so each
 * module is still only evaluated the first time its emoji is used.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
export const emojiRegistry = {
  "0": () => require("./emojis/Emoji0").default,
  "1": () => require("./emojis/Emoji1").default,
  "1st-place-medal": () => require("./emojis/Emoji1stPlaceMedal").default,
  "2": () => require("./emojis/Emoji2").default,
  "2nd-place-medal": () => require("./emojis/Emoji2ndPlaceMedal").default,
  "3": () => require("./emojis/Emoji3").default,
  "3rd-place-medal": () => require("./emojis/Emoji3rdPlaceMedal").default,
  "4": () => require("./emojis/Emoji4").default,
  "5": () => require("./emojis/Emoji5").default,
  "6": () => require("./emojis/Emoji6").default,
  "7": () => require("./emojis/Emoji7").default,
  "8": () => require("./emojis/Emoji8").default,
  "9": () => require("./emojis/Emoji9").default,
  "a-button-blood-type": () => require("./emojis/EmojiAButtonBloodType").default,
  "ab-button-blood-type": () => require("./emojis/EmojiAbButtonBloodType").default,
  abacus: () => require("./emojis/EmojiAbacus").default,
  accordion: () => require("./emojis/EmojiAccordion").default,
  "adhesive-bandage": () => require("./emojis/EmojiAdhesiveBandage").default,
  "admission-tickets": () => require("./emojis/EmojiAdmissionTickets").default,
  "aerial-tramway": () => require("./emojis/EmojiAerialTramway").default,
  airplane: () => require("./emojis/EmojiAirplane").default,
  "airplane-arrival": () => require("./emojis/EmojiAirplaneArrival").default,
  "airplane-departure": () => require("./emojis/EmojiAirplaneDeparture").default,
  "alarm-clock": () => require("./emojis/EmojiAlarmClock").default,
  alembic: () => require("./emojis/EmojiAlembic").default,
  alien: () => require("./emojis/EmojiAlien").default,
  "alien-monster": () => require("./emojis/EmojiAlienMonster").default,
  ambulance: () => require("./emojis/EmojiAmbulance").default,
  "american-football": () => require("./emojis/EmojiAmericanFootball").default,
  amphora: () => require("./emojis/EmojiAmphora").default,
  "anatomical-heart": () => require("./emojis/EmojiAnatomicalHeart").default,
  anchor: () => require("./emojis/EmojiAnchor").default,
  "anger-symbol": () => require("./emojis/EmojiAngerSymbol").default,
  "angry-face": () => require("./emojis/EmojiAngryFace").default,
  "angry-face-with-horns": () => require("./emojis/EmojiAngryFaceWithHorns").default,
  "anguished-face": () => require("./emojis/EmojiAnguishedFace").default,
  ant: () => require("./emojis/EmojiAnt").default,
  "antenna-bars": () => require("./emojis/EmojiAntennaBars").default,
  "anxious-face-with-sweat": () => require("./emojis/EmojiAnxiousFaceWithSweat").default,
  aquarius: () => require("./emojis/EmojiAquarius").default,
  aries: () => require("./emojis/EmojiAries").default,
  "articulated-lorry": () => require("./emojis/EmojiArticulatedLorry").default,
  artist: () => require("./emojis/EmojiArtist").default,
  "artist-dark-skin-tone": () => require("./emojis/EmojiArtistDarkSkinTone").default,
  "artist-light-skin-tone": () => require("./emojis/EmojiArtistLightSkinTone").default,
  "artist-medium-dark-skin-tone": () => require("./emojis/EmojiArtistMediumDarkSkinTone").default,
  "artist-medium-light-skin-tone": () => require("./emojis/EmojiArtistMediumLightSkinTone").default,
  "artist-medium-skin-tone": () => require("./emojis/EmojiArtistMediumSkinTone").default,
  "artist-palette": () => require("./emojis/EmojiArtistPalette").default,
  asterisk: () => require("./emojis/EmojiAsterisk").default,
  "astonished-face": () => require("./emojis/EmojiAstonishedFace").default,
  astronaut: () => require("./emojis/EmojiAstronaut").default,
  "astronaut-dark-skin-tone": () => require("./emojis/EmojiAstronautDarkSkinTone").default,
  "astronaut-light-skin-tone": () => require("./emojis/EmojiAstronautLightSkinTone").default,
  "astronaut-medium-dark-skin-tone": () =>
    require("./emojis/EmojiAstronautMediumDarkSkinTone").default,
  "astronaut-medium-light-skin-tone": () =>
    require("./emojis/EmojiAstronautMediumLightSkinTone").default,
  "astronaut-medium-skin-tone": () => require("./emojis/EmojiAstronautMediumSkinTone").default,
  "atm-sign": () => require("./emojis/EmojiAtmSign").default,
  "atom-symbol": () => require("./emojis/EmojiAtomSymbol").default,
  "auto-rickshaw": () => require("./emojis/EmojiAutoRickshaw").default,
  automobile: () => require("./emojis/EmojiAutomobile").default,
  avocado: () => require("./emojis/EmojiAvocado").default,
  axe: () => require("./emojis/EmojiAxe").default,
  "b-button-blood-type": () => require("./emojis/EmojiBButtonBloodType").default,
  baby: () => require("./emojis/EmojiBaby").default,
  "baby-angel": () => require("./emojis/EmojiBabyAngel").default,
  "baby-angel-dark-skin-tone": () => require("./emojis/EmojiBabyAngelDarkSkinTone").default,
  "baby-angel-light-skin-tone": () => require("./emojis/EmojiBabyAngelLightSkinTone").default,
  "baby-angel-medium-dark-skin-tone": () =>
    require("./emojis/EmojiBabyAngelMediumDarkSkinTone").default,
  "baby-angel-medium-light-skin-tone": () =>
    require("./emojis/EmojiBabyAngelMediumLightSkinTone").default,
  "baby-angel-medium-skin-tone": () => require("./emojis/EmojiBabyAngelMediumSkinTone").default,
  "baby-bottle": () => require("./emojis/EmojiBabyBottle").default,
  "baby-chick": () => require("./emojis/EmojiBabyChick").default,
  "baby-dark-skin-tone": () => require("./emojis/EmojiBabyDarkSkinTone").default,
  "baby-light-skin-tone": () => require("./emojis/EmojiBabyLightSkinTone").default,
  "baby-medium-dark-skin-tone": () => require("./emojis/EmojiBabyMediumDarkSkinTone").default,
  "baby-medium-light-skin-tone": () => require("./emojis/EmojiBabyMediumLightSkinTone").default,
  "baby-medium-skin-tone": () => require("./emojis/EmojiBabyMediumSkinTone").default,
  "baby-symbol": () => require("./emojis/EmojiBabySymbol").default,
  "back-arrow": () => require("./emojis/EmojiBackArrow").default,
  "backhand-index-pointing-down": () => require("./emojis/EmojiBackhandIndexPointingDown").default,
  "backhand-index-pointing-down-dark-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingDownDarkSkinTone").default,
  "backhand-index-pointing-down-light-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingDownLightSkinTone").default,
  "backhand-index-pointing-down-medium-dark-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingDownMediumDarkSkinTone").default,
  "backhand-index-pointing-down-medium-light-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingDownMediumLightSkinTone").default,
  "backhand-index-pointing-down-medium-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingDownMediumSkinTone").default,
  "backhand-index-pointing-left": () => require("./emojis/EmojiBackhandIndexPointingLeft").default,
  "backhand-index-pointing-left-dark-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingLeftDarkSkinTone").default,
  "backhand-index-pointing-left-light-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingLeftLightSkinTone").default,
  "backhand-index-pointing-left-medium-dark-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingLeftMediumDarkSkinTone").default,
  "backhand-index-pointing-left-medium-light-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingLeftMediumLightSkinTone").default,
  "backhand-index-pointing-left-medium-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingLeftMediumSkinTone").default,
  "backhand-index-pointing-right": () =>
    require("./emojis/EmojiBackhandIndexPointingRight").default,
  "backhand-index-pointing-right-dark-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingRightDarkSkinTone").default,
  "backhand-index-pointing-right-light-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingRightLightSkinTone").default,
  "backhand-index-pointing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingRightMediumDarkSkinTone").default,
  "backhand-index-pointing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingRightMediumLightSkinTone").default,
  "backhand-index-pointing-right-medium-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingRightMediumSkinTone").default,
  "backhand-index-pointing-up": () => require("./emojis/EmojiBackhandIndexPointingUp").default,
  "backhand-index-pointing-up-dark-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingUpDarkSkinTone").default,
  "backhand-index-pointing-up-light-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingUpLightSkinTone").default,
  "backhand-index-pointing-up-medium-dark-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingUpMediumDarkSkinTone").default,
  "backhand-index-pointing-up-medium-light-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingUpMediumLightSkinTone").default,
  "backhand-index-pointing-up-medium-skin-tone": () =>
    require("./emojis/EmojiBackhandIndexPointingUpMediumSkinTone").default,
  backpack: () => require("./emojis/EmojiBackpack").default,
  bacon: () => require("./emojis/EmojiBacon").default,
  badger: () => require("./emojis/EmojiBadger").default,
  badminton: () => require("./emojis/EmojiBadminton").default,
  bagel: () => require("./emojis/EmojiBagel").default,
  "baggage-claim": () => require("./emojis/EmojiBaggageClaim").default,
  "baguette-bread": () => require("./emojis/EmojiBaguetteBread").default,
  "balance-scale": () => require("./emojis/EmojiBalanceScale").default,
  bald: () => require("./emojis/EmojiBald").default,
  "ballet-dancer": () => require("./emojis/EmojiBalletDancer").default,
  "ballet-dancer-dark-skin-tone": () => require("./emojis/EmojiBalletDancerDarkSkinTone").default,
  "ballet-dancer-light-skin-tone": () => require("./emojis/EmojiBalletDancerLightSkinTone").default,
  "ballet-dancer-medium-dark-skin-tone": () =>
    require("./emojis/EmojiBalletDancerMediumDarkSkinTone").default,
  "ballet-dancer-medium-light-skin-tone": () =>
    require("./emojis/EmojiBalletDancerMediumLightSkinTone").default,
  "ballet-dancer-medium-skin-tone": () =>
    require("./emojis/EmojiBalletDancerMediumSkinTone").default,
  "ballet-shoes": () => require("./emojis/EmojiBalletShoes").default,
  balloon: () => require("./emojis/EmojiBalloon").default,
  "ballot-box-with-ballot": () => require("./emojis/EmojiBallotBoxWithBallot").default,
  banana: () => require("./emojis/EmojiBanana").default,
  banjo: () => require("./emojis/EmojiBanjo").default,
  bank: () => require("./emojis/EmojiBank").default,
  "bar-chart": () => require("./emojis/EmojiBarChart").default,
  "barber-pole": () => require("./emojis/EmojiBarberPole").default,
  baseball: () => require("./emojis/EmojiBaseball").default,
  basket: () => require("./emojis/EmojiBasket").default,
  basketball: () => require("./emojis/EmojiBasketball").default,
  bat: () => require("./emojis/EmojiBat").default,
  bathtub: () => require("./emojis/EmojiBathtub").default,
  battery: () => require("./emojis/EmojiBattery").default,
  "beach-with-umbrella": () => require("./emojis/EmojiBeachWithUmbrella").default,
  "beaming-face-with-smiling-eyes": () =>
    require("./emojis/EmojiBeamingFaceWithSmilingEyes").default,
  beans: () => require("./emojis/EmojiBeans").default,
  bear: () => require("./emojis/EmojiBear").default,
  "beating-heart": () => require("./emojis/EmojiBeatingHeart").default,
  beaver: () => require("./emojis/EmojiBeaver").default,
  bed: () => require("./emojis/EmojiBed").default,
  "beer-mug": () => require("./emojis/EmojiBeerMug").default,
  beetle: () => require("./emojis/EmojiBeetle").default,
  bell: () => require("./emojis/EmojiBell").default,
  "bell-pepper": () => require("./emojis/EmojiBellPepper").default,
  "bell-with-slash": () => require("./emojis/EmojiBellWithSlash").default,
  "bellhop-bell": () => require("./emojis/EmojiBellhopBell").default,
  "bento-box": () => require("./emojis/EmojiBentoBox").default,
  "beverage-box": () => require("./emojis/EmojiBeverageBox").default,
  bicycle: () => require("./emojis/EmojiBicycle").default,
  bikini: () => require("./emojis/EmojiBikini").default,
  "billed-cap": () => require("./emojis/EmojiBilledCap").default,
  biohazard: () => require("./emojis/EmojiBiohazard").default,
  bird: () => require("./emojis/EmojiBird").default,
  "birthday-cake": () => require("./emojis/EmojiBirthdayCake").default,
  bison: () => require("./emojis/EmojiBison").default,
  "biting-lip": () => require("./emojis/EmojiBitingLip").default,
  "black-bird": () => require("./emojis/EmojiBlackBird").default,
  "black-cat": () => require("./emojis/EmojiBlackCat").default,
  "black-circle": () => require("./emojis/EmojiBlackCircle").default,
  "black-flag": () => require("./emojis/EmojiBlackFlag").default,
  "black-heart": () => require("./emojis/EmojiBlackHeart").default,
  "black-large-square": () => require("./emojis/EmojiBlackLargeSquare").default,
  "black-medium-small-square": () => require("./emojis/EmojiBlackMediumSmallSquare").default,
  "black-medium-square": () => require("./emojis/EmojiBlackMediumSquare").default,
  "black-nib": () => require("./emojis/EmojiBlackNib").default,
  "black-small-square": () => require("./emojis/EmojiBlackSmallSquare").default,
  "black-square-button": () => require("./emojis/EmojiBlackSquareButton").default,
  blossom: () => require("./emojis/EmojiBlossom").default,
  blowfish: () => require("./emojis/EmojiBlowfish").default,
  "blue-book": () => require("./emojis/EmojiBlueBook").default,
  "blue-circle": () => require("./emojis/EmojiBlueCircle").default,
  "blue-heart": () => require("./emojis/EmojiBlueHeart").default,
  "blue-square": () => require("./emojis/EmojiBlueSquare").default,
  blueberries: () => require("./emojis/EmojiBlueberries").default,
  boar: () => require("./emojis/EmojiBoar").default,
  bomb: () => require("./emojis/EmojiBomb").default,
  bone: () => require("./emojis/EmojiBone").default,
  bookmark: () => require("./emojis/EmojiBookmark").default,
  "bookmark-tabs": () => require("./emojis/EmojiBookmarkTabs").default,
  books: () => require("./emojis/EmojiBooks").default,
  boomerang: () => require("./emojis/EmojiBoomerang").default,
  "bottle-with-popping-cork": () => require("./emojis/EmojiBottleWithPoppingCork").default,
  bouquet: () => require("./emojis/EmojiBouquet").default,
  "bow-and-arrow": () => require("./emojis/EmojiBowAndArrow").default,
  "bowl-with-spoon": () => require("./emojis/EmojiBowlWithSpoon").default,
  bowling: () => require("./emojis/EmojiBowling").default,
  "boxing-glove": () => require("./emojis/EmojiBoxingGlove").default,
  boy: () => require("./emojis/EmojiBoy").default,
  "boy-dark-skin-tone": () => require("./emojis/EmojiBoyDarkSkinTone").default,
  "boy-light-skin-tone": () => require("./emojis/EmojiBoyLightSkinTone").default,
  "boy-medium-dark-skin-tone": () => require("./emojis/EmojiBoyMediumDarkSkinTone").default,
  "boy-medium-light-skin-tone": () => require("./emojis/EmojiBoyMediumLightSkinTone").default,
  "boy-medium-skin-tone": () => require("./emojis/EmojiBoyMediumSkinTone").default,
  brain: () => require("./emojis/EmojiBrain").default,
  bread: () => require("./emojis/EmojiBread").default,
  "breast-feeding": () => require("./emojis/EmojiBreastFeeding").default,
  "breast-feeding-dark-skin-tone": () => require("./emojis/EmojiBreastFeedingDarkSkinTone").default,
  "breast-feeding-light-skin-tone": () =>
    require("./emojis/EmojiBreastFeedingLightSkinTone").default,
  "breast-feeding-medium-dark-skin-tone": () =>
    require("./emojis/EmojiBreastFeedingMediumDarkSkinTone").default,
  "breast-feeding-medium-light-skin-tone": () =>
    require("./emojis/EmojiBreastFeedingMediumLightSkinTone").default,
  "breast-feeding-medium-skin-tone": () =>
    require("./emojis/EmojiBreastFeedingMediumSkinTone").default,
  "breast-feeding-tone1": () => require("./emojis/EmojiBreastFeedingTone1").default,
  "breast-feeding-tone2": () => require("./emojis/EmojiBreastFeedingTone2").default,
  "breast-feeding-tone3": () => require("./emojis/EmojiBreastFeedingTone3").default,
  "breast-feeding-tone4": () => require("./emojis/EmojiBreastFeedingTone4").default,
  "breast-feeding-tone5": () => require("./emojis/EmojiBreastFeedingTone5").default,
  brick: () => require("./emojis/EmojiBrick").default,
  "bridge-at-night": () => require("./emojis/EmojiBridgeAtNight").default,
  briefcase: () => require("./emojis/EmojiBriefcase").default,
  briefs: () => require("./emojis/EmojiBriefs").default,
  "bright-button": () => require("./emojis/EmojiBrightButton").default,
  broccoli: () => require("./emojis/EmojiBroccoli").default,
  "broken-chain": () => require("./emojis/EmojiBrokenChain").default,
  "broken-heart": () => require("./emojis/EmojiBrokenHeart").default,
  broom: () => require("./emojis/EmojiBroom").default,
  "brown-circle": () => require("./emojis/EmojiBrownCircle").default,
  "brown-heart": () => require("./emojis/EmojiBrownHeart").default,
  "brown-mushroom": () => require("./emojis/EmojiBrownMushroom").default,
  "brown-square": () => require("./emojis/EmojiBrownSquare").default,
  "bubble-tea": () => require("./emojis/EmojiBubbleTea").default,
  bubbles: () => require("./emojis/EmojiBubbles").default,
  bucket: () => require("./emojis/EmojiBucket").default,
  bug: () => require("./emojis/EmojiBug").default,
  "building-construction": () => require("./emojis/EmojiBuildingConstruction").default,
  "bullet-train": () => require("./emojis/EmojiBulletTrain").default,
  bullseye: () => require("./emojis/EmojiBullseye").default,
  burrito: () => require("./emojis/EmojiBurrito").default,
  bus: () => require("./emojis/EmojiBus").default,
  "bus-stop": () => require("./emojis/EmojiBusStop").default,
  "bust-in-silhouette": () => require("./emojis/EmojiBustInSilhouette").default,
  "busts-in-silhouette": () => require("./emojis/EmojiBustsInSilhouette").default,
  butter: () => require("./emojis/EmojiButter").default,
  butterfly: () => require("./emojis/EmojiButterfly").default,
  cactus: () => require("./emojis/EmojiCactus").default,
  calendar: () => require("./emojis/EmojiCalendar").default,
  "call-me-hand": () => require("./emojis/EmojiCallMeHand").default,
  "call-me-hand-dark-skin-tone": () => require("./emojis/EmojiCallMeHandDarkSkinTone").default,
  "call-me-hand-light-skin-tone": () => require("./emojis/EmojiCallMeHandLightSkinTone").default,
  "call-me-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCallMeHandMediumDarkSkinTone").default,
  "call-me-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiCallMeHandMediumLightSkinTone").default,
  "call-me-hand-medium-skin-tone": () => require("./emojis/EmojiCallMeHandMediumSkinTone").default,
  camel: () => require("./emojis/EmojiCamel").default,
  camera: () => require("./emojis/EmojiCamera").default,
  "camera-with-flash": () => require("./emojis/EmojiCameraWithFlash").default,
  camping: () => require("./emojis/EmojiCamping").default,
  cancer: () => require("./emojis/EmojiCancer").default,
  candle: () => require("./emojis/EmojiCandle").default,
  candy: () => require("./emojis/EmojiCandy").default,
  "canned-food": () => require("./emojis/EmojiCannedFood").default,
  canoe: () => require("./emojis/EmojiCanoe").default,
  capricorn: () => require("./emojis/EmojiCapricorn").default,
  "card-file-box": () => require("./emojis/EmojiCardFileBox").default,
  "card-index": () => require("./emojis/EmojiCardIndex").default,
  "card-index-dividers": () => require("./emojis/EmojiCardIndexDividers").default,
  "carousel-horse": () => require("./emojis/EmojiCarouselHorse").default,
  "carp-streamer": () => require("./emojis/EmojiCarpStreamer").default,
  "carpentry-saw": () => require("./emojis/EmojiCarpentrySaw").default,
  carrot: () => require("./emojis/EmojiCarrot").default,
  castle: () => require("./emojis/EmojiCastle").default,
  cat: () => require("./emojis/EmojiCat").default,
  "cat-face": () => require("./emojis/EmojiCatFace").default,
  "cat-with-tears-of-joy": () => require("./emojis/EmojiCatWithTearsOfJoy").default,
  "cat-with-wry-smile": () => require("./emojis/EmojiCatWithWrySmile").default,
  chains: () => require("./emojis/EmojiChains").default,
  chair: () => require("./emojis/EmojiChair").default,
  "chart-decreasing": () => require("./emojis/EmojiChartDecreasing").default,
  "chart-increasing": () => require("./emojis/EmojiChartIncreasing").default,
  "chart-increasing-with-yen": () => require("./emojis/EmojiChartIncreasingWithYen").default,
  "check-box-with-check": () => require("./emojis/EmojiCheckBoxWithCheck").default,
  "check-mark": () => require("./emojis/EmojiCheckMark").default,
  "check-mark-button": () => require("./emojis/EmojiCheckMarkButton").default,
  "cheese-wedge": () => require("./emojis/EmojiCheeseWedge").default,
  "chequered-flag": () => require("./emojis/EmojiChequeredFlag").default,
  cherries: () => require("./emojis/EmojiCherries").default,
  "cherry-blossom": () => require("./emojis/EmojiCherryBlossom").default,
  "chess-pawn": () => require("./emojis/EmojiChessPawn").default,
  chestnut: () => require("./emojis/EmojiChestnut").default,
  chicken: () => require("./emojis/EmojiChicken").default,
  child: () => require("./emojis/EmojiChild").default,
  "child-dark-skin-tone": () => require("./emojis/EmojiChildDarkSkinTone").default,
  "child-light-skin-tone": () => require("./emojis/EmojiChildLightSkinTone").default,
  "child-medium-dark-skin-tone": () => require("./emojis/EmojiChildMediumDarkSkinTone").default,
  "child-medium-light-skin-tone": () => require("./emojis/EmojiChildMediumLightSkinTone").default,
  "child-medium-skin-tone": () => require("./emojis/EmojiChildMediumSkinTone").default,
  "children-crossing": () => require("./emojis/EmojiChildrenCrossing").default,
  chipmunk: () => require("./emojis/EmojiChipmunk").default,
  "chocolate-bar": () => require("./emojis/EmojiChocolateBar").default,
  chopsticks: () => require("./emojis/EmojiChopsticks").default,
  "christmas-tree": () => require("./emojis/EmojiChristmasTree").default,
  church: () => require("./emojis/EmojiChurch").default,
  cigarette: () => require("./emojis/EmojiCigarette").default,
  cinema: () => require("./emojis/EmojiCinema").default,
  "circled-m": () => require("./emojis/EmojiCircledM").default,
  "circus-tent": () => require("./emojis/EmojiCircusTent").default,
  cityscape: () => require("./emojis/EmojiCityscape").default,
  "cityscape-at-dusk": () => require("./emojis/EmojiCityscapeAtDusk").default,
  "cl-button": () => require("./emojis/EmojiClButton").default,
  clamp: () => require("./emojis/EmojiClamp").default,
  "clapper-board": () => require("./emojis/EmojiClapperBoard").default,
  "clapping-hands": () => require("./emojis/EmojiClappingHands").default,
  "clapping-hands-dark-skin-tone": () => require("./emojis/EmojiClappingHandsDarkSkinTone").default,
  "clapping-hands-light-skin-tone": () =>
    require("./emojis/EmojiClappingHandsLightSkinTone").default,
  "clapping-hands-medium-dark-skin-tone": () =>
    require("./emojis/EmojiClappingHandsMediumDarkSkinTone").default,
  "clapping-hands-medium-light-skin-tone": () =>
    require("./emojis/EmojiClappingHandsMediumLightSkinTone").default,
  "clapping-hands-medium-skin-tone": () =>
    require("./emojis/EmojiClappingHandsMediumSkinTone").default,
  "classical-building": () => require("./emojis/EmojiClassicalBuilding").default,
  "clinking-beer-mugs": () => require("./emojis/EmojiClinkingBeerMugs").default,
  "clinking-glasses": () => require("./emojis/EmojiClinkingGlasses").default,
  clipboard: () => require("./emojis/EmojiClipboard").default,
  "clockwise-vertical-arrows": () => require("./emojis/EmojiClockwiseVerticalArrows").default,
  "closed-book": () => require("./emojis/EmojiClosedBook").default,
  "closed-mailbox-with-lowered-flag": () =>
    require("./emojis/EmojiClosedMailboxWithLoweredFlag").default,
  "closed-mailbox-with-raised-flag": () =>
    require("./emojis/EmojiClosedMailboxWithRaisedFlag").default,
  "closed-umbrella": () => require("./emojis/EmojiClosedUmbrella").default,
  cloud: () => require("./emojis/EmojiCloud").default,
  "cloud-with-lightning": () => require("./emojis/EmojiCloudWithLightning").default,
  "cloud-with-lightning-and-rain": () => require("./emojis/EmojiCloudWithLightningAndRain").default,
  "cloud-with-rain": () => require("./emojis/EmojiCloudWithRain").default,
  "cloud-with-snow": () => require("./emojis/EmojiCloudWithSnow").default,
  "clown-face": () => require("./emojis/EmojiClownFace").default,
  "club-suit": () => require("./emojis/EmojiClubSuit").default,
  "clutch-bag": () => require("./emojis/EmojiClutchBag").default,
  coat: () => require("./emojis/EmojiCoat").default,
  cockroach: () => require("./emojis/EmojiCockroach").default,
  "cocktail-glass": () => require("./emojis/EmojiCocktailGlass").default,
  coconut: () => require("./emojis/EmojiCoconut").default,
  coffin: () => require("./emojis/EmojiCoffin").default,
  coin: () => require("./emojis/EmojiCoin").default,
  "cold-face": () => require("./emojis/EmojiColdFace").default,
  collision: () => require("./emojis/EmojiCollision").default,
  comet: () => require("./emojis/EmojiComet").default,
  compass: () => require("./emojis/EmojiCompass").default,
  "computer-disk": () => require("./emojis/EmojiComputerDisk").default,
  "computer-mouse": () => require("./emojis/EmojiComputerMouse").default,
  "confetti-ball": () => require("./emojis/EmojiConfettiBall").default,
  "confounded-face": () => require("./emojis/EmojiConfoundedFace").default,
  "confused-face": () => require("./emojis/EmojiConfusedFace").default,
  construction: () => require("./emojis/EmojiConstruction").default,
  "construction-worker": () => require("./emojis/EmojiConstructionWorker").default,
  "construction-worker-dark-skin-tone": () =>
    require("./emojis/EmojiConstructionWorkerDarkSkinTone").default,
  "construction-worker-light-skin-tone": () =>
    require("./emojis/EmojiConstructionWorkerLightSkinTone").default,
  "construction-worker-medium-dark-skin-tone": () =>
    require("./emojis/EmojiConstructionWorkerMediumDarkSkinTone").default,
  "construction-worker-medium-light-skin-tone": () =>
    require("./emojis/EmojiConstructionWorkerMediumLightSkinTone").default,
  "construction-worker-medium-skin-tone": () =>
    require("./emojis/EmojiConstructionWorkerMediumSkinTone").default,
  "control-knobs": () => require("./emojis/EmojiControlKnobs").default,
  "convenience-store": () => require("./emojis/EmojiConvenienceStore").default,
  cook: () => require("./emojis/EmojiCook").default,
  "cook-dark-skin-tone": () => require("./emojis/EmojiCookDarkSkinTone").default,
  "cook-light-skin-tone": () => require("./emojis/EmojiCookLightSkinTone").default,
  "cook-medium-dark-skin-tone": () => require("./emojis/EmojiCookMediumDarkSkinTone").default,
  "cook-medium-light-skin-tone": () => require("./emojis/EmojiCookMediumLightSkinTone").default,
  "cook-medium-skin-tone": () => require("./emojis/EmojiCookMediumSkinTone").default,
  "cooked-rice": () => require("./emojis/EmojiCookedRice").default,
  cookie: () => require("./emojis/EmojiCookie").default,
  cooking: () => require("./emojis/EmojiCooking").default,
  "cool-button": () => require("./emojis/EmojiCoolButton").default,
  copyright: () => require("./emojis/EmojiCopyright").default,
  coral: () => require("./emojis/EmojiCoral").default,
  "couch-and-lamp": () => require("./emojis/EmojiCouchAndLamp").default,
  "counterclockwise-arrows-button": () =>
    require("./emojis/EmojiCounterclockwiseArrowsButton").default,
  "couple-with-heart": () => require("./emojis/EmojiCoupleWithHeart").default,
  "couple-with-heart-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartDarkSkinTone").default,
  "couple-with-heart-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartLightSkinTone").default,
  "couple-with-heart-man-man": () => require("./emojis/EmojiCoupleWithHeartManMan").default,
  "couple-with-heart-man-man-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManDarkSkinTone").default,
  "couple-with-heart-man-man-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManDarkSkinToneLightSkinTone").default,
  "couple-with-heart-man-man-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManDarkSkinToneMediumDarkSkinTone").default,
  "couple-with-heart-man-man-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManDarkSkinToneMediumLightSkinTone").default,
  "couple-with-heart-man-man-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManDarkSkinToneMediumSkinTone").default,
  "couple-with-heart-man-man-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManLightSkinTone").default,
  "couple-with-heart-man-man-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManLightSkinToneDarkSkinTone").default,
  "couple-with-heart-man-man-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManLightSkinToneMediumDarkSkinTone").default,
  "couple-with-heart-man-man-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManLightSkinToneMediumLightSkinTone").default,
  "couple-with-heart-man-man-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManLightSkinToneMediumSkinTone").default,
  "couple-with-heart-man-man-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManMediumDarkSkinTone").default,
  "couple-with-heart-man-man-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManMediumDarkSkinToneDarkSkinTone").default,
  "couple-with-heart-man-man-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManMediumDarkSkinToneLightSkinTone").default,
  "couple-with-heart-man-man-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManMediumDarkSkinToneMediumLightSkinTone").default,
  "couple-with-heart-man-man-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManMediumDarkSkinToneMediumSkinTone").default,
  "couple-with-heart-man-man-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManMediumLightSkinTone").default,
  "couple-with-heart-man-man-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManMediumLightSkinToneDarkSkinTone").default,
  "couple-with-heart-man-man-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManMediumLightSkinToneLightSkinTone").default,
  "couple-with-heart-man-man-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManMediumLightSkinToneMediumDarkSkinTone").default,
  "couple-with-heart-man-man-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManMediumLightSkinToneMediumSkinTone").default,
  "couple-with-heart-man-man-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManMediumSkinTone").default,
  "couple-with-heart-man-man-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManMediumSkinToneDarkSkinTone").default,
  "couple-with-heart-man-man-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManMediumSkinToneLightSkinTone").default,
  "couple-with-heart-man-man-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManMediumSkinToneMediumDarkSkinTone").default,
  "couple-with-heart-man-man-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartManManMediumSkinToneMediumLightSkinTone").default,
  "couple-with-heart-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartMediumDarkSkinTone").default,
  "couple-with-heart-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartMediumLightSkinTone").default,
  "couple-with-heart-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartMediumSkinTone").default,
  "couple-with-heart-person-person-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonDarkSkinToneLightSkinTone").default,
  "couple-with-heart-person-person-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonDarkSkinToneMediumDarkSkinTone").default,
  "couple-with-heart-person-person-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonDarkSkinToneMediumLightSkinTone").default,
  "couple-with-heart-person-person-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonDarkSkinToneMediumSkinTone").default,
  "couple-with-heart-person-person-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonLightSkinToneDarkSkinTone").default,
  "couple-with-heart-person-person-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonLightSkinToneMediumDarkSkinTone").default,
  "couple-with-heart-person-person-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonLightSkinToneMediumLightSkinTone").default,
  "couple-with-heart-person-person-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonLightSkinToneMediumSkinTone").default,
  "couple-with-heart-person-person-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonMediumDarkSkinToneDarkSkinTone").default,
  "couple-with-heart-person-person-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonMediumDarkSkinToneLightSkinTone").default,
  "couple-with-heart-person-person-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonMediumDarkSkinToneMediumLightSkinTone")
      .default,
  "couple-with-heart-person-person-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonMediumDarkSkinToneMediumSkinTone").default,
  "couple-with-heart-person-person-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonMediumLightSkinToneDarkSkinTone").default,
  "couple-with-heart-person-person-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonMediumLightSkinToneLightSkinTone").default,
  "couple-with-heart-person-person-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonMediumLightSkinToneMediumDarkSkinTone")
      .default,
  "couple-with-heart-person-person-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonMediumLightSkinToneMediumSkinTone").default,
  "couple-with-heart-person-person-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonMediumSkinToneDarkSkinTone").default,
  "couple-with-heart-person-person-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonMediumSkinToneLightSkinTone").default,
  "couple-with-heart-person-person-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonMediumSkinToneMediumDarkSkinTone").default,
  "couple-with-heart-person-person-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartPersonPersonMediumSkinToneMediumLightSkinTone").default,
  "couple-with-heart-woman-man": () => require("./emojis/EmojiCoupleWithHeartWomanMan").default,
  "couple-with-heart-woman-man-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManDarkSkinTone").default,
  "couple-with-heart-woman-man-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManDarkSkinToneLightSkinTone").default,
  "couple-with-heart-woman-man-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManDarkSkinToneMediumDarkSkinTone").default,
  "couple-with-heart-woman-man-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManDarkSkinToneMediumLightSkinTone").default,
  "couple-with-heart-woman-man-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManDarkSkinToneMediumSkinTone").default,
  "couple-with-heart-woman-man-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManLightSkinTone").default,
  "couple-with-heart-woman-man-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManLightSkinToneDarkSkinTone").default,
  "couple-with-heart-woman-man-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManLightSkinToneMediumDarkSkinTone").default,
  "couple-with-heart-woman-man-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManLightSkinToneMediumLightSkinTone").default,
  "couple-with-heart-woman-man-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManLightSkinToneMediumSkinTone").default,
  "couple-with-heart-woman-man-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManMediumDarkSkinTone").default,
  "couple-with-heart-woman-man-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManMediumDarkSkinToneDarkSkinTone").default,
  "couple-with-heart-woman-man-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManMediumDarkSkinToneLightSkinTone").default,
  "couple-with-heart-woman-man-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManMediumDarkSkinToneMediumLightSkinTone").default,
  "couple-with-heart-woman-man-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManMediumDarkSkinToneMediumSkinTone").default,
  "couple-with-heart-woman-man-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManMediumLightSkinTone").default,
  "couple-with-heart-woman-man-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManMediumLightSkinToneDarkSkinTone").default,
  "couple-with-heart-woman-man-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManMediumLightSkinToneLightSkinTone").default,
  "couple-with-heart-woman-man-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManMediumLightSkinToneMediumDarkSkinTone").default,
  "couple-with-heart-woman-man-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManMediumLightSkinToneMediumSkinTone").default,
  "couple-with-heart-woman-man-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManMediumSkinTone").default,
  "couple-with-heart-woman-man-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManMediumSkinToneDarkSkinTone").default,
  "couple-with-heart-woman-man-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManMediumSkinToneLightSkinTone").default,
  "couple-with-heart-woman-man-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManMediumSkinToneMediumDarkSkinTone").default,
  "couple-with-heart-woman-man-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanManMediumSkinToneMediumLightSkinTone").default,
  "couple-with-heart-woman-woman": () => require("./emojis/EmojiCoupleWithHeartWomanWoman").default,
  "couple-with-heart-woman-woman-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanDarkSkinTone").default,
  "couple-with-heart-woman-woman-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanDarkSkinToneLightSkinTone").default,
  "couple-with-heart-woman-woman-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanDarkSkinToneMediumDarkSkinTone").default,
  "couple-with-heart-woman-woman-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanDarkSkinToneMediumLightSkinTone").default,
  "couple-with-heart-woman-woman-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanDarkSkinToneMediumSkinTone").default,
  "couple-with-heart-woman-woman-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanLightSkinTone").default,
  "couple-with-heart-woman-woman-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanLightSkinToneDarkSkinTone").default,
  "couple-with-heart-woman-woman-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanLightSkinToneMediumDarkSkinTone").default,
  "couple-with-heart-woman-woman-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanLightSkinToneMediumLightSkinTone").default,
  "couple-with-heart-woman-woman-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanLightSkinToneMediumSkinTone").default,
  "couple-with-heart-woman-woman-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanMediumDarkSkinTone").default,
  "couple-with-heart-woman-woman-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanMediumDarkSkinToneDarkSkinTone").default,
  "couple-with-heart-woman-woman-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanMediumDarkSkinToneLightSkinTone").default,
  "couple-with-heart-woman-woman-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanMediumDarkSkinToneMediumLightSkinTone").default,
  "couple-with-heart-woman-woman-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanMediumDarkSkinToneMediumSkinTone").default,
  "couple-with-heart-woman-woman-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanMediumLightSkinTone").default,
  "couple-with-heart-woman-woman-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanMediumLightSkinToneDarkSkinTone").default,
  "couple-with-heart-woman-woman-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanMediumLightSkinToneLightSkinTone").default,
  "couple-with-heart-woman-woman-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanMediumLightSkinToneMediumDarkSkinTone").default,
  "couple-with-heart-woman-woman-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanMediumLightSkinToneMediumSkinTone").default,
  "couple-with-heart-woman-woman-medium-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanMediumSkinTone").default,
  "couple-with-heart-woman-woman-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanMediumSkinToneDarkSkinTone").default,
  "couple-with-heart-woman-woman-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanMediumSkinToneLightSkinTone").default,
  "couple-with-heart-woman-woman-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanMediumSkinToneMediumDarkSkinTone").default,
  "couple-with-heart-woman-woman-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiCoupleWithHeartWomanWomanMediumSkinToneMediumLightSkinTone").default,
  cow: () => require("./emojis/EmojiCow").default,
  "cow-face": () => require("./emojis/EmojiCowFace").default,
  "cowboy-hat-face": () => require("./emojis/EmojiCowboyHatFace").default,
  crab: () => require("./emojis/EmojiCrab").default,
  crayon: () => require("./emojis/EmojiCrayon").default,
  "crazy-face": () => require("./emojis/EmojiCrazyFace").default,
  "credit-card": () => require("./emojis/EmojiCreditCard").default,
  "crescent-moon": () => require("./emojis/EmojiCrescentMoon").default,
  cricket: () => require("./emojis/EmojiCricket").default,
  "cricket-game": () => require("./emojis/EmojiCricketGame").default,
  crocodile: () => require("./emojis/EmojiCrocodile").default,
  croissant: () => require("./emojis/EmojiCroissant").default,
  "cross-mark": () => require("./emojis/EmojiCrossMark").default,
  "cross-mark-button": () => require("./emojis/EmojiCrossMarkButton").default,
  "crossed-fingers": () => require("./emojis/EmojiCrossedFingers").default,
  "crossed-fingers-dark-skin-tone": () =>
    require("./emojis/EmojiCrossedFingersDarkSkinTone").default,
  "crossed-fingers-light-skin-tone": () =>
    require("./emojis/EmojiCrossedFingersLightSkinTone").default,
  "crossed-fingers-medium-dark-skin-tone": () =>
    require("./emojis/EmojiCrossedFingersMediumDarkSkinTone").default,
  "crossed-fingers-medium-light-skin-tone": () =>
    require("./emojis/EmojiCrossedFingersMediumLightSkinTone").default,
  "crossed-fingers-medium-skin-tone": () =>
    require("./emojis/EmojiCrossedFingersMediumSkinTone").default,
  "crossed-flags": () => require("./emojis/EmojiCrossedFlags").default,
  "crossed-swords": () => require("./emojis/EmojiCrossedSwords").default,
  crown: () => require("./emojis/EmojiCrown").default,
  crutch: () => require("./emojis/EmojiCrutch").default,
  "crying-cat": () => require("./emojis/EmojiCryingCat").default,
  "crying-face": () => require("./emojis/EmojiCryingFace").default,
  "crystal-ball": () => require("./emojis/EmojiCrystalBall").default,
  cucumber: () => require("./emojis/EmojiCucumber").default,
  "cup-with-straw": () => require("./emojis/EmojiCupWithStraw").default,
  cupcake: () => require("./emojis/EmojiCupcake").default,
  "curling-stone": () => require("./emojis/EmojiCurlingStone").default,
  "curly-haired": () => require("./emojis/EmojiCurlyHaired").default,
  "curly-loop": () => require("./emojis/EmojiCurlyLoop").default,
  "currency-exchange": () => require("./emojis/EmojiCurrencyExchange").default,
  "curry-rice": () => require("./emojis/EmojiCurryRice").default,
  custard: () => require("./emojis/EmojiCustard").default,
  customs: () => require("./emojis/EmojiCustoms").default,
  "cut-of-meat": () => require("./emojis/EmojiCutOfMeat").default,
  cyclone: () => require("./emojis/EmojiCyclone").default,
  dagger: () => require("./emojis/EmojiDagger").default,
  dango: () => require("./emojis/EmojiDango").default,
  "dark-skin-tone": () => require("./emojis/EmojiDarkSkinTone").default,
  "dashing-away": () => require("./emojis/EmojiDashingAway").default,
  "deaf-man": () => require("./emojis/EmojiDeafMan").default,
  "deaf-man-dark-skin-tone": () => require("./emojis/EmojiDeafManDarkSkinTone").default,
  "deaf-man-light-skin-tone": () => require("./emojis/EmojiDeafManLightSkinTone").default,
  "deaf-man-medium-dark-skin-tone": () =>
    require("./emojis/EmojiDeafManMediumDarkSkinTone").default,
  "deaf-man-medium-light-skin-tone": () =>
    require("./emojis/EmojiDeafManMediumLightSkinTone").default,
  "deaf-man-medium-skin-tone": () => require("./emojis/EmojiDeafManMediumSkinTone").default,
  "deaf-person": () => require("./emojis/EmojiDeafPerson").default,
  "deaf-person-dark-skin-tone": () => require("./emojis/EmojiDeafPersonDarkSkinTone").default,
  "deaf-person-light-skin-tone": () => require("./emojis/EmojiDeafPersonLightSkinTone").default,
  "deaf-person-medium-dark-skin-tone": () =>
    require("./emojis/EmojiDeafPersonMediumDarkSkinTone").default,
  "deaf-person-medium-light-skin-tone": () =>
    require("./emojis/EmojiDeafPersonMediumLightSkinTone").default,
  "deaf-person-medium-skin-tone": () => require("./emojis/EmojiDeafPersonMediumSkinTone").default,
  "deaf-woman": () => require("./emojis/EmojiDeafWoman").default,
  "deaf-woman-dark-skin-tone": () => require("./emojis/EmojiDeafWomanDarkSkinTone").default,
  "deaf-woman-light-skin-tone": () => require("./emojis/EmojiDeafWomanLightSkinTone").default,
  "deaf-woman-medium-dark-skin-tone": () =>
    require("./emojis/EmojiDeafWomanMediumDarkSkinTone").default,
  "deaf-woman-medium-light-skin-tone": () =>
    require("./emojis/EmojiDeafWomanMediumLightSkinTone").default,
  "deaf-woman-medium-skin-tone": () => require("./emojis/EmojiDeafWomanMediumSkinTone").default,
  "deciduous-tree": () => require("./emojis/EmojiDeciduousTree").default,
  deer: () => require("./emojis/EmojiDeer").default,
  "delivery-truck": () => require("./emojis/EmojiDeliveryTruck").default,
  "department-store": () => require("./emojis/EmojiDepartmentStore").default,
  "derelict-house": () => require("./emojis/EmojiDerelictHouse").default,
  desert: () => require("./emojis/EmojiDesert").default,
  "desert-island": () => require("./emojis/EmojiDesertIsland").default,
  "desktop-computer": () => require("./emojis/EmojiDesktopComputer").default,
  detective: () => require("./emojis/EmojiDetective").default,
  "detective-dark-skin-tone": () => require("./emojis/EmojiDetectiveDarkSkinTone").default,
  "detective-light-skin-tone": () => require("./emojis/EmojiDetectiveLightSkinTone").default,
  "detective-medium-dark-skin-tone": () =>
    require("./emojis/EmojiDetectiveMediumDarkSkinTone").default,
  "detective-medium-light-skin-tone": () =>
    require("./emojis/EmojiDetectiveMediumLightSkinTone").default,
  "detective-medium-skin-tone": () => require("./emojis/EmojiDetectiveMediumSkinTone").default,
  "diamond-suit": () => require("./emojis/EmojiDiamondSuit").default,
  "diamond-with-a-dot": () => require("./emojis/EmojiDiamondWithADot").default,
  "digit-eight": () => require("./emojis/EmojiDigitEight").default,
  "digit-five": () => require("./emojis/EmojiDigitFive").default,
  "digit-four": () => require("./emojis/EmojiDigitFour").default,
  "digit-nine": () => require("./emojis/EmojiDigitNine").default,
  "digit-one": () => require("./emojis/EmojiDigitOne").default,
  "digit-seven": () => require("./emojis/EmojiDigitSeven").default,
  "digit-six": () => require("./emojis/EmojiDigitSix").default,
  "digit-three": () => require("./emojis/EmojiDigitThree").default,
  "digit-two": () => require("./emojis/EmojiDigitTwo").default,
  "digit-zero": () => require("./emojis/EmojiDigitZero").default,
  "dim-button": () => require("./emojis/EmojiDimButton").default,
  "disappointed-but-relieved-face": () =>
    require("./emojis/EmojiDisappointedButRelievedFace").default,
  "disappointed-face": () => require("./emojis/EmojiDisappointedFace").default,
  "disguised-face": () => require("./emojis/EmojiDisguisedFace").default,
  "distorted-face": () => require("./emojis/EmojiDistortedFace").default,
  divide: () => require("./emojis/EmojiDivide").default,
  "diving-mask": () => require("./emojis/EmojiDivingMask").default,
  "diya-lamp": () => require("./emojis/EmojiDiyaLamp").default,
  dizzy: () => require("./emojis/EmojiDizzy").default,
  dna: () => require("./emojis/EmojiDna").default,
  dodo: () => require("./emojis/EmojiDodo").default,
  dog: () => require("./emojis/EmojiDog").default,
  "dog-face": () => require("./emojis/EmojiDogFace").default,
  "dollar-banknote": () => require("./emojis/EmojiDollarBanknote").default,
  dolphin: () => require("./emojis/EmojiDolphin").default,
  donkey: () => require("./emojis/EmojiDonkey").default,
  door: () => require("./emojis/EmojiDoor").default,
  "dotted-line-face": () => require("./emojis/EmojiDottedLineFace").default,
  "dotted-six-pointed-star": () => require("./emojis/EmojiDottedSixPointedStar").default,
  "double-curly-loop": () => require("./emojis/EmojiDoubleCurlyLoop").default,
  "double-exclamation-mark": () => require("./emojis/EmojiDoubleExclamationMark").default,
  doughnut: () => require("./emojis/EmojiDoughnut").default,
  dove: () => require("./emojis/EmojiDove").default,
  "down-arrow": () => require("./emojis/EmojiDownArrow").default,
  "down-left-arrow": () => require("./emojis/EmojiDownLeftArrow").default,
  "down-right-arrow": () => require("./emojis/EmojiDownRightArrow").default,
  "downcast-face-with-sweat": () => require("./emojis/EmojiDowncastFaceWithSweat").default,
  "downwards-button": () => require("./emojis/EmojiDownwardsButton").default,
  dragon: () => require("./emojis/EmojiDragon").default,
  "dragon-face": () => require("./emojis/EmojiDragonFace").default,
  dress: () => require("./emojis/EmojiDress").default,
  "drooling-face": () => require("./emojis/EmojiDroolingFace").default,
  "drop-of-blood": () => require("./emojis/EmojiDropOfBlood").default,
  droplet: () => require("./emojis/EmojiDroplet").default,
  drum: () => require("./emojis/EmojiDrum").default,
  duck: () => require("./emojis/EmojiDuck").default,
  dumpling: () => require("./emojis/EmojiDumpling").default,
  dvd: () => require("./emojis/EmojiDvd").default,
  "e-mail": () => require("./emojis/EmojiEMail").default,
  eagle: () => require("./emojis/EmojiEagle").default,
  ear: () => require("./emojis/EmojiEar").default,
  "ear-dark-skin-tone": () => require("./emojis/EmojiEarDarkSkinTone").default,
  "ear-light-skin-tone": () => require("./emojis/EmojiEarLightSkinTone").default,
  "ear-medium-dark-skin-tone": () => require("./emojis/EmojiEarMediumDarkSkinTone").default,
  "ear-medium-light-skin-tone": () => require("./emojis/EmojiEarMediumLightSkinTone").default,
  "ear-medium-skin-tone": () => require("./emojis/EmojiEarMediumSkinTone").default,
  "ear-of-corn": () => require("./emojis/EmojiEarOfCorn").default,
  "ear-with-hearing-aid": () => require("./emojis/EmojiEarWithHearingAid").default,
  "ear-with-hearing-aid-dark-skin-tone": () =>
    require("./emojis/EmojiEarWithHearingAidDarkSkinTone").default,
  "ear-with-hearing-aid-light-skin-tone": () =>
    require("./emojis/EmojiEarWithHearingAidLightSkinTone").default,
  "ear-with-hearing-aid-medium-dark-skin-tone": () =>
    require("./emojis/EmojiEarWithHearingAidMediumDarkSkinTone").default,
  "ear-with-hearing-aid-medium-light-skin-tone": () =>
    require("./emojis/EmojiEarWithHearingAidMediumLightSkinTone").default,
  "ear-with-hearing-aid-medium-skin-tone": () =>
    require("./emojis/EmojiEarWithHearingAidMediumSkinTone").default,
  egg: () => require("./emojis/EmojiEgg").default,
  eggplant: () => require("./emojis/EmojiEggplant").default,
  "eight-oclock": () => require("./emojis/EmojiEightOclock").default,
  "eight-pointed-star": () => require("./emojis/EmojiEightPointedStar").default,
  "eight-spoked-asterisk": () => require("./emojis/EmojiEightSpokedAsterisk").default,
  "eight-thirty": () => require("./emojis/EmojiEightThirty").default,
  "eject-button": () => require("./emojis/EmojiEjectButton").default,
  "electric-plug": () => require("./emojis/EmojiElectricPlug").default,
  elephant: () => require("./emojis/EmojiElephant").default,
  elevator: () => require("./emojis/EmojiElevator").default,
  "eleven-oclock": () => require("./emojis/EmojiElevenOclock").default,
  "eleven-thirty": () => require("./emojis/EmojiElevenThirty").default,
  elf: () => require("./emojis/EmojiElf").default,
  "elf-dark-skin-tone": () => require("./emojis/EmojiElfDarkSkinTone").default,
  "elf-light-skin-tone": () => require("./emojis/EmojiElfLightSkinTone").default,
  "elf-medium-dark-skin-tone": () => require("./emojis/EmojiElfMediumDarkSkinTone").default,
  "elf-medium-light-skin-tone": () => require("./emojis/EmojiElfMediumLightSkinTone").default,
  "elf-medium-skin-tone": () => require("./emojis/EmojiElfMediumSkinTone").default,
  "empty-nest": () => require("./emojis/EmojiEmptyNest").default,
  "end-arrow": () => require("./emojis/EmojiEndArrow").default,
  "enraged-face": () => require("./emojis/EmojiEnragedFace").default,
  envelope: () => require("./emojis/EmojiEnvelope").default,
  "envelope-with-arrow": () => require("./emojis/EmojiEnvelopeWithArrow").default,
  "euro-banknote": () => require("./emojis/EmojiEuroBanknote").default,
  "evergreen-tree": () => require("./emojis/EmojiEvergreenTree").default,
  ewe: () => require("./emojis/EmojiEwe").default,
  "exclamation-question-mark": () => require("./emojis/EmojiExclamationQuestionMark").default,
  "exploding-head": () => require("./emojis/EmojiExplodingHead").default,
  "expressionless-face": () => require("./emojis/EmojiExpressionlessFace").default,
  eye: () => require("./emojis/EmojiEye").default,
  "eye-in-speech-bubble": () => require("./emojis/EmojiEyeInSpeechBubble").default,
  eyes: () => require("./emojis/EmojiEyes").default,
  "face-blowing-a-kiss": () => require("./emojis/EmojiFaceBlowingAKiss").default,
  "face-exhaling": () => require("./emojis/EmojiFaceExhaling").default,
  "face-holding-back-tears": () => require("./emojis/EmojiFaceHoldingBackTears").default,
  "face-in-clouds": () => require("./emojis/EmojiFaceInClouds").default,
  "face-savoring-food": () => require("./emojis/EmojiFaceSavoringFood").default,
  "face-savouring-delicious-food": () =>
    require("./emojis/EmojiFaceSavouringDeliciousFood").default,
  "face-screaming-in-fear": () => require("./emojis/EmojiFaceScreamingInFear").default,
  "face-vomiting": () => require("./emojis/EmojiFaceVomiting").default,
  "face-with-bags-under-eyes": () => require("./emojis/EmojiFaceWithBagsUnderEyes").default,
  "face-with-cold-sweat": () => require("./emojis/EmojiFaceWithColdSweat").default,
  "face-with-crossed-out-eyes": () => require("./emojis/EmojiFaceWithCrossedOutEyes").default,
  "face-with-diagonal-mouth": () => require("./emojis/EmojiFaceWithDiagonalMouth").default,
  "face-with-hand-over-mouth": () => require("./emojis/EmojiFaceWithHandOverMouth").default,
  "face-with-head-bandage": () => require("./emojis/EmojiFaceWithHeadBandage").default,
  "face-with-medical-mask": () => require("./emojis/EmojiFaceWithMedicalMask").default,
  "face-with-monocle": () => require("./emojis/EmojiFaceWithMonocle").default,
  "face-with-open-eyes-and-hand-over-mouth": () =>
    require("./emojis/EmojiFaceWithOpenEyesAndHandOverMouth").default,
  "face-with-open-mouth": () => require("./emojis/EmojiFaceWithOpenMouth").default,
  "face-with-open-mouth-and-cold-sweat": () =>
    require("./emojis/EmojiFaceWithOpenMouthAndColdSweat").default,
  "face-with-peeking-eye": () => require("./emojis/EmojiFaceWithPeekingEye").default,
  "face-with-raised-eyebrow": () => require("./emojis/EmojiFaceWithRaisedEyebrow").default,
  "face-with-rolling-eyes": () => require("./emojis/EmojiFaceWithRollingEyes").default,
  "face-with-spiral-eyes": () => require("./emojis/EmojiFaceWithSpiralEyes").default,
  "face-with-steam-from-nose": () => require("./emojis/EmojiFaceWithSteamFromNose").default,
  "face-with-stuck-out-tongue": () => require("./emojis/EmojiFaceWithStuckOutTongue").default,
  "face-with-stuck-out-tongue-and-closed-eyes": () =>
    require("./emojis/EmojiFaceWithStuckOutTongueAndClosedEyes").default,
  "face-with-stuck-out-tongue-and-winking-eye": () =>
    require("./emojis/EmojiFaceWithStuckOutTongueAndWinkingEye").default,
  "face-with-symbols-on-mouth": () => require("./emojis/EmojiFaceWithSymbolsOnMouth").default,
  "face-with-symbols-over-mouth": () => require("./emojis/EmojiFaceWithSymbolsOverMouth").default,
  "face-with-tears-of-joy": () => require("./emojis/EmojiFaceWithTearsOfJoy").default,
  "face-with-thermometer": () => require("./emojis/EmojiFaceWithThermometer").default,
  "face-with-tongue": () => require("./emojis/EmojiFaceWithTongue").default,
  "face-without-mouth": () => require("./emojis/EmojiFaceWithoutMouth").default,
  factory: () => require("./emojis/EmojiFactory").default,
  "factory-worker": () => require("./emojis/EmojiFactoryWorker").default,
  "factory-worker-dark-skin-tone": () => require("./emojis/EmojiFactoryWorkerDarkSkinTone").default,
  "factory-worker-light-skin-tone": () =>
    require("./emojis/EmojiFactoryWorkerLightSkinTone").default,
  "factory-worker-medium-dark-skin-tone": () =>
    require("./emojis/EmojiFactoryWorkerMediumDarkSkinTone").default,
  "factory-worker-medium-light-skin-tone": () =>
    require("./emojis/EmojiFactoryWorkerMediumLightSkinTone").default,
  "factory-worker-medium-skin-tone": () =>
    require("./emojis/EmojiFactoryWorkerMediumSkinTone").default,
  fairy: () => require("./emojis/EmojiFairy").default,
  "fairy-dark-skin-tone": () => require("./emojis/EmojiFairyDarkSkinTone").default,
  "fairy-light-skin-tone": () => require("./emojis/EmojiFairyLightSkinTone").default,
  "fairy-medium-dark-skin-tone": () => require("./emojis/EmojiFairyMediumDarkSkinTone").default,
  "fairy-medium-light-skin-tone": () => require("./emojis/EmojiFairyMediumLightSkinTone").default,
  "fairy-medium-skin-tone": () => require("./emojis/EmojiFairyMediumSkinTone").default,
  falafel: () => require("./emojis/EmojiFalafel").default,
  "fallen-leaf": () => require("./emojis/EmojiFallenLeaf").default,
  family: () => require("./emojis/EmojiFamily").default,
  "family-adult-adult-child": () => require("./emojis/EmojiFamilyAdultAdultChild").default,
  "family-adult-adult-child-child": () =>
    require("./emojis/EmojiFamilyAdultAdultChildChild").default,
  "family-adult-child": () => require("./emojis/EmojiFamilyAdultChild").default,
  "family-adult-child-child": () => require("./emojis/EmojiFamilyAdultChildChild").default,
  "family-man-boy": () => require("./emojis/EmojiFamilyManBoy").default,
  "family-man-boy-boy": () => require("./emojis/EmojiFamilyManBoyBoy").default,
  "family-man-girl": () => require("./emojis/EmojiFamilyManGirl").default,
  "family-man-girl-boy": () => require("./emojis/EmojiFamilyManGirlBoy").default,
  "family-man-girl-girl": () => require("./emojis/EmojiFamilyManGirlGirl").default,
  "family-man-man-boy": () => require("./emojis/EmojiFamilyManManBoy").default,
  "family-man-man-boy-boy": () => require("./emojis/EmojiFamilyManManBoyBoy").default,
  "family-man-man-girl": () => require("./emojis/EmojiFamilyManManGirl").default,
  "family-man-man-girl-boy": () => require("./emojis/EmojiFamilyManManGirlBoy").default,
  "family-man-man-girl-girl": () => require("./emojis/EmojiFamilyManManGirlGirl").default,
  "family-man-woman-boy": () => require("./emojis/EmojiFamilyManWomanBoy").default,
  "family-man-woman-boy-boy": () => require("./emojis/EmojiFamilyManWomanBoyBoy").default,
  "family-man-woman-girl": () => require("./emojis/EmojiFamilyManWomanGirl").default,
  "family-man-woman-girl-boy": () => require("./emojis/EmojiFamilyManWomanGirlBoy").default,
  "family-man-woman-girl-girl": () => require("./emojis/EmojiFamilyManWomanGirlGirl").default,
  "family-woman-boy": () => require("./emojis/EmojiFamilyWomanBoy").default,
  "family-woman-boy-boy": () => require("./emojis/EmojiFamilyWomanBoyBoy").default,
  "family-woman-girl": () => require("./emojis/EmojiFamilyWomanGirl").default,
  "family-woman-girl-boy": () => require("./emojis/EmojiFamilyWomanGirlBoy").default,
  "family-woman-girl-girl": () => require("./emojis/EmojiFamilyWomanGirlGirl").default,
  "family-woman-woman-boy": () => require("./emojis/EmojiFamilyWomanWomanBoy").default,
  "family-woman-woman-boy-boy": () => require("./emojis/EmojiFamilyWomanWomanBoyBoy").default,
  "family-woman-woman-girl": () => require("./emojis/EmojiFamilyWomanWomanGirl").default,
  "family-woman-woman-girl-boy": () => require("./emojis/EmojiFamilyWomanWomanGirlBoy").default,
  "family-woman-woman-girl-girl": () => require("./emojis/EmojiFamilyWomanWomanGirlGirl").default,
  farmer: () => require("./emojis/EmojiFarmer").default,
  "farmer-dark-skin-tone": () => require("./emojis/EmojiFarmerDarkSkinTone").default,
  "farmer-light-skin-tone": () => require("./emojis/EmojiFarmerLightSkinTone").default,
  "farmer-medium-dark-skin-tone": () => require("./emojis/EmojiFarmerMediumDarkSkinTone").default,
  "farmer-medium-light-skin-tone": () => require("./emojis/EmojiFarmerMediumLightSkinTone").default,
  "farmer-medium-skin-tone": () => require("./emojis/EmojiFarmerMediumSkinTone").default,
  "fast-down-button": () => require("./emojis/EmojiFastDownButton").default,
  "fast-forward-button": () => require("./emojis/EmojiFastForwardButton").default,
  "fast-reverse-button": () => require("./emojis/EmojiFastReverseButton").default,
  "fast-up-button": () => require("./emojis/EmojiFastUpButton").default,
  "fax-machine": () => require("./emojis/EmojiFaxMachine").default,
  "fearful-face": () => require("./emojis/EmojiFearfulFace").default,
  feather: () => require("./emojis/EmojiFeather").default,
  "female-sign": () => require("./emojis/EmojiFemaleSign").default,
  "ferris-wheel": () => require("./emojis/EmojiFerrisWheel").default,
  ferry: () => require("./emojis/EmojiFerry").default,
  "field-hockey": () => require("./emojis/EmojiFieldHockey").default,
  "fight-cloud": () => require("./emojis/EmojiFightCloud").default,
  "file-cabinet": () => require("./emojis/EmojiFileCabinet").default,
  "file-folder": () => require("./emojis/EmojiFileFolder").default,
  "film-frames": () => require("./emojis/EmojiFilmFrames").default,
  "film-projector": () => require("./emojis/EmojiFilmProjector").default,
  fingerprint: () => require("./emojis/EmojiFingerprint").default,
  fire: () => require("./emojis/EmojiFire").default,
  "fire-engine": () => require("./emojis/EmojiFireEngine").default,
  "fire-extinguisher": () => require("./emojis/EmojiFireExtinguisher").default,
  firecracker: () => require("./emojis/EmojiFirecracker").default,
  firefighter: () => require("./emojis/EmojiFirefighter").default,
  "firefighter-dark-skin-tone": () => require("./emojis/EmojiFirefighterDarkSkinTone").default,
  "firefighter-light-skin-tone": () => require("./emojis/EmojiFirefighterLightSkinTone").default,
  "firefighter-medium-dark-skin-tone": () =>
    require("./emojis/EmojiFirefighterMediumDarkSkinTone").default,
  "firefighter-medium-light-skin-tone": () =>
    require("./emojis/EmojiFirefighterMediumLightSkinTone").default,
  "firefighter-medium-skin-tone": () => require("./emojis/EmojiFirefighterMediumSkinTone").default,
  fireworks: () => require("./emojis/EmojiFireworks").default,
  "first-quarter-moon": () => require("./emojis/EmojiFirstQuarterMoon").default,
  "first-quarter-moon-face": () => require("./emojis/EmojiFirstQuarterMoonFace").default,
  "first-quarter-moon-with-face": () => require("./emojis/EmojiFirstQuarterMoonWithFace").default,
  fish: () => require("./emojis/EmojiFish").default,
  "fish-cake-with-swirl": () => require("./emojis/EmojiFishCakeWithSwirl").default,
  "fishing-pole": () => require("./emojis/EmojiFishingPole").default,
  "five-oclock": () => require("./emojis/EmojiFiveOclock").default,
  "five-thirty": () => require("./emojis/EmojiFiveThirty").default,
  "flag-in-hole": () => require("./emojis/EmojiFlagInHole").default,
  "flag-martinique": () => require("./emojis/EmojiFlagMartinique").default,
  flamingo: () => require("./emojis/EmojiFlamingo").default,
  flashlight: () => require("./emojis/EmojiFlashlight").default,
  "flat-shoe": () => require("./emojis/EmojiFlatShoe").default,
  flatbread: () => require("./emojis/EmojiFlatbread").default,
  "fleur-de-lis": () => require("./emojis/EmojiFleurDeLis").default,
  "flexed-biceps": () => require("./emojis/EmojiFlexedBiceps").default,
  "flexed-biceps-dark-skin-tone": () => require("./emojis/EmojiFlexedBicepsDarkSkinTone").default,
  "flexed-biceps-light-skin-tone": () => require("./emojis/EmojiFlexedBicepsLightSkinTone").default,
  "flexed-biceps-medium-dark-skin-tone": () =>
    require("./emojis/EmojiFlexedBicepsMediumDarkSkinTone").default,
  "flexed-biceps-medium-light-skin-tone": () =>
    require("./emojis/EmojiFlexedBicepsMediumLightSkinTone").default,
  "flexed-biceps-medium-skin-tone": () =>
    require("./emojis/EmojiFlexedBicepsMediumSkinTone").default,
  "floppy-disk": () => require("./emojis/EmojiFloppyDisk").default,
  "flower-playing-cards": () => require("./emojis/EmojiFlowerPlayingCards").default,
  "flushed-face": () => require("./emojis/EmojiFlushedFace").default,
  flute: () => require("./emojis/EmojiFlute").default,
  fly: () => require("./emojis/EmojiFly").default,
  "flying-disc": () => require("./emojis/EmojiFlyingDisc").default,
  "flying-saucer": () => require("./emojis/EmojiFlyingSaucer").default,
  fog: () => require("./emojis/EmojiFog").default,
  foggy: () => require("./emojis/EmojiFoggy").default,
  "folded-hands": () => require("./emojis/EmojiFoldedHands").default,
  "folded-hands-dark-skin-tone": () => require("./emojis/EmojiFoldedHandsDarkSkinTone").default,
  "folded-hands-light-skin-tone": () => require("./emojis/EmojiFoldedHandsLightSkinTone").default,
  "folded-hands-medium-dark-skin-tone": () =>
    require("./emojis/EmojiFoldedHandsMediumDarkSkinTone").default,
  "folded-hands-medium-light-skin-tone": () =>
    require("./emojis/EmojiFoldedHandsMediumLightSkinTone").default,
  "folded-hands-medium-skin-tone": () => require("./emojis/EmojiFoldedHandsMediumSkinTone").default,
  "folding-hand-fan": () => require("./emojis/EmojiFoldingHandFan").default,
  fondue: () => require("./emojis/EmojiFondue").default,
  foot: () => require("./emojis/EmojiFoot").default,
  "foot-dark-skin-tone": () => require("./emojis/EmojiFootDarkSkinTone").default,
  "foot-light-skin-tone": () => require("./emojis/EmojiFootLightSkinTone").default,
  "foot-medium-dark-skin-tone": () => require("./emojis/EmojiFootMediumDarkSkinTone").default,
  "foot-medium-light-skin-tone": () => require("./emojis/EmojiFootMediumLightSkinTone").default,
  "foot-medium-skin-tone": () => require("./emojis/EmojiFootMediumSkinTone").default,
  footprints: () => require("./emojis/EmojiFootprints").default,
  "fork-and-knife": () => require("./emojis/EmojiForkAndKnife").default,
  "fork-and-knife-with-plate": () => require("./emojis/EmojiForkAndKnifeWithPlate").default,
  "fortune-cookie": () => require("./emojis/EmojiFortuneCookie").default,
  fountain: () => require("./emojis/EmojiFountain").default,
  "fountain-pen": () => require("./emojis/EmojiFountainPen").default,
  "four-leaf-clover": () => require("./emojis/EmojiFourLeafClover").default,
  "four-oclock": () => require("./emojis/EmojiFourOclock").default,
  "four-thirty": () => require("./emojis/EmojiFourThirty").default,
  fox: () => require("./emojis/EmojiFox").default,
  "framed-picture": () => require("./emojis/EmojiFramedPicture").default,
  "free-button": () => require("./emojis/EmojiFreeButton").default,
  "french-fries": () => require("./emojis/EmojiFrenchFries").default,
  "fried-shrimp": () => require("./emojis/EmojiFriedShrimp").default,
  frog: () => require("./emojis/EmojiFrog").default,
  "front-facing-baby-chick": () => require("./emojis/EmojiFrontFacingBabyChick").default,
  "frowning-face": () => require("./emojis/EmojiFrowningFace").default,
  "frowning-face-with-open-mouth": () => require("./emojis/EmojiFrowningFaceWithOpenMouth").default,
  "fuel-pump": () => require("./emojis/EmojiFuelPump").default,
  "full-moon": () => require("./emojis/EmojiFullMoon").default,
  "full-moon-face": () => require("./emojis/EmojiFullMoonFace").default,
  "full-moon-with-face": () => require("./emojis/EmojiFullMoonWithFace").default,
  "funeral-urn": () => require("./emojis/EmojiFuneralUrn").default,
  "game-die": () => require("./emojis/EmojiGameDie").default,
  garlic: () => require("./emojis/EmojiGarlic").default,
  gear: () => require("./emojis/EmojiGear").default,
  "gem-stone": () => require("./emojis/EmojiGemStone").default,
  gemini: () => require("./emojis/EmojiGemini").default,
  genie: () => require("./emojis/EmojiGenie").default,
  ghost: () => require("./emojis/EmojiGhost").default,
  "ginger-root": () => require("./emojis/EmojiGingerRoot").default,
  giraffe: () => require("./emojis/EmojiGiraffe").default,
  girl: () => require("./emojis/EmojiGirl").default,
  "girl-dark-skin-tone": () => require("./emojis/EmojiGirlDarkSkinTone").default,
  "girl-light-skin-tone": () => require("./emojis/EmojiGirlLightSkinTone").default,
  "girl-medium-dark-skin-tone": () => require("./emojis/EmojiGirlMediumDarkSkinTone").default,
  "girl-medium-light-skin-tone": () => require("./emojis/EmojiGirlMediumLightSkinTone").default,
  "girl-medium-skin-tone": () => require("./emojis/EmojiGirlMediumSkinTone").default,
  "glass-of-milk": () => require("./emojis/EmojiGlassOfMilk").default,
  glasses: () => require("./emojis/EmojiGlasses").default,
  "globe-showing-americas": () => require("./emojis/EmojiGlobeShowingAmericas").default,
  "globe-showing-asia-australia": () => require("./emojis/EmojiGlobeShowingAsiaAustralia").default,
  "globe-showing-europe-africa": () => require("./emojis/EmojiGlobeShowingEuropeAfrica").default,
  "globe-with-meridians": () => require("./emojis/EmojiGlobeWithMeridians").default,
  gloves: () => require("./emojis/EmojiGloves").default,
  "glowing-star": () => require("./emojis/EmojiGlowingStar").default,
  "goal-net": () => require("./emojis/EmojiGoalNet").default,
  goat: () => require("./emojis/EmojiGoat").default,
  goblin: () => require("./emojis/EmojiGoblin").default,
  goggles: () => require("./emojis/EmojiGoggles").default,
  goose: () => require("./emojis/EmojiGoose").default,
  gorilla: () => require("./emojis/EmojiGorilla").default,
  "graduation-cap": () => require("./emojis/EmojiGraduationCap").default,
  grapes: () => require("./emojis/EmojiGrapes").default,
  "green-apple": () => require("./emojis/EmojiGreenApple").default,
  "green-book": () => require("./emojis/EmojiGreenBook").default,
  "green-circle": () => require("./emojis/EmojiGreenCircle").default,
  "green-heart": () => require("./emojis/EmojiGreenHeart").default,
  "green-salad": () => require("./emojis/EmojiGreenSalad").default,
  "green-square": () => require("./emojis/EmojiGreenSquare").default,
  "grey-heart": () => require("./emojis/EmojiGreyHeart").default,
  "grimacing-face": () => require("./emojis/EmojiGrimacingFace").default,
  "grinning-cat": () => require("./emojis/EmojiGrinningCat").default,
  "grinning-cat-with-smiling-eyes": () =>
    require("./emojis/EmojiGrinningCatWithSmilingEyes").default,
  "grinning-face": () => require("./emojis/EmojiGrinningFace").default,
  "grinning-face-with-big-eyes": () => require("./emojis/EmojiGrinningFaceWithBigEyes").default,
  "grinning-face-with-smiling-eyes": () =>
    require("./emojis/EmojiGrinningFaceWithSmilingEyes").default,
  "grinning-face-with-sweat": () => require("./emojis/EmojiGrinningFaceWithSweat").default,
  "grinning-squinting-face": () => require("./emojis/EmojiGrinningSquintingFace").default,
  "growing-heart": () => require("./emojis/EmojiGrowingHeart").default,
  guard: () => require("./emojis/EmojiGuard").default,
  "guard-dark-skin-tone": () => require("./emojis/EmojiGuardDarkSkinTone").default,
  "guard-light-skin-tone": () => require("./emojis/EmojiGuardLightSkinTone").default,
  "guard-medium-dark-skin-tone": () => require("./emojis/EmojiGuardMediumDarkSkinTone").default,
  "guard-medium-light-skin-tone": () => require("./emojis/EmojiGuardMediumLightSkinTone").default,
  "guard-medium-skin-tone": () => require("./emojis/EmojiGuardMediumSkinTone").default,
  "guide-dog": () => require("./emojis/EmojiGuideDog").default,
  guitar: () => require("./emojis/EmojiGuitar").default,
  "hair-pick": () => require("./emojis/EmojiHairPick").default,
  "hairy-creature": () => require("./emojis/EmojiHairyCreature").default,
  hamburger: () => require("./emojis/EmojiHamburger").default,
  hammer: () => require("./emojis/EmojiHammer").default,
  "hammer-and-pick": () => require("./emojis/EmojiHammerAndPick").default,
  "hammer-and-wrench": () => require("./emojis/EmojiHammerAndWrench").default,
  hamsa: () => require("./emojis/EmojiHamsa").default,
  hamster: () => require("./emojis/EmojiHamster").default,
  "hand-with-fingers-splayed": () => require("./emojis/EmojiHandWithFingersSplayed").default,
  "hand-with-fingers-splayed-dark-skin-tone": () =>
    require("./emojis/EmojiHandWithFingersSplayedDarkSkinTone").default,
  "hand-with-fingers-splayed-light-skin-tone": () =>
    require("./emojis/EmojiHandWithFingersSplayedLightSkinTone").default,
  "hand-with-fingers-splayed-medium-dark-skin-tone": () =>
    require("./emojis/EmojiHandWithFingersSplayedMediumDarkSkinTone").default,
  "hand-with-fingers-splayed-medium-light-skin-tone": () =>
    require("./emojis/EmojiHandWithFingersSplayedMediumLightSkinTone").default,
  "hand-with-fingers-splayed-medium-skin-tone": () =>
    require("./emojis/EmojiHandWithFingersSplayedMediumSkinTone").default,
  "hand-with-index-finger-and-thumb-crossed": () =>
    require("./emojis/EmojiHandWithIndexFingerAndThumbCrossed").default,
  "hand-with-index-finger-and-thumb-crossed-dark-skin-tone": () =>
    require("./emojis/EmojiHandWithIndexFingerAndThumbCrossedDarkSkinTone").default,
  "hand-with-index-finger-and-thumb-crossed-light-skin-tone": () =>
    require("./emojis/EmojiHandWithIndexFingerAndThumbCrossedLightSkinTone").default,
  "hand-with-index-finger-and-thumb-crossed-medium-dark-skin-tone": () =>
    require("./emojis/EmojiHandWithIndexFingerAndThumbCrossedMediumDarkSkinTone").default,
  "hand-with-index-finger-and-thumb-crossed-medium-light-skin-tone": () =>
    require("./emojis/EmojiHandWithIndexFingerAndThumbCrossedMediumLightSkinTone").default,
  "hand-with-index-finger-and-thumb-crossed-medium-skin-tone": () =>
    require("./emojis/EmojiHandWithIndexFingerAndThumbCrossedMediumSkinTone").default,
  handbag: () => require("./emojis/EmojiHandbag").default,
  handshake: () => require("./emojis/EmojiHandshake").default,
  "handshake-dark-skin-tone": () => require("./emojis/EmojiHandshakeDarkSkinTone").default,
  "handshake-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiHandshakeDarkSkinToneLightSkinTone").default,
  "handshake-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiHandshakeDarkSkinToneMediumDarkSkinTone").default,
  "handshake-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiHandshakeDarkSkinToneMediumLightSkinTone").default,
  "handshake-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiHandshakeDarkSkinToneMediumSkinTone").default,
  "handshake-light-skin-tone": () => require("./emojis/EmojiHandshakeLightSkinTone").default,
  "handshake-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiHandshakeLightSkinToneDarkSkinTone").default,
  "handshake-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiHandshakeLightSkinToneMediumDarkSkinTone").default,
  "handshake-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiHandshakeLightSkinToneMediumLightSkinTone").default,
  "handshake-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiHandshakeLightSkinToneMediumSkinTone").default,
  "handshake-medium-dark-skin-tone": () =>
    require("./emojis/EmojiHandshakeMediumDarkSkinTone").default,
  "handshake-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiHandshakeMediumDarkSkinToneDarkSkinTone").default,
  "handshake-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiHandshakeMediumDarkSkinToneLightSkinTone").default,
  "handshake-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiHandshakeMediumDarkSkinToneMediumLightSkinTone").default,
  "handshake-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiHandshakeMediumDarkSkinToneMediumSkinTone").default,
  "handshake-medium-light-skin-tone": () =>
    require("./emojis/EmojiHandshakeMediumLightSkinTone").default,
  "handshake-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiHandshakeMediumLightSkinToneDarkSkinTone").default,
  "handshake-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiHandshakeMediumLightSkinToneLightSkinTone").default,
  "handshake-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiHandshakeMediumLightSkinToneMediumDarkSkinTone").default,
  "handshake-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiHandshakeMediumLightSkinToneMediumSkinTone").default,
  "handshake-medium-skin-tone": () => require("./emojis/EmojiHandshakeMediumSkinTone").default,
  "handshake-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiHandshakeMediumSkinToneDarkSkinTone").default,
  "handshake-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiHandshakeMediumSkinToneLightSkinTone").default,
  "handshake-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiHandshakeMediumSkinToneMediumDarkSkinTone").default,
  "handshake-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiHandshakeMediumSkinToneMediumLightSkinTone").default,
  harp: () => require("./emojis/EmojiHarp").default,
  "hatching-chick": () => require("./emojis/EmojiHatchingChick").default,
  "head-shaking-horizontally": () => require("./emojis/EmojiHeadShakingHorizontally").default,
  "head-shaking-vertically": () => require("./emojis/EmojiHeadShakingVertically").default,
  headphone: () => require("./emojis/EmojiHeadphone").default,
  headstone: () => require("./emojis/EmojiHeadstone").default,
  "health-worker": () => require("./emojis/EmojiHealthWorker").default,
  "health-worker-dark-skin-tone": () => require("./emojis/EmojiHealthWorkerDarkSkinTone").default,
  "health-worker-light-skin-tone": () => require("./emojis/EmojiHealthWorkerLightSkinTone").default,
  "health-worker-medium-dark-skin-tone": () =>
    require("./emojis/EmojiHealthWorkerMediumDarkSkinTone").default,
  "health-worker-medium-light-skin-tone": () =>
    require("./emojis/EmojiHealthWorkerMediumLightSkinTone").default,
  "health-worker-medium-skin-tone": () =>
    require("./emojis/EmojiHealthWorkerMediumSkinTone").default,
  "hear-no-evil-monkey": () => require("./emojis/EmojiHearNoEvilMonkey").default,
  "heart-decoration": () => require("./emojis/EmojiHeartDecoration").default,
  "heart-exclamation": () => require("./emojis/EmojiHeartExclamation").default,
  "heart-hands": () => require("./emojis/EmojiHeartHands").default,
  "heart-hands-dark-skin-tone": () => require("./emojis/EmojiHeartHandsDarkSkinTone").default,
  "heart-hands-light-skin-tone": () => require("./emojis/EmojiHeartHandsLightSkinTone").default,
  "heart-hands-medium-dark-skin-tone": () =>
    require("./emojis/EmojiHeartHandsMediumDarkSkinTone").default,
  "heart-hands-medium-light-skin-tone": () =>
    require("./emojis/EmojiHeartHandsMediumLightSkinTone").default,
  "heart-hands-medium-skin-tone": () => require("./emojis/EmojiHeartHandsMediumSkinTone").default,
  "heart-on-fire": () => require("./emojis/EmojiHeartOnFire").default,
  "heart-suit": () => require("./emojis/EmojiHeartSuit").default,
  "heart-with-arrow": () => require("./emojis/EmojiHeartWithArrow").default,
  "heart-with-ribbon": () => require("./emojis/EmojiHeartWithRibbon").default,
  "heavy-dollar-sign": () => require("./emojis/EmojiHeavyDollarSign").default,
  "heavy-equals-sign": () => require("./emojis/EmojiHeavyEqualsSign").default,
  hedgehog: () => require("./emojis/EmojiHedgehog").default,
  helicopter: () => require("./emojis/EmojiHelicopter").default,
  herb: () => require("./emojis/EmojiHerb").default,
  hibiscus: () => require("./emojis/EmojiHibiscus").default,
  "high-heeled-shoe": () => require("./emojis/EmojiHighHeeledShoe").default,
  "high-speed-train": () => require("./emojis/EmojiHighSpeedTrain").default,
  "high-voltage": () => require("./emojis/EmojiHighVoltage").default,
  "hiking-boot": () => require("./emojis/EmojiHikingBoot").default,
  "hindu-temple": () => require("./emojis/EmojiHinduTemple").default,
  hippopotamus: () => require("./emojis/EmojiHippopotamus").default,
  hole: () => require("./emojis/EmojiHole").default,
  "hollow-red-circle": () => require("./emojis/EmojiHollowRedCircle").default,
  "honey-pot": () => require("./emojis/EmojiHoneyPot").default,
  honeybee: () => require("./emojis/EmojiHoneybee").default,
  hook: () => require("./emojis/EmojiHook").default,
  "horizontal-traffic-light": () => require("./emojis/EmojiHorizontalTrafficLight").default,
  horse: () => require("./emojis/EmojiHorse").default,
  "horse-face": () => require("./emojis/EmojiHorseFace").default,
  "horse-racing": () => require("./emojis/EmojiHorseRacing").default,
  "horse-racing-dark-skin-tone": () => require("./emojis/EmojiHorseRacingDarkSkinTone").default,
  "horse-racing-light-skin-tone": () => require("./emojis/EmojiHorseRacingLightSkinTone").default,
  "horse-racing-medium-dark-skin-tone": () =>
    require("./emojis/EmojiHorseRacingMediumDarkSkinTone").default,
  "horse-racing-medium-light-skin-tone": () =>
    require("./emojis/EmojiHorseRacingMediumLightSkinTone").default,
  "horse-racing-medium-skin-tone": () => require("./emojis/EmojiHorseRacingMediumSkinTone").default,
  hospital: () => require("./emojis/EmojiHospital").default,
  "hot-beverage": () => require("./emojis/EmojiHotBeverage").default,
  "hot-dog": () => require("./emojis/EmojiHotDog").default,
  "hot-face": () => require("./emojis/EmojiHotFace").default,
  "hot-pepper": () => require("./emojis/EmojiHotPepper").default,
  "hot-springs": () => require("./emojis/EmojiHotSprings").default,
  hotel: () => require("./emojis/EmojiHotel").default,
  "hourglass-done": () => require("./emojis/EmojiHourglassDone").default,
  "hourglass-not-done": () => require("./emojis/EmojiHourglassNotDone").default,
  house: () => require("./emojis/EmojiHouse").default,
  "house-with-garden": () => require("./emojis/EmojiHouseWithGarden").default,
  houses: () => require("./emojis/EmojiHouses").default,
  "hugging-face": () => require("./emojis/EmojiHuggingFace").default,
  "hundred-points": () => require("./emojis/EmojiHundredPoints").default,
  "hushed-face": () => require("./emojis/EmojiHushedFace").default,
  hut: () => require("./emojis/EmojiHut").default,
  hyacinth: () => require("./emojis/EmojiHyacinth").default,
  ice: () => require("./emojis/EmojiIce").default,
  "ice-cream": () => require("./emojis/EmojiIceCream").default,
  "ice-hockey": () => require("./emojis/EmojiIceHockey").default,
  "ice-skate": () => require("./emojis/EmojiIceSkate").default,
  "id-button": () => require("./emojis/EmojiIdButton").default,
  "identification-card": () => require("./emojis/EmojiIdentificationCard").default,
  "inbox-tray": () => require("./emojis/EmojiInboxTray").default,
  "incoming-envelope": () => require("./emojis/EmojiIncomingEnvelope").default,
  "index-pointing-at-the-viewer": () => require("./emojis/EmojiIndexPointingAtTheViewer").default,
  "index-pointing-at-the-viewer-dark-skin-tone": () =>
    require("./emojis/EmojiIndexPointingAtTheViewerDarkSkinTone").default,
  "index-pointing-at-the-viewer-light-skin-tone": () =>
    require("./emojis/EmojiIndexPointingAtTheViewerLightSkinTone").default,
  "index-pointing-at-the-viewer-medium-dark-skin-tone": () =>
    require("./emojis/EmojiIndexPointingAtTheViewerMediumDarkSkinTone").default,
  "index-pointing-at-the-viewer-medium-light-skin-tone": () =>
    require("./emojis/EmojiIndexPointingAtTheViewerMediumLightSkinTone").default,
  "index-pointing-at-the-viewer-medium-skin-tone": () =>
    require("./emojis/EmojiIndexPointingAtTheViewerMediumSkinTone").default,
  "index-pointing-up": () => require("./emojis/EmojiIndexPointingUp").default,
  "index-pointing-up-dark-skin-tone": () =>
    require("./emojis/EmojiIndexPointingUpDarkSkinTone").default,
  "index-pointing-up-light-skin-tone": () =>
    require("./emojis/EmojiIndexPointingUpLightSkinTone").default,
  "index-pointing-up-medium-dark-skin-tone": () =>
    require("./emojis/EmojiIndexPointingUpMediumDarkSkinTone").default,
  "index-pointing-up-medium-light-skin-tone": () =>
    require("./emojis/EmojiIndexPointingUpMediumLightSkinTone").default,
  "index-pointing-up-medium-skin-tone": () =>
    require("./emojis/EmojiIndexPointingUpMediumSkinTone").default,
  infinity: () => require("./emojis/EmojiInfinity").default,
  information: () => require("./emojis/EmojiInformation").default,
  "input-latin-letters": () => require("./emojis/EmojiInputLatinLetters").default,
  "input-latin-lowercase": () => require("./emojis/EmojiInputLatinLowercase").default,
  "input-latin-uppercase": () => require("./emojis/EmojiInputLatinUppercase").default,
  "input-numbers": () => require("./emojis/EmojiInputNumbers").default,
  "input-symbols": () => require("./emojis/EmojiInputSymbols").default,
  "jack-o-lantern": () => require("./emojis/EmojiJackOLantern").default,
  "japanese-acceptable-button": () => require("./emojis/EmojiJapaneseAcceptableButton").default,
  "japanese-application-button": () => require("./emojis/EmojiJapaneseApplicationButton").default,
  "japanese-bargain-button": () => require("./emojis/EmojiJapaneseBargainButton").default,
  "japanese-castle": () => require("./emojis/EmojiJapaneseCastle").default,
  "japanese-congratulations-button": () =>
    require("./emojis/EmojiJapaneseCongratulationsButton").default,
  "japanese-discount-button": () => require("./emojis/EmojiJapaneseDiscountButton").default,
  "japanese-dolls": () => require("./emojis/EmojiJapaneseDolls").default,
  "japanese-free-of-charge-button": () =>
    require("./emojis/EmojiJapaneseFreeOfChargeButton").default,
  "japanese-here-button": () => require("./emojis/EmojiJapaneseHereButton").default,
  "japanese-monthly-amount-button": () =>
    require("./emojis/EmojiJapaneseMonthlyAmountButton").default,
  "japanese-no-vacancy-button": () => require("./emojis/EmojiJapaneseNoVacancyButton").default,
  "japanese-not-free-of-charge-button": () =>
    require("./emojis/EmojiJapaneseNotFreeOfChargeButton").default,
  "japanese-open-for-business-button": () =>
    require("./emojis/EmojiJapaneseOpenForBusinessButton").default,
  "japanese-passing-grade-button": () =>
    require("./emojis/EmojiJapanesePassingGradeButton").default,
  "japanese-post-office": () => require("./emojis/EmojiJapanesePostOffice").default,
  "japanese-prohibited-button": () => require("./emojis/EmojiJapaneseProhibitedButton").default,
  "japanese-reserved-button": () => require("./emojis/EmojiJapaneseReservedButton").default,
  "japanese-secret-button": () => require("./emojis/EmojiJapaneseSecretButton").default,
  "japanese-service-charge-button": () =>
    require("./emojis/EmojiJapaneseServiceChargeButton").default,
  "japanese-symbol-for-beginner": () => require("./emojis/EmojiJapaneseSymbolForBeginner").default,
  "japanese-vacancy-button": () => require("./emojis/EmojiJapaneseVacancyButton").default,
  jar: () => require("./emojis/EmojiJar").default,
  jeans: () => require("./emojis/EmojiJeans").default,
  jellyfish: () => require("./emojis/EmojiJellyfish").default,
  joker: () => require("./emojis/EmojiJoker").default,
  joystick: () => require("./emojis/EmojiJoystick").default,
  judge: () => require("./emojis/EmojiJudge").default,
  "judge-dark-skin-tone": () => require("./emojis/EmojiJudgeDarkSkinTone").default,
  "judge-light-skin-tone": () => require("./emojis/EmojiJudgeLightSkinTone").default,
  "judge-medium-dark-skin-tone": () => require("./emojis/EmojiJudgeMediumDarkSkinTone").default,
  "judge-medium-light-skin-tone": () => require("./emojis/EmojiJudgeMediumLightSkinTone").default,
  "judge-medium-skin-tone": () => require("./emojis/EmojiJudgeMediumSkinTone").default,
  kaaba: () => require("./emojis/EmojiKaaba").default,
  kangaroo: () => require("./emojis/EmojiKangaroo").default,
  key: () => require("./emojis/EmojiKey").default,
  keyboard: () => require("./emojis/EmojiKeyboard").default,
  keycap: () => require("./emojis/EmojiKeycap").default,
  "keycap-0": () => require("./emojis/EmojiKeycap0").default,
  "keycap-1": () => require("./emojis/EmojiKeycap1").default,
  "keycap-10": () => require("./emojis/EmojiKeycap10").default,
  "keycap-2": () => require("./emojis/EmojiKeycap2").default,
  "keycap-3": () => require("./emojis/EmojiKeycap3").default,
  "keycap-4": () => require("./emojis/EmojiKeycap4").default,
  "keycap-5": () => require("./emojis/EmojiKeycap5").default,
  "keycap-6": () => require("./emojis/EmojiKeycap6").default,
  "keycap-7": () => require("./emojis/EmojiKeycap7").default,
  "keycap-8": () => require("./emojis/EmojiKeycap8").default,
  "keycap-9": () => require("./emojis/EmojiKeycap9").default,
  "keycap-asterisk": () => require("./emojis/EmojiKeycapAsterisk").default,
  "keycap-pound": () => require("./emojis/EmojiKeycapPound").default,
  khanda: () => require("./emojis/EmojiKhanda").default,
  "kick-scooter": () => require("./emojis/EmojiKickScooter").default,
  kimono: () => require("./emojis/EmojiKimono").default,
  kiss: () => require("./emojis/EmojiKiss").default,
  "kiss-dark-skin-tone": () => require("./emojis/EmojiKissDarkSkinTone").default,
  "kiss-light-skin-tone": () => require("./emojis/EmojiKissLightSkinTone").default,
  "kiss-man-man": () => require("./emojis/EmojiKissManMan").default,
  "kiss-man-man-dark-skin-tone": () => require("./emojis/EmojiKissManManDarkSkinTone").default,
  "kiss-man-man-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiKissManManDarkSkinToneLightSkinTone").default,
  "kiss-man-man-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissManManDarkSkinToneMediumDarkSkinTone").default,
  "kiss-man-man-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissManManDarkSkinToneMediumLightSkinTone").default,
  "kiss-man-man-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiKissManManDarkSkinToneMediumSkinTone").default,
  "kiss-man-man-light-skin-tone": () => require("./emojis/EmojiKissManManLightSkinTone").default,
  "kiss-man-man-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiKissManManLightSkinToneDarkSkinTone").default,
  "kiss-man-man-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissManManLightSkinToneMediumDarkSkinTone").default,
  "kiss-man-man-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissManManLightSkinToneMediumLightSkinTone").default,
  "kiss-man-man-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiKissManManLightSkinToneMediumSkinTone").default,
  "kiss-man-man-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissManManMediumDarkSkinTone").default,
  "kiss-man-man-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiKissManManMediumDarkSkinToneDarkSkinTone").default,
  "kiss-man-man-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiKissManManMediumDarkSkinToneLightSkinTone").default,
  "kiss-man-man-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissManManMediumDarkSkinToneMediumLightSkinTone").default,
  "kiss-man-man-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiKissManManMediumDarkSkinToneMediumSkinTone").default,
  "kiss-man-man-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissManManMediumLightSkinTone").default,
  "kiss-man-man-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiKissManManMediumLightSkinToneDarkSkinTone").default,
  "kiss-man-man-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiKissManManMediumLightSkinToneLightSkinTone").default,
  "kiss-man-man-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissManManMediumLightSkinToneMediumDarkSkinTone").default,
  "kiss-man-man-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiKissManManMediumLightSkinToneMediumSkinTone").default,
  "kiss-man-man-medium-skin-tone": () => require("./emojis/EmojiKissManManMediumSkinTone").default,
  "kiss-man-man-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiKissManManMediumSkinToneDarkSkinTone").default,
  "kiss-man-man-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiKissManManMediumSkinToneLightSkinTone").default,
  "kiss-man-man-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissManManMediumSkinToneMediumDarkSkinTone").default,
  "kiss-man-man-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissManManMediumSkinToneMediumLightSkinTone").default,
  "kiss-mark": () => require("./emojis/EmojiKissMark").default,
  "kiss-medium-dark-skin-tone": () => require("./emojis/EmojiKissMediumDarkSkinTone").default,
  "kiss-medium-light-skin-tone": () => require("./emojis/EmojiKissMediumLightSkinTone").default,
  "kiss-medium-skin-tone": () => require("./emojis/EmojiKissMediumSkinTone").default,
  "kiss-person-person-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonDarkSkinToneLightSkinTone").default,
  "kiss-person-person-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonDarkSkinToneMediumDarkSkinTone").default,
  "kiss-person-person-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonDarkSkinToneMediumLightSkinTone").default,
  "kiss-person-person-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonDarkSkinToneMediumSkinTone").default,
  "kiss-person-person-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonLightSkinToneDarkSkinTone").default,
  "kiss-person-person-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonLightSkinToneMediumDarkSkinTone").default,
  "kiss-person-person-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonLightSkinToneMediumLightSkinTone").default,
  "kiss-person-person-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonLightSkinToneMediumSkinTone").default,
  "kiss-person-person-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonMediumDarkSkinToneDarkSkinTone").default,
  "kiss-person-person-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonMediumDarkSkinToneLightSkinTone").default,
  "kiss-person-person-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonMediumDarkSkinToneMediumLightSkinTone").default,
  "kiss-person-person-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonMediumDarkSkinToneMediumSkinTone").default,
  "kiss-person-person-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonMediumLightSkinToneDarkSkinTone").default,
  "kiss-person-person-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonMediumLightSkinToneLightSkinTone").default,
  "kiss-person-person-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonMediumLightSkinToneMediumDarkSkinTone").default,
  "kiss-person-person-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonMediumLightSkinToneMediumSkinTone").default,
  "kiss-person-person-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonMediumSkinToneDarkSkinTone").default,
  "kiss-person-person-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonMediumSkinToneLightSkinTone").default,
  "kiss-person-person-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonMediumSkinToneMediumDarkSkinTone").default,
  "kiss-person-person-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissPersonPersonMediumSkinToneMediumLightSkinTone").default,
  "kiss-woman-man": () => require("./emojis/EmojiKissWomanMan").default,
  "kiss-woman-man-dark-skin-tone": () => require("./emojis/EmojiKissWomanManDarkSkinTone").default,
  "kiss-woman-man-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanManDarkSkinToneLightSkinTone").default,
  "kiss-woman-man-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanManDarkSkinToneMediumDarkSkinTone").default,
  "kiss-woman-man-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanManDarkSkinToneMediumLightSkinTone").default,
  "kiss-woman-man-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiKissWomanManDarkSkinToneMediumSkinTone").default,
  "kiss-woman-man-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanManLightSkinTone").default,
  "kiss-woman-man-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanManLightSkinToneDarkSkinTone").default,
  "kiss-woman-man-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanManLightSkinToneMediumDarkSkinTone").default,
  "kiss-woman-man-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanManLightSkinToneMediumLightSkinTone").default,
  "kiss-woman-man-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiKissWomanManLightSkinToneMediumSkinTone").default,
  "kiss-woman-man-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanManMediumDarkSkinTone").default,
  "kiss-woman-man-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanManMediumDarkSkinToneDarkSkinTone").default,
  "kiss-woman-man-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanManMediumDarkSkinToneLightSkinTone").default,
  "kiss-woman-man-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanManMediumDarkSkinToneMediumLightSkinTone").default,
  "kiss-woman-man-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiKissWomanManMediumDarkSkinToneMediumSkinTone").default,
  "kiss-woman-man-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanManMediumLightSkinTone").default,
  "kiss-woman-man-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanManMediumLightSkinToneDarkSkinTone").default,
  "kiss-woman-man-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanManMediumLightSkinToneLightSkinTone").default,
  "kiss-woman-man-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanManMediumLightSkinToneMediumDarkSkinTone").default,
  "kiss-woman-man-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiKissWomanManMediumLightSkinToneMediumSkinTone").default,
  "kiss-woman-man-medium-skin-tone": () =>
    require("./emojis/EmojiKissWomanManMediumSkinTone").default,
  "kiss-woman-man-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanManMediumSkinToneDarkSkinTone").default,
  "kiss-woman-man-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanManMediumSkinToneLightSkinTone").default,
  "kiss-woman-man-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanManMediumSkinToneMediumDarkSkinTone").default,
  "kiss-woman-man-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanManMediumSkinToneMediumLightSkinTone").default,
  "kiss-woman-woman": () => require("./emojis/EmojiKissWomanWoman").default,
  "kiss-woman-woman-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanDarkSkinTone").default,
  "kiss-woman-woman-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanDarkSkinToneLightSkinTone").default,
  "kiss-woman-woman-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanDarkSkinToneMediumDarkSkinTone").default,
  "kiss-woman-woman-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanDarkSkinToneMediumLightSkinTone").default,
  "kiss-woman-woman-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanDarkSkinToneMediumSkinTone").default,
  "kiss-woman-woman-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanLightSkinTone").default,
  "kiss-woman-woman-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanLightSkinToneDarkSkinTone").default,
  "kiss-woman-woman-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanLightSkinToneMediumDarkSkinTone").default,
  "kiss-woman-woman-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanLightSkinToneMediumLightSkinTone").default,
  "kiss-woman-woman-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanLightSkinToneMediumSkinTone").default,
  "kiss-woman-woman-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanMediumDarkSkinTone").default,
  "kiss-woman-woman-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanMediumDarkSkinToneDarkSkinTone").default,
  "kiss-woman-woman-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanMediumDarkSkinToneLightSkinTone").default,
  "kiss-woman-woman-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanMediumDarkSkinToneMediumLightSkinTone").default,
  "kiss-woman-woman-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanMediumDarkSkinToneMediumSkinTone").default,
  "kiss-woman-woman-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanMediumLightSkinTone").default,
  "kiss-woman-woman-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanMediumLightSkinToneDarkSkinTone").default,
  "kiss-woman-woman-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanMediumLightSkinToneLightSkinTone").default,
  "kiss-woman-woman-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanMediumLightSkinToneMediumDarkSkinTone").default,
  "kiss-woman-woman-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanMediumLightSkinToneMediumSkinTone").default,
  "kiss-woman-woman-medium-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanMediumSkinTone").default,
  "kiss-woman-woman-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanMediumSkinToneDarkSkinTone").default,
  "kiss-woman-woman-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanMediumSkinToneLightSkinTone").default,
  "kiss-woman-woman-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanMediumSkinToneMediumDarkSkinTone").default,
  "kiss-woman-woman-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiKissWomanWomanMediumSkinToneMediumLightSkinTone").default,
  "kissing-cat": () => require("./emojis/EmojiKissingCat").default,
  "kissing-face": () => require("./emojis/EmojiKissingFace").default,
  "kissing-face-with-closed-eyes": () => require("./emojis/EmojiKissingFaceWithClosedEyes").default,
  "kissing-face-with-smiling-eyes": () =>
    require("./emojis/EmojiKissingFaceWithSmilingEyes").default,
  "kitchen-knife": () => require("./emojis/EmojiKitchenKnife").default,
  kite: () => require("./emojis/EmojiKite").default,
  "kiwi-fruit": () => require("./emojis/EmojiKiwiFruit").default,
  "knocked-out-face": () => require("./emojis/EmojiKnockedOutFace").default,
  knot: () => require("./emojis/EmojiKnot").default,
  koala: () => require("./emojis/EmojiKoala").default,
  "lab-coat": () => require("./emojis/EmojiLabCoat").default,
  label: () => require("./emojis/EmojiLabel").default,
  lacrosse: () => require("./emojis/EmojiLacrosse").default,
  ladder: () => require("./emojis/EmojiLadder").default,
  "lady-beetle": () => require("./emojis/EmojiLadyBeetle").default,
  landslide: () => require("./emojis/EmojiLandslide").default,
  laptop: () => require("./emojis/EmojiLaptop").default,
  "large-blue-diamond": () => require("./emojis/EmojiLargeBlueDiamond").default,
  "large-orange-diamond": () => require("./emojis/EmojiLargeOrangeDiamond").default,
  "last-quarter-moon": () => require("./emojis/EmojiLastQuarterMoon").default,
  "last-quarter-moon-face": () => require("./emojis/EmojiLastQuarterMoonFace").default,
  "last-quarter-moon-with-face": () => require("./emojis/EmojiLastQuarterMoonWithFace").default,
  "last-track-button": () => require("./emojis/EmojiLastTrackButton").default,
  "latin-cross": () => require("./emojis/EmojiLatinCross").default,
  "leaf-fluttering-in-wind": () => require("./emojis/EmojiLeafFlutteringInWind").default,
  "leafless-tree": () => require("./emojis/EmojiLeaflessTree").default,
  "leafy-green": () => require("./emojis/EmojiLeafyGreen").default,
  ledger: () => require("./emojis/EmojiLedger").default,
  "left-arrow": () => require("./emojis/EmojiLeftArrow").default,
  "left-arrow-curving-right": () => require("./emojis/EmojiLeftArrowCurvingRight").default,
  "left-facing-fist": () => require("./emojis/EmojiLeftFacingFist").default,
  "left-facing-fist-dark-skin-tone": () =>
    require("./emojis/EmojiLeftFacingFistDarkSkinTone").default,
  "left-facing-fist-light-skin-tone": () =>
    require("./emojis/EmojiLeftFacingFistLightSkinTone").default,
  "left-facing-fist-medium-dark-skin-tone": () =>
    require("./emojis/EmojiLeftFacingFistMediumDarkSkinTone").default,
  "left-facing-fist-medium-light-skin-tone": () =>
    require("./emojis/EmojiLeftFacingFistMediumLightSkinTone").default,
  "left-facing-fist-medium-skin-tone": () =>
    require("./emojis/EmojiLeftFacingFistMediumSkinTone").default,
  "left-luggage": () => require("./emojis/EmojiLeftLuggage").default,
  "left-pointing-magnifying-glass": () =>
    require("./emojis/EmojiLeftPointingMagnifyingGlass").default,
  "left-right-arrow": () => require("./emojis/EmojiLeftRightArrow").default,
  "left-speech-bubble": () => require("./emojis/EmojiLeftSpeechBubble").default,
  "leftwards-hand": () => require("./emojis/EmojiLeftwardsHand").default,
  "leftwards-hand-dark-skin-tone": () => require("./emojis/EmojiLeftwardsHandDarkSkinTone").default,
  "leftwards-hand-light-skin-tone": () =>
    require("./emojis/EmojiLeftwardsHandLightSkinTone").default,
  "leftwards-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiLeftwardsHandMediumDarkSkinTone").default,
  "leftwards-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiLeftwardsHandMediumLightSkinTone").default,
  "leftwards-hand-medium-skin-tone": () =>
    require("./emojis/EmojiLeftwardsHandMediumSkinTone").default,
  "leftwards-pushing-hand": () => require("./emojis/EmojiLeftwardsPushingHand").default,
  "leftwards-pushing-hand-dark-skin-tone": () =>
    require("./emojis/EmojiLeftwardsPushingHandDarkSkinTone").default,
  "leftwards-pushing-hand-light-skin-tone": () =>
    require("./emojis/EmojiLeftwardsPushingHandLightSkinTone").default,
  "leftwards-pushing-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiLeftwardsPushingHandMediumDarkSkinTone").default,
  "leftwards-pushing-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiLeftwardsPushingHandMediumLightSkinTone").default,
  "leftwards-pushing-hand-medium-skin-tone": () =>
    require("./emojis/EmojiLeftwardsPushingHandMediumSkinTone").default,
  leg: () => require("./emojis/EmojiLeg").default,
  "leg-dark-skin-tone": () => require("./emojis/EmojiLegDarkSkinTone").default,
  "leg-light-skin-tone": () => require("./emojis/EmojiLegLightSkinTone").default,
  "leg-medium-dark-skin-tone": () => require("./emojis/EmojiLegMediumDarkSkinTone").default,
  "leg-medium-light-skin-tone": () => require("./emojis/EmojiLegMediumLightSkinTone").default,
  "leg-medium-skin-tone": () => require("./emojis/EmojiLegMediumSkinTone").default,
  lemon: () => require("./emojis/EmojiLemon").default,
  leo: () => require("./emojis/EmojiLeo").default,
  leopard: () => require("./emojis/EmojiLeopard").default,
  "letter-a": () => require("./emojis/EmojiLetterA").default,
  "letter-b": () => require("./emojis/EmojiLetterB").default,
  "letter-c": () => require("./emojis/EmojiLetterC").default,
  "letter-d": () => require("./emojis/EmojiLetterD").default,
  "letter-e": () => require("./emojis/EmojiLetterE").default,
  "letter-f": () => require("./emojis/EmojiLetterF").default,
  "letter-g": () => require("./emojis/EmojiLetterG").default,
  "letter-h": () => require("./emojis/EmojiLetterH").default,
  "letter-i": () => require("./emojis/EmojiLetterI").default,
  "letter-j": () => require("./emojis/EmojiLetterJ").default,
  "letter-k": () => require("./emojis/EmojiLetterK").default,
  "letter-l": () => require("./emojis/EmojiLetterL").default,
  "letter-m": () => require("./emojis/EmojiLetterM").default,
  "letter-n": () => require("./emojis/EmojiLetterN").default,
  "letter-o": () => require("./emojis/EmojiLetterO").default,
  "letter-p": () => require("./emojis/EmojiLetterP").default,
  "letter-q": () => require("./emojis/EmojiLetterQ").default,
  "letter-r": () => require("./emojis/EmojiLetterR").default,
  "letter-s": () => require("./emojis/EmojiLetterS").default,
  "letter-t": () => require("./emojis/EmojiLetterT").default,
  "letter-u": () => require("./emojis/EmojiLetterU").default,
  "letter-v": () => require("./emojis/EmojiLetterV").default,
  "letter-w": () => require("./emojis/EmojiLetterW").default,
  "letter-x": () => require("./emojis/EmojiLetterX").default,
  "letter-y": () => require("./emojis/EmojiLetterY").default,
  "letter-z": () => require("./emojis/EmojiLetterZ").default,
  "level-slider": () => require("./emojis/EmojiLevelSlider").default,
  libra: () => require("./emojis/EmojiLibra").default,
  "light-blue-heart": () => require("./emojis/EmojiLightBlueHeart").default,
  "light-bulb": () => require("./emojis/EmojiLightBulb").default,
  "light-rail": () => require("./emojis/EmojiLightRail").default,
  "light-skin-tone": () => require("./emojis/EmojiLightSkinTone").default,
  lime: () => require("./emojis/EmojiLime").default,
  link: () => require("./emojis/EmojiLink").default,
  "linked-paperclips": () => require("./emojis/EmojiLinkedPaperclips").default,
  lion: () => require("./emojis/EmojiLion").default,
  lipstick: () => require("./emojis/EmojiLipstick").default,
  "litter-in-bin-sign": () => require("./emojis/EmojiLitterInBinSign").default,
  lizard: () => require("./emojis/EmojiLizard").default,
  llama: () => require("./emojis/EmojiLlama").default,
  lobster: () => require("./emojis/EmojiLobster").default,
  locked: () => require("./emojis/EmojiLocked").default,
  "locked-with-key": () => require("./emojis/EmojiLockedWithKey").default,
  "locked-with-pen": () => require("./emojis/EmojiLockedWithPen").default,
  locomotive: () => require("./emojis/EmojiLocomotive").default,
  lollipop: () => require("./emojis/EmojiLollipop").default,
  "long-drum": () => require("./emojis/EmojiLongDrum").default,
  "lotion-bottle": () => require("./emojis/EmojiLotionBottle").default,
  lotus: () => require("./emojis/EmojiLotus").default,
  "loudly-crying-face": () => require("./emojis/EmojiLoudlyCryingFace").default,
  loudspeaker: () => require("./emojis/EmojiLoudspeaker").default,
  "love-hotel": () => require("./emojis/EmojiLoveHotel").default,
  "love-letter": () => require("./emojis/EmojiLoveLetter").default,
  "love-you-gesture": () => require("./emojis/EmojiLoveYouGesture").default,
  "love-you-gesture-dark-skin-tone": () =>
    require("./emojis/EmojiLoveYouGestureDarkSkinTone").default,
  "love-you-gesture-light-skin-tone": () =>
    require("./emojis/EmojiLoveYouGestureLightSkinTone").default,
  "love-you-gesture-medium-dark-skin-tone": () =>
    require("./emojis/EmojiLoveYouGestureMediumDarkSkinTone").default,
  "love-you-gesture-medium-light-skin-tone": () =>
    require("./emojis/EmojiLoveYouGestureMediumLightSkinTone").default,
  "love-you-gesture-medium-skin-tone": () =>
    require("./emojis/EmojiLoveYouGestureMediumSkinTone").default,
  "love-you-gesture-tone1": () => require("./emojis/EmojiLoveYouGestureTone1").default,
  "love-you-gesture-tone2": () => require("./emojis/EmojiLoveYouGestureTone2").default,
  "love-you-gesture-tone3": () => require("./emojis/EmojiLoveYouGestureTone3").default,
  "love-you-gesture-tone4": () => require("./emojis/EmojiLoveYouGestureTone4").default,
  "love-you-gesture-tone5": () => require("./emojis/EmojiLoveYouGestureTone5").default,
  "low-battery": () => require("./emojis/EmojiLowBattery").default,
  luggage: () => require("./emojis/EmojiLuggage").default,
  lungs: () => require("./emojis/EmojiLungs").default,
  "lying-face": () => require("./emojis/EmojiLyingFace").default,
  mage: () => require("./emojis/EmojiMage").default,
  "mage-dark-skin-tone": () => require("./emojis/EmojiMageDarkSkinTone").default,
  "mage-light-skin-tone": () => require("./emojis/EmojiMageLightSkinTone").default,
  "mage-medium-dark-skin-tone": () => require("./emojis/EmojiMageMediumDarkSkinTone").default,
  "mage-medium-light-skin-tone": () => require("./emojis/EmojiMageMediumLightSkinTone").default,
  "mage-medium-skin-tone": () => require("./emojis/EmojiMageMediumSkinTone").default,
  "magic-wand": () => require("./emojis/EmojiMagicWand").default,
  magnet: () => require("./emojis/EmojiMagnet").default,
  "magnifying-glass-tilted-left": () => require("./emojis/EmojiMagnifyingGlassTiltedLeft").default,
  "magnifying-glass-tilted-right": () =>
    require("./emojis/EmojiMagnifyingGlassTiltedRight").default,
  "mahjong-red-dragon": () => require("./emojis/EmojiMahjongRedDragon").default,
  "male-sign": () => require("./emojis/EmojiMaleSign").default,
  mammoth: () => require("./emojis/EmojiMammoth").default,
  man: () => require("./emojis/EmojiMan").default,
  "man-artist": () => require("./emojis/EmojiManArtist").default,
  "man-artist-dark-skin-tone": () => require("./emojis/EmojiManArtistDarkSkinTone").default,
  "man-artist-light-skin-tone": () => require("./emojis/EmojiManArtistLightSkinTone").default,
  "man-artist-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManArtistMediumDarkSkinTone").default,
  "man-artist-medium-light-skin-tone": () =>
    require("./emojis/EmojiManArtistMediumLightSkinTone").default,
  "man-artist-medium-skin-tone": () => require("./emojis/EmojiManArtistMediumSkinTone").default,
  "man-astronaut": () => require("./emojis/EmojiManAstronaut").default,
  "man-astronaut-dark-skin-tone": () => require("./emojis/EmojiManAstronautDarkSkinTone").default,
  "man-astronaut-light-skin-tone": () => require("./emojis/EmojiManAstronautLightSkinTone").default,
  "man-astronaut-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManAstronautMediumDarkSkinTone").default,
  "man-astronaut-medium-light-skin-tone": () =>
    require("./emojis/EmojiManAstronautMediumLightSkinTone").default,
  "man-astronaut-medium-skin-tone": () =>
    require("./emojis/EmojiManAstronautMediumSkinTone").default,
  "man-bald": () => require("./emojis/EmojiManBald").default,
  "man-beard": () => require("./emojis/EmojiManBeard").default,
  "man-biking": () => require("./emojis/EmojiManBiking").default,
  "man-biking-dark-skin-tone": () => require("./emojis/EmojiManBikingDarkSkinTone").default,
  "man-biking-light-skin-tone": () => require("./emojis/EmojiManBikingLightSkinTone").default,
  "man-biking-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManBikingMediumDarkSkinTone").default,
  "man-biking-medium-light-skin-tone": () =>
    require("./emojis/EmojiManBikingMediumLightSkinTone").default,
  "man-biking-medium-skin-tone": () => require("./emojis/EmojiManBikingMediumSkinTone").default,
  "man-blond-hair": () => require("./emojis/EmojiManBlondHair").default,
  "man-bouncing-ball": () => require("./emojis/EmojiManBouncingBall").default,
  "man-bouncing-ball-dark-skin-tone": () =>
    require("./emojis/EmojiManBouncingBallDarkSkinTone").default,
  "man-bouncing-ball-light-skin-tone": () =>
    require("./emojis/EmojiManBouncingBallLightSkinTone").default,
  "man-bouncing-ball-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManBouncingBallMediumDarkSkinTone").default,
  "man-bouncing-ball-medium-light-skin-tone": () =>
    require("./emojis/EmojiManBouncingBallMediumLightSkinTone").default,
  "man-bouncing-ball-medium-skin-tone": () =>
    require("./emojis/EmojiManBouncingBallMediumSkinTone").default,
  "man-bowing": () => require("./emojis/EmojiManBowing").default,
  "man-bowing-dark-skin-tone": () => require("./emojis/EmojiManBowingDarkSkinTone").default,
  "man-bowing-light-skin-tone": () => require("./emojis/EmojiManBowingLightSkinTone").default,
  "man-bowing-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManBowingMediumDarkSkinTone").default,
  "man-bowing-medium-light-skin-tone": () =>
    require("./emojis/EmojiManBowingMediumLightSkinTone").default,
  "man-bowing-medium-skin-tone": () => require("./emojis/EmojiManBowingMediumSkinTone").default,
  "man-cartwheeling": () => require("./emojis/EmojiManCartwheeling").default,
  "man-cartwheeling-dark-skin-tone": () =>
    require("./emojis/EmojiManCartwheelingDarkSkinTone").default,
  "man-cartwheeling-light-skin-tone": () =>
    require("./emojis/EmojiManCartwheelingLightSkinTone").default,
  "man-cartwheeling-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManCartwheelingMediumDarkSkinTone").default,
  "man-cartwheeling-medium-light-skin-tone": () =>
    require("./emojis/EmojiManCartwheelingMediumLightSkinTone").default,
  "man-cartwheeling-medium-skin-tone": () =>
    require("./emojis/EmojiManCartwheelingMediumSkinTone").default,
  "man-climbing": () => require("./emojis/EmojiManClimbing").default,
  "man-climbing-dark-skin-tone": () => require("./emojis/EmojiManClimbingDarkSkinTone").default,
  "man-climbing-light-skin-tone": () => require("./emojis/EmojiManClimbingLightSkinTone").default,
  "man-climbing-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManClimbingMediumDarkSkinTone").default,
  "man-climbing-medium-light-skin-tone": () =>
    require("./emojis/EmojiManClimbingMediumLightSkinTone").default,
  "man-climbing-medium-skin-tone": () => require("./emojis/EmojiManClimbingMediumSkinTone").default,
  "man-climbing-tone1": () => require("./emojis/EmojiManClimbingTone1").default,
  "man-climbing-tone2": () => require("./emojis/EmojiManClimbingTone2").default,
  "man-climbing-tone3": () => require("./emojis/EmojiManClimbingTone3").default,
  "man-climbing-tone4": () => require("./emojis/EmojiManClimbingTone4").default,
  "man-climbing-tone5": () => require("./emojis/EmojiManClimbingTone5").default,
  "man-construction-worker": () => require("./emojis/EmojiManConstructionWorker").default,
  "man-construction-worker-dark-skin-tone": () =>
    require("./emojis/EmojiManConstructionWorkerDarkSkinTone").default,
  "man-construction-worker-light-skin-tone": () =>
    require("./emojis/EmojiManConstructionWorkerLightSkinTone").default,
  "man-construction-worker-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManConstructionWorkerMediumDarkSkinTone").default,
  "man-construction-worker-medium-light-skin-tone": () =>
    require("./emojis/EmojiManConstructionWorkerMediumLightSkinTone").default,
  "man-construction-worker-medium-skin-tone": () =>
    require("./emojis/EmojiManConstructionWorkerMediumSkinTone").default,
  "man-cook": () => require("./emojis/EmojiManCook").default,
  "man-cook-dark-skin-tone": () => require("./emojis/EmojiManCookDarkSkinTone").default,
  "man-cook-light-skin-tone": () => require("./emojis/EmojiManCookLightSkinTone").default,
  "man-cook-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManCookMediumDarkSkinTone").default,
  "man-cook-medium-light-skin-tone": () =>
    require("./emojis/EmojiManCookMediumLightSkinTone").default,
  "man-cook-medium-skin-tone": () => require("./emojis/EmojiManCookMediumSkinTone").default,
  "man-curly-hair": () => require("./emojis/EmojiManCurlyHair").default,
  "man-dancing": () => require("./emojis/EmojiManDancing").default,
  "man-dancing-dark-skin-tone": () => require("./emojis/EmojiManDancingDarkSkinTone").default,
  "man-dancing-light-skin-tone": () => require("./emojis/EmojiManDancingLightSkinTone").default,
  "man-dancing-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManDancingMediumDarkSkinTone").default,
  "man-dancing-medium-light-skin-tone": () =>
    require("./emojis/EmojiManDancingMediumLightSkinTone").default,
  "man-dancing-medium-skin-tone": () => require("./emojis/EmojiManDancingMediumSkinTone").default,
  "man-dark-skin-tone": () => require("./emojis/EmojiManDarkSkinTone").default,
  "man-dark-skin-tone-bald": () => require("./emojis/EmojiManDarkSkinToneBald").default,
  "man-dark-skin-tone-beard": () => require("./emojis/EmojiManDarkSkinToneBeard").default,
  "man-dark-skin-tone-blond-hair": () => require("./emojis/EmojiManDarkSkinToneBlondHair").default,
  "man-dark-skin-tone-curly-hair": () => require("./emojis/EmojiManDarkSkinToneCurlyHair").default,
  "man-dark-skin-tone-red-hair": () => require("./emojis/EmojiManDarkSkinToneRedHair").default,
  "man-dark-skin-tone-white-hair": () => require("./emojis/EmojiManDarkSkinToneWhiteHair").default,
  "man-detective": () => require("./emojis/EmojiManDetective").default,
  "man-detective-dark-skin-tone": () => require("./emojis/EmojiManDetectiveDarkSkinTone").default,
  "man-detective-light-skin-tone": () => require("./emojis/EmojiManDetectiveLightSkinTone").default,
  "man-detective-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManDetectiveMediumDarkSkinTone").default,
  "man-detective-medium-light-skin-tone": () =>
    require("./emojis/EmojiManDetectiveMediumLightSkinTone").default,
  "man-detective-medium-skin-tone": () =>
    require("./emojis/EmojiManDetectiveMediumSkinTone").default,
  "man-elf": () => require("./emojis/EmojiManElf").default,
  "man-elf-dark-skin-tone": () => require("./emojis/EmojiManElfDarkSkinTone").default,
  "man-elf-light-skin-tone": () => require("./emojis/EmojiManElfLightSkinTone").default,
  "man-elf-medium-dark-skin-tone": () => require("./emojis/EmojiManElfMediumDarkSkinTone").default,
  "man-elf-medium-light-skin-tone": () =>
    require("./emojis/EmojiManElfMediumLightSkinTone").default,
  "man-elf-medium-skin-tone": () => require("./emojis/EmojiManElfMediumSkinTone").default,
  "man-elf-tone1": () => require("./emojis/EmojiManElfTone1").default,
  "man-elf-tone2": () => require("./emojis/EmojiManElfTone2").default,
  "man-elf-tone3": () => require("./emojis/EmojiManElfTone3").default,
  "man-elf-tone4": () => require("./emojis/EmojiManElfTone4").default,
  "man-elf-tone5": () => require("./emojis/EmojiManElfTone5").default,
  "man-facepalming": () => require("./emojis/EmojiManFacepalming").default,
  "man-facepalming-dark-skin-tone": () =>
    require("./emojis/EmojiManFacepalmingDarkSkinTone").default,
  "man-facepalming-light-skin-tone": () =>
    require("./emojis/EmojiManFacepalmingLightSkinTone").default,
  "man-facepalming-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManFacepalmingMediumDarkSkinTone").default,
  "man-facepalming-medium-light-skin-tone": () =>
    require("./emojis/EmojiManFacepalmingMediumLightSkinTone").default,
  "man-facepalming-medium-skin-tone": () =>
    require("./emojis/EmojiManFacepalmingMediumSkinTone").default,
  "man-factory-worker": () => require("./emojis/EmojiManFactoryWorker").default,
  "man-factory-worker-dark-skin-tone": () =>
    require("./emojis/EmojiManFactoryWorkerDarkSkinTone").default,
  "man-factory-worker-light-skin-tone": () =>
    require("./emojis/EmojiManFactoryWorkerLightSkinTone").default,
  "man-factory-worker-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManFactoryWorkerMediumDarkSkinTone").default,
  "man-factory-worker-medium-light-skin-tone": () =>
    require("./emojis/EmojiManFactoryWorkerMediumLightSkinTone").default,
  "man-factory-worker-medium-skin-tone": () =>
    require("./emojis/EmojiManFactoryWorkerMediumSkinTone").default,
  "man-fairy": () => require("./emojis/EmojiManFairy").default,
  "man-fairy-dark-skin-tone": () => require("./emojis/EmojiManFairyDarkSkinTone").default,
  "man-fairy-light-skin-tone": () => require("./emojis/EmojiManFairyLightSkinTone").default,
  "man-fairy-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManFairyMediumDarkSkinTone").default,
  "man-fairy-medium-light-skin-tone": () =>
    require("./emojis/EmojiManFairyMediumLightSkinTone").default,
  "man-fairy-medium-skin-tone": () => require("./emojis/EmojiManFairyMediumSkinTone").default,
  "man-farmer": () => require("./emojis/EmojiManFarmer").default,
  "man-farmer-dark-skin-tone": () => require("./emojis/EmojiManFarmerDarkSkinTone").default,
  "man-farmer-light-skin-tone": () => require("./emojis/EmojiManFarmerLightSkinTone").default,
  "man-farmer-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManFarmerMediumDarkSkinTone").default,
  "man-farmer-medium-light-skin-tone": () =>
    require("./emojis/EmojiManFarmerMediumLightSkinTone").default,
  "man-farmer-medium-skin-tone": () => require("./emojis/EmojiManFarmerMediumSkinTone").default,
  "man-feeding-baby": () => require("./emojis/EmojiManFeedingBaby").default,
  "man-feeding-baby-dark-skin-tone": () =>
    require("./emojis/EmojiManFeedingBabyDarkSkinTone").default,
  "man-feeding-baby-light-skin-tone": () =>
    require("./emojis/EmojiManFeedingBabyLightSkinTone").default,
  "man-feeding-baby-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManFeedingBabyMediumDarkSkinTone").default,
  "man-feeding-baby-medium-light-skin-tone": () =>
    require("./emojis/EmojiManFeedingBabyMediumLightSkinTone").default,
  "man-feeding-baby-medium-skin-tone": () =>
    require("./emojis/EmojiManFeedingBabyMediumSkinTone").default,
  "man-firefighter": () => require("./emojis/EmojiManFirefighter").default,
  "man-firefighter-dark-skin-tone": () =>
    require("./emojis/EmojiManFirefighterDarkSkinTone").default,
  "man-firefighter-light-skin-tone": () =>
    require("./emojis/EmojiManFirefighterLightSkinTone").default,
  "man-firefighter-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManFirefighterMediumDarkSkinTone").default,
  "man-firefighter-medium-light-skin-tone": () =>
    require("./emojis/EmojiManFirefighterMediumLightSkinTone").default,
  "man-firefighter-medium-skin-tone": () =>
    require("./emojis/EmojiManFirefighterMediumSkinTone").default,
  "man-frowning": () => require("./emojis/EmojiManFrowning").default,
  "man-frowning-dark-skin-tone": () => require("./emojis/EmojiManFrowningDarkSkinTone").default,
  "man-frowning-light-skin-tone": () => require("./emojis/EmojiManFrowningLightSkinTone").default,
  "man-frowning-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManFrowningMediumDarkSkinTone").default,
  "man-frowning-medium-light-skin-tone": () =>
    require("./emojis/EmojiManFrowningMediumLightSkinTone").default,
  "man-frowning-medium-skin-tone": () => require("./emojis/EmojiManFrowningMediumSkinTone").default,
  "man-genie": () => require("./emojis/EmojiManGenie").default,
  "man-gesturing-no": () => require("./emojis/EmojiManGesturingNo").default,
  "man-gesturing-no-dark-skin-tone": () =>
    require("./emojis/EmojiManGesturingNoDarkSkinTone").default,
  "man-gesturing-no-light-skin-tone": () =>
    require("./emojis/EmojiManGesturingNoLightSkinTone").default,
  "man-gesturing-no-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManGesturingNoMediumDarkSkinTone").default,
  "man-gesturing-no-medium-light-skin-tone": () =>
    require("./emojis/EmojiManGesturingNoMediumLightSkinTone").default,
  "man-gesturing-no-medium-skin-tone": () =>
    require("./emojis/EmojiManGesturingNoMediumSkinTone").default,
  "man-gesturing-ok": () => require("./emojis/EmojiManGesturingOk").default,
  "man-gesturing-ok-dark-skin-tone": () =>
    require("./emojis/EmojiManGesturingOkDarkSkinTone").default,
  "man-gesturing-ok-light-skin-tone": () =>
    require("./emojis/EmojiManGesturingOkLightSkinTone").default,
  "man-gesturing-ok-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManGesturingOkMediumDarkSkinTone").default,
  "man-gesturing-ok-medium-light-skin-tone": () =>
    require("./emojis/EmojiManGesturingOkMediumLightSkinTone").default,
  "man-gesturing-ok-medium-skin-tone": () =>
    require("./emojis/EmojiManGesturingOkMediumSkinTone").default,
  "man-getting-haircut": () => require("./emojis/EmojiManGettingHaircut").default,
  "man-getting-haircut-dark-skin-tone": () =>
    require("./emojis/EmojiManGettingHaircutDarkSkinTone").default,
  "man-getting-haircut-light-skin-tone": () =>
    require("./emojis/EmojiManGettingHaircutLightSkinTone").default,
  "man-getting-haircut-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManGettingHaircutMediumDarkSkinTone").default,
  "man-getting-haircut-medium-light-skin-tone": () =>
    require("./emojis/EmojiManGettingHaircutMediumLightSkinTone").default,
  "man-getting-haircut-medium-skin-tone": () =>
    require("./emojis/EmojiManGettingHaircutMediumSkinTone").default,
  "man-getting-massage": () => require("./emojis/EmojiManGettingMassage").default,
  "man-getting-massage-dark-skin-tone": () =>
    require("./emojis/EmojiManGettingMassageDarkSkinTone").default,
  "man-getting-massage-light-skin-tone": () =>
    require("./emojis/EmojiManGettingMassageLightSkinTone").default,
  "man-getting-massage-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManGettingMassageMediumDarkSkinTone").default,
  "man-getting-massage-medium-light-skin-tone": () =>
    require("./emojis/EmojiManGettingMassageMediumLightSkinTone").default,
  "man-getting-massage-medium-skin-tone": () =>
    require("./emojis/EmojiManGettingMassageMediumSkinTone").default,
  "man-golfing": () => require("./emojis/EmojiManGolfing").default,
  "man-golfing-dark-skin-tone": () => require("./emojis/EmojiManGolfingDarkSkinTone").default,
  "man-golfing-light-skin-tone": () => require("./emojis/EmojiManGolfingLightSkinTone").default,
  "man-golfing-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManGolfingMediumDarkSkinTone").default,
  "man-golfing-medium-light-skin-tone": () =>
    require("./emojis/EmojiManGolfingMediumLightSkinTone").default,
  "man-golfing-medium-skin-tone": () => require("./emojis/EmojiManGolfingMediumSkinTone").default,
  "man-guard": () => require("./emojis/EmojiManGuard").default,
  "man-guard-dark-skin-tone": () => require("./emojis/EmojiManGuardDarkSkinTone").default,
  "man-guard-light-skin-tone": () => require("./emojis/EmojiManGuardLightSkinTone").default,
  "man-guard-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManGuardMediumDarkSkinTone").default,
  "man-guard-medium-light-skin-tone": () =>
    require("./emojis/EmojiManGuardMediumLightSkinTone").default,
  "man-guard-medium-skin-tone": () => require("./emojis/EmojiManGuardMediumSkinTone").default,
  "man-health-worker": () => require("./emojis/EmojiManHealthWorker").default,
  "man-health-worker-dark-skin-tone": () =>
    require("./emojis/EmojiManHealthWorkerDarkSkinTone").default,
  "man-health-worker-light-skin-tone": () =>
    require("./emojis/EmojiManHealthWorkerLightSkinTone").default,
  "man-health-worker-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManHealthWorkerMediumDarkSkinTone").default,
  "man-health-worker-medium-light-skin-tone": () =>
    require("./emojis/EmojiManHealthWorkerMediumLightSkinTone").default,
  "man-health-worker-medium-skin-tone": () =>
    require("./emojis/EmojiManHealthWorkerMediumSkinTone").default,
  "man-in-business-suit-levitating": () =>
    require("./emojis/EmojiManInBusinessSuitLevitating").default,
  "man-in-business-suit-levitating-dark-skin-tone": () =>
    require("./emojis/EmojiManInBusinessSuitLevitatingDarkSkinTone").default,
  "man-in-business-suit-levitating-light-skin-tone": () =>
    require("./emojis/EmojiManInBusinessSuitLevitatingLightSkinTone").default,
  "man-in-business-suit-levitating-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManInBusinessSuitLevitatingMediumDarkSkinTone").default,
  "man-in-business-suit-levitating-medium-light-skin-tone": () =>
    require("./emojis/EmojiManInBusinessSuitLevitatingMediumLightSkinTone").default,
  "man-in-business-suit-levitating-medium-skin-tone": () =>
    require("./emojis/EmojiManInBusinessSuitLevitatingMediumSkinTone").default,
  "man-in-lotus-position": () => require("./emojis/EmojiManInLotusPosition").default,
  "man-in-lotus-position-dark-skin-tone": () =>
    require("./emojis/EmojiManInLotusPositionDarkSkinTone").default,
  "man-in-lotus-position-light-skin-tone": () =>
    require("./emojis/EmojiManInLotusPositionLightSkinTone").default,
  "man-in-lotus-position-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManInLotusPositionMediumDarkSkinTone").default,
  "man-in-lotus-position-medium-light-skin-tone": () =>
    require("./emojis/EmojiManInLotusPositionMediumLightSkinTone").default,
  "man-in-lotus-position-medium-skin-tone": () =>
    require("./emojis/EmojiManInLotusPositionMediumSkinTone").default,
  "man-in-manual-wheelchair": () => require("./emojis/EmojiManInManualWheelchair").default,
  "man-in-manual-wheelchair-dark-skin-tone": () =>
    require("./emojis/EmojiManInManualWheelchairDarkSkinTone").default,
  "man-in-manual-wheelchair-facing-right": () =>
    require("./emojis/EmojiManInManualWheelchairFacingRight").default,
  "man-in-manual-wheelchair-facing-right-dark-skin-tone": () =>
    require("./emojis/EmojiManInManualWheelchairFacingRightDarkSkinTone").default,
  "man-in-manual-wheelchair-facing-right-light-skin-tone": () =>
    require("./emojis/EmojiManInManualWheelchairFacingRightLightSkinTone").default,
  "man-in-manual-wheelchair-facing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManInManualWheelchairFacingRightMediumDarkSkinTone").default,
  "man-in-manual-wheelchair-facing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiManInManualWheelchairFacingRightMediumLightSkinTone").default,
  "man-in-manual-wheelchair-facing-right-medium-skin-tone": () =>
    require("./emojis/EmojiManInManualWheelchairFacingRightMediumSkinTone").default,
  "man-in-manual-wheelchair-light-skin-tone": () =>
    require("./emojis/EmojiManInManualWheelchairLightSkinTone").default,
  "man-in-manual-wheelchair-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManInManualWheelchairMediumDarkSkinTone").default,
  "man-in-manual-wheelchair-medium-light-skin-tone": () =>
    require("./emojis/EmojiManInManualWheelchairMediumLightSkinTone").default,
  "man-in-manual-wheelchair-medium-skin-tone": () =>
    require("./emojis/EmojiManInManualWheelchairMediumSkinTone").default,
  "man-in-motorized-wheelchair": () => require("./emojis/EmojiManInMotorizedWheelchair").default,
  "man-in-motorized-wheelchair-dark-skin-tone": () =>
    require("./emojis/EmojiManInMotorizedWheelchairDarkSkinTone").default,
  "man-in-motorized-wheelchair-facing-right": () =>
    require("./emojis/EmojiManInMotorizedWheelchairFacingRight").default,
  "man-in-motorized-wheelchair-facing-right-dark-skin-tone": () =>
    require("./emojis/EmojiManInMotorizedWheelchairFacingRightDarkSkinTone").default,
  "man-in-motorized-wheelchair-facing-right-light-skin-tone": () =>
    require("./emojis/EmojiManInMotorizedWheelchairFacingRightLightSkinTone").default,
  "man-in-motorized-wheelchair-facing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManInMotorizedWheelchairFacingRightMediumDarkSkinTone").default,
  "man-in-motorized-wheelchair-facing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiManInMotorizedWheelchairFacingRightMediumLightSkinTone").default,
  "man-in-motorized-wheelchair-facing-right-medium-skin-tone": () =>
    require("./emojis/EmojiManInMotorizedWheelchairFacingRightMediumSkinTone").default,
  "man-in-motorized-wheelchair-light-skin-tone": () =>
    require("./emojis/EmojiManInMotorizedWheelchairLightSkinTone").default,
  "man-in-motorized-wheelchair-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManInMotorizedWheelchairMediumDarkSkinTone").default,
  "man-in-motorized-wheelchair-medium-light-skin-tone": () =>
    require("./emojis/EmojiManInMotorizedWheelchairMediumLightSkinTone").default,
  "man-in-motorized-wheelchair-medium-skin-tone": () =>
    require("./emojis/EmojiManInMotorizedWheelchairMediumSkinTone").default,
  "man-in-steamy-room": () => require("./emojis/EmojiManInSteamyRoom").default,
  "man-in-steamy-room-dark-skin-tone": () =>
    require("./emojis/EmojiManInSteamyRoomDarkSkinTone").default,
  "man-in-steamy-room-light-skin-tone": () =>
    require("./emojis/EmojiManInSteamyRoomLightSkinTone").default,
  "man-in-steamy-room-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManInSteamyRoomMediumDarkSkinTone").default,
  "man-in-steamy-room-medium-light-skin-tone": () =>
    require("./emojis/EmojiManInSteamyRoomMediumLightSkinTone").default,
  "man-in-steamy-room-medium-skin-tone": () =>
    require("./emojis/EmojiManInSteamyRoomMediumSkinTone").default,
  "man-in-tuxedo": () => require("./emojis/EmojiManInTuxedo").default,
  "man-in-tuxedo-dark-skin-tone": () => require("./emojis/EmojiManInTuxedoDarkSkinTone").default,
  "man-in-tuxedo-light-skin-tone": () => require("./emojis/EmojiManInTuxedoLightSkinTone").default,
  "man-in-tuxedo-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManInTuxedoMediumDarkSkinTone").default,
  "man-in-tuxedo-medium-light-skin-tone": () =>
    require("./emojis/EmojiManInTuxedoMediumLightSkinTone").default,
  "man-in-tuxedo-medium-skin-tone": () =>
    require("./emojis/EmojiManInTuxedoMediumSkinTone").default,
  "man-judge": () => require("./emojis/EmojiManJudge").default,
  "man-judge-dark-skin-tone": () => require("./emojis/EmojiManJudgeDarkSkinTone").default,
  "man-judge-light-skin-tone": () => require("./emojis/EmojiManJudgeLightSkinTone").default,
  "man-judge-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManJudgeMediumDarkSkinTone").default,
  "man-judge-medium-light-skin-tone": () =>
    require("./emojis/EmojiManJudgeMediumLightSkinTone").default,
  "man-judge-medium-skin-tone": () => require("./emojis/EmojiManJudgeMediumSkinTone").default,
  "man-juggling": () => require("./emojis/EmojiManJuggling").default,
  "man-juggling-dark-skin-tone": () => require("./emojis/EmojiManJugglingDarkSkinTone").default,
  "man-juggling-light-skin-tone": () => require("./emojis/EmojiManJugglingLightSkinTone").default,
  "man-juggling-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManJugglingMediumDarkSkinTone").default,
  "man-juggling-medium-light-skin-tone": () =>
    require("./emojis/EmojiManJugglingMediumLightSkinTone").default,
  "man-juggling-medium-skin-tone": () => require("./emojis/EmojiManJugglingMediumSkinTone").default,
  "man-kneeling": () => require("./emojis/EmojiManKneeling").default,
  "man-kneeling-dark-skin-tone": () => require("./emojis/EmojiManKneelingDarkSkinTone").default,
  "man-kneeling-facing-right": () => require("./emojis/EmojiManKneelingFacingRight").default,
  "man-kneeling-facing-right-dark-skin-tone": () =>
    require("./emojis/EmojiManKneelingFacingRightDarkSkinTone").default,
  "man-kneeling-facing-right-light-skin-tone": () =>
    require("./emojis/EmojiManKneelingFacingRightLightSkinTone").default,
  "man-kneeling-facing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManKneelingFacingRightMediumDarkSkinTone").default,
  "man-kneeling-facing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiManKneelingFacingRightMediumLightSkinTone").default,
  "man-kneeling-facing-right-medium-skin-tone": () =>
    require("./emojis/EmojiManKneelingFacingRightMediumSkinTone").default,
  "man-kneeling-light-skin-tone": () => require("./emojis/EmojiManKneelingLightSkinTone").default,
  "man-kneeling-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManKneelingMediumDarkSkinTone").default,
  "man-kneeling-medium-light-skin-tone": () =>
    require("./emojis/EmojiManKneelingMediumLightSkinTone").default,
  "man-kneeling-medium-skin-tone": () => require("./emojis/EmojiManKneelingMediumSkinTone").default,
  "man-lifting-weights": () => require("./emojis/EmojiManLiftingWeights").default,
  "man-lifting-weights-dark-skin-tone": () =>
    require("./emojis/EmojiManLiftingWeightsDarkSkinTone").default,
  "man-lifting-weights-light-skin-tone": () =>
    require("./emojis/EmojiManLiftingWeightsLightSkinTone").default,
  "man-lifting-weights-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManLiftingWeightsMediumDarkSkinTone").default,
  "man-lifting-weights-medium-light-skin-tone": () =>
    require("./emojis/EmojiManLiftingWeightsMediumLightSkinTone").default,
  "man-lifting-weights-medium-skin-tone": () =>
    require("./emojis/EmojiManLiftingWeightsMediumSkinTone").default,
  "man-light-skin-tone": () => require("./emojis/EmojiManLightSkinTone").default,
  "man-light-skin-tone-bald": () => require("./emojis/EmojiManLightSkinToneBald").default,
  "man-light-skin-tone-beard": () => require("./emojis/EmojiManLightSkinToneBeard").default,
  "man-light-skin-tone-blond-hair": () =>
    require("./emojis/EmojiManLightSkinToneBlondHair").default,
  "man-light-skin-tone-curly-hair": () =>
    require("./emojis/EmojiManLightSkinToneCurlyHair").default,
  "man-light-skin-tone-red-hair": () => require("./emojis/EmojiManLightSkinToneRedHair").default,
  "man-light-skin-tone-white-hair": () =>
    require("./emojis/EmojiManLightSkinToneWhiteHair").default,
  "man-mage": () => require("./emojis/EmojiManMage").default,
  "man-mage-dark-skin-tone": () => require("./emojis/EmojiManMageDarkSkinTone").default,
  "man-mage-light-skin-tone": () => require("./emojis/EmojiManMageLightSkinTone").default,
  "man-mage-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManMageMediumDarkSkinTone").default,
  "man-mage-medium-light-skin-tone": () =>
    require("./emojis/EmojiManMageMediumLightSkinTone").default,
  "man-mage-medium-skin-tone": () => require("./emojis/EmojiManMageMediumSkinTone").default,
  "man-mechanic": () => require("./emojis/EmojiManMechanic").default,
  "man-mechanic-dark-skin-tone": () => require("./emojis/EmojiManMechanicDarkSkinTone").default,
  "man-mechanic-light-skin-tone": () => require("./emojis/EmojiManMechanicLightSkinTone").default,
  "man-mechanic-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManMechanicMediumDarkSkinTone").default,
  "man-mechanic-medium-light-skin-tone": () =>
    require("./emojis/EmojiManMechanicMediumLightSkinTone").default,
  "man-mechanic-medium-skin-tone": () => require("./emojis/EmojiManMechanicMediumSkinTone").default,
  "man-medium-dark-skin-tone": () => require("./emojis/EmojiManMediumDarkSkinTone").default,
  "man-medium-dark-skin-tone-bald": () =>
    require("./emojis/EmojiManMediumDarkSkinToneBald").default,
  "man-medium-dark-skin-tone-beard": () =>
    require("./emojis/EmojiManMediumDarkSkinToneBeard").default,
  "man-medium-dark-skin-tone-blond-hair": () =>
    require("./emojis/EmojiManMediumDarkSkinToneBlondHair").default,
  "man-medium-dark-skin-tone-curly-hair": () =>
    require("./emojis/EmojiManMediumDarkSkinToneCurlyHair").default,
  "man-medium-dark-skin-tone-red-hair": () =>
    require("./emojis/EmojiManMediumDarkSkinToneRedHair").default,
  "man-medium-dark-skin-tone-white-hair": () =>
    require("./emojis/EmojiManMediumDarkSkinToneWhiteHair").default,
  "man-medium-light-skin-tone": () => require("./emojis/EmojiManMediumLightSkinTone").default,
  "man-medium-light-skin-tone-bald": () =>
    require("./emojis/EmojiManMediumLightSkinToneBald").default,
  "man-medium-light-skin-tone-beard": () =>
    require("./emojis/EmojiManMediumLightSkinToneBeard").default,
  "man-medium-light-skin-tone-blond-hair": () =>
    require("./emojis/EmojiManMediumLightSkinToneBlondHair").default,
  "man-medium-light-skin-tone-curly-hair": () =>
    require("./emojis/EmojiManMediumLightSkinToneCurlyHair").default,
  "man-medium-light-skin-tone-red-hair": () =>
    require("./emojis/EmojiManMediumLightSkinToneRedHair").default,
  "man-medium-light-skin-tone-white-hair": () =>
    require("./emojis/EmojiManMediumLightSkinToneWhiteHair").default,
  "man-medium-skin-tone": () => require("./emojis/EmojiManMediumSkinTone").default,
  "man-medium-skin-tone-bald": () => require("./emojis/EmojiManMediumSkinToneBald").default,
  "man-medium-skin-tone-beard": () => require("./emojis/EmojiManMediumSkinToneBeard").default,
  "man-medium-skin-tone-blond-hair": () =>
    require("./emojis/EmojiManMediumSkinToneBlondHair").default,
  "man-medium-skin-tone-curly-hair": () =>
    require("./emojis/EmojiManMediumSkinToneCurlyHair").default,
  "man-medium-skin-tone-red-hair": () => require("./emojis/EmojiManMediumSkinToneRedHair").default,
  "man-medium-skin-tone-white-hair": () =>
    require("./emojis/EmojiManMediumSkinToneWhiteHair").default,
  "man-mountain-biking": () => require("./emojis/EmojiManMountainBiking").default,
  "man-mountain-biking-dark-skin-tone": () =>
    require("./emojis/EmojiManMountainBikingDarkSkinTone").default,
  "man-mountain-biking-light-skin-tone": () =>
    require("./emojis/EmojiManMountainBikingLightSkinTone").default,
  "man-mountain-biking-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManMountainBikingMediumDarkSkinTone").default,
  "man-mountain-biking-medium-light-skin-tone": () =>
    require("./emojis/EmojiManMountainBikingMediumLightSkinTone").default,
  "man-mountain-biking-medium-skin-tone": () =>
    require("./emojis/EmojiManMountainBikingMediumSkinTone").default,
  "man-office-worker": () => require("./emojis/EmojiManOfficeWorker").default,
  "man-office-worker-dark-skin-tone": () =>
    require("./emojis/EmojiManOfficeWorkerDarkSkinTone").default,
  "man-office-worker-light-skin-tone": () =>
    require("./emojis/EmojiManOfficeWorkerLightSkinTone").default,
  "man-office-worker-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManOfficeWorkerMediumDarkSkinTone").default,
  "man-office-worker-medium-light-skin-tone": () =>
    require("./emojis/EmojiManOfficeWorkerMediumLightSkinTone").default,
  "man-office-worker-medium-skin-tone": () =>
    require("./emojis/EmojiManOfficeWorkerMediumSkinTone").default,
  "man-pilot": () => require("./emojis/EmojiManPilot").default,
  "man-pilot-dark-skin-tone": () => require("./emojis/EmojiManPilotDarkSkinTone").default,
  "man-pilot-light-skin-tone": () => require("./emojis/EmojiManPilotLightSkinTone").default,
  "man-pilot-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManPilotMediumDarkSkinTone").default,
  "man-pilot-medium-light-skin-tone": () =>
    require("./emojis/EmojiManPilotMediumLightSkinTone").default,
  "man-pilot-medium-skin-tone": () => require("./emojis/EmojiManPilotMediumSkinTone").default,
  "man-playing-handball": () => require("./emojis/EmojiManPlayingHandball").default,
  "man-playing-handball-dark-skin-tone": () =>
    require("./emojis/EmojiManPlayingHandballDarkSkinTone").default,
  "man-playing-handball-light-skin-tone": () =>
    require("./emojis/EmojiManPlayingHandballLightSkinTone").default,
  "man-playing-handball-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManPlayingHandballMediumDarkSkinTone").default,
  "man-playing-handball-medium-light-skin-tone": () =>
    require("./emojis/EmojiManPlayingHandballMediumLightSkinTone").default,
  "man-playing-handball-medium-skin-tone": () =>
    require("./emojis/EmojiManPlayingHandballMediumSkinTone").default,
  "man-playing-water-polo": () => require("./emojis/EmojiManPlayingWaterPolo").default,
  "man-playing-water-polo-dark-skin-tone": () =>
    require("./emojis/EmojiManPlayingWaterPoloDarkSkinTone").default,
  "man-playing-water-polo-light-skin-tone": () =>
    require("./emojis/EmojiManPlayingWaterPoloLightSkinTone").default,
  "man-playing-water-polo-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManPlayingWaterPoloMediumDarkSkinTone").default,
  "man-playing-water-polo-medium-light-skin-tone": () =>
    require("./emojis/EmojiManPlayingWaterPoloMediumLightSkinTone").default,
  "man-playing-water-polo-medium-skin-tone": () =>
    require("./emojis/EmojiManPlayingWaterPoloMediumSkinTone").default,
  "man-police-officer": () => require("./emojis/EmojiManPoliceOfficer").default,
  "man-police-officer-dark-skin-tone": () =>
    require("./emojis/EmojiManPoliceOfficerDarkSkinTone").default,
  "man-police-officer-light-skin-tone": () =>
    require("./emojis/EmojiManPoliceOfficerLightSkinTone").default,
  "man-police-officer-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManPoliceOfficerMediumDarkSkinTone").default,
  "man-police-officer-medium-light-skin-tone": () =>
    require("./emojis/EmojiManPoliceOfficerMediumLightSkinTone").default,
  "man-police-officer-medium-skin-tone": () =>
    require("./emojis/EmojiManPoliceOfficerMediumSkinTone").default,
  "man-pouting": () => require("./emojis/EmojiManPouting").default,
  "man-pouting-dark-skin-tone": () => require("./emojis/EmojiManPoutingDarkSkinTone").default,
  "man-pouting-light-skin-tone": () => require("./emojis/EmojiManPoutingLightSkinTone").default,
  "man-pouting-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManPoutingMediumDarkSkinTone").default,
  "man-pouting-medium-light-skin-tone": () =>
    require("./emojis/EmojiManPoutingMediumLightSkinTone").default,
  "man-pouting-medium-skin-tone": () => require("./emojis/EmojiManPoutingMediumSkinTone").default,
  "man-raising-hand": () => require("./emojis/EmojiManRaisingHand").default,
  "man-raising-hand-dark-skin-tone": () =>
    require("./emojis/EmojiManRaisingHandDarkSkinTone").default,
  "man-raising-hand-light-skin-tone": () =>
    require("./emojis/EmojiManRaisingHandLightSkinTone").default,
  "man-raising-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManRaisingHandMediumDarkSkinTone").default,
  "man-raising-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiManRaisingHandMediumLightSkinTone").default,
  "man-raising-hand-medium-skin-tone": () =>
    require("./emojis/EmojiManRaisingHandMediumSkinTone").default,
  "man-red-hair": () => require("./emojis/EmojiManRedHair").default,
  "man-rowing-boat": () => require("./emojis/EmojiManRowingBoat").default,
  "man-rowing-boat-dark-skin-tone": () =>
    require("./emojis/EmojiManRowingBoatDarkSkinTone").default,
  "man-rowing-boat-light-skin-tone": () =>
    require("./emojis/EmojiManRowingBoatLightSkinTone").default,
  "man-rowing-boat-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManRowingBoatMediumDarkSkinTone").default,
  "man-rowing-boat-medium-light-skin-tone": () =>
    require("./emojis/EmojiManRowingBoatMediumLightSkinTone").default,
  "man-rowing-boat-medium-skin-tone": () =>
    require("./emojis/EmojiManRowingBoatMediumSkinTone").default,
  "man-running": () => require("./emojis/EmojiManRunning").default,
  "man-running-dark-skin-tone": () => require("./emojis/EmojiManRunningDarkSkinTone").default,
  "man-running-facing-right": () => require("./emojis/EmojiManRunningFacingRight").default,
  "man-running-facing-right-dark-skin-tone": () =>
    require("./emojis/EmojiManRunningFacingRightDarkSkinTone").default,
  "man-running-facing-right-light-skin-tone": () =>
    require("./emojis/EmojiManRunningFacingRightLightSkinTone").default,
  "man-running-facing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManRunningFacingRightMediumDarkSkinTone").default,
  "man-running-facing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiManRunningFacingRightMediumLightSkinTone").default,
  "man-running-facing-right-medium-skin-tone": () =>
    require("./emojis/EmojiManRunningFacingRightMediumSkinTone").default,
  "man-running-light-skin-tone": () => require("./emojis/EmojiManRunningLightSkinTone").default,
  "man-running-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManRunningMediumDarkSkinTone").default,
  "man-running-medium-light-skin-tone": () =>
    require("./emojis/EmojiManRunningMediumLightSkinTone").default,
  "man-running-medium-skin-tone": () => require("./emojis/EmojiManRunningMediumSkinTone").default,
  "man-scientist": () => require("./emojis/EmojiManScientist").default,
  "man-scientist-dark-skin-tone": () => require("./emojis/EmojiManScientistDarkSkinTone").default,
  "man-scientist-light-skin-tone": () => require("./emojis/EmojiManScientistLightSkinTone").default,
  "man-scientist-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManScientistMediumDarkSkinTone").default,
  "man-scientist-medium-light-skin-tone": () =>
    require("./emojis/EmojiManScientistMediumLightSkinTone").default,
  "man-scientist-medium-skin-tone": () =>
    require("./emojis/EmojiManScientistMediumSkinTone").default,
  "man-shrugging": () => require("./emojis/EmojiManShrugging").default,
  "man-shrugging-dark-skin-tone": () => require("./emojis/EmojiManShruggingDarkSkinTone").default,
  "man-shrugging-light-skin-tone": () => require("./emojis/EmojiManShruggingLightSkinTone").default,
  "man-shrugging-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManShruggingMediumDarkSkinTone").default,
  "man-shrugging-medium-light-skin-tone": () =>
    require("./emojis/EmojiManShruggingMediumLightSkinTone").default,
  "man-shrugging-medium-skin-tone": () =>
    require("./emojis/EmojiManShruggingMediumSkinTone").default,
  "man-singer": () => require("./emojis/EmojiManSinger").default,
  "man-singer-dark-skin-tone": () => require("./emojis/EmojiManSingerDarkSkinTone").default,
  "man-singer-light-skin-tone": () => require("./emojis/EmojiManSingerLightSkinTone").default,
  "man-singer-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManSingerMediumDarkSkinTone").default,
  "man-singer-medium-light-skin-tone": () =>
    require("./emojis/EmojiManSingerMediumLightSkinTone").default,
  "man-singer-medium-skin-tone": () => require("./emojis/EmojiManSingerMediumSkinTone").default,
  "man-standing": () => require("./emojis/EmojiManStanding").default,
  "man-standing-dark-skin-tone": () => require("./emojis/EmojiManStandingDarkSkinTone").default,
  "man-standing-light-skin-tone": () => require("./emojis/EmojiManStandingLightSkinTone").default,
  "man-standing-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManStandingMediumDarkSkinTone").default,
  "man-standing-medium-light-skin-tone": () =>
    require("./emojis/EmojiManStandingMediumLightSkinTone").default,
  "man-standing-medium-skin-tone": () => require("./emojis/EmojiManStandingMediumSkinTone").default,
  "man-student": () => require("./emojis/EmojiManStudent").default,
  "man-student-dark-skin-tone": () => require("./emojis/EmojiManStudentDarkSkinTone").default,
  "man-student-light-skin-tone": () => require("./emojis/EmojiManStudentLightSkinTone").default,
  "man-student-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManStudentMediumDarkSkinTone").default,
  "man-student-medium-light-skin-tone": () =>
    require("./emojis/EmojiManStudentMediumLightSkinTone").default,
  "man-student-medium-skin-tone": () => require("./emojis/EmojiManStudentMediumSkinTone").default,
  "man-superhero": () => require("./emojis/EmojiManSuperhero").default,
  "man-superhero-dark-skin-tone": () => require("./emojis/EmojiManSuperheroDarkSkinTone").default,
  "man-superhero-light-skin-tone": () => require("./emojis/EmojiManSuperheroLightSkinTone").default,
  "man-superhero-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManSuperheroMediumDarkSkinTone").default,
  "man-superhero-medium-light-skin-tone": () =>
    require("./emojis/EmojiManSuperheroMediumLightSkinTone").default,
  "man-superhero-medium-skin-tone": () =>
    require("./emojis/EmojiManSuperheroMediumSkinTone").default,
  "man-supervillain": () => require("./emojis/EmojiManSupervillain").default,
  "man-supervillain-dark-skin-tone": () =>
    require("./emojis/EmojiManSupervillainDarkSkinTone").default,
  "man-supervillain-light-skin-tone": () =>
    require("./emojis/EmojiManSupervillainLightSkinTone").default,
  "man-supervillain-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManSupervillainMediumDarkSkinTone").default,
  "man-supervillain-medium-light-skin-tone": () =>
    require("./emojis/EmojiManSupervillainMediumLightSkinTone").default,
  "man-supervillain-medium-skin-tone": () =>
    require("./emojis/EmojiManSupervillainMediumSkinTone").default,
  "man-surfing": () => require("./emojis/EmojiManSurfing").default,
  "man-surfing-dark-skin-tone": () => require("./emojis/EmojiManSurfingDarkSkinTone").default,
  "man-surfing-light-skin-tone": () => require("./emojis/EmojiManSurfingLightSkinTone").default,
  "man-surfing-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManSurfingMediumDarkSkinTone").default,
  "man-surfing-medium-light-skin-tone": () =>
    require("./emojis/EmojiManSurfingMediumLightSkinTone").default,
  "man-surfing-medium-skin-tone": () => require("./emojis/EmojiManSurfingMediumSkinTone").default,
  "man-swimming": () => require("./emojis/EmojiManSwimming").default,
  "man-swimming-dark-skin-tone": () => require("./emojis/EmojiManSwimmingDarkSkinTone").default,
  "man-swimming-light-skin-tone": () => require("./emojis/EmojiManSwimmingLightSkinTone").default,
  "man-swimming-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManSwimmingMediumDarkSkinTone").default,
  "man-swimming-medium-light-skin-tone": () =>
    require("./emojis/EmojiManSwimmingMediumLightSkinTone").default,
  "man-swimming-medium-skin-tone": () => require("./emojis/EmojiManSwimmingMediumSkinTone").default,
  "man-teacher": () => require("./emojis/EmojiManTeacher").default,
  "man-teacher-dark-skin-tone": () => require("./emojis/EmojiManTeacherDarkSkinTone").default,
  "man-teacher-light-skin-tone": () => require("./emojis/EmojiManTeacherLightSkinTone").default,
  "man-teacher-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManTeacherMediumDarkSkinTone").default,
  "man-teacher-medium-light-skin-tone": () =>
    require("./emojis/EmojiManTeacherMediumLightSkinTone").default,
  "man-teacher-medium-skin-tone": () => require("./emojis/EmojiManTeacherMediumSkinTone").default,
  "man-technologist": () => require("./emojis/EmojiManTechnologist").default,
  "man-technologist-dark-skin-tone": () =>
    require("./emojis/EmojiManTechnologistDarkSkinTone").default,
  "man-technologist-light-skin-tone": () =>
    require("./emojis/EmojiManTechnologistLightSkinTone").default,
  "man-technologist-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManTechnologistMediumDarkSkinTone").default,
  "man-technologist-medium-light-skin-tone": () =>
    require("./emojis/EmojiManTechnologistMediumLightSkinTone").default,
  "man-technologist-medium-skin-tone": () =>
    require("./emojis/EmojiManTechnologistMediumSkinTone").default,
  "man-tipping-hand": () => require("./emojis/EmojiManTippingHand").default,
  "man-tipping-hand-dark-skin-tone": () =>
    require("./emojis/EmojiManTippingHandDarkSkinTone").default,
  "man-tipping-hand-light-skin-tone": () =>
    require("./emojis/EmojiManTippingHandLightSkinTone").default,
  "man-tipping-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManTippingHandMediumDarkSkinTone").default,
  "man-tipping-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiManTippingHandMediumLightSkinTone").default,
  "man-tipping-hand-medium-skin-tone": () =>
    require("./emojis/EmojiManTippingHandMediumSkinTone").default,
  "man-vampire": () => require("./emojis/EmojiManVampire").default,
  "man-vampire-dark-skin-tone": () => require("./emojis/EmojiManVampireDarkSkinTone").default,
  "man-vampire-light-skin-tone": () => require("./emojis/EmojiManVampireLightSkinTone").default,
  "man-vampire-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManVampireMediumDarkSkinTone").default,
  "man-vampire-medium-light-skin-tone": () =>
    require("./emojis/EmojiManVampireMediumLightSkinTone").default,
  "man-vampire-medium-skin-tone": () => require("./emojis/EmojiManVampireMediumSkinTone").default,
  "man-walking": () => require("./emojis/EmojiManWalking").default,
  "man-walking-dark-skin-tone": () => require("./emojis/EmojiManWalkingDarkSkinTone").default,
  "man-walking-facing-right": () => require("./emojis/EmojiManWalkingFacingRight").default,
  "man-walking-facing-right-dark-skin-tone": () =>
    require("./emojis/EmojiManWalkingFacingRightDarkSkinTone").default,
  "man-walking-facing-right-light-skin-tone": () =>
    require("./emojis/EmojiManWalkingFacingRightLightSkinTone").default,
  "man-walking-facing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManWalkingFacingRightMediumDarkSkinTone").default,
  "man-walking-facing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiManWalkingFacingRightMediumLightSkinTone").default,
  "man-walking-facing-right-medium-skin-tone": () =>
    require("./emojis/EmojiManWalkingFacingRightMediumSkinTone").default,
  "man-walking-light-skin-tone": () => require("./emojis/EmojiManWalkingLightSkinTone").default,
  "man-walking-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManWalkingMediumDarkSkinTone").default,
  "man-walking-medium-light-skin-tone": () =>
    require("./emojis/EmojiManWalkingMediumLightSkinTone").default,
  "man-walking-medium-skin-tone": () => require("./emojis/EmojiManWalkingMediumSkinTone").default,
  "man-wearing-turban": () => require("./emojis/EmojiManWearingTurban").default,
  "man-wearing-turban-dark-skin-tone": () =>
    require("./emojis/EmojiManWearingTurbanDarkSkinTone").default,
  "man-wearing-turban-light-skin-tone": () =>
    require("./emojis/EmojiManWearingTurbanLightSkinTone").default,
  "man-wearing-turban-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManWearingTurbanMediumDarkSkinTone").default,
  "man-wearing-turban-medium-light-skin-tone": () =>
    require("./emojis/EmojiManWearingTurbanMediumLightSkinTone").default,
  "man-wearing-turban-medium-skin-tone": () =>
    require("./emojis/EmojiManWearingTurbanMediumSkinTone").default,
  "man-white-hair": () => require("./emojis/EmojiManWhiteHair").default,
  "man-with-veil": () => require("./emojis/EmojiManWithVeil").default,
  "man-with-veil-dark-skin-tone": () => require("./emojis/EmojiManWithVeilDarkSkinTone").default,
  "man-with-veil-light-skin-tone": () => require("./emojis/EmojiManWithVeilLightSkinTone").default,
  "man-with-veil-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManWithVeilMediumDarkSkinTone").default,
  "man-with-veil-medium-light-skin-tone": () =>
    require("./emojis/EmojiManWithVeilMediumLightSkinTone").default,
  "man-with-veil-medium-skin-tone": () =>
    require("./emojis/EmojiManWithVeilMediumSkinTone").default,
  "man-with-white-cane": () => require("./emojis/EmojiManWithWhiteCane").default,
  "man-with-white-cane-dark-skin-tone": () =>
    require("./emojis/EmojiManWithWhiteCaneDarkSkinTone").default,
  "man-with-white-cane-facing-right": () =>
    require("./emojis/EmojiManWithWhiteCaneFacingRight").default,
  "man-with-white-cane-facing-right-dark-skin-tone": () =>
    require("./emojis/EmojiManWithWhiteCaneFacingRightDarkSkinTone").default,
  "man-with-white-cane-facing-right-light-skin-tone": () =>
    require("./emojis/EmojiManWithWhiteCaneFacingRightLightSkinTone").default,
  "man-with-white-cane-facing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManWithWhiteCaneFacingRightMediumDarkSkinTone").default,
  "man-with-white-cane-facing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiManWithWhiteCaneFacingRightMediumLightSkinTone").default,
  "man-with-white-cane-facing-right-medium-skin-tone": () =>
    require("./emojis/EmojiManWithWhiteCaneFacingRightMediumSkinTone").default,
  "man-with-white-cane-light-skin-tone": () =>
    require("./emojis/EmojiManWithWhiteCaneLightSkinTone").default,
  "man-with-white-cane-medium-dark-skin-tone": () =>
    require("./emojis/EmojiManWithWhiteCaneMediumDarkSkinTone").default,
  "man-with-white-cane-medium-light-skin-tone": () =>
    require("./emojis/EmojiManWithWhiteCaneMediumLightSkinTone").default,
  "man-with-white-cane-medium-skin-tone": () =>
    require("./emojis/EmojiManWithWhiteCaneMediumSkinTone").default,
  "man-zombie": () => require("./emojis/EmojiManZombie").default,
  mango: () => require("./emojis/EmojiMango").default,
  "mans-shoe": () => require("./emojis/EmojiMansShoe").default,
  "mantelpiece-clock": () => require("./emojis/EmojiMantelpieceClock").default,
  "manual-wheelchair": () => require("./emojis/EmojiManualWheelchair").default,
  "map-of-japan": () => require("./emojis/EmojiMapOfJapan").default,
  "maple-leaf": () => require("./emojis/EmojiMapleLeaf").default,
  maracas: () => require("./emojis/EmojiMaracas").default,
  "martial-arts-uniform": () => require("./emojis/EmojiMartialArtsUniform").default,
  mate: () => require("./emojis/EmojiMate").default,
  "meat-on-bone": () => require("./emojis/EmojiMeatOnBone").default,
  mechanic: () => require("./emojis/EmojiMechanic").default,
  "mechanic-dark-skin-tone": () => require("./emojis/EmojiMechanicDarkSkinTone").default,
  "mechanic-light-skin-tone": () => require("./emojis/EmojiMechanicLightSkinTone").default,
  "mechanic-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMechanicMediumDarkSkinTone").default,
  "mechanic-medium-light-skin-tone": () =>
    require("./emojis/EmojiMechanicMediumLightSkinTone").default,
  "mechanic-medium-skin-tone": () => require("./emojis/EmojiMechanicMediumSkinTone").default,
  "mechanical-arm": () => require("./emojis/EmojiMechanicalArm").default,
  "mechanical-leg": () => require("./emojis/EmojiMechanicalLeg").default,
  "medical-symbol": () => require("./emojis/EmojiMedicalSymbol").default,
  "medium-dark-skin-tone": () => require("./emojis/EmojiMediumDarkSkinTone").default,
  "medium-light-skin-tone": () => require("./emojis/EmojiMediumLightSkinTone").default,
  "medium-skin-tone": () => require("./emojis/EmojiMediumSkinTone").default,
  megaphone: () => require("./emojis/EmojiMegaphone").default,
  melon: () => require("./emojis/EmojiMelon").default,
  "melting-face": () => require("./emojis/EmojiMeltingFace").default,
  memo: () => require("./emojis/EmojiMemo").default,
  "men-holding-hands": () => require("./emojis/EmojiMenHoldingHands").default,
  "men-holding-hands-dark-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsDarkSkinTone").default,
  "men-holding-hands-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsDarkSkinToneLightSkinTone").default,
  "men-holding-hands-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsDarkSkinToneMediumDarkSkinTone").default,
  "men-holding-hands-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsDarkSkinToneMediumLightSkinTone").default,
  "men-holding-hands-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsDarkSkinToneMediumSkinTone").default,
  "men-holding-hands-light-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsLightSkinTone").default,
  "men-holding-hands-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsLightSkinToneDarkSkinTone").default,
  "men-holding-hands-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsLightSkinToneMediumDarkSkinTone").default,
  "men-holding-hands-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsLightSkinToneMediumLightSkinTone").default,
  "men-holding-hands-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsLightSkinToneMediumSkinTone").default,
  "men-holding-hands-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsMediumDarkSkinTone").default,
  "men-holding-hands-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsMediumDarkSkinToneDarkSkinTone").default,
  "men-holding-hands-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsMediumDarkSkinToneLightSkinTone").default,
  "men-holding-hands-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsMediumDarkSkinToneMediumLightSkinTone").default,
  "men-holding-hands-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsMediumDarkSkinToneMediumSkinTone").default,
  "men-holding-hands-medium-light-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsMediumLightSkinTone").default,
  "men-holding-hands-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsMediumLightSkinToneDarkSkinTone").default,
  "men-holding-hands-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsMediumLightSkinToneLightSkinTone").default,
  "men-holding-hands-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsMediumLightSkinToneMediumDarkSkinTone").default,
  "men-holding-hands-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsMediumLightSkinToneMediumSkinTone").default,
  "men-holding-hands-medium-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsMediumSkinTone").default,
  "men-holding-hands-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsMediumSkinToneDarkSkinTone").default,
  "men-holding-hands-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsMediumSkinToneLightSkinTone").default,
  "men-holding-hands-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsMediumSkinToneMediumDarkSkinTone").default,
  "men-holding-hands-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiMenHoldingHandsMediumSkinToneMediumLightSkinTone").default,
  "men-with-bunny-ears": () => require("./emojis/EmojiMenWithBunnyEars").default,
  "men-with-bunny-ears-dark-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsDarkSkinTone").default,
  "men-with-bunny-ears-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsDarkSkinToneLightSkinTone").default,
  "men-with-bunny-ears-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsDarkSkinToneMediumDarkSkinTone").default,
  "men-with-bunny-ears-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsDarkSkinToneMediumLightSkinTone").default,
  "men-with-bunny-ears-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsDarkSkinToneMediumSkinTone").default,
  "men-with-bunny-ears-light-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsLightSkinTone").default,
  "men-with-bunny-ears-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsLightSkinToneDarkSkinTone").default,
  "men-with-bunny-ears-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsLightSkinToneMediumDarkSkinTone").default,
  "men-with-bunny-ears-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsLightSkinToneMediumLightSkinTone").default,
  "men-with-bunny-ears-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsLightSkinToneMediumSkinTone").default,
  "men-with-bunny-ears-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsMediumDarkSkinTone").default,
  "men-with-bunny-ears-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsMediumDarkSkinToneDarkSkinTone").default,
  "men-with-bunny-ears-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsMediumDarkSkinToneLightSkinTone").default,
  "men-with-bunny-ears-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsMediumDarkSkinToneMediumLightSkinTone").default,
  "men-with-bunny-ears-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsMediumDarkSkinToneMediumSkinTone").default,
  "men-with-bunny-ears-medium-light-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsMediumLightSkinTone").default,
  "men-with-bunny-ears-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsMediumLightSkinToneDarkSkinTone").default,
  "men-with-bunny-ears-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsMediumLightSkinToneLightSkinTone").default,
  "men-with-bunny-ears-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsMediumLightSkinToneMediumDarkSkinTone").default,
  "men-with-bunny-ears-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsMediumLightSkinToneMediumSkinTone").default,
  "men-with-bunny-ears-medium-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsMediumSkinTone").default,
  "men-with-bunny-ears-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsMediumSkinToneDarkSkinTone").default,
  "men-with-bunny-ears-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsMediumSkinToneLightSkinTone").default,
  "men-with-bunny-ears-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsMediumSkinToneMediumDarkSkinTone").default,
  "men-with-bunny-ears-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiMenWithBunnyEarsMediumSkinToneMediumLightSkinTone").default,
  "men-wrestling": () => require("./emojis/EmojiMenWrestling").default,
  "men-wrestling-dark-skin-tone": () => require("./emojis/EmojiMenWrestlingDarkSkinTone").default,
  "men-wrestling-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingDarkSkinToneLightSkinTone").default,
  "men-wrestling-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingDarkSkinToneMediumDarkSkinTone").default,
  "men-wrestling-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingDarkSkinToneMediumLightSkinTone").default,
  "men-wrestling-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingDarkSkinToneMediumSkinTone").default,
  "men-wrestling-light-skin-tone": () => require("./emojis/EmojiMenWrestlingLightSkinTone").default,
  "men-wrestling-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingLightSkinToneDarkSkinTone").default,
  "men-wrestling-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingLightSkinToneMediumDarkSkinTone").default,
  "men-wrestling-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingLightSkinToneMediumLightSkinTone").default,
  "men-wrestling-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingLightSkinToneMediumSkinTone").default,
  "men-wrestling-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingMediumDarkSkinTone").default,
  "men-wrestling-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingMediumDarkSkinToneDarkSkinTone").default,
  "men-wrestling-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingMediumDarkSkinToneLightSkinTone").default,
  "men-wrestling-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingMediumDarkSkinToneMediumLightSkinTone").default,
  "men-wrestling-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingMediumDarkSkinToneMediumSkinTone").default,
  "men-wrestling-medium-light-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingMediumLightSkinTone").default,
  "men-wrestling-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingMediumLightSkinToneDarkSkinTone").default,
  "men-wrestling-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingMediumLightSkinToneLightSkinTone").default,
  "men-wrestling-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingMediumLightSkinToneMediumDarkSkinTone").default,
  "men-wrestling-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingMediumLightSkinToneMediumSkinTone").default,
  "men-wrestling-medium-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingMediumSkinTone").default,
  "men-wrestling-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingMediumSkinToneDarkSkinTone").default,
  "men-wrestling-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingMediumSkinToneLightSkinTone").default,
  "men-wrestling-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingMediumSkinToneMediumDarkSkinTone").default,
  "men-wrestling-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiMenWrestlingMediumSkinToneMediumLightSkinTone").default,
  "mending-heart": () => require("./emojis/EmojiMendingHeart").default,
  menorah: () => require("./emojis/EmojiMenorah").default,
  "mens-room": () => require("./emojis/EmojiMensRoom").default,
  mermaid: () => require("./emojis/EmojiMermaid").default,
  "mermaid-dark-skin-tone": () => require("./emojis/EmojiMermaidDarkSkinTone").default,
  "mermaid-light-skin-tone": () => require("./emojis/EmojiMermaidLightSkinTone").default,
  "mermaid-medium-dark-skin-tone": () => require("./emojis/EmojiMermaidMediumDarkSkinTone").default,
  "mermaid-medium-light-skin-tone": () =>
    require("./emojis/EmojiMermaidMediumLightSkinTone").default,
  "mermaid-medium-skin-tone": () => require("./emojis/EmojiMermaidMediumSkinTone").default,
  "mermaid-tone1": () => require("./emojis/EmojiMermaidTone1").default,
  "mermaid-tone2": () => require("./emojis/EmojiMermaidTone2").default,
  "mermaid-tone3": () => require("./emojis/EmojiMermaidTone3").default,
  "mermaid-tone4": () => require("./emojis/EmojiMermaidTone4").default,
  "mermaid-tone5": () => require("./emojis/EmojiMermaidTone5").default,
  merman: () => require("./emojis/EmojiMerman").default,
  "merman-dark-skin-tone": () => require("./emojis/EmojiMermanDarkSkinTone").default,
  "merman-light-skin-tone": () => require("./emojis/EmojiMermanLightSkinTone").default,
  "merman-medium-dark-skin-tone": () => require("./emojis/EmojiMermanMediumDarkSkinTone").default,
  "merman-medium-light-skin-tone": () => require("./emojis/EmojiMermanMediumLightSkinTone").default,
  "merman-medium-skin-tone": () => require("./emojis/EmojiMermanMediumSkinTone").default,
  merperson: () => require("./emojis/EmojiMerperson").default,
  "merperson-dark-skin-tone": () => require("./emojis/EmojiMerpersonDarkSkinTone").default,
  "merperson-light-skin-tone": () => require("./emojis/EmojiMerpersonLightSkinTone").default,
  "merperson-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMerpersonMediumDarkSkinTone").default,
  "merperson-medium-light-skin-tone": () =>
    require("./emojis/EmojiMerpersonMediumLightSkinTone").default,
  "merperson-medium-skin-tone": () => require("./emojis/EmojiMerpersonMediumSkinTone").default,
  metro: () => require("./emojis/EmojiMetro").default,
  microbe: () => require("./emojis/EmojiMicrobe").default,
  microphone: () => require("./emojis/EmojiMicrophone").default,
  microscope: () => require("./emojis/EmojiMicroscope").default,
  "middle-finger": () => require("./emojis/EmojiMiddleFinger").default,
  "middle-finger-dark-skin-tone": () => require("./emojis/EmojiMiddleFingerDarkSkinTone").default,
  "middle-finger-light-skin-tone": () => require("./emojis/EmojiMiddleFingerLightSkinTone").default,
  "middle-finger-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMiddleFingerMediumDarkSkinTone").default,
  "middle-finger-medium-light-skin-tone": () =>
    require("./emojis/EmojiMiddleFingerMediumLightSkinTone").default,
  "middle-finger-medium-skin-tone": () =>
    require("./emojis/EmojiMiddleFingerMediumSkinTone").default,
  "military-helmet": () => require("./emojis/EmojiMilitaryHelmet").default,
  "military-medal": () => require("./emojis/EmojiMilitaryMedal").default,
  "milky-way": () => require("./emojis/EmojiMilkyWay").default,
  minibus: () => require("./emojis/EmojiMinibus").default,
  minus: () => require("./emojis/EmojiMinus").default,
  mirror: () => require("./emojis/EmojiMirror").default,
  "mirror-ball": () => require("./emojis/EmojiMirrorBall").default,
  moai: () => require("./emojis/EmojiMoai").default,
  "mobile-phone": () => require("./emojis/EmojiMobilePhone").default,
  "mobile-phone-off": () => require("./emojis/EmojiMobilePhoneOff").default,
  "mobile-phone-with-arrow": () => require("./emojis/EmojiMobilePhoneWithArrow").default,
  "money-bag": () => require("./emojis/EmojiMoneyBag").default,
  "money-mouth-face": () => require("./emojis/EmojiMoneyMouthFace").default,
  "money-with-wings": () => require("./emojis/EmojiMoneyWithWings").default,
  monkey: () => require("./emojis/EmojiMonkey").default,
  "monkey-face": () => require("./emojis/EmojiMonkeyFace").default,
  monorail: () => require("./emojis/EmojiMonorail").default,
  "moon-cake": () => require("./emojis/EmojiMoonCake").default,
  "moon-viewing-ceremony": () => require("./emojis/EmojiMoonViewingCeremony").default,
  moose: () => require("./emojis/EmojiMoose").default,
  mosque: () => require("./emojis/EmojiMosque").default,
  mosquito: () => require("./emojis/EmojiMosquito").default,
  "motor-boat": () => require("./emojis/EmojiMotorBoat").default,
  "motor-scooter": () => require("./emojis/EmojiMotorScooter").default,
  motorcycle: () => require("./emojis/EmojiMotorcycle").default,
  "motorized-wheelchair": () => require("./emojis/EmojiMotorizedWheelchair").default,
  motorway: () => require("./emojis/EmojiMotorway").default,
  "mount-fuji": () => require("./emojis/EmojiMountFuji").default,
  mountain: () => require("./emojis/EmojiMountain").default,
  "mountain-cableway": () => require("./emojis/EmojiMountainCableway").default,
  "mountain-railway": () => require("./emojis/EmojiMountainRailway").default,
  mouse: () => require("./emojis/EmojiMouse").default,
  "mouse-face": () => require("./emojis/EmojiMouseFace").default,
  "mouse-trap": () => require("./emojis/EmojiMouseTrap").default,
  mouth: () => require("./emojis/EmojiMouth").default,
  "movie-camera": () => require("./emojis/EmojiMovieCamera").default,
  "mrs-claus": () => require("./emojis/EmojiMrsClaus").default,
  "mrs-claus-dark-skin-tone": () => require("./emojis/EmojiMrsClausDarkSkinTone").default,
  "mrs-claus-light-skin-tone": () => require("./emojis/EmojiMrsClausLightSkinTone").default,
  "mrs-claus-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMrsClausMediumDarkSkinTone").default,
  "mrs-claus-medium-light-skin-tone": () =>
    require("./emojis/EmojiMrsClausMediumLightSkinTone").default,
  "mrs-claus-medium-skin-tone": () => require("./emojis/EmojiMrsClausMediumSkinTone").default,
  multiply: () => require("./emojis/EmojiMultiply").default,
  mushroom: () => require("./emojis/EmojiMushroom").default,
  "musical-keyboard": () => require("./emojis/EmojiMusicalKeyboard").default,
  "musical-note": () => require("./emojis/EmojiMusicalNote").default,
  "musical-notes": () => require("./emojis/EmojiMusicalNotes").default,
  "musical-score": () => require("./emojis/EmojiMusicalScore").default,
  "muted-speaker": () => require("./emojis/EmojiMutedSpeaker").default,
  "mx-claus": () => require("./emojis/EmojiMxClaus").default,
  "mx-claus-dark-skin-tone": () => require("./emojis/EmojiMxClausDarkSkinTone").default,
  "mx-claus-light-skin-tone": () => require("./emojis/EmojiMxClausLightSkinTone").default,
  "mx-claus-medium-dark-skin-tone": () =>
    require("./emojis/EmojiMxClausMediumDarkSkinTone").default,
  "mx-claus-medium-light-skin-tone": () =>
    require("./emojis/EmojiMxClausMediumLightSkinTone").default,
  "mx-claus-medium-skin-tone": () => require("./emojis/EmojiMxClausMediumSkinTone").default,
  "nail-polish": () => require("./emojis/EmojiNailPolish").default,
  "nail-polish-dark-skin-tone": () => require("./emojis/EmojiNailPolishDarkSkinTone").default,
  "nail-polish-light-skin-tone": () => require("./emojis/EmojiNailPolishLightSkinTone").default,
  "nail-polish-medium-dark-skin-tone": () =>
    require("./emojis/EmojiNailPolishMediumDarkSkinTone").default,
  "nail-polish-medium-light-skin-tone": () =>
    require("./emojis/EmojiNailPolishMediumLightSkinTone").default,
  "nail-polish-medium-skin-tone": () => require("./emojis/EmojiNailPolishMediumSkinTone").default,
  "name-badge": () => require("./emojis/EmojiNameBadge").default,
  "national-park": () => require("./emojis/EmojiNationalPark").default,
  "nauseated-face": () => require("./emojis/EmojiNauseatedFace").default,
  "nazar-amulet": () => require("./emojis/EmojiNazarAmulet").default,
  necktie: () => require("./emojis/EmojiNecktie").default,
  "nerd-face": () => require("./emojis/EmojiNerdFace").default,
  "nest-with-eggs": () => require("./emojis/EmojiNestWithEggs").default,
  "nesting-dolls": () => require("./emojis/EmojiNestingDolls").default,
  "neutral-face": () => require("./emojis/EmojiNeutralFace").default,
  "new-button": () => require("./emojis/EmojiNewButton").default,
  "new-moon": () => require("./emojis/EmojiNewMoon").default,
  "new-moon-face": () => require("./emojis/EmojiNewMoonFace").default,
  newspaper: () => require("./emojis/EmojiNewspaper").default,
  "next-track-button": () => require("./emojis/EmojiNextTrackButton").default,
  "ng-button": () => require("./emojis/EmojiNgButton").default,
  "night-with-stars": () => require("./emojis/EmojiNightWithStars").default,
  "nine-oclock": () => require("./emojis/EmojiNineOclock").default,
  "nine-thirty": () => require("./emojis/EmojiNineThirty").default,
  ninja: () => require("./emojis/EmojiNinja").default,
  "ninja-dark-skin-tone": () => require("./emojis/EmojiNinjaDarkSkinTone").default,
  "ninja-light-skin-tone": () => require("./emojis/EmojiNinjaLightSkinTone").default,
  "ninja-medium-dark-skin-tone": () => require("./emojis/EmojiNinjaMediumDarkSkinTone").default,
  "ninja-medium-light-skin-tone": () => require("./emojis/EmojiNinjaMediumLightSkinTone").default,
  "ninja-medium-skin-tone": () => require("./emojis/EmojiNinjaMediumSkinTone").default,
  "no-bicycles": () => require("./emojis/EmojiNoBicycles").default,
  "no-entry": () => require("./emojis/EmojiNoEntry").default,
  "no-littering": () => require("./emojis/EmojiNoLittering").default,
  "no-mobile-phones": () => require("./emojis/EmojiNoMobilePhones").default,
  "no-one-under-eighteen": () => require("./emojis/EmojiNoOneUnderEighteen").default,
  "no-pedestrians": () => require("./emojis/EmojiNoPedestrians").default,
  "no-smoking": () => require("./emojis/EmojiNoSmoking").default,
  "non-potable-water": () => require("./emojis/EmojiNonPotableWater").default,
  nose: () => require("./emojis/EmojiNose").default,
  "nose-dark-skin-tone": () => require("./emojis/EmojiNoseDarkSkinTone").default,
  "nose-light-skin-tone": () => require("./emojis/EmojiNoseLightSkinTone").default,
  "nose-medium-dark-skin-tone": () => require("./emojis/EmojiNoseMediumDarkSkinTone").default,
  "nose-medium-light-skin-tone": () => require("./emojis/EmojiNoseMediumLightSkinTone").default,
  "nose-medium-skin-tone": () => require("./emojis/EmojiNoseMediumSkinTone").default,
  notebook: () => require("./emojis/EmojiNotebook").default,
  "notebook-with-decorative-cover": () =>
    require("./emojis/EmojiNotebookWithDecorativeCover").default,
  "nut-and-bolt": () => require("./emojis/EmojiNutAndBolt").default,
  "o-button-blood-type": () => require("./emojis/EmojiOButtonBloodType").default,
  octopus: () => require("./emojis/EmojiOctopus").default,
  oden: () => require("./emojis/EmojiOden").default,
  "office-building": () => require("./emojis/EmojiOfficeBuilding").default,
  "office-worker": () => require("./emojis/EmojiOfficeWorker").default,
  "office-worker-dark-skin-tone": () => require("./emojis/EmojiOfficeWorkerDarkSkinTone").default,
  "office-worker-light-skin-tone": () => require("./emojis/EmojiOfficeWorkerLightSkinTone").default,
  "office-worker-medium-dark-skin-tone": () =>
    require("./emojis/EmojiOfficeWorkerMediumDarkSkinTone").default,
  "office-worker-medium-light-skin-tone": () =>
    require("./emojis/EmojiOfficeWorkerMediumLightSkinTone").default,
  "office-worker-medium-skin-tone": () =>
    require("./emojis/EmojiOfficeWorkerMediumSkinTone").default,
  ogre: () => require("./emojis/EmojiOgre").default,
  "oil-drum": () => require("./emojis/EmojiOilDrum").default,
  "ok-button": () => require("./emojis/EmojiOkButton").default,
  "ok-hand": () => require("./emojis/EmojiOkHand").default,
  "ok-hand-dark-skin-tone": () => require("./emojis/EmojiOkHandDarkSkinTone").default,
  "ok-hand-light-skin-tone": () => require("./emojis/EmojiOkHandLightSkinTone").default,
  "ok-hand-medium-dark-skin-tone": () => require("./emojis/EmojiOkHandMediumDarkSkinTone").default,
  "ok-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiOkHandMediumLightSkinTone").default,
  "ok-hand-medium-skin-tone": () => require("./emojis/EmojiOkHandMediumSkinTone").default,
  "old-key": () => require("./emojis/EmojiOldKey").default,
  "old-man": () => require("./emojis/EmojiOldMan").default,
  "old-man-dark-skin-tone": () => require("./emojis/EmojiOldManDarkSkinTone").default,
  "old-man-light-skin-tone": () => require("./emojis/EmojiOldManLightSkinTone").default,
  "old-man-medium-dark-skin-tone": () => require("./emojis/EmojiOldManMediumDarkSkinTone").default,
  "old-man-medium-light-skin-tone": () =>
    require("./emojis/EmojiOldManMediumLightSkinTone").default,
  "old-man-medium-skin-tone": () => require("./emojis/EmojiOldManMediumSkinTone").default,
  "old-woman": () => require("./emojis/EmojiOldWoman").default,
  "old-woman-dark-skin-tone": () => require("./emojis/EmojiOldWomanDarkSkinTone").default,
  "old-woman-light-skin-tone": () => require("./emojis/EmojiOldWomanLightSkinTone").default,
  "old-woman-medium-dark-skin-tone": () =>
    require("./emojis/EmojiOldWomanMediumDarkSkinTone").default,
  "old-woman-medium-light-skin-tone": () =>
    require("./emojis/EmojiOldWomanMediumLightSkinTone").default,
  "old-woman-medium-skin-tone": () => require("./emojis/EmojiOldWomanMediumSkinTone").default,
  "older-person": () => require("./emojis/EmojiOlderPerson").default,
  "older-person-dark-skin-tone": () => require("./emojis/EmojiOlderPersonDarkSkinTone").default,
  "older-person-light-skin-tone": () => require("./emojis/EmojiOlderPersonLightSkinTone").default,
  "older-person-medium-dark-skin-tone": () =>
    require("./emojis/EmojiOlderPersonMediumDarkSkinTone").default,
  "older-person-medium-light-skin-tone": () =>
    require("./emojis/EmojiOlderPersonMediumLightSkinTone").default,
  "older-person-medium-skin-tone": () => require("./emojis/EmojiOlderPersonMediumSkinTone").default,
  olive: () => require("./emojis/EmojiOlive").default,
  om: () => require("./emojis/EmojiOm").default,
  "on-exclamation-arrow": () => require("./emojis/EmojiOnExclamationArrow").default,
  "oncoming-automobile": () => require("./emojis/EmojiOncomingAutomobile").default,
  "oncoming-bus": () => require("./emojis/EmojiOncomingBus").default,
  "oncoming-fist": () => require("./emojis/EmojiOncomingFist").default,
  "oncoming-fist-dark-skin-tone": () => require("./emojis/EmojiOncomingFistDarkSkinTone").default,
  "oncoming-fist-light-skin-tone": () => require("./emojis/EmojiOncomingFistLightSkinTone").default,
  "oncoming-fist-medium-dark-skin-tone": () =>
    require("./emojis/EmojiOncomingFistMediumDarkSkinTone").default,
  "oncoming-fist-medium-light-skin-tone": () =>
    require("./emojis/EmojiOncomingFistMediumLightSkinTone").default,
  "oncoming-fist-medium-skin-tone": () =>
    require("./emojis/EmojiOncomingFistMediumSkinTone").default,
  "oncoming-police-car": () => require("./emojis/EmojiOncomingPoliceCar").default,
  "oncoming-taxi": () => require("./emojis/EmojiOncomingTaxi").default,
  "one-oclock": () => require("./emojis/EmojiOneOclock").default,
  "one-piece-swimsuit": () => require("./emojis/EmojiOnePieceSwimsuit").default,
  "one-thirty": () => require("./emojis/EmojiOneThirty").default,
  onion: () => require("./emojis/EmojiOnion").default,
  "open-book": () => require("./emojis/EmojiOpenBook").default,
  "open-file-folder": () => require("./emojis/EmojiOpenFileFolder").default,
  "open-hands": () => require("./emojis/EmojiOpenHands").default,
  "open-hands-dark-skin-tone": () => require("./emojis/EmojiOpenHandsDarkSkinTone").default,
  "open-hands-light-skin-tone": () => require("./emojis/EmojiOpenHandsLightSkinTone").default,
  "open-hands-medium-dark-skin-tone": () =>
    require("./emojis/EmojiOpenHandsMediumDarkSkinTone").default,
  "open-hands-medium-light-skin-tone": () =>
    require("./emojis/EmojiOpenHandsMediumLightSkinTone").default,
  "open-hands-medium-skin-tone": () => require("./emojis/EmojiOpenHandsMediumSkinTone").default,
  "open-mailbox-with-lowered-flag": () =>
    require("./emojis/EmojiOpenMailboxWithLoweredFlag").default,
  "open-mailbox-with-raised-flag": () => require("./emojis/EmojiOpenMailboxWithRaisedFlag").default,
  ophiuchus: () => require("./emojis/EmojiOphiuchus").default,
  "optical-disk": () => require("./emojis/EmojiOpticalDisk").default,
  "orange-book": () => require("./emojis/EmojiOrangeBook").default,
  "orange-circle": () => require("./emojis/EmojiOrangeCircle").default,
  "orange-heart": () => require("./emojis/EmojiOrangeHeart").default,
  "orange-square": () => require("./emojis/EmojiOrangeSquare").default,
  orangutan: () => require("./emojis/EmojiOrangutan").default,
  orca: () => require("./emojis/EmojiOrca").default,
  "orthodox-cross": () => require("./emojis/EmojiOrthodoxCross").default,
  otter: () => require("./emojis/EmojiOtter").default,
  "outbox-tray": () => require("./emojis/EmojiOutboxTray").default,
  owl: () => require("./emojis/EmojiOwl").default,
  ox: () => require("./emojis/EmojiOx").default,
  oyster: () => require("./emojis/EmojiOyster").default,
  "p-button": () => require("./emojis/EmojiPButton").default,
  package: () => require("./emojis/EmojiPackage").default,
  "page-facing-up": () => require("./emojis/EmojiPageFacingUp").default,
  "page-with-curl": () => require("./emojis/EmojiPageWithCurl").default,
  pager: () => require("./emojis/EmojiPager").default,
  paintbrush: () => require("./emojis/EmojiPaintbrush").default,
  "palm-down-hand": () => require("./emojis/EmojiPalmDownHand").default,
  "palm-down-hand-dark-skin-tone": () => require("./emojis/EmojiPalmDownHandDarkSkinTone").default,
  "palm-down-hand-light-skin-tone": () =>
    require("./emojis/EmojiPalmDownHandLightSkinTone").default,
  "palm-down-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPalmDownHandMediumDarkSkinTone").default,
  "palm-down-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiPalmDownHandMediumLightSkinTone").default,
  "palm-down-hand-medium-skin-tone": () =>
    require("./emojis/EmojiPalmDownHandMediumSkinTone").default,
  "palm-tree": () => require("./emojis/EmojiPalmTree").default,
  "palm-up-hand": () => require("./emojis/EmojiPalmUpHand").default,
  "palm-up-hand-dark-skin-tone": () => require("./emojis/EmojiPalmUpHandDarkSkinTone").default,
  "palm-up-hand-light-skin-tone": () => require("./emojis/EmojiPalmUpHandLightSkinTone").default,
  "palm-up-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPalmUpHandMediumDarkSkinTone").default,
  "palm-up-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiPalmUpHandMediumLightSkinTone").default,
  "palm-up-hand-medium-skin-tone": () => require("./emojis/EmojiPalmUpHandMediumSkinTone").default,
  "palms-up-together": () => require("./emojis/EmojiPalmsUpTogether").default,
  "palms-up-together-dark-skin-tone": () =>
    require("./emojis/EmojiPalmsUpTogetherDarkSkinTone").default,
  "palms-up-together-light-skin-tone": () =>
    require("./emojis/EmojiPalmsUpTogetherLightSkinTone").default,
  "palms-up-together-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPalmsUpTogetherMediumDarkSkinTone").default,
  "palms-up-together-medium-light-skin-tone": () =>
    require("./emojis/EmojiPalmsUpTogetherMediumLightSkinTone").default,
  "palms-up-together-medium-skin-tone": () =>
    require("./emojis/EmojiPalmsUpTogetherMediumSkinTone").default,
  pancakes: () => require("./emojis/EmojiPancakes").default,
  panda: () => require("./emojis/EmojiPanda").default,
  paperclip: () => require("./emojis/EmojiPaperclip").default,
  parachute: () => require("./emojis/EmojiParachute").default,
  parrot: () => require("./emojis/EmojiParrot").default,
  "part-alternation-mark": () => require("./emojis/EmojiPartAlternationMark").default,
  "party-popper": () => require("./emojis/EmojiPartyPopper").default,
  "partying-face": () => require("./emojis/EmojiPartyingFace").default,
  "passenger-ship": () => require("./emojis/EmojiPassengerShip").default,
  "passport-control": () => require("./emojis/EmojiPassportControl").default,
  "pause-button": () => require("./emojis/EmojiPauseButton").default,
  "paw-prints": () => require("./emojis/EmojiPawPrints").default,
  "pea-pod": () => require("./emojis/EmojiPeaPod").default,
  "peace-symbol": () => require("./emojis/EmojiPeaceSymbol").default,
  peach: () => require("./emojis/EmojiPeach").default,
  peacock: () => require("./emojis/EmojiPeacock").default,
  peanuts: () => require("./emojis/EmojiPeanuts").default,
  pear: () => require("./emojis/EmojiPear").default,
  pen: () => require("./emojis/EmojiPen").default,
  pencil: () => require("./emojis/EmojiPencil").default,
  penguin: () => require("./emojis/EmojiPenguin").default,
  "pensive-face": () => require("./emojis/EmojiPensiveFace").default,
  "people-holding-hands": () => require("./emojis/EmojiPeopleHoldingHands").default,
  "people-holding-hands-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsDarkSkinTone").default,
  "people-holding-hands-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsDarkSkinToneLightSkinTone").default,
  "people-holding-hands-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsDarkSkinToneMediumDarkSkinTone").default,
  "people-holding-hands-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsDarkSkinToneMediumLightSkinTone").default,
  "people-holding-hands-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsDarkSkinToneMediumSkinTone").default,
  "people-holding-hands-light-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsLightSkinTone").default,
  "people-holding-hands-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsLightSkinToneDarkSkinTone").default,
  "people-holding-hands-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsLightSkinToneMediumDarkSkinTone").default,
  "people-holding-hands-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsLightSkinToneMediumLightSkinTone").default,
  "people-holding-hands-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsLightSkinToneMediumSkinTone").default,
  "people-holding-hands-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsMediumDarkSkinTone").default,
  "people-holding-hands-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsMediumDarkSkinToneDarkSkinTone").default,
  "people-holding-hands-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsMediumDarkSkinToneLightSkinTone").default,
  "people-holding-hands-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsMediumDarkSkinToneMediumLightSkinTone").default,
  "people-holding-hands-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsMediumDarkSkinToneMediumSkinTone").default,
  "people-holding-hands-medium-light-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsMediumLightSkinTone").default,
  "people-holding-hands-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsMediumLightSkinToneDarkSkinTone").default,
  "people-holding-hands-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsMediumLightSkinToneLightSkinTone").default,
  "people-holding-hands-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsMediumLightSkinToneMediumDarkSkinTone").default,
  "people-holding-hands-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsMediumLightSkinToneMediumSkinTone").default,
  "people-holding-hands-medium-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsMediumSkinTone").default,
  "people-holding-hands-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsMediumSkinToneDarkSkinTone").default,
  "people-holding-hands-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsMediumSkinToneLightSkinTone").default,
  "people-holding-hands-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsMediumSkinToneMediumDarkSkinTone").default,
  "people-holding-hands-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiPeopleHoldingHandsMediumSkinToneMediumLightSkinTone").default,
  "people-hugging": () => require("./emojis/EmojiPeopleHugging").default,
  "people-with-bunny-ears": () => require("./emojis/EmojiPeopleWithBunnyEars").default,
  "people-with-bunny-ears-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsDarkSkinTone").default,
  "people-with-bunny-ears-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsDarkSkinToneLightSkinTone").default,
  "people-with-bunny-ears-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsDarkSkinToneMediumDarkSkinTone").default,
  "people-with-bunny-ears-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsDarkSkinToneMediumLightSkinTone").default,
  "people-with-bunny-ears-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsDarkSkinToneMediumSkinTone").default,
  "people-with-bunny-ears-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsLightSkinTone").default,
  "people-with-bunny-ears-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsLightSkinToneDarkSkinTone").default,
  "people-with-bunny-ears-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsLightSkinToneMediumDarkSkinTone").default,
  "people-with-bunny-ears-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsLightSkinToneMediumLightSkinTone").default,
  "people-with-bunny-ears-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsLightSkinToneMediumSkinTone").default,
  "people-with-bunny-ears-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsMediumDarkSkinTone").default,
  "people-with-bunny-ears-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsMediumDarkSkinToneDarkSkinTone").default,
  "people-with-bunny-ears-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsMediumDarkSkinToneLightSkinTone").default,
  "people-with-bunny-ears-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsMediumDarkSkinToneMediumLightSkinTone").default,
  "people-with-bunny-ears-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsMediumDarkSkinToneMediumSkinTone").default,
  "people-with-bunny-ears-medium-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsMediumLightSkinTone").default,
  "people-with-bunny-ears-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsMediumLightSkinToneDarkSkinTone").default,
  "people-with-bunny-ears-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsMediumLightSkinToneLightSkinTone").default,
  "people-with-bunny-ears-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsMediumLightSkinToneMediumDarkSkinTone").default,
  "people-with-bunny-ears-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsMediumLightSkinToneMediumSkinTone").default,
  "people-with-bunny-ears-medium-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsMediumSkinTone").default,
  "people-with-bunny-ears-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsMediumSkinToneDarkSkinTone").default,
  "people-with-bunny-ears-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsMediumSkinToneLightSkinTone").default,
  "people-with-bunny-ears-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsMediumSkinToneMediumDarkSkinTone").default,
  "people-with-bunny-ears-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWithBunnyEarsMediumSkinToneMediumLightSkinTone").default,
  "people-wrestling": () => require("./emojis/EmojiPeopleWrestling").default,
  "people-wrestling-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingDarkSkinTone").default,
  "people-wrestling-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingDarkSkinToneLightSkinTone").default,
  "people-wrestling-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingDarkSkinToneMediumDarkSkinTone").default,
  "people-wrestling-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingDarkSkinToneMediumLightSkinTone").default,
  "people-wrestling-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingDarkSkinToneMediumSkinTone").default,
  "people-wrestling-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingLightSkinTone").default,
  "people-wrestling-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingLightSkinToneDarkSkinTone").default,
  "people-wrestling-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingLightSkinToneMediumDarkSkinTone").default,
  "people-wrestling-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingLightSkinToneMediumLightSkinTone").default,
  "people-wrestling-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingLightSkinToneMediumSkinTone").default,
  "people-wrestling-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingMediumDarkSkinTone").default,
  "people-wrestling-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingMediumDarkSkinToneDarkSkinTone").default,
  "people-wrestling-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingMediumDarkSkinToneLightSkinTone").default,
  "people-wrestling-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingMediumDarkSkinToneMediumLightSkinTone").default,
  "people-wrestling-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingMediumDarkSkinToneMediumSkinTone").default,
  "people-wrestling-medium-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingMediumLightSkinTone").default,
  "people-wrestling-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingMediumLightSkinToneDarkSkinTone").default,
  "people-wrestling-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingMediumLightSkinToneLightSkinTone").default,
  "people-wrestling-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingMediumLightSkinToneMediumDarkSkinTone").default,
  "people-wrestling-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingMediumLightSkinToneMediumSkinTone").default,
  "people-wrestling-medium-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingMediumSkinTone").default,
  "people-wrestling-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingMediumSkinToneDarkSkinTone").default,
  "people-wrestling-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingMediumSkinToneLightSkinTone").default,
  "people-wrestling-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingMediumSkinToneMediumDarkSkinTone").default,
  "people-wrestling-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiPeopleWrestlingMediumSkinToneMediumLightSkinTone").default,
  "performing-arts": () => require("./emojis/EmojiPerformingArts").default,
  "persevering-face": () => require("./emojis/EmojiPerseveringFace").default,
  person: () => require("./emojis/EmojiPerson").default,
  "person-bald": () => require("./emojis/EmojiPersonBald").default,
  "person-beard": () => require("./emojis/EmojiPersonBeard").default,
  "person-biking": () => require("./emojis/EmojiPersonBiking").default,
  "person-biking-dark-skin-tone": () => require("./emojis/EmojiPersonBikingDarkSkinTone").default,
  "person-biking-light-skin-tone": () => require("./emojis/EmojiPersonBikingLightSkinTone").default,
  "person-biking-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonBikingMediumDarkSkinTone").default,
  "person-biking-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonBikingMediumLightSkinTone").default,
  "person-biking-medium-skin-tone": () =>
    require("./emojis/EmojiPersonBikingMediumSkinTone").default,
  "person-blond-hair": () => require("./emojis/EmojiPersonBlondHair").default,
  "person-bouncing-ball": () => require("./emojis/EmojiPersonBouncingBall").default,
  "person-bouncing-ball-dark-skin-tone": () =>
    require("./emojis/EmojiPersonBouncingBallDarkSkinTone").default,
  "person-bouncing-ball-light-skin-tone": () =>
    require("./emojis/EmojiPersonBouncingBallLightSkinTone").default,
  "person-bouncing-ball-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonBouncingBallMediumDarkSkinTone").default,
  "person-bouncing-ball-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonBouncingBallMediumLightSkinTone").default,
  "person-bouncing-ball-medium-skin-tone": () =>
    require("./emojis/EmojiPersonBouncingBallMediumSkinTone").default,
  "person-bowing": () => require("./emojis/EmojiPersonBowing").default,
  "person-bowing-dark-skin-tone": () => require("./emojis/EmojiPersonBowingDarkSkinTone").default,
  "person-bowing-light-skin-tone": () => require("./emojis/EmojiPersonBowingLightSkinTone").default,
  "person-bowing-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonBowingMediumDarkSkinTone").default,
  "person-bowing-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonBowingMediumLightSkinTone").default,
  "person-bowing-medium-skin-tone": () =>
    require("./emojis/EmojiPersonBowingMediumSkinTone").default,
  "person-cartwheeling": () => require("./emojis/EmojiPersonCartwheeling").default,
  "person-cartwheeling-dark-skin-tone": () =>
    require("./emojis/EmojiPersonCartwheelingDarkSkinTone").default,
  "person-cartwheeling-light-skin-tone": () =>
    require("./emojis/EmojiPersonCartwheelingLightSkinTone").default,
  "person-cartwheeling-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonCartwheelingMediumDarkSkinTone").default,
  "person-cartwheeling-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonCartwheelingMediumLightSkinTone").default,
  "person-cartwheeling-medium-skin-tone": () =>
    require("./emojis/EmojiPersonCartwheelingMediumSkinTone").default,
  "person-climbing": () => require("./emojis/EmojiPersonClimbing").default,
  "person-climbing-dark-skin-tone": () =>
    require("./emojis/EmojiPersonClimbingDarkSkinTone").default,
  "person-climbing-light-skin-tone": () =>
    require("./emojis/EmojiPersonClimbingLightSkinTone").default,
  "person-climbing-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonClimbingMediumDarkSkinTone").default,
  "person-climbing-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonClimbingMediumLightSkinTone").default,
  "person-climbing-medium-skin-tone": () =>
    require("./emojis/EmojiPersonClimbingMediumSkinTone").default,
  "person-curly-hair": () => require("./emojis/EmojiPersonCurlyHair").default,
  "person-dark-skin-tone": () => require("./emojis/EmojiPersonDarkSkinTone").default,
  "person-dark-skin-tone-bald": () => require("./emojis/EmojiPersonDarkSkinToneBald").default,
  "person-dark-skin-tone-beard": () => require("./emojis/EmojiPersonDarkSkinToneBeard").default,
  "person-dark-skin-tone-blond-hair": () =>
    require("./emojis/EmojiPersonDarkSkinToneBlondHair").default,
  "person-dark-skin-tone-curly-hair": () =>
    require("./emojis/EmojiPersonDarkSkinToneCurlyHair").default,
  "person-dark-skin-tone-red-hair": () =>
    require("./emojis/EmojiPersonDarkSkinToneRedHair").default,
  "person-dark-skin-tone-white-hair": () =>
    require("./emojis/EmojiPersonDarkSkinToneWhiteHair").default,
  "person-facepalming": () => require("./emojis/EmojiPersonFacepalming").default,
  "person-facepalming-dark-skin-tone": () =>
    require("./emojis/EmojiPersonFacepalmingDarkSkinTone").default,
  "person-facepalming-light-skin-tone": () =>
    require("./emojis/EmojiPersonFacepalmingLightSkinTone").default,
  "person-facepalming-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonFacepalmingMediumDarkSkinTone").default,
  "person-facepalming-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonFacepalmingMediumLightSkinTone").default,
  "person-facepalming-medium-skin-tone": () =>
    require("./emojis/EmojiPersonFacepalmingMediumSkinTone").default,
  "person-feeding-baby": () => require("./emojis/EmojiPersonFeedingBaby").default,
  "person-feeding-baby-dark-skin-tone": () =>
    require("./emojis/EmojiPersonFeedingBabyDarkSkinTone").default,
  "person-feeding-baby-light-skin-tone": () =>
    require("./emojis/EmojiPersonFeedingBabyLightSkinTone").default,
  "person-feeding-baby-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonFeedingBabyMediumDarkSkinTone").default,
  "person-feeding-baby-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonFeedingBabyMediumLightSkinTone").default,
  "person-feeding-baby-medium-skin-tone": () =>
    require("./emojis/EmojiPersonFeedingBabyMediumSkinTone").default,
  "person-fencing": () => require("./emojis/EmojiPersonFencing").default,
  "person-frowning": () => require("./emojis/EmojiPersonFrowning").default,
  "person-frowning-dark-skin-tone": () =>
    require("./emojis/EmojiPersonFrowningDarkSkinTone").default,
  "person-frowning-light-skin-tone": () =>
    require("./emojis/EmojiPersonFrowningLightSkinTone").default,
  "person-frowning-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonFrowningMediumDarkSkinTone").default,
  "person-frowning-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonFrowningMediumLightSkinTone").default,
  "person-frowning-medium-skin-tone": () =>
    require("./emojis/EmojiPersonFrowningMediumSkinTone").default,
  "person-gesturing-no": () => require("./emojis/EmojiPersonGesturingNo").default,
  "person-gesturing-no-dark-skin-tone": () =>
    require("./emojis/EmojiPersonGesturingNoDarkSkinTone").default,
  "person-gesturing-no-light-skin-tone": () =>
    require("./emojis/EmojiPersonGesturingNoLightSkinTone").default,
  "person-gesturing-no-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonGesturingNoMediumDarkSkinTone").default,
  "person-gesturing-no-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonGesturingNoMediumLightSkinTone").default,
  "person-gesturing-no-medium-skin-tone": () =>
    require("./emojis/EmojiPersonGesturingNoMediumSkinTone").default,
  "person-gesturing-ok": () => require("./emojis/EmojiPersonGesturingOk").default,
  "person-gesturing-ok-dark-skin-tone": () =>
    require("./emojis/EmojiPersonGesturingOkDarkSkinTone").default,
  "person-gesturing-ok-light-skin-tone": () =>
    require("./emojis/EmojiPersonGesturingOkLightSkinTone").default,
  "person-gesturing-ok-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonGesturingOkMediumDarkSkinTone").default,
  "person-gesturing-ok-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonGesturingOkMediumLightSkinTone").default,
  "person-gesturing-ok-medium-skin-tone": () =>
    require("./emojis/EmojiPersonGesturingOkMediumSkinTone").default,
  "person-getting-haircut": () => require("./emojis/EmojiPersonGettingHaircut").default,
  "person-getting-haircut-dark-skin-tone": () =>
    require("./emojis/EmojiPersonGettingHaircutDarkSkinTone").default,
  "person-getting-haircut-light-skin-tone": () =>
    require("./emojis/EmojiPersonGettingHaircutLightSkinTone").default,
  "person-getting-haircut-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonGettingHaircutMediumDarkSkinTone").default,
  "person-getting-haircut-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonGettingHaircutMediumLightSkinTone").default,
  "person-getting-haircut-medium-skin-tone": () =>
    require("./emojis/EmojiPersonGettingHaircutMediumSkinTone").default,
  "person-getting-massage": () => require("./emojis/EmojiPersonGettingMassage").default,
  "person-getting-massage-dark-skin-tone": () =>
    require("./emojis/EmojiPersonGettingMassageDarkSkinTone").default,
  "person-getting-massage-light-skin-tone": () =>
    require("./emojis/EmojiPersonGettingMassageLightSkinTone").default,
  "person-getting-massage-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonGettingMassageMediumDarkSkinTone").default,
  "person-getting-massage-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonGettingMassageMediumLightSkinTone").default,
  "person-getting-massage-medium-skin-tone": () =>
    require("./emojis/EmojiPersonGettingMassageMediumSkinTone").default,
  "person-golfing": () => require("./emojis/EmojiPersonGolfing").default,
  "person-golfing-dark-skin-tone": () => require("./emojis/EmojiPersonGolfingDarkSkinTone").default,
  "person-golfing-light-skin-tone": () =>
    require("./emojis/EmojiPersonGolfingLightSkinTone").default,
  "person-golfing-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonGolfingMediumDarkSkinTone").default,
  "person-golfing-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonGolfingMediumLightSkinTone").default,
  "person-golfing-medium-skin-tone": () =>
    require("./emojis/EmojiPersonGolfingMediumSkinTone").default,
  "person-in-bed": () => require("./emojis/EmojiPersonInBed").default,
  "person-in-bed-dark-skin-tone": () => require("./emojis/EmojiPersonInBedDarkSkinTone").default,
  "person-in-bed-light-skin-tone": () => require("./emojis/EmojiPersonInBedLightSkinTone").default,
  "person-in-bed-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonInBedMediumDarkSkinTone").default,
  "person-in-bed-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonInBedMediumLightSkinTone").default,
  "person-in-bed-medium-skin-tone": () =>
    require("./emojis/EmojiPersonInBedMediumSkinTone").default,
  "person-in-lotus-position": () => require("./emojis/EmojiPersonInLotusPosition").default,
  "person-in-lotus-position-dark-skin-tone": () =>
    require("./emojis/EmojiPersonInLotusPositionDarkSkinTone").default,
  "person-in-lotus-position-light-skin-tone": () =>
    require("./emojis/EmojiPersonInLotusPositionLightSkinTone").default,
  "person-in-lotus-position-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonInLotusPositionMediumDarkSkinTone").default,
  "person-in-lotus-position-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonInLotusPositionMediumLightSkinTone").default,
  "person-in-lotus-position-medium-skin-tone": () =>
    require("./emojis/EmojiPersonInLotusPositionMediumSkinTone").default,
  "person-in-manual-wheelchair": () => require("./emojis/EmojiPersonInManualWheelchair").default,
  "person-in-manual-wheelchair-dark-skin-tone": () =>
    require("./emojis/EmojiPersonInManualWheelchairDarkSkinTone").default,
  "person-in-manual-wheelchair-facing-right": () =>
    require("./emojis/EmojiPersonInManualWheelchairFacingRight").default,
  "person-in-manual-wheelchair-facing-right-dark-skin-tone": () =>
    require("./emojis/EmojiPersonInManualWheelchairFacingRightDarkSkinTone").default,
  "person-in-manual-wheelchair-facing-right-light-skin-tone": () =>
    require("./emojis/EmojiPersonInManualWheelchairFacingRightLightSkinTone").default,
  "person-in-manual-wheelchair-facing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonInManualWheelchairFacingRightMediumDarkSkinTone").default,
  "person-in-manual-wheelchair-facing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonInManualWheelchairFacingRightMediumLightSkinTone").default,
  "person-in-manual-wheelchair-facing-right-medium-skin-tone": () =>
    require("./emojis/EmojiPersonInManualWheelchairFacingRightMediumSkinTone").default,
  "person-in-manual-wheelchair-light-skin-tone": () =>
    require("./emojis/EmojiPersonInManualWheelchairLightSkinTone").default,
  "person-in-manual-wheelchair-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonInManualWheelchairMediumDarkSkinTone").default,
  "person-in-manual-wheelchair-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonInManualWheelchairMediumLightSkinTone").default,
  "person-in-manual-wheelchair-medium-skin-tone": () =>
    require("./emojis/EmojiPersonInManualWheelchairMediumSkinTone").default,
  "person-in-motorized-wheelchair": () =>
    require("./emojis/EmojiPersonInMotorizedWheelchair").default,
  "person-in-motorized-wheelchair-dark-skin-tone": () =>
    require("./emojis/EmojiPersonInMotorizedWheelchairDarkSkinTone").default,
  "person-in-motorized-wheelchair-facing-right": () =>
    require("./emojis/EmojiPersonInMotorizedWheelchairFacingRight").default,
  "person-in-motorized-wheelchair-facing-right-dark-skin-tone": () =>
    require("./emojis/EmojiPersonInMotorizedWheelchairFacingRightDarkSkinTone").default,
  "person-in-motorized-wheelchair-facing-right-light-skin-tone": () =>
    require("./emojis/EmojiPersonInMotorizedWheelchairFacingRightLightSkinTone").default,
  "person-in-motorized-wheelchair-facing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonInMotorizedWheelchairFacingRightMediumDarkSkinTone").default,
  "person-in-motorized-wheelchair-facing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonInMotorizedWheelchairFacingRightMediumLightSkinTone").default,
  "person-in-motorized-wheelchair-facing-right-medium-skin-tone": () =>
    require("./emojis/EmojiPersonInMotorizedWheelchairFacingRightMediumSkinTone").default,
  "person-in-motorized-wheelchair-light-skin-tone": () =>
    require("./emojis/EmojiPersonInMotorizedWheelchairLightSkinTone").default,
  "person-in-motorized-wheelchair-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonInMotorizedWheelchairMediumDarkSkinTone").default,
  "person-in-motorized-wheelchair-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonInMotorizedWheelchairMediumLightSkinTone").default,
  "person-in-motorized-wheelchair-medium-skin-tone": () =>
    require("./emojis/EmojiPersonInMotorizedWheelchairMediumSkinTone").default,
  "person-in-steamy-room": () => require("./emojis/EmojiPersonInSteamyRoom").default,
  "person-in-steamy-room-dark-skin-tone": () =>
    require("./emojis/EmojiPersonInSteamyRoomDarkSkinTone").default,
  "person-in-steamy-room-light-skin-tone": () =>
    require("./emojis/EmojiPersonInSteamyRoomLightSkinTone").default,
  "person-in-steamy-room-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonInSteamyRoomMediumDarkSkinTone").default,
  "person-in-steamy-room-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonInSteamyRoomMediumLightSkinTone").default,
  "person-in-steamy-room-medium-skin-tone": () =>
    require("./emojis/EmojiPersonInSteamyRoomMediumSkinTone").default,
  "person-in-suit-levitating": () => require("./emojis/EmojiPersonInSuitLevitating").default,
  "person-in-suit-levitating-dark-skin-tone": () =>
    require("./emojis/EmojiPersonInSuitLevitatingDarkSkinTone").default,
  "person-in-suit-levitating-light-skin-tone": () =>
    require("./emojis/EmojiPersonInSuitLevitatingLightSkinTone").default,
  "person-in-suit-levitating-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonInSuitLevitatingMediumDarkSkinTone").default,
  "person-in-suit-levitating-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonInSuitLevitatingMediumLightSkinTone").default,
  "person-in-suit-levitating-medium-skin-tone": () =>
    require("./emojis/EmojiPersonInSuitLevitatingMediumSkinTone").default,
  "person-in-tuxedo": () => require("./emojis/EmojiPersonInTuxedo").default,
  "person-in-tuxedo-dark-skin-tone": () =>
    require("./emojis/EmojiPersonInTuxedoDarkSkinTone").default,
  "person-in-tuxedo-light-skin-tone": () =>
    require("./emojis/EmojiPersonInTuxedoLightSkinTone").default,
  "person-in-tuxedo-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonInTuxedoMediumDarkSkinTone").default,
  "person-in-tuxedo-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonInTuxedoMediumLightSkinTone").default,
  "person-in-tuxedo-medium-skin-tone": () =>
    require("./emojis/EmojiPersonInTuxedoMediumSkinTone").default,
  "person-juggling": () => require("./emojis/EmojiPersonJuggling").default,
  "person-juggling-dark-skin-tone": () =>
    require("./emojis/EmojiPersonJugglingDarkSkinTone").default,
  "person-juggling-light-skin-tone": () =>
    require("./emojis/EmojiPersonJugglingLightSkinTone").default,
  "person-juggling-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonJugglingMediumDarkSkinTone").default,
  "person-juggling-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonJugglingMediumLightSkinTone").default,
  "person-juggling-medium-skin-tone": () =>
    require("./emojis/EmojiPersonJugglingMediumSkinTone").default,
  "person-kneeling": () => require("./emojis/EmojiPersonKneeling").default,
  "person-kneeling-dark-skin-tone": () =>
    require("./emojis/EmojiPersonKneelingDarkSkinTone").default,
  "person-kneeling-facing-right": () => require("./emojis/EmojiPersonKneelingFacingRight").default,
  "person-kneeling-facing-right-dark-skin-tone": () =>
    require("./emojis/EmojiPersonKneelingFacingRightDarkSkinTone").default,
  "person-kneeling-facing-right-light-skin-tone": () =>
    require("./emojis/EmojiPersonKneelingFacingRightLightSkinTone").default,
  "person-kneeling-facing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonKneelingFacingRightMediumDarkSkinTone").default,
  "person-kneeling-facing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonKneelingFacingRightMediumLightSkinTone").default,
  "person-kneeling-facing-right-medium-skin-tone": () =>
    require("./emojis/EmojiPersonKneelingFacingRightMediumSkinTone").default,
  "person-kneeling-light-skin-tone": () =>
    require("./emojis/EmojiPersonKneelingLightSkinTone").default,
  "person-kneeling-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonKneelingMediumDarkSkinTone").default,
  "person-kneeling-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonKneelingMediumLightSkinTone").default,
  "person-kneeling-medium-skin-tone": () =>
    require("./emojis/EmojiPersonKneelingMediumSkinTone").default,
  "person-lifting-weights": () => require("./emojis/EmojiPersonLiftingWeights").default,
  "person-lifting-weights-dark-skin-tone": () =>
    require("./emojis/EmojiPersonLiftingWeightsDarkSkinTone").default,
  "person-lifting-weights-light-skin-tone": () =>
    require("./emojis/EmojiPersonLiftingWeightsLightSkinTone").default,
  "person-lifting-weights-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonLiftingWeightsMediumDarkSkinTone").default,
  "person-lifting-weights-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonLiftingWeightsMediumLightSkinTone").default,
  "person-lifting-weights-medium-skin-tone": () =>
    require("./emojis/EmojiPersonLiftingWeightsMediumSkinTone").default,
  "person-light-skin-tone": () => require("./emojis/EmojiPersonLightSkinTone").default,
  "person-light-skin-tone-bald": () => require("./emojis/EmojiPersonLightSkinToneBald").default,
  "person-light-skin-tone-beard": () => require("./emojis/EmojiPersonLightSkinToneBeard").default,
  "person-light-skin-tone-blond-hair": () =>
    require("./emojis/EmojiPersonLightSkinToneBlondHair").default,
  "person-light-skin-tone-curly-hair": () =>
    require("./emojis/EmojiPersonLightSkinToneCurlyHair").default,
  "person-light-skin-tone-red-hair": () =>
    require("./emojis/EmojiPersonLightSkinToneRedHair").default,
  "person-light-skin-tone-white-hair": () =>
    require("./emojis/EmojiPersonLightSkinToneWhiteHair").default,
  "person-medium-dark-skin-tone": () => require("./emojis/EmojiPersonMediumDarkSkinTone").default,
  "person-medium-dark-skin-tone-bald": () =>
    require("./emojis/EmojiPersonMediumDarkSkinToneBald").default,
  "person-medium-dark-skin-tone-beard": () =>
    require("./emojis/EmojiPersonMediumDarkSkinToneBeard").default,
  "person-medium-dark-skin-tone-blond-hair": () =>
    require("./emojis/EmojiPersonMediumDarkSkinToneBlondHair").default,
  "person-medium-dark-skin-tone-curly-hair": () =>
    require("./emojis/EmojiPersonMediumDarkSkinToneCurlyHair").default,
  "person-medium-dark-skin-tone-red-hair": () =>
    require("./emojis/EmojiPersonMediumDarkSkinToneRedHair").default,
  "person-medium-dark-skin-tone-white-hair": () =>
    require("./emojis/EmojiPersonMediumDarkSkinToneWhiteHair").default,
  "person-medium-light-skin-tone": () => require("./emojis/EmojiPersonMediumLightSkinTone").default,
  "person-medium-light-skin-tone-bald": () =>
    require("./emojis/EmojiPersonMediumLightSkinToneBald").default,
  "person-medium-light-skin-tone-beard": () =>
    require("./emojis/EmojiPersonMediumLightSkinToneBeard").default,
  "person-medium-light-skin-tone-blond-hair": () =>
    require("./emojis/EmojiPersonMediumLightSkinToneBlondHair").default,
  "person-medium-light-skin-tone-curly-hair": () =>
    require("./emojis/EmojiPersonMediumLightSkinToneCurlyHair").default,
  "person-medium-light-skin-tone-red-hair": () =>
    require("./emojis/EmojiPersonMediumLightSkinToneRedHair").default,
  "person-medium-light-skin-tone-white-hair": () =>
    require("./emojis/EmojiPersonMediumLightSkinToneWhiteHair").default,
  "person-medium-skin-tone": () => require("./emojis/EmojiPersonMediumSkinTone").default,
  "person-medium-skin-tone-bald": () => require("./emojis/EmojiPersonMediumSkinToneBald").default,
  "person-medium-skin-tone-beard": () => require("./emojis/EmojiPersonMediumSkinToneBeard").default,
  "person-medium-skin-tone-blond-hair": () =>
    require("./emojis/EmojiPersonMediumSkinToneBlondHair").default,
  "person-medium-skin-tone-curly-hair": () =>
    require("./emojis/EmojiPersonMediumSkinToneCurlyHair").default,
  "person-medium-skin-tone-red-hair": () =>
    require("./emojis/EmojiPersonMediumSkinToneRedHair").default,
  "person-medium-skin-tone-white-hair": () =>
    require("./emojis/EmojiPersonMediumSkinToneWhiteHair").default,
  "person-mountain-biking": () => require("./emojis/EmojiPersonMountainBiking").default,
  "person-mountain-biking-dark-skin-tone": () =>
    require("./emojis/EmojiPersonMountainBikingDarkSkinTone").default,
  "person-mountain-biking-light-skin-tone": () =>
    require("./emojis/EmojiPersonMountainBikingLightSkinTone").default,
  "person-mountain-biking-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonMountainBikingMediumDarkSkinTone").default,
  "person-mountain-biking-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonMountainBikingMediumLightSkinTone").default,
  "person-mountain-biking-medium-skin-tone": () =>
    require("./emojis/EmojiPersonMountainBikingMediumSkinTone").default,
  "person-playing-handball": () => require("./emojis/EmojiPersonPlayingHandball").default,
  "person-playing-handball-dark-skin-tone": () =>
    require("./emojis/EmojiPersonPlayingHandballDarkSkinTone").default,
  "person-playing-handball-light-skin-tone": () =>
    require("./emojis/EmojiPersonPlayingHandballLightSkinTone").default,
  "person-playing-handball-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonPlayingHandballMediumDarkSkinTone").default,
  "person-playing-handball-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonPlayingHandballMediumLightSkinTone").default,
  "person-playing-handball-medium-skin-tone": () =>
    require("./emojis/EmojiPersonPlayingHandballMediumSkinTone").default,
  "person-playing-water-polo": () => require("./emojis/EmojiPersonPlayingWaterPolo").default,
  "person-playing-water-polo-dark-skin-tone": () =>
    require("./emojis/EmojiPersonPlayingWaterPoloDarkSkinTone").default,
  "person-playing-water-polo-light-skin-tone": () =>
    require("./emojis/EmojiPersonPlayingWaterPoloLightSkinTone").default,
  "person-playing-water-polo-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonPlayingWaterPoloMediumDarkSkinTone").default,
  "person-playing-water-polo-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonPlayingWaterPoloMediumLightSkinTone").default,
  "person-playing-water-polo-medium-skin-tone": () =>
    require("./emojis/EmojiPersonPlayingWaterPoloMediumSkinTone").default,
  "person-pouting": () => require("./emojis/EmojiPersonPouting").default,
  "person-pouting-dark-skin-tone": () => require("./emojis/EmojiPersonPoutingDarkSkinTone").default,
  "person-pouting-light-skin-tone": () =>
    require("./emojis/EmojiPersonPoutingLightSkinTone").default,
  "person-pouting-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonPoutingMediumDarkSkinTone").default,
  "person-pouting-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonPoutingMediumLightSkinTone").default,
  "person-pouting-medium-skin-tone": () =>
    require("./emojis/EmojiPersonPoutingMediumSkinTone").default,
  "person-raising-hand": () => require("./emojis/EmojiPersonRaisingHand").default,
  "person-raising-hand-dark-skin-tone": () =>
    require("./emojis/EmojiPersonRaisingHandDarkSkinTone").default,
  "person-raising-hand-light-skin-tone": () =>
    require("./emojis/EmojiPersonRaisingHandLightSkinTone").default,
  "person-raising-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonRaisingHandMediumDarkSkinTone").default,
  "person-raising-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonRaisingHandMediumLightSkinTone").default,
  "person-raising-hand-medium-skin-tone": () =>
    require("./emojis/EmojiPersonRaisingHandMediumSkinTone").default,
  "person-red-hair": () => require("./emojis/EmojiPersonRedHair").default,
  "person-rowing-boat": () => require("./emojis/EmojiPersonRowingBoat").default,
  "person-rowing-boat-dark-skin-tone": () =>
    require("./emojis/EmojiPersonRowingBoatDarkSkinTone").default,
  "person-rowing-boat-light-skin-tone": () =>
    require("./emojis/EmojiPersonRowingBoatLightSkinTone").default,
  "person-rowing-boat-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonRowingBoatMediumDarkSkinTone").default,
  "person-rowing-boat-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonRowingBoatMediumLightSkinTone").default,
  "person-rowing-boat-medium-skin-tone": () =>
    require("./emojis/EmojiPersonRowingBoatMediumSkinTone").default,
  "person-running": () => require("./emojis/EmojiPersonRunning").default,
  "person-running-dark-skin-tone": () => require("./emojis/EmojiPersonRunningDarkSkinTone").default,
  "person-running-facing-right": () => require("./emojis/EmojiPersonRunningFacingRight").default,
  "person-running-facing-right-dark-skin-tone": () =>
    require("./emojis/EmojiPersonRunningFacingRightDarkSkinTone").default,
  "person-running-facing-right-light-skin-tone": () =>
    require("./emojis/EmojiPersonRunningFacingRightLightSkinTone").default,
  "person-running-facing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonRunningFacingRightMediumDarkSkinTone").default,
  "person-running-facing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonRunningFacingRightMediumLightSkinTone").default,
  "person-running-facing-right-medium-skin-tone": () =>
    require("./emojis/EmojiPersonRunningFacingRightMediumSkinTone").default,
  "person-running-light-skin-tone": () =>
    require("./emojis/EmojiPersonRunningLightSkinTone").default,
  "person-running-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonRunningMediumDarkSkinTone").default,
  "person-running-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonRunningMediumLightSkinTone").default,
  "person-running-medium-skin-tone": () =>
    require("./emojis/EmojiPersonRunningMediumSkinTone").default,
  "person-shrugging": () => require("./emojis/EmojiPersonShrugging").default,
  "person-shrugging-dark-skin-tone": () =>
    require("./emojis/EmojiPersonShruggingDarkSkinTone").default,
  "person-shrugging-light-skin-tone": () =>
    require("./emojis/EmojiPersonShruggingLightSkinTone").default,
  "person-shrugging-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonShruggingMediumDarkSkinTone").default,
  "person-shrugging-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonShruggingMediumLightSkinTone").default,
  "person-shrugging-medium-skin-tone": () =>
    require("./emojis/EmojiPersonShruggingMediumSkinTone").default,
  "person-standing": () => require("./emojis/EmojiPersonStanding").default,
  "person-standing-dark-skin-tone": () =>
    require("./emojis/EmojiPersonStandingDarkSkinTone").default,
  "person-standing-light-skin-tone": () =>
    require("./emojis/EmojiPersonStandingLightSkinTone").default,
  "person-standing-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonStandingMediumDarkSkinTone").default,
  "person-standing-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonStandingMediumLightSkinTone").default,
  "person-standing-medium-skin-tone": () =>
    require("./emojis/EmojiPersonStandingMediumSkinTone").default,
  "person-surfing": () => require("./emojis/EmojiPersonSurfing").default,
  "person-surfing-dark-skin-tone": () => require("./emojis/EmojiPersonSurfingDarkSkinTone").default,
  "person-surfing-light-skin-tone": () =>
    require("./emojis/EmojiPersonSurfingLightSkinTone").default,
  "person-surfing-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonSurfingMediumDarkSkinTone").default,
  "person-surfing-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonSurfingMediumLightSkinTone").default,
  "person-surfing-medium-skin-tone": () =>
    require("./emojis/EmojiPersonSurfingMediumSkinTone").default,
  "person-swimming": () => require("./emojis/EmojiPersonSwimming").default,
  "person-swimming-dark-skin-tone": () =>
    require("./emojis/EmojiPersonSwimmingDarkSkinTone").default,
  "person-swimming-light-skin-tone": () =>
    require("./emojis/EmojiPersonSwimmingLightSkinTone").default,
  "person-swimming-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonSwimmingMediumDarkSkinTone").default,
  "person-swimming-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonSwimmingMediumLightSkinTone").default,
  "person-swimming-medium-skin-tone": () =>
    require("./emojis/EmojiPersonSwimmingMediumSkinTone").default,
  "person-taking-bath": () => require("./emojis/EmojiPersonTakingBath").default,
  "person-taking-bath-dark-skin-tone": () =>
    require("./emojis/EmojiPersonTakingBathDarkSkinTone").default,
  "person-taking-bath-light-skin-tone": () =>
    require("./emojis/EmojiPersonTakingBathLightSkinTone").default,
  "person-taking-bath-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonTakingBathMediumDarkSkinTone").default,
  "person-taking-bath-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonTakingBathMediumLightSkinTone").default,
  "person-taking-bath-medium-skin-tone": () =>
    require("./emojis/EmojiPersonTakingBathMediumSkinTone").default,
  "person-tipping-hand": () => require("./emojis/EmojiPersonTippingHand").default,
  "person-tipping-hand-dark-skin-tone": () =>
    require("./emojis/EmojiPersonTippingHandDarkSkinTone").default,
  "person-tipping-hand-light-skin-tone": () =>
    require("./emojis/EmojiPersonTippingHandLightSkinTone").default,
  "person-tipping-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonTippingHandMediumDarkSkinTone").default,
  "person-tipping-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonTippingHandMediumLightSkinTone").default,
  "person-tipping-hand-medium-skin-tone": () =>
    require("./emojis/EmojiPersonTippingHandMediumSkinTone").default,
  "person-walking": () => require("./emojis/EmojiPersonWalking").default,
  "person-walking-dark-skin-tone": () => require("./emojis/EmojiPersonWalkingDarkSkinTone").default,
  "person-walking-facing-right": () => require("./emojis/EmojiPersonWalkingFacingRight").default,
  "person-walking-facing-right-dark-skin-tone": () =>
    require("./emojis/EmojiPersonWalkingFacingRightDarkSkinTone").default,
  "person-walking-facing-right-light-skin-tone": () =>
    require("./emojis/EmojiPersonWalkingFacingRightLightSkinTone").default,
  "person-walking-facing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonWalkingFacingRightMediumDarkSkinTone").default,
  "person-walking-facing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonWalkingFacingRightMediumLightSkinTone").default,
  "person-walking-facing-right-medium-skin-tone": () =>
    require("./emojis/EmojiPersonWalkingFacingRightMediumSkinTone").default,
  "person-walking-light-skin-tone": () =>
    require("./emojis/EmojiPersonWalkingLightSkinTone").default,
  "person-walking-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonWalkingMediumDarkSkinTone").default,
  "person-walking-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonWalkingMediumLightSkinTone").default,
  "person-walking-medium-skin-tone": () =>
    require("./emojis/EmojiPersonWalkingMediumSkinTone").default,
  "person-wearing-turban": () => require("./emojis/EmojiPersonWearingTurban").default,
  "person-wearing-turban-dark-skin-tone": () =>
    require("./emojis/EmojiPersonWearingTurbanDarkSkinTone").default,
  "person-wearing-turban-light-skin-tone": () =>
    require("./emojis/EmojiPersonWearingTurbanLightSkinTone").default,
  "person-wearing-turban-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonWearingTurbanMediumDarkSkinTone").default,
  "person-wearing-turban-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonWearingTurbanMediumLightSkinTone").default,
  "person-wearing-turban-medium-skin-tone": () =>
    require("./emojis/EmojiPersonWearingTurbanMediumSkinTone").default,
  "person-white-hair": () => require("./emojis/EmojiPersonWhiteHair").default,
  "person-with-crown": () => require("./emojis/EmojiPersonWithCrown").default,
  "person-with-crown-dark-skin-tone": () =>
    require("./emojis/EmojiPersonWithCrownDarkSkinTone").default,
  "person-with-crown-light-skin-tone": () =>
    require("./emojis/EmojiPersonWithCrownLightSkinTone").default,
  "person-with-crown-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonWithCrownMediumDarkSkinTone").default,
  "person-with-crown-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonWithCrownMediumLightSkinTone").default,
  "person-with-crown-medium-skin-tone": () =>
    require("./emojis/EmojiPersonWithCrownMediumSkinTone").default,
  "person-with-skullcap": () => require("./emojis/EmojiPersonWithSkullcap").default,
  "person-with-skullcap-dark-skin-tone": () =>
    require("./emojis/EmojiPersonWithSkullcapDarkSkinTone").default,
  "person-with-skullcap-light-skin-tone": () =>
    require("./emojis/EmojiPersonWithSkullcapLightSkinTone").default,
  "person-with-skullcap-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonWithSkullcapMediumDarkSkinTone").default,
  "person-with-skullcap-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonWithSkullcapMediumLightSkinTone").default,
  "person-with-skullcap-medium-skin-tone": () =>
    require("./emojis/EmojiPersonWithSkullcapMediumSkinTone").default,
  "person-with-veil": () => require("./emojis/EmojiPersonWithVeil").default,
  "person-with-veil-dark-skin-tone": () =>
    require("./emojis/EmojiPersonWithVeilDarkSkinTone").default,
  "person-with-veil-light-skin-tone": () =>
    require("./emojis/EmojiPersonWithVeilLightSkinTone").default,
  "person-with-veil-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonWithVeilMediumDarkSkinTone").default,
  "person-with-veil-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonWithVeilMediumLightSkinTone").default,
  "person-with-veil-medium-skin-tone": () =>
    require("./emojis/EmojiPersonWithVeilMediumSkinTone").default,
  "person-with-white-cane": () => require("./emojis/EmojiPersonWithWhiteCane").default,
  "person-with-white-cane-dark-skin-tone": () =>
    require("./emojis/EmojiPersonWithWhiteCaneDarkSkinTone").default,
  "person-with-white-cane-facing-right": () =>
    require("./emojis/EmojiPersonWithWhiteCaneFacingRight").default,
  "person-with-white-cane-facing-right-dark-skin-tone": () =>
    require("./emojis/EmojiPersonWithWhiteCaneFacingRightDarkSkinTone").default,
  "person-with-white-cane-facing-right-light-skin-tone": () =>
    require("./emojis/EmojiPersonWithWhiteCaneFacingRightLightSkinTone").default,
  "person-with-white-cane-facing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonWithWhiteCaneFacingRightMediumDarkSkinTone").default,
  "person-with-white-cane-facing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonWithWhiteCaneFacingRightMediumLightSkinTone").default,
  "person-with-white-cane-facing-right-medium-skin-tone": () =>
    require("./emojis/EmojiPersonWithWhiteCaneFacingRightMediumSkinTone").default,
  "person-with-white-cane-light-skin-tone": () =>
    require("./emojis/EmojiPersonWithWhiteCaneLightSkinTone").default,
  "person-with-white-cane-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPersonWithWhiteCaneMediumDarkSkinTone").default,
  "person-with-white-cane-medium-light-skin-tone": () =>
    require("./emojis/EmojiPersonWithWhiteCaneMediumLightSkinTone").default,
  "person-with-white-cane-medium-skin-tone": () =>
    require("./emojis/EmojiPersonWithWhiteCaneMediumSkinTone").default,
  "petri-dish": () => require("./emojis/EmojiPetriDish").default,
  phoenix: () => require("./emojis/EmojiPhoenix").default,
  pick: () => require("./emojis/EmojiPick").default,
  "pickup-truck": () => require("./emojis/EmojiPickupTruck").default,
  pie: () => require("./emojis/EmojiPie").default,
  pig: () => require("./emojis/EmojiPig").default,
  "pig-face": () => require("./emojis/EmojiPigFace").default,
  "pig-nose": () => require("./emojis/EmojiPigNose").default,
  "pile-of-poo": () => require("./emojis/EmojiPileOfPoo").default,
  pill: () => require("./emojis/EmojiPill").default,
  pilot: () => require("./emojis/EmojiPilot").default,
  "pilot-dark-skin-tone": () => require("./emojis/EmojiPilotDarkSkinTone").default,
  "pilot-light-skin-tone": () => require("./emojis/EmojiPilotLightSkinTone").default,
  "pilot-medium-dark-skin-tone": () => require("./emojis/EmojiPilotMediumDarkSkinTone").default,
  "pilot-medium-light-skin-tone": () => require("./emojis/EmojiPilotMediumLightSkinTone").default,
  "pilot-medium-skin-tone": () => require("./emojis/EmojiPilotMediumSkinTone").default,
  pinata: () => require("./emojis/EmojiPinata").default,
  "pinched-fingers": () => require("./emojis/EmojiPinchedFingers").default,
  "pinched-fingers-dark-skin-tone": () =>
    require("./emojis/EmojiPinchedFingersDarkSkinTone").default,
  "pinched-fingers-light-skin-tone": () =>
    require("./emojis/EmojiPinchedFingersLightSkinTone").default,
  "pinched-fingers-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPinchedFingersMediumDarkSkinTone").default,
  "pinched-fingers-medium-light-skin-tone": () =>
    require("./emojis/EmojiPinchedFingersMediumLightSkinTone").default,
  "pinched-fingers-medium-skin-tone": () =>
    require("./emojis/EmojiPinchedFingersMediumSkinTone").default,
  "pinching-hand": () => require("./emojis/EmojiPinchingHand").default,
  "pinching-hand-dark-skin-tone": () => require("./emojis/EmojiPinchingHandDarkSkinTone").default,
  "pinching-hand-light-skin-tone": () => require("./emojis/EmojiPinchingHandLightSkinTone").default,
  "pinching-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPinchingHandMediumDarkSkinTone").default,
  "pinching-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiPinchingHandMediumLightSkinTone").default,
  "pinching-hand-medium-skin-tone": () =>
    require("./emojis/EmojiPinchingHandMediumSkinTone").default,
  "pine-decoration": () => require("./emojis/EmojiPineDecoration").default,
  pineapple: () => require("./emojis/EmojiPineapple").default,
  "ping-pong": () => require("./emojis/EmojiPingPong").default,
  "pink-heart": () => require("./emojis/EmojiPinkHeart").default,
  "pirate-flag": () => require("./emojis/EmojiPirateFlag").default,
  pisces: () => require("./emojis/EmojiPisces").default,
  pizza: () => require("./emojis/EmojiPizza").default,
  placard: () => require("./emojis/EmojiPlacard").default,
  "place-of-worship": () => require("./emojis/EmojiPlaceOfWorship").default,
  "play-button": () => require("./emojis/EmojiPlayButton").default,
  "play-or-pause-button": () => require("./emojis/EmojiPlayOrPauseButton").default,
  "playground-slide": () => require("./emojis/EmojiPlaygroundSlide").default,
  "pleading-face": () => require("./emojis/EmojiPleadingFace").default,
  plunger: () => require("./emojis/EmojiPlunger").default,
  plus: () => require("./emojis/EmojiPlus").default,
  "polar-bear": () => require("./emojis/EmojiPolarBear").default,
  "police-car": () => require("./emojis/EmojiPoliceCar").default,
  "police-car-light": () => require("./emojis/EmojiPoliceCarLight").default,
  "police-officer": () => require("./emojis/EmojiPoliceOfficer").default,
  "police-officer-dark-skin-tone": () => require("./emojis/EmojiPoliceOfficerDarkSkinTone").default,
  "police-officer-light-skin-tone": () =>
    require("./emojis/EmojiPoliceOfficerLightSkinTone").default,
  "police-officer-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPoliceOfficerMediumDarkSkinTone").default,
  "police-officer-medium-light-skin-tone": () =>
    require("./emojis/EmojiPoliceOfficerMediumLightSkinTone").default,
  "police-officer-medium-skin-tone": () =>
    require("./emojis/EmojiPoliceOfficerMediumSkinTone").default,
  poodle: () => require("./emojis/EmojiPoodle").default,
  "pool-8-ball": () => require("./emojis/EmojiPool8Ball").default,
  popcorn: () => require("./emojis/EmojiPopcorn").default,
  "post-office": () => require("./emojis/EmojiPostOffice").default,
  "postal-horn": () => require("./emojis/EmojiPostalHorn").default,
  postbox: () => require("./emojis/EmojiPostbox").default,
  "pot-of-food": () => require("./emojis/EmojiPotOfFood").default,
  "potable-water": () => require("./emojis/EmojiPotableWater").default,
  potato: () => require("./emojis/EmojiPotato").default,
  "potted-plant": () => require("./emojis/EmojiPottedPlant").default,
  "poultry-leg": () => require("./emojis/EmojiPoultryLeg").default,
  pound: () => require("./emojis/EmojiPound").default,
  "pound-banknote": () => require("./emojis/EmojiPoundBanknote").default,
  "pound-symbol": () => require("./emojis/EmojiPoundSymbol").default,
  "pouring-liquid": () => require("./emojis/EmojiPouringLiquid").default,
  "pouting-cat": () => require("./emojis/EmojiPoutingCat").default,
  "prayer-beads": () => require("./emojis/EmojiPrayerBeads").default,
  "pregnant-man": () => require("./emojis/EmojiPregnantMan").default,
  "pregnant-man-dark-skin-tone": () => require("./emojis/EmojiPregnantManDarkSkinTone").default,
  "pregnant-man-light-skin-tone": () => require("./emojis/EmojiPregnantManLightSkinTone").default,
  "pregnant-man-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPregnantManMediumDarkSkinTone").default,
  "pregnant-man-medium-light-skin-tone": () =>
    require("./emojis/EmojiPregnantManMediumLightSkinTone").default,
  "pregnant-man-medium-skin-tone": () => require("./emojis/EmojiPregnantManMediumSkinTone").default,
  "pregnant-person": () => require("./emojis/EmojiPregnantPerson").default,
  "pregnant-person-dark-skin-tone": () =>
    require("./emojis/EmojiPregnantPersonDarkSkinTone").default,
  "pregnant-person-light-skin-tone": () =>
    require("./emojis/EmojiPregnantPersonLightSkinTone").default,
  "pregnant-person-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPregnantPersonMediumDarkSkinTone").default,
  "pregnant-person-medium-light-skin-tone": () =>
    require("./emojis/EmojiPregnantPersonMediumLightSkinTone").default,
  "pregnant-person-medium-skin-tone": () =>
    require("./emojis/EmojiPregnantPersonMediumSkinTone").default,
  "pregnant-woman": () => require("./emojis/EmojiPregnantWoman").default,
  "pregnant-woman-dark-skin-tone": () => require("./emojis/EmojiPregnantWomanDarkSkinTone").default,
  "pregnant-woman-light-skin-tone": () =>
    require("./emojis/EmojiPregnantWomanLightSkinTone").default,
  "pregnant-woman-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPregnantWomanMediumDarkSkinTone").default,
  "pregnant-woman-medium-light-skin-tone": () =>
    require("./emojis/EmojiPregnantWomanMediumLightSkinTone").default,
  "pregnant-woman-medium-skin-tone": () =>
    require("./emojis/EmojiPregnantWomanMediumSkinTone").default,
  pretzel: () => require("./emojis/EmojiPretzel").default,
  prince: () => require("./emojis/EmojiPrince").default,
  "prince-dark-skin-tone": () => require("./emojis/EmojiPrinceDarkSkinTone").default,
  "prince-light-skin-tone": () => require("./emojis/EmojiPrinceLightSkinTone").default,
  "prince-medium-dark-skin-tone": () => require("./emojis/EmojiPrinceMediumDarkSkinTone").default,
  "prince-medium-light-skin-tone": () => require("./emojis/EmojiPrinceMediumLightSkinTone").default,
  "prince-medium-skin-tone": () => require("./emojis/EmojiPrinceMediumSkinTone").default,
  princess: () => require("./emojis/EmojiPrincess").default,
  "princess-dark-skin-tone": () => require("./emojis/EmojiPrincessDarkSkinTone").default,
  "princess-light-skin-tone": () => require("./emojis/EmojiPrincessLightSkinTone").default,
  "princess-medium-dark-skin-tone": () =>
    require("./emojis/EmojiPrincessMediumDarkSkinTone").default,
  "princess-medium-light-skin-tone": () =>
    require("./emojis/EmojiPrincessMediumLightSkinTone").default,
  "princess-medium-skin-tone": () => require("./emojis/EmojiPrincessMediumSkinTone").default,
  printer: () => require("./emojis/EmojiPrinter").default,
  prohibited: () => require("./emojis/EmojiProhibited").default,
  "purple-circle": () => require("./emojis/EmojiPurpleCircle").default,
  "purple-heart": () => require("./emojis/EmojiPurpleHeart").default,
  "purple-square": () => require("./emojis/EmojiPurpleSquare").default,
  purse: () => require("./emojis/EmojiPurse").default,
  pushpin: () => require("./emojis/EmojiPushpin").default,
  "puzzle-piece": () => require("./emojis/EmojiPuzzlePiece").default,
  rabbit: () => require("./emojis/EmojiRabbit").default,
  "rabbit-face": () => require("./emojis/EmojiRabbitFace").default,
  raccoon: () => require("./emojis/EmojiRaccoon").default,
  "racing-car": () => require("./emojis/EmojiRacingCar").default,
  radio: () => require("./emojis/EmojiRadio").default,
  "radio-button": () => require("./emojis/EmojiRadioButton").default,
  radioactive: () => require("./emojis/EmojiRadioactive").default,
  "railway-car": () => require("./emojis/EmojiRailwayCar").default,
  "railway-track": () => require("./emojis/EmojiRailwayTrack").default,
  rainbow: () => require("./emojis/EmojiRainbow").default,
  "rainbow-flag": () => require("./emojis/EmojiRainbowFlag").default,
  "raised-back-of-hand": () => require("./emojis/EmojiRaisedBackOfHand").default,
  "raised-back-of-hand-dark-skin-tone": () =>
    require("./emojis/EmojiRaisedBackOfHandDarkSkinTone").default,
  "raised-back-of-hand-light-skin-tone": () =>
    require("./emojis/EmojiRaisedBackOfHandLightSkinTone").default,
  "raised-back-of-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiRaisedBackOfHandMediumDarkSkinTone").default,
  "raised-back-of-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiRaisedBackOfHandMediumLightSkinTone").default,
  "raised-back-of-hand-medium-skin-tone": () =>
    require("./emojis/EmojiRaisedBackOfHandMediumSkinTone").default,
  "raised-fist": () => require("./emojis/EmojiRaisedFist").default,
  "raised-fist-dark-skin-tone": () => require("./emojis/EmojiRaisedFistDarkSkinTone").default,
  "raised-fist-light-skin-tone": () => require("./emojis/EmojiRaisedFistLightSkinTone").default,
  "raised-fist-medium-dark-skin-tone": () =>
    require("./emojis/EmojiRaisedFistMediumDarkSkinTone").default,
  "raised-fist-medium-light-skin-tone": () =>
    require("./emojis/EmojiRaisedFistMediumLightSkinTone").default,
  "raised-fist-medium-skin-tone": () => require("./emojis/EmojiRaisedFistMediumSkinTone").default,
  "raised-hand": () => require("./emojis/EmojiRaisedHand").default,
  "raised-hand-dark-skin-tone": () => require("./emojis/EmojiRaisedHandDarkSkinTone").default,
  "raised-hand-light-skin-tone": () => require("./emojis/EmojiRaisedHandLightSkinTone").default,
  "raised-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiRaisedHandMediumDarkSkinTone").default,
  "raised-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiRaisedHandMediumLightSkinTone").default,
  "raised-hand-medium-skin-tone": () => require("./emojis/EmojiRaisedHandMediumSkinTone").default,
  "raising-hands": () => require("./emojis/EmojiRaisingHands").default,
  "raising-hands-dark-skin-tone": () => require("./emojis/EmojiRaisingHandsDarkSkinTone").default,
  "raising-hands-light-skin-tone": () => require("./emojis/EmojiRaisingHandsLightSkinTone").default,
  "raising-hands-medium-dark-skin-tone": () =>
    require("./emojis/EmojiRaisingHandsMediumDarkSkinTone").default,
  "raising-hands-medium-light-skin-tone": () =>
    require("./emojis/EmojiRaisingHandsMediumLightSkinTone").default,
  "raising-hands-medium-skin-tone": () =>
    require("./emojis/EmojiRaisingHandsMediumSkinTone").default,
  ram: () => require("./emojis/EmojiRam").default,
  rat: () => require("./emojis/EmojiRat").default,
  razor: () => require("./emojis/EmojiRazor").default,
  receipt: () => require("./emojis/EmojiReceipt").default,
  "record-button": () => require("./emojis/EmojiRecordButton").default,
  "recycling-symbol": () => require("./emojis/EmojiRecyclingSymbol").default,
  "red-apple": () => require("./emojis/EmojiRedApple").default,
  "red-circle": () => require("./emojis/EmojiRedCircle").default,
  "red-envelope": () => require("./emojis/EmojiRedEnvelope").default,
  "red-exclamation-mark": () => require("./emojis/EmojiRedExclamationMark").default,
  "red-haired": () => require("./emojis/EmojiRedHaired").default,
  "red-heart": () => require("./emojis/EmojiRedHeart").default,
  "red-paper-lantern": () => require("./emojis/EmojiRedPaperLantern").default,
  "red-question-mark": () => require("./emojis/EmojiRedQuestionMark").default,
  "red-square": () => require("./emojis/EmojiRedSquare").default,
  "red-triangle-pointed-down": () => require("./emojis/EmojiRedTrianglePointedDown").default,
  "red-triangle-pointed-up": () => require("./emojis/EmojiRedTrianglePointedUp").default,
  registered: () => require("./emojis/EmojiRegistered").default,
  "relieved-face": () => require("./emojis/EmojiRelievedFace").default,
  "reminder-ribbon": () => require("./emojis/EmojiReminderRibbon").default,
  "repeat-button": () => require("./emojis/EmojiRepeatButton").default,
  "repeat-single-button": () => require("./emojis/EmojiRepeatSingleButton").default,
  "rescue-workers-helmet": () => require("./emojis/EmojiRescueWorkersHelmet").default,
  restroom: () => require("./emojis/EmojiRestroom").default,
  "reverse-button": () => require("./emojis/EmojiReverseButton").default,
  "revolving-hearts": () => require("./emojis/EmojiRevolvingHearts").default,
  rhinoceros: () => require("./emojis/EmojiRhinoceros").default,
  ribbon: () => require("./emojis/EmojiRibbon").default,
  "rice-ball": () => require("./emojis/EmojiRiceBall").default,
  "rice-cracker": () => require("./emojis/EmojiRiceCracker").default,
  "right-anger-bubble": () => require("./emojis/EmojiRightAngerBubble").default,
  "right-arrow": () => require("./emojis/EmojiRightArrow").default,
  "right-arrow-curving-down": () => require("./emojis/EmojiRightArrowCurvingDown").default,
  "right-arrow-curving-left": () => require("./emojis/EmojiRightArrowCurvingLeft").default,
  "right-arrow-curving-up": () => require("./emojis/EmojiRightArrowCurvingUp").default,
  "right-facing-fist": () => require("./emojis/EmojiRightFacingFist").default,
  "right-facing-fist-dark-skin-tone": () =>
    require("./emojis/EmojiRightFacingFistDarkSkinTone").default,
  "right-facing-fist-light-skin-tone": () =>
    require("./emojis/EmojiRightFacingFistLightSkinTone").default,
  "right-facing-fist-medium-dark-skin-tone": () =>
    require("./emojis/EmojiRightFacingFistMediumDarkSkinTone").default,
  "right-facing-fist-medium-light-skin-tone": () =>
    require("./emojis/EmojiRightFacingFistMediumLightSkinTone").default,
  "right-facing-fist-medium-skin-tone": () =>
    require("./emojis/EmojiRightFacingFistMediumSkinTone").default,
  "right-pointing-magnifying-glass": () =>
    require("./emojis/EmojiRightPointingMagnifyingGlass").default,
  "rightwards-hand": () => require("./emojis/EmojiRightwardsHand").default,
  "rightwards-hand-dark-skin-tone": () =>
    require("./emojis/EmojiRightwardsHandDarkSkinTone").default,
  "rightwards-hand-light-skin-tone": () =>
    require("./emojis/EmojiRightwardsHandLightSkinTone").default,
  "rightwards-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiRightwardsHandMediumDarkSkinTone").default,
  "rightwards-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiRightwardsHandMediumLightSkinTone").default,
  "rightwards-hand-medium-skin-tone": () =>
    require("./emojis/EmojiRightwardsHandMediumSkinTone").default,
  "rightwards-pushing-hand": () => require("./emojis/EmojiRightwardsPushingHand").default,
  "rightwards-pushing-hand-dark-skin-tone": () =>
    require("./emojis/EmojiRightwardsPushingHandDarkSkinTone").default,
  "rightwards-pushing-hand-light-skin-tone": () =>
    require("./emojis/EmojiRightwardsPushingHandLightSkinTone").default,
  "rightwards-pushing-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiRightwardsPushingHandMediumDarkSkinTone").default,
  "rightwards-pushing-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiRightwardsPushingHandMediumLightSkinTone").default,
  "rightwards-pushing-hand-medium-skin-tone": () =>
    require("./emojis/EmojiRightwardsPushingHandMediumSkinTone").default,
  ring: () => require("./emojis/EmojiRing").default,
  "ring-buoy": () => require("./emojis/EmojiRingBuoy").default,
  "ringed-planet": () => require("./emojis/EmojiRingedPlanet").default,
  "roasted-sweet-potato": () => require("./emojis/EmojiRoastedSweetPotato").default,
  robot: () => require("./emojis/EmojiRobot").default,
  rock: () => require("./emojis/EmojiRock").default,
  rocket: () => require("./emojis/EmojiRocket").default,
  "roll-of-paper": () => require("./emojis/EmojiRollOfPaper").default,
  "rolled-up-newspaper": () => require("./emojis/EmojiRolledUpNewspaper").default,
  "roller-coaster": () => require("./emojis/EmojiRollerCoaster").default,
  "roller-skate": () => require("./emojis/EmojiRollerSkate").default,
  "rolling-on-the-floor-laughing": () => require("./emojis/EmojiRollingOnTheFloorLaughing").default,
  rooster: () => require("./emojis/EmojiRooster").default,
  "root-vegetable": () => require("./emojis/EmojiRootVegetable").default,
  rose: () => require("./emojis/EmojiRose").default,
  rosette: () => require("./emojis/EmojiRosette").default,
  "round-pushpin": () => require("./emojis/EmojiRoundPushpin").default,
  "rugby-football": () => require("./emojis/EmojiRugbyFootball").default,
  "running-shirt": () => require("./emojis/EmojiRunningShirt").default,
  "running-shoe": () => require("./emojis/EmojiRunningShoe").default,
  "sad-but-relieved-face": () => require("./emojis/EmojiSadButRelievedFace").default,
  "safety-pin": () => require("./emojis/EmojiSafetyPin").default,
  "safety-vest": () => require("./emojis/EmojiSafetyVest").default,
  sagittarius: () => require("./emojis/EmojiSagittarius").default,
  sailboat: () => require("./emojis/EmojiSailboat").default,
  sake: () => require("./emojis/EmojiSake").default,
  salt: () => require("./emojis/EmojiSalt").default,
  "saluting-face": () => require("./emojis/EmojiSalutingFace").default,
  sandwich: () => require("./emojis/EmojiSandwich").default,
  "santa-claus": () => require("./emojis/EmojiSantaClaus").default,
  "santa-claus-dark-skin-tone": () => require("./emojis/EmojiSantaClausDarkSkinTone").default,
  "santa-claus-light-skin-tone": () => require("./emojis/EmojiSantaClausLightSkinTone").default,
  "santa-claus-medium-dark-skin-tone": () =>
    require("./emojis/EmojiSantaClausMediumDarkSkinTone").default,
  "santa-claus-medium-light-skin-tone": () =>
    require("./emojis/EmojiSantaClausMediumLightSkinTone").default,
  "santa-claus-medium-skin-tone": () => require("./emojis/EmojiSantaClausMediumSkinTone").default,
  sari: () => require("./emojis/EmojiSari").default,
  satellite: () => require("./emojis/EmojiSatellite").default,
  "satellite-antenna": () => require("./emojis/EmojiSatelliteAntenna").default,
  sauropod: () => require("./emojis/EmojiSauropod").default,
  saxophone: () => require("./emojis/EmojiSaxophone").default,
  scarf: () => require("./emojis/EmojiScarf").default,
  school: () => require("./emojis/EmojiSchool").default,
  scientist: () => require("./emojis/EmojiScientist").default,
  "scientist-dark-skin-tone": () => require("./emojis/EmojiScientistDarkSkinTone").default,
  "scientist-light-skin-tone": () => require("./emojis/EmojiScientistLightSkinTone").default,
  "scientist-medium-dark-skin-tone": () =>
    require("./emojis/EmojiScientistMediumDarkSkinTone").default,
  "scientist-medium-light-skin-tone": () =>
    require("./emojis/EmojiScientistMediumLightSkinTone").default,
  "scientist-medium-skin-tone": () => require("./emojis/EmojiScientistMediumSkinTone").default,
  scissors: () => require("./emojis/EmojiScissors").default,
  scorpio: () => require("./emojis/EmojiScorpio").default,
  scorpion: () => require("./emojis/EmojiScorpion").default,
  screwdriver: () => require("./emojis/EmojiScrewdriver").default,
  scroll: () => require("./emojis/EmojiScroll").default,
  seal: () => require("./emojis/EmojiSeal").default,
  seat: () => require("./emojis/EmojiSeat").default,
  "see-no-evil-monkey": () => require("./emojis/EmojiSeeNoEvilMonkey").default,
  seedling: () => require("./emojis/EmojiSeedling").default,
  selfie: () => require("./emojis/EmojiSelfie").default,
  "selfie-dark-skin-tone": () => require("./emojis/EmojiSelfieDarkSkinTone").default,
  "selfie-light-skin-tone": () => require("./emojis/EmojiSelfieLightSkinTone").default,
  "selfie-medium-dark-skin-tone": () => require("./emojis/EmojiSelfieMediumDarkSkinTone").default,
  "selfie-medium-light-skin-tone": () => require("./emojis/EmojiSelfieMediumLightSkinTone").default,
  "selfie-medium-skin-tone": () => require("./emojis/EmojiSelfieMediumSkinTone").default,
  "service-dog": () => require("./emojis/EmojiServiceDog").default,
  "seven-oclock": () => require("./emojis/EmojiSevenOclock").default,
  "seven-thirty": () => require("./emojis/EmojiSevenThirty").default,
  "sewing-needle": () => require("./emojis/EmojiSewingNeedle").default,
  "shaking-face": () => require("./emojis/EmojiShakingFace").default,
  "shallow-pan-of-food": () => require("./emojis/EmojiShallowPanOfFood").default,
  shamrock: () => require("./emojis/EmojiShamrock").default,
  shark: () => require("./emojis/EmojiShark").default,
  "shaved-ice": () => require("./emojis/EmojiShavedIce").default,
  "sheaf-of-rice": () => require("./emojis/EmojiSheafOfRice").default,
  shield: () => require("./emojis/EmojiShield").default,
  "shinto-shrine": () => require("./emojis/EmojiShintoShrine").default,
  ship: () => require("./emojis/EmojiShip").default,
  "shooting-star": () => require("./emojis/EmojiShootingStar").default,
  "shopping-bags": () => require("./emojis/EmojiShoppingBags").default,
  "shopping-cart": () => require("./emojis/EmojiShoppingCart").default,
  shortcake: () => require("./emojis/EmojiShortcake").default,
  shorts: () => require("./emojis/EmojiShorts").default,
  shovel: () => require("./emojis/EmojiShovel").default,
  shower: () => require("./emojis/EmojiShower").default,
  shrimp: () => require("./emojis/EmojiShrimp").default,
  "shuffle-tracks-button": () => require("./emojis/EmojiShuffleTracksButton").default,
  "shushing-face": () => require("./emojis/EmojiShushingFace").default,
  "sign-of-the-horns": () => require("./emojis/EmojiSignOfTheHorns").default,
  "sign-of-the-horns-dark-skin-tone": () =>
    require("./emojis/EmojiSignOfTheHornsDarkSkinTone").default,
  "sign-of-the-horns-light-skin-tone": () =>
    require("./emojis/EmojiSignOfTheHornsLightSkinTone").default,
  "sign-of-the-horns-medium-dark-skin-tone": () =>
    require("./emojis/EmojiSignOfTheHornsMediumDarkSkinTone").default,
  "sign-of-the-horns-medium-light-skin-tone": () =>
    require("./emojis/EmojiSignOfTheHornsMediumLightSkinTone").default,
  "sign-of-the-horns-medium-skin-tone": () =>
    require("./emojis/EmojiSignOfTheHornsMediumSkinTone").default,
  singer: () => require("./emojis/EmojiSinger").default,
  "singer-dark-skin-tone": () => require("./emojis/EmojiSingerDarkSkinTone").default,
  "singer-light-skin-tone": () => require("./emojis/EmojiSingerLightSkinTone").default,
  "singer-medium-dark-skin-tone": () => require("./emojis/EmojiSingerMediumDarkSkinTone").default,
  "singer-medium-light-skin-tone": () => require("./emojis/EmojiSingerMediumLightSkinTone").default,
  "singer-medium-skin-tone": () => require("./emojis/EmojiSingerMediumSkinTone").default,
  "six-oclock": () => require("./emojis/EmojiSixOclock").default,
  "six-thirty": () => require("./emojis/EmojiSixThirty").default,
  skateboard: () => require("./emojis/EmojiSkateboard").default,
  skier: () => require("./emojis/EmojiSkier").default,
  skis: () => require("./emojis/EmojiSkis").default,
  skull: () => require("./emojis/EmojiSkull").default,
  "skull-and-crossbones": () => require("./emojis/EmojiSkullAndCrossbones").default,
  skunk: () => require("./emojis/EmojiSkunk").default,
  sled: () => require("./emojis/EmojiSled").default,
  "sleeping-face": () => require("./emojis/EmojiSleepingFace").default,
  "sleepy-face": () => require("./emojis/EmojiSleepyFace").default,
  "slightly-frowning-face": () => require("./emojis/EmojiSlightlyFrowningFace").default,
  "slightly-smiling-face": () => require("./emojis/EmojiSlightlySmilingFace").default,
  "slot-machine": () => require("./emojis/EmojiSlotMachine").default,
  sloth: () => require("./emojis/EmojiSloth").default,
  "small-airplane": () => require("./emojis/EmojiSmallAirplane").default,
  "small-blue-diamond": () => require("./emojis/EmojiSmallBlueDiamond").default,
  "small-orange-diamond": () => require("./emojis/EmojiSmallOrangeDiamond").default,
  "smiling-cat-with-heart-eyes": () => require("./emojis/EmojiSmilingCatWithHeartEyes").default,
  "smiling-face": () => require("./emojis/EmojiSmilingFace").default,
  "smiling-face-with-halo": () => require("./emojis/EmojiSmilingFaceWithHalo").default,
  "smiling-face-with-heart-eyes": () => require("./emojis/EmojiSmilingFaceWithHeartEyes").default,
  "smiling-face-with-hearts": () => require("./emojis/EmojiSmilingFaceWithHearts").default,
  "smiling-face-with-horns": () => require("./emojis/EmojiSmilingFaceWithHorns").default,
  "smiling-face-with-open-hands": () => require("./emojis/EmojiSmilingFaceWithOpenHands").default,
  "smiling-face-with-open-mouth": () => require("./emojis/EmojiSmilingFaceWithOpenMouth").default,
  "smiling-face-with-open-mouth-and-closed-eyes": () =>
    require("./emojis/EmojiSmilingFaceWithOpenMouthAndClosedEyes").default,
  "smiling-face-with-open-mouth-and-cold-sweat": () =>
    require("./emojis/EmojiSmilingFaceWithOpenMouthAndColdSweat").default,
  "smiling-face-with-open-mouth-and-smiling-eyes": () =>
    require("./emojis/EmojiSmilingFaceWithOpenMouthAndSmilingEyes").default,
  "smiling-face-with-smiling-eyes": () =>
    require("./emojis/EmojiSmilingFaceWithSmilingEyes").default,
  "smiling-face-with-sunglasses": () => require("./emojis/EmojiSmilingFaceWithSunglasses").default,
  "smiling-face-with-tear": () => require("./emojis/EmojiSmilingFaceWithTear").default,
  "smirking-face": () => require("./emojis/EmojiSmirkingFace").default,
  snail: () => require("./emojis/EmojiSnail").default,
  snake: () => require("./emojis/EmojiSnake").default,
  "sneezing-face": () => require("./emojis/EmojiSneezingFace").default,
  "snow-capped-mountain": () => require("./emojis/EmojiSnowCappedMountain").default,
  snowboarder: () => require("./emojis/EmojiSnowboarder").default,
  "snowboarder-dark-skin-tone": () => require("./emojis/EmojiSnowboarderDarkSkinTone").default,
  "snowboarder-light-skin-tone": () => require("./emojis/EmojiSnowboarderLightSkinTone").default,
  "snowboarder-medium-dark-skin-tone": () =>
    require("./emojis/EmojiSnowboarderMediumDarkSkinTone").default,
  "snowboarder-medium-light-skin-tone": () =>
    require("./emojis/EmojiSnowboarderMediumLightSkinTone").default,
  "snowboarder-medium-skin-tone": () => require("./emojis/EmojiSnowboarderMediumSkinTone").default,
  snowflake: () => require("./emojis/EmojiSnowflake").default,
  snowman: () => require("./emojis/EmojiSnowman").default,
  "snowman-without-snow": () => require("./emojis/EmojiSnowmanWithoutSnow").default,
  soap: () => require("./emojis/EmojiSoap").default,
  "soccer-ball": () => require("./emojis/EmojiSoccerBall").default,
  socks: () => require("./emojis/EmojiSocks").default,
  "soft-ice-cream": () => require("./emojis/EmojiSoftIceCream").default,
  softball: () => require("./emojis/EmojiSoftball").default,
  "soon-arrow": () => require("./emojis/EmojiSoonArrow").default,
  "sos-button": () => require("./emojis/EmojiSosButton").default,
  "spade-suit": () => require("./emojis/EmojiSpadeSuit").default,
  spaghetti: () => require("./emojis/EmojiSpaghetti").default,
  sparkle: () => require("./emojis/EmojiSparkle").default,
  sparkler: () => require("./emojis/EmojiSparkler").default,
  sparkles: () => require("./emojis/EmojiSparkles").default,
  "sparkling-heart": () => require("./emojis/EmojiSparklingHeart").default,
  "speak-no-evil-monkey": () => require("./emojis/EmojiSpeakNoEvilMonkey").default,
  "speaker-high-volume": () => require("./emojis/EmojiSpeakerHighVolume").default,
  "speaker-low-volume": () => require("./emojis/EmojiSpeakerLowVolume").default,
  "speaker-medium-volume": () => require("./emojis/EmojiSpeakerMediumVolume").default,
  "speaking-head": () => require("./emojis/EmojiSpeakingHead").default,
  "speech-balloon": () => require("./emojis/EmojiSpeechBalloon").default,
  speedboat: () => require("./emojis/EmojiSpeedboat").default,
  spider: () => require("./emojis/EmojiSpider").default,
  "spider-web": () => require("./emojis/EmojiSpiderWeb").default,
  "spiral-calendar": () => require("./emojis/EmojiSpiralCalendar").default,
  "spiral-notepad": () => require("./emojis/EmojiSpiralNotepad").default,
  "spiral-shell": () => require("./emojis/EmojiSpiralShell").default,
  splatter: () => require("./emojis/EmojiSplatter").default,
  sponge: () => require("./emojis/EmojiSponge").default,
  spoon: () => require("./emojis/EmojiSpoon").default,
  "sport-utility-vehicle": () => require("./emojis/EmojiSportUtilityVehicle").default,
  "sports-medal": () => require("./emojis/EmojiSportsMedal").default,
  "spouting-whale": () => require("./emojis/EmojiSpoutingWhale").default,
  squid: () => require("./emojis/EmojiSquid").default,
  "squinting-face-with-tongue": () => require("./emojis/EmojiSquintingFaceWithTongue").default,
  stadium: () => require("./emojis/EmojiStadium").default,
  star: () => require("./emojis/EmojiStar").default,
  "star-and-crescent": () => require("./emojis/EmojiStarAndCrescent").default,
  "star-of-david": () => require("./emojis/EmojiStarOfDavid").default,
  "star-struck": () => require("./emojis/EmojiStarStruck").default,
  station: () => require("./emojis/EmojiStation").default,
  "statue-of-liberty": () => require("./emojis/EmojiStatueOfLiberty").default,
  "steaming-bowl": () => require("./emojis/EmojiSteamingBowl").default,
  stethoscope: () => require("./emojis/EmojiStethoscope").default,
  "stop-button": () => require("./emojis/EmojiStopButton").default,
  "stop-sign": () => require("./emojis/EmojiStopSign").default,
  stopwatch: () => require("./emojis/EmojiStopwatch").default,
  "straight-ruler": () => require("./emojis/EmojiStraightRuler").default,
  strawberry: () => require("./emojis/EmojiStrawberry").default,
  student: () => require("./emojis/EmojiStudent").default,
  "student-dark-skin-tone": () => require("./emojis/EmojiStudentDarkSkinTone").default,
  "student-light-skin-tone": () => require("./emojis/EmojiStudentLightSkinTone").default,
  "student-medium-dark-skin-tone": () => require("./emojis/EmojiStudentMediumDarkSkinTone").default,
  "student-medium-light-skin-tone": () =>
    require("./emojis/EmojiStudentMediumLightSkinTone").default,
  "student-medium-skin-tone": () => require("./emojis/EmojiStudentMediumSkinTone").default,
  "studio-microphone": () => require("./emojis/EmojiStudioMicrophone").default,
  "stuffed-flatbread": () => require("./emojis/EmojiStuffedFlatbread").default,
  sun: () => require("./emojis/EmojiSun").default,
  "sun-behind-cloud": () => require("./emojis/EmojiSunBehindCloud").default,
  "sun-behind-large-cloud": () => require("./emojis/EmojiSunBehindLargeCloud").default,
  "sun-behind-rain-cloud": () => require("./emojis/EmojiSunBehindRainCloud").default,
  "sun-behind-small-cloud": () => require("./emojis/EmojiSunBehindSmallCloud").default,
  "sun-with-face": () => require("./emojis/EmojiSunWithFace").default,
  sunflower: () => require("./emojis/EmojiSunflower").default,
  sunglasses: () => require("./emojis/EmojiSunglasses").default,
  sunrise: () => require("./emojis/EmojiSunrise").default,
  "sunrise-over-mountains": () => require("./emojis/EmojiSunriseOverMountains").default,
  sunset: () => require("./emojis/EmojiSunset").default,
  superhero: () => require("./emojis/EmojiSuperhero").default,
  "superhero-dark-skin-tone": () => require("./emojis/EmojiSuperheroDarkSkinTone").default,
  "superhero-light-skin-tone": () => require("./emojis/EmojiSuperheroLightSkinTone").default,
  "superhero-medium-dark-skin-tone": () =>
    require("./emojis/EmojiSuperheroMediumDarkSkinTone").default,
  "superhero-medium-light-skin-tone": () =>
    require("./emojis/EmojiSuperheroMediumLightSkinTone").default,
  "superhero-medium-skin-tone": () => require("./emojis/EmojiSuperheroMediumSkinTone").default,
  supervillain: () => require("./emojis/EmojiSupervillain").default,
  "supervillain-dark-skin-tone": () => require("./emojis/EmojiSupervillainDarkSkinTone").default,
  "supervillain-light-skin-tone": () => require("./emojis/EmojiSupervillainLightSkinTone").default,
  "supervillain-medium-dark-skin-tone": () =>
    require("./emojis/EmojiSupervillainMediumDarkSkinTone").default,
  "supervillain-medium-light-skin-tone": () =>
    require("./emojis/EmojiSupervillainMediumLightSkinTone").default,
  "supervillain-medium-skin-tone": () =>
    require("./emojis/EmojiSupervillainMediumSkinTone").default,
  sushi: () => require("./emojis/EmojiSushi").default,
  "suspension-railway": () => require("./emojis/EmojiSuspensionRailway").default,
  swan: () => require("./emojis/EmojiSwan").default,
  "sweat-droplets": () => require("./emojis/EmojiSweatDroplets").default,
  synagogue: () => require("./emojis/EmojiSynagogue").default,
  syringe: () => require("./emojis/EmojiSyringe").default,
  "t-rex": () => require("./emojis/EmojiTRex").default,
  "t-shirt": () => require("./emojis/EmojiTShirt").default,
  taco: () => require("./emojis/EmojiTaco").default,
  "takeout-box": () => require("./emojis/EmojiTakeoutBox").default,
  tamale: () => require("./emojis/EmojiTamale").default,
  "tanabata-tree": () => require("./emojis/EmojiTanabataTree").default,
  tangerine: () => require("./emojis/EmojiTangerine").default,
  taurus: () => require("./emojis/EmojiTaurus").default,
  taxi: () => require("./emojis/EmojiTaxi").default,
  teacher: () => require("./emojis/EmojiTeacher").default,
  "teacher-dark-skin-tone": () => require("./emojis/EmojiTeacherDarkSkinTone").default,
  "teacher-light-skin-tone": () => require("./emojis/EmojiTeacherLightSkinTone").default,
  "teacher-medium-dark-skin-tone": () => require("./emojis/EmojiTeacherMediumDarkSkinTone").default,
  "teacher-medium-light-skin-tone": () =>
    require("./emojis/EmojiTeacherMediumLightSkinTone").default,
  "teacher-medium-skin-tone": () => require("./emojis/EmojiTeacherMediumSkinTone").default,
  "teacup-without-handle": () => require("./emojis/EmojiTeacupWithoutHandle").default,
  teapot: () => require("./emojis/EmojiTeapot").default,
  "tear-off-calendar": () => require("./emojis/EmojiTearOffCalendar").default,
  technologist: () => require("./emojis/EmojiTechnologist").default,
  "technologist-dark-skin-tone": () => require("./emojis/EmojiTechnologistDarkSkinTone").default,
  "technologist-light-skin-tone": () => require("./emojis/EmojiTechnologistLightSkinTone").default,
  "technologist-medium-dark-skin-tone": () =>
    require("./emojis/EmojiTechnologistMediumDarkSkinTone").default,
  "technologist-medium-light-skin-tone": () =>
    require("./emojis/EmojiTechnologistMediumLightSkinTone").default,
  "technologist-medium-skin-tone": () =>
    require("./emojis/EmojiTechnologistMediumSkinTone").default,
  "teddy-bear": () => require("./emojis/EmojiTeddyBear").default,
  telephone: () => require("./emojis/EmojiTelephone").default,
  "telephone-receiver": () => require("./emojis/EmojiTelephoneReceiver").default,
  telescope: () => require("./emojis/EmojiTelescope").default,
  television: () => require("./emojis/EmojiTelevision").default,
  "ten-oclock": () => require("./emojis/EmojiTenOclock").default,
  "ten-thirty": () => require("./emojis/EmojiTenThirty").default,
  tennis: () => require("./emojis/EmojiTennis").default,
  tent: () => require("./emojis/EmojiTent").default,
  "test-tube": () => require("./emojis/EmojiTestTube").default,
  thermometer: () => require("./emojis/EmojiThermometer").default,
  "thinking-face": () => require("./emojis/EmojiThinkingFace").default,
  "thong-sandal": () => require("./emojis/EmojiThongSandal").default,
  "thought-balloon": () => require("./emojis/EmojiThoughtBalloon").default,
  thread: () => require("./emojis/EmojiThread").default,
  "three-oclock": () => require("./emojis/EmojiThreeOclock").default,
  "three-thirty": () => require("./emojis/EmojiThreeThirty").default,
  "thumbs-down": () => require("./emojis/EmojiThumbsDown").default,
  "thumbs-down-dark-skin-tone": () => require("./emojis/EmojiThumbsDownDarkSkinTone").default,
  "thumbs-down-light-skin-tone": () => require("./emojis/EmojiThumbsDownLightSkinTone").default,
  "thumbs-down-medium-dark-skin-tone": () =>
    require("./emojis/EmojiThumbsDownMediumDarkSkinTone").default,
  "thumbs-down-medium-light-skin-tone": () =>
    require("./emojis/EmojiThumbsDownMediumLightSkinTone").default,
  "thumbs-down-medium-skin-tone": () => require("./emojis/EmojiThumbsDownMediumSkinTone").default,
  "thumbs-up": () => require("./emojis/EmojiThumbsUp").default,
  "thumbs-up-dark-skin-tone": () => require("./emojis/EmojiThumbsUpDarkSkinTone").default,
  "thumbs-up-light-skin-tone": () => require("./emojis/EmojiThumbsUpLightSkinTone").default,
  "thumbs-up-medium-dark-skin-tone": () =>
    require("./emojis/EmojiThumbsUpMediumDarkSkinTone").default,
  "thumbs-up-medium-light-skin-tone": () =>
    require("./emojis/EmojiThumbsUpMediumLightSkinTone").default,
  "thumbs-up-medium-skin-tone": () => require("./emojis/EmojiThumbsUpMediumSkinTone").default,
  ticket: () => require("./emojis/EmojiTicket").default,
  tiger: () => require("./emojis/EmojiTiger").default,
  "tiger-face": () => require("./emojis/EmojiTigerFace").default,
  "timer-clock": () => require("./emojis/EmojiTimerClock").default,
  "tired-face": () => require("./emojis/EmojiTiredFace").default,
  toilet: () => require("./emojis/EmojiToilet").default,
  "tokyo-tower": () => require("./emojis/EmojiTokyoTower").default,
  tomato: () => require("./emojis/EmojiTomato").default,
  tongue: () => require("./emojis/EmojiTongue").default,
  toolbox: () => require("./emojis/EmojiToolbox").default,
  tooth: () => require("./emojis/EmojiTooth").default,
  toothbrush: () => require("./emojis/EmojiToothbrush").default,
  "top-arrow": () => require("./emojis/EmojiTopArrow").default,
  "top-hat": () => require("./emojis/EmojiTopHat").default,
  tornado: () => require("./emojis/EmojiTornado").default,
  trackball: () => require("./emojis/EmojiTrackball").default,
  tractor: () => require("./emojis/EmojiTractor").default,
  "trade-mark": () => require("./emojis/EmojiTradeMark").default,
  train: () => require("./emojis/EmojiTrain").default,
  tram: () => require("./emojis/EmojiTram").default,
  "tram-car": () => require("./emojis/EmojiTramCar").default,
  "transgender-flag": () => require("./emojis/EmojiTransgenderFlag").default,
  "transgender-symbol": () => require("./emojis/EmojiTransgenderSymbol").default,
  "treasure-chest": () => require("./emojis/EmojiTreasureChest").default,
  "triangular-flag": () => require("./emojis/EmojiTriangularFlag").default,
  "triangular-ruler": () => require("./emojis/EmojiTriangularRuler").default,
  "trident-emblem": () => require("./emojis/EmojiTridentEmblem").default,
  troll: () => require("./emojis/EmojiTroll").default,
  trolleybus: () => require("./emojis/EmojiTrolleybus").default,
  trombone: () => require("./emojis/EmojiTrombone").default,
  trophy: () => require("./emojis/EmojiTrophy").default,
  "tropical-drink": () => require("./emojis/EmojiTropicalDrink").default,
  "tropical-fish": () => require("./emojis/EmojiTropicalFish").default,
  trumpet: () => require("./emojis/EmojiTrumpet").default,
  tulip: () => require("./emojis/EmojiTulip").default,
  "tumbler-glass": () => require("./emojis/EmojiTumblerGlass").default,
  turkey: () => require("./emojis/EmojiTurkey").default,
  turtle: () => require("./emojis/EmojiTurtle").default,
  "twelve-oclock": () => require("./emojis/EmojiTwelveOclock").default,
  "twelve-thirty": () => require("./emojis/EmojiTwelveThirty").default,
  "two-hearts": () => require("./emojis/EmojiTwoHearts").default,
  "two-hump-camel": () => require("./emojis/EmojiTwoHumpCamel").default,
  "two-oclock": () => require("./emojis/EmojiTwoOclock").default,
  "two-thirty": () => require("./emojis/EmojiTwoThirty").default,
  umbrella: () => require("./emojis/EmojiUmbrella").default,
  "umbrella-on-ground": () => require("./emojis/EmojiUmbrellaOnGround").default,
  "umbrella-with-rain-drops": () => require("./emojis/EmojiUmbrellaWithRainDrops").default,
  "unamused-face": () => require("./emojis/EmojiUnamusedFace").default,
  unicorn: () => require("./emojis/EmojiUnicorn").default,
  "unknown-flag": () => require("./emojis/EmojiUnknownFlag").default,
  unlocked: () => require("./emojis/EmojiUnlocked").default,
  "up-arrow": () => require("./emojis/EmojiUpArrow").default,
  "up-down-arrow": () => require("./emojis/EmojiUpDownArrow").default,
  "up-exclamation-button": () => require("./emojis/EmojiUpExclamationButton").default,
  "up-left-arrow": () => require("./emojis/EmojiUpLeftArrow").default,
  "up-right-arrow": () => require("./emojis/EmojiUpRightArrow").default,
  "upside-down-face": () => require("./emojis/EmojiUpsideDownFace").default,
  "upwards-button": () => require("./emojis/EmojiUpwardsButton").default,
  vampire: () => require("./emojis/EmojiVampire").default,
  "vampire-dark-skin-tone": () => require("./emojis/EmojiVampireDarkSkinTone").default,
  "vampire-light-skin-tone": () => require("./emojis/EmojiVampireLightSkinTone").default,
  "vampire-medium-dark-skin-tone": () => require("./emojis/EmojiVampireMediumDarkSkinTone").default,
  "vampire-medium-light-skin-tone": () =>
    require("./emojis/EmojiVampireMediumLightSkinTone").default,
  "vampire-medium-skin-tone": () => require("./emojis/EmojiVampireMediumSkinTone").default,
  "vertical-traffic-light": () => require("./emojis/EmojiVerticalTrafficLight").default,
  "vibration-mode": () => require("./emojis/EmojiVibrationMode").default,
  "victory-hand": () => require("./emojis/EmojiVictoryHand").default,
  "victory-hand-dark-skin-tone": () => require("./emojis/EmojiVictoryHandDarkSkinTone").default,
  "victory-hand-light-skin-tone": () => require("./emojis/EmojiVictoryHandLightSkinTone").default,
  "victory-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiVictoryHandMediumDarkSkinTone").default,
  "victory-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiVictoryHandMediumLightSkinTone").default,
  "victory-hand-medium-skin-tone": () => require("./emojis/EmojiVictoryHandMediumSkinTone").default,
  "video-camera": () => require("./emojis/EmojiVideoCamera").default,
  "video-game": () => require("./emojis/EmojiVideoGame").default,
  videocassette: () => require("./emojis/EmojiVideocassette").default,
  violin: () => require("./emojis/EmojiViolin").default,
  virgo: () => require("./emojis/EmojiVirgo").default,
  volcano: () => require("./emojis/EmojiVolcano").default,
  volleyball: () => require("./emojis/EmojiVolleyball").default,
  "vs-button": () => require("./emojis/EmojiVsButton").default,
  "vulcan-salute": () => require("./emojis/EmojiVulcanSalute").default,
  "vulcan-salute-dark-skin-tone": () => require("./emojis/EmojiVulcanSaluteDarkSkinTone").default,
  "vulcan-salute-light-skin-tone": () => require("./emojis/EmojiVulcanSaluteLightSkinTone").default,
  "vulcan-salute-medium-dark-skin-tone": () =>
    require("./emojis/EmojiVulcanSaluteMediumDarkSkinTone").default,
  "vulcan-salute-medium-light-skin-tone": () =>
    require("./emojis/EmojiVulcanSaluteMediumLightSkinTone").default,
  "vulcan-salute-medium-skin-tone": () =>
    require("./emojis/EmojiVulcanSaluteMediumSkinTone").default,
  waffle: () => require("./emojis/EmojiWaffle").default,
  "waning-crescent-moon": () => require("./emojis/EmojiWaningCrescentMoon").default,
  "waning-gibbous-moon": () => require("./emojis/EmojiWaningGibbousMoon").default,
  warning: () => require("./emojis/EmojiWarning").default,
  wastebasket: () => require("./emojis/EmojiWastebasket").default,
  watch: () => require("./emojis/EmojiWatch").default,
  "water-buffalo": () => require("./emojis/EmojiWaterBuffalo").default,
  "water-closet": () => require("./emojis/EmojiWaterCloset").default,
  "water-pistol": () => require("./emojis/EmojiWaterPistol").default,
  "water-wave": () => require("./emojis/EmojiWaterWave").default,
  watermelon: () => require("./emojis/EmojiWatermelon").default,
  "waving-hand": () => require("./emojis/EmojiWavingHand").default,
  "waving-hand-dark-skin-tone": () => require("./emojis/EmojiWavingHandDarkSkinTone").default,
  "waving-hand-light-skin-tone": () => require("./emojis/EmojiWavingHandLightSkinTone").default,
  "waving-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWavingHandMediumDarkSkinTone").default,
  "waving-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiWavingHandMediumLightSkinTone").default,
  "waving-hand-medium-skin-tone": () => require("./emojis/EmojiWavingHandMediumSkinTone").default,
  "wavy-dash": () => require("./emojis/EmojiWavyDash").default,
  "waxing-crescent-moon": () => require("./emojis/EmojiWaxingCrescentMoon").default,
  "waxing-gibbous-moon": () => require("./emojis/EmojiWaxingGibbousMoon").default,
  "weary-cat": () => require("./emojis/EmojiWearyCat").default,
  "weary-face": () => require("./emojis/EmojiWearyFace").default,
  wedding: () => require("./emojis/EmojiWedding").default,
  whale: () => require("./emojis/EmojiWhale").default,
  wheel: () => require("./emojis/EmojiWheel").default,
  "wheel-of-dharma": () => require("./emojis/EmojiWheelOfDharma").default,
  "wheelchair-symbol": () => require("./emojis/EmojiWheelchairSymbol").default,
  "white-cane": () => require("./emojis/EmojiWhiteCane").default,
  "white-circle": () => require("./emojis/EmojiWhiteCircle").default,
  "white-exclamation-mark": () => require("./emojis/EmojiWhiteExclamationMark").default,
  "white-flag": () => require("./emojis/EmojiWhiteFlag").default,
  "white-flower": () => require("./emojis/EmojiWhiteFlower").default,
  "white-haired": () => require("./emojis/EmojiWhiteHaired").default,
  "white-heart": () => require("./emojis/EmojiWhiteHeart").default,
  "white-large-square": () => require("./emojis/EmojiWhiteLargeSquare").default,
  "white-medium-small-square": () => require("./emojis/EmojiWhiteMediumSmallSquare").default,
  "white-medium-square": () => require("./emojis/EmojiWhiteMediumSquare").default,
  "white-question-mark": () => require("./emojis/EmojiWhiteQuestionMark").default,
  "white-small-square": () => require("./emojis/EmojiWhiteSmallSquare").default,
  "white-square-button": () => require("./emojis/EmojiWhiteSquareButton").default,
  "wilted-flower": () => require("./emojis/EmojiWiltedFlower").default,
  "wind-chime": () => require("./emojis/EmojiWindChime").default,
  "wind-face": () => require("./emojis/EmojiWindFace").default,
  window: () => require("./emojis/EmojiWindow").default,
  "wine-glass": () => require("./emojis/EmojiWineGlass").default,
  wing: () => require("./emojis/EmojiWing").default,
  "winking-face": () => require("./emojis/EmojiWinkingFace").default,
  "winking-face-with-tongue": () => require("./emojis/EmojiWinkingFaceWithTongue").default,
  wireless: () => require("./emojis/EmojiWireless").default,
  wolf: () => require("./emojis/EmojiWolf").default,
  woman: () => require("./emojis/EmojiWoman").default,
  "woman-and-man-holding-hands": () => require("./emojis/EmojiWomanAndManHoldingHands").default,
  "woman-and-man-holding-hands-dark-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsDarkSkinTone").default,
  "woman-and-man-holding-hands-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsDarkSkinToneLightSkinTone").default,
  "woman-and-man-holding-hands-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsDarkSkinToneMediumDarkSkinTone").default,
  "woman-and-man-holding-hands-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsDarkSkinToneMediumLightSkinTone").default,
  "woman-and-man-holding-hands-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsDarkSkinToneMediumSkinTone").default,
  "woman-and-man-holding-hands-light-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsLightSkinTone").default,
  "woman-and-man-holding-hands-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsLightSkinToneDarkSkinTone").default,
  "woman-and-man-holding-hands-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsLightSkinToneMediumDarkSkinTone").default,
  "woman-and-man-holding-hands-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsLightSkinToneMediumLightSkinTone").default,
  "woman-and-man-holding-hands-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsLightSkinToneMediumSkinTone").default,
  "woman-and-man-holding-hands-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsMediumDarkSkinTone").default,
  "woman-and-man-holding-hands-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsMediumDarkSkinToneDarkSkinTone").default,
  "woman-and-man-holding-hands-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsMediumDarkSkinToneLightSkinTone").default,
  "woman-and-man-holding-hands-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsMediumDarkSkinToneMediumLightSkinTone").default,
  "woman-and-man-holding-hands-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsMediumDarkSkinToneMediumSkinTone").default,
  "woman-and-man-holding-hands-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsMediumLightSkinTone").default,
  "woman-and-man-holding-hands-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsMediumLightSkinToneDarkSkinTone").default,
  "woman-and-man-holding-hands-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsMediumLightSkinToneLightSkinTone").default,
  "woman-and-man-holding-hands-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsMediumLightSkinToneMediumDarkSkinTone").default,
  "woman-and-man-holding-hands-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsMediumLightSkinToneMediumSkinTone").default,
  "woman-and-man-holding-hands-medium-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsMediumSkinTone").default,
  "woman-and-man-holding-hands-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsMediumSkinToneDarkSkinTone").default,
  "woman-and-man-holding-hands-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsMediumSkinToneLightSkinTone").default,
  "woman-and-man-holding-hands-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsMediumSkinToneMediumDarkSkinTone").default,
  "woman-and-man-holding-hands-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanAndManHoldingHandsMediumSkinToneMediumLightSkinTone").default,
  "woman-artist": () => require("./emojis/EmojiWomanArtist").default,
  "woman-artist-dark-skin-tone": () => require("./emojis/EmojiWomanArtistDarkSkinTone").default,
  "woman-artist-light-skin-tone": () => require("./emojis/EmojiWomanArtistLightSkinTone").default,
  "woman-artist-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanArtistMediumDarkSkinTone").default,
  "woman-artist-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanArtistMediumLightSkinTone").default,
  "woman-artist-medium-skin-tone": () => require("./emojis/EmojiWomanArtistMediumSkinTone").default,
  "woman-astronaut": () => require("./emojis/EmojiWomanAstronaut").default,
  "woman-astronaut-dark-skin-tone": () =>
    require("./emojis/EmojiWomanAstronautDarkSkinTone").default,
  "woman-astronaut-light-skin-tone": () =>
    require("./emojis/EmojiWomanAstronautLightSkinTone").default,
  "woman-astronaut-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanAstronautMediumDarkSkinTone").default,
  "woman-astronaut-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanAstronautMediumLightSkinTone").default,
  "woman-astronaut-medium-skin-tone": () =>
    require("./emojis/EmojiWomanAstronautMediumSkinTone").default,
  "woman-bald": () => require("./emojis/EmojiWomanBald").default,
  "woman-beard": () => require("./emojis/EmojiWomanBeard").default,
  "woman-biking": () => require("./emojis/EmojiWomanBiking").default,
  "woman-biking-dark-skin-tone": () => require("./emojis/EmojiWomanBikingDarkSkinTone").default,
  "woman-biking-light-skin-tone": () => require("./emojis/EmojiWomanBikingLightSkinTone").default,
  "woman-biking-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanBikingMediumDarkSkinTone").default,
  "woman-biking-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanBikingMediumLightSkinTone").default,
  "woman-biking-medium-skin-tone": () => require("./emojis/EmojiWomanBikingMediumSkinTone").default,
  "woman-blond-hair": () => require("./emojis/EmojiWomanBlondHair").default,
  "woman-bouncing-ball": () => require("./emojis/EmojiWomanBouncingBall").default,
  "woman-bouncing-ball-dark-skin-tone": () =>
    require("./emojis/EmojiWomanBouncingBallDarkSkinTone").default,
  "woman-bouncing-ball-light-skin-tone": () =>
    require("./emojis/EmojiWomanBouncingBallLightSkinTone").default,
  "woman-bouncing-ball-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanBouncingBallMediumDarkSkinTone").default,
  "woman-bouncing-ball-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanBouncingBallMediumLightSkinTone").default,
  "woman-bouncing-ball-medium-skin-tone": () =>
    require("./emojis/EmojiWomanBouncingBallMediumSkinTone").default,
  "woman-bowing": () => require("./emojis/EmojiWomanBowing").default,
  "woman-bowing-dark-skin-tone": () => require("./emojis/EmojiWomanBowingDarkSkinTone").default,
  "woman-bowing-light-skin-tone": () => require("./emojis/EmojiWomanBowingLightSkinTone").default,
  "woman-bowing-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanBowingMediumDarkSkinTone").default,
  "woman-bowing-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanBowingMediumLightSkinTone").default,
  "woman-bowing-medium-skin-tone": () => require("./emojis/EmojiWomanBowingMediumSkinTone").default,
  "woman-cartwheeling": () => require("./emojis/EmojiWomanCartwheeling").default,
  "woman-cartwheeling-dark-skin-tone": () =>
    require("./emojis/EmojiWomanCartwheelingDarkSkinTone").default,
  "woman-cartwheeling-light-skin-tone": () =>
    require("./emojis/EmojiWomanCartwheelingLightSkinTone").default,
  "woman-cartwheeling-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanCartwheelingMediumDarkSkinTone").default,
  "woman-cartwheeling-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanCartwheelingMediumLightSkinTone").default,
  "woman-cartwheeling-medium-skin-tone": () =>
    require("./emojis/EmojiWomanCartwheelingMediumSkinTone").default,
  "woman-climbing": () => require("./emojis/EmojiWomanClimbing").default,
  "woman-climbing-dark-skin-tone": () => require("./emojis/EmojiWomanClimbingDarkSkinTone").default,
  "woman-climbing-light-skin-tone": () =>
    require("./emojis/EmojiWomanClimbingLightSkinTone").default,
  "woman-climbing-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanClimbingMediumDarkSkinTone").default,
  "woman-climbing-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanClimbingMediumLightSkinTone").default,
  "woman-climbing-medium-skin-tone": () =>
    require("./emojis/EmojiWomanClimbingMediumSkinTone").default,
  "woman-climbing-tone1": () => require("./emojis/EmojiWomanClimbingTone1").default,
  "woman-climbing-tone2": () => require("./emojis/EmojiWomanClimbingTone2").default,
  "woman-climbing-tone3": () => require("./emojis/EmojiWomanClimbingTone3").default,
  "woman-climbing-tone4": () => require("./emojis/EmojiWomanClimbingTone4").default,
  "woman-climbing-tone5": () => require("./emojis/EmojiWomanClimbingTone5").default,
  "woman-construction-worker": () => require("./emojis/EmojiWomanConstructionWorker").default,
  "woman-construction-worker-dark-skin-tone": () =>
    require("./emojis/EmojiWomanConstructionWorkerDarkSkinTone").default,
  "woman-construction-worker-light-skin-tone": () =>
    require("./emojis/EmojiWomanConstructionWorkerLightSkinTone").default,
  "woman-construction-worker-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanConstructionWorkerMediumDarkSkinTone").default,
  "woman-construction-worker-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanConstructionWorkerMediumLightSkinTone").default,
  "woman-construction-worker-medium-skin-tone": () =>
    require("./emojis/EmojiWomanConstructionWorkerMediumSkinTone").default,
  "woman-cook": () => require("./emojis/EmojiWomanCook").default,
  "woman-cook-dark-skin-tone": () => require("./emojis/EmojiWomanCookDarkSkinTone").default,
  "woman-cook-light-skin-tone": () => require("./emojis/EmojiWomanCookLightSkinTone").default,
  "woman-cook-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanCookMediumDarkSkinTone").default,
  "woman-cook-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanCookMediumLightSkinTone").default,
  "woman-cook-medium-skin-tone": () => require("./emojis/EmojiWomanCookMediumSkinTone").default,
  "woman-curly-hair": () => require("./emojis/EmojiWomanCurlyHair").default,
  "woman-dancing": () => require("./emojis/EmojiWomanDancing").default,
  "woman-dancing-dark-skin-tone": () => require("./emojis/EmojiWomanDancingDarkSkinTone").default,
  "woman-dancing-light-skin-tone": () => require("./emojis/EmojiWomanDancingLightSkinTone").default,
  "woman-dancing-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanDancingMediumDarkSkinTone").default,
  "woman-dancing-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanDancingMediumLightSkinTone").default,
  "woman-dancing-medium-skin-tone": () =>
    require("./emojis/EmojiWomanDancingMediumSkinTone").default,
  "woman-dark-skin-tone": () => require("./emojis/EmojiWomanDarkSkinTone").default,
  "woman-dark-skin-tone-bald": () => require("./emojis/EmojiWomanDarkSkinToneBald").default,
  "woman-dark-skin-tone-beard": () => require("./emojis/EmojiWomanDarkSkinToneBeard").default,
  "woman-dark-skin-tone-blond-hair": () =>
    require("./emojis/EmojiWomanDarkSkinToneBlondHair").default,
  "woman-dark-skin-tone-curly-hair": () =>
    require("./emojis/EmojiWomanDarkSkinToneCurlyHair").default,
  "woman-dark-skin-tone-red-hair": () => require("./emojis/EmojiWomanDarkSkinToneRedHair").default,
  "woman-dark-skin-tone-white-hair": () =>
    require("./emojis/EmojiWomanDarkSkinToneWhiteHair").default,
  "woman-detective": () => require("./emojis/EmojiWomanDetective").default,
  "woman-detective-dark-skin-tone": () =>
    require("./emojis/EmojiWomanDetectiveDarkSkinTone").default,
  "woman-detective-light-skin-tone": () =>
    require("./emojis/EmojiWomanDetectiveLightSkinTone").default,
  "woman-detective-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanDetectiveMediumDarkSkinTone").default,
  "woman-detective-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanDetectiveMediumLightSkinTone").default,
  "woman-detective-medium-skin-tone": () =>
    require("./emojis/EmojiWomanDetectiveMediumSkinTone").default,
  "woman-elf": () => require("./emojis/EmojiWomanElf").default,
  "woman-elf-dark-skin-tone": () => require("./emojis/EmojiWomanElfDarkSkinTone").default,
  "woman-elf-light-skin-tone": () => require("./emojis/EmojiWomanElfLightSkinTone").default,
  "woman-elf-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanElfMediumDarkSkinTone").default,
  "woman-elf-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanElfMediumLightSkinTone").default,
  "woman-elf-medium-skin-tone": () => require("./emojis/EmojiWomanElfMediumSkinTone").default,
  "woman-facepalming": () => require("./emojis/EmojiWomanFacepalming").default,
  "woman-facepalming-dark-skin-tone": () =>
    require("./emojis/EmojiWomanFacepalmingDarkSkinTone").default,
  "woman-facepalming-light-skin-tone": () =>
    require("./emojis/EmojiWomanFacepalmingLightSkinTone").default,
  "woman-facepalming-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanFacepalmingMediumDarkSkinTone").default,
  "woman-facepalming-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanFacepalmingMediumLightSkinTone").default,
  "woman-facepalming-medium-skin-tone": () =>
    require("./emojis/EmojiWomanFacepalmingMediumSkinTone").default,
  "woman-factory-worker": () => require("./emojis/EmojiWomanFactoryWorker").default,
  "woman-factory-worker-dark-skin-tone": () =>
    require("./emojis/EmojiWomanFactoryWorkerDarkSkinTone").default,
  "woman-factory-worker-light-skin-tone": () =>
    require("./emojis/EmojiWomanFactoryWorkerLightSkinTone").default,
  "woman-factory-worker-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanFactoryWorkerMediumDarkSkinTone").default,
  "woman-factory-worker-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanFactoryWorkerMediumLightSkinTone").default,
  "woman-factory-worker-medium-skin-tone": () =>
    require("./emojis/EmojiWomanFactoryWorkerMediumSkinTone").default,
  "woman-fairy": () => require("./emojis/EmojiWomanFairy").default,
  "woman-fairy-dark-skin-tone": () => require("./emojis/EmojiWomanFairyDarkSkinTone").default,
  "woman-fairy-light-skin-tone": () => require("./emojis/EmojiWomanFairyLightSkinTone").default,
  "woman-fairy-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanFairyMediumDarkSkinTone").default,
  "woman-fairy-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanFairyMediumLightSkinTone").default,
  "woman-fairy-medium-skin-tone": () => require("./emojis/EmojiWomanFairyMediumSkinTone").default,
  "woman-farmer": () => require("./emojis/EmojiWomanFarmer").default,
  "woman-farmer-dark-skin-tone": () => require("./emojis/EmojiWomanFarmerDarkSkinTone").default,
  "woman-farmer-light-skin-tone": () => require("./emojis/EmojiWomanFarmerLightSkinTone").default,
  "woman-farmer-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanFarmerMediumDarkSkinTone").default,
  "woman-farmer-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanFarmerMediumLightSkinTone").default,
  "woman-farmer-medium-skin-tone": () => require("./emojis/EmojiWomanFarmerMediumSkinTone").default,
  "woman-feeding-baby": () => require("./emojis/EmojiWomanFeedingBaby").default,
  "woman-feeding-baby-dark-skin-tone": () =>
    require("./emojis/EmojiWomanFeedingBabyDarkSkinTone").default,
  "woman-feeding-baby-light-skin-tone": () =>
    require("./emojis/EmojiWomanFeedingBabyLightSkinTone").default,
  "woman-feeding-baby-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanFeedingBabyMediumDarkSkinTone").default,
  "woman-feeding-baby-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanFeedingBabyMediumLightSkinTone").default,
  "woman-feeding-baby-medium-skin-tone": () =>
    require("./emojis/EmojiWomanFeedingBabyMediumSkinTone").default,
  "woman-firefighter": () => require("./emojis/EmojiWomanFirefighter").default,
  "woman-firefighter-dark-skin-tone": () =>
    require("./emojis/EmojiWomanFirefighterDarkSkinTone").default,
  "woman-firefighter-light-skin-tone": () =>
    require("./emojis/EmojiWomanFirefighterLightSkinTone").default,
  "woman-firefighter-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanFirefighterMediumDarkSkinTone").default,
  "woman-firefighter-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanFirefighterMediumLightSkinTone").default,
  "woman-firefighter-medium-skin-tone": () =>
    require("./emojis/EmojiWomanFirefighterMediumSkinTone").default,
  "woman-frowning": () => require("./emojis/EmojiWomanFrowning").default,
  "woman-frowning-dark-skin-tone": () => require("./emojis/EmojiWomanFrowningDarkSkinTone").default,
  "woman-frowning-light-skin-tone": () =>
    require("./emojis/EmojiWomanFrowningLightSkinTone").default,
  "woman-frowning-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanFrowningMediumDarkSkinTone").default,
  "woman-frowning-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanFrowningMediumLightSkinTone").default,
  "woman-frowning-medium-skin-tone": () =>
    require("./emojis/EmojiWomanFrowningMediumSkinTone").default,
  "woman-genie": () => require("./emojis/EmojiWomanGenie").default,
  "woman-gesturing-no": () => require("./emojis/EmojiWomanGesturingNo").default,
  "woman-gesturing-no-dark-skin-tone": () =>
    require("./emojis/EmojiWomanGesturingNoDarkSkinTone").default,
  "woman-gesturing-no-light-skin-tone": () =>
    require("./emojis/EmojiWomanGesturingNoLightSkinTone").default,
  "woman-gesturing-no-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanGesturingNoMediumDarkSkinTone").default,
  "woman-gesturing-no-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanGesturingNoMediumLightSkinTone").default,
  "woman-gesturing-no-medium-skin-tone": () =>
    require("./emojis/EmojiWomanGesturingNoMediumSkinTone").default,
  "woman-gesturing-ok": () => require("./emojis/EmojiWomanGesturingOk").default,
  "woman-gesturing-ok-dark-skin-tone": () =>
    require("./emojis/EmojiWomanGesturingOkDarkSkinTone").default,
  "woman-gesturing-ok-light-skin-tone": () =>
    require("./emojis/EmojiWomanGesturingOkLightSkinTone").default,
  "woman-gesturing-ok-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanGesturingOkMediumDarkSkinTone").default,
  "woman-gesturing-ok-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanGesturingOkMediumLightSkinTone").default,
  "woman-gesturing-ok-medium-skin-tone": () =>
    require("./emojis/EmojiWomanGesturingOkMediumSkinTone").default,
  "woman-getting-haircut": () => require("./emojis/EmojiWomanGettingHaircut").default,
  "woman-getting-haircut-dark-skin-tone": () =>
    require("./emojis/EmojiWomanGettingHaircutDarkSkinTone").default,
  "woman-getting-haircut-light-skin-tone": () =>
    require("./emojis/EmojiWomanGettingHaircutLightSkinTone").default,
  "woman-getting-haircut-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanGettingHaircutMediumDarkSkinTone").default,
  "woman-getting-haircut-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanGettingHaircutMediumLightSkinTone").default,
  "woman-getting-haircut-medium-skin-tone": () =>
    require("./emojis/EmojiWomanGettingHaircutMediumSkinTone").default,
  "woman-getting-massage": () => require("./emojis/EmojiWomanGettingMassage").default,
  "woman-getting-massage-dark-skin-tone": () =>
    require("./emojis/EmojiWomanGettingMassageDarkSkinTone").default,
  "woman-getting-massage-light-skin-tone": () =>
    require("./emojis/EmojiWomanGettingMassageLightSkinTone").default,
  "woman-getting-massage-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanGettingMassageMediumDarkSkinTone").default,
  "woman-getting-massage-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanGettingMassageMediumLightSkinTone").default,
  "woman-getting-massage-medium-skin-tone": () =>
    require("./emojis/EmojiWomanGettingMassageMediumSkinTone").default,
  "woman-golfing": () => require("./emojis/EmojiWomanGolfing").default,
  "woman-golfing-dark-skin-tone": () => require("./emojis/EmojiWomanGolfingDarkSkinTone").default,
  "woman-golfing-light-skin-tone": () => require("./emojis/EmojiWomanGolfingLightSkinTone").default,
  "woman-golfing-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanGolfingMediumDarkSkinTone").default,
  "woman-golfing-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanGolfingMediumLightSkinTone").default,
  "woman-golfing-medium-skin-tone": () =>
    require("./emojis/EmojiWomanGolfingMediumSkinTone").default,
  "woman-guard": () => require("./emojis/EmojiWomanGuard").default,
  "woman-guard-dark-skin-tone": () => require("./emojis/EmojiWomanGuardDarkSkinTone").default,
  "woman-guard-light-skin-tone": () => require("./emojis/EmojiWomanGuardLightSkinTone").default,
  "woman-guard-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanGuardMediumDarkSkinTone").default,
  "woman-guard-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanGuardMediumLightSkinTone").default,
  "woman-guard-medium-skin-tone": () => require("./emojis/EmojiWomanGuardMediumSkinTone").default,
  "woman-health-worker": () => require("./emojis/EmojiWomanHealthWorker").default,
  "woman-health-worker-dark-skin-tone": () =>
    require("./emojis/EmojiWomanHealthWorkerDarkSkinTone").default,
  "woman-health-worker-light-skin-tone": () =>
    require("./emojis/EmojiWomanHealthWorkerLightSkinTone").default,
  "woman-health-worker-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanHealthWorkerMediumDarkSkinTone").default,
  "woman-health-worker-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanHealthWorkerMediumLightSkinTone").default,
  "woman-health-worker-medium-skin-tone": () =>
    require("./emojis/EmojiWomanHealthWorkerMediumSkinTone").default,
  "woman-in-lotus-position": () => require("./emojis/EmojiWomanInLotusPosition").default,
  "woman-in-lotus-position-dark-skin-tone": () =>
    require("./emojis/EmojiWomanInLotusPositionDarkSkinTone").default,
  "woman-in-lotus-position-light-skin-tone": () =>
    require("./emojis/EmojiWomanInLotusPositionLightSkinTone").default,
  "woman-in-lotus-position-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanInLotusPositionMediumDarkSkinTone").default,
  "woman-in-lotus-position-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanInLotusPositionMediumLightSkinTone").default,
  "woman-in-lotus-position-medium-skin-tone": () =>
    require("./emojis/EmojiWomanInLotusPositionMediumSkinTone").default,
  "woman-in-manual-wheelchair": () => require("./emojis/EmojiWomanInManualWheelchair").default,
  "woman-in-manual-wheelchair-dark-skin-tone": () =>
    require("./emojis/EmojiWomanInManualWheelchairDarkSkinTone").default,
  "woman-in-manual-wheelchair-facing-right": () =>
    require("./emojis/EmojiWomanInManualWheelchairFacingRight").default,
  "woman-in-manual-wheelchair-facing-right-dark-skin-tone": () =>
    require("./emojis/EmojiWomanInManualWheelchairFacingRightDarkSkinTone").default,
  "woman-in-manual-wheelchair-facing-right-light-skin-tone": () =>
    require("./emojis/EmojiWomanInManualWheelchairFacingRightLightSkinTone").default,
  "woman-in-manual-wheelchair-facing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanInManualWheelchairFacingRightMediumDarkSkinTone").default,
  "woman-in-manual-wheelchair-facing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanInManualWheelchairFacingRightMediumLightSkinTone").default,
  "woman-in-manual-wheelchair-facing-right-medium-skin-tone": () =>
    require("./emojis/EmojiWomanInManualWheelchairFacingRightMediumSkinTone").default,
  "woman-in-manual-wheelchair-light-skin-tone": () =>
    require("./emojis/EmojiWomanInManualWheelchairLightSkinTone").default,
  "woman-in-manual-wheelchair-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanInManualWheelchairMediumDarkSkinTone").default,
  "woman-in-manual-wheelchair-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanInManualWheelchairMediumLightSkinTone").default,
  "woman-in-manual-wheelchair-medium-skin-tone": () =>
    require("./emojis/EmojiWomanInManualWheelchairMediumSkinTone").default,
  "woman-in-motorized-wheelchair": () =>
    require("./emojis/EmojiWomanInMotorizedWheelchair").default,
  "woman-in-motorized-wheelchair-dark-skin-tone": () =>
    require("./emojis/EmojiWomanInMotorizedWheelchairDarkSkinTone").default,
  "woman-in-motorized-wheelchair-facing-right": () =>
    require("./emojis/EmojiWomanInMotorizedWheelchairFacingRight").default,
  "woman-in-motorized-wheelchair-facing-right-dark-skin-tone": () =>
    require("./emojis/EmojiWomanInMotorizedWheelchairFacingRightDarkSkinTone").default,
  "woman-in-motorized-wheelchair-facing-right-light-skin-tone": () =>
    require("./emojis/EmojiWomanInMotorizedWheelchairFacingRightLightSkinTone").default,
  "woman-in-motorized-wheelchair-facing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanInMotorizedWheelchairFacingRightMediumDarkSkinTone").default,
  "woman-in-motorized-wheelchair-facing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanInMotorizedWheelchairFacingRightMediumLightSkinTone").default,
  "woman-in-motorized-wheelchair-facing-right-medium-skin-tone": () =>
    require("./emojis/EmojiWomanInMotorizedWheelchairFacingRightMediumSkinTone").default,
  "woman-in-motorized-wheelchair-light-skin-tone": () =>
    require("./emojis/EmojiWomanInMotorizedWheelchairLightSkinTone").default,
  "woman-in-motorized-wheelchair-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanInMotorizedWheelchairMediumDarkSkinTone").default,
  "woman-in-motorized-wheelchair-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanInMotorizedWheelchairMediumLightSkinTone").default,
  "woman-in-motorized-wheelchair-medium-skin-tone": () =>
    require("./emojis/EmojiWomanInMotorizedWheelchairMediumSkinTone").default,
  "woman-in-steamy-room": () => require("./emojis/EmojiWomanInSteamyRoom").default,
  "woman-in-steamy-room-dark-skin-tone": () =>
    require("./emojis/EmojiWomanInSteamyRoomDarkSkinTone").default,
  "woman-in-steamy-room-light-skin-tone": () =>
    require("./emojis/EmojiWomanInSteamyRoomLightSkinTone").default,
  "woman-in-steamy-room-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanInSteamyRoomMediumDarkSkinTone").default,
  "woman-in-steamy-room-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanInSteamyRoomMediumLightSkinTone").default,
  "woman-in-steamy-room-medium-skin-tone": () =>
    require("./emojis/EmojiWomanInSteamyRoomMediumSkinTone").default,
  "woman-in-tuxedo": () => require("./emojis/EmojiWomanInTuxedo").default,
  "woman-in-tuxedo-dark-skin-tone": () =>
    require("./emojis/EmojiWomanInTuxedoDarkSkinTone").default,
  "woman-in-tuxedo-light-skin-tone": () =>
    require("./emojis/EmojiWomanInTuxedoLightSkinTone").default,
  "woman-in-tuxedo-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanInTuxedoMediumDarkSkinTone").default,
  "woman-in-tuxedo-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanInTuxedoMediumLightSkinTone").default,
  "woman-in-tuxedo-medium-skin-tone": () =>
    require("./emojis/EmojiWomanInTuxedoMediumSkinTone").default,
  "woman-judge": () => require("./emojis/EmojiWomanJudge").default,
  "woman-judge-dark-skin-tone": () => require("./emojis/EmojiWomanJudgeDarkSkinTone").default,
  "woman-judge-light-skin-tone": () => require("./emojis/EmojiWomanJudgeLightSkinTone").default,
  "woman-judge-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanJudgeMediumDarkSkinTone").default,
  "woman-judge-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanJudgeMediumLightSkinTone").default,
  "woman-judge-medium-skin-tone": () => require("./emojis/EmojiWomanJudgeMediumSkinTone").default,
  "woman-juggling": () => require("./emojis/EmojiWomanJuggling").default,
  "woman-juggling-dark-skin-tone": () => require("./emojis/EmojiWomanJugglingDarkSkinTone").default,
  "woman-juggling-light-skin-tone": () =>
    require("./emojis/EmojiWomanJugglingLightSkinTone").default,
  "woman-juggling-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanJugglingMediumDarkSkinTone").default,
  "woman-juggling-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanJugglingMediumLightSkinTone").default,
  "woman-juggling-medium-skin-tone": () =>
    require("./emojis/EmojiWomanJugglingMediumSkinTone").default,
  "woman-kneeling": () => require("./emojis/EmojiWomanKneeling").default,
  "woman-kneeling-dark-skin-tone": () => require("./emojis/EmojiWomanKneelingDarkSkinTone").default,
  "woman-kneeling-facing-right": () => require("./emojis/EmojiWomanKneelingFacingRight").default,
  "woman-kneeling-facing-right-dark-skin-tone": () =>
    require("./emojis/EmojiWomanKneelingFacingRightDarkSkinTone").default,
  "woman-kneeling-facing-right-light-skin-tone": () =>
    require("./emojis/EmojiWomanKneelingFacingRightLightSkinTone").default,
  "woman-kneeling-facing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanKneelingFacingRightMediumDarkSkinTone").default,
  "woman-kneeling-facing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanKneelingFacingRightMediumLightSkinTone").default,
  "woman-kneeling-facing-right-medium-skin-tone": () =>
    require("./emojis/EmojiWomanKneelingFacingRightMediumSkinTone").default,
  "woman-kneeling-light-skin-tone": () =>
    require("./emojis/EmojiWomanKneelingLightSkinTone").default,
  "woman-kneeling-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanKneelingMediumDarkSkinTone").default,
  "woman-kneeling-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanKneelingMediumLightSkinTone").default,
  "woman-kneeling-medium-skin-tone": () =>
    require("./emojis/EmojiWomanKneelingMediumSkinTone").default,
  "woman-lifting-weights": () => require("./emojis/EmojiWomanLiftingWeights").default,
  "woman-lifting-weights-dark-skin-tone": () =>
    require("./emojis/EmojiWomanLiftingWeightsDarkSkinTone").default,
  "woman-lifting-weights-light-skin-tone": () =>
    require("./emojis/EmojiWomanLiftingWeightsLightSkinTone").default,
  "woman-lifting-weights-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanLiftingWeightsMediumDarkSkinTone").default,
  "woman-lifting-weights-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanLiftingWeightsMediumLightSkinTone").default,
  "woman-lifting-weights-medium-skin-tone": () =>
    require("./emojis/EmojiWomanLiftingWeightsMediumSkinTone").default,
  "woman-light-skin-tone": () => require("./emojis/EmojiWomanLightSkinTone").default,
  "woman-light-skin-tone-bald": () => require("./emojis/EmojiWomanLightSkinToneBald").default,
  "woman-light-skin-tone-beard": () => require("./emojis/EmojiWomanLightSkinToneBeard").default,
  "woman-light-skin-tone-blond-hair": () =>
    require("./emojis/EmojiWomanLightSkinToneBlondHair").default,
  "woman-light-skin-tone-curly-hair": () =>
    require("./emojis/EmojiWomanLightSkinToneCurlyHair").default,
  "woman-light-skin-tone-red-hair": () =>
    require("./emojis/EmojiWomanLightSkinToneRedHair").default,
  "woman-light-skin-tone-white-hair": () =>
    require("./emojis/EmojiWomanLightSkinToneWhiteHair").default,
  "woman-mage": () => require("./emojis/EmojiWomanMage").default,
  "woman-mage-dark-skin-tone": () => require("./emojis/EmojiWomanMageDarkSkinTone").default,
  "woman-mage-light-skin-tone": () => require("./emojis/EmojiWomanMageLightSkinTone").default,
  "woman-mage-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanMageMediumDarkSkinTone").default,
  "woman-mage-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanMageMediumLightSkinTone").default,
  "woman-mage-medium-skin-tone": () => require("./emojis/EmojiWomanMageMediumSkinTone").default,
  "woman-mage-tone3": () => require("./emojis/EmojiWomanMageTone3").default,
  "woman-mechanic": () => require("./emojis/EmojiWomanMechanic").default,
  "woman-mechanic-dark-skin-tone": () => require("./emojis/EmojiWomanMechanicDarkSkinTone").default,
  "woman-mechanic-light-skin-tone": () =>
    require("./emojis/EmojiWomanMechanicLightSkinTone").default,
  "woman-mechanic-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanMechanicMediumDarkSkinTone").default,
  "woman-mechanic-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanMechanicMediumLightSkinTone").default,
  "woman-mechanic-medium-skin-tone": () =>
    require("./emojis/EmojiWomanMechanicMediumSkinTone").default,
  "woman-medium-dark-skin-tone": () => require("./emojis/EmojiWomanMediumDarkSkinTone").default,
  "woman-medium-dark-skin-tone-bald": () =>
    require("./emojis/EmojiWomanMediumDarkSkinToneBald").default,
  "woman-medium-dark-skin-tone-beard": () =>
    require("./emojis/EmojiWomanMediumDarkSkinToneBeard").default,
  "woman-medium-dark-skin-tone-blond-hair": () =>
    require("./emojis/EmojiWomanMediumDarkSkinToneBlondHair").default,
  "woman-medium-dark-skin-tone-curly-hair": () =>
    require("./emojis/EmojiWomanMediumDarkSkinToneCurlyHair").default,
  "woman-medium-dark-skin-tone-red-hair": () =>
    require("./emojis/EmojiWomanMediumDarkSkinToneRedHair").default,
  "woman-medium-dark-skin-tone-white-hair": () =>
    require("./emojis/EmojiWomanMediumDarkSkinToneWhiteHair").default,
  "woman-medium-light-skin-tone": () => require("./emojis/EmojiWomanMediumLightSkinTone").default,
  "woman-medium-light-skin-tone-bald": () =>
    require("./emojis/EmojiWomanMediumLightSkinToneBald").default,
  "woman-medium-light-skin-tone-beard": () =>
    require("./emojis/EmojiWomanMediumLightSkinToneBeard").default,
  "woman-medium-light-skin-tone-blond-hair": () =>
    require("./emojis/EmojiWomanMediumLightSkinToneBlondHair").default,
  "woman-medium-light-skin-tone-curly-hair": () =>
    require("./emojis/EmojiWomanMediumLightSkinToneCurlyHair").default,
  "woman-medium-light-skin-tone-red-hair": () =>
    require("./emojis/EmojiWomanMediumLightSkinToneRedHair").default,
  "woman-medium-light-skin-tone-white-hair": () =>
    require("./emojis/EmojiWomanMediumLightSkinToneWhiteHair").default,
  "woman-medium-skin-tone": () => require("./emojis/EmojiWomanMediumSkinTone").default,
  "woman-medium-skin-tone-bald": () => require("./emojis/EmojiWomanMediumSkinToneBald").default,
  "woman-medium-skin-tone-beard": () => require("./emojis/EmojiWomanMediumSkinToneBeard").default,
  "woman-medium-skin-tone-blond-hair": () =>
    require("./emojis/EmojiWomanMediumSkinToneBlondHair").default,
  "woman-medium-skin-tone-curly-hair": () =>
    require("./emojis/EmojiWomanMediumSkinToneCurlyHair").default,
  "woman-medium-skin-tone-red-hair": () =>
    require("./emojis/EmojiWomanMediumSkinToneRedHair").default,
  "woman-medium-skin-tone-white-hair": () =>
    require("./emojis/EmojiWomanMediumSkinToneWhiteHair").default,
  "woman-mountain-biking": () => require("./emojis/EmojiWomanMountainBiking").default,
  "woman-mountain-biking-dark-skin-tone": () =>
    require("./emojis/EmojiWomanMountainBikingDarkSkinTone").default,
  "woman-mountain-biking-light-skin-tone": () =>
    require("./emojis/EmojiWomanMountainBikingLightSkinTone").default,
  "woman-mountain-biking-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanMountainBikingMediumDarkSkinTone").default,
  "woman-mountain-biking-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanMountainBikingMediumLightSkinTone").default,
  "woman-mountain-biking-medium-skin-tone": () =>
    require("./emojis/EmojiWomanMountainBikingMediumSkinTone").default,
  "woman-office-worker": () => require("./emojis/EmojiWomanOfficeWorker").default,
  "woman-office-worker-dark-skin-tone": () =>
    require("./emojis/EmojiWomanOfficeWorkerDarkSkinTone").default,
  "woman-office-worker-light-skin-tone": () =>
    require("./emojis/EmojiWomanOfficeWorkerLightSkinTone").default,
  "woman-office-worker-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanOfficeWorkerMediumDarkSkinTone").default,
  "woman-office-worker-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanOfficeWorkerMediumLightSkinTone").default,
  "woman-office-worker-medium-skin-tone": () =>
    require("./emojis/EmojiWomanOfficeWorkerMediumSkinTone").default,
  "woman-pilot": () => require("./emojis/EmojiWomanPilot").default,
  "woman-pilot-dark-skin-tone": () => require("./emojis/EmojiWomanPilotDarkSkinTone").default,
  "woman-pilot-light-skin-tone": () => require("./emojis/EmojiWomanPilotLightSkinTone").default,
  "woman-pilot-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanPilotMediumDarkSkinTone").default,
  "woman-pilot-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanPilotMediumLightSkinTone").default,
  "woman-pilot-medium-skin-tone": () => require("./emojis/EmojiWomanPilotMediumSkinTone").default,
  "woman-playing-handball": () => require("./emojis/EmojiWomanPlayingHandball").default,
  "woman-playing-handball-dark-skin-tone": () =>
    require("./emojis/EmojiWomanPlayingHandballDarkSkinTone").default,
  "woman-playing-handball-light-skin-tone": () =>
    require("./emojis/EmojiWomanPlayingHandballLightSkinTone").default,
  "woman-playing-handball-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanPlayingHandballMediumDarkSkinTone").default,
  "woman-playing-handball-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanPlayingHandballMediumLightSkinTone").default,
  "woman-playing-handball-medium-skin-tone": () =>
    require("./emojis/EmojiWomanPlayingHandballMediumSkinTone").default,
  "woman-playing-water-polo": () => require("./emojis/EmojiWomanPlayingWaterPolo").default,
  "woman-playing-water-polo-dark-skin-tone": () =>
    require("./emojis/EmojiWomanPlayingWaterPoloDarkSkinTone").default,
  "woman-playing-water-polo-light-skin-tone": () =>
    require("./emojis/EmojiWomanPlayingWaterPoloLightSkinTone").default,
  "woman-playing-water-polo-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanPlayingWaterPoloMediumDarkSkinTone").default,
  "woman-playing-water-polo-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanPlayingWaterPoloMediumLightSkinTone").default,
  "woman-playing-water-polo-medium-skin-tone": () =>
    require("./emojis/EmojiWomanPlayingWaterPoloMediumSkinTone").default,
  "woman-police-officer": () => require("./emojis/EmojiWomanPoliceOfficer").default,
  "woman-police-officer-dark-skin-tone": () =>
    require("./emojis/EmojiWomanPoliceOfficerDarkSkinTone").default,
  "woman-police-officer-light-skin-tone": () =>
    require("./emojis/EmojiWomanPoliceOfficerLightSkinTone").default,
  "woman-police-officer-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanPoliceOfficerMediumDarkSkinTone").default,
  "woman-police-officer-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanPoliceOfficerMediumLightSkinTone").default,
  "woman-police-officer-medium-skin-tone": () =>
    require("./emojis/EmojiWomanPoliceOfficerMediumSkinTone").default,
  "woman-pouting": () => require("./emojis/EmojiWomanPouting").default,
  "woman-pouting-dark-skin-tone": () => require("./emojis/EmojiWomanPoutingDarkSkinTone").default,
  "woman-pouting-light-skin-tone": () => require("./emojis/EmojiWomanPoutingLightSkinTone").default,
  "woman-pouting-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanPoutingMediumDarkSkinTone").default,
  "woman-pouting-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanPoutingMediumLightSkinTone").default,
  "woman-pouting-medium-skin-tone": () =>
    require("./emojis/EmojiWomanPoutingMediumSkinTone").default,
  "woman-raising-hand": () => require("./emojis/EmojiWomanRaisingHand").default,
  "woman-raising-hand-dark-skin-tone": () =>
    require("./emojis/EmojiWomanRaisingHandDarkSkinTone").default,
  "woman-raising-hand-light-skin-tone": () =>
    require("./emojis/EmojiWomanRaisingHandLightSkinTone").default,
  "woman-raising-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanRaisingHandMediumDarkSkinTone").default,
  "woman-raising-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanRaisingHandMediumLightSkinTone").default,
  "woman-raising-hand-medium-skin-tone": () =>
    require("./emojis/EmojiWomanRaisingHandMediumSkinTone").default,
  "woman-red-hair": () => require("./emojis/EmojiWomanRedHair").default,
  "woman-rowing-boat": () => require("./emojis/EmojiWomanRowingBoat").default,
  "woman-rowing-boat-dark-skin-tone": () =>
    require("./emojis/EmojiWomanRowingBoatDarkSkinTone").default,
  "woman-rowing-boat-light-skin-tone": () =>
    require("./emojis/EmojiWomanRowingBoatLightSkinTone").default,
  "woman-rowing-boat-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanRowingBoatMediumDarkSkinTone").default,
  "woman-rowing-boat-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanRowingBoatMediumLightSkinTone").default,
  "woman-rowing-boat-medium-skin-tone": () =>
    require("./emojis/EmojiWomanRowingBoatMediumSkinTone").default,
  "woman-running": () => require("./emojis/EmojiWomanRunning").default,
  "woman-running-dark-skin-tone": () => require("./emojis/EmojiWomanRunningDarkSkinTone").default,
  "woman-running-facing-right": () => require("./emojis/EmojiWomanRunningFacingRight").default,
  "woman-running-facing-right-dark-skin-tone": () =>
    require("./emojis/EmojiWomanRunningFacingRightDarkSkinTone").default,
  "woman-running-facing-right-light-skin-tone": () =>
    require("./emojis/EmojiWomanRunningFacingRightLightSkinTone").default,
  "woman-running-facing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanRunningFacingRightMediumDarkSkinTone").default,
  "woman-running-facing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanRunningFacingRightMediumLightSkinTone").default,
  "woman-running-facing-right-medium-skin-tone": () =>
    require("./emojis/EmojiWomanRunningFacingRightMediumSkinTone").default,
  "woman-running-light-skin-tone": () => require("./emojis/EmojiWomanRunningLightSkinTone").default,
  "woman-running-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanRunningMediumDarkSkinTone").default,
  "woman-running-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanRunningMediumLightSkinTone").default,
  "woman-running-medium-skin-tone": () =>
    require("./emojis/EmojiWomanRunningMediumSkinTone").default,
  "woman-scientist": () => require("./emojis/EmojiWomanScientist").default,
  "woman-scientist-dark-skin-tone": () =>
    require("./emojis/EmojiWomanScientistDarkSkinTone").default,
  "woman-scientist-light-skin-tone": () =>
    require("./emojis/EmojiWomanScientistLightSkinTone").default,
  "woman-scientist-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanScientistMediumDarkSkinTone").default,
  "woman-scientist-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanScientistMediumLightSkinTone").default,
  "woman-scientist-medium-skin-tone": () =>
    require("./emojis/EmojiWomanScientistMediumSkinTone").default,
  "woman-shrugging": () => require("./emojis/EmojiWomanShrugging").default,
  "woman-shrugging-dark-skin-tone": () =>
    require("./emojis/EmojiWomanShruggingDarkSkinTone").default,
  "woman-shrugging-light-skin-tone": () =>
    require("./emojis/EmojiWomanShruggingLightSkinTone").default,
  "woman-shrugging-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanShruggingMediumDarkSkinTone").default,
  "woman-shrugging-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanShruggingMediumLightSkinTone").default,
  "woman-shrugging-medium-skin-tone": () =>
    require("./emojis/EmojiWomanShruggingMediumSkinTone").default,
  "woman-singer": () => require("./emojis/EmojiWomanSinger").default,
  "woman-singer-dark-skin-tone": () => require("./emojis/EmojiWomanSingerDarkSkinTone").default,
  "woman-singer-light-skin-tone": () => require("./emojis/EmojiWomanSingerLightSkinTone").default,
  "woman-singer-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanSingerMediumDarkSkinTone").default,
  "woman-singer-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanSingerMediumLightSkinTone").default,
  "woman-singer-medium-skin-tone": () => require("./emojis/EmojiWomanSingerMediumSkinTone").default,
  "woman-standing": () => require("./emojis/EmojiWomanStanding").default,
  "woman-standing-dark-skin-tone": () => require("./emojis/EmojiWomanStandingDarkSkinTone").default,
  "woman-standing-light-skin-tone": () =>
    require("./emojis/EmojiWomanStandingLightSkinTone").default,
  "woman-standing-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanStandingMediumDarkSkinTone").default,
  "woman-standing-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanStandingMediumLightSkinTone").default,
  "woman-standing-medium-skin-tone": () =>
    require("./emojis/EmojiWomanStandingMediumSkinTone").default,
  "woman-student": () => require("./emojis/EmojiWomanStudent").default,
  "woman-student-dark-skin-tone": () => require("./emojis/EmojiWomanStudentDarkSkinTone").default,
  "woman-student-light-skin-tone": () => require("./emojis/EmojiWomanStudentLightSkinTone").default,
  "woman-student-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanStudentMediumDarkSkinTone").default,
  "woman-student-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanStudentMediumLightSkinTone").default,
  "woman-student-medium-skin-tone": () =>
    require("./emojis/EmojiWomanStudentMediumSkinTone").default,
  "woman-superhero": () => require("./emojis/EmojiWomanSuperhero").default,
  "woman-superhero-dark-skin-tone": () =>
    require("./emojis/EmojiWomanSuperheroDarkSkinTone").default,
  "woman-superhero-light-skin-tone": () =>
    require("./emojis/EmojiWomanSuperheroLightSkinTone").default,
  "woman-superhero-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanSuperheroMediumDarkSkinTone").default,
  "woman-superhero-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanSuperheroMediumLightSkinTone").default,
  "woman-superhero-medium-skin-tone": () =>
    require("./emojis/EmojiWomanSuperheroMediumSkinTone").default,
  "woman-supervillain": () => require("./emojis/EmojiWomanSupervillain").default,
  "woman-supervillain-dark-skin-tone": () =>
    require("./emojis/EmojiWomanSupervillainDarkSkinTone").default,
  "woman-supervillain-light-skin-tone": () =>
    require("./emojis/EmojiWomanSupervillainLightSkinTone").default,
  "woman-supervillain-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanSupervillainMediumDarkSkinTone").default,
  "woman-supervillain-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanSupervillainMediumLightSkinTone").default,
  "woman-supervillain-medium-skin-tone": () =>
    require("./emojis/EmojiWomanSupervillainMediumSkinTone").default,
  "woman-surfing": () => require("./emojis/EmojiWomanSurfing").default,
  "woman-surfing-dark-skin-tone": () => require("./emojis/EmojiWomanSurfingDarkSkinTone").default,
  "woman-surfing-light-skin-tone": () => require("./emojis/EmojiWomanSurfingLightSkinTone").default,
  "woman-surfing-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanSurfingMediumDarkSkinTone").default,
  "woman-surfing-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanSurfingMediumLightSkinTone").default,
  "woman-surfing-medium-skin-tone": () =>
    require("./emojis/EmojiWomanSurfingMediumSkinTone").default,
  "woman-swimming": () => require("./emojis/EmojiWomanSwimming").default,
  "woman-swimming-dark-skin-tone": () => require("./emojis/EmojiWomanSwimmingDarkSkinTone").default,
  "woman-swimming-light-skin-tone": () =>
    require("./emojis/EmojiWomanSwimmingLightSkinTone").default,
  "woman-swimming-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanSwimmingMediumDarkSkinTone").default,
  "woman-swimming-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanSwimmingMediumLightSkinTone").default,
  "woman-swimming-medium-skin-tone": () =>
    require("./emojis/EmojiWomanSwimmingMediumSkinTone").default,
  "woman-teacher": () => require("./emojis/EmojiWomanTeacher").default,
  "woman-teacher-dark-skin-tone": () => require("./emojis/EmojiWomanTeacherDarkSkinTone").default,
  "woman-teacher-light-skin-tone": () => require("./emojis/EmojiWomanTeacherLightSkinTone").default,
  "woman-teacher-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanTeacherMediumDarkSkinTone").default,
  "woman-teacher-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanTeacherMediumLightSkinTone").default,
  "woman-teacher-medium-skin-tone": () =>
    require("./emojis/EmojiWomanTeacherMediumSkinTone").default,
  "woman-technologist": () => require("./emojis/EmojiWomanTechnologist").default,
  "woman-technologist-dark-skin-tone": () =>
    require("./emojis/EmojiWomanTechnologistDarkSkinTone").default,
  "woman-technologist-light-skin-tone": () =>
    require("./emojis/EmojiWomanTechnologistLightSkinTone").default,
  "woman-technologist-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanTechnologistMediumDarkSkinTone").default,
  "woman-technologist-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanTechnologistMediumLightSkinTone").default,
  "woman-technologist-medium-skin-tone": () =>
    require("./emojis/EmojiWomanTechnologistMediumSkinTone").default,
  "woman-tipping-hand": () => require("./emojis/EmojiWomanTippingHand").default,
  "woman-tipping-hand-dark-skin-tone": () =>
    require("./emojis/EmojiWomanTippingHandDarkSkinTone").default,
  "woman-tipping-hand-light-skin-tone": () =>
    require("./emojis/EmojiWomanTippingHandLightSkinTone").default,
  "woman-tipping-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanTippingHandMediumDarkSkinTone").default,
  "woman-tipping-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanTippingHandMediumLightSkinTone").default,
  "woman-tipping-hand-medium-skin-tone": () =>
    require("./emojis/EmojiWomanTippingHandMediumSkinTone").default,
  "woman-vampire": () => require("./emojis/EmojiWomanVampire").default,
  "woman-vampire-dark-skin-tone": () => require("./emojis/EmojiWomanVampireDarkSkinTone").default,
  "woman-vampire-light-skin-tone": () => require("./emojis/EmojiWomanVampireLightSkinTone").default,
  "woman-vampire-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanVampireMediumDarkSkinTone").default,
  "woman-vampire-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanVampireMediumLightSkinTone").default,
  "woman-vampire-medium-skin-tone": () =>
    require("./emojis/EmojiWomanVampireMediumSkinTone").default,
  "woman-walking": () => require("./emojis/EmojiWomanWalking").default,
  "woman-walking-dark-skin-tone": () => require("./emojis/EmojiWomanWalkingDarkSkinTone").default,
  "woman-walking-facing-right": () => require("./emojis/EmojiWomanWalkingFacingRight").default,
  "woman-walking-facing-right-dark-skin-tone": () =>
    require("./emojis/EmojiWomanWalkingFacingRightDarkSkinTone").default,
  "woman-walking-facing-right-light-skin-tone": () =>
    require("./emojis/EmojiWomanWalkingFacingRightLightSkinTone").default,
  "woman-walking-facing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanWalkingFacingRightMediumDarkSkinTone").default,
  "woman-walking-facing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanWalkingFacingRightMediumLightSkinTone").default,
  "woman-walking-facing-right-medium-skin-tone": () =>
    require("./emojis/EmojiWomanWalkingFacingRightMediumSkinTone").default,
  "woman-walking-light-skin-tone": () => require("./emojis/EmojiWomanWalkingLightSkinTone").default,
  "woman-walking-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanWalkingMediumDarkSkinTone").default,
  "woman-walking-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanWalkingMediumLightSkinTone").default,
  "woman-walking-medium-skin-tone": () =>
    require("./emojis/EmojiWomanWalkingMediumSkinTone").default,
  "woman-wearing-turban": () => require("./emojis/EmojiWomanWearingTurban").default,
  "woman-wearing-turban-dark-skin-tone": () =>
    require("./emojis/EmojiWomanWearingTurbanDarkSkinTone").default,
  "woman-wearing-turban-light-skin-tone": () =>
    require("./emojis/EmojiWomanWearingTurbanLightSkinTone").default,
  "woman-wearing-turban-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanWearingTurbanMediumDarkSkinTone").default,
  "woman-wearing-turban-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanWearingTurbanMediumLightSkinTone").default,
  "woman-wearing-turban-medium-skin-tone": () =>
    require("./emojis/EmojiWomanWearingTurbanMediumSkinTone").default,
  "woman-white-hair": () => require("./emojis/EmojiWomanWhiteHair").default,
  "woman-with-headscarf": () => require("./emojis/EmojiWomanWithHeadscarf").default,
  "woman-with-headscarf-dark-skin-tone": () =>
    require("./emojis/EmojiWomanWithHeadscarfDarkSkinTone").default,
  "woman-with-headscarf-light-skin-tone": () =>
    require("./emojis/EmojiWomanWithHeadscarfLightSkinTone").default,
  "woman-with-headscarf-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanWithHeadscarfMediumDarkSkinTone").default,
  "woman-with-headscarf-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanWithHeadscarfMediumLightSkinTone").default,
  "woman-with-headscarf-medium-skin-tone": () =>
    require("./emojis/EmojiWomanWithHeadscarfMediumSkinTone").default,
  "woman-with-veil": () => require("./emojis/EmojiWomanWithVeil").default,
  "woman-with-veil-dark-skin-tone": () =>
    require("./emojis/EmojiWomanWithVeilDarkSkinTone").default,
  "woman-with-veil-light-skin-tone": () =>
    require("./emojis/EmojiWomanWithVeilLightSkinTone").default,
  "woman-with-veil-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanWithVeilMediumDarkSkinTone").default,
  "woman-with-veil-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanWithVeilMediumLightSkinTone").default,
  "woman-with-veil-medium-skin-tone": () =>
    require("./emojis/EmojiWomanWithVeilMediumSkinTone").default,
  "woman-with-white-cane": () => require("./emojis/EmojiWomanWithWhiteCane").default,
  "woman-with-white-cane-dark-skin-tone": () =>
    require("./emojis/EmojiWomanWithWhiteCaneDarkSkinTone").default,
  "woman-with-white-cane-facing-right": () =>
    require("./emojis/EmojiWomanWithWhiteCaneFacingRight").default,
  "woman-with-white-cane-facing-right-dark-skin-tone": () =>
    require("./emojis/EmojiWomanWithWhiteCaneFacingRightDarkSkinTone").default,
  "woman-with-white-cane-facing-right-light-skin-tone": () =>
    require("./emojis/EmojiWomanWithWhiteCaneFacingRightLightSkinTone").default,
  "woman-with-white-cane-facing-right-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanWithWhiteCaneFacingRightMediumDarkSkinTone").default,
  "woman-with-white-cane-facing-right-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanWithWhiteCaneFacingRightMediumLightSkinTone").default,
  "woman-with-white-cane-facing-right-medium-skin-tone": () =>
    require("./emojis/EmojiWomanWithWhiteCaneFacingRightMediumSkinTone").default,
  "woman-with-white-cane-light-skin-tone": () =>
    require("./emojis/EmojiWomanWithWhiteCaneLightSkinTone").default,
  "woman-with-white-cane-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomanWithWhiteCaneMediumDarkSkinTone").default,
  "woman-with-white-cane-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomanWithWhiteCaneMediumLightSkinTone").default,
  "woman-with-white-cane-medium-skin-tone": () =>
    require("./emojis/EmojiWomanWithWhiteCaneMediumSkinTone").default,
  "woman-zombie": () => require("./emojis/EmojiWomanZombie").default,
  "womans-boot": () => require("./emojis/EmojiWomansBoot").default,
  "womans-clothes": () => require("./emojis/EmojiWomansClothes").default,
  "womans-hat": () => require("./emojis/EmojiWomansHat").default,
  "womans-sandal": () => require("./emojis/EmojiWomansSandal").default,
  "women-holding-hands": () => require("./emojis/EmojiWomenHoldingHands").default,
  "women-holding-hands-dark-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsDarkSkinTone").default,
  "women-holding-hands-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsDarkSkinToneLightSkinTone").default,
  "women-holding-hands-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsDarkSkinToneMediumDarkSkinTone").default,
  "women-holding-hands-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsDarkSkinToneMediumLightSkinTone").default,
  "women-holding-hands-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsDarkSkinToneMediumSkinTone").default,
  "women-holding-hands-light-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsLightSkinTone").default,
  "women-holding-hands-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsLightSkinToneDarkSkinTone").default,
  "women-holding-hands-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsLightSkinToneMediumDarkSkinTone").default,
  "women-holding-hands-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsLightSkinToneMediumLightSkinTone").default,
  "women-holding-hands-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsLightSkinToneMediumSkinTone").default,
  "women-holding-hands-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsMediumDarkSkinTone").default,
  "women-holding-hands-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsMediumDarkSkinToneDarkSkinTone").default,
  "women-holding-hands-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsMediumDarkSkinToneLightSkinTone").default,
  "women-holding-hands-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsMediumDarkSkinToneMediumLightSkinTone").default,
  "women-holding-hands-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsMediumDarkSkinToneMediumSkinTone").default,
  "women-holding-hands-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsMediumLightSkinTone").default,
  "women-holding-hands-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsMediumLightSkinToneDarkSkinTone").default,
  "women-holding-hands-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsMediumLightSkinToneLightSkinTone").default,
  "women-holding-hands-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsMediumLightSkinToneMediumDarkSkinTone").default,
  "women-holding-hands-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsMediumLightSkinToneMediumSkinTone").default,
  "women-holding-hands-medium-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsMediumSkinTone").default,
  "women-holding-hands-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsMediumSkinToneDarkSkinTone").default,
  "women-holding-hands-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsMediumSkinToneLightSkinTone").default,
  "women-holding-hands-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsMediumSkinToneMediumDarkSkinTone").default,
  "women-holding-hands-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomenHoldingHandsMediumSkinToneMediumLightSkinTone").default,
  "women-with-bunny-ears": () => require("./emojis/EmojiWomenWithBunnyEars").default,
  "women-with-bunny-ears-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsDarkSkinTone").default,
  "women-with-bunny-ears-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsDarkSkinToneLightSkinTone").default,
  "women-with-bunny-ears-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsDarkSkinToneMediumDarkSkinTone").default,
  "women-with-bunny-ears-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsDarkSkinToneMediumLightSkinTone").default,
  "women-with-bunny-ears-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsDarkSkinToneMediumSkinTone").default,
  "women-with-bunny-ears-light-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsLightSkinTone").default,
  "women-with-bunny-ears-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsLightSkinToneDarkSkinTone").default,
  "women-with-bunny-ears-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsLightSkinToneMediumDarkSkinTone").default,
  "women-with-bunny-ears-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsLightSkinToneMediumLightSkinTone").default,
  "women-with-bunny-ears-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsLightSkinToneMediumSkinTone").default,
  "women-with-bunny-ears-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsMediumDarkSkinTone").default,
  "women-with-bunny-ears-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsMediumDarkSkinToneDarkSkinTone").default,
  "women-with-bunny-ears-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsMediumDarkSkinToneLightSkinTone").default,
  "women-with-bunny-ears-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsMediumDarkSkinToneMediumLightSkinTone").default,
  "women-with-bunny-ears-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsMediumDarkSkinToneMediumSkinTone").default,
  "women-with-bunny-ears-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsMediumLightSkinTone").default,
  "women-with-bunny-ears-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsMediumLightSkinToneDarkSkinTone").default,
  "women-with-bunny-ears-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsMediumLightSkinToneLightSkinTone").default,
  "women-with-bunny-ears-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsMediumLightSkinToneMediumDarkSkinTone").default,
  "women-with-bunny-ears-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsMediumLightSkinToneMediumSkinTone").default,
  "women-with-bunny-ears-medium-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsMediumSkinTone").default,
  "women-with-bunny-ears-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsMediumSkinToneDarkSkinTone").default,
  "women-with-bunny-ears-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsMediumSkinToneLightSkinTone").default,
  "women-with-bunny-ears-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsMediumSkinToneMediumDarkSkinTone").default,
  "women-with-bunny-ears-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomenWithBunnyEarsMediumSkinToneMediumLightSkinTone").default,
  "women-wrestling": () => require("./emojis/EmojiWomenWrestling").default,
  "women-wrestling-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingDarkSkinTone").default,
  "women-wrestling-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingDarkSkinToneLightSkinTone").default,
  "women-wrestling-dark-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingDarkSkinToneMediumDarkSkinTone").default,
  "women-wrestling-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingDarkSkinToneMediumLightSkinTone").default,
  "women-wrestling-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingDarkSkinToneMediumSkinTone").default,
  "women-wrestling-light-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingLightSkinTone").default,
  "women-wrestling-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingLightSkinToneDarkSkinTone").default,
  "women-wrestling-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingLightSkinToneMediumDarkSkinTone").default,
  "women-wrestling-light-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingLightSkinToneMediumLightSkinTone").default,
  "women-wrestling-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingLightSkinToneMediumSkinTone").default,
  "women-wrestling-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingMediumDarkSkinTone").default,
  "women-wrestling-medium-dark-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingMediumDarkSkinToneDarkSkinTone").default,
  "women-wrestling-medium-dark-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingMediumDarkSkinToneLightSkinTone").default,
  "women-wrestling-medium-dark-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingMediumDarkSkinToneMediumLightSkinTone").default,
  "women-wrestling-medium-dark-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingMediumDarkSkinToneMediumSkinTone").default,
  "women-wrestling-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingMediumLightSkinTone").default,
  "women-wrestling-medium-light-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingMediumLightSkinToneDarkSkinTone").default,
  "women-wrestling-medium-light-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingMediumLightSkinToneLightSkinTone").default,
  "women-wrestling-medium-light-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingMediumLightSkinToneMediumDarkSkinTone").default,
  "women-wrestling-medium-light-skin-tone-medium-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingMediumLightSkinToneMediumSkinTone").default,
  "women-wrestling-medium-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingMediumSkinTone").default,
  "women-wrestling-medium-skin-tone-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingMediumSkinToneDarkSkinTone").default,
  "women-wrestling-medium-skin-tone-light-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingMediumSkinToneLightSkinTone").default,
  "women-wrestling-medium-skin-tone-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingMediumSkinToneMediumDarkSkinTone").default,
  "women-wrestling-medium-skin-tone-medium-light-skin-tone": () =>
    require("./emojis/EmojiWomenWrestlingMediumSkinToneMediumLightSkinTone").default,
  "womens-room": () => require("./emojis/EmojiWomensRoom").default,
  wood: () => require("./emojis/EmojiWood").default,
  "woozy-face": () => require("./emojis/EmojiWoozyFace").default,
  "world-map": () => require("./emojis/EmojiWorldMap").default,
  worm: () => require("./emojis/EmojiWorm").default,
  "worried-face": () => require("./emojis/EmojiWorriedFace").default,
  "wrapped-gift": () => require("./emojis/EmojiWrappedGift").default,
  wrench: () => require("./emojis/EmojiWrench").default,
  "writing-hand": () => require("./emojis/EmojiWritingHand").default,
  "writing-hand-dark-skin-tone": () => require("./emojis/EmojiWritingHandDarkSkinTone").default,
  "writing-hand-light-skin-tone": () => require("./emojis/EmojiWritingHandLightSkinTone").default,
  "writing-hand-medium-dark-skin-tone": () =>
    require("./emojis/EmojiWritingHandMediumDarkSkinTone").default,
  "writing-hand-medium-light-skin-tone": () =>
    require("./emojis/EmojiWritingHandMediumLightSkinTone").default,
  "writing-hand-medium-skin-tone": () => require("./emojis/EmojiWritingHandMediumSkinTone").default,
  "x-ray": () => require("./emojis/EmojiXRay").default,
  yarn: () => require("./emojis/EmojiYarn").default,
  "yawning-face": () => require("./emojis/EmojiYawningFace").default,
  "yellow-circle": () => require("./emojis/EmojiYellowCircle").default,
  "yellow-heart": () => require("./emojis/EmojiYellowHeart").default,
  "yellow-square": () => require("./emojis/EmojiYellowSquare").default,
  "yen-banknote": () => require("./emojis/EmojiYenBanknote").default,
  "yin-yang": () => require("./emojis/EmojiYinYang").default,
  "yo-yo": () => require("./emojis/EmojiYoYo").default,
  "zany-face": () => require("./emojis/EmojiZanyFace").default,
  zebra: () => require("./emojis/EmojiZebra").default,
  "zipper-mouth-face": () => require("./emojis/EmojiZipperMouthFace").default,
  zombie: () => require("./emojis/EmojiZombie").default,
  zzz: () => require("./emojis/EmojiZzz").default,
} satisfies Record<string, EmojiLoader>;

export type EmojiName = keyof typeof emojiRegistry;
