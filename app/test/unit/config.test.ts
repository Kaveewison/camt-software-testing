import { loadConfig } from '../../src/config';

describe('loadConfig', () => {
  describe('when no environment variables are set', () => {
    it('uses port 3000', () => {
      const config = loadConfig({});

      expect(config.port).toBe(3000);
    });

    it('uses the local election_dev database', () => {
      const config = loadConfig({});

      expect(config.databaseUrl).toBe('postgres://election:election@localhost:5432/election_dev');
    });

    it('uses the dev JWT secret', () => {
      const config = loadConfig({});

      expect(config.jwtSecret).toBe('dev-secret');
    });
  });

  describe('when environment variables are set', () => {
    it('reads PORT as a number', () => {
      const env = { PORT: '8080' };

      const config = loadConfig(env);

      expect(config.port).toBe(8080);
    });

    it('reads DATABASE_URL', () => {
      const env = { DATABASE_URL: 'postgres://user:pass@db:5432/election_test' };

      const config = loadConfig(env);

      expect(config.databaseUrl).toBe('postgres://user:pass@db:5432/election_test');
    });

    it('reads JWT_SECRET', () => {
      const env = { JWT_SECRET: 'top-secret' };

      const config = loadConfig(env);

      expect(config.jwtSecret).toBe('top-secret');
    });
  });
});
