<div align="center"><img src="https://assets.dmnktoe.de/radio-rasclat/logo/logo.svg" width="140"></div>

# Radio Rasclat Server

<p>
<img src="https://img.shields.io/github/package-json/v/RadioRasclat/radio-rasclat-server.svg?color=%237d29cc">
</p>

## Configuration

Set the following environment variables

| Variable | Default | Notes                          |
| -------- | ------- | ------------------------------ |
| `PORT`   | `8080`  | The port the server listens on |

## Development

### Branches

<!-- prettier-ignore -->
| Branch    | Tests | Code Coverage | Comments                  |
| --------- | ----- | ------------- | ------------------------- |
| `master`  | ![Build](https://github.com/RadioRasclat/radio-rasclat-server/workflows/Build/badge.svg) | [![codecov](https://codecov.io/gh/RadioRasclat/radio-rasclat-server/branch/master/graph/badge.svg?token=lcRoBB399S)](https://codecov.io/gh/RadioRasclat/radio-rasclat-server) | Latest Production Release |

### Prerequisites

- [NodeJS](htps://nodejs.org), version 12.13.0 (LTS) or better. (I use [`nvm`](https://github.com/creationix/nvm) to manage Node versions — `brew install nvm`.)

### To build and run locally

Clone this (or better yet, fork it then clone your fork)

```sh
npm install
npm start
```

Go to [localhost:8080/api-docs](http://127.0.0.1:8080/api-docs) to see the docs.

### `.env` file

You can put environment variables in a `.env` file.

### API Documentation

Documentation for the latest current release is at <https://api.radio-rasclat.com/api-docs>.

### Testing

- `npm run test` to run the unit tests

## Licences

<a href="https://app.fossa.com/projects/git%2Bgithub.com%2Fdmnktoe%2Fradio-rasclat-server?ref=badge_large" alt="FOSSA Status"><img src="https://app.fossa.com/api/projects/git%2Bgithub.com%2Fdmnktoe%2Fradio-rasclat-server.svg?type=large"/></a>
