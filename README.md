# @ddz/root

This repo contains the code for the `@ddz/*` project that brings amazing Chinese card games like Dou Di Zhu (斗地主) to the web. It's comprised of two core parts:

- `@ddz/app` - A web application to play games with friends in a pass-the-phone style format or (soon) online via RTC (no sign-up, or middlemen to deal with!)
- `@ddz/core` - A TS-based library implementing the game logic, score tracking and move validation necessary to play DDZ

## Developer quick start

Ensure you're using the correct versions of node (specified in `.nvmrc`) and `pnpm` (specified in `package.json`) as this is a pnpm monorepo. The most common workflows are available as `package.json` scripts in the root module. These are:

- `pnpm dev` - Runs a build job of `@ddz/core` in watch mode and starts the dev server of `@ddz/app`
- `pnpm build` - Builds everything ready for deployment/publishing
- `pnpm lint` - Lints all submodules
- `pnpm test` - Tests all submodules. In CI this will run the tests once and return its status via an exit code. Locally, this will run the tests in watch mode via vitest.

### Contribution

Note that is repository is heavily WIP so issues/PRs may not be prioritised right now but they are always welcome.
