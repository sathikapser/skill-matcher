import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="d-flex min-vh-100 align-items-center justify-content-center bg-light px-3">
      <div className="text-center" style={{ maxWidth: "28rem" }}>
        <h1 className="display-4 fw-bold">404</h1>
        <h2 className="h5 fw-semibold mt-3">Page not found</h2>
        <p className="sr-muted mt-2 small">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-4">
          <Link to="/" className="btn btn-primary btn-sm">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Root Error:", error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="d-flex min-vh-100 align-items-center justify-content-center bg-light px-3">
      <div className="text-center" style={{ maxWidth: "28rem" }}>
        <h1 className="h5 fw-semibold">This page didn't load</h1>
        <p className="sr-muted mt-2 small">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-4 d-flex justify-content-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn btn-primary btn-sm"
          >
            Try again
          </button>
          <Link to="/" className="btn btn-outline-secondary btn-sm">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
