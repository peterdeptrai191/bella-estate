// Tệp sinh tự động bởi `npm run build:api` từ src/online/. Đừng sửa tay.

// src/online/vercel.ts
import { randomInt } from "node:crypto";

// src/config/economy.ts
var ECONOMY = {
  /** Tiền mỗi người khi bắt đầu ván. */
  startingMoney: 1500,
  /** Thưởng mỗi lần đi qua (hoặc dừng đúng) ô Xuất Phát. */
  passStartBonus: 200,
  dice: {
    /** Số lần tung đôi liên tiếp thì bị đưa ra Đảo Hoang. */
    maxConsecutiveDoubles: 3
  },
  island: {
    /** Số lượt tối đa bị kẹt ở Đảo Hoang. */
    maxTurns: 3,
    /** Phí trả để thoát đảo. */
    escapeFee: 100
  },
  airport: {
    /** Phí bay từ Sân Bay tới ô bất kỳ. */
    flightFee: 100
  },
  /** Ô Thuế: nộp tỷ lệ này trên tổng tài sản (tiền mặt + giá trị đã đầu tư). */
  taxRate: 0.1,
  /** Hết số vòng này thì người có tổng tài sản cao nhất thắng. */
  maxRounds: 30,
  /** Giới hạn thời gian mỗi lượt (UI/server dùng, game-core không đếm giờ). */
  turnTimeLimitSec: 20,
  /** Giá đất P theo nhóm màu. */
  groupPrices: {
    brown: 60,
    lightBlue: 100,
    pink: 140,
    orange: 180,
    red: 220,
    yellow: 260,
    darkBlue: 320
  },
  city: {
    /** Số nhà tối đa trước khi lên Landmark. Cấp độ: 0 = đất trống, 1–3 = nhà, 4 = Landmark. */
    maxHouses: 3,
    /** Chi phí để đạt mỗi cấp, tính theo P. Cấp 0 = giá mua đất. */
    buildCostRatio: [1, 0.5, 0.5, 0.5, 1],
    /** Tiền thuê ở mỗi cấp, tính theo P. */
    rentRatio: [0.2, 0.6, 1.2, 2, 3]
  },
  resort: {
    /** Giá mua một Khu Du Lịch. */
    price: 200,
    /** Tiền thuê theo số Khu Du Lịch chủ sở hữu đang có (index = số khu). */
    rentByCount: [0, 50, 100, 200, 400]
  },
  /** Sở hữu trọn nhóm màu: tiền thuê x hệ số này. */
  colorGroupRentMultiplier: 2,
  /** Thành phố đang tổ chức Lễ Hội: tiền thuê x hệ số này. */
  festivalRentMultiplier: 2,
  /** Giá mua lại = hệ số này x tổng giá trị đã đầu tư. */
  buyoutMultiplier: 2,
  /** Bán cho ngân hàng được tỷ lệ này trên giá trị đã đầu tư. */
  bankSellRatio: 0.5,
  cards: {
    /** Thẻ Giảm Giá: lần trả tiền thuê tiếp theo nhân hệ số này. */
    rentDiscountRatio: 0.5,
    /** Thẻ Trúng Xổ Số. */
    lotteryPrize: 200,
    /** Thẻ Từ Thiện: trả cho mỗi người chơi khác. */
    charityPerPlayer: 50,
    /** Thẻ Thuế Bất Ngờ: nộp cho mỗi căn nhà. */
    surpriseTaxPerHouse: 100
  },
  win: {
    /** Số nhóm màu độc quyền để thắng ngay. */
    colorGroupsToWin: 3
  }
};

// src/config/board.ts
var COLOR_GROUPS = [
  { id: "brown", name: "Ch\xE2u Phi", color: "#C9A27E", premium: false },
  { id: "lightBlue", name: "\u0110\xF4ng Nam \xC1", color: "#8FD3E8", premium: false },
  { id: "pink", name: "Nam M\u1EF9", color: "#F4A7C0", premium: false },
  { id: "orange", name: "Trung \u0110\xF4ng", color: "#F7B267", premium: false },
  { id: "red", name: "\u0110\xF4ng \xC1", color: "#EF6F6C", premium: false },
  { id: "yellow", name: "Ch\xE2u \xC2u", color: "#F9D56E", premium: false },
  { id: "darkBlue", name: "Bi\u1EC3u t\u01B0\u1EE3ng to\xE0n c\u1EA7u", color: "#5B7FDB", premium: true }
];
var BOARD_SIZE = 32;
var TILES_PER_SIDE = 8;
var CHANCE = { slot: "CHANCE", name: "C\u01A1 H\u1ED9i", description: "R\xFAt m\u1ED9t th\u1EBB, may hay r\u1EE7i t\xF9y b\u1EA1n!" };
var CONTENT = [
  // Cạnh 0: ô 0–7
  { slot: "START", name: "Xu\u1EA5t Ph\xE1t", description: "M\u1ED7i l\u1EA7n \u0111i qua nh\u1EADn 200. D\u1EEBng \u0111\xFAng \xF4: \u0111\u01B0\u1EE3c x\xE2y mi\u1EC5n ph\xED 1 nh\xE0" },
  { slot: "brown", name: "Cairo", landmark: "Kim T\u1EF1 Th\xE1p Giza", description: "Th\xE0nh ph\u1ED1 ng\xE0n n\u0103m b\xEAn d\xF2ng s\xF4ng Nile" },
  { slot: "brown", name: "Nairobi", landmark: "C\xF4ng vi\xEAn Safari", description: "Th\u1EE7 \u0111\xF4 c\u1EE7a th\u1EBF gi\u1EDBi hoang d\xE3" },
  CHANCE,
  { slot: "brown", name: "Cape Town", landmark: "N\xFAi B\xE0n", description: "N\u01A1i hai \u0111\u1EA1i d\u01B0\u01A1ng g\u1EB7p nhau" },
  { slot: "RESORT", name: "V\u1ECBnh H\u1EA1 Long", description: "K\u1EF3 quan thi\xEAn nhi\xEAn v\u1EDBi h\xE0ng ngh\xECn \u0111\u1EA3o \u0111\xE1" },
  { slot: "lightBlue", name: "Jakarta", landmark: "\u0110\xE0i t\u01B0\u1EDFng ni\u1EC7m Monas", description: "\u0110\xF4 th\u1ECB s\xF4i \u0111\u1ED9ng c\u1EE7a v\u1EA1n \u0111\u1EA3o" },
  { slot: "lightBlue", name: "Bangkok", landmark: "Ch\xF9a Wat Arun", description: "Th\xE0nh ph\u1ED1 c\u1EE7a nh\u1EEFng ng\xF4i ch\xF9a v\xE0ng" },
  // Cạnh 1: ô 8–15
  { slot: "ISLAND", name: "\u0110\u1EA3o Hoang", description: "B\u1ECB k\u1EB9t t\u1ED1i \u0111a 3 l\u01B0\u1EE3t. Tung \u0111\xF4i, tr\u1EA3 100 ho\u1EB7c d\xF9ng th\u1EBB \u0111\u1EC3 tho\xE1t" },
  { slot: "lightBlue", name: "H\xE0 N\u1ED9i", landmark: "Th\xE1p R\xF9a \u2013 H\u1ED3 G\u01B0\u01A1m", description: "Ngh\xECn n\u0103m v\u0103n hi\u1EBFn" },
  { slot: "pink", name: "Lima", landmark: "Qu\u1EA3ng tr\u01B0\u1EDDng Plaza Mayor", description: "Kinh \u0111\xF4 \u1EA9m th\u1EF1c Nam M\u1EF9" },
  { slot: "pink", name: "Buenos Aires", landmark: "\u0110\xE0i Obelisco", description: "Th\u1EE7 ph\u1EE7 c\u1EE7a \u0111i\u1EC7u tango" },
  { slot: "RESORT", name: "Maldives", description: "Thi\xEAn \u0111\u01B0\u1EDDng bi\u1EC3n xanh v\xE0 nh\xE0 g\u1ED7 tr\xEAn m\u1EB7t n\u01B0\u1EDBc" },
  { slot: "pink", name: "Rio de Janeiro", landmark: "T\u01B0\u1EE3ng Ch\xFAa C\u1EE9u Th\u1EBF", description: "Th\xE0nh ph\u1ED1 c\u1EE7a l\u1EC5 h\u1ED9i Carnival" },
  CHANCE,
  { slot: "orange", name: "Doha", landmark: "B\u1EA3o t\xE0ng Ngh\u1EC7 thu\u1EADt H\u1ED3i gi\xE1o", description: "Vi\xEAn ng\u1ECDc b\xEAn v\u1ECBnh Ba T\u01B0" },
  // Cạnh 2: ô 16–23
  { slot: "FESTIVAL", name: "L\u1EC5 H\u1ED9i Th\u1EBF Gi\u1EDBi", description: "Ch\u1ECDn m\u1ED9t th\xE0nh ph\u1ED1 c\u1EE7a b\u1EA1n, ti\u1EC1n thu\xEA x2" },
  { slot: "orange", name: "Istanbul", landmark: "Hagia Sophia", description: "N\u01A1i giao thoa \xC1 \u2013 \xC2u" },
  { slot: "orange", name: "Dubai", landmark: "Th\xE1p Burj Khalifa", description: "Th\xE0nh ph\u1ED1 c\u1EE7a nh\u1EEFng k\u1EF7 l\u1EE5c" },
  { slot: "red", name: "Th\u01B0\u1EE3ng H\u1EA3i", landmark: "Th\xE1p Minh Ch\xE2u Ph\u01B0\u01A1ng \u0110\xF4ng", description: "Trung t\xE2m t\xE0i ch\xEDnh ph\u01B0\u01A1ng \u0110\xF4ng" },
  { slot: "RESORT", name: "Santorini", description: "Nh\u1EEFng m\xE1i v\xF2m tr\u1EAFng xanh b\xEAn bi\u1EC3n Aegean" },
  { slot: "red", name: "Seoul", landmark: "Th\xE1p N Seoul", description: "Th\u1EE7 \u0111\xF4 c\u1EE7a l\xE0n s\xF3ng Hallyu" },
  CHANCE,
  { slot: "red", name: "Tokyo", landmark: "Th\xE1p Tokyo", description: "N\u01A1i truy\u1EC1n th\u1ED1ng g\u1EB7p t\u01B0\u01A1ng lai" },
  // Cạnh 3: ô 24–31
  { slot: "AIRPORT", name: "S\xE2n Bay Qu\u1ED1c T\u1EBF", description: "L\u01B0\u1EE3t sau bay t\u1EDBi b\u1EA5t k\u1EF3 \xF4 n\xE0o v\u1EDBi gi\xE1 100" },
  { slot: "yellow", name: "Rome", landmark: "\u0110\u1EA5u tr\u01B0\u1EDDng Colosseum", description: "Th\xE0nh ph\u1ED1 v\u0129nh c\u1EEDu" },
  { slot: "yellow", name: "Berlin", landmark: "C\u1ED5ng Brandenburg", description: "Tr\xE1i tim c\u1EE7a ch\xE2u \xC2u hi\u1EC7n \u0111\u1EA1i" },
  { slot: "yellow", name: "Paris", landmark: "Th\xE1p Eiffel", description: "Kinh \u0111\xF4 \xE1nh s\xE1ng" },
  { slot: "RESORT", name: "Hawaii", description: "S\xF3ng, n\xFAi l\u1EEDa v\xE0 n\u1EAFng nhi\u1EC7t \u0111\u1EDBi" },
  { slot: "darkBlue", name: "London", landmark: "Th\xE1p \u0111\u1ED3ng h\u1ED3 Big Ben", description: "Th\u1EE7 \u0111\xF4 t\xE0i ch\xEDnh l\xE2u \u0111\u1EDDi nh\u1EA5t" },
  { slot: "TAX", name: "Thu\u1EBF T\xE0i S\u1EA3n", description: "N\u1ED9p 10% t\u1ED5ng t\xE0i s\u1EA3n" },
  { slot: "darkBlue", name: "New York", landmark: "T\u01B0\u1EE3ng N\u1EEF th\u1EA7n T\u1EF1 do", description: "Th\xE0nh ph\u1ED1 kh\xF4ng bao gi\u1EDD ng\u1EE7" }
];
var SPECIAL_KINDS = ["START", "ISLAND", "FESTIVAL", "AIRPORT", "CHANCE", "TAX"];
function isSpecial(slot) {
  return SPECIAL_KINDS.includes(slot);
}
function buildBoard() {
  return CONTENT.map((c, index) => {
    const base = {
      index,
      name: c.name,
      description: c.description,
      landmark: c.landmark ?? null,
      side: Math.floor(index / TILES_PER_SIDE),
      sideIndex: index % TILES_PER_SIDE
    };
    if (isSpecial(c.slot)) return { ...base, kind: c.slot, group: null, price: null };
    if (c.slot === "RESORT") return { ...base, kind: "RESORT", group: null, price: ECONOMY.resort.price };
    return { ...base, kind: "CITY", group: c.slot, price: ECONOMY.groupPrices[c.slot] };
  });
}
var BOARD = buildBoard();

// src/game-core/rng.ts
function nextRandom(rngState) {
  const next = rngState + 1831565813 | 0;
  let r = Math.imul(next ^ next >>> 15, 1 | next);
  r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r;
  const value = ((r ^ r >>> 14) >>> 0) / 4294967296;
  return [value, next];
}
function seedToRngState(seed) {
  if (typeof seed === "number") return seed | 0;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return h | 0;
}
function toDie(value) {
  return Math.floor(value * 6) + 1;
}

