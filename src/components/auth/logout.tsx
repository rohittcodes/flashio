import { signOut } from "@/lib/auth"
import { Button } from "../ui/button"
 
/**
 * Renders a form with a logout button that signs the user out when submitted.
 *
 * @returns A React element containing a form with a logout button.
 */
export default function Logout() {
  return (
    <form
      action={async () => {
            "use server"
            await signOut()
      }}
    >
      <Button type="submit">Logout</Button>
    </form>
  )
} 