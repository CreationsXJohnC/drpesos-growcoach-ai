import CalendarClient from "@/app/calendar/calendar-client";
import { DEMO_CALENDAR } from "@/lib/demo-data";

export const metadata = {
  title: "Live Demo — Dr. Pesos Grow Coach AI",
  description:
    "See a full 14-week personalized grow calendar and live AI chat with Dr. Pesos. No sign-up required.",
};

export default function DemoPage() {
  return (
    <CalendarClient
      calendar={DEMO_CALENDAR}
      initialCompleted={[]}
      isDemo
    />
  );
}
