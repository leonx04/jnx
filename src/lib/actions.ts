import { database } from "@/lib/firebaseConfig"
import { push, ref, serverTimestamp } from "firebase/database"

export async function createNotification(message: string) {
    const notificationsRef = ref(database, 'notifications')
    await push(notificationsRef, {
        message,
        createdAt: serverTimestamp(),
        seen: false
    })
}

