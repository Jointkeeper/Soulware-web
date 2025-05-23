# Soulware Web Application

Soulware is a web platform designed for psychological self-discovery and personal development. It offers a variety of tests, personalized recommendations, and AI-driven insights to help users explore their personality, understand their strengths, and identify areas for growth. The platform integrates with Supabase for backend services, Stripe for subscriptions, and OpenAI for AI-powered features like avatar generation.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js (v18.x or later recommended)
*   npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd Soulware-web 
    ```

2.  **Install dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using yarn:
    ```bash
    yarn install
    ```

3.  **Set up environment variables:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env.local
        ```
    *   Populate `.env.local` with your actual credentials and settings. Refer to `.env.example` for the list of required variables.
        Key variables include:
        *   Supabase URL and Anon Key
        *   Stripe Secret Key, Publishable Key, Webhook Secret, and Price IDs
        *   OpenAI API Key
        *   Application URL (`NEXT_PUBLIC_APP_URL`)

### Running the Development Server

```bash
npm run dev
```
Or
```bash
yarn dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

A full list of required and optional environment variables can be found in the `.env.example` file. Make sure to create a `.env.local` file by copying `.env.example` and filling in the necessary values before running the application.

## Testing Stripe Payments Locally

To test Stripe webhooks and payment flows locally, you'll need the Stripe CLI.

1.  **Install the Stripe CLI:**
    Follow the instructions on the [official Stripe CLI documentation](https://stripe.com/docs/stripe-cli).

2.  **Log in to your Stripe account:**
    ```bash
    stripe login
    ```

3.  **Forward webhook events to your local development server:**
    Your application's Stripe webhook handler is located at `/api/webhooks/stripe`.
    When your development server is running (e.g., on `http://localhost:3000`), run the following command in a new terminal:
    ```bash
    stripe listen --forward-to localhost:3000/api/webhooks/stripe
    ```
    This command will provide you with a webhook secret (e.g., `whsec_...`). **Use this CLI-generated webhook secret for your `STRIPE_WEBHOOK_SECRET` environment variable in your `.env.local` file for local testing.** Do not use your production webhook secret locally.

    Now, any Stripe events triggered by your actions in test mode (e.g., completing a checkout, managing a subscription) will be forwarded to your local webhook handler.

## Key Scripts

*   `npm run dev`: Starts the Next.js development server.
*   `npm run build`: Builds the application for production.
*   `npm run start`: Starts a Next.js production server (requires a prior build).
*   `npm run lint`: Lints the codebase using ESLint based on Next.js's recommended configuration.
*   `npm run type-check`: Performs a TypeScript type check across the project without emitting files.
*   `npm run env:check`: Checks if all required environment variables (defined in `.env.example`) are set in the current environment (typically loaded from `.env.local`). Uses `dotenv-cli` and a custom `ts-node` script.
*   `npm test` or `npm run test`: Runs all unit and integration tests using Vitest.
*   `npm run test:ui`: Runs Vitest in UI mode for an interactive test runner experience.
*   `npm run coverage`: Runs all tests and generates a code coverage report (output in `./coverage/`).
*   `npm run test:ci`: Runs tests with coverage and enforces coverage thresholds (lines, branches, functions, statements at 80%). This script is intended for use in CI environments.

## Project Structure (Overview)

*   `src/app/`: App Router pages and layouts (Next.js 13+)
*   `src/pages/`: Pages Router API routes and potentially older pages
*   `src/components/`: React components (UI, features)
*   `src/hooks/`: Custom React hooks
*   `src/lib/`: Utility functions, client configurations (Supabase, Stripe, i18n, logger)
*   `src/context/`: React context providers
*   `src/types/`: TypeScript type definitions and Zod schemas
*   `public/`: Static assets, including locales for i18n 

## Database Migrations

This project uses Supabase for its database. Database schema changes are managed via migration files located in the `supabase/migrations` directory.

### Applying Migrations

To apply new migrations to your local Supabase instance (if you are running one via Supabase CLI and Docker, or developing against a cloud instance with appropriate permissions):

1.  **Ensure you have the Supabase CLI installed and configured.** See [Supabase CLI documentation](https://supabase.com/docs/guides/cli).

2.  **Link your local project to your Supabase project (if not already done for local development with the CLI):
    ```bash
    supabase link --project-ref <your-project-ref>
    ```

3.  **Apply new migrations:**
    To apply all pending local migrations to your linked Supabase project (local or remote):
    ```bash
    supabase db push
    ```
    If you are developing locally with the Supabase CLI and have started your local Supabase stack (`supabase start`), migrations in the `supabase/migrations` folder are typically applied automatically upon creation or when the stack starts. However, `supabase db push` can be used to ensure any pending migrations are applied, especially when pulling changes that include new migration files.

### Creating New Migrations

When making schema changes during development (if using the Supabase CLI for local development):

1.  Make your schema changes directly in your local Supabase database (e.g., via Supabase Studio UI or SQL commands).
2.  Generate a new migration file:
    ```bash
    supabase migration new <migration_name>
    ```
    Replace `<migration_name>` with a descriptive name for your migration (e.g., `create_users_table`, `add_email_to_profiles`).
    This command will diff your local database schema against the last known schema and create a new SQL migration file in `supabase/migrations`.

Alternatively, you can write SQL migration scripts manually and place them in the `supabase/migrations` directory, following the naming convention `<timestamp>_<description>.sql` (e.g., `20240524_nullable_valid_until.sql`). 