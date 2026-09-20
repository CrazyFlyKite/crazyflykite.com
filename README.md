# [crazyflykite.com](https://crazyflykite.com)

## Introduction

**[crazyflykite.com](https://crazyflykite.com)** is my personal website.

Version changelog can be found in [`CHANGELOG.md`](CHANGELOG.md)

## File Structure

- [`index.js`](index.js) - Main entry point
- [`database/`](database) - Database connection and queries
- [`services/`](services) - Assembling and formatting the data
- [`utils/format.js`](utils/format.js) - Helper functions (e.g., properly format certain chunks of data)
- [`routes/api.js`](routes/api.js) - API router which handles database queries
- [`public/`](public) - Frontend

## .env

This project requires an `.env` file which looks like this:

```dotenv
MYSQL_USER=???
MYSQL_PASSWORD=???
SERVER_IP=???.???.?.??
PORT=????

THUMBNAIL_PATH=/thumbnails
```

## Contact

- **[My Website](https://crazyflykite.com)**
- **[Discord](https://discord.com/users/873920068571000833)**
- **[GitHub](https://github.com/CrazyFlyKite)**
- **[Email](mailto:karpenkoartem2846@gmail.com)**