// src/game-core/context.ts
var GameRuleError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "GameRuleError";
  }
};
function emit(ctx, event) {
  ctx.events.push(event);
}
function random(ctx) {
  const [value, next] = nextRandom(ctx.s.rngState);
  ctx.s.rngState = next;
  return value;
}
function rollDie(ctx) {
  return toDie(random(ctx));
}
function currentPlayer(s) {
  return s.players[s.currentPlayerIndex];
}
function playerById(s, id) {
  const player = s.players.find((p) => p.id === id);
  if (!player) throw new GameRuleError(`Kh\xF4ng c\xF3 ng\u01B0\u1EDDi ch\u01A1i ${id}`);
  return player;
}
function ensure(condition, message) {
  if (!condition) throw new GameRuleError(message);
}

// src/game-core/board.ts
function indexOfKind(kind) {
  const i = BOARD.findIndex((t) => t.kind === kind);
  if (i < 0) throw new Error(`B\xE0n c\u1EDD thi\u1EBFu \xF4 ${kind}`);
  return i;
}
var START_INDEX = indexOfKind("START");
var ISLAND_INDEX = indexOfKind("ISLAND");
var FESTIVAL_INDEX = indexOfKind("FESTIVAL");
var AIRPORT_INDEX = indexOfKind("AIRPORT");
var LANDMARK_LEVEL = ECONOMY.city.maxHouses + 1;
var CITY_INDICES = BOARD.filter((t) => t.kind === "CITY").map((t) => t.index);
var RESORT_INDICES = BOARD.filter((t) => t.kind === "RESORT").map((t) => t.index);
function isValidTileIndex(i) {
  return Number.isInteger(i) && i >= 0 && i < BOARD_SIZE;
}
function tileDef(i) {
  const def = BOARD[i];
  if (!def) throw new Error(`\xD4 ${i} kh\xF4ng t\u1ED3n t\u1EA1i`);
  return def;
}
function isPurchasable(i) {
  const kind = tileDef(i).kind;
  return kind === "CITY" || kind === "RESORT";
}
function groupTiles(group) {
  return BOARD.filter((t) => t.group === group).map((t) => t.index);
}
function sidePurchasableTiles(side) {
  return BOARD.filter((t) => t.side === side && isPurchasable(t.index)).map((t) => t.index);
}
var SIDES = [0, 1, 2, 3];

// src/game-core/valuation.ts
function landPrice(i) {
  const price = tileDef(i).price;
  if (price === null) throw new Error(`\xD4 ${i} kh\xF4ng mua \u0111\u01B0\u1EE3c`);
  return price;
}
function buildCost(i, level) {
  return Math.round(landPrice(i) * ECONOMY.city.buildCostRatio[level]);
}
function investedValue(s, i) {
  const tile = s.tiles[i];
  if (!tile.owner) return 0;
  if (tileDef(i).kind === "RESORT") return landPrice(i);
  let total = 0;
  for (let level = 0; level <= tile.level; level++) {
    total += Math.round(landPrice(i) * ECONOMY.city.buildCostRatio[level]);
  }
  return total;
}
function sellValue(s, i) {
  return Math.floor(investedValue(s, i) * ECONOMY.bankSellRatio);
}
function buyoutPrice(s, i) {
  return investedValue(s, i) * ECONOMY.buyoutMultiplier;
}
function ownedTiles(s, playerId) {
  return s.tiles.flatMap((t, i) => t.owner === playerId ? [i] : []);
}
function ownsWholeGroup(s, playerId, group) {
  return groupTiles(group).every((i) => s.tiles[i].owner === playerId);
}
function completedGroups(s, playerId) {
  return COLOR_GROUPS.map((g) => g.id).filter((g) => ownsWholeGroup(s, playerId, g));
}
function resortCount(s, playerId) {
  return RESORT_INDICES.filter((i) => s.tiles[i].owner === playerId).length;
}
function rentFor(s, i) {
  const tile = s.tiles[i];
  if (!tile.owner) return 0;
  const def = tileDef(i);
  if (def.kind === "RESORT") return ECONOMY.resort.rentByCount[resortCount(s, tile.owner)];
  let rent = Math.round(landPrice(i) * ECONOMY.city.rentRatio[tile.level]);
  if (def.group && ownsWholeGroup(s, tile.owner, def.group)) rent *= ECONOMY.colorGroupRentMultiplier;
  if (s.festivalTile === i) rent *= ECONOMY.festivalRentMultiplier;
  return rent;
}
function housesOwned(s, playerId) {
  return CITY_INDICES.filter((i) => s.tiles[i].owner === playerId).reduce(
    (sum, i) => sum + Math.min(s.tiles[i].level, ECONOMY.city.maxHouses),
    0
  );
}
function liquidationValue(s, playerId) {
  return ownedTiles(s, playerId).reduce((sum, i) => sum + sellValue(s, i), 0);
}
function netWorth(s, playerId) {
  const player = s.players.find((p) => p.id === playerId);
  if (!player) throw new Error(`Kh\xF4ng c\xF3 ng\u01B0\u1EDDi ch\u01A1i ${playerId}`);
  return player.money + ownedTiles(s, playerId).reduce((sum, i) => sum + investedValue(s, i), 0);
}
function standings(s) {
  return s.players.map((p) => ({ playerId: p.id, netWorth: netWorth(s, p.id), money: p.money, bankrupt: p.bankrupt })).sort(
    (a2, b) => Number(a2.bankrupt) - Number(b.bankrupt) || b.netWorth - a2.netWorth || b.money - a2.money
  );
}

// src/game-core/turn.ts
function freshTurn() {
  return {
    step: "ROLL",
    dice: null,
    doublesCount: 0,
    extraRoll: false,
    pending: null,
    buildTile: null,
    acquiredTile: null,
    buyoutTile: null,
    freeHouse: false,
    festivalChoice: false
  };
}
function finishGame(ctx, winner, reason) {
  const s = ctx.s;
  s.phase = "finished";
  s.winner = winner;
  s.winReason = reason;
  emit(ctx, { type: "GAME_OVER", winner, reason, standings: standings(s) });
}
function advanceTurn(ctx) {
  const s = ctx.s;
  let i = s.currentPlayerIndex;
  let wrapped = false;
  do {
    i++;
    if (i >= s.players.length) {
      i = 0;
      wrapped = true;
    }
  } while (s.players[i].bankrupt);
  if (wrapped) s.round++;
  if (s.round > ECONOMY.maxRounds) {
    s.round = ECONOMY.maxRounds;
    finishGame(ctx, standings(s)[0].playerId, "ROUND_LIMIT");
    return;
  }
  s.currentPlayerIndex = i;
  s.turn = freshTurn();
  emit(ctx, { type: "TURN_STARTED", playerId: s.players[i].id, round: s.round });
}

// src/game-core/game.ts
var MIN_PLAYERS = 2;
var MAX_PLAYERS = 4;
function createGame(players, seed) {
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    throw new Error(`C\u1EA7n ${MIN_PLAYERS}\u2013${MAX_PLAYERS} ng\u01B0\u1EDDi ch\u01A1i`);
  }
  return {
    phase: "playing",
    players: players.map((p, i) => ({
      id: `p${i + 1}`,
      name: p.name,
      isBot: p.isBot ?? false,
      money: ECONOMY.startingMoney,
      position: 0,
      bankrupt: false,
      islandTurnsLeft: 0,
      heldCards: [],
      rentDiscount: false,
      airportTicket: false
    })),
    tiles: Array.from({ length: BOARD_SIZE }, () => ({ owner: null, level: 0 })),
    currentPlayerIndex: 0,
    round: 1,
    festivalTile: null,
    rngState: seedToRngState(seed),
    turn: freshTurn(),
    winner: null,
    winReason: null
  };
}

// src/config/cards.ts
var CARD_IDS = [
  "ESCAPE_ISLAND",
  "DISCOUNT",
  "SHIELD",
  "GO_TO_START",
  "GO_TO_FESTIVAL",
  "EARTHQUAKE",
  "GO_TO_ISLAND",
  "SURPRISE_TAX",
  "CHARITY",
  "LOTTERY"
];

// src/game-core/money.ts
function payAll(ctx, payments, reason, tileIndex, discounted) {
  const payer = currentPlayer(ctx.s);
  for (const { to, amount } of payments) {
    payer.money -= amount;
    if (to) playerById(ctx.s, to).money += amount;
    if (reason === "RENT") {
      if (!to || tileIndex === null) throw new Error("Ti\u1EC1n thu\xEA ph\u1EA3i c\xF3 ng\u01B0\u1EDDi nh\u1EADn v\xE0 \xF4");
      emit(ctx, { type: "RENT_PAID", from: payer.id, to, tileIndex, amount, discounted });
    } else {
      emit(ctx, { type: "MONEY_PAID", from: payer.id, to, amount, reason });
    }
  }
}
function charge(ctx, payments, reason, tileIndex = null, discounted = false) {
  const due = payments.filter((p) => p.amount > 0);
  const total = due.reduce((sum, p) => sum + p.amount, 0);
  if (total === 0) return "PAID";
  const payer = currentPlayer(ctx.s);
  if (payer.money >= total) {
    payAll(ctx, due, reason, tileIndex, discounted);
    return "PAID";
  }
  if (payer.money + liquidationValue(ctx.s, payer.id) >= total) {
    ctx.s.turn.pending = { type: "DEBT", reason, payments: due, tileIndex, discounted };
    emit(ctx, { type: "DEBT_STARTED", playerId: payer.id, amount: total, reason });
    return "DEBT";
  }
  declareBankruptcy(ctx, due);
  return "BANKRUPT";
}
function afterRent(ctx, tileIndex) {
  if (ctx.s.tiles[tileIndex].level < LANDMARK_LEVEL) ctx.s.turn.buyoutTile = tileIndex;
}
function settleDebtIfPossible(ctx) {
  const pending = ctx.s.turn.pending;
  if (pending?.type !== "DEBT") return;
  const total = pending.payments.reduce((sum, p) => sum + p.amount, 0);
  if (currentPlayer(ctx.s).money < total) return;
  ctx.s.turn.pending = null;
  payAll(ctx, pending.payments, pending.reason, pending.tileIndex, pending.discounted);
  if (pending.reason === "RENT" && pending.tileIndex !== null) afterRent(ctx, pending.tileIndex);
}
function declareBankruptcy(ctx, payments) {
  const s = ctx.s;
  const player = currentPlayer(s);
  const released = ownedTiles(s, player.id);
  for (const i of released) {
    player.money += sellValue(s, i);
    s.tiles[i] = { owner: null, level: 0 };
    if (s.festivalTile === i) s.festivalTile = null;
  }
  for (const { to, amount } of payments) {
    const paid = Math.min(amount, player.money);
    if (paid <= 0) break;
    player.money -= paid;
    if (to) playerById(s, to).money += paid;
    emit(ctx, { type: "MONEY_PAID", from: player.id, to, amount: paid, reason: "BANKRUPTCY" });
  }
  player.money = 0;
  player.bankrupt = true;
  player.heldCards = [];
  player.rentDiscount = false;
  player.airportTicket = false;
  player.islandTurnsLeft = 0;
  s.turn.pending = null;
  emit(ctx, { type: "BANKRUPT", playerId: player.id, releasedTiles: released });
  const survivors = s.players.filter((p) => !p.bankrupt);
  if (survivors.length === 1) {
    finishGame(ctx, survivors[0].id, "LAST_SURVIVOR");
    return;
  }
  advanceTurn(ctx);
}

// src/game-core/movement.ts
function walk(ctx, steps, mode) {
  const player = currentPlayer(ctx.s);
  const from = player.position;
  const raw = from + steps;
  const to = raw % BOARD_SIZE;
  player.position = to;
  emit(ctx, { type: "PLAYER_MOVED", playerId: player.id, from, to, steps, mode });
  if (raw >= BOARD_SIZE) {
    player.money += ECONOMY.passStartBonus;
    emit(ctx, { type: "PASSED_START", playerId: player.id, amount: ECONOMY.passStartBonus });
  }
}
function moveTo(ctx, target, mode) {
  const from = currentPlayer(ctx.s).position;
  const steps = (target - from + BOARD_SIZE) % BOARD_SIZE || BOARD_SIZE;
  walk(ctx, steps, mode);
}
function sendToIsland(ctx, reason) {
  const player = currentPlayer(ctx.s);
  const from = player.position;
  player.position = ISLAND_INDEX;
  player.islandTurnsLeft = ECONOMY.island.maxTurns;
  player.airportTicket = false;
  ctx.s.turn.extraRoll = false;
  if (from !== ISLAND_INDEX) {
    emit(ctx, { type: "PLAYER_MOVED", playerId: player.id, from, to: ISLAND_INDEX, steps: 0, mode: "TELEPORT" });
  }
  emit(ctx, { type: "SENT_TO_ISLAND", playerId: player.id, reason });
}
function landOn(ctx) {
  const s = ctx.s;
  const t = s.turn;
  const player = currentPlayer(s);
  const i = player.position;
  const def = tileDef(i);
  t.buildTile = null;
  t.acquiredTile = null;
  t.buyoutTile = null;
  t.freeHouse = false;
  t.festivalChoice = false;
  switch (def.kind) {
    case "START": {
      const canUpgrade = CITY_INDICES.some(
        (c) => s.tiles[c].owner === player.id && s.tiles[c].level < ECONOMY.city.maxHouses
      );
      if (canUpgrade) {
        t.freeHouse = true;
        emit(ctx, { type: "FREE_HOUSE_AVAILABLE", playerId: player.id });
      }
      return;
    }
    case "ISLAND":
      sendToIsland(ctx, "TILE");
      return;
    case "FESTIVAL":
      t.festivalChoice = CITY_INDICES.some((c) => s.tiles[c].owner === player.id);
      return;
    case "AIRPORT":
      player.airportTicket = true;
      t.extraRoll = false;
      emit(ctx, { type: "AIRPORT_TICKET", playerId: player.id });
      return;
    case "CHANCE":
      t.pending = { type: "DRAW_CARD" };
      return;
    case "TAX":
      charge(ctx, [{ to: null, amount: Math.floor(netWorth(s, player.id) * ECONOMY.taxRate) }], "TAX");
      return;
    case "CITY":
    case "RESORT": {
      const owner = s.tiles[i].owner;
      if (owner === null) return;
      if (owner === player.id) {
        if (def.kind === "CITY") t.buildTile = i;
        return;
      }
      const amount = rentFor(s, i);
      t.pending = { type: "RENT", tileIndex: i, to: owner, amount };
      emit(ctx, { type: "RENT_DUE", from: player.id, to: owner, tileIndex: i, amount });
      return;
    }
  }
}

