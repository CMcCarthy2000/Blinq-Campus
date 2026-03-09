# Blinq Campus

#### Pre demo

## Description

This is the web client for Blinq Campus, `REPLACE_ME_WITH_URL`.

## Quick Start

### Get Blinq Campus up and running locally.

```
git clone --recursive https://github.com/CMcCarthy2000/Blinq-Campus/
git submodule init
git submodule update
cd Blinq-Campus
yarn
yarn build:deps
yarn dev --port 14701
```

To get the client fully working look though this
https://github.com/stoatchat/self-hosted it contains the info needed to setup the backend parts of the program
You can now access the client at `REPLACE_ME_WITH_URL`.

## Deploying a new release

Ensure `.env.local` points to `REPLACE_ME_WITH_URL`.

```bash
cd ~/deployments/revite
git pull
git submodule update

# check:
git status

export REVOLT_SAAS_BRANCH=revite/main
export REMOTE=root@production
scripts/publish.sh

# SSH in and restart Blinq Campus:
ssh $REMOTE
tmux a -t 4
```

## CLI Commands

| Command                                 | Description                                  |
| --------------------------------------- | -------------------------------------------- |
| `yarn pull`                             | Setup assets required for Blinq Campus.         |
| `yarn dev`                              | Start the chat client in development mode.   |
| `yarn build`                            | Build the chat client.                       |
| `yarn build:deps`                       | Build external dependencies.                 |
| `yarn preview`                          | Start a local server with the built client.  |
| `yarn lint`                             | Run ESLint on the client.                    |
| `yarn fmt`                              | Run Prettier on the client.                  |
| `yarn typecheck`                        | Run TypeScript type checking on the client.  |
| `yarn start`                            | Start a local sirv server with built client. |
| `yarn start:inject`                     | Inject a given API URL and start server.     |
| `yarn lint \| egrep "no-literals" -B 1` | Scan for untranslated strings.               |

## Pending Rewrite

The following code is pending a partial or full rewrite:

-   `src/components`: components are being migrated to [revoltchat/components](https://github.com/revoltchat/components)
-   `src/styles`: needs to be migrated to [revoltchat/components](https://github.com/revoltchat/components)
-   `src/lib`: this needs to be organised

## Stack

-   [Preact](https://preactjs.com/)
-   [Vite](https://vitejs.dev/)

## License

Blinq Campus is licensed under the [GNU Affero General Public License v3.0](https://github.com/CMcCarthy2000/WGSD-chat/blob/master/LICENSE).
