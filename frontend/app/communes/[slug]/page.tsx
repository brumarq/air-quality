import { getCommuneBySlug } from "@/data/communes"
import { CommuneMap } from "@/components/communes/commune-map"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function CommunePage({ params }: PageProps) {
  const { slug } = await params

  const communeConfig = getCommuneBySlug(slug)

  if (!communeConfig) {
    notFound()
  }

  return <CommuneMap communeConfig={communeConfig} />
}