// src/game-core/cards.ts
function drawRandomCard(ctx) {
  return CARD_IDS[Math.floor(random(ctx) * CARD_IDS.length)];
}
function isEarthquakeTarget(s, playerId, i) {
  const tile = s.tiles[i];
  return CITY_INDICES.includes(i) && tile.owner !== null && tile.owner !== playerId && tile.level >= 1 && tile.level <= ECONOMY.city.maxHouses;
}
function resolveCard(ctx, card) {
  const s = ctx.s;
  const player = currentPlayer(s);
  switch (card) {
    case "ESCAPE_ISLAND":
    case "SHIELD":
      player.heldCards.push(card);
      return;
    case "DISCOUNT":
      player.rentDiscount = true;
      return;
    case "GO_TO_START":
      moveTo(ctx, START_INDEX, "TELEPORT");
      landOn(ctx);
      return;
    case "GO_TO_FESTIVAL":
      moveTo(ctx, FESTIVAL_INDEX, "TELEPORT");
      landOn(ctx);
      return;
    case "EARTHQUAKE":
      if (CITY_INDICES.some((i) => isEarthquakeTarget(s, player.id, i))) {
        s.turn.pending = { type: "EARTHQUAKE" };
      } else {
        emit(ctx, { type: "EARTHQUAKE_NO_TARGET", playerId: player.id });
      }
      return;
    case "GO_TO_ISLAND":
      sendToIsland(ctx, "CARD");
      return;
    case "SURPRISE_TAX":
      charge(
        ctx,
        [{ to: null, amount: housesOwned(s, player.id) * ECONOMY.cards.surpriseTaxPerHouse }],
        "SURPRISE_TAX"
      );
      return;
    case "CHARITY":
      charge(
        ctx,
        s.players.filter((p) => !p.bankrupt && p.id !== player.id).map((p) => ({ to: p.id, amount: ECONOMY.cards.charityPerPlayer })),
        "CHARITY"
      );
      return;
    case "LOTTERY":
      player.money += ECONOMY.cards.lotteryPrize;
      emit(ctx, { type: "MONEY_RECEIVED", playerId: player.id, amount: ECONOMY.cards.lotteryPrize, reason: "LOTTERY" });
      return;
  }
}

// src/game-core/win.ts
function findInstantWinner(s) {
  const active = s.players.filter((p) => !p.bankrupt);
  if (active.length === 1) return { playerId: active[0].id, reason: "LAST_SURVIVOR" };
  const ordered = [...active].sort(
    (a2, b) => Number(b.id === s.players[s.currentPlayerIndex].id) - Number(a2.id === s.players[s.currentPlayerIndex].id)
  );
  for (const p of ordered) {
    if (completedGroups(s, p.id).length >= ECONOMY.win.colorGroupsToWin) {
      return { playerId: p.id, reason: "THREE_COLOR_GROUPS" };
    }
    if (SIDES.some((side) => sidePurchasableTiles(side).every((i) => s.tiles[i].owner === p.id))) {
      return { playerId: p.id, reason: "SIDE_MONOPOLY" };
    }
    if (RESORT_INDICES.every((i) => s.tiles[i].owner === p.id)) {
      return { playerId: p.id, reason: "ALL_RESORTS" };
    }
  }
  return null;
}
function checkWin(ctx) {
  if (ctx.s.phase !== "playing") return;
  const win = findInstantWinner(ctx.s);
  if (win) finishGame(ctx, win.playerId, win.reason);
}

// src/game-core/reducer.ts
function applyAction(state, action) {
  if (state.phase !== "playing") throw new GameRuleError("V\xE1n \u0111\u1EA5u \u0111\xE3 k\u1EBFt th\xFAc");
  if (action.playerId !== currentPlayer(state).id) {
    throw new GameRuleError(`Ch\u01B0a t\u1EDBi l\u01B0\u1EE3t c\u1EE7a ${action.playerId}`);
  }
  const ctx = { s: structuredClone(state), events: [] };
  switch (action.type) {
    case "ROLL_DICE":
      rollDice(ctx);
      break;
    case "MOVE":
      move(ctx);
      break;
    case "BUY":
      buy(ctx);
      break;
    case "BUILD":
      build(ctx, action.tileIndex);
      break;
    case "BUYOUT":
      buyout(ctx);
      break;
    case "PAY_RENT":
      payRent(ctx);
      break;
    case "DRAW_CARD":
      drawCard(ctx);
      break;
    case "USE_CARD":
      playCard(ctx, action.card);
      break;
    case "SELL":
      sell(ctx, action.tileIndex);
      break;
    case "END_TURN":
      endTurn(ctx);
      break;
    case "HOST_FESTIVAL":
      hostFestival(ctx, action.tileIndex);
      break;
    case "FLY":
      fly(ctx, action.tileIndex);
      break;
    case "PAY_ISLAND_FEE":
      payIslandFee(ctx);
      break;
    case "EARTHQUAKE":
      earthquake(ctx, action.tileIndex);
      break;
    default: {
      const unknown = action;
      throw new GameRuleError(`Action kh\xF4ng h\u1EE3p l\u1EC7: ${JSON.stringify(unknown)}`);
    }
  }
  checkWin(ctx);
  return { state: ctx.s, events: ctx.events };
}
function ensureFreeToAct(ctx) {
  ensure(ctx.s.turn.step === "ACT", "Ch\u01B0a t\u1EDBi b\u01B0\u1EDBc h\xE0nh \u0111\u1ED9ng");
  ensure(ctx.s.turn.pending === null, "C\xF2n vi\u1EC7c b\u1EAFt bu\u1ED9c ch\u01B0a x\u1EED l\xFD");
}
function rollDice(ctx) {
  const t = ctx.s.turn;
  const player = currentPlayer(ctx.s);
  ensure(t.step === "ROLL" && t.pending === null, "Kh\xF4ng th\u1EC3 tung x\xFAc x\u1EAFc l\xFAc n\xE0y");
  const dice = [rollDie(ctx), rollDie(ctx)];
  const isDouble = dice[0] === dice[1];
  t.dice = dice;
  emit(ctx, { type: "DICE_ROLLED", playerId: player.id, dice, isDouble });
  if (player.islandTurnsLeft > 0) {
    if (isDouble) {
      player.islandTurnsLeft = 0;
      emit(ctx, { type: "ISLAND_ESCAPED", playerId: player.id, method: "DOUBLES" });
      t.extraRoll = false;
      t.step = "MOVE";
    } else {
      player.islandTurnsLeft--;
      emit(ctx, { type: "ISLAND_STAY", playerId: player.id, turnsLeft: player.islandTurnsLeft });
      t.step = "ACT";
    }
    return;
  }
  player.airportTicket = false;
  if (isDouble) {
    t.doublesCount++;
    if (t.doublesCount >= ECONOMY.dice.maxConsecutiveDoubles) {
      t.step = "ACT";
      sendToIsland(ctx, "THREE_DOUBLES");
      return;
    }
    t.extraRoll = true;
  } else {
    t.extraRoll = false;
  }
  t.step = "MOVE";
}
function move(ctx) {
  const t = ctx.s.turn;
  ensure(t.step === "MOVE" && t.dice !== null, "Ch\u01B0a tung x\xFAc x\u1EAFc");
  const steps = t.dice[0] + t.dice[1];
  t.step = "ACT";
  walk(ctx, steps, "WALK");
  landOn(ctx);
}
function buy(ctx) {
  ensureFreeToAct(ctx);
  const s = ctx.s;
  const player = currentPlayer(s);
  const i = player.position;
  ensure(isPurchasable(i), "\xD4 n\xE0y kh\xF4ng mua \u0111\u01B0\u1EE3c");
  ensure(s.tiles[i].owner === null, "\xD4 n\xE0y \u0111\xE3 c\xF3 ch\u1EE7");
  const price = tileDef(i).price ?? 0;
  ensure(player.money >= price, "Kh\xF4ng \u0111\u1EE7 ti\u1EC1n mua");
  player.money -= price;
  s.tiles[i] = { owner: player.id, level: 0 };
  s.turn.acquiredTile = i;
  if (tileDef(i).kind === "CITY") s.turn.buildTile = i;
  emit(ctx, { type: "PROPERTY_BOUGHT", playerId: player.id, tileIndex: i, price });
}
function build(ctx, tileIndex) {
  ensureFreeToAct(ctx);
  const s = ctx.s;
  const t = s.turn;
  const player = currentPlayer(s);
  ensure(isValidTileIndex(tileIndex), "\xD4 kh\xF4ng t\u1ED3n t\u1EA1i");
  const tile = s.tiles[tileIndex];
  ensure(tileDef(tileIndex).kind === "CITY" && tile.owner === player.id, "Ch\u1EC9 x\xE2y \u0111\u01B0\u1EE3c tr\xEAn th\xE0nh ph\u1ED1 c\u1EE7a m\xECnh");
  if (t.freeHouse) {
    ensure(tile.level < ECONOMY.city.maxHouses, "Nh\xE0 mi\u1EC5n ph\xED ch\u1EC9 x\xE2y khi \xF4 ch\u01B0a \u0111\u1EE7 nh\xE0");
    tile.level++;
    t.freeHouse = false;
    emit(ctx, { type: "BUILT", playerId: player.id, tileIndex, level: tile.level, cost: 0, free: true });
    return;
  }
  ensure(t.buildTile === tileIndex, "Ch\u1EC9 \u0111\u01B0\u1EE3c x\xE2y tr\xEAn \xF4 \u0111ang \u0111\u1EE9ng");
  ensure(tile.level < LANDMARK_LEVEL, "\xD4 \u0111\xE3 c\xF3 Landmark");
  const next = tile.level + 1;
  if (next === LANDMARK_LEVEL) {
    ensure(t.acquiredTile !== tileIndex, "Landmark ch\u1EC9 x\xE2y \u0111\u01B0\u1EE3c \u1EDF l\u1EA7n d\u1EEBng sau khi c\xF3 \xF4 n\xE0y");
  }
  const cost = buildCost(tileIndex, next);
  ensure(player.money >= cost, "Kh\xF4ng \u0111\u1EE7 ti\u1EC1n x\xE2y");
  player.money -= cost;
  tile.level = next;
  emit(ctx, { type: "BUILT", playerId: player.id, tileIndex, level: next, cost, free: false });
}
function buyout(ctx) {
  ensureFreeToAct(ctx);
  const s = ctx.s;
  const t = s.turn;
  const player = currentPlayer(s);
  const i = player.position;
  ensure(t.buyoutTile === i, "Ch\u1EC9 mua l\u1EA1i \u0111\u01B0\u1EE3c \xF4 v\u1EEBa tr\u1EA3 ti\u1EC1n thu\xEA");
  const tile = s.tiles[i];
  ensure(tile.owner !== null && tile.owner !== player.id, "\xD4 n\xE0y kh\xF4ng thu\u1ED9c \u0111\u1ED1i th\u1EE7");
  ensure(tile.level < LANDMARK_LEVEL, "Landmark kh\xF4ng th\u1EC3 b\u1ECB mua l\u1EA1i");
  const price = buyoutPrice(s, i);
  ensure(player.money >= price, "Kh\xF4ng \u0111\u1EE7 ti\u1EC1n mua l\u1EA1i");
  const previousOwner = playerById(s, tile.owner);
  player.money -= price;
  previousOwner.money += price;
  tile.owner = player.id;
  t.buyoutTile = null;
  t.acquiredTile = i;
  if (tileDef(i).kind === "CITY") t.buildTile = i;
  emit(ctx, { type: "BOUGHT_OUT", playerId: player.id, from: previousOwner.id, tileIndex: i, price });
}
function payRent(ctx) {
  const s = ctx.s;
  const pending = s.turn.pending;
  ensure(pending?.type === "RENT", "Kh\xF4ng c\xF3 ti\u1EC1n thu\xEA c\u1EA7n tr\u1EA3");
  const player = currentPlayer(s);
  let amount = pending.amount;
  let discounted = false;
  if (player.rentDiscount) {
    amount = Math.round(amount * ECONOMY.cards.rentDiscountRatio);
    player.rentDiscount = false;
    discounted = true;
  }
  s.turn.pending = null;
  const result = charge(ctx, [{ to: pending.to, amount }], "RENT", pending.tileIndex, discounted);
  if (result === "PAID") afterRent(ctx, pending.tileIndex);
}
function drawCard(ctx) {
  const s = ctx.s;
  ensure(s.turn.pending?.type === "DRAW_CARD", "Kh\xF4ng \u1EDF \xF4 C\u01A1 H\u1ED9i");
  s.turn.pending = null;
  const card = drawRandomCard(ctx);
  emit(ctx, { type: "CARD_DRAWN", playerId: currentPlayer(s).id, card });
  resolveCard(ctx, card);
}
function playCard(ctx, card) {
  const s = ctx.s;
  const t = s.turn;
  const player = currentPlayer(s);
  const at = player.heldCards.indexOf(card);
  ensure(at >= 0, "Kh\xF4ng c\xF3 th\u1EBB n\xE0y");
  if (card === "ESCAPE_ISLAND") {
    ensure(t.step === "ROLL" && player.islandTurnsLeft > 0, "Ch\u1EC9 d\xF9ng th\u1EBB Ra \u0110\u1EA3o khi \u0111ang k\u1EB9t \u1EDF \u0110\u1EA3o Hoang");
    player.heldCards.splice(at, 1);
    player.islandTurnsLeft = 0;
    emit(ctx, { type: "CARD_USED", playerId: player.id, card });
    emit(ctx, { type: "ISLAND_ESCAPED", playerId: player.id, method: "CARD" });
    return;
  }
  const pending = t.pending;
  ensure(pending?.type === "RENT", "Ch\u1EC9 d\xF9ng L\xE1 Ch\u1EAFn khi ph\u1EA3i tr\u1EA3 ti\u1EC1n thu\xEA");
  player.heldCards.splice(at, 1);
  t.pending = null;
  emit(ctx, { type: "CARD_USED", playerId: player.id, card });
  emit(ctx, { type: "RENT_WAIVED", from: player.id, to: pending.to, tileIndex: pending.tileIndex, amount: pending.amount });
  afterRent(ctx, pending.tileIndex);
}
function sell(ctx, tileIndex) {
  const s = ctx.s;
  ensure(s.turn.pending?.type === "DEBT", "Ch\u1EC9 b\xE1n t\xE0i s\u1EA3n khi thi\u1EBFu ti\u1EC1n");
  ensure(isValidTileIndex(tileIndex), "\xD4 kh\xF4ng t\u1ED3n t\u1EA1i");
  const player = currentPlayer(s);
  ensure(s.tiles[tileIndex].owner === player.id, "Kh\xF4ng ph\u1EA3i t\xE0i s\u1EA3n c\u1EE7a b\u1EA1n");
  const amount = sellValue(s, tileIndex);
  player.money += amount;
  s.tiles[tileIndex] = { owner: null, level: 0 };
  if (s.festivalTile === tileIndex) s.festivalTile = null;
  emit(ctx, { type: "PROPERTY_SOLD", playerId: player.id, tileIndex, amount });
  settleDebtIfPossible(ctx);
}
function endTurn(ctx) {
  ensureFreeToAct(ctx);
  const s = ctx.s;
  const player = currentPlayer(s);
  if (s.turn.extraRoll && player.islandTurnsLeft === 0) {
    emit(ctx, { type: "EXTRA_ROLL", playerId: player.id });
    s.turn = { ...freshTurn(), doublesCount: s.turn.doublesCount };
    return;
  }
  advanceTurn(ctx);
}
function hostFestival(ctx, tileIndex) {
  ensureFreeToAct(ctx);
  const s = ctx.s;
  const player = currentPlayer(s);
  ensure(s.turn.festivalChoice, "Ch\u1EC9 t\u1ED5 ch\u1EE9c L\u1EC5 H\u1ED9i khi d\u1EEBng \u1EDF \xF4 L\u1EC5 H\u1ED9i");
  ensure(isValidTileIndex(tileIndex), "\xD4 kh\xF4ng t\u1ED3n t\u1EA1i");
  ensure(tileDef(tileIndex).kind === "CITY" && s.tiles[tileIndex].owner === player.id, "Ch\u1ECDn m\u1ED9t th\xE0nh ph\u1ED1 c\u1EE7a m\xECnh");
  const previousTile = s.festivalTile;
  s.festivalTile = tileIndex;
  s.turn.festivalChoice = false;
  emit(ctx, { type: "FESTIVAL_HOSTED", playerId: player.id, tileIndex, previousTile });
}
function fly(ctx, tileIndex) {
  const s = ctx.s;
  const t = s.turn;
  const player = currentPlayer(s);
  ensure(t.step === "ROLL" && t.pending === null, "Ch\u1EC9 bay \u0111\u01B0\u1EE3c \u1EDF \u0111\u1EA7u l\u01B0\u1EE3t");
  ensure(player.airportTicket, "Kh\xF4ng c\xF3 v\xE9 S\xE2n Bay");
  ensure(isValidTileIndex(tileIndex) && tileIndex !== AIRPORT_INDEX, "\u0110i\u1EC3m \u0111\u1EBFn kh\xF4ng h\u1EE3p l\u1EC7");
  const fee = ECONOMY.airport.flightFee;
  ensure(player.money >= fee, "Kh\xF4ng \u0111\u1EE7 ti\u1EC1n bay");
  player.money -= fee;
  player.airportTicket = false;
  emit(ctx, { type: "MONEY_PAID", from: player.id, to: null, amount: fee, reason: "FLIGHT" });
  t.dice = null;
  t.extraRoll = false;
  t.step = "ACT";
  moveTo(ctx, tileIndex, "FLY");
  landOn(ctx);
}
function payIslandFee(ctx) {
  const s = ctx.s;
  const player = currentPlayer(s);
  ensure(s.turn.step === "ROLL" && player.islandTurnsLeft > 0, "Kh\xF4ng \u1EDF \u0110\u1EA3o Hoang");
  const fee = ECONOMY.island.escapeFee;
  ensure(player.money >= fee, "Kh\xF4ng \u0111\u1EE7 ti\u1EC1n tho\xE1t \u0111\u1EA3o");
  player.money -= fee;
  player.islandTurnsLeft = 0;
  emit(ctx, { type: "MONEY_PAID", from: player.id, to: null, amount: fee, reason: "ISLAND_FEE" });
  emit(ctx, { type: "ISLAND_ESCAPED", playerId: player.id, method: "FEE" });
}
function earthquake(ctx, tileIndex) {
  const s = ctx.s;
  ensure(s.turn.pending?.type === "EARTHQUAKE", "Kh\xF4ng c\xF3 th\u1EBB \u0110\u1ED9ng \u0110\u1EA5t c\u1EA7n x\u1EED l\xFD");
  const player = currentPlayer(s);
  ensure(isValidTileIndex(tileIndex) && isEarthquakeTarget(s, player.id, tileIndex), "Ch\u1ECDn th\xE0nh ph\u1ED1 c\xF3 nh\xE0 c\u1EE7a \u0111\u1ED1i th\u1EE7");
  const tile = s.tiles[tileIndex];
  const owner = tile.owner;
  ensure(owner !== null, "\xD4 ch\u01B0a c\xF3 ch\u1EE7");
  tile.level--;
  s.turn.pending = null;
  emit(ctx, { type: "HOUSE_DESTROYED", byPlayerId: player.id, owner, tileIndex, level: tile.level });
}

