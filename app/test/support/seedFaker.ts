// Random but repeatable: every test starts faker from the same seed,
// so a test that fails because of its data fails the same way on every run.
import { faker, fakerTH } from '@faker-js/faker';

const SEED = 20261003;

beforeEach(() => {
  faker.seed(SEED);
  fakerTH.seed(SEED);
});
