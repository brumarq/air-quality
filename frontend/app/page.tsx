import { LUXEMBOURG_AREA } from "@/domain/communes"
import { CommuneMap } from "@/app/_components/commune-map"

export default function Home() {
  return <CommuneMap communeConfig={LUXEMBOURG_AREA} />
}