// src/game-core/legalActions.ts
function isLegal(state, action) {
  try {
    applyAction(state, action);
    return true;
  } catch (error) {
    if (error instanceof GameRuleError) return false;
    throw error;
  }
}
function candidates(state) {
  const player = currentPlayer(state);
  const playerId = player.id;
  const t = state.turn;
  const tiles = Array.from({ length: BOARD_SIZE }, (_, i) => i);
  const owned = tiles.filter((i) => state.tiles[i].owner === playerId);
  switch (t.pending?.type) {
    case "RENT":
      return [
        { type: "PAY_RENT", playerId },
        { type: "USE_CARD", playerId, card: "SHIELD" }
      ];
    case "DEBT":
      return owned.map((tileIndex) => ({ type: "SELL", playerId, tileIndex }));
    case "DRAW_CARD":
      return [{ type: "DRAW_CARD", playerId }];
    case "EARTHQUAKE":
      return tiles.map((tileIndex) => ({ type: "EARTHQUAKE", playerId, tileIndex }));
  }
  switch (t.step) {
    case "ROLL":
      return [
        { type: "ROLL_DICE", playerId },
        { type: "PAY_ISLAND_FEE", playerId },
        { type: "USE_CARD", playerId, card: "ESCAPE_ISLAND" },
        ...player.airportTicket ? tiles.map((tileIndex) => ({ type: "FLY", playerId, tileIndex })) : []
      ];
    case "MOVE":
      return [{ type: "MOVE", playerId }];
    case "ACT":
      return [
        { type: "BUY", playerId },
        { type: "BUYOUT", playerId },
        ...owned.map((tileIndex) => ({ type: "BUILD", playerId, tileIndex })),
        ...t.festivalChoice ? owned.map((tileIndex) => ({ type: "HOST_FESTIVAL", playerId, tileIndex })) : [],
        { type: "END_TURN", playerId }
      ];
  }
}
function getLegalActions(state) {
  if (state.phase !== "playing") return [];
  return candidates(state).filter((action) => isLegal(state, action));
}
function getTimeoutAction(state) {
  const legal = getLegalActions(state);
  if (legal.length === 0) return null;
  const pick = (type) => legal.find((a2) => a2.type === type);
  const sells = legal.filter((a2) => a2.type === "SELL");
  if (sells.length > 0) {
    return sells.reduce((best, a2) => sellValue(state, a2.tileIndex) < sellValue(state, best.tileIndex) ? a2 : best);
  }
  return pick("PAY_RENT") ?? pick("DRAW_CARD") ?? pick("EARTHQUAKE") ?? pick("ROLL_DICE") ?? pick("MOVE") ?? pick("END_TURN") ?? legal[0];
}

// src/config/bots.ts
var BOTS = {
  easy: {
    /** Xác suất mua khi đủ tiền. */
    buyChance: 0.6,
    /** Xác suất xây khi đủ tiền. */
    buildChance: 0.15,
    /** Xác suất mua lại khi đủ tiền. */
    buyoutChance: 0.1,
    cashReserve: 50
  },
  normal: {
    /** Tiền mặt tối thiểu bot luôn giữ lại sau khi mua/xây. */
    cashReserve: 200,
    /** Xây nhà thì giữ dư hơn (nhân với cashReserve), vì nhà khó bán lại được giá. */
    buildReserveFactor: 1.5,
    /** Phí thoát đảo chỉ trả khi còn dư bấy nhiêu lần cashReserve. */
    islandFeeReserveFactor: 2
  },
  hard: {
    /** Tiền dự trữ tối thiểu; thực tế giữ bằng tiền thuê lớn nhất của đối thủ (kỳ vọng phải trả), kẹp trong [min, max]. */
    minReserve: 100,
    maxReserve: 500,
    /** Mua để chặn đối thủ / gom trọn nhóm thì chấp nhận giữ ít tiền hơn. */
    strategicReserve: 60,
    /** Trước vòng này, thoát đảo sớm để còn mua đất; sau đó ở lại đảo để né tiền thuê. */
    leaveIslandBeforeRound: 12
  }
};

