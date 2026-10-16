/** Credentials published on the SauceDemo login page. Password can be overridden via SAUCE_PASSWORD. */
export interface Credentials {
  readonly username: string;
  readonly password: string;
}

const PASSWORD = process.env.SAUCE_PASSWORD ?? 'secret_sauce';

export const users = {
  standard: { username: 'standard_user', password: PASSWORD },
  lockedOut: { username: 'locked_out_user', password: PASSWORD },
  problem: { username: 'problem_user', password: PASSWORD },
  wrongPassword: { username: 'standard_user', password: 'not_the_password' },
} as const satisfies Record<string, Credentials>;

export type UserKey = keyof typeof users;
