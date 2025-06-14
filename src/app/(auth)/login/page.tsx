import Login from "@/components/auth/login";

/**
 * Renders a full-page login screen centered both vertically and horizontally.
 *
 * Displays the {@link Login} component within a flex container that occupies the entire viewport.
 */
export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <Login />
        </div>
    )
}