// src/game-core/bot.ts
function groupProgress(s, playerId, i) {
  const group = tileDef(i).group;
  if (!group) return { owned: 0, size: 0 };
  const tiles = groupTiles(group);
  const owned = tiles.filter((t) => t === i || s.tiles[t].owner === playerId).length;
  return { owned, size: tiles.length };
}
function completesGroup(s, playerId, i) {
  const { owned, size } = groupProgress(s, playerId, i);
  return size > 0 && owned === size;
}
function baseRent(i, level) {
  return landPrice(i) * ECONOMY.city.rentRatio[Math.min(level, LANDMARK_LEVEL)];
}
function pickMax(items, score) {
  let best;
  let bestScore = -Infinity;
  for (const item of items) {
    const v = score(item);
    if (v > bestScore) {
      best = item;
      bestScore = v;
    }
  }
  return best;
}
var opponents = (s, me) => s.players.filter((p) => p.id !== me && !p.bankrupt);
function threatIfOpponentGets(s, me, i) {
  let worst = 0;
  for (const opp of opponents(s, me)) {
    const has = (t) => t === i || s.tiles[t].owner === opp.id;
    const def = tileDef(i);
    if (def.group) {
      const tiles = groupTiles(def.group);
      if (tiles.every(has)) {
        const groupsAfter = completedGroups(s, opp.id).length + (completedGroups(s, opp.id).includes(def.group) ? 0 : 1);
        worst = Math.max(worst, groupsAfter >= ECONOMY.win.colorGroupsToWin ? 1 : 0.6);
      } else if (tiles.filter(has).length === tiles.length - 1) {
        worst = Math.max(worst, 0.25);
      }
    }
    for (const side of SIDES) {
      const tiles = sidePurchasableTiles(side);
      if (!tiles.includes(i)) continue;
      const count = tiles.filter(has).length;
      if (count === tiles.length) worst = Math.max(worst, 1);
      else if (count === tiles.length - 1) worst = Math.max(worst, 0.5);
    }
    if (def.kind === "RESORT") {
      const count = RESORT_INDICES.filter(has).length;
      if (count === RESORT_INDICES.length) worst = Math.max(worst, 1);
      else if (count === RESORT_INDICES.length - 1) worst = Math.max(worst, 0.5);
    }
  }
  return worst;
}
function worstRentAhead(s, me) {
  let worst = 0;
  s.tiles.forEach((t, i) => {
    if (t.owner && t.owner !== me) worst = Math.max(worst, rentFor(s, i));
  });
  return worst;
}
function botRoll(s, salt) {
  const seed = s.rngState ^ Math.imul(salt + 1, 2654435761) ^ Math.imul(s.round, 2246822507) | 0;
  return nextRandom(seed)[0];
}
function chooseSale(s, sells) {
  if (sells.length === 0) return void 0;
  const me = currentPlayer(s);
  const pending = s.turn.pending;
  const due = pending?.type === "DEBT" ? pending.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
  const missing = due - me.money;
  const done = new Set(completedGroups(s, me.id));
  const inDoneGroup = (i) => {
    const group = tileDef(i).group;
    return group !== null && done.has(group);
  };
  const loose = sells.filter((a2) => !inDoneGroup(a2.tileIndex));
  const pool = loose.length > 0 ? loose : sells;
  const enough = pool.filter((a2) => sellValue(s, a2.tileIndex) >= missing);
  if (enough.length > 0) return pickMax(enough, (a2) => -sellValue(s, a2.tileIndex));
  return pickMax(pool, (a2) => sellValue(s, a2.tileIndex));
}
function forced(s, legal, level) {
  const of = (type) => legal.filter((a2) => a2.type === type);
  const me = currentPlayer(s);
  switch (s.turn.pending?.type) {
    case "RENT":
      return of("USE_CARD").find((a2) => a2.card === "SHIELD") ?? of("PAY_RENT")[0];
    case "DEBT":
      return level === "easy" ? pickMax(of("SELL"), (a2) => -sellValue(s, a2.tileIndex)) : chooseSale(s, of("SELL"));
    case "DRAW_CARD":
      return of("DRAW_CARD")[0];
    case "EARTHQUAKE":
      return pickMax(of("EARTHQUAKE"), (a2) => {
        const owner = s.tiles[a2.tileIndex].owner;
        if (level === "easy") return -a2.tileIndex;
        const threat = owner ? threatIfOpponentGets(s, me.id, a2.tileIndex) : 0;
        return (level === "hard" ? threat * 1e6 : 0) + (owner ? netWorth(s, owner) : 0) * 10 + rentFor(s, a2.tileIndex);
      });
  }
  if (s.turn.step === "MOVE") return of("MOVE")[0];
  return void 0;
}
function easyBot(s, legal) {
  const of = (type) => legal.filter((a2) => a2.type === type);
  const me = currentPlayer(s);
  const cfg = BOTS.easy;
  if (s.turn.step === "ROLL") {
    const escape = of("USE_CARD").find((a2) => a2.card === "ESCAPE_ISLAND");
    if (escape) return escape;
    return of("ROLL_DICE")[0] ?? legal[0];
  }
  const festival = of("HOST_FESTIVAL")[0];
  if (festival) return festival;
  const buy2 = of("BUY")[0];
  if (buy2 && me.money - landPrice(me.position) >= cfg.cashReserve && botRoll(s, me.position * 7 + 1) < cfg.buyChance) return buy2;
  const buyout2 = of("BUYOUT")[0];
  if (buyout2 && me.money - buyoutPrice(s, me.position) >= cfg.cashReserve && botRoll(s, me.position * 7 + 2) < cfg.buyoutChance) {
    return buyout2;
  }
  const builds = of("BUILD");
  if (builds.length > 0) {
    if (s.turn.freeHouse) return builds[0];
    const build2 = builds[0];
    const level = s.tiles[build2.tileIndex].level;
    const cost = buildCost(build2.tileIndex, level + 1);
    if (me.money - cost >= cfg.cashReserve && botRoll(s, build2.tileIndex * 7 + level + 3) < cfg.buildChance) return build2;
  }
  return of("END_TURN")[0] ?? legal[0];
}
function normalBot(s, legal) {
  const of = (type) => legal.filter((a2) => a2.type === type);
  const me = currentPlayer(s);
  const cfg = BOTS.normal;
  const reserve = cfg.cashReserve;
  if (s.turn.step === "ROLL") {
    const escape = of("USE_CARD").find((a2) => a2.card === "ESCAPE_ISLAND");
    if (escape) return escape;
    const fee = of("PAY_ISLAND_FEE")[0];
    if (fee && me.money - ECONOMY.island.escapeFee >= reserve * cfg.islandFeeReserveFactor) return fee;
    const flight = chooseFlight(s, me.id, me.money - ECONOMY.airport.flightFee, of("FLY"), reserve, reserve * cfg.buildReserveFactor);
    if (flight) return flight;
    return of("ROLL_DICE")[0] ?? legal[0];
  }
  const festival = pickMax(of("HOST_FESTIVAL"), (a2) => baseRent(a2.tileIndex, s.tiles[a2.tileIndex].level));
  if (festival) return festival;
  const buy2 = of("BUY")[0];
  if (buy2 && me.money - landPrice(me.position) >= reserve) return buy2;
  const buyout2 = of("BUYOUT")[0];
  if (buyout2) {
    const i = me.position;
    const price = buyoutPrice(s, i);
    const { owned } = groupProgress(s, me.id, i);
    const worthIt = completesGroup(s, me.id, i) || owned >= 2 && me.money - price >= reserve * 2;
    if (worthIt && me.money - price >= reserve) return buyout2;
  }
  const builds = of("BUILD");
  if (builds.length > 0) {
    if (s.turn.freeHouse) {
      const done = new Set(completedGroups(s, me.id));
      const best = pickMax(builds, (a2) => {
        const group = tileDef(a2.tileIndex).group;
        return (group && done.has(group) ? 1e6 : 0) + landPrice(a2.tileIndex);
      });
      if (best) return best;
    } else {
      const build2 = builds[0];
      const cost = buildCost(build2.tileIndex, s.tiles[build2.tileIndex].level + 1);
      if (me.money - cost >= reserve * cfg.buildReserveFactor) return build2;
    }
  }
  return of("END_TURN")[0] ?? legal[0];
}
function hardBot(s, legal) {
  const of = (type) => legal.filter((a2) => a2.type === type);
  const me = currentPlayer(s);
  const cfg = BOTS.hard;
  const reserve = Math.min(cfg.maxReserve, Math.max(cfg.minReserve, worstRentAhead(s, me.id)));
  const strategic = (i) => completesGroup(s, me.id, i) || threatIfOpponentGets(s, me.id, i) >= 0.5;
  if (s.turn.step === "ROLL") {
    const onIsland = me.islandTurnsLeft > 0;
    if (onIsland) {
      const early = s.round < cfg.leaveIslandBeforeRound;
      const escape = of("USE_CARD").find((a2) => a2.card === "ESCAPE_ISLAND");
      if (early && escape) return escape;
      const fee = of("PAY_ISLAND_FEE")[0];
      if (early && fee && me.money - ECONOMY.island.escapeFee >= reserve) return fee;
      return of("ROLL_DICE")[0] ?? legal[0];
    }
    const flight = chooseFlightHard(s, me.id, me.money - ECONOMY.airport.flightFee, of("FLY"), reserve);
    if (flight) return flight;
    return of("ROLL_DICE")[0] ?? legal[0];
  }
  const festival = pickMax(of("HOST_FESTIVAL"), (a2) => rentFor(s, a2.tileIndex) + baseRent(a2.tileIndex, s.tiles[a2.tileIndex].level));
  if (festival) return festival;
  const buy2 = of("BUY")[0];
  if (buy2) {
    const i = me.position;
    const left = me.money - landPrice(i);
    if (left >= (strategic(i) ? cfg.strategicReserve : reserve)) return buy2;
  }
  const buyout2 = of("BUYOUT")[0];
  if (buyout2) {
    const i = me.position;
    const left = me.money - buyoutPrice(s, i);
    const owner = s.tiles[i].owner;
    const breaksThreat = owner !== null && breaksOwnerThreat(s, owner, i);
    if ((completesGroup(s, me.id, i) || breaksThreat) && left >= cfg.strategicReserve) return buyout2;
    if (groupProgress(s, me.id, i).owned >= 2 && left >= reserve * 2) return buyout2;
  }
  const builds = of("BUILD");
  if (builds.length > 0) {
    if (s.turn.freeHouse) {
      const best = pickMax(builds, (a2) => {
        const level = s.tiles[a2.tileIndex].level;
        const mult = completesGroupOwned(s, me.id, a2.tileIndex) ? ECONOMY.colorGroupRentMultiplier : 1;
        return (baseRent(a2.tileIndex, level + 1) - baseRent(a2.tileIndex, level)) * mult;
      });
      if (best) return best;
    } else {
      const build2 = builds[0];
      const cost = buildCost(build2.tileIndex, s.tiles[build2.tileIndex].level + 1);
      const need = completesGroupOwned(s, me.id, build2.tileIndex) ? cfg.minReserve : reserve;
      if (me.money - cost >= need) return build2;
    }
  }
  return of("END_TURN")[0] ?? legal[0];
}
function completesGroupOwned(s, playerId, i) {
  const group = tileDef(i).group;
  return group !== null && groupTiles(group).every((t) => s.tiles[t].owner === playerId);
}
function breaksOwnerThreat(s, owner, i) {
  if (completesGroupOwned(s, owner, i)) return completedGroups(s, owner).length >= ECONOMY.win.colorGroupsToWin - 1;
  for (const side of SIDES) {
    const tiles = sidePurchasableTiles(side);
    if (tiles.includes(i) && tiles.filter((t) => s.tiles[t].owner === owner).length >= tiles.length - 1) return true;
  }
  if (tileDef(i).kind === "RESORT") return RESORT_INDICES.filter((t) => s.tiles[t].owner === owner).length >= RESORT_INDICES.length - 1;
  return false;
}
function chooseFlight(s, me, budget, flights, reserve, buildReserve) {
  if (flights.length === 0 || budget < reserve) return void 0;
  return pickMax(
    flights.filter((a2) => flightScore(s, me, a2.tileIndex, budget, reserve, buildReserve) > 0),
    (a2) => flightScore(s, me, a2.tileIndex, budget, reserve, buildReserve)
  );
}
function flightScore(s, me, i, budget, reserve, buildReserve) {
  const def = tileDef(i);
  const tile = s.tiles[i];
  if (tile.owner === null && def.price !== null && budget - def.price >= reserve) {
    const { owned, size } = groupProgress(s, me, i);
    return def.kind === "CITY" ? (owned === size ? 100 : owned * 20) + def.price / 100 : 10;
  }
  if (tile.owner === me && def.kind === "CITY" && tile.level < LANDMARK_LEVEL) {
    const cost = buildCost(i, tile.level + 1);
    if (budget - cost >= buildReserve) return 15 + (def.price ?? 0) / 100;
  }
  return 0;
}
function chooseFlightHard(s, me, budget, flights, reserve) {
  if (flights.length === 0 || budget < BOTS.hard.strategicReserve) return void 0;
  return pickMax(
    flights.filter((a2) => hardFlightScore(s, me, a2.tileIndex, budget, reserve) > 0),
    (a2) => hardFlightScore(s, me, a2.tileIndex, budget, reserve)
  );
}
function hardFlightScore(s, me, i, budget, reserve) {
  const def = tileDef(i);
  const tile = s.tiles[i];
  if (tile.owner === null && def.price !== null) {
    const block = threatIfOpponentGets(s, me, i);
    const left = budget - def.price;
    if (completesGroup(s, me, i) && left >= BOTS.hard.strategicReserve) return 200;
    if (block >= 0.5 && left >= BOTS.hard.strategicReserve) return 150 * block;
    if (left >= reserve) return 20 + groupProgress(s, me, i).owned * 20;
  }
  if (tile.owner === me && def.kind === "CITY" && tile.level < LANDMARK_LEVEL) {
    const cost = buildCost(i, tile.level + 1);
    if (budget - cost >= reserve) return 30 + (completesGroupOwned(s, me, i) ? 60 : 0);
  }
  return 0;
}
function chooseBotAction(state, level = "normal") {
  const legal = getLegalActions(state);
  if (legal.length === 0) return null;
  if (legal.length === 1) return legal[0];
  const must = forced(state, legal, level);
  if (must) return must;
  switch (level) {
    case "easy":
      return easyBot(state, legal);
    case "hard":
      return hardBot(state, legal);
    default:
      return normalBot(state, legal);
  }
}

