# ADR 0002: Centralized Logger and Toast Notification System

**Status:** Accepted

**Context:**

*   The application lacked a centralized logging mechanism, with `console.log`, `console.error`, etc., calls scattered throughout the codebase. This made structured logging, log level management, and potential integration with external logging services difficult.
*   User feedback and error notifications were inconsistent or missing for key user actions (e.g., login, registration, data submission, errors from API calls).
*   A consistent and non-intrusive way to provide feedback to users was needed to improve UX.

**Decision Drivers:**

*   **Maintainability:** Centralize logging logic for easier updates and management.
*   **Developer Experience:** Provide a simple and consistent API for logging and user notifications.
*   **User Experience:** Offer clear, timely, and context-aware feedback to users.
*   **Debuggability:** Improve the quality and structure of logs for easier debugging, especially in production.

**Considered Options:**

1.  **Continue with `console.*` and manual toast implementations per component.**
    *   Pros: No new dependencies or setup.
    *   Cons: Inconsistent, error-prone, hard to manage log levels, verbose component logic for toasts.

2.  **Introduce a dedicated logging library (e.g., Pino, Winston) and a dedicated toast library (e.g., react-toastify, Sonner).**
    *   Pros: Feature-rich, highly configurable.
    *   Cons: Potentially larger bundle size, learning curve for multiple libraries, might be overkill for current needs if basic functionality suffices.

3.  **Implement a custom lightweight logger and a custom toast system using React Context.**
    *   Pros: Tailored to project needs, minimal overhead, good control over features and bundle size.
    *   Cons: Requires more initial implementation effort, may lack advanced features of dedicated libraries if not carefully designed.

**Decision:**

We decided to implement a **custom lightweight logger (`src/lib/logger.ts`) and a custom toast notification system (`src/context/ToastContext.tsx`, `src/components/ui/ToastContainer.tsx`, `src/components/ui/Toast.tsx`)** (Option 3).

*   **Logger Rationale:** A simple wrapper around `console.*` was sufficient for now, providing log levels (DEBUG, INFO, WARN, ERROR), basic context passing, and JSON formatting for production environments. This avoids adding a heavier logging library while still centralizing log calls.
*   **Toast System Rationale:** A React Context-based system provides a simple `useToasts()` hook to easily trigger toasts from any component or hook. This offers good integration with the Next.js app structure and allows for custom styling and behavior.

**Consequences:**

*   **Positive:**
    *   Centralized and consistent logging throughout the application.
    *   Standardized user notifications with a global toast system.
    *   Improved developer experience for handling logs and user feedback.
    *   Better UX due to clear and timely notifications.
    *   Log structure allows for easier filtering and analysis (especially JSON logs in production).
*   **Negative/Risks:**
    *   The custom logger is basic. If advanced features like log shipping, complex transports, or very high-performance logging are needed in the future, it might need to be replaced or significantly enhanced.
    *   The custom toast system, while effective, might not have all the features (e.g., animations, positional variations, promise handling) of mature libraries out-of-the-box. These would need to be added if required.
*   **Neutral/Notes:**
    *   The logger uses `process.env.NODE_ENV` to differentiate log formatting (text for dev, JSON for prod).
    *   The toast system relies on a `ToastProvider` in the root layout.

**Implementation Plan:**

*   [X] Create `src/lib/logger.ts` with `LogLevel` enum and `logger.debug/info/warn/error` methods.
*   [X] Replace `console.*` calls with `logger.*` calls.
*   [X] Create `src/context/ToastContext.tsx` with `ToastProvider` and `useToasts` hook.
*   [X] Create `src/components/ui/ToastContainer.tsx` to display toasts.
*   [X] Refactor/Create `src/components/ui/Toast.tsx` for individual toast appearance.
*   [X] Integrate `ToastProvider` into `src/app/layout.tsx`.
*   [X] Implement toast notifications in key areas (e.g., auth hooks, API call error handling). 