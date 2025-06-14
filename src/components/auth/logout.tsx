import { signOut } from "@/lib/auth"
import { Button } from "../ui/button"
 
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