// src/game-core/flow.ts
function legalOf(legal, type) {
  return legal.filter((a2) => a2.type === type);
}
var tilesOf = (actions) => actions.map((a2) => a2.tileIndex);
function humanPrompt(state, humanId) {
  if (state.phase !== "playing" || humanId === null) return null;
  const me = currentPlayer(state);
  if (me.id !== humanId) return null;
  const legal = getLegalActions(state);
  const of = (type) => legalOf(legal, type);
  const pending = state.turn.pending;
  switch (pending?.type) {
    case "RENT":
      return of("USE_CARD").some((a2) => a2.card === "SHIELD") ? { kind: "RENT_SHIELD", tileIndex: pending.tileIndex, amount: pending.amount, to: pending.to } : null;
    case "DEBT":
      return { kind: "SELL", tiles: tilesOf(of("SELL")), due: pending.payments.reduce((sum, p) => sum + p.amount, 0) };
    case "DRAW_CARD":
      return { kind: "DRAW_CARD" };
    case "EARTHQUAKE":
      return { kind: "EARTHQUAKE", tiles: tilesOf(of("EARTHQUAKE")) };
  }
  if (state.turn.step === "ROLL") {
    return {
      kind: "ROLL",
      flyTiles: tilesOf(of("FLY")),
      onIsland: me.islandTurnsLeft > 0,
      canPayIslandFee: of("PAY_ISLAND_FEE").length > 0,
      canUseEscapeCard: of("USE_CARD").some((a2) => a2.card === "ESCAPE_ISLAND")
    };
  }
  if (state.turn.step !== "ACT") return null;
  if (of("HOST_FESTIVAL").length > 0) return { kind: "FESTIVAL", tiles: tilesOf(of("HOST_FESTIVAL")) };
  const builds = of("BUILD");
  if (state.turn.freeHouse && builds.length > 0) return { kind: "FREE_HOUSE", tiles: tilesOf(builds) };
  if (of("BUY").length > 0) return { kind: "BUY", tileIndex: me.position };
  if (of("BUYOUT").length > 0) return { kind: "BUYOUT", tileIndex: me.position };
  if (builds.length > 0) return { kind: "BUILD", tileIndex: builds[0].tileIndex };
  return null;
}
function autoAction(state, isHuman, botLevel = () => "normal") {
  if (state.phase !== "playing") return null;
  const me = currentPlayer(state);
  if (!isHuman(me.id)) return chooseBotAction(state, botLevel(me.id));
  if (humanPrompt(state, me.id)) return null;
  const legal = getLegalActions(state);
  const pick = (type) => legal.find((a2) => a2.type === type) ?? null;
  return pick("MOVE") ?? pick("PAY_RENT") ?? pick("END_TURN") ?? (legal.length === 1 ? legal[0] : null);
}

// src/net/protocol.ts
var NET = {
  /** Mã phòng riêng: 6 ký tự, bỏ các ký tự dễ nhầm (0/O, 1/I/L). */
  codeLength: 6,
  codeAlphabet: "ABCDEFGHJKMNPQRSTUVWXYZ23456789",
  minPlayers: 2,
  maxPlayers: 4,
  /** Ghép trận nhanh: chờ tối đa bấy nhiêu giây rồi thêm bot cho đủ ghế. */
  quickWaitSec: 30,
  /** Không nhận được tin của người chơi quá bấy nhiêu giây thì coi như mất kết nối (bot chơi thay). */
  disconnectSec: 8,
  /** Mất kết nối: giữ chỗ bấy nhiêu giây; quá thì ghế giao hẳn cho bot. */
  reconnectSec: 60,
  /** Nhịp hỏi server (ms): trong ván / ở sảnh chờ / khi tab bị ẩn. */
  pollMs: 900,
  lobbyPollMs: 1500,
  hiddenPollMs: 4e3,
  /** Mức bot server dùng để lấp ghế và chơi thay. */
  botLevel: "normal",
  /** Giữ lại bấy nhiêu lô event gần nhất để client hỏi bù (quá thì gửi lại toàn bộ state). */
  logSize: 120,
  /** Phòng tự xóa sau bấy nhiêu giây không ai đụng tới. */
  roomTtlSec: 6 * 3600
};

// src/config/skins.ts
var character = (file, name, price) => ({
  id: file,
  name,
  kind: "character",
  model: `models/characters/character-${file}.glb`,
  avatar: `avatars/character-${file}.png`,
  price
});
var pet = (file, name, price) => ({
  id: file,
  name,
  kind: "pet",
  model: `models/pets/animal-${file}.glb`,
  avatar: `avatars/animal-${file}.png`,
  price
});
var SKINS = [
  character("female-b", "Bella", 0),
  character("male-c", "C\u1EA3nh s\xE1t H\xF9ng", 0),
  character("female-a", "Mai", 0),
  character("male-e", "Gi\xE1o s\u01B0 T\xE2m", 0),
  character("female-c", "Nh\xE0 th\xE1m hi\u1EC3m Lan", 150),
  character("female-d", "Doanh nh\xE2n Vy", 150),
  character("male-a", "\u0110\u1EA7u b\u1EBFp Nam", 150),
  character("male-b", "B\xE1c s\u0129 Long", 200),
  character("female-e", "Ca s\u0129 H\xE0", 250),
  character("female-f", "Phi c\xF4ng Th\u1EA3o", 250),
  character("male-d", "Th\u1EE3 x\xE2y Ph\xFAc", 300),
  character("male-f", "V\u1EADn \u0111\u1ED9ng vi\xEAn Khoa", 300),
  // Skin tự làm: male-a tô lại bằng scripts/make-skin-striker.mjs.
  character("striker", "Ti\u1EC1n \u0111\u1EA1o \u0110\u1ECF", 350),
  pet("cat", "M\xE8o Mun", 500),
  pet("dog", "C\xFAn V\xE0ng", 500),
  pet("fox", "C\xE1o L\u1EEDa", 700),
  pet("panda", "G\u1EA5u Tr\xFAc", 800)
];
var SEAT_SKINS = ["female-b", "male-c", "female-a", "male-e"];
function skinById(id) {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}
var META = {
  /** Vàng tặng khi mới chơi lần đầu, để thử cửa hàng. */
  startingGold: 200,
  goldWin: 100,
  goldLose: 30,
  /** Tên mặc định của người chơi. */
  defaultName: "B\u1EA1n",
  maxNameLength: 12
};

// src/config/visual.ts
var VISUAL = {
  /** Nền phía sau bàn cờ: gradient từ trên xuống dưới. */
  background: {
    top: "#bfe6f6",
    bottom: "#f3efe2"
  },
  camera: {
    /** Góc nhìn xuống so với mặt bàn (độ). 90 = nhìn thẳng từ trên xuống. */
    elevationDeg: 42,
    /** Góc xoay quanh bàn cờ (độ). 45 = nhìn chéo, ô Xuất Phát ở dưới cùng. */
    azimuthDeg: 45,
    /** Khoảng trống quanh bàn cờ khi tự co cho vừa khung (1 = sát mép). */
    fitPadding: 1.03,
    /** Lề khi màn hình nhỏ (điện thoại): bàn cờ to hơn, HUD nằm ở 4 góc nên không che. */
    fitPaddingCompact: 1,
    /** Cạnh ngắn của khung (px) dưới mức này thì coi là màn hình nhỏ (điện thoại ngang hoặc dọc). */
    compactHeight: 520,
    /** Phần chiều cao nhà/Landmark được chừa khi co khung (1 = chừa đủ, 0 = bỏ qua). */
    fitHeadroom: 0.3,
    /** Người chơi được phóng to tối đa bao nhiêu lần (chụm 2 ngón / lăn chuột). */
    userZoomMax: 3,
    /** Tốc độ zoom khi lăn chuột. */
    wheelZoomSpeed: 15e-4,
    /** Kéo quá số px này thì không tính là bấm vào ô. */
    dragThreshold: 8
  },
  board: {
    /** Bề ngang một ô thường (dọc theo cạnh). */
    tileWidth: 1,
    /** Kích thước ô góc, cũng là chiều sâu của mọi ô. */
    cornerSize: 1.7,
    /** Độ dày của ô. */
    tileHeight: 0.28,
    /** Khe hở giữa các ô. */
    tileGap: 0.06,
    /** Độ bo góc của ô. */
    tileRadius: 0.07,
    /** Độ mịn của phần bo (số đoạn). */
    tileSmoothness: 4,
    /** Phần đế bàn cờ thò ra ngoài các ô. */
    baseMargin: 0.3,
    /** Độ dày của đế bàn cờ. */
    baseThickness: 0.55,
    /** Độ bo của đế. */
    baseRadius: 0.18,
    /** Phần giữa (bãi cỏ) thụt vào so với mép trong của các ô. */
    centerInset: 0.18,
    /** Bãi cỏ thấp hơn mặt ô bao nhiêu. */
    centerDrop: 0.12,
    /** Tỷ lệ chiều sâu ô dành cho dải màu nhóm (phía trong bàn cờ). */
    stripRatio: 0.3,
    /** Độ dày dải màu nhóm nhô lên khỏi mặt ô. */
    stripHeight: 0.03
  },
  colors: {
    base: "#f4efe6",
    baseSide: "#8d7f74",
    center: "#9ed97c",
    tile: "#fbf8f2",
    corner: "#fffaf0",
    chance: "#e8dcff",
    tax: "#ffe3d3",
    resort: "#d4f1e8",
    sand: "#f6e2b3",
    water: "#7fd3e6",
    start: "#ffe9a8",
    festival: "#ffd6e5",
    airport: "#dfe7f2",
    /** Sàn hứng bóng dưới bàn cờ. */
    shadowFloorOpacity: 0.22
  },
  /** Đồ trang trí trên các ô đặc biệt. */
  props: {
    /** Phóng to/thu nhỏ toàn bộ đồ trang trí. */
    scale: 1.3,
    trunk: "#b98a5e",
    leaf: "#5cc28a",
    gold: "#ffc94d",
    paper: "#ffffff",
    umbrella: "#ff8fab",
    tower: "#f2f4f8",
    glass: "#8fd0ff",
    flag: "#ff6f91",
    pole: "#d9d4cc"
  },
  buildings: {
    /** Kích thước cạnh một căn nhà. */
    houseSize: 0.3,
    /** Chiều cao tường nhà so với cạnh. */
    houseWallRatio: 0.85,
    /** Chiều cao mái nhà so với cạnh. */
    roofRatio: 0.6,
    /** Chiều cao thân Landmark. */
    landmarkHeight: 1.05,
    /** Bề ngang thân Landmark. */
    landmarkWidth: 0.4,
    wall: "#ffffff",
    window: "#a9d8f5"
  },
  /** Landmark riêng của từng thành phố (scene/CityLandmarks.tsx): bảng màu vật liệu. */
  landmarks: {
    /** Phóng to/thu nhỏ toàn bộ Landmark riêng. */
    scale: 1,
    /** Đế Landmark tô màu người sở hữu: độ dày. */
    plinth: 0.05,
    iron: "#8b6b57",
    stone: "#e3d0a2",
    stoneDark: "#c9b184",
    slate: "#4f5a6e",
    glass: "#cfdbe8",
    glassDark: "#9fb3c9",
    cream: "#f1e6cc",
    moss: "#86b86a",
    water: "#7fd3e6",
    gold: "#f2c14e",
    clock: "#fbf8f2",
    /** Vật liệu nhà nhỏ theo khu vực. */
    adobe: "#d9a066",
    adobeDark: "#7a4a2a",
    wood: "#c8935f",
    woodDark: "#8a5a3a",
    colonial: "#f6d6a8",
    whitewash: "#fbf6ec",
    lacquer: "#b03a32",
    paper: "#fbf3e4",
    townhouse: "#f3ead8",
    brick: "#a1593f",
    balcony: "#ffffff"
  },
  /** Màu mái nhà theo người chơi 1–4. */
  playerColors: ["#ff6f91", "#4da3ff", "#4cc983", "#ffb547"],
  material: {
    /** Độ nhám (0 = bóng, 1 = mờ). */
    roughness: 0.82,
    metalness: 0
  },
  lights: {
    hemisphere: {
      sky: "#ffffff",
      ground: "#c9b8a8",
      intensity: 1.6
    },
    sun: {
      color: "#fff4e5",
      intensity: 2.4,
      /** Hướng mặt trời quanh bàn cờ (độ). */
      azimuthDeg: 120,
      /** Độ cao mặt trời (độ). */
      elevationDeg: 52
    },
    shadow: {
      /** Độ phân giải bản đồ bóng (512 / 1024 / 2048 / 4096). */
      mapSize: 2048,
      /** Độ mềm mép bóng. */
      radius: 6,
      bias: -5e-4,
      normalBias: 0.02
    }
  },
  /** Ambient occlusion (bóng tối ở các góc khuất). */
  ao: {
    enabled: true,
    radius: 0.9,
    intensity: 2.2,
    distanceFalloff: 1,
    color: "#3d2e2a"
  },
  /** Quân cờ (Kenney Mini Characters / Cube Pets, CC0). */
  pieces: {
    /** Model và ảnh chân dung lấy theo skin của từng người chơi: config/skins.ts. */
    /** Chiều cao quân cờ (model được tự co về chiều cao này). */
    height: 0.62,
    /** Đế tròn màu người chơi dưới chân quân. */
    baseRadius: 0.16,
    baseHeight: 0.05,
    /** Khoảng lệch giữa các quân khi đứng chung một ô. */
    slotSpread: 0.2,
    /** Quân đứng lệch vào phía trong ô (tỷ lệ chiều sâu ô), để không che nhà. */
    anchorInset: 0.14,
    /** Như trên nhưng cho 4 ô góc, để không đứng lẫn vào đồ trang trí. */
    cornerInset: 0.27
  },
  /** Chọn ô trên bàn cờ (Lễ Hội, Sân Bay, Động Đất, bán tài sản…). */
  pick: {
    /** Màu tô ô chọn được: lựa chọn có lợi / có hại, và ô đang được chọn. */
    good: "#ffd84d",
    bad: "#ff5c8a",
    selected: "#ff2d6f",
    /** Độ đậm nhấp nháy (thấp nhất → cao nhất) và tốc độ. */
    opacityMin: 0.3,
    opacityMax: 0.8,
    pulseSpeed: 4,
    /** Ô không chọn được thì tối đi. */
    dimOpacity: 0.32,
    /** Ô chọn được nhô lên một chút. */
    lift: 0.06
  },
  /** Tên ô in trên mặt bàn cờ (chữ 3D phẳng). */
  tileText: {
    enabled: true,
    /** Font gộp Latin + tiếng Việt (Baloo 2, OFL) trong public/fonts. */
    font: "fonts/baloo2-800.woff",
    fontSize: 0.2,
    cornerFontSize: 0.25,
    /** Chữ đậm màu, viền sáng quanh chữ để đọc rõ trên mọi màu ô. */
    color: "#2d2a3e",
    outlineColor: "#ffffff",
    /** Độ dày viền chữ (tỷ lệ cỡ chữ). */
    outlineWidth: 0.14,
    lineHeight: 0.92,
    /** Giãn chữ theo chiều dọc để bù phần bị "dẹt" khi nhìn nghiêng (1 = không giãn). */
    stretch: 1.25,
    /** Khoảng cách từ mép ngoài ô vào trong (tỷ lệ chiều sâu ô): ô thường / ô góc. */
    edgeInset: 0.17,
    cornerEdgeInset: 0.1
  },
  /** Nhãn tiền thuê trên các ô có chủ. */
  tags: {
    enabled: true,
    /** Độ cao nhãn so với mặt ô. */
    height: 0.08
  },
  /** Xúc xắc ở giữa bàn cờ. */
  dice: {
    size: 0.5,
    /** Độ bo góc (tỷ lệ cạnh). */
    roundness: 0.18,
    color: "#e23a46",
    pipColor: "#fbfaf5",
    /** Bán kính chấm (tỷ lệ cạnh). */
    pipRatio: 0.1,
    /** Khoảng cách giữa hai viên. */
    spacing: 0.8,
    /** Số điểm vừa tung nổi cao bao nhiêu trên xúc xắc (bội số cạnh xúc xắc). */
    totalLift: 2.2
  },
  /** Viền vàng quanh ô quân cờ sẽ dừng sau khi tung. */
  target: {
    color: "#ffc928",
    /** Bề rộng viền và độ cao thanh viền. */
    thickness: 0.07,
    height: 0.05,
    /** Nâng viền khỏi mặt ô. */
    lift: 0.02,
    opacityMin: 0.55,
    opacityMax: 1,
    pulseSpeed: 5
  },
  /** Cây trang trí trên bãi cỏ (Kenney City Kit Suburban, CC0). Giữ khoảng giữa trống cho xúc xắc. */
  scenery: {
    enabled: true,
    scale: 1.8,
    items: [
      { model: "tree-large", x: 2.75, z: 2.3, rotationDeg: 0 },
      { model: "tree-small", x: 2.3, z: 2.8, rotationDeg: 40 },
      { model: "tree-large", x: -2.75, z: -2.3, rotationDeg: 90 },
      { model: "tree-small", x: -2.3, z: -2.8, rotationDeg: 10 },
      { model: "tree-large", x: -2.75, z: 2.6, rotationDeg: 30 },
      { model: "planter", x: -2.2, z: 2.85, rotationDeg: 0 },
      { model: "tree-small", x: 2.8, z: -2.7, rotationDeg: 60 },
      { model: "planter", x: 2.25, z: -2.85, rotationDeg: 90 }
    ]
  },
  /** Thời lượng (giây) và biên độ các animation. */
  animation: {
    /** Nghỉ giữa hai event. */
    eventGap: 0.05,
    diceRise: 0.35,
    diceFall: 0.4,
    diceBounce: 0.28,
    /** Độ cao xúc xắc bay lên. */
    diceHeight: 2.2,
    /** Số vòng xoay tối thiểu khi tung. */
    diceSpins: 2,
    /** Thời gian nhảy một ô. */
    hopDuration: 0.3,
    hopHeight: 0.42,
    /** Mức co giãn khi nhảy (0 = không co giãn). */
    squash: 0.18,
    /** Bay từ Sân Bay. */
    flyDuration: 1.2,
    flyHeight: 3,
    /** Dịch chuyển tức thời (thẻ, ra đảo): thu nhỏ rồi hiện lại. */
    teleportDuration: 0.5,
    /** Các quân xếp lại chỗ khi có quân rời/tới ô. */
    restackDuration: 0.25,
    /** Nhà/Landmark mọc lên. */
    buildDuration: 0.5,
    buildOvershoot: 1.15,
    dustCount: 12,
    dustDuration: 0.7,
    dustColor: "#efe4d2",
    /** Tiền bay. */
    coinCount: 6,
    coinDuration: 0.6,
    coinStagger: 0.08,
    coinHeight: 1.4,
    coinSize: 0.2,
    coinColor: "#ffc94d",
    /** Camera bám quân đang đi: mức zoom thêm và tốc độ bám. */
    cameraFollowZoom: 1.2,
    cameraFollowSpeed: 4,
    /** Dừng lại khi rút thẻ / đầu lượt. */
    cardPause: 0.6,
    turnPause: 0.25,
    /** Bot "suy nghĩ" trước mỗi quyết định. */
    botThinkDelay: 0.55,
    /** Bước tự làm cho người chơi (đi quân, trả thuê, kết thúc lượt). */
    autoActionDelay: 0.3,
    /** Thẻ Cơ Hội: thời gian lật, thời gian tự đóng khi bot rút / khi người chơi không bấm. */
    cardFlipDuration: 0.7,
    cardRevealBot: 2,
    cardRevealHuman: 8,
    /** Chữ lớn giữa màn hình (ĐÔI!, Ra Đảo…). */
    bannerDuration: 1.3,
    /** Số tiền trên khung người chơi chạy tới giá trị mới. */
    moneyCountDuration: 0.6
  },
  /** Nhà mẫu tạm hiển thị khi CHƯA có ván chơi (level: 1–3 nhà, 4 = Landmark; player: 1–4). */
  preview: {
    showBuildings: true,
    buildings: [
      { tile: 1, level: 1, player: 1 },
      { tile: 2, level: 2, player: 1 },
      { tile: 4, level: 3, player: 1 },
      { tile: 10, level: 4, player: 2 },
      { tile: 13, level: 2, player: 2 },
      { tile: 18, level: 3, player: 3 },
      { tile: 21, level: 4, player: 3 },
      { tile: 25, level: 1, player: 4 },
      { tile: 31, level: 4, player: 4 }
    ]
  }
};

