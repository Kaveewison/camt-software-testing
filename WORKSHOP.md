# Software Testing in Real Industry

**Hands-on automated testing workshop & readiness checklist**

Workshop 2 วัน · CMU CAMT · ส.–อา. 3–4 ตุลาคม 2026 · 09:00–16:30

ฝึกเขียน automated test แบบที่ทีมจริงใช้ บน **ระบบเลือกตั้ง** ฉบับย่อ (Express + TypeScript + PostgreSQL + Liquibase)
ตั้งแต่ unit test ไปจนถึง CI, outside-in และการเอา legacy code เข้า test — แล้วนำไปใช้กับโปรเจกต์ของตัวเอง

## เริ่มที่นี่

1. **ก่อนมา workshop** — ทำตาม [setup/README.md](setup/README.md) จน `npm run doctor` ขึ้น ✅ READY
   แล้วส่ง screenshot + test cases ภายใน **พฤ. 1 ต.ค. 2026**
2. **ระหว่าง workshop** — รายการ lab และวิธีสลับ branch อยู่ที่ [labs/README.md](labs/README.md)
3. **ประเมินโปรเจกต์ตัวเอง** — [checklist/README.md](checklist/README.md) (รอบ 1 เช้า Day 1 · รอบ 2 ท้าย Day 2)

## Branches

```text
main                      ระบบอ้างอิง + test infra + CI (+ slides, facilitator guide)
jest/lab/NN-name          จุดเริ่มต้นของ lab NN — โจทย์อยู่ที่ labs/NN-name/README.md
jest/solution/NN-name     เฉลย lab NN = จุดเริ่มต้นของ lab NN+1
demo/testcontainers       demo: integration test บน Testcontainers
demo/playwright-browser   demo: Playwright ผ่าน browser
```

ตามไม่ทันไม่เป็นไร — ทุก lab เริ่มจากเฉลยของ lab ก่อนหน้า:

```bash
git stash -u                         # เก็บงานตัวเอง (-u = รวมไฟล์ใหม่ด้วย)
git switch jest/lab/06-outside-in    # ไป lab ถัดไปได้ทันที
```

## โครงสร้าง repo

| | |
|---|---|
| [`app/`](app/) | ระบบเลือกตั้ง + test ทั้งหมด (`test/unit`, `test/integration`, `e2e/`) และ Liquibase changelog (`db/`) — รายละเอียดใน [app/README.md](app/README.md) |
| [`labs/`](labs/) | โจทย์ของแต่ละ lab |
| [`checklist/`](checklist/) | Readiness Checklist สำหรับโปรเจกต์ของตัวเอง |
| [`setup/`](setup/) | สิ่งที่ต้องทำก่อนมา workshop |
| `.github/workflows/ci.yml` · `.gitlab-ci.yml` · `Jenkinsfile` | pipeline เดียวกันบน 3 CI |
| `slides/` · `facilitator/` | สไลด์ (Marp) และคู่มือผู้สอน — อยู่บน `main` เท่านั้น |

## คำสั่งที่ใช้บ่อย

รันในโฟลเดอร์ `app/` (ต้องเปิด Docker ไว้ ยกเว้น `test:unit`)

```bash
npm run doctor            # ตรวจความพร้อมของเครื่อง
npm run test:unit         # unit test — ไม่มี I/O
npm run test:integration  # เปิด test DB (port 5433) + migrate แล้วรัน component test
npm run test:e2e          # build app container แล้วรัน Playwright API test
npm run db:reset:test     # สร้าง test DB ใหม่ทั้งก้อน
```

## Workshop นี้อิงจาก

- Toby Clemson — [*Testing Strategies in a Microservice Architecture*](https://martinfowler.com/articles/microservice-testing/) (martinfowler.com)
- Gerard Meszaros — [*xUnit Test Patterns: Refactoring Test Code*](http://xunitpatterns.com/)
- Steve Freeman & Nat Pryce — [*Growing Object-Oriented Software, Guided by Tests*](https://growing-object-oriented-software.com/)
- Michael Feathers — [*Working Effectively with Legacy Code*](https://www.informit.com/store/working-effectively-with-legacy-code-9780131177055)
