# Project Webcrafters

## Overview
Project Webcrafters is a Next.js 15 and React 19-based web development setup designed with best practices in mind. It includes Tailwind CSS for styling, ESLint and Prettier for code quality, Husky for Git hooks, and ShadCN for UI components.

## Features
- **[Next.js 15](https://nextjs.org/)**: The latest version of the Next.js framework for optimized performance.
- **[React 19](https://react.dev/)**: Uses the latest React version.
- **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework for rapid UI development.
- **[ShadCN](https://ui.shadcn.com/)**: A collection of beautifully designed UI components.
- **[ESLint](https://eslint.org/)**: Linting support for better code consistency.
- **[Prettier](https://prettier.io/)**: Automatic code formatting.
- **[Husky](https://typicode.github.io/husky/)**: Ensures Git hooks are applied for pre-commit checks.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (Recommended: latest LTS version)
- [Yarn](https://yarnpkg.com/)

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/project-webcrafters.git
   cd project-webcrafters
   ```
2. Install dependencies:
   ```sh
   yarn install
   ```

### Development Server
To start the development server:
```sh
yarn dev
```
This will start the Next.js development server at [http://localhost:3000/](http://localhost:3000/).

### Building for Production
To build the project for production:
```sh
yarn build
```
After building, start the production server:
```sh
yarn start
```

### Linting and Formatting
- **Lint the code:**
  ```sh
  yarn lint
  ```
- **Format the code:**
  ```sh
  yarn format
  ```
- **Check for formatting issues:**
  ```sh
  yarn format:check
  ```

### Git Hooks with Husky
Husky ensures that linting and formatting rules are followed before committing code.
- Install Husky:
  ```sh
  yarn prepare
  ```
- Husky and `lint-staged` automatically format files before committing.

## Additional Notes
- This project uses [`clsx`](https://github.com/lukeed/clsx) and [`tailwind-merge`](https://github.com/dcastil/tailwind-merge) for efficient class management in Tailwind CSS.
- [`lucide-react`](https://lucide.dev/) is included for beautiful and lightweight icons.
- [`ShadCN`](https://ui.shadcn.com/) provides modern and customizable UI components.
- All scripts are managed via `package.json`, ensuring a streamlined development experience.

## Contributing
Feel free to contribute by submitting issues or pull requests.

## License
MIT License