// src/online/pacing.ts
var a = VISUAL.animation;
var coins = a.coinDuration + a.coinCount * a.coinStagger;
function eventSeconds(event) {
  switch (event.type) {
    case "TURN_STARTED":
      return a.turnPause;
    case "DICE_ROLLED":
      return a.diceRise + a.diceFall + a.diceBounce;
    case "PLAYER_MOVED":
      return event.mode === "WALK" ? event.steps * a.hopDuration : event.mode === "FLY" ? a.flyDuration : a.teleportDuration;
    case "PASSED_START":
    case "RENT_PAID":
    case "MONEY_PAID":
    case "MONEY_RECEIVED":
      return coins;
    case "BOUGHT_OUT":
      return coins + a.buildDuration;
    case "PROPERTY_BOUGHT":
    case "BUILT":
      return a.buildDuration;
    case "CARD_DRAWN":
      return a.cardRevealBot;
    case "DEBT_STARTED":
    case "EXTRA_ROLL":
      return a.cardPause;
    case "FESTIVAL_HOSTED":
    case "EARTHQUAKE_NO_TARGET":
    case "HOUSE_DESTROYED":
    case "PROPERTY_SOLD":
    case "RENT_WAIVED":
      return a.cardPause / 2;
    case "BANKRUPT":
      return a.teleportDuration;
    default:
      return 0;
  }
}
function animationMs(events) {
  const seconds = events.reduce((sum, e) => sum + eventSeconds(e) + a.eventGap, 0);
  return Math.round(seconds * 1.15 * 1e3);
}

// src/online/room.ts
var BOT_NAMES = ["Minh", "Lan", "Tu\u1EA5n", "Hoa", "Khang", "Vy"];
function randomCode(rng) {
  let code2 = "";
  for (let i = 0; i < NET.codeLength; i++) code2 += NET.codeAlphabet[rng.int(NET.codeAlphabet.length)];
  return code2;
}
function randomToken(rng) {
  let token2 = "";
  for (let i = 0; i < 32; i++) token2 += "abcdefghijklmnopqrstuvwxyz0123456789"[rng.int(36)];
  return token2;
}
function createRoom(code2, mode, capacity, now) {
  return {
    code: code2,
    mode,
    capacity: mode === "quick" ? NET.maxPlayers : Math.min(NET.maxPlayers, Math.max(NET.minPlayers, Math.floor(capacity) || NET.maxPlayers)),
    createdAt: now,
    quickDeadline: mode === "quick" ? now + NET.quickWaitSec * 1e3 : null,
    seats: [],
    game: null,
    matchId: "",
    busyUntil: now,
    deadline: null,
    seq: 0,
    log: []
  };
}
var seatOf = (room, token2) => room.seats.find((s) => s.token !== null && s.token === token2);
function connected(seat, now) {
  return seat.kind === "human" && now - seat.lastSeen <= NET.disconnectSec * 1e3;
}
function joinRoom(room, request, token2, now, rng) {
  if (room.game) throw new GameRuleError("V\xE1n \u0111\xE3 b\u1EAFt \u0111\u1EA7u");
  if (room.seats.length >= room.capacity) throw new GameRuleError("Ph\xF2ng \u0111\xE3 \u0111\u1EE7 ng\u01B0\u1EDDi");
  const base = String(request.name ?? "").trim().slice(0, META.maxNameLength) || META.defaultName;
  let name = base;
  for (let n = 2; room.seats.some((s) => s.name === name); n++) name = `${base} ${n}`;
  let skin = skinById(request.skin).id;
  if (room.seats.some((s) => s.skin === skin)) skin = SEAT_SKINS.find((k) => !room.seats.some((s) => s.skin === k)) ?? skin;
  room.seats.push({ token: token2, name, skin, kind: "human", playerId: null, lastSeen: now });
  if (room.seats.length >= room.capacity) start(room, now, rng);
  return room.seats.length - 1;
}
function requestStart(room, token2, now, rng) {
  if (room.game) return;
  if (room.seats[0]?.token !== token2) throw new GameRuleError("Ch\u1EC9 ch\u1EE7 ph\xF2ng \u0111\u01B0\u1EE3c b\u1EAFt \u0111\u1EA7u");
  if (room.seats.filter((s) => s.kind === "human").length < NET.minPlayers) {
    throw new GameRuleError(`C\u1EA7n \xEDt nh\u1EA5t ${NET.minPlayers} ng\u01B0\u1EDDi \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u`);
  }
  start(room, now, rng);
}
function fillBots(room) {
  const names = new Set(room.seats.map((s) => s.name));
  const skins = new Set(room.seats.map((s) => s.skin));
  while (room.seats.length < room.capacity) {
    const name = BOT_NAMES.find((n) => !names.has(n)) ?? `Bot ${room.seats.length + 1}`;
    names.add(name);
    const skin = SEAT_SKINS.find((s) => !skins.has(s)) ?? SEAT_SKINS[room.seats.length % SEAT_SKINS.length];
    skins.add(skin);
    room.seats.push({ token: null, name, skin, kind: "bot", playerId: null, lastSeen: 0 });
  }
}
function start(room, now, rng) {
  if (room.game) return;
  const game = createGame(
    room.seats.map((s) => ({ name: s.name, isBot: s.kind === "bot" })),
    rng.int(2 ** 31 - 1)
  );
  room.seats.forEach((s, i) => {
    s.playerId = game.players[i].id;
  });
  room.game = game;
  room.quickDeadline = null;
  room.matchId = `${room.code}-${now}`;
  room.busyUntil = now;
  room.deadline = null;
}
function leaveRoom(room, token2) {
  const seat = seatOf(room, token2);
  if (!seat) return;
  if (!room.game) {
    room.seats = room.seats.filter((s) => s !== seat);
    return;
  }
  seat.kind = "bot";
  seat.token = null;
}
function apply(room, action, now, rng) {
  const game = room.game;
  if (!game) return;
  const { state, events } = applyAction({ ...game, rngState: rng.int(2 ** 31 - 1) | 0 }, action);
  room.game = state;
  room.busyUntil = Math.max(now, room.busyUntil) + animationMs(events);
  room.deadline = null;
  room.seq++;
  room.log.push({ seq: room.seq, events });
  if (room.log.length > NET.logSize) room.log.splice(0, room.log.length - NET.logSize);
}
function intent(room, token2, action, now, rng) {
  const seat = seatOf(room, token2);
  const game = room.game;
  if (!game || !seat?.playerId) throw new GameRuleError("V\xE1n ch\u01B0a b\u1EAFt \u0111\u1EA7u");
  seat.lastSeen = now;
  if (seat.kind !== "human") throw new GameRuleError("Gh\u1EBF n\xE0y \u0111\xE3 giao cho bot");
  if (currentPlayer(game).id !== seat.playerId) throw new GameRuleError("Ch\u01B0a t\u1EDBi l\u01B0\u1EE3t c\u1EE7a b\u1EA1n");
  apply(room, { ...action, playerId: seat.playerId }, now, rng);
}
function touch(room, token2, now) {
  const seat = seatOf(room, token2);
  if (!seat || seat.kind !== "human") return false;
  if (now - seat.lastSeen < 3e3) return false;
  seat.lastSeen = now;
  return true;
}
function tick(room, now, rng) {
  let changed = false;
  if (!room.game) {
    if (room.mode === "quick" && room.quickDeadline !== null && now >= room.quickDeadline && room.seats.length > 0) {
      fillBots(room);
      start(room, now, rng);
      changed = true;
    } else {
      return false;
    }
  }
  for (const seat of room.seats) {
    if (seat.kind === "human" && now - seat.lastSeen > NET.reconnectSec * 1e3) {
      seat.kind = "bot";
      seat.token = null;
      changed = true;
    }
  }
  const isHuman = (id) => {
    const seat = room.seats.find((s) => s.playerId === id);
    return seat !== void 0 && connected(seat, now);
  };
  for (let guard = 0; guard < 200; guard++) {
    const game = room.game;
    if (!game || game.phase !== "playing") {
      if (room.deadline) {
        room.deadline = null;
        changed = true;
      }
      break;
    }
    const me = currentPlayer(game);
    const auto = autoAction(game, isHuman, () => NET.botLevel);
    if (auto) {
      const think = (isHuman(me.id) ? VISUAL.animation.autoActionDelay : VISUAL.animation.botThinkDelay) * 1e3;
      if (now < room.busyUntil + think) break;
      safeApply(room, auto, now, rng);
      changed = true;
      continue;
    }
    if (!room.deadline || room.deadline.playerId !== me.id) {
      const startedAt = Math.max(now, room.busyUntil);
      room.deadline = { playerId: me.id, startedAt, endsAt: startedAt + ECONOMY.turnTimeLimitSec * 1e3 };
      changed = true;
    }
    if (now < room.deadline.endsAt) break;
    safeApply(room, getTimeoutAction(game), now, rng);
    changed = true;
  }
  return changed;
}
function safeApply(room, action, now, rng) {
  if (!action) return;
  try {
    apply(room, action, now, rng);
  } catch (error) {
    if (!(error instanceof GameRuleError)) throw error;
  }
}
function sanitize(state) {
  return { ...state, rngState: 0 };
}
function seatInfo(room, now) {
  return room.seats.map((s, i) => ({
    playerId: s.playerId,
    name: s.name,
    skin: s.skin,
    kind: s.kind,
    connected: s.kind === "bot" || connected(s, now),
    isHost: i === 0
  }));
}
function deadlineInfo(room, now) {
  if (!room.deadline) return null;
  return {
    playerId: room.deadline.playerId,
    remainingMs: Math.max(0, room.deadline.endsAt - now),
    totalMs: room.deadline.endsAt - room.deadline.startedAt
  };
}
function viewFor(room, token2, since, now) {
  const you = room.seats.findIndex((s) => s.token !== null && s.token === token2);
  const lobby = {
    code: room.code,
    mode: room.mode,
    capacity: room.capacity,
    seats: seatInfo(room, now),
    you,
    quickRemainingMs: room.quickDeadline === null ? null : Math.max(0, room.quickDeadline - now),
    started: room.game !== null
  };
  if (!room.game) return { lobby, game: null, deadline: null };
  const oldest = room.log[0]?.seq ?? room.seq + 1;
  const full = since < 0 || since > room.seq || since < room.seq && since + 1 < oldest;
  const events = full ? [] : room.log.filter((b) => b.seq > since).flatMap((b) => b.events);
  return {
    lobby,
    game: {
      matchId: room.matchId,
      you: you >= 0 ? room.seats[you].playerId : null,
      state: sanitize(room.game),
      seq: room.seq,
      full,
      events
    },
    deadline: deadlineInfo(room, now)
  };
}

