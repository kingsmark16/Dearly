import { notFound } from 'next/navigation'
import axios from 'axios'
import { getPublishedLetter } from '../../../src/lib/api'
import { LetterViewer } from '../../../src/components/letter-viewer'

type LetterPageProps = {
  params: Promise<{ slug: string }>
}

export default async function LetterPage({ params }: LetterPageProps) {
  const { slug } = await params

  const letter = await getPublishedLetter(slug).catch((error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      notFound()
    }

    throw error
  })

  return <LetterViewer letter={letter} />
}
