
import { Link } from "react-router-dom";

export default function Forbidden() {
    return (
        <main className="container-page flex min-h-[70vh] items-center justify-center py-12">
            <section className="card w-full max-w-lg p-8 text-center">
                <p className="text-sm font-semibold uppercase tracking-wider text-red-600">
                    Access denied
                </p>

                <h1 className="mt-3 text-4xl font-bold text-primary-800">
                    403
                </h1>

                <h2 className="mt-2 text-xl font-semibold text-primary-800">
                    You do not have permission
                </h2>

                <p className="mt-3 text-sm text-neutral-500">
                    Your current account does not have access to this page.
                </p>

                <Link to="/" className="btn-primary mt-6 inline-flex">
                    Back to Home
                </Link>
            </section>
        </main>
    );
}