// src/online/handler.ts
var HttpError = class extends Error {
  status;
  constructor(status, message) {
    super(message);
    this.status = status;
  }
};
var roomKey = (code2) => `estate:room:${code2}`;
var QUICK_KEY = "estate:quick";
var CODE_RE = new RegExp(`^[${NET.codeAlphabet}]{${NET.codeLength}}$`);
function str(value, max) {
  return typeof value === "string" ? value.slice(0, max) : "";
}
function code(value) {
  const c = str(value, 16).trim().toUpperCase();
  if (!CODE_RE.test(c)) throw new HttpError(400, "M\xE3 ph\xF2ng kh\xF4ng h\u1EE3p l\u1EC7.");
  return c;
}
function token(value) {
  const t = str(value, 64);
  if (!/^[a-z0-9]{32}$/.test(t)) throw new HttpError(401, "Phi\xEAn ch\u01A1i kh\xF4ng h\u1EE3p l\u1EC7.");
  return t;
}
function joinRequest(body) {
  return { name: str(body.name, 40), skin: str(body.skin, 40) };
}
function createApi(store, deps) {
  const { now, rng } = deps;
  const requireStore = () => {
    if (!store) throw new HttpError(503, "Ch\u01B0a c\u1EA5u h\xECnh kho d\u1EEF li\u1EC7u online. Ch\u1EE7 game c\u1EA7n th\xEAm Upstash Redis tr\xEAn Vercel.");
    return store;
  };
  const load = async (c) => {
    const raw = await requireStore().read(roomKey(c));
    return { raw, room: raw ? JSON.parse(raw) : null };
  };
  async function mutate(c, fn) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const { raw, room } = await load(c);
      if (!room) throw new HttpError(404, "Kh\xF4ng t\xECm th\u1EA5y ph\xF2ng.");
      const { changed, result } = fn(room);
      if (!changed) return result;
      if (await requireStore().write(roomKey(c), raw, JSON.stringify(room), NET.roomTtlSec)) return result;
    }
    throw new HttpError(409, "Ph\xF2ng \u0111ang b\u1EADn, th\u1EED l\u1EA1i nh\xE9.");
  }
  async function createAndJoin(mode, capacity, join) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const c = randomCode(rng);
      const t = randomToken(rng);
      const room = createRoom(c, mode, capacity, now());
      joinRoom(room, join, t, now(), rng);
      if (await requireStore().write(roomKey(c), null, JSON.stringify(room), NET.roomTtlSec)) {
        return { code: c, token: t, view: viewFor(room, t, -1, now()) };
      }
    }
    throw new HttpError(500, "Kh\xF4ng t\u1EA1o \u0111\u01B0\u1EE3c ph\xF2ng, th\u1EED l\u1EA1i nh\xE9.");
  }
  async function joinExisting(c, join) {
    const t = randomToken(rng);
    const view = await mutate(c, (room) => {
      tick(room, now(), rng);
      joinRoom(room, join, t, now(), rng);
      return { changed: true, result: viewFor(room, t, -1, now()) };
    });
    return { code: c, token: t, view };
  }
  async function quick(join) {
    const s = requireStore();
    const pointer = await s.read(QUICK_KEY);
    if (pointer) {
      try {
        const joined = await joinExisting(pointer, join);
        if (joined.view.lobby.started) await s.write(QUICK_KEY, pointer, "", 60);
        return joined;
      } catch (error) {
        if (!(error instanceof GameRuleError) && !(error instanceof HttpError)) throw error;
      }
    }
    const created = await createAndJoin("quick", NET.maxPlayers, join);
    await s.write(QUICK_KEY, pointer, created.code, NET.quickWaitSec + 30);
    return created;
  }
  async function poll(c, t, since) {
    return mutate(c, (room) => {
      if (!room.seats.some((s) => s.token === t)) throw new HttpError(403, "B\u1EA1n kh\xF4ng c\xF2n \u1EDF trong ph\xF2ng n\xE0y.");
      const changed = tick(room, now(), rng) || touch(room, t, now());
      return { changed, result: viewFor(room, t, since, now()) };
    });
  }
  return async function handle(method, query, rawBody) {
    try {
      if (method === "GET") {
        if (query.get("op") === "health") return { status: 200, body: { ok: true, storage: store?.mode ?? "unconfigured", onlineReady: store !== null } };
        const since = Number(query.get("since") ?? -1);
        return { status: 200, body: await poll(code(query.get("code")), token(query.get("token")), Number.isFinite(since) ? since : -1) };
      }
      if (method !== "POST") throw new HttpError(405, "Ph\u01B0\u01A1ng th\u1EE9c kh\xF4ng \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3.");
      const body = rawBody && typeof rawBody === "object" ? rawBody : {};
      switch (body.op) {
        case "create":
          return { status: 200, body: await createAndJoin("private", Number(body.capacity), joinRequest(body)) };
        case "quick":
          return { status: 200, body: await quick(joinRequest(body)) };
        case "join":
          return { status: 200, body: await joinExisting(code(body.code), joinRequest(body)) };
        case "poll":
          return { status: 200, body: await poll(code(body.code), token(body.token), Number(body.since ?? -1)) };
        case "start": {
          const c = code(body.code);
          const t = token(body.token);
          return {
            status: 200,
            body: await mutate(c, (room) => {
              requestStart(room, t, now(), rng);
              return { changed: true, result: viewFor(room, t, -1, now()) };
            })
          };
        }
        case "intent": {
          const c = code(body.code);
          const t = token(body.token);
          const action = body.action;
          if (!action || typeof action !== "object" || typeof action.type !== "string") {
            throw new HttpError(400, "\xDD \u0111\u1ECBnh kh\xF4ng h\u1EE3p l\u1EC7.");
          }
          const since = Number(body.since ?? -1);
          return {
            status: 200,
            body: await mutate(c, (room) => {
              tick(room, now(), rng);
              intent(room, t, action, now(), rng);
              return { changed: true, result: viewFor(room, t, since, now()) };
            })
          };
        }
        case "leave": {
          const c = code(body.code);
          const t = token(body.token);
          await mutate(c, (room) => {
            leaveRoom(room, t);
            return { changed: true, result: null };
          });
          return { status: 200, body: { ok: true } };
        }
        default:
          throw new HttpError(400, "Y\xEAu c\u1EA7u kh\xF4ng h\u1EE3p l\u1EC7.");
      }
    } catch (error) {
      if (error instanceof HttpError) return { status: error.status, body: { error: error.message } };
      if (error instanceof GameRuleError) return { status: 400, body: { error: error.message } };
      console.error("[estate-api]", error);
      return { status: 500, body: { error: "C\xF3 l\u1ED7i m\xE1y ch\u1EE7. Vui l\xF2ng th\u1EED l\u1EA1i." } };
    }
  };
}

// src/online/store.ts
function memoryStore() {
  const data = /* @__PURE__ */ new Map();
  const get = (key) => {
    const entry = data.get(key);
    if (!entry) return null;
    if (entry.expires < Date.now()) {
      data.delete(key);
      return null;
    }
    return entry.value;
  };
  return {
    mode: "memory",
    read: async (key) => get(key),
    write: async (key, before, value, ttlSec) => {
      if (get(key) !== before) return false;
      data.set(key, { value, expires: Date.now() + ttlSec * 1e3 });
      return true;
    }
  };
}
var CAS_SCRIPT = "local cur=redis.call('GET',KEYS[1]); if (ARGV[1]=='__NEW__' and cur==false) or cur==ARGV[1] then redis.call('SET',KEYS[1],ARGV[2],'EX',ARGV[3]); return 1 else return 0 end";
function redisStore(url, token2) {
  const command = async (args) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token2}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(8e3)
    });
    if (!response.ok) throw new Error(`Redis HTTP ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error("Redis error");
    return data.result;
  };
  return {
    mode: "redis",
    read: async (key) => {
      const result = await command(["GET", key]);
      return typeof result === "string" ? result : null;
    },
    write: async (key, before, value, ttlSec) => await command(["EVAL", CAS_SCRIPT, 1, key, before ?? "__NEW__", value, ttlSec]) === 1
  };
}
function storeFromEnv(env) {
  const found = redisCredentials(env);
  if (found) return redisStore(found.url, found.token);
  return env.VERCEL ? null : memoryStore();
}
function redisCredentials(env) {
  const pairs = [
    ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    ["KV_REST_API_URL", "KV_REST_API_TOKEN"]
  ];
  for (const name of Object.keys(env)) {
    if (name.endsWith("KV_REST_API_URL")) pairs.push([name, name.replace(/URL$/, "TOKEN")]);
    if (name.endsWith("REDIS_REST_URL")) pairs.push([name, name.replace(/URL$/, "TOKEN")]);
  }
  for (const [urlName, tokenName] of pairs) {
    const url = env[urlName];
    const token2 = env[tokenName];
    if (url && token2 && url.startsWith("https://")) return { url, token: token2 };
  }
  return null;
}

// src/online/vercel.ts
var api = createApi(storeFromEnv(process.env), {
  now: () => Date.now(),
  rng: { int: (max) => randomInt(0, max) }
});
async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = body.length > 8192 ? null : JSON.parse(body);
    } catch {
      body = null;
    }
  }
  const url = new URL(req.url ?? "/", "http://local");
  const result = await api(req.method ?? "GET", url.searchParams, body);
  res.statusCode = result.status;
  res.end(JSON.stringify(result.body));
}
export {
  handler as default
};
