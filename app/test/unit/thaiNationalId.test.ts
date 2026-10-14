import { isValidThaiNationalId } from '../../src/domain/thaiNationalId';

describe('isValidThaiNationalId', () => {
  it.each(['1509900000017', '1100000000016'])('accepts id "%s" whose last digit matches the checksum', (id) => {
    const valid = isValidThaiNationalId(id);

    expect(valid).toBe(true);
  });

  it('rejects an id with a wrong checksum digit', () => {
    const id = '1509900000018';

    const valid = isValidThaiNationalId(id);

    expect(valid).toBe(false);
  });

  it.each(['', '150990000001', '15099000000170', '150990000001x', 'abcdefghijklm'])(
    'rejects malformed id "%s"',
    (id) => {
      const valid = isValidThaiNationalId(id);

      expect(valid).toBe(false);
    },
  );
});
