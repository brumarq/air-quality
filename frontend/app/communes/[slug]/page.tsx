import { notFound } from "next/navigation"
import { findCommune } from "@/content/communes"
import { CommuneMap } from "@/app/_components/commune-map"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function CommunePage({ params }: PageProps) {
  const { slug } = await params
  const commune = findCommune(slug)
  if (!commune) notFound()
  return <CommuneMap area={commune} />
}
