import { auth } from "@/lib/auth";
import Logout from "@/components/auth/logout";
import { redirect } from "next/navigation";

/**
 * Renders the home page for authenticated users, redirecting unauthenticated users to the login page.
 *
 * @returns The home page content for authenticated users.
 */
export default async function HomePage() {
    const session = await auth()
    if (!session) {
        redirect("/login")
    }
    return (
        <div>
            <Logout />
            <h1>Home</h1>
        </div>
    )
}