import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trip Quiz',
  description: 'Take our quick quiz to find your perfect travel destination. Answer 5 simple questions and get personalized trip recommendations.',
}

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
