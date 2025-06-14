import { signIn } from "@/lib/auth"
import { Button } from "../ui/button"

/**
 * Renders a login form that initiates GitHub authentication using a server action.
 *
 * When the form is submitted, it triggers a server-side sign-in process via GitHub.
 */
export default function Login() {
    return (
        <form action={async () => {
            "use server"
            await signIn("github")
        }}>
            <Button type="submit">Login</Button>
        </form>
    )
}