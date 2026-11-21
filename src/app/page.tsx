import { BottomNav } from "@/components/BottomNav";
import { SkyView } from "@/components/SkyView";
import { DEMO_DAYS, onThisDay, TODAY } from "@/data/demo-days";

export default function SkyPage() {
  return (
    <>
      <main className="flex-1">
        <SkyView days={DEMO_DAYS} year={Number(TODAY.slice(0, 4))} today={TODAY} onThisDay={onThisDay(TODAY)} />
      </main>
      <BottomNav />
    </>
  );
}
