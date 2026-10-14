# Election App — Unit Testing ส่วนจัดการผู้สมัคร

งานส่วนที่ 2 ของ Software Testing Assignment (15%)
ทดสอบ **ส่วนจัดการผู้สมัครเลือกตั้ง** ของ backend ที่ทำในวิชา 953713 Software Backend Development
(repo กลุ่ม: [953713-software-backend-development-final-project](https://github.com/thanapon1406/953713-software-backend-development-final-project), commit `32d103e`)

- **Stack:** Express 5 · Prisma 7 · PostgreSQL · TypeScript
- **เครื่องมือทดสอบ:** Jest 30 · ts-jest · @faker-js/faker 9
- **ขอบเขต:** `ElectionService` — `addCandidate`, `updateCandidate`, `deleteCandidate`
  ([src/services/election.service.ts](src/services/election.service.ts))
- **branch:** `election/original` (โค้ดเดิม) · `test/candidate` (เทสต์ + โค้ดที่ปรับปรุง)

---

## 1. วิธีติดตั้งและรันเทสต์

ต้องมี **Node.js 24** ขึ้นไป · **ไม่ต้องมี database, Docker หรือไฟล์ `.env`** เพราะ unit test แทน repository ทุกตัวด้วย test double

```bash
git clone https://github.com/Kaveewison/camt-software-testing.git
cd camt-software-testing
git switch test/candidate
cd election-app
npm install
npm test
```

`npm test` จะรัน `prisma generate` ให้อัตโนมัติก่อน (script `pretest`) เพราะโค้ด import type จาก `src/generated/prisma`

ผลที่ควรได้:

```
Test Suites: 1 passed, 1 total
Tests:       31 passed, 31 total
```

คำสั่งอื่น:

| คำสั่ง | ทำอะไร |
|---|---|
| `npm test` | รัน unit test ทั้งหมด |
| `npx jest --verbose` | ดูชื่อเทสต์ทุกข้อ (อ่านแล้วเป็นเหมือน spec) |
| `npm run test:coverage` | รันพร้อมรายงาน coverage (ไฟล์ HTML อยู่ที่ `coverage/`) |

ไฟล์ที่เกี่ยวกับการทดสอบ:

| ไฟล์ | หน้าที่ |
|---|---|
| [jest.config.js](jest.config.js) | เทสต์อยู่ใน `test/`, ใช้ ts-jest, `clearMocks` ทุกเทสต์ |
| [tsconfig.test.json](tsconfig.test.json) | type-check ทั้ง `src/` และ `test/` โดยไม่แก้ `tsconfig.json` เดิม |
| [test/support/seedFaker.ts](test/support/seedFaker.ts) | `faker.seed()` ใน `beforeEach` ข้อมูลสุ่มได้ชุดเดิมทุกรอบ |
| [test/support/builders.ts](test/support/builders.ts) | Test Data Builder: `aUser`, `aParty`, `aConstituency`, `aCandidate` |
| [test/services/election.service.candidate.test.ts](test/services/election.service.candidate.test.ts) | unit test ทั้งหมด 31 ข้อ |

---

## 2. Unit Test ตามข้อ 2.3

| ข้อ | สิ่งที่ต้องมี | เทสต์ |
|---|---|---|
| 2.3.1 | Success (happy path) | [`2.3.1 Success + 2.3.3 Stub: adds a user who lives in the constituency as a candidate`](test/services/election.service.candidate.test.ts#L47) |
| 2.3.2 | Alternative / Failure | [กลุ่ม `2.3.2 Failure + 2.3.5 Mock`](test/services/election.service.candidate.test.ts#L150) — ผู้ใช้อยู่คนละเขต, หมายเลขซ้ำ, เป็นผู้สมัครอยู่แล้ว, ไม่พบพรรค, ข้อมูลจำเป็นหาย (8 เทสต์) |
| 2.3.3 | Stub | [`givenEverythingIsAvailable()`](test/services/election.service.candidate.test.ts#L32) — stub repository 5 ฟังก์ชันให้ตอบว่า "มีอยู่และยังว่าง" แต่ละเทสต์แก้คำตอบเดียวที่ทำให้ล้ม |
| 2.3.4 | Spy | [กลุ่ม `2.3.4 Spy`](test/services/election.service.candidate.test.ts#L58) — `jest.spyOn(candidateRepo, 'create')` ดูว่าส่ง `connect` ของ user/party/constituency ถูก และ `policy` เป็น `null` เมื่อไม่ส่งมา |
| 2.3.5 | Mock | กลุ่ม 2.3.2 ทุกข้อตรวจ `expect(candidateRepo.create).not.toHaveBeenCalled()` — เมื่อข้อมูลผิดต้องไม่เขียนอะไรลง DB |
| 2.3.6 | Faker | [`2.3.6 Faker: passes any generated candidate through unchanged`](test/services/election.service.candidate.test.ts#L86) — id, หมายเลข, นโยบายสุ่มด้วย `faker`/`fakerTH` แล้วตรวจว่าส่งต่อครบ |

เทสต์เพิ่มเติม:

- **Boundary value ของ `candidateNumber`** — `addCandidate` ([L120](test/services/election.service.candidate.test.ts#L120)) และ `updateCandidate` ([L317](test/services/election.service.candidate.test.ts#L317))
- **`updateCandidate`** 11 เทสต์ ([L211](test/services/election.service.candidate.test.ts#L211)) · **`deleteCandidate`** 2 เทสต์ ([L328](test/services/election.service.candidate.test.ts#L328))

---

## 3. แนวคิดทางทฤษฎีที่ใช้

**Unit test แบบ solitary** — ทดสอบ `ElectionService` ตัวเดียว ส่วน repository (ที่คุยกับ Prisma/PostgreSQL) ถูกแทนด้วย test double ทั้งหมด เทสต์จึงเร็ว (~1 วินาที) ไม่ต้องมี DB และถ้าแดงก็รู้ทันทีว่าพังที่ logic ของ service

**Arrange / Act / Assert** — ทุกเทสต์แบ่ง 3 ส่วนชัดเจน มี Act ครั้งเดียว ไม่มี `if`/`for` ในเทสต์ (ใช้ `it.each` แทน) และตั้งชื่อเทสต์ตามพฤติกรรม เช่น `rejects a party that already has a candidate in the constituency`

**Test Double** (Gerard Meszaros, *xUnit Test Patterns*) — `jest.fn()` ตัวเดียวเป็นได้หลายแบบ ต่างกันที่ "ใช้ทำอะไร"

| แบบ | ใช้ทำอะไร | ในงานนี้ |
|---|---|---|
| Stub | ป้อน input ทางอ้อมที่เราควบคุม | `userRepo.findById` คืนผู้ใช้ในเขต 5 |
| Spy | บันทึก output ทางอ้อมไว้ตรวจทีหลัง | ดู argument ที่ส่งให้ `candidateRepo.create` |
| Mock | ตรวจว่าถูกเรียก / ไม่ถูกเรียกอย่างไร | `create`, `update`, `remove` ต้องไม่ถูกเรียกเมื่อข้อมูลผิด |

**Seam** — โค้ดเดิม import repository เป็น module ตรง ๆ (ไม่มี dependency injection) จุดเดียวที่เสียบ double ได้คือ `jest.mock()` ทั้ง module ต้อง mock `upload.service` ด้วย ทั้งที่ไม่เกี่ยวกับผู้สมัคร เพื่อไม่ให้โหลด S3/Supabase client

**Test Data Builder + Faker** — builder เติมค่าที่ไม่สำคัญด้วยข้อมูลสมจริง (ชื่อไทยจาก `fakerTH`, เลขบัตรประชาชนที่ checksum ถูก) เทสต์ระบุเฉพาะค่าที่สำคัญ เช่น `aUser({ constituencyId: 5 })` และใช้ `faker.seed()` ให้ข้อมูลสุ่มเหมือนเดิมทุกรอบ ถ้าเทสต์แดงเพราะข้อมูลจะทำซ้ำได้

**Boundary Value Analysis** — spec: "หมายเลขผู้สมัครเป็นจำนวนเต็มบวก" จึงทดสอบที่ขอบ `0` / `1` และค่านอกโดเมน `-1`, `1.5`

**`it.failing` สำหรับ bug ที่เจอ** — เขียนเทสต์ตาม spec ที่ถูกต้องแล้วทำเครื่องหมาย `it.failing` ไว้ suite ยังเขียว แต่ bug ถูกบันทึกไว้ในโค้ด พอแก้ bug เทสต์จะแดง (เป็นสัญญาณให้เปลี่ยนเป็น `it` ธรรมดา) — เห็นได้ใน git history ทีละ commit

**ตรวจว่าเทสต์จับ bug ได้จริง** — ทุกขั้นลองใส่ bug ลงในโค้ดชั่วคราว (เช่นกลับเงื่อนไข, ปิดการตรวจ) แล้วดูว่าเทสต์ที่ควรแดงแดงจริง จากนั้นแก้กลับ (แนวคิดเดียวกับ mutation testing)

---

## 4. Verification & Validation — เปรียบเทียบโค้ดเดิมกับโค้ดที่ปรับปรุง (ข้อ 2.2)

| branch | เนื้อหา |
|---|---|
| `election/original` | **โค้ดเดิม** ที่ส่งวิชา Backend คัดลอกจาก repo กลุ่มโดยไม่แก้ (commit `2fc3d87`) |
| `test/candidate` | **โค้ดที่ปรับปรุง** หลังเขียนเทสต์ — ต่อจาก `election/original` ทีละ commit |

ดูความต่างของโค้ดทั้งหมด:

```bash
git diff origin/election/original origin/test/candidate -- election-app/src
```

> **Verification** — สร้างระบบ *ถูกต้องตาม spec* ไหม (เทสต์พิสูจน์ว่าโค้ดทำตามกฎที่กำหนด)
> **Validation** — สร้าง *ระบบที่ผู้ใช้ต้องการจริง* ไหม (กรรมการ กกต. ใช้งานหน้าจัดการผู้สมัครได้จริง)

### สิ่งที่เปลี่ยน

| # | ปัญหาในโค้ดเดิม | เจอด้วยเทสต์ | แก้อย่างไร | V&V |
|---|---|---|---|---|
| 1 | `addCandidate` รับ `candidateNumber` ติดลบหรือทศนิยม (`-1`, `1.5`) แล้วบันทึกลง DB เพราะตรวจแค่ `!candidateNumber` | boundary value | ตรวจ `Number.isInteger` และ `>= 1` | Verification — ไม่ตรง spec "จำนวนเต็มบวก" |
| 2 | `updateCandidate` ส่ง `title/firstName/lastName/imageUrl` ให้ `candidate.update` แต่ field เหล่านี้อยู่ในตาราง `User` — Prisma ปฏิเสธด้วย `Unknown argument 'firstName'` **แก้ชื่อผู้สมัครผ่าน API ไม่ได้เลย** | spy ที่ `candidateRepo.update` | แยก field ไป `userRepo.update(candidate.userId, …)` และจำกัด type ของ `candidateRepo.update` ให้ compiler ฟ้องถ้าส่ง field ผิดตาราง | Validation — กรรมการแก้ชื่อผู้สมัครที่สะกดผิดไม่ได้ |
| 3 | `updateCandidate` เปลี่ยนไปพรรคที่มีผู้สมัครในเขตอยู่แล้วได้ ไปชน `@@unique([constituencyId, partyId])` ใน DB ได้ error ของ Prisma ดิบ ๆ | mock (`update` ต้องไม่ถูกเรียก) | ตรวจด้วย `findByConstituency` ก่อน ได้ข้อความภาษาไทย | Verification — กฎ "พรรคละ 1 คนต่อเขต" ต้องอยู่ใน service ไม่ใช่รอ DB ล้ม |
| 4 | `updateCandidate` มี boundary bug เดียวกับข้อ 1 และข้าม `0` ไปเงียบ ๆ (`data.candidateNumber && …`) | boundary value | ใช้การตรวจเดียวกับ `addCandidate` | Verification |

### สิ่งที่คงเดิม

- โครงสร้าง layer: route → controller → service → repository → Prisma
- กฎทางธุรกิจเดิมทั้งหมดของ `addCandidate` (ผู้ใช้ต้องอยู่ในเขต, เป็นผู้สมัครได้ครั้งเดียว, หมายเลขไม่ซ้ำในเขต, พรรค/เขตต้องมีอยู่) — มีเทสต์ยืนยันว่ายังทำงานเหมือนเดิม
- API (path, request, response) ไม่เปลี่ยน — frontend ไม่ต้องแก้
- `tsconfig.json`, schema และ migration ไม่เปลี่ยน

### ข้อสังเกตที่ยังไม่ได้แก้ (นอกขอบเขต unit test)

- **ไม่มี dependency injection** — service import repository ตรง ๆ จึงต้องใช้ `jest.mock` ทั้ง module ถ้า refactor ให้รับ repository ผ่าน constructor จะเสียบ double ได้ตรง ๆ และไม่ต้อง mock `upload.service`
- **อัปเดต `User` กับ `Candidate` ยังไม่อยู่ใน transaction เดียว** — ถ้าขั้นที่สองล้ม ชื่อจะถูกแก้ไปแล้ว ควรใช้ `prisma.$transaction`
- **ลบผู้สมัครที่มีคะแนนแล้ว** จะติด foreign key ของ `Vote` — ต้องทดสอบกับ DB จริง (integration test)
- **ทุก error เป็น `Error` ธรรมดา** controller ตอบ `400` ทุกกรณี ทั้งที่ "ไม่พบ" ควรเป็น `404` และ "ซ้ำ" ควรเป็น `409`
- **เพิ่ม/แก้/ลบผู้สมัครได้แม้เขตปิดหีบแล้ว** (`isClosed`) — ต้องถามผู้ใช้ (กกต.) ก่อนว่าควรห้ามหรือไม่ (Validation)

### ประวัติการทำงาน (ดูด้วย `git log --oneline origin/election/original^..origin/test/candidate`)

```
2fc3d87  นำโค้ด backend เดิมมาไว้ใน election-app/   ← election/original
000b267  ติดตั้ง Jest + ts-jest + faker
79e5b08  builder ด้วย faker และเทสต์แรก (happy path + stub)
3b354ae  เทสต์กรณีล้มเหลว (failure + mock)
0721b67  เทสต์ spy และ faker (ครบข้อ 2.3)
385e09a  เทสต์ boundary เจอ bug ค่าติดลบและทศนิยม (it.failing)
b1a50ab  แก้ bug addCandidate → it.failing เปลี่ยนเป็น it
04f20bd  เทสต์ updateCandidate / deleteCandidate เจอ bug เพิ่ม 3 ตัว
a0319c4  แก้ bug 3 ตัวของ updateCandidate
770228d  README วิธีรันเทสต์ ตารางข้อ 2.3 ทฤษฎี และเปรียบเทียบ V&V
```
