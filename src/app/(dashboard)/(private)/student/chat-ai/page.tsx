import { redirect } from 'next/navigation'

// Libs
import { getStudentById } from '@/libs/actions/students'
import { auth } from '@/libs/auth'

// Components
import ChatAi from '@/views/user/student/chat-ai'

export default async function StudentAiPage() {
  const session = await auth()

  const data = await getStudentById(Number(session?.user?.id))

  if (data.statusCode === 404) {
    redirect('/not-found')
  }

  return data ? <ChatAi studentData={data.result} /> : null
}
