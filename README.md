# Software Testing Assignment (15%) — Workshop Review + Unit Test

ผู้ทำ: **กวีวิศลย์ กฤษดาวิวัฒน์** · รหัสนักศึกษา **682132001** · GitHub: [Kaveewison](https://github.com/Kaveewison)

repo นี้ fork มาจาก [boyone/camt-software-testing](https://github.com/boyone/camt-software-testing) (workshop *Software Testing in Real Industry*, 3–4 ต.ค. 2026)
งานแต่ละส่วนแยกอยู่คนละ branch — README นี้บอกว่าอะไรอยู่ที่ไหนและรันอย่างไร
คู่มือ workshop เดิมของผู้สอนย้ายไปอยู่ที่ [WORKSHOP.md](WORKSHOP.md)

| ส่วนของงาน | branch | เริ่มอ่านที่ |
|---|---|---|
| 1. Workshop Review & Git History | `jest/lab/00-setup` … `jest/lab/04-test-data` | [ส่วนที่ 1](#ส่วนที่-1--workshop-review--git-history) |
| 2.1, 2.3 Election App Unit Testing | `test/candidate` | [`election-app/README.md`](https://github.com/Kaveewison/camt-software-testing/blob/test/candidate/election-app/README.md) |
| 2.2 Code Comparison (โบนัส) | `election/original` เทียบกับ `test/candidate` | หัวข้อ 4 ใน `election-app/README.md` |

---

## ส่วนที่ 1 — Workshop Review & Git History

ทำ lab ของ workshop ใหม่ทีละ branch ชื่อ branch ตรงกับต้นฉบับ แต่ละขั้นเป็น 1 commit
**คำอธิบายแนวคิดและผลการทดลองของแต่ละขั้นอยู่ใน commit message** ดูได้ด้วย:

```bash
git log --reverse --author=ZeaSigN origin/jest/lab/02-aaa-unit   # เฉพาะ commit ที่ทำเอง (commit ของผู้สอนเป็น boyone)
```

| branch | แนวคิดที่ฝึก | งานที่ทำ | สถานะ |
|---|---|---|---|
| `jest/lab/00-setup` | test boundary 3 ระดับ (unit / integration / e2e), เทสต์ต้อง "แดงได้" เมื่อโค้ดผิด, dependency injection | รัน doctor, เทียบเวลาและความแม่นของ 3 ระดับ, ทำ checksum ให้ผิดแล้วดูว่าเทสต์ไหนแดง, อ่าน `createApp(deps)` และ `voteRoutes` | ข้อ 1–4 ✅ · ข้อ 5 ⏳ |
| `jest/lab/01-boundaries` | unit / integration / component / contract / e2e, test pyramid, เลือกระดับต่ำที่สุดที่ยังมั่นใจพอ | จัดกลุ่ม test case 16 ข้อใน `labs/01-boundaries/worksheet.md` | Part A ✅ · Part B, C ⏳ |
| `jest/lab/02-aaa-unit` | Arrange–Act–Assert, test smells (Obscure Test, Eager Test, Assertion Roulette, Conditional Logic), `it.each`, `describe` ซ้อน | หา smell ใน `lab02-smelly.test.ts` แล้วแยกเป็น `thaiNationalId` / `passwords` / `config` / `toPublicUser` test | ✅ |
| `jest/lab/03-test-doubles` | dummy, stub, spy, mock, fake, seam, fake timers | `accountService.test.ts`, fake repository ใน `test/support/`, `electionAdminService.test.ts`, `jwtTokenService.test.ts` | ✅ |
| `jest/lab/04-test-data` | Liquibase (update / tag / rollback / contexts / checksum), test data builder + faker, Fresh Fixture vs Shared Fixture, seed generator | ฝึก Liquibase A1.1–A3, `builders.ts`, component test `elections.test.ts`, `scripts/generate-user-seed.ts` | ✅ (ยังไม่ทำ Stretch) |

### รัน lab

ต้องมี **Node.js 24** และ **Docker** (unit test ไม่ต้องใช้ Docker)

```bash
git switch jest/lab/04-test-data
cd app
npm ci
npm run test:unit          # unit test
npm run test:integration   # เปิด Postgres ใน Docker + Liquibase แล้วรัน component test
```

ตรวจความพร้อมของเครื่องด้วย `npm run doctor` (ต้องได้ 9/9) · ปิด container ทั้งหมดด้วย `npm run db:down`

---

## ส่วนที่ 2 — Election App Unit Testing

ทดสอบ **ส่วนจัดการผู้สมัครเลือกตั้ง** (`ElectionService.addCandidate / updateCandidate / deleteCandidate`) ของ backend ที่ทำในวิชา 953713 Software Backend Development (Express 5 + Prisma 7 + PostgreSQL) โค้ดอยู่ในโฟลเดอร์ `election-app/`

```bash
git switch test/candidate
cd election-app
npm install
npm test          # ไม่ต้องมี DB, Docker หรือ .env — ได้ 31 passed
```

| ข้อ | อยู่ที่ |
|---|---|
| 2.1 Unit Test Design | `election-app/README.md` หัวข้อ 2–3 |
| 2.2 Code Comparison | branch `election/original` (โค้ดเดิม, commit `2fc3d87`) เทียบกับ `test/candidate` · ตาราง V&V ใน `election-app/README.md` หัวข้อ 4 · `git diff origin/election/original origin/test/candidate -- election-app/src` |
| 2.3.1–2.3.6 Success / Failure / Stub / Spy / Mock / Faker | `election-app/test/services/election.service.candidate.test.ts` (ตารางพร้อมลิงก์บรรทัดใน `election-app/README.md` หัวข้อ 2) |

สรุปผล: เทสต์ 31 ข้อ เจอ bug ในโค้ดเดิม 4 จุด (หมายเลขผู้สมัครติดลบ/ทศนิยม, แก้ชื่อผู้สมัครผ่าน API ไม่ได้, เปลี่ยนพรรคชน unique constraint, boundary ของ `updateCandidate`) — แต่ละ bug บันทึกด้วย `it.failing` ก่อน แล้วแก้ใน commit ถัดไป

---

## แนวคิดทางทฤษฎีที่ใช้ (สรุป)

| แนวคิด | ใช้ที่ไหน |
|---|---|
| **Test boundaries & Test Pyramid** — unit เยอะ เร็ว ชี้จุดพังแม่น · e2e น้อย ช้า แต่ใกล้ของจริง | Lab 00, 01 |
| **Arrange–Act–Assert** — 1 test = 1 พฤติกรรม, Act ครั้งเดียว, ไม่มี logic ในเทสต์ | Lab 02, Election App |
| **Test smells** (xUnit Test Patterns) | Lab 02 |
| **Test doubles** — dummy / stub / spy / mock / fake และ **seam** ที่ใช้เสียบ | Lab 03, Election App |
| **Fake timers vs inject Clock** — เวลาเป็น dependency | Lab 03 |
| **Database versioning** — schema เป็นโค้ด, checksum ห้ามแก้ changeset เก่า, contexts | Lab 04 |
| **Test Data Builder + Faker (seeded)** และ **Fresh Fixture** | Lab 04, Election App |
| **Boundary Value Analysis** | Lab 01 worksheet, Election App |
| **Verification & Validation** | Election App ข้อ 2.2 |

## อ้างอิง

- Toby Clemson — [*Testing Strategies in a Microservice Architecture*](https://martinfowler.com/articles/microservice-testing/)
- Gerard Meszaros — [*xUnit Test Patterns*](http://xunitpatterns.com/)
- คู่มือ workshop ต้นฉบับ: [WORKSHOP.md](WORKSHOP.md)
